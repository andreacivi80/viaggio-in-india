import test from "node:test";
import assert from "node:assert/strict";
import { indexedDB } from "fake-indexeddb";

globalThis.indexedDB = indexedDB;
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: { onLine: true },
});
const storage = new Map([
  ["india-session-token", "sessione-tecnica"],
  ["india-device-key", "chiave-dispositivo-tecnica"],
]);
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, String(value)),
};

const {
  flushOfflineQueue,
  queuedRequests,
  queuedRequestCount,
  queueFormRequest,
  removeQueuedRequest,
} = await import("../src/offlineQueue.js");

test("la coda conserva allegati e ritenta con la stessa operazione senza duplicare", async () => {
  const form = new FormData();
  form.set("text", "ricordo offline");
  form.set("files", new Blob(["foto-offline"], { type: "image/jpeg" }), "foto.jpg");
  await queueFormRequest({
    id: "test-offline-1",
    endpoint: "/api/posts",
    form,
    authType: "session",
    operationKey: "operazione-offline-123456",
  });
  assert.equal(await queuedRequestCount(), 1);
  const calls = [];
  let failOnce = true;
  globalThis.fetch = async (endpoint, options) => {
    calls.push({ endpoint, options });
    if (failOnce) {
      failOnce = false;
      throw new TypeError("rete assente");
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  };
  assert.equal((await flushOfflineQueue()).pending, 1);
  assert.equal((await flushOfflineQueue()).pending, 0);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.headers["x-idempotency-key"], "operazione-offline-123456");
  assert.equal(calls[1].options.headers["x-idempotency-key"], "operazione-offline-123456");
  assert.equal(calls[1].options.headers.authorization, "Bearer sessione-tecnica");
  assert.equal(calls[1].options.headers["x-device-key"], "chiave-dispositivo-tecnica");
  const retriedFile = calls[1].options.body.get("files");
  assert.equal(retriedFile.name, "foto.jpg");
  assert.equal(await retriedFile.text(), "foto-offline");
});

test("la coda conserva insieme foto, audio, video e PDF", async () => {
  const form = new FormData();
  const fixtures = [
    ["foto.jpg", "image/jpeg", "foto"],
    ["voce.mp3", "audio/mpeg", "audio"],
    ["clip.mp4", "video/mp4", "video"],
    ["documento.pdf", "application/pdf", "pdf"],
  ];
  for (const [name, type, body] of fixtures)
    form.append("files", new Blob([body], { type }), name);
  await queueFormRequest({
    id: "test-offline-multimedia",
    endpoint: "/api/posts",
    form,
    authType: "session",
    operationKey: "operazione-multimedia-123456",
  });
  let uploaded;
  globalThis.fetch = async (_endpoint, options) => {
    uploaded = options.body.getAll("files");
    return new Response("{}", { status: 201 });
  };
  const result = await flushOfflineQueue();
  assert.equal(result.pending, 0);
  assert.deepEqual(uploaded.map((file) => [file.name, file.type]),
    fixtures.map(([name, type]) => [name, type]));
  assert.deepEqual(await Promise.all(uploaded.map((file) => file.text())),
    fixtures.map(([, , body]) => body));
});

test("la coda conserva più bozze e un commento come operazioni distinte", async () => {
  const requests = [
    ["bozza-uno", "/api/posts", "Prima bozza"],
    ["bozza-due", "/api/posts", "Seconda bozza"],
    ["commento-uno", "/api/comments", "Commento offline"],
  ];
  for (const [id, endpoint, text] of requests) {
    const form = new FormData();
    form.set("text", text);
    if (endpoint.endsWith("comments")) form.set("post_id", "post-esistente");
    await queueFormRequest({
      id,
      endpoint,
      form,
      authType: "session",
      operationKey: `operazione-${id}-123456`,
    });
  }
  assert.equal(await queuedRequestCount(), 3);
  const sent = [];
  globalThis.fetch = async (endpoint, options) => {
    sent.push([endpoint, options.body.get("text"), options.headers["x-idempotency-key"]]);
    return new Response("{}", { status: 201 });
  };
  assert.deepEqual(await flushOfflineQueue(), { sent: 3, pending: 0 });
  assert.deepEqual(
    sent.map(([endpoint, text]) => [endpoint, text]).sort((left, right) => left[1].localeCompare(right[1])),
    requests.map(([, endpoint, text]) => [endpoint, text]).sort((left, right) => left[1].localeCompare(right[1])),
  );
  assert.equal(new Set(sent.map(([, , key]) => key)).size, 3);
});

