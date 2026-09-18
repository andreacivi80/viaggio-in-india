import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const postId = process.env.QA_REFERENCE_POST_ID;
const runId = process.env.QA_RUN_ID;
const headers = {
  authorization: `Bearer ${process.env.QA_SESSION_TOKEN}`,
  "x-device-key": process.env.QA_OWNER_DEVICE_KEY,
};
const read = async (params) => {
  const response = await fetch(`${base}/api/comments?${new URLSearchParams({ post_id: postId, limit: "50", ...params })}`, { headers });
  const body = await response.text();
  assert.equal(response.status, 200, body);
  return JSON.parse(body);
};

const first = await read({});
assert.equal(first.total, 60);
assert.equal(first.comments.length, 50);
assert.equal(first.has_more, true);
const second = await read({ cursor: first.next_cursor });
assert.equal(second.comments.length, 10);
const search = await read({ q: `Bersaglio Bangkok ${runId}` });
assert.equal(search.total, 1);
assert.equal(search.comments.length, 1);
console.log("P2_COMMENT_PAGINATION_LARGE=8/8");
