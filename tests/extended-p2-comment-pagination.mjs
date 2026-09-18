import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const headers = {
  authorization: `Bearer ${process.env.QA_SESSION_TOKEN}`,
  "x-device-key": process.env.QA_OWNER_DEVICE_KEY,
};
if (!base || !process.env.QA_SESSION_TOKEN || !process.env.QA_OWNER_DEVICE_KEY)
  throw new Error("Ambiente QA paginazione commenti incompleto");
const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });

const postForm = new FormData();
postForm.set("visibility", "public");
postForm.set("day_index", "-1");
postForm.set("text", `Paginazione commenti QA ${process.env.QA_RUN_ID}`);
const postResponse = await request("/api/posts", {
  method: "POST",
  headers: { ...headers, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
  body: postForm,
});
assert.equal(postResponse.status, 201);
const post = await postResponse.json();

const addComment = async (text) => {
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

try {
  const marker = `unico-${process.env.QA_RUN_ID}`;
  await addComment("primo commento pagina");
  await addComment(`secondo ${marker}`);
  await addComment("terzo commento pagina");
  await addComment("quarto commento pagina");

  const firstResponse = await request(`/api/comments?post_id=${encodeURIComponent(post.id)}&limit=2`, { headers });
  assert.equal(firstResponse.status, 200);
  const first = await firstResponse.json();
  assert.equal(first.comments.length, 2);
  assert.equal(first.total, 4);
  assert.equal(first.has_more, true);
  assert.ok(first.next_cursor);

  const secondResponse = await request(`/api/comments?post_id=${encodeURIComponent(post.id)}&limit=2&cursor=${encodeURIComponent(first.next_cursor)}`, { headers });
  assert.equal(secondResponse.status, 200);
  const second = await secondResponse.json();
  assert.equal(second.comments.length, 2);
  assert.equal(new Set([...first.comments, ...second.comments].map((comment) => comment.id)).size, 4);

  const searchResponse = await request(`/api/comments?post_id=${encodeURIComponent(post.id)}&q=${encodeURIComponent(`secondo ${marker}`)}`, { headers });
  assert.equal(searchResponse.status, 200);
  const search = await searchResponse.json();
  assert.equal(search.total, 1);
  assert.equal(search.comments[0].text, `secondo ${marker}`);
  console.log("P2_COMMENT_PAGINATION=12/12");
} finally {
  const deletion = await request(`/api/posts/${encodeURIComponent(post.id)}`, { method: "DELETE", headers });
  assert.equal(deletion.status, 200);
}
