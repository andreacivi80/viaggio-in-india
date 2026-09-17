import assert from "node:assert/strict";

const baseUrl = process.env.TEST_BASE_URL;
const groupCode = process.env.QA_GROUP_CODE;
const coordinatorToken = process.env.QA_COORDINATOR_TOKEN;
const coordinatorDeviceKey = process.env.QA_COORDINATOR_DEVICE_KEY;
const secondCoordinatorToken = process.env.QA_COORDINATOR_SECOND_TOKEN;
const secondCoordinatorDeviceKey = process.env.QA_COORDINATOR_SECOND_DEVICE_KEY;
const travelerToken = process.env.QA_SESSION_TOKEN;
const travelerDeviceKey = process.env.QA_OWNER_DEVICE_KEY;
const targetProfileId = process.env.QA_UNCLAIMED_PROFILE_ID;

for (const [name, value] of Object.entries({
  baseUrl, groupCode, coordinatorToken, coordinatorDeviceKey,
  secondCoordinatorToken, secondCoordinatorDeviceKey,
  travelerToken, travelerDeviceKey, targetProfileId,
})) assert.ok(value, `${name} mancante`);

const call = (path, { method = "GET", token, deviceKey, adminToken, body } = {}) =>
  fetch(`${baseUrl}/api/${path}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(deviceKey ? { "x-device-key": deviceKey } : {}),
      ...(adminToken ? { "x-admin-step-up": adminToken } : {}),
      ...(body ? { "content-type": "application/json" } : {}),
      "x-qa-silent": "true",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

const wrong = await call("auth/admin-step-up", {
  method: "POST", token: coordinatorToken, deviceKey: coordinatorDeviceKey,
  body: { password: `${groupCode}-errata` },
});
assert.equal(wrong.status, 403);

const traveler = await call("auth/admin-step-up", {
  method: "POST", token: travelerToken, deviceKey: travelerDeviceKey,
  body: { password: groupCode },
});
assert.equal(traveler.status, 403);

const elevated = await call("auth/admin-step-up", {
  method: "POST", token: coordinatorToken, deviceKey: coordinatorDeviceKey,
  body: { password: groupCode },
});
assert.equal(elevated.status, 200);
const issued = await elevated.json();
assert.match(issued.token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
assert.ok(Date.parse(issued.expires_at) > Date.now());

const ownOnly = await call("private", { token: coordinatorToken, deviceKey: coordinatorDeviceKey });
assert.equal(ownOnly.status, 200);
assert.equal((await ownOnly.json()).viewer.admin_verified, false);

const allPrivate = await call("private", {
  token: coordinatorToken, deviceKey: coordinatorDeviceKey, adminToken: issued.token,
});
assert.equal(allPrivate.status, 200);
assert.equal((await allPrivate.json()).viewer.admin_verified, true);

const deniedInvite = await call("auth/invites", {
  method: "POST", token: coordinatorToken, deviceKey: coordinatorDeviceKey,
  body: { profile_id: targetProfileId },
});
assert.equal(deniedInvite.status, 428);

const otherDevice = await call("auth/invites", {
  method: "POST", token: secondCoordinatorToken, deviceKey: secondCoordinatorDeviceKey,
  adminToken: issued.token, body: { profile_id: targetProfileId },
});
assert.equal(otherDevice.status, 428);

const invited = await call("auth/invites", {
  method: "POST", token: coordinatorToken, deviceKey: coordinatorDeviceKey,
  adminToken: issued.token, body: { profile_id: targetProfileId },
});
assert.equal(invited.status, 201);
const invitation = await invited.json();
assert.ok(invitation.invite_id);

const removed = await call(`auth/invites/${invitation.invite_id}`, {
  method: "DELETE", token: coordinatorToken, deviceKey: coordinatorDeviceKey,
  adminToken: issued.token,
});
assert.equal(removed.status, 200);

console.log("QA_ADMIN_STEP_UP=7/7");
