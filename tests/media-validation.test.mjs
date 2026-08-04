import test from "node:test";
import assert from "node:assert/strict";
import { validateMediaSelection } from "../src/mediaValidation.js";

const file = (name, type, size) => ({ name, type, size });

test("la selezione mobile accetta foto, HEIC, video e audio", () => {
  for (const item of [
    file("foto.png", "image/png", 1024),
    file("foto.heic", "", 1024),
    file("video.mov", "video/quicktime", 1024),
    file("audio.m4a", "audio/mp4", 1024),
  ]) assert.equal(validateMediaSelection(item), "");
});

test("la selezione mobile spiega formato, nome e dimensione non validi", () => {
  assert.match(validateMediaSelection(file("documento.pdf", "application/pdf", 2048)), /documento\.pdf.*application\/pdf.*0\.0 MB/);
  assert.match(validateMediaSelection(file("vuoto.mp4", "video/mp4", 0)), /vuoto/);
  assert.match(validateMediaSelection(file("enorme.jpg", "image/jpeg", 121 * 1024 * 1024)), /121\.0 MB.*120 MB/);
  assert.match(validateMediaSelection(file("enorme.mp4", "video/mp4", 501 * 1024 * 1024)), /501\.0 MB.*500 MB/);
});
