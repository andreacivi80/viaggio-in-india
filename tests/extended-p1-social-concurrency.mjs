import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const identities = {
  ownerA: { token: process.env.QA_SESSION_TOKEN, key: process.env.QA_OWNER_DEVICE_KEY },
  ownerB: { token: process.env.QA_SECOND_DEVICE_TOKEN, key: process.env.QA_SECOND_DEVICE_KEY },
  other: { token: process.env.QA_SECOND_SESSION_TOKEN, key: process.env.QA_OTHER_DEVICE_KEY },
  coordinator: { token: process.env.QA_COORDINATOR_TOKEN, key: process.env.QA_COORDINATOR_DEVICE_KEY },
};
if (!base || Object.values(identities).some(({ token, key }) => !token || !key))
  throw new Error("Ambiente QA concorrenza social incompleto");
const auth = ({ token, key }, extra = {}) => ({ authorization: `Bearer ${token}`, "x-device-key": key, ...extra });
const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });

const form = new FormData();
form.set("visibility", "public");
form.set("day_index", "-1");
form.set("text", `Concorrenza reazioni QA ${process.env.QA_RUN_ID}`);
const creation = await request("/api/posts", {
  method: "POST",
  headers: auth(identities.ownerA, { "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" }),
  body: form,
});
assert.equal(creation.status, 201);
const post = await creation.json();

const react = (identity, kind) => request("/api/reactions", {
  method: "POST",
  headers: auth(identity, { "content-type": "application/json", "x-idempotency-key": crypto.randomUUID() }),
  body: JSON.stringify({ post_id: post.id, kind }),
});
const state = async (identity) => {
  const response = await request("/api/state", { headers: auth(identity) });
  assert.equal(response.status, 200);
  return (await response.json()).posts.find((item) => item.id === post.id);
};

try {
  const simultaneous = await Promise.all([
    react(identities.ownerA, "heart"),
    react(identities.ownerB, "clap"),
  ]);
  assert.deepEqual(simultaneous.map(({ status }) => status), [200, 200]);
  const afterConcurrent = await state(identities.ownerA);
  assert.ok(afterConcurrent);
  assert.ok(afterConcurrent.reactions.length <= 1, "lo stesso profilo non deve creare reazioni duplicate");

  assert.equal((await react(identities.other, "fire")).status, 200);
  assert.equal((await react(identities.coordinator, "wow")).status, 200);
  const [ownerState, otherState, coordinatorState] = await Promise.all([
    state(identities.ownerA), state(identities.other), state(identities.coordinator),
  ]);
  const signatures = [ownerState, otherState, coordinatorState].map((item) =>
    item.reactions.map(({ kind, author_name, total }) => `${kind}:${author_name}:${total}`).sort());
  assert.deepEqual(signatures[1], signatures[0]);
  assert.deepEqual(signatures[2], signatures[0]);
  assert.equal(ownerState.reactions.length, 3);
  assert.equal(new Set(ownerState.reactions.map((item) => item.author_name)).size, 3);
  console.log("P1_SOCIAL_CONCURRENCY=12/12");
} finally {
  const deletion = await request(`/api/posts/${encodeURIComponent(post.id)}`, {
    method: "DELETE",
    headers: auth(identities.ownerA),
  });
  assert.equal(deletion.status, 200);
}
