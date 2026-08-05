import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const owner = { authorization: `Bearer ${process.env.QA_SESSION_TOKEN}` };
const other = { authorization: `Bearer ${process.env.QA_SECOND_SESSION_TOKEN}` };
const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
if (!base || !process.env.QA_SESSION_TOKEN || !process.env.QA_SECOND_SESSION_TOKEN)
  throw new Error("Ambiente QA P0 sincronizzazione incompleto");

const state = async (headers = {}) => {
  const response = await request("/api/state", { headers });
  assert.equal(response.status, 200);
  return response.json();
};
const before = await state(owner);
const postForm = new FormData();
postForm.set("visibility", "public");
postForm.set("day_index", "-1");
postForm.set("text", `P0 sync delete ${crypto.randomUUID()}`);
const createdResponse = await request("/api/posts", {
  method: "POST",
  headers: { ...owner, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
  body: postForm,
});
assert.equal(createdResponse.status, 201);
const created = await createdResponse.json();
assert.ok((await state()).posts.some((post) => post.id === created.id));
assert.ok((await state(other)).posts.some((post) => post.id === created.id));

const comment = new FormData();
comment.set("post_id", created.id);
comment.set("text", "Commento prima della cancellazione");
assert.equal((await request("/api/comments", {
  method: "POST",
  headers: { ...other, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
  body: comment,
})).status, 201);
assert.equal((await request("/api/reactions", {
  method: "POST",
  headers: { ...other, "content-type": "application/json", "x-idempotency-key": crypto.randomUUID() },
  body: JSON.stringify({ post_id: created.id, kind: "heart" }),
})).status, 200);

const lateComment = new FormData();
lateComment.set("post_id", created.id);
lateComment.set("text", "Commento concorrente");
const [deleted, concurrentComment] = await Promise.all([
  request(`/api/posts/${created.id}`, { method: "DELETE", headers: owner }),
  request("/api/comments", {
    method: "POST",
    headers: { ...other, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
    body: lateComment,
  }),
]);
assert.equal(deleted.status, 200);
assert.ok([201, 404].includes(concurrentComment.status));

const [publicAfter, ownerAfter, otherAfter] = await Promise.all([state(), state(owner), state(other)]);
for (const snapshot of [publicAfter, ownerAfter, otherAfter])
  assert.ok(!snapshot.posts.some((post) => post.id === created.id));
assert.ok(Number(ownerAfter.sync_version) > Number(before.sync_version));
assert.equal((await request(`/api/posts/${created.id}`, { method: "DELETE", headers: owner })).status, 404);

console.log("P0_SYNC_DELETE=12/12");
