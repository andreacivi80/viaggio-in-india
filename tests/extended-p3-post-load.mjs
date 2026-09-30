import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const owner = {
  token: process.env.QA_SESSION_TOKEN,
  deviceKey: process.env.QA_OWNER_DEVICE_KEY,
};
const members = JSON.parse(process.env.QA_PUSH_MEMBERS || "[]");
assert.match(base, /viaggio-in-india-2026-qa\.pages\.dev$/);
assert.ok(owner.token && owner.deviceKey);
assert.equal(members.length, 18);

const created = [];
const headers = ({ token, deviceKey }) => ({
  authorization: `Bearer ${token}`,
  "x-device-key": deviceKey,
  "x-idempotency-key": crypto.randomUUID(),
  "x-qa-silent": "true",
});
const publish = async (identity, text) => {
  const form = new FormData();
  form.set("visibility", "public");
  form.set("day_index", "-1");
  form.set("text", text);
  const response = await fetch(`${base}/api/posts`, { method: "POST", headers: headers(identity), body: form });
  const body = await response.text();
  assert.equal(response.status, 201, body);
  const post = JSON.parse(body);
  created.push({ id: post.id, identity });
  return post;
};

try {
  const burst = [];
  for (let index = 0; index < 20; index += 1)
    burst.push(await publish(owner, `Raffica 20 post QA ${process.env.QA_RUN_ID} ${index + 1}`));
  assert.equal(new Set(burst.map(({ id }) => id)).size, 20);

  const simultaneous = await Promise.all(members.map((member, index) =>
    publish({ token: member.token, deviceKey: member.deviceKey },
      `Dispositivo ${index + 1} QA ${process.env.QA_RUN_ID}`)));
  assert.equal(new Set(simultaneous.map(({ id }) => id)).size, 18);

  const stateResponse = await fetch(`${base}/api/state`, {
    cache: "no-store",
    headers: { authorization: `Bearer ${owner.token}`, "x-device-key": owner.deviceKey },
  });
  assert.equal(stateResponse.status, 200);
  const state = await stateResponse.json();
  const visibleIds = new Set(state.posts.map(({ id }) => id));
  assert.ok([...burst, ...simultaneous].every(({ id }) => visibleIds.has(id)));
  console.log("P3_POST_LOAD=20/20_BURST;18/18_DEVICES;38/38_VISIBLE");
} finally {
  for (const { id, identity } of created) {
    const response = await fetch(`${base}/api/posts/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${identity.token}`, "x-device-key": identity.deviceKey },
    });
    assert.equal(response.status, 200);
  }
}
