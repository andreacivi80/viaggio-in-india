import { test, expect, devices } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const sessionToken = process.env.QA_UI_SESSION_TOKEN;
const deviceKey = process.env.QA_UI_DEVICE_KEY;
const videoPath = fileURLToPath(new URL("../public/video/india-insieme-demo.webm", import.meta.url));
test.skip(!baseUrl || !sessionToken || !deviceKey || !isSafeMutationTarget(baseUrl), "Sessione e URL QA richiesti");
test.use({ serviceWorkers: "block" });

test("un video reale oltre 25 MB viene caricato e riprodotto con rete lenta", async ({ browser }) => {
  test.setTimeout(180_000);
  const authHeaders = { authorization: `Bearer ${sessionToken}`, "x-device-key": deviceKey };
  const original = await readFile(videoPath);
  const targetSize = 26 * 1024 * 1024;
  const video = Buffer.concat([original, Buffer.alloc(targetSize - original.length)]);
  let postId = "";
  let uploadId = "";
  try {
    const init = await fetch(`${baseUrl}/api/uploads/init`, {
      method: "POST",
      headers: { ...authHeaders, "content-type": "application/json" },
      body: JSON.stringify({
        scope: "post",
        visibility: "public",
        file_name: "video-reale-oltre-25mb.webm",
        file_size: video.length,
        content_type: "video/webm",
      }),
    });
    expect(init.status).toBe(201);
    const upload = await init.json();
    uploadId = upload.upload_id;
    let partNumber = 1;
    for (let offset = 0; offset < video.length; offset += upload.part_size) {
      const part = await fetch(`${baseUrl}/api/uploads/${uploadId}/parts/${partNumber}`, {
        method: "PUT",
        headers: { ...authHeaders, "content-type": "application/octet-stream" },
        body: video.subarray(offset, Math.min(video.length, offset + upload.part_size)),
      });
      expect(part.status).toBe(200);
      partNumber += 1;
    }
    expect(partNumber - 1).toBe(7);
    const complete = await fetch(`${baseUrl}/api/uploads/${uploadId}/complete`, { method: "POST", headers: authHeaders });
    expect(complete.status).toBe(200);

    const marker = `Video lento 26 MB QA ${process.env.QA_RUN_ID}`;
    const form = new FormData();
    form.set("visibility", "public");
    form.set("day_index", "0");
    form.set("text", marker);
    form.set("upload_ids", JSON.stringify([uploadId]));
    const create = await fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      headers: { ...authHeaders, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
      body: form,
    });
    expect(create.status).toBe(201);
    const post = await create.json();
    postId = post.id;
    expect(post.media[0].size).toBe(targetSize);

    const context = await browser.newContext({
      ...devices["Galaxy S9+"],
      viewport: { width: 360, height: 740 },
      serviceWorkers: "block",
    });
    try {
      const page = await context.newPage();
      await page.route("**/api/media/**", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1_200));
        await route.continue();
      });
      await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
      const card = page.locator(".post").filter({ hasText: marker });
      await expect(card).toBeVisible({ timeout: 30_000 });
      const player = card.locator("video");
      await expect(player).toBeVisible();
      await player.evaluate(async (element) => {
        element.muted = true;
        await element.play();
      });
      await expect.poll(() => player.evaluate((element) => element.currentTime), { timeout: 30_000 }).toBeGreaterThan(0.2);
      await player.evaluate((element) => element.pause());
    } finally {
      await context.close();
    }
  } finally {
    if (postId)
      await fetch(`${baseUrl}/api/posts/${postId}`, { method: "DELETE", headers: authHeaders }).catch(() => {});
    else if (uploadId)
      await fetch(`${baseUrl}/api/uploads/${uploadId}`, { method: "DELETE", headers: authHeaders }).catch(() => {});
  }
});
