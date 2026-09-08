import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const coordinatorToken = process.env.QA_COORDINATOR_TOKEN;
const coordinatorDeviceKey = process.env.QA_COORDINATOR_DEVICE_KEY;
const members = JSON.parse(process.env.QA_PUSH_MEMBERS || "[]");
if (!base || !coordinatorToken || !coordinatorDeviceKey || members.length !== 18)
  throw new Error("Ambiente QA per attivazione notifiche incompleto");

const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
const headers = (token, deviceKey) => ({
  authorization: `Bearer ${token}`,
  "x-device-key": deviceKey,
  "content-type": "application/json",
});
const endpoints = members.map((member, index) =>
  `https://push.example/gruppo-completo-${index + 1}-${crypto.randomUUID()}`);
const subscriptionCount = async () => {
  const response = await request("/api/push/test", {
    method: "POST",
    headers: headers(coordinatorToken, coordinatorDeviceKey),
  });
  assert.equal(response.status, 200);
  return (await response.json()).delivery.subscribers;
};
const baselineSubscribers = await subscriptionCount();

for (const [index, member] of members.entries()) {
  const response = await request("/api/push/subscribe", {
    method: "POST",
    headers: headers(member.token, member.deviceKey),
    body: JSON.stringify({
      subscription: {
        endpoint: endpoints[index],
        keys: { p256dh: `p256dh-${index + 1}`, auth: `auth-${index + 1}` },
      },
    }),
  });
  assert.equal(response.status, 200, `attivazione membro ${index + 1}`);
}

// La ripetizione dell'attivazione sullo stesso telefono deve restare idempotente.
for (const [index, member] of members.entries()) {
  const response = await request("/api/push/subscribe", {
    method: "POST",
    headers: headers(member.token, member.deviceKey),
    body: JSON.stringify({
      subscription: {
        endpoint: endpoints[index],
        keys: { p256dh: `p256dh-${index + 1}`, auth: `auth-${index + 1}` },
      },
    }),
  });
  assert.equal(response.status, 200, `riattivazione membro ${index + 1}`);
}

assert.equal(
  await subscriptionCount(),
  baselineSubscribers + 18,
  "devono essere aggiunte esattamente 18 sottoscrizioni uniche senza cancellare quelle esistenti",
);

for (const [index, member] of members.entries()) {
  const response = await request("/api/push/subscribe", {
    method: "DELETE",
    headers: headers(member.token, member.deviceKey),
    body: JSON.stringify({ endpoint: endpoints[index] }),
  });
  assert.equal(response.status, 200, `disattivazione membro ${index + 1}`);
  assert.equal((await response.json()).removed, 1, `rimozione univoca membro ${index + 1}`);
}

assert.equal(
  await subscriptionCount(),
  baselineSubscribers,
  "la pulizia deve rimuovere solo le 18 sottoscrizioni del collaudo",
);

console.log("P1_ALL_PUSH_ACTIVATION=75/75");
