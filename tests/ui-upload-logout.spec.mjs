import { test, expect, devices } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const sessionToken = process.env.QA_UI_SESSION_TOKEN;
const profileId = process.env.QA_UI_PROFILE_ID;
const profileName = process.env.QA_UI_PROFILE_NAME;
const deviceKey = process.env.QA_UI_DEVICE_KEY;
const observerToken = process.env.QA_SECOND_SESSION_TOKEN;
const observerDeviceKey = process.env.QA_OTHER_DEVICE_KEY;
const videoPath = fileURLToPath(new URL("../public/video/india-insieme-demo.webm", import.meta.url));

test.skip(
  !baseUrl || !sessionToken || !profileId || !profileName || !deviceKey || !observerToken || !observerDeviceKey || !isSafeMutationTarget(baseUrl),
  "Sessioni e URL QA richiesti",
);
test.use({ serviceWorkers: "block" });

test("bloccare il dispositivo interrompe il video in caricamento senza pubblicarlo", async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({
    ...devices["Galaxy S9+"],
    viewport: { width: 360, height: 800 },
    serviceWorkers: "block",
  });
  await context.addInitScript(({ token, id, name, key }) => {
    localStorage.setItem("india-session-token", token);
    localStorage.setItem("india-profile-id", id);
    localStorage.setItem("india-profile-name", name);
    localStorage.setItem("india-visitor-name", name);
    localStorage.setItem("india-role", "traveler");
    localStorage.setItem("india-device-key", key);
  }, { token: sessionToken, id: profileId, name: profileName, key: deviceKey });

  const uploader = await context.newPage();
  const marker = `Logout durante upload ${process.env.QA_RUN_ID}`;
  try {
    await uploader.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await expect(uploader.locator(".accessPill")).toContainText("Proprietario", { timeout: 20_000 });
    await uploader.route("**/api/uploads/*/parts/*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 8_000));
      await route.continue().catch(() => {});
    });

    const openComposer = uploader.getByRole("button", { name: "Pubblica", exact: true });
    await expect(openComposer).toBeVisible();
    await openComposer.tap();
    const sheet = uploader.locator(".uploadSheet");
    if (!(await sheet.isVisible())) await openComposer.tap();
    await expect(sheet).toBeVisible();
    const originalVideo = await readFile(videoPath);
    const largeVideo = Buffer.concat([originalVideo, Buffer.alloc(9 * 1024 * 1024 - originalVideo.length)]);
    await sheet.locator('input[accept="video/*,.mov,.mp4"]').setInputFiles({
      name: "video-interrotto.webm",
      mimeType: "video/webm",
      buffer: largeVideo,
    });
    await sheet.getByPlaceholder("Racconta questo momento…").fill(marker);
    const firstPart = uploader.waitForRequest((request) => /\/api\/uploads\/[^/]+\/parts\/1$/.test(request.url()));
    await sheet.locator(".composerActions > button").tap();
    await firstPart;

    const logout = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: { authorization: `Bearer ${sessionToken}`, "x-device-key": deviceKey },
    });
    expect(logout.status).toBe(200);
    await uploader.evaluate(() => {
      localStorage.removeItem("india-session-token");
      dispatchEvent(new StorageEvent("storage", { key: "india-session-token", oldValue: "attivo", newValue: null }));
    });
    await expect.poll(() => uploader.evaluate(() => localStorage.getItem("india-session-token"))).toBeNull();
    await expect(sheet.getByText("Caricamento interrotto dal blocco del dispositivo.")).toBeVisible({ timeout: 20_000 });

    const stateResponse = await fetch(`${baseUrl}/api/state`, {
      headers: { authorization: `Bearer ${observerToken}`, "x-device-key": observerDeviceKey },
    });
    expect(stateResponse.status).toBe(200);
    const state = await stateResponse.json();
    expect(state.posts.some((post) => post.text === marker)).toBe(false);
  } finally {
    await context.close();
  }
});
