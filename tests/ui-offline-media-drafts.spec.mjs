import { test, expect, devices } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const sessionToken = process.env.QA_UI_SESSION_TOKEN;
const profileId = process.env.QA_UI_PROFILE_ID;
const profileName = process.env.QA_UI_PROFILE_NAME;
const deviceKey = process.env.QA_UI_DEVICE_KEY;
const photoPath = fileURLToPath(new URL("../public/thailand/bangkok.jpg", import.meta.url));
const videoPath = fileURLToPath(new URL("../public/video/india-insieme-demo.webm", import.meta.url));

test.skip(
  !baseUrl || !sessionToken || !profileId || !profileName || !deviceKey || !isSafeMutationTarget(baseUrl),
  "Sessione e URL QA richiesti",
);
test.use({ ...devices["Galaxy S9+"], serviceWorkers: "block" });

const offlineCount = (page) => page.evaluate(() => new Promise((resolve, reject) => {
  const request = indexedDB.open("india-insieme-offline", 1);
  request.onerror = () => reject(request.error);
  request.onsuccess = () => {
    const db = request.result;
    const tx = db.transaction("requests", "readonly");
    const count = tx.objectStore("requests").count();
    count.onsuccess = () => resolve(count.result);
    count.onerror = () => reject(count.error);
  };
}));

test("tre bozze multimediali reali sopravvivono offline e si riaprono dopo il retry", async ({ browser }) => {
  test.setTimeout(180_000);
  const context = await browser.newContext({
    ...devices["Galaxy S9+"],
    viewport: { width: 412, height: 915 },
    serviceWorkers: "block",
  });
  await context.addInitScript(({ token, id, name, key }) => {
    if (!localStorage.getItem("india-session-token")) {
      localStorage.setItem("india-session-token", token);
      localStorage.setItem("india-profile-id", id);
      localStorage.setItem("india-profile-name", name);
      localStorage.setItem("india-device-key", key);
    }
  }, { token: sessionToken, id: profileId, name: profileName, key: deviceKey });

  let page = await context.newPage();
  let activeToken = sessionToken;
  const suffix = `${process.env.QA_RUN_ID}-${Date.now()}`;
  const markers = {
    photos: `Bozza dieci foto QA ${suffix}`,
    video: `Bozza video QA ${suffix}`,
    photo: `Bozza foto QA ${suffix}`,
  };
  const createdIds = [];
  const photo = await readFile(photoPath);
  const video = await readFile(videoPath);
  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".accessPill")).toContainText(profileName.split(" ")[0]);
    await context.setOffline(true);

    const saveDraft = async (marker, inputSelector, files, expectedCount) => {
      await page.getByRole("button", { name: "Pubblica", exact: true }).tap();
      const sheet = page.locator(".uploadSheet");
      await sheet.getByPlaceholder("Racconta questo momento…").fill(marker);
      await sheet.locator(inputSelector).first().setInputFiles(files);
      await expect(sheet.getByText(`${expectedCount} allegati pronti`)).toBeVisible();
      await sheet.locator(".composerActions > button").tap();
      await expect(page.getByText("Salvato nel telefono. Sarà pubblicato automaticamente quando torna la rete.")).toBeVisible();
    };

    await saveDraft(
      markers.photos,
      'input[accept^="image"]',
      Array.from({ length: 10 }, (_, index) => ({
        name: `foto-reale-${index + 1}.jpg`,
        mimeType: "image/jpeg",
        buffer: photo,
      })),
      10,
    );
    await saveDraft(
      markers.video,
      'input[accept^="video"]',
      { name: "video-reale.webm", mimeType: "video/webm", buffer: video },
      1,
    );
    await saveDraft(
      markers.photo,
      'input[accept^="image"]',
      { name: "foto-reale-singola.jpg", mimeType: "image/jpeg", buffer: photo },
      1,
    );
    await expect.poll(() => offlineCount(page)).toBe(3);

    activeToken = await page.evaluate(() => localStorage.getItem("india-session-token"));
    expect(activeToken).toBeTruthy();
    await page.close();
    await context.setOffline(false);
    page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await expect.poll(() => offlineCount(page), { timeout: 45_000 }).toBe(0);

    const stateResponse = await page.request.get(`${baseUrl}/api/state`, {
      headers: { authorization: `Bearer ${activeToken}`, "x-device-key": deviceKey },
    });
    expect(stateResponse.status()).toBe(200);
    const state = await stateResponse.json();
    const byMarker = new Map(state.posts.filter((post) => Object.values(markers).includes(post.text)).map((post) => [post.text, post]));
    expect(byMarker.size).toBe(3);
    expect(byMarker.get(markers.photos).media).toHaveLength(10);
    expect(byMarker.get(markers.video).media).toHaveLength(1);
    expect(byMarker.get(markers.video).media[0].media_type).toMatch(/^video\//);
    expect(byMarker.get(markers.photo).media).toHaveLength(1);
    expect(byMarker.get(markers.photo).media[0].media_type).toBe("image/jpeg");
    createdIds.push(...byMarker.values().map((post) => post.id));

    await page.reload({ waitUntil: "domcontentloaded" });
    const photosPost = page.locator(".post").filter({ hasText: markers.photos });
    await expect(photosPost).toBeVisible();
    await photosPost.getByRole("button", { name: "Apri fotografia 1", exact: true }).tap();
    await expect(page.getByRole("dialog", { name: "Fotografia aperta" })).toBeVisible();
    await page.getByRole("button", { name: "Chiudi foto" }).tap();

    const videoPost = page.locator(".post").filter({ hasText: markers.video });
    const player = videoPost.locator("video");
    await expect(player).toBeVisible();
    await player.evaluate(async (element) => { element.muted = true; await element.play(); });
    await expect.poll(() => player.evaluate((element) => element.currentTime), { timeout: 20_000 }).toBeGreaterThan(0.1);
    await player.evaluate((element) => element.pause());

    const photoPost = page.locator(".post").filter({ hasText: markers.photo });
    await photoPost.getByRole("button", { name: "Apri fotografia 1", exact: true }).tap();
    await expect(page.getByAltText("Fotografia a schermo intero")).toBeVisible();
    await page.getByRole("button", { name: "Chiudi foto" }).tap();
  } finally {
    await context.setOffline(false).catch(() => {});
    for (const id of createdIds)
      await fetch(`${baseUrl}/api/posts/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${activeToken}`, "x-device-key": deviceKey },
      }).catch(() => {});
    await context.close();
  }
});
