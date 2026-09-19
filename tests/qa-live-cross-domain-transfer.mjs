import assert from "node:assert/strict";

const baseUrl = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const profileId = process.env.QA_PROFILE_ID || "";
const sessionToken = process.env.QA_SESSION_TOKEN || "";
const ownerDeviceKey = process.env.QA_OWNER_DEVICE_KEY || "";
const groupCode = process.env.QA_GROUP_CODE || "";
if (!/^https:\/\/([a-z0-9-]+\.)?viaggio-in-india-2026-qa\.pages\.dev$/i.test(baseUrl))
  throw new Error("Questo collaudo può scrivere soltanto nel QA isolato");
if (!profileId || !sessionToken || !ownerDeviceKey) throw new Error("Fixture QA incompleta");

const unauthenticated = await fetch(`${baseUrl}/api/auth/transfer`, { method: "POST" });
assert.equal(unauthenticated.status, 401, "senza sessione il trasferimento deve essere negato");

const transferResponse = await fetch(`${baseUrl}/api/auth/transfer`, {
  method: "POST",
  headers: {
    authorization: `Bearer ${sessionToken}`,
    "x-device-key": ownerDeviceKey,
    "x-qa-silent": "true",
  },
});
const transfer = await transferResponse.json();
assert.equal(transferResponse.status, 201, JSON.stringify(transfer));
assert.equal(transfer.profile.id, profileId);
assert.match(transfer.invite_token, /^[a-f0-9]{64}$/);

const newDeviceKey = "8".repeat(64);
const claimResponse = await fetch(`${baseUrl}/api/auth/claim`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-device-name": "Nuovo dominio QA",
    "x-device-key": newDeviceKey,
  },
  body: JSON.stringify({ invite_token: transfer.invite_token }),
});
const claim = await claimResponse.json();
assert.equal(claimResponse.status, 200, JSON.stringify(claim));
assert.equal(claim.profile.id, profileId, "il claim deve riusare lo stesso profilo");

const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
  headers: { authorization: `Bearer ${claim.token}`, "x-device-key": newDeviceKey },
});
const claimedSession = await sessionResponse.json();
assert.equal(sessionResponse.status, 200, JSON.stringify(claimedSession));
assert.equal(claimedSession.profile.id, profileId);

const replayResponse = await fetch(`${baseUrl}/api/auth/claim`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-device-key": "9".repeat(64) },
  body: JSON.stringify({ invite_token: transfer.invite_token }),
});
assert.ok([403, 409].includes(replayResponse.status), "il token monouso non deve essere riutilizzabile");

if (groupCode) {
  const duplicateResponse = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-group-code": groupCode,
      "x-device-key": "a".repeat(64),
    },
    body: JSON.stringify({ name: "Proprietario", surname: "QA", privacy_consent: true }),
  });
  const duplicate = await duplicateResponse.json();
  assert.equal(duplicateResponse.status, 409, JSON.stringify(duplicate));
  assert.equal(duplicate.code, "PROFILE_EXISTS");
}

console.log("QA_CROSS_DOMAIN_TRANSFER=PASS same_profile=true one_time=true duplicate_blocked=true");
