import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const devices = [
  { token: process.env.QA_SESSION_TOKEN, key: process.env.QA_OWNER_DEVICE_KEY },
  { token: process.env.QA_SECOND_DEVICE_TOKEN, key: process.env.QA_SECOND_DEVICE_KEY },
];
if (!base || devices.some(({ token, key }) => !token || !key))
  throw new Error("Ambiente QA sincronizzazione notifiche incompleto");

const headers = ({ token, key }, extra = {}) => ({
  authorization: `Bearer ${token}`,
  "x-device-key": key,
  ...extra,
});
const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
const state = async (device) => {
  const response = await request("/api/state", { headers: headers(device) });
  assert.equal(response.status, 200);
  return (await response.json()).activity_state;
};
const markRead = (device, lastReadAt) => request("/api/activity/read", {
  method: "PUT",
  headers: headers(device, { "content-type": "application/json" }),
  body: JSON.stringify({ last_read_at: lastReadAt }),
});

assert.equal((await request("/api/activity/read", {
  method: "PUT",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ last_read_at: new Date().toISOString() }),
})).status, 403, "il pubblico non può modificare lo stato notifiche");

const firstRead = new Date(Date.now() - 60_000).toISOString();
const firstResponse = await markRead(devices[0], firstRead);
assert.equal(firstResponse.status, 200);
assert.equal((await firstResponse.json()).last_read_at, firstRead);
assert.equal((await state(devices[1])).last_read_at, firstRead,
  "il secondo telefono deve ricevere immediatamente lo stato letto");

const olderRead = new Date(Date.now() - 120_000).toISOString();
const staleResponse = await markRead(devices[1], olderRead);
assert.equal(staleResponse.status, 200);
assert.equal((await staleResponse.json()).last_read_at, firstRead,
  "un telefono arretrato non deve far ricomparire notifiche già lette");
assert.equal((await state(devices[0])).last_read_at, firstRead);

const latestRead = new Date().toISOString();
const latestResponse = await markRead(devices[1], latestRead);
assert.equal(latestResponse.status, 200);
assert.equal((await state(devices[0])).last_read_at, latestRead,
  "la lettura più recente del secondo telefono deve raggiungere il primo");
