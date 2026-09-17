import { test, expect, devices } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const profileName = process.env.QA_UI_PROFILE_NAME;
const inviteToken = process.env.QA_UI_INVITE_TOKEN;
const videoPath = fileURLToPath(new URL("./fixtures/telefono-reale.mp4", import.meta.url));

test.skip(!profileName || !inviteToken || !isSafeMutationTarget(baseUrl), "Profilo QA e invito richiesti");
test.use({ ...devices["Galaxy S9+"], serviceWorkers: "block" });

test("un video oltre 25 MB viene ridotto su richiesta e resta riproducibile", async ({ page }) => {
  test.setTimeout(150_000);
  let postId = "";
  await page.goto(`${baseUrl}/#invite=${encodeURIComponent(inviteToken)}`, { waitUntil: "networkidle" });
  await expect.poll(() => page.evaluate(() => localStorage.getItem("india-session-token"))).toBeTruthy();
  const sessionToken = await page.evaluate(() => localStorage.getItem("india-session-token"));
  const deviceKey = await page.evaluate(() => localStorage.getItem("india-device-key"));
  const source = await readFile(videoPath);
  const originalSize = 26 * 1024 * 1024;
  const padded = Buffer.concat([source, Buffer.alloc(originalSize - source.length)]);
  try {
    await page.getByRole("button", { name: "Pubblica", exact: true }).tap();
    const sheet = page.locator(".uploadSheet");
    await sheet.locator('input[accept="video/*,.mov,.mp4"]').setInputFiles({
      name: "video-percorso-completo.mp4",
      mimeType: "video/mp4",
      buffer: padded,
    });
    await expect(sheet.getByText("1 allegati pronti")).toBeVisible();
    await sheet.getByRole("button", { name: /Riduci dimensione/ }).tap();
    await expect(sheet.locator(".photoEditStatus")).not.toHaveText("Preparo il video…", { timeout: 60_000 });
    console.log(`VIDEO_COMPRESSION_STATUS=${await sheet.locator(".photoEditStatus").textContent()}`);
    await expect(sheet.getByText("Video ridotto: originale invariato sul telefono", { exact: true }))
      .toBeVisible({ timeout: 60_000 });
    await expect(sheet.getByText(/video-percorso-completo-ridotto\.(webm|mp4)/)).toBeVisible();
    const displayedSize = await sheet.locator(".attachmentPreviews article > small").first().textContent();
    expect(Number.parseFloat(displayedSize)).toBeLessThan(25);

    const marker = `Compressione video QA ${Date.now()}`;
    await sheet.getByPlaceholder("Racconta questo momento…").fill(marker);
    const responsePromise = page.waitForResponse(
      (response) => response.url().endsWith("/api/posts") && response.request().method() === "POST",
      { timeout: 90_000 },
    );
    await sheet.locator(".composerActions > button").tap();
    const response = await responsePromise;
    expect(response.status()).toBe(201);
    const result = await response.json();
    postId = result.id;
    expect(result.media).toHaveLength(1);
    expect(result.media[0].size).toBeLessThan(originalSize);
    const player = page.locator(".post").filter({ hasText: marker }).locator("video");
    await expect(player).toBeVisible();
    await expect.poll(() => player.evaluate((element) => element.duration)).toBeGreaterThan(0);
    await player.evaluate(async (element) => { element.muted = true; await element.play(); });
    await expect.poll(() => player.evaluate((element) => element.currentTime)).toBeGreaterThan(0.1);
  } finally {
    if (postId)
      await page.request.delete(`${baseUrl}/api/posts/${encodeURIComponent(postId)}`, {
        headers: { authorization: `Bearer ${sessionToken}`, "x-device-key": deviceKey },
      }).catch(() => {});
  }
});
