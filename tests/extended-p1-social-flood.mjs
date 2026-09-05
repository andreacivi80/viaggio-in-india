import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const token = process.env.QA_SESSION_TOKEN;
const profileId = process.env.QA_PROFILE_ID;
const key = process.env.QA_OWNER_DEVICE_KEY;
if (!base || !token || !profileId || !key) throw new Error("Ambiente QA raffica social incompleto");
const headers = { authorization: `Bearer ${token}`, "x-device-key": key };
const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });

const postForm = new FormData();
postForm.set("visibility", "public");
postForm.set("day_index", "-1");
postForm.set("text", `Raffica social QA ${process.env.QA_RUN_ID}`);
const postResponse = await request("/api/posts", {
  method: "POST",
  headers: { ...headers, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
  body: postForm,
});
assert.equal(postResponse.status, 201);
const post = await postResponse.json();

try {
  const commentStatuses = [];
  for (let index = 0; index < 100; index += 1) {
    const form = new FormData();
    form.set("post_id", post.id);
    form.set("text", `Commento raffica ${index + 1}`);
    const response = await request("/api/comments", {
      method: "POST",
      headers: { ...headers, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
      body: form,
    });
    commentStatuses.push(response.status);
  }
  assert.deepEqual(commentStatuses.slice(0, 10), Array(10).fill(201));
  assert.deepEqual(commentStatuses.slice(10), Array(90).fill(429));

  const kinds = ["like", "heart", "laugh", "wow", "clap", "fire"];
  const reactionStatuses = [];
  for (let index = 0; index < 100; index += 1) {
    const response = await request("/api/reactions", {
      method: "POST",
      headers: {
        ...headers,
        "content-type": "application/json",
        "x-idempotency-key": crypto.randomUUID(),
        "x-qa-silent": "true",
      },
      body: JSON.stringify({ post_id: post.id, kind: kinds[index % kinds.length] }),
    });
    reactionStatuses.push(response.status);
  }
  assert.deepEqual(reactionStatuses.slice(0, 30), Array(30).fill(200));
  assert.deepEqual(reactionStatuses.slice(30), Array(70).fill(429));

  const stateResponse = await request("/api/state", { headers });
  assert.equal(stateResponse.status, 200);
  const state = await stateResponse.json();
  const persisted = state.posts.find((item) => item.id === post.id);
  assert.ok(persisted);
  assert.equal(persisted.comments.length, 10);
  assert.ok(persisted.reactions.length <= 1);
  assert.ok(persisted.comments.every((comment) => comment.author_name === post.author_name));
  console.log("P1_SOCIAL_FLOOD=204/204");
} finally {
  const deletion = await request(`/api/posts/${encodeURIComponent(post.id)}`, { method: "DELETE", headers });
  assert.equal(deletion.status, 200);
}
