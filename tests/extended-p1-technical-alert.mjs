import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const coordinatorToken = process.env.QA_COORDINATOR_TOKEN;
const coordinatorDeviceKey = process.env.QA_COORDINATOR_DEVICE_KEY;
if (!base || !coordinatorToken || !coordinatorDeviceKey)
  throw new Error("Ambiente QA per allarme tecnico incompleto");

const headers = {
  authorization: `Bearer ${coordinatorToken}`,
  "x-device-key": coordinatorDeviceKey,
  "content-type": "application/json",
};
const failure = await fetch(`${base}/api/push/subscribe`, {
  method: "POST",
  headers,
  body: "{json-malformato-dal-collaudo",
  cache: "no-store",
});
assert.equal(failure.status, 500);
const failureBody = await failure.json();
assert.match(failureBody.error, /temporaneamente non disponibile/i);
assert.match(failureBody.error_id, /^[0-9a-f-]{36}$/i);

let event;
for (let attempt = 0; attempt < 8 && !event; attempt += 1) {
  const response = await fetch(`${base}/api/security/audit`, {
    headers: {
      authorization: `Bearer ${coordinatorToken}`,
      "x-device-key": coordinatorDeviceKey,
    },
    cache: "no-store",
  });
  assert.equal(response.status, 200);
  const audit = await response.json();
  event = audit.events.find((item) => item.id === failureBody.error_id);
  if (!event) await new Promise((resolve) => setTimeout(resolve, 300));
}
assert.ok(event, "l'errore deve comparire nel registro del responsabile tecnico");
assert.equal(event.event_type, "technical_error");
assert.equal(event.resource_type, "api_endpoint");
assert.equal(event.resource_id, "POST push/subscribe");
assert.equal(event.result, "status_500");
assert.equal(JSON.stringify(event).includes("json-malformato"), false);

console.log("P1_TECHNICAL_ALERT=9/9");
