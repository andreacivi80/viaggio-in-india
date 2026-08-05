import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const targetProfileId = process.env.QA_UNCLAIMED_PROFILE_ID;
const expiredInviteToken = process.env.QA_EXPIRED_INVITE_TOKEN;
const coordinatorToken = process.env.QA_COORDINATOR_TOKEN;
const coordinatorSecondToken = process.env.QA_COORDINATOR_SECOND_TOKEN;
const coordinatorSecondDeviceId = process.env.QA_COORDINATOR_SECOND_DEVICE_ID;
if (!base || !targetProfileId || !expiredInviteToken || !coordinatorToken || !coordinatorSecondToken || !coordinatorSecondDeviceId) {
  throw new Error("Ambiente QA P0 ciclo autenticazione incompleto");
}

const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
const bearer = (token) => ({ authorization: `Bearer ${token}` });
const jsonHeaders = (token, device) => ({
  ...bearer(token),
  "content-type": "application/json",
  ...(device ? { "x-device-name": device } : {}),
});

const missingProfileInvite = await request("/api/auth/invites", {
  method: "POST",
  headers: jsonHeaders(coordinatorToken),
  body: JSON.stringify({ profile_id: `missing-${crypto.randomUUID()}` }),
});
assert.equal(missingProfileInvite.status, 404);

const inviteResponse = await request("/api/auth/invites", {
  method: "POST",
  headers: jsonHeaders(coordinatorToken),
  body: JSON.stringify({ profile_id: targetProfileId }),
});
assert.equal(inviteResponse.status, 201);
const invite = await inviteResponse.json();
assert.ok(invite.invite_token.length >= 32);
assert.equal(invite.profile.id, targetProfileId);

const changedCharacter = `${invite.invite_token[0] === "a" ? "b" : "a"}${invite.invite_token.slice(1)}`;
assert.equal((await request("/api/auth/claim", {
  method: "POST",
  headers: { "content-type": "application/json", "x-device-name": "Telefono alterato" },
  body: JSON.stringify({ invite_token: changedCharacter }),
})).status, 403);
assert.equal((await request("/api/auth/claim", {
  method: "POST",
  headers: { "content-type": "application/json", "x-device-name": "Telefono scaduto" },
  body: JSON.stringify({ invite_token: expiredInviteToken }),
})).status, 403);

const claims = await Promise.all(["Telefono A", "Telefono B"].map((device) => request("/api/auth/claim", {
  method: "POST",
  headers: { "content-type": "application/json", "x-device-name": device },
  body: JSON.stringify({ invite_token: invite.invite_token }),
})));
const statuses = claims.map((response) => response.status).sort((a, b) => a - b);
assert.equal(statuses[0], 200);
assert.ok([403, 409].includes(statuses[1]));
const winner = claims.find((response) => response.status === 200);
const winnerBody = await winner.json();
assert.ok(winnerBody.token);
assert.equal(winnerBody.profile.id, targetProfileId);
assert.equal((await request("/api/auth/session", { headers: bearer(winnerBody.token) })).status, 200);

assert.ok([403, 409].includes((await request("/api/auth/claim", {
  method: "POST",
  headers: { "content-type": "application/json", "x-device-name": "Telefono riuso" },
  body: JSON.stringify({ invite_token: invite.invite_token }),
})).status));

const mutatedSession = `${winnerBody.token.slice(0, -1)}${winnerBody.token.at(-1) === "a" ? "b" : "a"}`;
assert.equal((await request("/api/auth/session", { headers: bearer(mutatedSession) })).status, 401);
assert.equal((await request("/api/auth/logout", { method: "POST", headers: bearer(winnerBody.token) })).status, 200);
assert.equal((await request("/api/auth/session", { headers: bearer(winnerBody.token) })).status, 401);

assert.equal((await request("/api/auth/session", { headers: bearer(coordinatorToken) })).status, 200);
assert.equal((await request("/api/auth/session", { headers: bearer(coordinatorSecondToken) })).status, 200);

const subscribe = (token, endpoint) => request("/api/push/subscribe", {
  method: "POST",
  headers: jsonHeaders(token),
  body: JSON.stringify({
    subscription: { endpoint, keys: { p256dh: "qa-p256dh", auth: "qa-auth" } },
  }),
});
assert.equal((await subscribe(coordinatorToken, "https://push.example/telefono-coordinatore")).status, 200);

const devicesResponse = await request("/api/auth/devices", { headers: bearer(coordinatorToken) });
assert.equal(devicesResponse.status, 200);
const devicesBeforeRevoke = (await devicesResponse.json()).devices;
assert.equal(devicesBeforeRevoke.length, 2);
assert.equal(devicesBeforeRevoke.filter((device) => device.current).length, 1);
assert.ok(devicesBeforeRevoke.some((device) => device.device_id === coordinatorSecondDeviceId));
const revokeDeviceResponse = await request(`/api/auth/devices/${coordinatorSecondDeviceId}`, {
  method: "DELETE",
  headers: bearer(coordinatorToken),
});
assert.equal(revokeDeviceResponse.status, 200);
assert.equal((await revokeDeviceResponse.json()).push_subscriptions_revoked, 1);
assert.equal((await request("/api/auth/session", { headers: bearer(coordinatorToken) })).status, 200);
assert.equal((await request("/api/auth/session", { headers: bearer(coordinatorSecondToken) })).status, 401);
const devicesAfterRevoke = await (await request("/api/auth/devices", { headers: bearer(coordinatorToken) })).json();
assert.equal(devicesAfterRevoke.devices.length, 1);

assert.equal((await subscribe(coordinatorToken, "https://push.example/telefono-rimasto")).status, 200);
const logoutAllResponse = await request("/api/auth/logout-all", { method: "POST", headers: bearer(coordinatorToken) });
assert.equal(logoutAllResponse.status, 200);
assert.equal((await logoutAllResponse.json()).push_subscriptions_revoked, 1);
assert.equal((await request("/api/auth/session", { headers: bearer(coordinatorToken) })).status, 401);
assert.equal((await request("/api/auth/session", { headers: bearer(coordinatorSecondToken) })).status, 401);

console.log("P0_AUTH_LIFECYCLE=32/32");
process.exit(0);
