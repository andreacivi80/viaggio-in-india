import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const ownerToken = process.env.QA_SESSION_TOKEN;
const otherToken = process.env.QA_SECOND_SESSION_TOKEN;
if (!base || !ownerToken || !otherToken) throw new Error("Ambiente QA push incompleto");

const endpoint = `https://push.example/disattivazione-${crypto.randomUUID()}`;
const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
const headers = (token) => ({
  authorization: `Bearer ${token}`,
  "content-type": "application/json",
});
const body = JSON.stringify({ endpoint });

const subscribe = await request("/api/push/subscribe", {
  method: "POST",
  headers: headers(ownerToken),
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
  headers: headers(otherToken),
  body,
});
assert.equal(otherDelete.status, 200);
assert.equal((await otherDelete.json()).removed, 0);

const ownerDelete = await request("/api/push/subscribe", {
  method: "DELETE",
  headers: headers(ownerToken),
  body,
});
assert.equal(ownerDelete.status, 200);
assert.equal((await ownerDelete.json()).removed, 1);

const retryDelete = await request("/api/push/subscribe", {
  method: "DELETE",
  headers: headers(ownerToken),
  body,
});
assert.equal(retryDelete.status, 200);
assert.equal((await retryDelete.json()).removed, 0);

assert.equal((await request("/api/push/subscribe", {
  method: "DELETE",
  headers: headers(ownerToken),
  body: JSON.stringify({ endpoint: "non-valido" }),
})).status, 400);

console.log("P0_PUSH_UNSUBSCRIBE=8/8");
