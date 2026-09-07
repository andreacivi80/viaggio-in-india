import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const headers = {
  authorization: `Bearer ${process.env.QA_SESSION_TOKEN}`,
  "x-device-key": process.env.QA_OWNER_DEVICE_KEY,
};
if (!base || !process.env.QA_SESSION_TOKEN || !process.env.QA_OWNER_DEVICE_KEY)
  throw new Error("Ambiente QA per dieci allegati incompleto");

const form = new FormData();
form.set("visibility", "public");
form.set("day_index", "0");
form.set("text", `QA dieci allegati ${process.env.QA_RUN_ID}`);
for (let index = 0; index < 10; index += 1) {
  form.append("files", new Blob([
    new Uint8Array([0xff, 0xd8, 0xff, 0xe0, index, 0xff, 0xd9]),
  ], { type: "image/jpeg" }), `allegato-${index + 1}.jpg`);
}

let postId = "";
let mediaUrls = [];
try {
  const createdResponse = await fetch(`${base}/api/posts`, {
    method: "POST",
    headers: { ...headers, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
    body: form,
  });
  if (createdResponse.status !== 201)
    assert.fail(`creazione con dieci allegati: HTTP ${createdResponse.status} ${await createdResponse.text()}`);
  const created = await createdResponse.json();
  postId = created.id;
  assert.equal(created.media.length, 10);
  assert.deepEqual(created.media.map((item) => item.name), Array.from({ length: 10 }, (_, index) => `allegato-${index + 1}.jpg`));
  mediaUrls = created.media.map((item) => item.media_url);

  const stateResponse = await fetch(`${base}/api/state`, { headers, cache: "no-store" });
  assert.equal(stateResponse.status, 200);
  const persisted = (await stateResponse.json()).posts.find((post) => post.id === postId);
  assert.equal(persisted.media.length, 10);
  const opened = await Promise.all(mediaUrls.map((url) => fetch(`${base}${url}`, { headers })));
  assert.ok(opened.every((response) => response.status === 200));
  assert.ok(opened.every((response) => response.headers.get("content-type")?.startsWith("image/jpeg")));
  console.log("TEN_ATTACHMENTS=10/10 created; 10/10 reopened");
} finally {
  if (postId) {
    const removed = await fetch(`${base}/api/posts/${postId}`, { method: "DELETE", headers });
    assert.equal(removed.status, 200);
    const finalState = await fetch(`${base}/api/state`, { headers, cache: "no-store" }).then((response) => response.json());
    assert.equal(finalState.posts.some((post) => post.id === postId), false);
  }
}
