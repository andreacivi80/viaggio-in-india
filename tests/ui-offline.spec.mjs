import { test, expect, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const inviteToken = process.env.QA_UI_INVITE_TOKEN;
const profileName = process.env.QA_UI_PROFILE_NAME;
const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const photoPath = fileURLToPath(new URL("../public/thailand/bangkok.jpg", import.meta.url));

test.skip(!inviteToken || !profileName || !isSafeMutationTarget(baseUrl), "Profilo QA, invito e URL locale/QA richiesti");

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

test("invio offline sopravvive alla chiusura e parte una sola volta al ritorno della rete", async ({ browser }) => {
  test.setTimeout(150_000);
  const context = await browser.newContext({ ...devices["Galaxy S9+"] });
  let page = await context.newPage();
  let createdPostId = "";
  await page.goto(`${baseUrl}/#invite=${encodeURIComponent(inviteToken)}`, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".accessPill")).toContainText(profileName.split(" ")[0]);
  const sessionToken = await page.evaluate(() => localStorage.getItem("india-session-token"));
  const deviceKey = await page.evaluate(() => localStorage.getItem("india-device-key"));
  expect(sessionToken).toBeTruthy();
  const marker = `Offline QA ${Date.now()}`;
  const discardedMarker = `Offline eliminato QA ${Date.now()}`;
  try {
    await page.getByRole("button", { name: "Pubblica", exact: true }).tap();
    let sheet = page.locator(".uploadSheet");
    await sheet.getByPlaceholder("Racconta questo momento…").fill(discardedMarker);
    await sheet.locator('input[accept^="image"]').first().setInputFiles(photoPath);
    await context.setOffline(true);
    await sheet.locator(".composerActions > button").tap();
    await expect.poll(() => offlineCount(page)).toBe(1);
    await page.locator("button.accessPill").tap();
    const queuePanel = page.getByRole("region", { name: "Invii in attesa" });
    await expect(queuePanel).toContainText("1 invio in attesa");
    await queuePanel.getByRole("button", { name: "Elimina" }).tap();
    const queueConfirm = page.getByRole("dialog", { name: "Eliminare l’invio in attesa?" });
    await expect(queueConfirm).toContainText("Nessun contenuto già pubblicato sarà eliminato.");
    await page.goBack();
    await expect(queueConfirm).toHaveCount(0);
    await expect.poll(() => offlineCount(page)).toBe(1);
    await queuePanel.getByRole("button", { name: "Elimina" }).tap();
    await queueConfirm.getByRole("button", { name: "Annulla" }).tap();
    await expect(queueConfirm).toHaveCount(0);
    await expect.poll(() => offlineCount(page)).toBe(1);
    await queuePanel.getByRole("button", { name: "Elimina" }).tap();
    await queueConfirm.getByRole("button", { name: "Elimina dalla coda" }).tap();
    await expect.poll(() => offlineCount(page)).toBe(0);
    await expect(page.getByText("Invio in attesa eliminato dal telefono.")).toBeVisible();
    await page.locator("button.accessPill").tap();

    await page.getByRole("button", { name: "Pubblica", exact: true }).tap();
    sheet = page.locator(".uploadSheet");
    await sheet.getByPlaceholder("Racconta questo momento…").fill(marker);
    await sheet.locator('input[accept^="image"]').first().setInputFiles(photoPath);
    await context.setOffline(true);
    await sheet.locator(".composerActions > button").tap();
    await expect(page.getByText("Salvato nel telefono. Sarà pubblicato automaticamente quando torna la rete.")).toBeVisible();
    await expect.poll(() => offlineCount(page)).toBe(1);

    await page.close();
    await context.setOffline(false);
    page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    expect(await page.evaluate(() => localStorage.getItem("india-session-token"))).toBe(sessionToken);
    expect(await page.evaluate(() => localStorage.getItem("india-device-key"))).toBe(deviceKey);
    const sessionCheck = await page.request.get(`${baseUrl}/api/auth/session`, {
      headers: { authorization: `Bearer ${sessionToken}`, "x-device-key": deviceKey },
    });
    expect(sessionCheck.status()).toBe(200);
    await expect.poll(() => offlineCount(page), { timeout: 25_000 }).toBe(0);
    const post = page.locator(".post").filter({ hasText: marker });
    await expect(post).toBeVisible({ timeout: 25_000 });
    await expect(post.locator("img")).toBeVisible();
    await expect.poll(() => offlineCount(page), { timeout: 20_000 }).toBe(0);

    const stateResponse = await page.request.get(`${baseUrl}/api/state`, {
      headers: { authorization: `Bearer ${sessionToken}`, "x-device-key": deviceKey },
    });
    const state = await stateResponse.json();
    const matches = state.posts.filter((item) => item.text === marker);
    expect(matches).toHaveLength(1);
    expect(state.posts.filter((item) => item.text === discardedMarker)).toHaveLength(0);
    createdPostId = matches[0].id;
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(".post").filter({ hasText: marker })).toHaveCount(1);
  } finally {
    if (createdPostId)
      await page.request.delete(`${baseUrl}/api/posts/${encodeURIComponent(createdPostId)}`, {
        headers: { authorization: `Bearer ${sessionToken}`, "x-device-key": deviceKey },
        timeout: 15_000,
      }).catch(() => {});
    await context.close();
  }
});
