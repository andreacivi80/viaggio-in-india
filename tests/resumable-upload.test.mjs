import test from "node:test";
import assert from "node:assert/strict";
import { File } from "node:buffer";

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};

const { uploadFileResumable } = await import("../src/resumableUpload.js");
const response = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json" },
});

test("il caricamento a parti ritenta un errore temporaneo e arriva al 100%", async () => {
  storage.clear();
  const file = new File([new Uint8Array(9 * 1024 * 1024)], "video-prova.mp4", {
    type: "video/mp4",
    lastModified: 100,
  });
  const partCalls = [];
  let firstPartFailure = true;
  globalThis.fetch = async (url, options = {}) => {
    if (url.endsWith("/uploads/init"))
      return response({ upload_id: "upload-1", part_size: 4 * 1024 * 1024, uploaded_parts: [] }, 201);
    const part = url.match(/\/parts\/(\d+)$/)?.[1];
    if (part) {
      partCalls.push(Number(part));
      if (part === "1" && firstPartFailure) {
        firstPartFailure = false;
        return response({ error: "temporaneo" }, 503);
      }
      return response({ ok: true, part_number: Number(part), etag: `etag-${part}` });
    }
    if (url.endsWith("/complete")) return response({ ok: true, upload_id: "upload-1" });
    throw new Error(`URL inatteso: ${url}`);
  };
  const progress = [];
  const result = await uploadFileResumable({
    file,
    scope: "post",
    visibility: "public",
    headers: { authorization: "Bearer test" },
    onProgress: (value) => progress.push(value),
  });
  assert.equal(result.upload_id, "upload-1");
  assert.deepEqual(partCalls, [1, 1, 2, 3]);
  assert.equal(progress.at(-1), 100);
  assert.equal(storage.size, 0);
});

test("dopo la riapertura riprende dalle parti già confermate", async () => {
  storage.clear();
  const file = new File([new Uint8Array(6 * 1024 * 1024)], "audio-prova.mp3", {
    type: "audio/mpeg",
    lastModified: 200,
  });
  const key = `india-upload:post:family:${file.name}:${file.size}:${file.lastModified}`;
  storage.set(key, JSON.stringify({ upload_id: "upload-ripreso", part_size: 4 * 1024 * 1024, uploaded_parts: [] }));
  const partsSent = [];
  globalThis.fetch = async (url) => {
    if (url.endsWith("/uploads/upload-ripreso"))
      return response({ upload_id: "upload-ripreso", part_size: 4 * 1024 * 1024, uploaded_parts: [{ part_number: 1, part_size: 4 * 1024 * 1024 }] });
    const part = url.match(/\/parts\/(\d+)$/)?.[1];
    if (part) {
      partsSent.push(Number(part));
      return response({ ok: true, part_number: Number(part), etag: `etag-${part}` });
    }
    if (url.endsWith("/complete")) return response({ ok: true, upload_id: "upload-ripreso" });
    throw new Error(`URL inatteso: ${url}`);
  };
  await uploadFileResumable({ file, scope: "post", visibility: "family" });
  assert.deepEqual(partsSent, [2]);
  assert.equal(storage.has(key), false);
});
