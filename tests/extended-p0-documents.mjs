import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const ownerId = process.env.QA_PROFILE_ID;
const owner = { authorization: `Bearer ${process.env.QA_SESSION_TOKEN}` };
const other = { authorization: `Bearer ${process.env.QA_SECOND_SESSION_TOKEN}` };
const coordinator = { authorization: `Bearer ${process.env.QA_COORDINATOR_TOKEN}` };
const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });

if (!base || !ownerId || !process.env.QA_SESSION_TOKEN || !process.env.QA_SECOND_SESSION_TOKEN || !process.env.QA_COORDINATOR_TOKEN)
  throw new Error("Ambiente QA P0 documenti incompleto");

const form = new FormData();
form.set("profile_id", ownerId);
form.set("doc_type", "insurance");
form.set("file", new Blob(["%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF"], { type: "application/pdf" }), "p0-documento.pdf");
const upload = await request("/api/documents", {
  method: "POST",
  headers: { ...owner, "x-idempotency-key": crypto.randomUUID() },
  body: form,
});
assert.equal(upload.status, 200, "il proprietario non riesce a caricare il documento");

const privateState = async (headers) => {
  const response = await request("/api/private", { headers });
  assert.equal(response.status, 200);
  return response.json();
};
assert.equal((await request("/api/private")).status, 401);
const ownerState = await privateState(owner);
const ownerDocument = ownerState.documents.find((item) => item.profile_id === ownerId && item.doc_type === "insurance");
assert.ok(ownerDocument?.file_key, "documento non visibile al proprietario");
const otherState = await privateState(other);
assert.ok(!otherState.documents.some((item) => item.profile_id === ownerId), "altro viaggiatore vede il documento");
const coordinatorState = await privateState(coordinator);
assert.ok(coordinatorState.documents.some((item) => item.profile_id === ownerId && item.doc_type === "insurance"));

const mediaPath = `/api/media/${ownerDocument.file_key}`;
assert.equal((await request(mediaPath, { method: "HEAD", headers: owner })).status, 200);
assert.equal((await request(mediaPath, { method: "HEAD", headers: coordinator })).status, 200);
assert.notEqual((await request(mediaPath, { method: "HEAD", headers: other })).status, 200);
assert.equal((await request(`/api/documents/${ownerId}/insurance`, { method: "DELETE", headers: other })).status, 403);
assert.equal((await request(`/api/documents/${ownerId}/insurance`, { method: "DELETE", headers: owner })).status, 200);
assert.ok(!(await privateState(owner)).documents.some((item) => item.profile_id === ownerId && item.doc_type === "insurance"));
assert.ok(!(await privateState(coordinator)).documents.some((item) => item.profile_id === ownerId && item.doc_type === "insurance"));
assert.notEqual((await request(mediaPath, { method: "HEAD", headers: owner })).status, 200);

console.log("P0_DOCUMENTS=12/12");
