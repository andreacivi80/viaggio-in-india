import test from "node:test";
import assert from "node:assert/strict";
import { indexedDB } from "fake-indexeddb";

globalThis.indexedDB = indexedDB;
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: { onLine: true },
});
const storage = new Map([["india-session-token", "sessione-tecnica"]]);
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, String(value)),
};

const {
  flushOfflineQueue,
  queuedRequestCount,
  queueFormRequest,
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
