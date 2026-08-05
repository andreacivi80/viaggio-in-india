import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const ownerId = process.env.QA_PROFILE_ID;
const otherId = process.env.QA_SECOND_PROFILE_ID;
const owner = { authorization: `Bearer ${process.env.QA_SESSION_TOKEN}` };
const other = { authorization: `Bearer ${process.env.QA_SECOND_SESSION_TOKEN}` };
const coordinator = { authorization: `Bearer ${process.env.QA_COORDINATOR_TOKEN}` };
const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
if (!base || !ownerId || !otherId) throw new Error("Ambiente QA P0 posizione incompleto");

const privateState = async (headers) => {
  const response = await request("/api/private", { headers });
  assert.equal(response.status, 200);
  return response.json();
};
assert.equal((await request("/api/locations", {
  method: "POST",
  headers: { ...owner, "content-type": "application/json" },
  body: JSON.stringify({ profile_id: ownerId, latitude: 28.6139, longitude: 77.209 }),
})).status, 200);
assert.ok((await privateState(owner)).locations.some((location) => location.profile_id === ownerId));
assert.ok((await privateState(other)).locations.some((location) => location.profile_id === ownerId));
assert.ok((await privateState(coordinator)).locations.some((location) => location.profile_id === ownerId));
assert.equal((await request("/api/locations", {
  method: "POST",
  headers: { ...other, "content-type": "application/json" },
  body: JSON.stringify({ profile_id: ownerId, latitude: 0, longitude: 0 }),
})).status, 403);
assert.equal((await request(`/api/locations/${ownerId}`, { method: "DELETE", headers: other })).status, 403);
assert.equal((await request(`/api/locations/${ownerId}`, { method: "DELETE", headers: owner })).status, 200);
assert.ok(!(await privateState(owner)).locations.some((location) => location.profile_id === ownerId));
assert.ok(!(await privateState(coordinator)).locations.some((location) => location.profile_id === ownerId));
assert.equal((await request(`/api/locations/${otherId}`, { method: "DELETE", headers: owner })).status, 403);

console.log("P0_LOCATION=10/10");