test("le bozze offline conservano 10 foto, un video e una foto singola", async () => {
  const photoNames = Array.from({ length: 10 }, (_, index) => `foto-${index + 1}.jpg`);
  const photoDraft = new FormData();
  photoDraft.set("text", "bozza con dieci foto");
  for (const [index, name] of photoNames.entries())
    photoDraft.append(
      "files",
      new Blob([`contenuto-foto-${index + 1}`], { type: "image/jpeg" }),
      name,
    );

  const videoDraft = new FormData();
  videoDraft.set("text", "bozza video");
  videoDraft.append(
    "files",
    new Blob(["contenuto-video"], { type: "video/mp4" }),
    "video-bozza.mp4",
  );

  const singlePhotoDraft = new FormData();
  singlePhotoDraft.set("text", "bozza foto singola");
  singlePhotoDraft.append(
    "files",
    new Blob(["contenuto-foto-singola"], { type: "image/jpeg" }),
    "foto-singola.jpg",
  );

  for (const [id, form] of [
    ["bozza-dieci-foto", photoDraft],
    ["bozza-video", videoDraft],
    ["bozza-foto-singola", singlePhotoDraft],
  ]) {
    await queueFormRequest({
      id,
      endpoint: "/api/posts",
      form,
      authType: "session",
      operationKey: `operazione-${id}-123456`,
    });
  }

  assert.equal(await queuedRequestCount(), 3);
  const restored = new Map();
  globalThis.fetch = async (_endpoint, options) => {
    const label = options.body.get("text");
    restored.set(label, options.body.getAll("files"));
    return new Response("{}", { status: 201 });
  };

  assert.deepEqual(await flushOfflineQueue(), { sent: 3, pending: 0 });
  const tenPhotos = restored.get("bozza con dieci foto");
  assert.equal(tenPhotos.length, 10);
  assert.deepEqual(tenPhotos.map((file) => file.name), photoNames);
  assert.ok(tenPhotos.every((file) => file.type === "image/jpeg"));
  assert.deepEqual(
    await Promise.all(tenPhotos.map((file) => file.text())),
    Array.from({ length: 10 }, (_, index) => `contenuto-foto-${index + 1}`),
  );

  const [video] = restored.get("bozza video");
  assert.equal(video.name, "video-bozza.mp4");
  assert.equal(video.type, "video/mp4");
  assert.equal(await video.text(), "contenuto-video");

  const [photo] = restored.get("bozza foto singola");
  assert.equal(photo.name, "foto-singola.jpg");
  assert.equal(photo.type, "image/jpeg");
  assert.equal(await photo.text(), "contenuto-foto-singola");
});

test("l’utente può ispezionare ed eliminare un singolo invio senza toccare gli altri", async () => {
  const create = async (id, endpoint, attachments) => {
    const form = new FormData();
    form.set("text", id);
    for (let index = 0; index < attachments; index += 1)
      form.append("files", new Blob([String(index)], { type: "image/jpeg" }), `${id}-${index}.jpg`);
    await queueFormRequest({
      id,
      endpoint,
      form,
      authType: "session",
      operationKey: `operazione-${id}-123456`,
    });
  };
  await create("da-eliminare", "/api/posts", 2);
  await create("da-conservare", "/api/comments", 0);

  const listed = new Map((await queuedRequests()).map((item) => [item.id, item]));
  assert.equal(listed.size, 2);
  assert.deepEqual(
    { ...listed.get("da-eliminare"), createdAt: Boolean(listed.get("da-eliminare").createdAt) },
    { id: "da-eliminare", endpoint: "/api/posts", attempts: 0, createdAt: true, attachmentCount: 2 },
  );
  assert.deepEqual(
    { ...listed.get("da-conservare"), createdAt: Boolean(listed.get("da-conservare").createdAt) },
    { id: "da-conservare", endpoint: "/api/comments", attempts: 0, createdAt: true, attachmentCount: 0 },
  );
  assert.equal(await removeQueuedRequest("da-eliminare"), true);
  assert.equal(await queuedRequestCount(), 1);
  assert.equal((await queuedRequests())[0].id, "da-conservare");
  await removeQueuedRequest("da-conservare");
  assert.equal(await queuedRequestCount(), 0);
});
