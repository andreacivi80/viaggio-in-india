import test from "node:test";
import assert from "node:assert/strict";
import {
  PHOTO_COMPRESSION_THRESHOLD,
  compressMobilePhoto,
  scaledPhotoSize,
  shouldCompressPhoto,
} from "../src/mediaCompression.js";

test("T-0146: il ridimensionamento conserva sempre le proporzioni senza ritaglio", () => {
  assert.deepEqual(scaledPhotoSize(6000, 4000), { width: 2560, height: 1707 });
  assert.deepEqual(scaledPhotoSize(3000, 6000), { width: 1280, height: 2560 });
  assert.deepEqual(scaledPhotoSize(1200, 800), { width: 1200, height: 800 });
});

test("solo fotografie grandi e comprimibili entrano nel percorso di compressione", () => {
  assert.equal(shouldCompressPhoto(new Blob([new Uint8Array(PHOTO_COMPRESSION_THRESHOLD + 1)], { type: "image/jpeg" })), true);
  assert.equal(shouldCompressPhoto(new Blob([new Uint8Array(100)], { type: "image/jpeg" })), false);
  assert.equal(shouldCompressPhoto(new Blob([new Uint8Array(PHOTO_COMPRESSION_THRESHOLD + 1)], { type: "image/png" })), false);
});

test("una foto grande viene ricodificata, orientata e ridotta prima dell’upload", async () => {
  const original = Object.assign(
    new Blob([new Uint8Array(PHOTO_COMPRESSION_THRESHOLD + 100)], { type: "image/jpeg" }),
    { name: "vacanza.JPEG", lastModified: 123 },
  );
  let bitmapOptions;
  let drawArguments;
  const output = await compressMobilePhoto(original, {
    createBitmap: async (_file, options) => {
      bitmapOptions = options;
      return { width: 6000, height: 4000, close() {} };
    },
    canvasFactory: () => ({
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: (...args) => { drawArguments = args; } }),
      toBlob: (callback) => callback(new Blob([new Uint8Array(500_000)], { type: "image/jpeg" })),
    }),
    fileFactory: (parts, name, options) => Object.assign(new Blob(parts, options), { name, lastModified: options.lastModified }),
  });
  assert.deepEqual(bitmapOptions, { imageOrientation: "from-image" });
  assert.deepEqual(drawArguments.slice(1), [0, 0, 2560, 1707]);
  assert.equal(output.name, "vacanza.jpg");
  assert.equal(output.type, "image/jpeg");
  assert.ok(output.size < original.size);
});

test("un errore di decodifica conserva sempre il file originale", async () => {
  const original = Object.assign(
    new Blob([new Uint8Array(PHOTO_COMPRESSION_THRESHOLD + 1)], { type: "image/jpeg" }),
    { name: "foto.jpg" },
  );
  const result = await compressMobilePhoto(original, {
    createBitmap: async () => { throw new Error("decoder non disponibile"); },
  });
  assert.equal(result, original);
});
