import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const headers = {
  authorization: `Bearer ${process.env.QA_SESSION_TOKEN}`,
  "x-device-key": process.env.QA_OWNER_DEVICE_KEY,
};
if (!base || !process.env.QA_SESSION_TOKEN || !process.env.QA_OWNER_DEVICE_KEY)
  throw new Error("Ambiente QA commenti limite incompleto");
const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });

const postForm = new FormData();
postForm.set("visibility", "public");
postForm.set("day_index", "-1");
postForm.set("text", `Commenti limite QA ${process.env.QA_RUN_ID}`);
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
  return request("/api/comments", {
    method: "POST",
    headers: { ...headers, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
    body: form,
  });
};

try {
  assert.equal((await addComment("   ")).status, 400);
  const emoji = "Partenza! 🇹🇭 ✈️ 🌴 🙌";
  assert.equal((await addComment(emoji)).status, 201);
  const mention = "@Secondo QA ci vediamo a Bangkok";
  assert.equal((await addComment(mention)).status, 201);
  const longText = `Lungo-${"ค".repeat(20_000)}-fine`;
  assert.equal((await addComment(longText)).status, 201);
  const stateResponse = await request("/api/state", { headers });
  assert.equal(stateResponse.status, 200);
  const stored = (await stateResponse.json()).posts.find((item) => item.id === post.id)?.comments || [];
  assert.equal(stored.length, 3);
  assert.ok(stored.some((comment) => comment.text === emoji));
  assert.ok(stored.some((comment) => comment.text === mention));
  assert.ok(stored.some((comment) => comment.text === longText));
  console.log("P2_COMMENT_EDGES=8/8");
} finally {
  const deletion = await request(`/api/posts/${encodeURIComponent(post.id)}`, { method: "DELETE", headers });
  assert.equal(deletion.status, 200);
}
