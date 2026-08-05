import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const targetProfileId = process.env.QA_UNCLAIMED_PROFILE_ID;
const expiredInviteToken = process.env.QA_EXPIRED_INVITE_TOKEN;
const expiredSessionToken = process.env.QA_EXPIRED_SESSION_TOKEN;
const coordinatorToken = process.env.QA_COORDINATOR_TOKEN;
const coordinatorSecondToken = process.env.QA_COORDINATOR_SECOND_TOKEN;
const coordinatorSecondDeviceId = process.env.QA_COORDINATOR_SECOND_DEVICE_ID;
const groupCode = process.env.QA_GROUP_CODE;
if (!base || !targetProfileId || !expiredInviteToken || !expiredSessionToken || !coordinatorToken || !coordinatorSecondToken || !coordinatorSecondDeviceId || !groupCode) {
  throw new Error("Ambiente QA P0 ciclo autenticazione incompleto");
}

const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
const bearer = (token, deviceKey = "") => ({
  authorization: `Bearer ${token}`,
  ...(deviceKey ? { "x-device-key": deviceKey } : {}),
});
const jsonHeaders = (token, device, deviceKey = "") => ({
  ...bearer(token, deviceKey),
  "content-type": "application/json",
  ...(device ? { "x-device-name": device } : {}),
});

const healthResponse = await request("/api/health");
assert.equal(healthResponse.status, 200);
const health = await healthResponse.json();
assert.ok(health.maintenance.auth_sessions_removed >= 1);
assert.ok(health.maintenance.profile_invites_removed >= 1);
assert.equal((await request("/api/auth/session", { headers: bearer(expiredSessionToken) })).status, 401);

const registrationHeaders = {
  "content-type": "application/json",
  "x-group-code": groupCode,
  "x-device-name": "Telefono consenso locale",
  "x-device-key": "a".repeat(64),
};
const registrationName = `Consenso ${crypto.randomUUID().slice(0, 8)}`;
for (const privacyConsent of [undefined, false]) {
  const body = { name: registrationName, role: "traveler" };
  if (privacyConsent !== undefined) body.privacy_consent = privacyConsent;
  const response = await request("/api/auth/register", {
    method: "POST",
    headers: registrationHeaders,
    body: JSON.stringify(body),
  });
  assert.equal(response.status, 400);
}
const consentRegistration = await request("/api/auth/register", {
  method: "POST",
  headers: registrationHeaders,
  body: JSON.stringify({ name: registrationName, role: "traveler", privacy_consent: true }),
});
assert.equal(consentRegistration.status, 201);
const consentProfile = await consentRegistration.json();
assert.equal((await request("/api/auth/session", { headers: bearer(consentProfile.token, "a".repeat(64)) })).status, 200);
assert.equal((await request("/api/auth/session", { headers: bearer(consentProfile.token, "b".repeat(64)) })).status, 401);
assert.equal((await request("/api/auth/session", { headers: bearer(consentProfile.token) })).status, 401);
assert.equal((await request(`/api/profiles/${consentProfile.profile.id}`, {
  method: "DELETE",
  headers: bearer(consentProfile.token, "a".repeat(64)),
})).status, 200);

const missingProfileInvite = await request("/api/auth/invites", {
  method: "POST",
  headers: jsonHeaders(coordinatorToken),
  body: JSON.stringify({ profile_id: `missing-${crypto.randomUUID()}` }),
});
assert.equal(missingProfileInvite.status, 404);

const revokedInviteResponse = await request("/api/auth/invites", {
  method: "POST",
  headers: jsonHeaders(coordinatorToken),
  body: JSON.stringify({ profile_id: targetProfileId }),
});
assert.equal(revokedInviteResponse.status, 201);
const revokedInvite = await revokedInviteResponse.json();
assert.match(revokedInvite.invite_id, /^[a-f0-9]{64}$/);
assert.equal((await request(`/api/auth/invites/${revokedInvite.invite_id}`, {
  method: "DELETE",
  headers: bearer(process.env.QA_SESSION_TOKEN),
})).status, 403);
assert.equal((await request(`/api/auth/invites/${revokedInvite.invite_id}`, {
  method: "DELETE",
  headers: bearer(coordinatorToken),
})).status, 200);
assert.equal((await request("/api/auth/claim", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ invite_token: revokedInvite.invite_token }),
})).status, 403);

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

const claimDevices = [
  { name: "Telefono A", key: "c".repeat(64) },
  { name: "Telefono B", key: "d".repeat(64) },
];
const claims = await Promise.all(claimDevices.map((device) => request("/api/auth/claim", {
  method: "POST",
  headers: { "content-type": "application/json", "x-device-name": device.name, "x-device-key": device.key },
  body: JSON.stringify({ invite_token: invite.invite_token }),
})));
const statuses = claims.map((response) => response.status).sort((a, b) => a - b);
assert.equal(statuses[0], 200);
assert.ok([403, 409].includes(statuses[1]));
const winnerIndex = claims.findIndex((response) => response.status === 200);
const winner = claims[winnerIndex];
const winnerDeviceKey = claimDevices[winnerIndex].key;
const winnerBody = await winner.json();
assert.ok(winnerBody.token);
assert.equal(winnerBody.profile.id, targetProfileId);
assert.equal((await request("/api/auth/session", { headers: bearer(winnerBody.token, winnerDeviceKey) })).status, 200);
assert.equal((await request("/api/auth/session", { headers: bearer(winnerBody.token, "e".repeat(64)) })).status, 401);

