import test from "node:test";
import assert from "node:assert/strict";
import {
  VIDEO_COMPRESSION_THRESHOLD,
  compressMobileVideo,
  shouldCompressVideo,
} from "../src/videoCompression.js";

test("solo i video oltre 25 MB propongono la riduzione", () => {
  assert.equal(shouldCompressVideo(new Blob([new Uint8Array(VIDEO_COMPRESSION_THRESHOLD)], { type: "video/mp4" })), false);
  assert.equal(shouldCompressVideo(new Blob([new Uint8Array(VIDEO_COMPRESSION_THRESHOLD + 1)], { type: "video/mp4" })), true);
  assert.equal(shouldCompressVideo(new Blob([new Uint8Array(VIDEO_COMPRESSION_THRESHOLD + 1)], { type: "image/jpeg" })), false);
});

test("un browser senza ricodifica conserva l'originale", async () => {
  const video = new Blob([new Uint8Array(VIDEO_COMPRESSION_THRESHOLD + 1)], { type: "video/mp4" });
  assert.equal(await compressMobileVideo(video, { Recorder: undefined }), video);
});
