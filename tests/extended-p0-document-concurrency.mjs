import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const ownerId = process.env.QA_PROFILE_ID;
const owner = { authorization: `Bearer ${process.env.QA_SESSION_TOKEN}` };
const coordinator = { authorization: `Bearer ${process.env.QA_COORDINATOR_TOKEN}` };
const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });

if (!base || !ownerId || !process.env.QA_SESSION_TOKEN || !process.env.QA_COORDINATOR_TOKEN)
  throw new Error("Ambiente QA concorrenza documenti incompleto");

const pdf = (label) => new Blob([
  `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Label (${label}) >>\nendobj\n%%EOF`,
], { type: "application/pdf" });

const upload = async (type, label, idempotencyKey = crypto.randomUUID()) => {
  const form = new FormData();
  form.set("profile_id", ownerId);
  form.set("doc_type", type);
  form.set("file", pdf(label), `${label}.pdf`);
  return request("/api/documents", {
    method: "POST",
    headers: { ...owner, "x-idempotency-key": idempotencyKey },
    body: form,
  });
};

const privateState = async () => {
  const response = await request("/api/private", { headers: owner });
  assert.equal(response.status, 200);
  return response.json();
};

const types = ["passport", "visa", "tickets", "insurance"];
const firstUploads = await Promise.all(types.map((type) => upload(type, `p0-${type}`)));
assert.deepEqual(firstUploads.map((response) => response.status), [200, 200, 200, 200]);

let state = await privateState();
let owned = state.documents.filter((item) => item.profile_id === ownerId);
assert.equal(owned.length, 4, "il telefono non vede tutti e quattro i documenti");
const originalPassportKey = owned.find((item) => item.doc_type === "passport")?.file_key;
assert.ok(originalPassportKey);

const simultaneousOpen = await Promise.all([
  request(`/api/media/${originalPassportKey}`, { method: "HEAD", headers: owner }),
  request(`/api/media/${originalPassportKey}`, { method: "HEAD", headers: coordinator }),
]);
assert.deepEqual(simultaneousOpen.map((response) => response.status), [200, 200]);

const replacements = await Promise.all([
  upload("passport", "p0-passport-concurrent-a"),
  upload("passport", "p0-passport-concurrent-b"),
]);
assert.deepEqual(replacements.map((response) => response.status), [200, 200]);
state = await privateState();
owned = state.documents.filter((item) => item.profile_id === ownerId);
assert.equal(owned.filter((item) => item.doc_type === "passport").length, 1);
const currentPassportKey = owned.find((item) => item.doc_type === "passport")?.file_key;
assert.ok(currentPassportKey);
assert.notEqual(currentPassportKey, originalPassportKey);
assert.equal((await request(`/api/media/${currentPassportKey}`, { method: "HEAD", headers: owner })).status, 200);
assert.notEqual((await request(`/api/media/${originalPassportKey}`, { method: "HEAD", headers: owner })).status, 200);

const retryKey = crypto.randomUUID();
const retryResponses = await Promise.all([
  upload("visa", "p0-visa-retry", retryKey),
  upload("visa", "p0-visa-retry", retryKey),
]);
assert.ok(retryResponses.every((response) => response.status === 200));
state = await privateState();
assert.equal(state.documents.filter((item) => item.profile_id === ownerId && item.doc_type === "visa").length, 1);

const downloadAndDelete = await Promise.allSettled([
  request(`/api/media/${currentPassportKey}`, { headers: owner }),
  request(`/api/documents/${ownerId}/passport`, { method: "DELETE", headers: owner }),
]);
assert.equal(downloadAndDelete[1].status, "fulfilled");
assert.equal(downloadAndDelete[1].value.status, 200);
assert.notEqual((await request(`/api/media/${currentPassportKey}`, { method: "HEAD", headers: owner })).status, 200);
state = await privateState();
assert.equal(state.documents.some((item) => item.profile_id === ownerId && item.doc_type === "passport"), false);

for (const type of ["visa", "tickets", "insurance"])
  assert.equal((await request(`/api/documents/${ownerId}/${type}`, { method: "DELETE", headers: owner })).status, 200);

console.log("P0_DOCUMENT_CONCURRENCY=18/18");
