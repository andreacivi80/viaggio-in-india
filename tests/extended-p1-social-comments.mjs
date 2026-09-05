import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const identities = [
  { label: "viaggiatore A", token: process.env.QA_SESSION_TOKEN, key: process.env.QA_OWNER_DEVICE_KEY },
  { label: "viaggiatore B", token: process.env.QA_SECOND_SESSION_TOKEN, key: process.env.QA_OTHER_DEVICE_KEY },
  { label: "coordinatrice", token: process.env.QA_COORDINATOR_TOKEN, key: process.env.QA_COORDINATOR_DEVICE_KEY },
];
if (!base || identities.some(({ token, key }) => !token || !key))
  throw new Error("Ambiente QA commenti multidispositivo incompleto");
const auth = ({ token, key }, extra = {}) => ({ authorization: `Bearer ${token}`, "x-device-key": key, ...extra });
const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });

const postForm = new FormData();
postForm.set("visibility", "group");
postForm.set("day_index", "-1");
postForm.set("text", `Commenti multidispositivo QA ${process.env.QA_RUN_ID}`);
const creation = await request("/api/posts", {
  method: "POST",
  headers: auth(identities[0], { "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" }),
  body: postForm,
});
assert.equal(creation.status, 201);
const post = await creation.json();

try {
  const created = [];
  for (const [index, identity] of identities.entries()) {
    const form = new FormData();
    form.set("post_id", post.id);
    form.set("text", `Commento ${identity.label} ${index + 1}`);
    const response = await request("/api/comments", {
      method: "POST",
      headers: auth(identity, { "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" }),
      body: form,
    });
    assert.equal(response.status, 201);
    created.push(await response.json());
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  assert.equal(new Set(created.map(({ id }) => id)).size, 3);
  const expectedTimes = new Map(created.map(({ id, created_at }) => [id, created_at]));

  const snapshots = await Promise.all(identities.map(async (identity) => {
    const response = await request("/api/state", { headers: auth(identity) });
    assert.equal(response.status, 200);
    return (await response.json()).posts.find((item) => item.id === post.id);
  }));
  const expectedIds = created.map(({ id }) => id).sort();
  const signatures = snapshots.map((item) => {
    assert.ok(item);
    assert.equal(item.comments.length, 3);
    assert.deepEqual(item.comments.map(({ id }) => id).sort(), expectedIds);
    assert.equal(new Set(item.comments.map(({ author_name }) => author_name)).size, 3);
    for (const comment of item.comments) {
      const timestamp = Date.parse(comment.created_at);
      assert.ok(Number.isFinite(timestamp));
      assert.equal(comment.created_at, expectedTimes.get(comment.id));
    }
    return item.comments.map(({ id, author_name, text, created_at }) => `${id}|${author_name}|${text}|${created_at}`).sort();
  });
  assert.deepEqual(signatures[1], signatures[0]);
  assert.deepEqual(signatures[2], signatures[0]);
  console.log("P1_SOCIAL_COMMENTS=18/18");
} finally {
  const deletion = await request(`/api/posts/${encodeURIComponent(post.id)}`, {
    method: "DELETE",
    headers: auth(identities[0]),
  });
  assert.equal(deletion.status, 200);
}
