import { test, expect, devices } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const sessionToken = process.env.QA_UI_SESSION_TOKEN;
const profileId = process.env.QA_UI_PROFILE_ID;
const profileName = process.env.QA_UI_PROFILE_NAME;
const deviceKey = process.env.QA_UI_DEVICE_KEY;
const videoPath = fileURLToPath(new URL("../public/video/india-insieme-demo.webm", import.meta.url));

test.skip(
  !baseUrl || !sessionToken || !profileId || !profileName || !deviceKey || !isSafeMutationTarget(baseUrl),
  "Sessione e URL QA richiesti",
);
test.use({ ...devices["Galaxy S9+"], serviceWorkers: "block" });

test("lo stato di un upload reale è annunciato semanticamente fino al 100%", async ({ browser }) => {
  test.setTimeout(150_000);
  const context = await browser.newContext({
    ...devices["Galaxy S9+"],
    viewport: { width: 412, height: 915 },
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

  const page = await context.newPage();
  const marker = `Screen reader upload QA ${process.env.QA_RUN_ID}`;
  let createdPostId = "";
  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".accessPill")).toContainText("Proprietario", { timeout: 20_000 });
    await page.route("**/api/uploads/*/parts/*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 650));
      await route.continue();
    });
    await page.getByRole("button", { name: "Pubblica", exact: true }).tap();
    const sheet = page.locator(".uploadSheet");
    const original = await readFile(videoPath);
    const video = Buffer.concat([original, Buffer.alloc(9 * 1024 * 1024 - original.length)]);
    await sheet.locator('input[accept="video/*,.mov,.mp4"]').setInputFiles({
      name: "video-screen-reader.webm",
      mimeType: "video/webm",
      buffer: video,
    });
    await sheet.getByPlaceholder("Racconta questo momento…").fill(marker);
    await page.evaluate(() => {
      window.__qaUploadAnnouncements = [];
      const observer = new MutationObserver(() => {
        const value = document.querySelector(".uploadStatus[role='status']")?.textContent?.trim();
        if (value && window.__qaUploadAnnouncements.at(-1) !== value)
          window.__qaUploadAnnouncements.push(value);
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      window.__qaUploadObserver = observer;
    });
    const createResponse = page.waitForResponse(
      (response) => response.url().includes("/api/posts") && response.request().method() === "POST",
    );
    await sheet.locator(".composerActions > button").tap();
    const status = page.getByRole("status").filter({ hasText: /Caricamento protetto/ });
    await expect(status).toBeVisible();
    await expect(status).toHaveAttribute("role", "status");
    const response = await createResponse;
    expect(response.status()).toBe(201);
    createdPostId = (await response.json()).id;
    const announcements = await page.evaluate(() => {
      window.__qaUploadObserver?.disconnect();
      return window.__qaUploadAnnouncements || [];
    });
    expect(announcements.some((text) => /0%/.test(text))).toBe(true);
    expect(announcements.some((text) => /100%/.test(text))).toBe(true);
    const percentages = announcements
      .map((text) => Number(text.match(/(\d+)%/)?.[1]))
      .filter(Number.isFinite);
    expect(percentages.length).toBeGreaterThanOrEqual(2);
    expect(Math.max(...percentages)).toBe(100);
  } finally {
    const activeToken = await page.evaluate(() => localStorage.getItem("india-session-token")).catch(() => sessionToken);
    if (createdPostId)
      await fetch(`${baseUrl}/api/posts/${encodeURIComponent(createdPostId)}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${activeToken || sessionToken}`, "x-device-key": deviceKey },
      }).catch(() => {});
    await context.close();
  }
});
