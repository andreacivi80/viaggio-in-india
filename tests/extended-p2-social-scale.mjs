import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const postId = process.env.QA_REFERENCE_POST_ID;
const headers = {
  authorization: `Bearer ${process.env.QA_SESSION_TOKEN}`,
  "x-device-key": process.env.QA_OWNER_DEVICE_KEY,
};
const request = async (path) => {
  const response = await fetch(`${base}${path}`, { headers, cache: "no-store" });
  const body = await response.text();
  assert.equal(response.status, 200, body);
  return JSON.parse(body);
};

const stateStarted = performance.now();
const state = await request("/api/state");
const stateDuration = performance.now() - stateStarted;
const post = state.posts.find((item) => item.id === postId);
assert.ok(post);
assert.equal(post.comment_count, 10_000);
assert.equal(post.comments.length, 50);
assert.ok(stateDuration < 10_000, `Stato troppo lento: ${Math.round(stateDuration)} ms`);
const heart = post.reactions.find((reaction) => reaction.kind === "heart");
assert.equal(heart.total, 20_000);
assert.ok(heart.author_names.length > 0 && heart.author_names.length <= 3);
assert.ok(post.reactions.length <= 6);

let cursor = "";
let pages = 0;
let totalComments = 0;
const commentIds = new Set();
do {
  const params = new URLSearchParams({ post_id: postId, limit: "100" });
  if (cursor) params.set("cursor", cursor);
  const page = await request(`/api/comments?${params}`);
  pages += 1;
  totalComments += page.comments.length;
  for (const comment of page.comments) commentIds.add(comment.id);
  cursor = page.next_cursor || "";
  if (pages > 100) throw new Error("Paginazione non terminante");
} while (cursor);

assert.equal(pages, 100);
assert.equal(totalComments, 10_000);
assert.equal(commentIds.size, 10_000);
console.log(`P2_SOCIAL_SCALE=14/14 state_ms=${Math.round(stateDuration)} pages=${pages}`);
