import assert from "node:assert/strict";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const headers = {
  authorization: `Bearer ${process.env.QA_SESSION_TOKEN}`,
  "x-device-key": process.env.QA_OWNER_DEVICE_KEY,
};
if (!base || !process.env.QA_SESSION_TOKEN || !process.env.QA_OWNER_DEVICE_KEY)
  throw new Error("Ambiente QA P1 qualità immagini incompleto");

const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
const sourcePath = fileURLToPath(new URL("../public/thailand/bangkok.jpg", import.meta.url));
let postId = "";

const tinyCanvas = createCanvas(12, 8);
const tinyContext = tinyCanvas.getContext("2d");
const gradient = tinyContext.createLinearGradient(0, 0, 12, 8);
gradient.addColorStop(0, "#ff9933");
gradient.addColorStop(0.5, "#ffffff");
gradient.addColorStop(1, "#138808");
tinyContext.fillStyle = gradient;
tinyContext.fillRect(0, 0, 12, 8);
const reducedQuality = tinyCanvas.toBuffer("image/jpeg", 18);

const sourceImage = await loadImage(await readFile(sourcePath));
const blurredCanvas = createCanvas(320, 240);
const blurredContext = blurredCanvas.getContext("2d");
blurredContext.filter = "blur(14px)";
blurredContext.drawImage(sourceImage, -24, -18, 368, 276);
const blurredPhoto = blurredCanvas.toBuffer("image/jpeg", 72);

try {
  const form = new FormData();
  form.set("visibility", "public");
  form.set("day_index", "0");
  form.set("text", `Qualità immagini QA ${process.env.QA_RUN_ID}`);
  form.append("files", new Blob([reducedQuality], { type: "image/jpeg" }), "foto-qualita-ridotta-12x8.jpg");
  form.append("files", new Blob([blurredPhoto], { type: "image/jpeg" }), "foto-sfocata-320x240.jpg");
  const response = await request("/api/posts", {
    method: "POST",
    headers: { ...headers, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
    body: form,
  });
  if (response.status !== 201)
    assert.fail(`creazione post qualità immagini: HTTP ${response.status} ${await response.text()}`);
  const post = await response.json();
  postId = post.id;
  assert.equal(post.media.length, 2);

  const returned = await Promise.all(post.media.map(async (media) => {
    const mediaResponse = await request(media.media_url, { headers });
    assert.equal(mediaResponse.status, 200);
    assert.match(mediaResponse.headers.get("content-type") || "", /^image\/jpeg/);
    const bytes = Buffer.from(await mediaResponse.arrayBuffer());
    const decoded = await loadImage(bytes);
    return { name: media.name, width: decoded.width, height: decoded.height, bytes: bytes.length };
  }));
  assert.deepEqual(returned.map(({ name, width, height }) => ({ name, width, height })), [
    { name: "foto-qualita-ridotta-12x8.jpg", width: 12, height: 8 },
    { name: "foto-sfocata-320x240.jpg", width: 320, height: 240 },
  ]);
  assert.ok(returned.every((item) => item.bytes > 100));
  console.log("P1_IMAGE_QUALITY=2/2 upload; 2/2 reopen; 2/2 decode");
} finally {
  if (postId)
    assert.equal((await request(`/api/posts/${postId}`, { method: "DELETE", headers })).status, 200);
}
