import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const profileId = process.env.QA_DELETE_PROFILE_ID;
const profileToken = process.env.QA_DELETE_PROFILE_TOKEN;
const otherToken = process.env.QA_SECOND_SESSION_TOKEN;
const coordinatorToken = process.env.QA_COORDINATOR_TOKEN;
const coordinatorId = process.env.QA_COORDINATOR_PROFILE_ID;
if (!base || !profileId || !profileToken || !otherToken || !coordinatorToken || !coordinatorId)
  throw new Error("Ambiente QA P0 cancellazione profilo incompleto");

const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
const bearer = (token) => ({ authorization: `Bearer ${token}` });
const jsonHeaders = (token) => ({ ...bearer(token), "content-type": "application/json" });
const owner = bearer(profileToken);
const coordinator = bearer(coordinatorToken);
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

assert.equal((await request(`/api/profiles/${profileId}`, { method: "DELETE" })).status, 403);
assert.equal((await request(`/api/profiles/${profileId}`, {
  method: "DELETE",
  headers: bearer(otherToken),
})).status, 403);
assert.equal((await request(`/api/profiles/${coordinatorId}`, {
  method: "DELETE",
  headers: coordinator,
})).status, 409, "l’ultimo coordinatore non deve poter eliminare il proprio profilo");

const disposableProfileForm = new FormData();
disposableProfileForm.set("name", "Profilo coordinatore");
const disposableProfileResponse = await request("/api/profiles", {
  method: "POST",
  headers: coordinator,
  body: disposableProfileForm,
});
assert.equal(disposableProfileResponse.status, 201);
const disposableProfile = await disposableProfileResponse.json();
assert.equal((await request(`/api/profiles/${disposableProfile.id}`, {
  method: "DELETE",
  headers: coordinator,
})).status, 200);
assert.ok(!(await (await request("/api/state")).json()).profiles.some((profile) => profile.id === disposableProfile.id));

const concurrentProfileForm = new FormData();
concurrentProfileForm.set("name", "Profilo eliminazione concorrente");
const concurrentProfileResponse = await request("/api/profiles", {
  method: "POST",
  headers: coordinator,
  body: concurrentProfileForm,
});
assert.equal(concurrentProfileResponse.status, 201);
const concurrentProfile = await concurrentProfileResponse.json();
const concurrentDeletes = await Promise.all([
  request(`/api/profiles/${concurrentProfile.id}`, { method: "DELETE", headers: coordinator }),
  request(`/api/profiles/${concurrentProfile.id}`, { method: "DELETE", headers: coordinator }),
]);
assert.deepEqual(concurrentDeletes.map((response) => response.status).sort(), [200, 404]);
assert.ok(!(await (await request("/api/state")).json()).profiles.some((profile) => profile.id === concurrentProfile.id));

const inviteResponse = await request("/api/auth/invites", {
  method: "POST",
  headers: jsonHeaders(coordinatorToken),
  body: JSON.stringify({ profile_id: profileId }),
});
assert.equal(inviteResponse.status, 201);
const pendingInvite = await inviteResponse.json();
assert.ok(pendingInvite.invite_token);

const profileForm = new FormData();
profileForm.set("name", "Da eliminare");
profileForm.set("surname", "Locale");
profileForm.set("role", "traveler");
profileForm.set("avatar", new Blob([png], { type: "image/png" }), "avatar.png");
const profileUpdate = await request(`/api/profiles/${profileId}`, {
  method: "PUT",
  headers: owner,
  body: profileForm,
});
assert.equal(profileUpdate.status, 200);
const avatarUrl = (await profileUpdate.json()).avatar_url;
assert.ok(avatarUrl);

assert.equal((await request("/api/locations", {
  method: "POST",
  headers: jsonHeaders(profileToken),
  body: JSON.stringify({ profile_id: profileId, latitude: 28.6139, longitude: 77.209 }),
})).status, 200);
assert.equal((await request("/api/push/subscribe", {
  method: "POST",
  headers: jsonHeaders(profileToken),
  body: JSON.stringify({
    subscription: {
      endpoint: `https://push.example/delete-${crypto.randomUUID()}`,
      keys: { p256dh: "qa-delete-p256dh", auth: "qa-delete-auth" },
    },
  }),
})).status, 200);

