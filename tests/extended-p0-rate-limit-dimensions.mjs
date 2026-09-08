import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const ownerToken = process.env.QA_SESSION_TOKEN;
const otherToken = process.env.QA_SECOND_SESSION_TOKEN;
const coordinatorToken = process.env.QA_COORDINATOR_TOKEN;
const coordinatorSecondToken = process.env.QA_COORDINATOR_SECOND_TOKEN;
const ownerDeviceKey = process.env.QA_OWNER_DEVICE_KEY;
const otherDeviceKey = process.env.QA_OTHER_DEVICE_KEY;
const coordinatorDeviceKey = process.env.QA_COORDINATOR_DEVICE_KEY;
const coordinatorSecondDeviceKey = process.env.QA_COORDINATOR_SECOND_DEVICE_KEY;
if (!base || !ownerToken || !otherToken || !coordinatorToken || !coordinatorSecondToken
  || !ownerDeviceKey || !otherDeviceKey || !coordinatorDeviceKey || !coordinatorSecondDeviceKey)
  throw new Error("Ambiente QA limiti multidimensionali incompleto");

const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
const invalidComment = (token, deviceKey) => {
  const form = new FormData();
  form.set("post_id", `inesistente-${crypto.randomUUID()}`);
  form.set("text", "prova limite");
  return request("/api/comments", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "x-device-key": deviceKey },
    body: form,
  });
};

const actorStatuses = [];
const actorBodies = [];
for (let index = 0; index < 11; index += 1) {
  const firstSession = index % 2 === 0;
  const response = await invalidComment(
    firstSession ? coordinatorToken : coordinatorSecondToken,
    firstSession ? coordinatorDeviceKey : coordinatorSecondDeviceKey,
  );
  actorStatuses.push(response.status);
  actorBodies.push((await response.text()).slice(0, 240));
}
assert.deepEqual(
  actorStatuses.slice(0, 10),
  Array(10).fill(404),
  `risposte inattese: ${actorBodies.slice(0, 10).join(" | ")}`,
);
assert.equal(actorStatuses[10], 429, "due sessioni dello stesso profilo non devono aggirare il limite attore");

const invalidReaction = (token, deviceKey) => request("/api/reactions", {
  method: "POST",
  headers: {
    authorization: `Bearer ${token}`,
    "x-device-key": deviceKey,
    "content-type": "application/json",
  },
  body: JSON.stringify({ post_id: `inesistente-${crypto.randomUUID()}`, kind: "heart" }),
});
const ipStatuses = [];
for (let index = 0; index < 31; index += 1) {
  const ownerRequest = index % 2 === 0;
  const response = await invalidReaction(
    ownerRequest ? ownerToken : otherToken,
    ownerRequest ? ownerDeviceKey : otherDeviceKey,
  );
  ipStatuses.push(response.status);
}
assert.deepEqual(ipStatuses.slice(0, 30), Array(30).fill(404));
assert.equal(ipStatuses[30], 429, "profili diversi sullo stesso IP non devono aggirare il limite rete");

const auditResponse = await request("/api/security/audit", {
  headers: { authorization: `Bearer ${coordinatorToken}`, "x-device-key": coordinatorDeviceKey },
});
assert.equal(auditResponse.status, 200, "il coordinatore deve poter leggere gli allarmi di abuso");
const audit = await auditResponse.json();
const alerts = audit.events.filter((event) => event.event_type === "rate_limit_reached");
assert.ok(alerts.length >= 2, "gli abusi ripetuti devono produrre allarmi nel registro coordinatore");
assert.ok(alerts.every((event) => event.result === "blocked" && event.created_at), "ogni allarme deve indicare blocco e ora server");

console.log("P0_RATE_LIMIT_DIMENSIONS=10/10");
