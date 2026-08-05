import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const headers = { authorization: `Bearer ${process.env.QA_SESSION_TOKEN}` };
const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
if (!base || !process.env.QA_SESSION_TOKEN) throw new Error("Ambiente QA chunk retry incompleto");

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
const initResponse = await request("/api/uploads/init", {
  method: "POST",
  headers: { ...headers, "content-type": "application/json" },
  body: JSON.stringify({ scope: "post", visibility: "public", content_type: "image/jpeg", file_name: "retry-reale.jpg", file_size: jpeg.byteLength }),
});
assert.equal(initResponse.status, 201);
const initialized = await initResponse.json();
assert.ok(initialized.upload_id);

for (let attempt = 1; attempt <= 2; attempt += 1) {
  const part = await request(`/api/uploads/${initialized.upload_id}/parts/1`, {
    method: "PUT",
    headers: { ...headers, "content-type": "application/octet-stream" },
    body: jpeg,
  });
  assert.equal(part.status, 200, `retry parte ${attempt} fallito`);
}
const status = await (await request(`/api/uploads/${initialized.upload_id}`, { headers })).json();
assert.equal(status.uploaded_parts.length, 1, "il retry ha duplicato la parte");

const complete = await request(`/api/uploads/${initialized.upload_id}/complete`, { method: "POST", headers });
assert.equal(complete.status, 200);
const completeAgain = await request(`/api/uploads/${initialized.upload_id}/complete`, { method: "POST", headers });
assert.equal(completeAgain.status, 200, "complete non idempotente");

const postForm = new FormData();
postForm.set("visibility", "public");
postForm.set("day_index", "-1");
postForm.set("text", "P0 retry upload chunk");
postForm.set("upload_ids", JSON.stringify([initialized.upload_id]));
const postResponse = await request("/api/posts", {
  method: "POST",
  headers: { ...headers, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
  body: postForm,
});
assert.equal(postResponse.status, 201);
const post = await postResponse.json();
const state = await (await request("/api/state", { headers })).json();
const published = state.posts.find((item) => item.id === post.id);
assert.equal(published?.media?.length, 1);
assert.equal((await request(published.media[0].media_url, { method: "HEAD", headers })).status, 200);
assert.equal((await request(`/api/posts/${post.id}`, { method: "DELETE", headers })).status, 200);
assert.notEqual((await request(published.media[0].media_url, { method: "HEAD", headers })).status, 200);

console.log("P0_CHUNK_RETRY=12/12");