const documentForm = new FormData();
documentForm.set("profile_id", profileId);
documentForm.set("doc_type", "passport");
documentForm.set("file", new Blob(["%PDF-1.4\n%%EOF"], { type: "application/pdf" }), "passaporto.pdf");
assert.equal((await request("/api/documents", {
  method: "POST",
  headers: { ...owner, "x-idempotency-key": crypto.randomUUID() },
  body: documentForm,
})).status, 200);
const privateBefore = await (await request("/api/private", { headers: coordinator })).json();
const document = privateBefore.documents.find((row) => row.profile_id === profileId && row.doc_type === "passport");
assert.ok(document?.file_key);
assert.equal((await request(`/api/media/${document.file_key}`, { method: "HEAD", headers: owner })).status, 200);

const postForm = new FormData();
postForm.set("visibility", "public");
postForm.set("day_index", "-1");
postForm.set("text", "Contenuto da eliminare con il profilo");
postForm.set("file", new Blob([png], { type: "image/png" }), "ricordo.png");
const postResponse = await request("/api/posts", {
  method: "POST",
  headers: { ...owner, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
  body: postForm,
});
assert.equal(postResponse.status, 201);
const post = await postResponse.json();
assert.ok(post.media[0]?.media_url);
assert.equal((await request(post.media[0].media_url, { method: "HEAD" })).status, 200);

const commentForm = new FormData();
commentForm.set("post_id", "india-welcome");
commentForm.set("text", "Commento da eliminare con il profilo");
const commentResponse = await request("/api/comments", {
  method: "POST",
  headers: { ...owner, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
  body: commentForm,
});
assert.equal(commentResponse.status, 201);
const comment = await commentResponse.json();
assert.equal((await request("/api/reactions", {
  method: "POST",
  headers: { ...jsonHeaders(profileToken), "x-idempotency-key": crypto.randomUUID() },
  body: JSON.stringify({ post_id: "india-welcome", kind: "heart" }),
})).status, 200);

const stateBefore = await (await request("/api/state", { headers: owner })).json();
assert.ok(stateBefore.profiles.some((profile) => profile.id === profileId));
assert.ok(stateBefore.posts.some((entry) => entry.id === post.id));
const welcomeBefore = stateBefore.posts.find((entry) => entry.id === "india-welcome");
assert.ok(welcomeBefore.comments.some((entry) => entry.id === comment.id));
assert.ok(welcomeBefore.reactions.some((entry) => entry.author_name === "Da eliminare Locale" && entry.kind === "heart"));

const deleteResponse = await request(`/api/profiles/${profileId}`, {
  method: "DELETE",
  headers: owner,
});
assert.equal(deleteResponse.status, 200);
const deleted = await deleteResponse.json();
assert.equal(deleted.profile_id, profileId);
assert.equal(deleted.session_revoked, true);
assert.equal(deleted.media_cleanup_failed, 0);

assert.equal((await request("/api/auth/session", { headers: owner })).status, 401);
assert.ok([403, 404].includes((await request("/api/auth/claim", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ invite_token: pendingInvite.invite_token }),
})).status));
const stateAfter = await (await request("/api/state")).json();
assert.ok(!stateAfter.profiles.some((profile) => profile.id === profileId));
assert.ok(!stateAfter.posts.some((entry) => entry.id === post.id));
const welcomeAfter = stateAfter.posts.find((entry) => entry.id === "india-welcome");
assert.ok(!welcomeAfter.comments.some((entry) => entry.id === comment.id));
assert.ok(!welcomeAfter.reactions.some((entry) => entry.author_name === "Da eliminare Locale"));
const privateAfter = await (await request("/api/private", { headers: coordinator })).json();
assert.ok(!privateAfter.documents.some((row) => row.profile_id === profileId));
assert.ok(!privateAfter.locations.some((row) => row.profile_id === profileId));
assert.notEqual((await request(`/api/media/${document.file_key}`, { method: "HEAD", headers: coordinator })).status, 200);
assert.equal((await request(post.media[0].media_url, { method: "HEAD" })).status, 404);
assert.equal((await request(avatarUrl, { method: "HEAD" })).status, 404);
assert.equal((await request(`/api/profiles/${profileId}`, { method: "DELETE", headers: coordinator })).status, 404);

console.log("P0_PROFILE_DELETION=44/44");
