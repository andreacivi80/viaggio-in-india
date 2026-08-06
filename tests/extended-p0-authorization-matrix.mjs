import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const ownerId = process.env.QA_PROFILE_ID;
const otherId = process.env.QA_SECOND_PROFILE_ID;
const unclaimedId = process.env.QA_UNCLAIMED_PROFILE_ID;
const groupCode = process.env.QA_GROUP_CODE;
const owner = { authorization: `Bearer ${process.env.QA_SESSION_TOKEN}` };
const other = { authorization: `Bearer ${process.env.QA_SECOND_SESSION_TOKEN}` };
const coordinator = { authorization: `Bearer ${process.env.QA_COORDINATOR_TOKEN}` };
if (!base || !ownerId || !otherId || !unclaimedId || !groupCode)
  throw new Error("Ambiente QA P0 matrice autorizzativa incompleto");

const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
let checks = 0;
const eq = (actual, expected, message) => { checks += 1; assert.equal(actual, expected, message); };
const ok = (condition, message) => { checks += 1; assert.ok(condition, message); };
const status = async (promise, expected, message) => eq((await promise).status, expected, message);
const jsonHeaders = (headers = {}) => ({ ...headers, "content-type": "application/json" });
const guestDeviceKey = "4".repeat(64);

const guestResponse = await request("/api/auth/guest", {
  method: "POST",
  headers: { "content-type": "application/json", "x-device-key": guestDeviceKey },
  body: JSON.stringify({ display_name: "Familiare matrice locale" }),
});
eq(guestResponse.status, 201);
const guestSession = await guestResponse.json();
const guest = { "x-guest-token": guestSession.token, "x-device-key": guestDeviceKey };

const createPost = async (headers, visibility, label) => {
  const form = new FormData();
  form.set("visibility", visibility);
  form.set("day_index", "-1");
  form.set("text", `Matrice ${label} ${crypto.randomUUID()}`);
  const response = await request("/api/posts", {
    method: "POST",
    headers: { ...headers, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
    body: form,
  });
  eq(response.status, 201, `creazione post ${visibility}`);
  return response.json();
};
const posts = {
  public: await createPost(owner, "public", "pubblico"),
  family: await createPost(owner, "family", "familiare"),
  group: await createPost(owner, "group", "gruppo"),
  private: await createPost(owner, "private", "privato"),
};
const matrixIds = new Set(Object.values(posts).map((post) => post.id));
const visibleMatrixPosts = async (headers = {}) => {
  const response = await request("/api/state", { headers });
  eq(response.status, 200);
  const state = await response.json();
  return state.posts.filter((post) => matrixIds.has(post.id));
};

eq((await visibleMatrixPosts()).length, 1, "il pubblico vede soltanto public");
eq((await visibleMatrixPosts(guest)).length, 2, "il familiare vede public e family");
eq((await visibleMatrixPosts({ "x-guest-token": guestSession.token })).length, 1, "senza chiave dispositivo la sessione familiare non viene accettata");
eq((await visibleMatrixPosts({ "x-guest-token": guestSession.token, "x-device-key": "5".repeat(64) })).length, 1, "con chiave di un altro telefono la sessione familiare non viene accettata");
eq((await visibleMatrixPosts(other)).length, 3, "un viaggiatore vede public, family e group");
eq((await visibleMatrixPosts(owner)).length, 4, "il proprietario vede anche il proprio private");
eq((await visibleMatrixPosts(coordinator)).length, 3, "il coordinatore non invade il private altrui");
const authenticatedState = await (await request("/api/state", { headers: owner })).json();
ok(authenticatedState.profiles.every((profile) => !("privacy_consent_at" in profile)));
ok(authenticatedState.profiles.every((profile) => !("privacy_consent_version" in profile)));

const emptyProfile = new FormData();
emptyProfile.set("name", "Vietato");
await status(request("/api/profiles", { method: "POST", body: emptyProfile }), 403);
await status(request("/api/posts", { method: "POST", body: new FormData() }), 403);
await status(request("/api/locations", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ profile_id: ownerId, latitude: 28, longitude: 77 }),
}), 401);
const publicDocument = new FormData();
publicDocument.set("profile_id", ownerId);
publicDocument.set("doc_type", "passport");
await status(request("/api/documents", { method: "POST", body: publicDocument }), 403);
await status(request("/api/auth/invites", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ profile_id: unclaimedId }),
}), 403);
await status(request("/api/auth/unlock", {
  method: "POST",
  headers: { "x-group-code": groupCode },
}), 403, "la password comune non impersona un profilo esistente");
await status(request("/api/private", { headers: guest }), 401);
await status(request("/api/private", { headers: { "x-group-code": groupCode } }), 401);
await status(request("/api/push/test", {
  method: "POST",
  headers: { "x-group-code": groupCode },
}), 403, "la password comune non invia notifiche operative");
await status(request("/api/push/test", { method: "POST", headers: owner }), 403);
await status(request("/api/push/test", { method: "POST", headers: coordinator }), 200);

