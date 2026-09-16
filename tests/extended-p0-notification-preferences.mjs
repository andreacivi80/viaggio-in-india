import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const owner = { token: process.env.QA_SESSION_TOKEN, key: process.env.QA_OWNER_DEVICE_KEY };
const other = { token: process.env.QA_SECOND_SESSION_TOKEN, key: process.env.QA_OTHER_DEVICE_KEY };
if (!base || !owner.token || !owner.key || !other.token || !other.key)
  throw new Error("Ambiente QA preferenze notifiche incompleto");

const auth = (device, extra = {}) => ({
  authorization: `Bearer ${device.token}`,
  "x-device-key": device.key,
  ...extra,
});
const call = (device, init = {}) => fetch(`${base}/api/notification-preferences`, {
  cache: "no-store",
  ...init,
  headers: device ? auth(device, init.headers) : init.headers,
});
const expectedDefaults = { posts: true, comments: true, reactions: true, documents: true, location: true };

assert.equal((await call(null)).status, 401, "il pubblico non legge le preferenze");
assert.deepEqual((await (await call(owner)).json()).preferences, expectedDefaults);
assert.deepEqual((await (await call(other)).json()).preferences, expectedDefaults);

const chosen = { posts: false, comments: true, reactions: false, documents: true, location: false };
const saved = await call(owner, {
  method: "PUT",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(chosen),
});
assert.equal(saved.status, 200);
assert.deepEqual((await saved.json()).preferences, chosen);
assert.deepEqual((await (await call(owner)).json()).preferences, chosen, "le scelte devono persistere");
assert.deepEqual((await (await call(other)).json()).preferences, expectedDefaults,
  "un profilo non deve ereditare le scelte di un altro");

const partial = await call(owner, {
  method: "PUT",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ comments: false }),
});
assert.equal(partial.status, 200);
assert.deepEqual((await partial.json()).preferences, { ...chosen, comments: false });

assert.equal((await call(owner, {
  method: "PUT",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ posts: "no" }),
})).status, 400, "il server rifiuta valori non booleani");

const reset = await call(owner, {
  method: "PUT",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(expectedDefaults),
});
assert.equal(reset.status, 200);
assert.deepEqual((await reset.json()).preferences, expectedDefaults);
