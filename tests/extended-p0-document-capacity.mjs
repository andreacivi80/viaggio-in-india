import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const profileId = process.env.QA_PROFILE_ID;
const headers = {
  authorization: `Bearer ${process.env.QA_SESSION_TOKEN}`,
  "x-device-key": process.env.QA_OWNER_DEVICE_KEY,
};

if (!base || !profileId || !process.env.QA_SESSION_TOKEN || !process.env.QA_OWNER_DEVICE_KEY)
  throw new Error("Ambiente QA P0 capacita documenti incompleto");

const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
const documentLimitBytes = 80 * 1024 * 1024;
const principalDocumentsPerTraveler = 4;
const travelers = 18;
const principalCapacityBytes = documentLimitBytes * principalDocumentsPerTraveler * travelers;
assert.equal(principalCapacityBytes, 5_760 * 1024 * 1024);

// Un documento realistico da 2 MiB misura il percorso completo telefono -> API -> MEDIA -> D1.
const payloadSize = 2 * 1024 * 1024;
const pdfBytes = new Uint8Array(payloadSize);
pdfBytes.set(new TextEncoder().encode("%PDF-1.4\n1 0 obj\n<<>>\nstream\n"));
pdfBytes.set(new TextEncoder().encode("\nendstream\nendobj\n%%EOF"), payloadSize - 24);
const docType = `other-${crypto.randomUUID()}`;
const form = new FormData();
form.set("profile_id", profileId);
form.set("doc_type", docType);
form.set("file", new Blob([pdfBytes], { type: "application/pdf" }), "misura-caricamento-2MiB.pdf");

let uploaded = false;
const startedAt = performance.now();
try {
  const upload = await request("/api/documents", {
    method: "POST",
    headers: { ...headers, "x-idempotency-key": crypto.randomUUID() },
    body: form,
  });
  assert.equal(upload.status, 200, `upload documento: ${upload.status} ${await upload.text()}`);
  uploaded = true;
  const elapsedMs = Math.round(performance.now() - startedAt);
  assert.ok(elapsedMs > 0 && elapsedMs < 120_000, `tempo upload anomalo: ${elapsedMs} ms`);

  const stateResponse = await request("/api/private", { headers });
  assert.equal(stateResponse.status, 200);
  const state = await stateResponse.json();
  const document = state.documents.find((item) => item.profile_id === profileId && item.doc_type === docType);
  assert.equal(document?.file_name, "misura-caricamento-2MiB.pdf");
  const stored = await request(`/api/media/${document.file_key}`, { method: "HEAD", headers });
  assert.equal(stored.status, 200);
  assert.equal(Number(stored.headers.get("content-length")), payloadSize);

  // Il server deve respingere il limite superato prima di creare o trasferire parti.
  const oversized = await request("/api/uploads/init", {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({
      scope: "document",
      visibility: "private",
      file_name: "oltre-limite.pdf",
      file_size: documentLimitBytes + 1,
      content_type: "application/pdf",
    }),
  });
  assert.ok([400, 413].includes(oversized.status), `limite non applicato: HTTP ${oversized.status}`);

  console.log(`P0_DOCUMENT_CAPACITY=8/8`);
  console.log(`DOCUMENT_UPLOAD_BYTES=${payloadSize}`);
  console.log(`DOCUMENT_UPLOAD_MS=${elapsedMs}`);
  console.log(`PRINCIPAL_DOCUMENT_CAPACITY_MIB=${principalCapacityBytes / 1024 / 1024}`);
} finally {
  if (uploaded) {
    const cleanup = await request(`/api/documents/${profileId}/${docType}`, { method: "DELETE", headers });
    assert.equal(cleanup.status, 200, "pulizia documento QA non riuscita");
  }
}
