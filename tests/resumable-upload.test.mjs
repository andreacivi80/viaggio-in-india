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

for (const interruptedAt of [25, 50, 90]) {
  test(`un upload interrotto al ${interruptedAt}% riprende senza reinviare le parti confermate`, async () => {
    storage.clear();
    const partSize = 100;
    const totalParts = 20;
    const completedBeforeFailure = interruptedAt === 25 ? 5 : interruptedAt === 50 ? 10 : 18;
    const file = new File([new Uint8Array(partSize * totalParts)], `video-${interruptedAt}.mp4`, {
      type: "video/mp4",
      lastModified: interruptedAt,
    });
    const uploadId = `upload-${interruptedAt}`;
    const confirmed = new Set();
    const firstRunParts = [];
    let interrupt = true;
    globalThis.fetch = async (url) => {
      if (url.endsWith("/uploads/init"))
        return response({ upload_id: uploadId, part_size: partSize, uploaded_parts: [] }, 201);
      if (url.endsWith(`/uploads/${uploadId}`))
        return response({
          upload_id: uploadId,
          part_size: partSize,
          uploaded_parts: [...confirmed].map((part_number) => ({ part_number, part_size: partSize })),
        });
      const part = Number(url.match(/\/parts\/(\d+)$/)?.[1] || 0);
      if (part) {
        if (interrupt) firstRunParts.push(part);
        if (interrupt && part === completedBeforeFailure + 1)
          return response({ error: "rete interrotta" }, 400);
        confirmed.add(part);
        return response({ ok: true, part_number: part, part_size: partSize, etag: `etag-${part}` });
      }
      if (url.endsWith("/complete")) return response({ ok: true, upload_id: uploadId });
      throw new Error(`URL inatteso: ${url}`);
    };

    await assert.rejects(
      uploadFileResumable({ file, scope: "post", visibility: "public" }),
      /rete interrotta/,
    );
    assert.equal(confirmed.size, completedBeforeFailure);
    assert.equal(storage.size, 1, "il manifesto di ripresa deve sopravvivere all’interruzione");

    interrupt = false;
    const progress = [];
    const result = await uploadFileResumable({
      file,
      scope: "post",
      visibility: "public",
      onProgress: (value) => progress.push(value),
    });
    assert.equal(result.upload_id, uploadId);
    assert.equal(confirmed.size, totalParts);
    assert.deepEqual(firstRunParts, Array.from({ length: completedBeforeFailure + 1 }, (_, index) => index + 1));
    assert.equal(progress.at(-1), 100);
    assert.equal(storage.size, 0);
  });
}

test("il blocco del dispositivo interrompe subito un upload senza completare il post", async () => {
  storage.clear();
  const file = new File([new Uint8Array(9 * 1024 * 1024)], "video-logout.mp4", {
    type: "video/mp4",
    lastModified: 500,
  });
  const controller = new AbortController();
  let completeCalls = 0;
  globalThis.fetch = async (url, options = {}) => {
    if (url.endsWith("/uploads/init"))
      return response({ upload_id: "upload-logout", part_size: 4 * 1024 * 1024, uploaded_parts: [] }, 201);
    if (/\/parts\/1$/.test(url)) {
      setTimeout(() => controller.abort(), 10);
      return new Promise((resolve, reject) => {
        options.signal.addEventListener("abort", () => reject(new DOMException("interrotto", "AbortError")), { once: true });
      });
    }
    if (url.endsWith("/complete")) {
      completeCalls += 1;
      return response({ ok: true });
    }
    throw new Error(`URL inatteso: ${url}`);
  };
  await assert.rejects(
    uploadFileResumable({ file, scope: "post", visibility: "public", signal: controller.signal }),
    (error) => error?.name === "AbortError",
  );
  assert.equal(completeCalls, 0);
  assert.equal(storage.size, 1, "il manifesto resta disponibile per una ripresa autorizzata");
});
