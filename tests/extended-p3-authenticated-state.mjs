import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const token = process.env.QA_SESSION_TOKEN;
const profileId = process.env.QA_PROFILE_ID;
const deviceKey = process.env.QA_OWNER_DEVICE_KEY;
if (!base || !token || !profileId || !deviceKey)
  throw new Error("Ambiente QA autenticato incompleto");

const response = await fetch(`${base}/api/state`, {
  cache: "no-store",
  headers: { authorization: `Bearer ${token}`, "x-device-key": deviceKey },
});
assert.equal(response.status, 200, await response.clone().text());
const state = await response.json();
const current = state.profiles.find((profile) => profile.id === profileId);
assert.ok(current, "Il profilo autenticato deve essere presente");
assert.equal(current.name, "Proprietario");
assert.equal(current.role, "traveler");
assert.ok(Array.isArray(state.posts));
assert.ok(!JSON.stringify(state).includes(token), "Il token non deve tornare nello stato");
assert.ok(!Object.hasOwn(current, "privacy_consent_at"));
assert.ok(!Object.hasOwn(current, "privacy_consent_version"));
console.log("P3_AUTHENTICATED_STATE=8/8");