const otherProfile = new FormData();
otherProfile.set("name", "Secondo");
otherProfile.set("role", "coordinator");
await status(request(`/api/profiles/${otherId}`, { method: "PUT", headers: owner, body: otherProfile }), 403);
await status(request(`/api/profiles/${otherId}`, { method: "DELETE", headers: owner }), 403);
await status(request("/api/auth/invites", {
  method: "POST",
  headers: jsonHeaders(owner),
  body: JSON.stringify({ profile_id: unclaimedId }),
}), 403);
await status(request("/api/locations", {
  method: "POST",
  headers: jsonHeaders(other),
  body: JSON.stringify({ profile_id: ownerId, latitude: 0, longitude: 0 }),
}), 403);
await status(request(`/api/posts/${posts.public.id}`, { method: "DELETE", headers: other }), 403);

const ownerDocument = new FormData();
ownerDocument.set("profile_id", ownerId);
ownerDocument.set("doc_type", "passport");
ownerDocument.set("file", new Blob(["%PDF-1.4\n%%EOF"], { type: "application/pdf" }), "matrice-passaporto.pdf");
await status(request("/api/documents", {
  method: "POST",
  headers: { ...owner, "x-idempotency-key": crypto.randomUUID() },
  body: ownerDocument,
}), 200);
const ownerPrivate = await (await request("/api/private", { headers: owner })).json();
const otherPrivate = await (await request("/api/private", { headers: other })).json();
const coordinatorPrivate = await (await request("/api/private", { headers: coordinator })).json();
const document = ownerPrivate.documents.find((item) => item.profile_id === ownerId && item.doc_type === "passport");
ok(document?.file_key, "il proprietario vede il proprio documento");
ok(!otherPrivate.documents.some((item) => item.profile_id === ownerId), "l’altro viaggiatore non vede il documento");
ok(coordinatorPrivate.documents.some((item) => item.profile_id === ownerId), "il coordinatore vede il documento");
await status(request(`/api/media/${document.file_key}`, { method: "HEAD" }), 403);
await status(request(`/api/media/${document.file_key}`, { method: "HEAD", headers: other }), 403);
await status(request(`/api/media/${document.file_key}`, { method: "HEAD", headers: owner }), 200);
await status(request(`/api/media/${document.file_key}`, { method: "HEAD", headers: coordinator }), 200);

const coordinatorReplacement = new FormData();
coordinatorReplacement.set("profile_id", ownerId);
coordinatorReplacement.set("doc_type", "passport");
coordinatorReplacement.set("file", new Blob(["%PDF-1.4\n%%EOF"], { type: "application/pdf" }), "sostituzione-vietata.pdf");
await status(request("/api/documents", {
  method: "POST",
  headers: { ...coordinator, "x-idempotency-key": crypto.randomUUID() },
  body: coordinatorReplacement,
}), 403, "il coordinatore non sostituisce il file altrui");
const verification = new FormData();
verification.set("profile_id", ownerId);
verification.set("doc_type", "passport");
verification.set("status", "verified");
verification.set("verified_by", "Coordinatore locale");
await status(request("/api/documents", {
  method: "POST",
  headers: { ...coordinator, "x-idempotency-key": crypto.randomUUID() },
  body: verification,
}), 200, "il coordinatore può soltanto verificare");

const familyComment = new FormData();
familyComment.set("post_id", posts.family.id);
familyComment.set("text", "Commento familiare autorizzato");
const familyCommentResponse = await request("/api/comments", {
  method: "POST",
  headers: { ...guest, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
  body: familyComment,
});
eq(familyCommentResponse.status, 201);
const familyCommentRow = await familyCommentResponse.json();
const groupComment = new FormData();
groupComment.set("post_id", posts.group.id);
groupComment.set("text", "Commento vietato");
await status(request("/api/comments", {
  method: "POST",
  headers: { ...guest, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
  body: groupComment,
}), 403);
const unidentifiedComment = new FormData();
unidentifiedComment.set("post_id", posts.public.id);
unidentifiedComment.set("text", "Nessuna identità");
await status(request("/api/comments", {
  method: "POST",
  headers: { "x-group-code": groupCode, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
  body: unidentifiedComment,
}), 401, "la password comune non sostituisce l’identità del commentatore");
await status(request("/api/reactions", {
  method: "POST",
  headers: { "content-type": "application/json", "x-group-code": groupCode, "x-idempotency-key": crypto.randomUUID() },
  body: JSON.stringify({ post_id: posts.public.id, kind: "heart" }),
}), 401, "la password comune non sostituisce l’identità della reazione");
await status(request(`/api/comments/${familyCommentRow.id}`, { method: "DELETE", headers: guest }), 200);

const createdProfileForm = new FormData();
createdProfileForm.set("name", "Profilo matrice temporaneo");
createdProfileForm.set("role", "traveler");
const createdProfileResponse = await request("/api/profiles", { method: "POST", headers: coordinator, body: createdProfileForm });
eq(createdProfileResponse.status, 201);
const createdProfile = await createdProfileResponse.json();
await status(request(`/api/profiles/${createdProfile.id}`, { method: "DELETE", headers: coordinator }), 200);

await status(request(`/api/documents/${ownerId}/passport`, { method: "DELETE", headers: owner }), 200);
for (const post of Object.values(posts))
  await status(request(`/api/posts/${post.id}`, { method: "DELETE", headers: owner }), 200);

console.log(`P0_AUTHORIZATION_MATRIX=${checks}/${checks}`);
process.exit(0);
