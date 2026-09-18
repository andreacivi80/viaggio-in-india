import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const token = process.env.QA_SESSION_TOKEN;
const deviceKey = process.env.QA_OWNER_DEVICE_KEY;
const uploadIds = JSON.parse(process.env.QA_MEDIA_CAP_UPLOAD_IDS || "[]");
assert.match(base, /viaggio-in-india-2026-qa\.pages\.dev$/);
assert.equal(uploadIds.length, 2);

const form = new FormData();
form.set("visibility", "public");
form.set("day_index", "0");
form.set("text", "Controllo quota MEDIA QA");
form.set("upload_ids", JSON.stringify(uploadIds));
const response = await fetch(`${base}/api/posts`, {
  method: "POST",
  headers: {
    authorization: `Bearer ${token}`,
    "x-device-key": deviceKey,
    "x-qa-silent": "true",
  },
  body: form,
});
const payload = await response.json();
assert.equal(response.status, 413);
assert.match(payload.error, /600 MB/);
console.log("MEDIA_POST_CAP_QA=2x310MB_REJECTED_413");
