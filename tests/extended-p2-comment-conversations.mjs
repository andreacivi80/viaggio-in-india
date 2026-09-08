import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const postId = process.env.QA_REFERENCE_POST_ID;
const identities = {
  owner: { token: process.env.QA_SESSION_TOKEN, key: process.env.QA_OWNER_DEVICE_KEY },
  other: { token: process.env.QA_SECOND_SESSION_TOKEN, key: process.env.QA_OTHER_DEVICE_KEY },
  coordinator: { token: process.env.QA_COORDINATOR_TOKEN, key: process.env.QA_COORDINATOR_DEVICE_KEY },
};
if (!base || !postId || Object.values(identities).some(({ token, key }) => !token || !key))
  throw new Error("Ambiente QA conversazioni commenti incompleto");

const auth = ({ token, key }, extra = {}) => ({
  authorization: `Bearer ${token}`,
  "x-device-key": key,
  ...extra,
});
const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
const createComment = async (identity, text, parentCommentId = "") => {
  const form = new FormData();
  form.set("post_id", postId);
  form.set("text", text);
  if (parentCommentId) form.set("parent_comment_id", parentCommentId);
  const response = await request("/api/comments", {
    method: "POST",
    headers: auth(identity, { "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" }),
    body: form,
  });
  assert.equal(response.status, 201);
  return response.json();
};
const react = async (identity, commentId, kind) => {
  const response = await request("/api/comment-reactions", {
    method: "POST",
    headers: auth(identity, {
      "content-type": "application/json",
      "x-idempotency-key": crypto.randomUUID(),
    }),
    body: JSON.stringify({ comment_id: commentId, kind }),
  });
  assert.equal(response.status, 200);
  return response.json();
};
const readPost = async (identity) => {
  const response = await request("/api/state", { headers: auth(identity) });
  assert.equal(response.status, 200);
  const post = (await response.json()).posts.find(({ id }) => id === postId);
  assert.ok(post);
  return post;
};

let root;
try {
  root = await createComment(identities.owner, `Conversazione radice ${process.env.QA_RUN_ID}`);
  const reply = await createComment(identities.other, "Prima risposta", root.id);
  const nestedReply = await createComment(identities.coordinator, "Risposta alla risposta", reply.id);
  assert.equal(reply.parent_comment_id, root.id);
  assert.equal(nestedReply.parent_comment_id, root.id);

  const wrongParent = new FormData();
  wrongParent.set("post_id", postId);
  wrongParent.set("text", "Risposta impossibile");
  wrongParent.set("parent_comment_id", "commento-inesistente");
  assert.equal((await request("/api/comments", {
    method: "POST",
    headers: auth(identities.owner, { "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" }),
    body: wrongParent,
  })).status, 404);

  assert.equal((await request("/api/comment-reactions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ comment_id: root.id, kind: "heart" }),
  })).status, 401);

  assert.equal((await react(identities.other, root.id, "heart")).reaction, "heart");
  assert.equal((await react(identities.owner, reply.id, "clap")).reaction, "clap");
  assert.equal((await react(identities.coordinator, root.id, "laugh")).reaction, "laugh");

  for (const identity of Object.values(identities)) {
    const snapshot = await readPost(identity);
    const rootSnapshot = snapshot.comments.find(({ id }) => id === root.id);
    const replySnapshot = snapshot.comments.find(({ id }) => id === reply.id);
    const nestedSnapshot = snapshot.comments.find(({ id }) => id === nestedReply.id);
    assert.ok(rootSnapshot && replySnapshot && nestedSnapshot);
    assert.equal(replySnapshot.parent_comment_id, root.id);
    assert.equal(nestedSnapshot.parent_comment_id, root.id);
    assert.deepEqual(rootSnapshot.reactions.map(({ kind }) => kind).sort(), ["heart", "laugh"]);
    assert.deepEqual(replySnapshot.reactions.map(({ kind }) => kind), ["clap"]);
  }

  assert.equal((await react(identities.other, root.id, "heart")).reaction, null);
  const afterToggle = await readPost(identities.owner);
  assert.deepEqual(afterToggle.comments.find(({ id }) => id === root.id).reactions.map(({ kind }) => kind), ["laugh"]);

  const deletion = await request(`/api/comments/${encodeURIComponent(root.id)}`, {
    method: "DELETE",
    headers: auth(identities.other),
  });
  assert.equal(deletion.status, 200);
  root = null;
  const afterDeletion = await readPost(identities.owner);
  assert.equal(afterDeletion.comments.some(({ id }) => [reply.id, nestedReply.id].includes(id)), false);
  console.log("P2_COMMENT_CONVERSATIONS=31/31");
} finally {
  if (root)
    await request(`/api/comments/${encodeURIComponent(root.id)}`, {
      method: "DELETE",
      headers: auth(identities.owner),
    }).catch(() => {});
}