assert.ok([403, 409].includes((await request("/api/auth/claim", {
  method: "POST",
  headers: { "content-type": "application/json", "x-device-name": "Telefono riuso" },
  body: JSON.stringify({ invite_token: invite.invite_token }),
})).status));

const mutatedSession = `${winnerBody.token.slice(0, -1)}${winnerBody.token.at(-1) === "a" ? "b" : "a"}`;
assert.equal((await request("/api/auth/session", { headers: bearer(mutatedSession) })).status, 401);
assert.equal((await request("/api/auth/logout", { method: "POST", headers: bearer(winnerBody.token, winnerDeviceKey) })).status, 200);
assert.equal((await request("/api/auth/session", { headers: bearer(winnerBody.token, winnerDeviceKey) })).status, 401);

const coordinatorDeviceKey = "3".repeat(64);
assert.equal((await request("/api/auth/session", { headers: bearer(coordinatorToken, coordinatorDeviceKey) })).status, 200);
assert.equal((await request("/api/auth/session", { headers: bearer(coordinatorSecondToken) })).status, 200);
const refreshResponse = await request("/api/auth/refresh", {
  method: "POST",
  headers: bearer(coordinatorToken, coordinatorDeviceKey),
});
assert.equal(refreshResponse.status, 200);
const refreshedSession = await refreshResponse.json();
assert.ok(Date.parse(refreshedSession.expires_at) - Date.now() > 29 * 24 * 60 * 60 * 1000);
assert.ok(refreshedSession.token);
assert.notEqual(refreshedSession.token, coordinatorToken);
assert.equal((await request("/api/auth/session", { headers: bearer(coordinatorToken, coordinatorDeviceKey) })).status, 401);
assert.equal((await request("/api/auth/session", { headers: bearer(refreshedSession.token, coordinatorDeviceKey) })).status, 200);
const activeCoordinatorToken = refreshedSession.token;
assert.equal((await request("/api/auth/refresh", { method: "POST", headers: bearer(mutatedSession) })).status, 401);

const subscribe = (token, endpoint, deviceKey = "") => request("/api/push/subscribe", {
  method: "POST",
  headers: jsonHeaders(token, "", deviceKey),
  body: JSON.stringify({
    subscription: { endpoint, keys: { p256dh: "qa-p256dh", auth: "qa-auth" } },
  }),
});
assert.equal((await subscribe(activeCoordinatorToken, "https://push.example/telefono-coordinatore", coordinatorDeviceKey)).status, 200);

const devicesResponse = await request("/api/auth/devices", { headers: bearer(activeCoordinatorToken, coordinatorDeviceKey) });
assert.equal(devicesResponse.status, 200);
const devicesBeforeRevoke = (await devicesResponse.json()).devices;
assert.equal(devicesBeforeRevoke.length, 2);
assert.equal(devicesBeforeRevoke.filter((device) => device.current).length, 1);
assert.ok(devicesBeforeRevoke.some((device) => device.device_id === coordinatorSecondDeviceId));
const revokeDeviceResponse = await request(`/api/auth/devices/${coordinatorSecondDeviceId}`, {
  method: "DELETE",
  headers: bearer(activeCoordinatorToken, coordinatorDeviceKey),
});
assert.equal(revokeDeviceResponse.status, 200);
assert.equal((await revokeDeviceResponse.json()).push_subscriptions_revoked, 1);
assert.equal((await request("/api/auth/session", { headers: bearer(activeCoordinatorToken, coordinatorDeviceKey) })).status, 200);
assert.equal((await request("/api/auth/session", { headers: bearer(coordinatorSecondToken) })).status, 401);
const devicesAfterRevoke = await (await request("/api/auth/devices", { headers: bearer(activeCoordinatorToken, coordinatorDeviceKey) })).json();
assert.equal(devicesAfterRevoke.devices.length, 1);

assert.equal((await subscribe(activeCoordinatorToken, "https://push.example/telefono-rimasto", coordinatorDeviceKey)).status, 200);
const logoutAllResponse = await request("/api/auth/logout-all", { method: "POST", headers: bearer(activeCoordinatorToken, coordinatorDeviceKey) });
assert.equal(logoutAllResponse.status, 200);
assert.equal((await logoutAllResponse.json()).push_subscriptions_revoked, 1);
assert.equal((await request("/api/auth/session", { headers: bearer(activeCoordinatorToken, coordinatorDeviceKey) })).status, 401);
assert.equal((await request("/api/auth/session", { headers: bearer(coordinatorSecondToken) })).status, 401);

const legacyDeviceKey = "1".repeat(64);
assert.equal((await request("/api/auth/session", {
  headers: bearer(process.env.QA_SESSION_TOKEN, legacyDeviceKey),
})).status, 200);
assert.equal((await request("/api/auth/session", {
  headers: bearer(process.env.QA_SESSION_TOKEN, "2".repeat(64)),
})).status, 401);
assert.equal((await request("/api/auth/session", {
  headers: bearer(process.env.QA_SESSION_TOKEN),
})).status, 401);
assert.equal((await request("/api/auth/session", {
  headers: bearer(process.env.QA_SESSION_TOKEN, legacyDeviceKey),
})).status, 200);

console.log("P0_AUTH_LIFECYCLE=61/61");
process.exit(0);
