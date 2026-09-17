import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const owner = { token: process.env.QA_SESSION_TOKEN, key: process.env.QA_OWNER_DEVICE_KEY, id: process.env.QA_PROFILE_ID };
const other = { token: process.env.QA_SECOND_SESSION_TOKEN, key: process.env.QA_OTHER_DEVICE_KEY, id: process.env.QA_SECOND_PROFILE_ID };
const coordinator = { token: process.env.QA_COORDINATOR_TOKEN, key: process.env.QA_COORDINATOR_DEVICE_KEY };
if (!base || Object.values(owner).some((value) => !value) || Object.values(other).some((value) => !value) ||
    !coordinator.token || !coordinator.key)
  throw new Error("Ambiente QA proroga conservazione incompleto");

const headers = (identity, extra = {}) => ({
  authorization: `Bearer ${identity.token}`,
  "x-device-key": identity.key,
  ...extra,
});
const futureDate = new Date(Date.now() + 40 * 86400000).toISOString().slice(0, 10);
const tooFar = new Date(Date.now() + 500 * 86400000).toISOString().slice(0, 10);

assert.equal((await fetch(`${base}/api/retention-extension`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ retain_until: futureDate }),
})).status, 401, "il pubblico non richiede proroghe");

assert.equal((await fetch(`${base}/api/retention-extension`, {
  method: "POST",
  headers: headers(owner, { "content-type": "application/json" }),
  body: JSON.stringify({ profile_id: other.id, retain_until: futureDate }),
})).status, 403, "un profilo non richiede per un altro");

assert.equal((await fetch(`${base}/api/retention-extension`, {
  method: "POST",
  headers: headers(owner, { "content-type": "application/json" }),
  body: JSON.stringify({ retain_until: tooFar }),
})).status, 400, "la proroga non supera dodici mesi");

const requested = await fetch(`${base}/api/retention-extension`, {
  method: "POST",
  headers: headers(owner, { "content-type": "application/json" }),
  body: JSON.stringify({ retain_until: futureDate, reason: "Conservare i ricordi del viaggio" }),
});
assert.equal(requested.status, 200);
const requestedExtension = (await requested.json()).extension;
assert.equal(requestedExtension.profile_id, owner.id);
assert.equal(requestedExtension.retain_until, futureDate);
assert.equal(requestedExtension.status, "pending");

assert.equal((await fetch(`${base}/api/retention-extension/${owner.id}`, {
  method: "PUT",
  headers: headers(owner, { "content-type": "application/json" }),
  body: JSON.stringify({ decision: "approve" }),
})).status, 403, "il proprietario non auto-approva");

const otherPrivate = await (await fetch(`${base}/api/private`, { headers: headers(other) })).json();
assert.equal(otherPrivate.retention_extensions.length, 0, "un altro viaggiatore non vede la richiesta");
const coordinatorPrivate = await (await fetch(`${base}/api/private`, { headers: headers(coordinator) })).json();
assert.ok(coordinatorPrivate.retention_extensions.some((item) =>
  item.profile_id === owner.id && item.status === "pending"), "la coordinatrice vede la richiesta");

const approved = await fetch(`${base}/api/retention-extension/${owner.id}`, {
  method: "PUT",
  headers: headers(coordinator, { "content-type": "application/json" }),
  body: JSON.stringify({ decision: "approve" }),
});
assert.equal(approved.status, 200);
assert.equal((await approved.json()).extension.status, "approved");
const ownerPrivate = await (await fetch(`${base}/api/private`, { headers: headers(owner) })).json();
assert.deepEqual(ownerPrivate.retention_extensions.map(({ profile_id, status, retain_until }) =>
  ({ profile_id, status, retain_until })), [{ profile_id: owner.id, status: "approved", retain_until: futureDate }]);
