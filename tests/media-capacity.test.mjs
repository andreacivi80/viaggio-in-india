import test from "node:test";
import assert from "node:assert/strict";
import { readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const average = (values) => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
const sizesFor = async (relativeDirectory, extensions) => {
  const directory = path.join(root, relativeDirectory);
  const names = (await readdir(directory)).filter((name) => extensions.includes(path.extname(name).toLowerCase()));
  return Promise.all(names.map(async (name) => (await stat(path.join(directory, name))).size));
};

test("misura il peso medio dei media reali usati dai collaudi", async () => {
  const photos = await sizesFor("public/thailand", [".jpg", ".jpeg", ".png"]);
  const audio = await sizesFor("public/audio", [".wav", ".mp3", ".m4a", ".aac", ".ogg"]);
  const publicVideos = await sizesFor("public/video", [".webm", ".mp4", ".mov"]);
  const mobileVideos = await sizesFor("tests/fixtures", [".mp4", ".mov"]);
  const videos = [...publicVideos, ...mobileVideos];

  assert.ok(photos.length >= 10, "campione fotografico insufficiente");
  assert.ok(audio.length >= 1, "campione audio assente");
  assert.ok(videos.length >= 3, "campione video insufficiente");
  assert.ok(photos.every((size) => size > 0 && size <= 120 * 1024 * 1024));
  assert.ok(audio.every((size) => size > 0 && size <= 120 * 1024 * 1024));
  assert.ok(videos.every((size) => size > 0 && size <= 500 * 1024 * 1024));

  const measurement = {
    photoSamples: photos.length,
    averagePhotoBytes: average(photos),
    audioSamples: audio.length,
    averageAudioBytes: average(audio),
    videoSamples: videos.length,
    averageVideoBytes: average(videos),
  };
  assert.ok(measurement.averagePhotoBytes > 0);
  assert.ok(measurement.averageAudioBytes > 0);
  assert.ok(measurement.averageVideoBytes > 0);
  console.log(`MEDIA_CAPACITY=${JSON.stringify(measurement)}`);
});
