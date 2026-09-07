import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const ownerToken = process.env.QA_SESSION_TOKEN;
const otherToken = process.env.QA_SECOND_SESSION_TOKEN;
const ownerDeviceKey = process.env.QA_OWNER_DEVICE_KEY;
const otherDeviceKey = process.env.QA_OTHER_DEVICE_KEY;
if (!base || !ownerToken || !otherToken || !ownerDeviceKey || !otherDeviceKey)
  throw new Error("Ambiente QA push incompleto");

const endpoint = `https://push.example/disattivazione-${crypto.randomUUID()}`;
const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
const headers = (token, deviceKey) => ({
  authorization: `Bearer ${token}`,
  "x-device-key": deviceKey,
  "content-type": "application/json",
});
const body = JSON.stringify({ endpoint });

const subscribe = await request("/api/push/subscribe", {
  method: "POST",
  headers: headers(ownerToken, ownerDeviceKey),
  body: JSON.stringify({
    subscription: { endpoint, keys: { p256dh: "p256dh-test", auth: "auth-test" } },
  }),
});
assert.equal(subscribe.status, 200);

assert.equal((await request("/api/push/subscribe", {
  method: "DELETE",
  headers: { "content-type": "application/json" },
  body,
})).status, 401);

const otherDelete = await request("/api/push/subscribe", {
  method: "DELETE",
  headers: headers(otherToken, otherDeviceKey),
  body,
});
assert.equal(otherDelete.status, 200);
assert.equal((await otherDelete.json()).removed, 0);

const ownerDelete = await request("/api/push/subscribe", {
  method: "DELETE",
  headers: headers(ownerToken, ownerDeviceKey),
  body,
});
assert.equal(ownerDelete.status, 200);
assert.equal((await ownerDelete.json()).removed, 1);

const retryDelete = await request("/api/push/subscribe", {
  method: "DELETE",
  headers: headers(ownerToken, ownerDeviceKey),
  body,
});
assert.equal(retryDelete.status, 200);
assert.equal((await retryDelete.json()).removed, 0);

assert.equal((await request("/api/push/subscribe", {
  method: "DELETE",
  headers: headers(ownerToken, ownerDeviceKey),
  body: JSON.stringify({ endpoint: "non-valido" }),
})).status, 400);

const logoutEndpoint = `https://push.example/logout-${crypto.randomUUID()}`;
assert.equal((await request("/api/push/subscribe", {
  method: "POST",
  headers: headers(ownerToken, ownerDeviceKey),
  body: JSON.stringify({
    subscription: { endpoint: logoutEndpoint, keys: { p256dh: "p256dh-logout", auth: "auth-logout" } },
  }),
})).status, 200);

const logout = await request("/api/auth/logout", {
  method: "POST",
  headers: headers(ownerToken, ownerDeviceKey),
});
assert.equal(logout.status, 200);
assert.equal((await logout.json()).push_subscriptions_revoked, 1);

assert.equal((await request("/api/push/test", {
  method: "POST",
  headers: headers(ownerToken, ownerDeviceKey),
})).status, 403);

const afterLogoutDelete = await request("/api/push/subscribe", {
  method: "DELETE",
  headers: headers(otherToken, otherDeviceKey),
  body: JSON.stringify({ endpoint: logoutEndpoint }),
});
assert.equal(afterLogoutDelete.status, 200);
assert.equal((await afterLogoutDelete.json()).removed, 0);

console.log("P0_PUSH_UNSUBSCRIBE=14/14");
