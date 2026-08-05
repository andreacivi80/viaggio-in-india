import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const owner = { authorization: `Bearer ${process.env.QA_SESSION_TOKEN}` };
const other = { authorization: `Bearer ${process.env.QA_SECOND_SESSION_TOKEN}` };
const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
if (!base || !process.env.QA_SESSION_TOKEN || !process.env.QA_SECOND_SESSION_TOKEN)
  throw new Error("Ambiente QA P0 social incompleto");

const postForm = new FormData();
postForm.set("visibility", "public");
postForm.set("day_index", "-1");
postForm.set("text", `P0 social ${crypto.randomUUID()}`);
const postResponse = await request("/api/posts", {
  method: "POST",
  headers: { ...owner, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
  body: postForm,
});
assert.equal(postResponse.status, 201);
const post = await postResponse.json();

const createComment = async (headers, text) => {
  const form = new FormData();
  form.set("post_id", post.id);
  form.set("text", text);
  const response = await request("/api/comments", {
    method: "POST",
    headers: { ...headers, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
    body: form,
  });
  assert.equal(response.status, 201);
  return response.json();
};
const ownerComment = await createComment(owner, "Commento proprietario");
assert.equal((await request(`/api/comments/${ownerComment.id}`, {
  method: "PUT",
  headers: { ...other, "content-type": "application/json" },
  body: JSON.stringify({ text: "Modifica vietata" }),
})).status, 403);
assert.equal((await request(`/api/comments/${ownerComment.id}`, { method: "DELETE", headers: other })).status, 403);

const [updated, deleted] = await Promise.all([
  request(`/api/comments/${ownerComment.id}`, {
    method: "PUT",
    headers: { ...owner, "content-type": "application/json" },
    body: JSON.stringify({ text: "Aggiornamento concorrente" }),
  }),
  request(`/api/comments/${ownerComment.id}`, { method: "DELETE", headers: owner }),
]);
assert.ok([200, 404].includes(updated.status));
assert.equal(deleted.status, 200);

const otherComment = await createComment(other, "Commento secondo viaggiatore");
assert.equal((await request(`/api/comments/${otherComment.id}`, {
  method: "PUT",
  headers: { ...owner, "content-type": "application/json" },
  body: JSON.stringify({ text: "Il proprietario del post non è autore" }),
})).status, 403);
assert.equal((await request(`/api/comments/${otherComment.id}`, {
  method: "PUT",
  headers: { ...other, "content-type": "application/json" },
  body: JSON.stringify({ text: "Modifica legittima" }),
})).status, 200);
assert.equal((await request(`/api/comments/${otherComment.id}`, { method: "DELETE", headers: other })).status, 200);

const finalState = await (await request("/api/state", { headers: owner })).json();
const finalPost = finalState.posts.find((item) => item.id === post.id);
assert.ok(finalPost);
assert.equal(finalPost.comments.length, 0);
assert.equal((await request(`/api/posts/${post.id}`, { method: "DELETE", headers: owner })).status, 200);

console.log("P0_SOCIAL=12/12");
