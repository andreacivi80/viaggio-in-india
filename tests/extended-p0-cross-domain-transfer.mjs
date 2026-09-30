import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

const base = process.env.TEST_BASE_URL;
const profileId = process.env.QA_PROFILE_ID;
const token = process.env.QA_SESSION_TOKEN;
const deviceKey = process.env.QA_OWNER_DEVICE_KEY;
if (!base || !profileId || !token || !deviceKey)
  throw new Error("Credenziali del profilo QA non disponibili");

const endpoint = `${base}/api/auth/transfer`;
const body = new URLSearchParams({ session_token: token, device_key: deviceKey });
const before = await (await fetch(`${base}/api/state`)).json();
const oldAuthorization = { authorization: `Bearer ${token}`, "x-device-key": deviceKey };
const oldDevicesResponse = await fetch(`${base}/api/auth/devices`, { headers: oldAuthorization });
assert.equal(oldDevicesResponse.status, 200);
const oldDeviceId = (await oldDevicesResponse.json()).devices.find((device) => device.current)?.device_id;
assert.ok(oldDeviceId);

const wrongOrigin = await fetch(endpoint, {
  method: "POST", body, redirect: "manual",
  headers: { origin: "https://sito-estraneo.example" },
});
assert.equal(wrongOrigin.status, 403, "un altro sito non può avviare il recupero");

const wrongToken = await fetch(endpoint, {
  method: "POST", redirect: "manual",
  headers: { origin: "https://viaggio-in-india-2026.pages.dev" },
  body: new URLSearchParams({ session_token: "non-valido", device_key: deviceKey }),
});
assert.equal(wrongToken.status, 401, "serve la sessione personale originale");

const transfer = await fetch(endpoint, {
  method: "POST", body, redirect: "manual",
  headers: { origin: "https://viaggio-in-india-2026.pages.dev" },
});
assert.equal(transfer.status, 303, "il recupero naviga verso il nuovo dominio");
const location = new URL(transfer.headers.get("location"));
assert.equal(location.origin, "https://viaggio-in-thailandia-2026.pages.dev");
const inviteToken = new URLSearchParams(location.hash.slice(1)).get("invite");
assert.ok(inviteToken, "il codice monouso è nel frammento, non nella query");
assert.equal(location.search, "");
assert.equal(transfer.headers.get("cache-control"), "no-store");

const newDeviceKey = randomBytes(32).toString("hex");
const claim = await fetch(`${base}/api/auth/claim`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-device-name": "QA cross-domain recovery",
    "x-device-key": newDeviceKey,
    "x-qa-silent": "true",
  },
  body: JSON.stringify({ invite_token: inviteToken }),
});
assert.equal(claim.status, 200, "il codice recupera il vecchio profilo");
const claimed = await claim.json();
assert.equal(claimed.profile.id, profileId);
const after = await (await fetch(`${base}/api/state`)).json();
assert.equal(after.profiles.length, before.profiles.length, "nessun profilo duplicato");
assert.equal((await fetch(`${base}/api/auth/session`, { headers: oldAuthorization })).status, 200,
  "il vecchio telefono resta collegato dopo il trasferimento");

const newAuthorization = { authorization: `Bearer ${claimed.token}`, "x-device-key": newDeviceKey };
const devicesResponse = await fetch(`${base}/api/auth/devices`, { headers: newAuthorization });
assert.equal(devicesResponse.status, 200);
assert.ok((await devicesResponse.json()).devices.some((device) => device.device_id === oldDeviceId));
assert.equal((await fetch(`${base}/api/auth/devices/${encodeURIComponent(oldDeviceId)}`, {
  method: "DELETE", headers: newAuthorization,
})).status, 200, "il nuovo telefono può revocare quello vecchio");
assert.equal((await fetch(`${base}/api/auth/session`, { headers: oldAuthorization })).status, 401,
  "il vecchio telefono revocato non accede più");
assert.equal((await fetch(`${base}/api/auth/session`, { headers: newAuthorization })).status, 200,
  "il telefono nuovo conserva l’accesso al medesimo profilo");

await fetch(`${base}/api/auth/logout`, {
  method: "POST",
  headers: newAuthorization,
});
console.log("Cross-domain QA: origine, sessione, recupero, revoca vecchio telefono e nessun duplicato verificati");
