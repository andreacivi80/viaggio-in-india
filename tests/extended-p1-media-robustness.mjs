import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const headers = {
  authorization: `Bearer ${process.env.QA_SESSION_TOKEN}`,
  "x-device-key": process.env.QA_OWNER_DEVICE_KEY,
};
if (!base || !process.env.QA_SESSION_TOKEN || !process.env.QA_OWNER_DEVICE_KEY)
  throw new Error("Ambiente QA P1 media incompleto");

const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
const createdIds = [];
const mediaUrls = [];
const names = [
  "foto-vacanza.jpg",
  "foto-vacanza.jpg",
  "città-perché-caffè.jpg",
  "Thailandia-🌴-📷.jpg",
  `${"nome-personale-data-ora-2026-08-10-Andrea-".repeat(6)}.jpg`,
];

async function createPost(index) {
  const form = new FormData();
  form.set("visibility", "public");
  form.set("day_index", String(index % 11));
  form.set("text", `P1 raffica media ${process.env.QA_RUN_ID} ${index}`);
  for (let position = 0; position < 5; position += 1) {
    const marker = (index * 5 + position) % 250;
    form.append(
      "files",
      new Blob([new Uint8Array([0xff, 0xd8, 0xff, marker, 0xff, 0xd9])], { type: "image/jpeg" }),
      index === 0 ? names[position] : `raffica-${index}-${position}.jpg`,
    );
  }
  const response = await request("/api/posts", {
    method: "POST",
    headers: { ...headers, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
    body: form,
  });
  if (response.status !== 201)
    assert.fail(`creazione post ${index}: HTTP ${response.status} ${await response.text()}`);
  const payload = await response.json();
  createdIds.push(payload.id);
  assert.equal(payload.media.length, 5);
  return payload;
}

try {
  const created = [];
  // Quattro raffiche reali da cinque richieste concorrenti: 20 post e 100 media.
  for (let wave = 0; wave < 4; wave += 1)
    created.push(...await Promise.all(Array.from({ length: 5 }, (_, offset) => createPost(wave * 5 + offset))));

  assert.equal(created.length, 20);
  assert.equal(created.flatMap((post) => post.media).length, 100);
  const firstNames = created[0].media.map((media) => media.name);
  assert.deepEqual(firstNames, names);
  assert.notEqual(created[0].media[0].media_url, created[0].media[1].media_url);

  const stateResponse = await request("/api/state", { headers });
  assert.equal(stateResponse.status, 200);
  const state = await stateResponse.json();
  const persisted = createdIds.map((postId) => state.posts.find((post) => post.id === postId));
  assert.ok(persisted.every(Boolean), "tutti i primi 20 post devono essere rileggibili");
  assert.ok(persisted.every((post) => post.media.length === 5));
  mediaUrls.push(...persisted.flatMap((post) => post.media.map((media) => media.media_url)));
  assert.equal(new Set(mediaUrls).size, 100);

  const mediaResponses = await Promise.all(
    persisted.flatMap((post) => post.media).map((media) => request(media.media_url, { headers })),
  );
  assert.ok(mediaResponses.every((response) => response.status === 200));
  assert.ok(mediaResponses.every((response) => response.headers.get("content-type")?.startsWith("image/jpeg")));
  const bodies = await Promise.all(mediaResponses.map((response) => response.arrayBuffer()));
  assert.ok(bodies.every((body) => body.byteLength === 6));

  console.log("P1_MEDIA_ROBUSTNESS=100/100 uploads; 20/20 posts; 100/100 reopen");
} finally {
  await Promise.allSettled(createdIds.map((postId) => request(`/api/posts/${postId}`, { method: "DELETE", headers })));
  const finalState = await request("/api/state", { headers }).then((response) => response.json());
  assert.ok(createdIds.every((postId) => !finalState.posts.some((post) => post.id === postId)));
  const removedMedia = await Promise.all(mediaUrls.map((mediaUrl) => request(mediaUrl, { method: "HEAD", headers })));
  assert.ok(removedMedia.every((response) => response.status !== 200));
}
