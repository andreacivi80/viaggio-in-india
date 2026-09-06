import { test, expect, devices } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const sessionToken = process.env.QA_UI_SESSION_TOKEN;
const deviceKey = process.env.QA_UI_DEVICE_KEY;
const profileId = process.env.QA_UI_PROFILE_ID;
const mp4Path = fileURLToPath(new URL("./fixtures/telefono-reale.mp4", import.meta.url));
const movPath = fileURLToPath(new URL("./fixtures/telefono-reale.mov", import.meta.url));
test.skip(!baseUrl || !sessionToken || !deviceKey || !profileId || !isSafeMutationTarget(baseUrl),
  "Sessione personale e ambiente QA isolato richiesti");
test.use({ serviceWorkers: "block" });

const paddedVideo = async (path) => {
  const source = await readFile(path);
  const target = 9 * 1024 * 1024;
  return Buffer.concat([source, Buffer.alloc(target - source.length)]);
};

test("un Samsung con batteria bassa seleziona, carica e riproduce MOV e MP4", async ({ browser }) => {
  test.setTimeout(180_000);
  const context = await browser.newContext({
    ...devices["Galaxy S9+"],
    viewport: { width: 412, height: 915 },
    serviceWorkers: "block",
  });
  await context.addInitScript(({ token, key, id }) => {
    localStorage.setItem("india-session-token", token);
    localStorage.setItem("india-device-key", key);
    localStorage.setItem("india-profile-id", id);
    Object.defineProperty(navigator, "getBattery", {
      configurable: true,
      value: async () => ({ level: 0.08, charging: false }),
    });
  }, { token: sessionToken, key: deviceKey, id: profileId });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");
  let uploadedBytes = 0;
  page.on("request", (request) => {
    if (/\/api\/uploads\/[^/]+\/parts\/\d+$/.test(request.url()))
      uploadedBytes += request.postDataBuffer()?.byteLength || 0;
  });
  await page.route("**/api/uploads/*/parts/*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 180));
    await route.continue();
  });

  let postId = "";
  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".accessPill")).not.toContainText("Pubblico");
    const batteryBefore = await page.evaluate(async () => {
      const battery = await navigator.getBattery();
      return { level: battery.level, charging: battery.charging };
    });
    expect(batteryBefore).toEqual({ level: 0.08, charging: false });
    const metricsBefore = await cdp.send("Performance.getMetrics");
    const startedAt = Date.now();

    await page.getByRole("button", { name: "Pubblica", exact: true }).tap();
    const sheet = page.locator(".uploadSheet");
    const input = sheet.locator('input[accept="video/*,.mov,.mp4"]');
    await input.setInputFiles([
      { name: "telefono-reale.mp4", mimeType: "video/mp4", buffer: await paddedVideo(mp4Path) },
      { name: "telefono-reale.mov", mimeType: "video/quicktime", buffer: await paddedVideo(movPath) },
    ]);
    await expect(sheet.getByText("2 allegati pronti")).toBeVisible();
    await expect(sheet.locator('.attachmentPreviews video')).toHaveCount(2);
    const marker = `MOV MP4 batteria QA ${process.env.QA_RUN_ID}`;
    await sheet.getByPlaceholder("Racconta questo momento…").fill(marker);
    const published = page.waitForResponse(
      (response) => response.url().endsWith("/api/posts") && response.request().method() === "POST",
    );
    await sheet.locator(".composerActions > button").tap();
    const response = await published;
    expect(response.status()).toBe(201);
    postId = (await response.json()).id;

    const card = page.locator(".post").filter({ hasText: marker });
    await expect(card).toBeVisible({ timeout: 30_000 });
    const players = card.locator("video");
    await expect(players).toHaveCount(2);
    for (let index = 0; index < 2; index += 1) {
      const player = players.nth(index);
      await expect.poll(() => player.evaluate((element) => element.duration), { timeout: 30_000 }).toBeGreaterThan(0.5);
      await player.evaluate(async (element) => { element.muted = true; await element.play(); });
      await expect.poll(() => player.evaluate((element) => element.currentTime), { timeout: 20_000 }).toBeGreaterThan(0.1);
      await player.evaluate((element) => element.pause());
    }

    const batteryAfter = await page.evaluate(async () => {
      const battery = await navigator.getBattery();
      return { level: battery.level, charging: battery.charging };
    });
    const metricsAfter = await cdp.send("Performance.getMetrics");
    const metric = (metrics, name) => metrics.metrics.find((item) => item.name === name)?.value || 0;
    const measurement = {
      batteryBefore,
      batteryAfter,
      elapsedMs: Date.now() - startedAt,
      uploadedBytes,
      taskDurationSeconds: metric(metricsAfter, "TaskDuration") - metric(metricsBefore, "TaskDuration"),
    };
    expect(measurement.batteryAfter).toEqual({ level: 0.08, charging: false });
    expect(measurement.uploadedBytes).toBeGreaterThanOrEqual(18 * 1024 * 1024);
    expect(measurement.elapsedMs).toBeGreaterThan(500);
    expect(measurement.taskDurationSeconds).toBeGreaterThanOrEqual(0);
    console.log(`BATTERY_UPLOAD_MEASUREMENT=${JSON.stringify(measurement)}`);
  } finally {
    if (postId) await page.request.delete(`${baseUrl}/api/posts/${postId}`, {
      headers: { authorization: `Bearer ${sessionToken}`, "x-device-key": deviceKey },
    }).catch(() => {});
    await context.close();
  }
});
