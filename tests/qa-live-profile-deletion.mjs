import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const groupCode = process.env.QA_GROUP_CODE;
const host = new URL(base).hostname;
if (!groupCode) throw new Error("QA_GROUP_CODE mancante");
if (host !== "viaggio-in-india-2026-qa.pages.dev" && !host.endsWith(".viaggio-in-india-2026-qa.pages.dev"))
  throw new Error("Protezione dati: questo test scrivente è consentito soltanto sul dominio QA");

const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
const suffix = crypto.randomUUID().slice(0, 8);
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
let profileId = "";
let token = "";

try {
  const register = await request("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json", "x-group-code": groupCode, "x-device-name": "QA eliminazione live" },
    body: JSON.stringify({ name: `Eliminazione QA ${suffix}`, role: "traveler", origin_city: "QA" }),
  });
  assert.equal(register.status, 201);
  const registered = await register.json();
  profileId = registered.profile.id;
  token = registered.token;
  const owner = { authorization: `Bearer ${token}` };
  const jsonHeaders = { ...owner, "content-type": "application/json" };

  assert.equal((await request("/api/locations", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ profile_id: profileId, latitude: 28.6139, longitude: 77.209 }),
  })).status, 200);
  assert.equal((await request("/api/push/subscribe", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({
      subscription: {
        endpoint: `https://push.example/live-delete-${suffix}`,
        keys: { p256dh: "qa-live-delete-p256dh", auth: "qa-live-delete-auth" },
      },
    }),
  })).status, 200);

  const documentForm = new FormData();
  documentForm.set("profile_id", profileId);
  documentForm.set("doc_type", "passport");
  documentForm.set("file", new Blob(["%PDF-1.4\n%%EOF"], { type: "application/pdf" }), "qa-passaporto.pdf");
  assert.equal((await request("/api/documents", {
    method: "POST",
    headers: { ...owner, "x-idempotency-key": crypto.randomUUID() },
    body: documentForm,
  })).status, 200);
  const privateState = await (await request("/api/private", { headers: owner })).json();
  const document = privateState.documents.find((row) => row.profile_id === profileId);
  assert.ok(document?.file_key);

  const postForm = new FormData();
  postForm.set("visibility", "public");
  postForm.set("text", `QA cancellazione profilo ${suffix}`);
  postForm.set("file", new Blob([png], { type: "image/png" }), "qa-ricordo.png");
  const postResponse = await request("/api/posts", {
    method: "POST",
    headers: { ...owner, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
    body: postForm,
  });
  assert.equal(postResponse.status, 201);
  const post = await postResponse.json();
  assert.ok(post.media[0]?.media_url);

  const before = await (await request("/api/state", { headers: owner })).json();
  assert.ok(before.profiles.some((profile) => profile.id === profileId));
  assert.ok(before.posts.some((entry) => entry.id === post.id));

  const deletedResponse = await request(`/api/profiles/${profileId}`, { method: "DELETE", headers: owner });
  assert.equal(deletedResponse.status, 200);
  const deleted = await deletedResponse.json();
  assert.equal(deleted.session_revoked, true);
  assert.equal(deleted.media_cleanup_failed, 0);
  assert.equal((await request("/api/auth/session", { headers: owner })).status, 401);

  const after = await (await request("/api/state")).json();
  assert.ok(!after.profiles.some((profile) => profile.id === profileId));
  assert.ok(!after.posts.some((entry) => entry.id === post.id));
  assert.notEqual((await request(`/api/media/${document.file_key}`, { method: "HEAD", headers: owner })).status, 200);
  assert.equal((await request(post.media[0].media_url, { method: "HEAD" })).status, 404);
  profileId = "";
  console.log("QA_LIVE_PROFILE_DELETION=17/17");
}
finally {
  if (profileId && token) {
    await request(`/api/profiles/${profileId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
}
