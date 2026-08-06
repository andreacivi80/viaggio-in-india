import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const ownerId = process.env.QA_PROFILE_ID;
const otherId = process.env.QA_SECOND_PROFILE_ID;
const token = process.env.QA_SESSION_TOKEN;
if (!base || !ownerId || !otherId || !token) throw new Error("Ambiente QA scadenza posizione incompleto");

const health = await fetch(`${base}/api/health`, { cache: "no-store" });
assert.equal(health.status, 200);
const healthBody = await health.json();
assert.ok(Number.isInteger(healthBody.maintenance.stale_locations_removed));

const privateResponse = await fetch(`${base}/api/private`, {
  cache: "no-store",
  headers: { authorization: `Bearer ${token}` },
});
assert.equal(privateResponse.status, 200);
const locations = (await privateResponse.json()).locations;
assert.equal(locations.some((location) => location.profile_id === ownerId), false);
assert.equal(locations.some((location) => location.profile_id === otherId), true);

console.log("P0_LOCATION_RETENTION=5/5");
