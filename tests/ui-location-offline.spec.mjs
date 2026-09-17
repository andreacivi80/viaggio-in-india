import { expect, test, devices } from "@playwright/test";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const sessionToken = process.env.QA_UI_SESSION_TOKEN;
const profileId = process.env.QA_UI_PROFILE_ID;
const profileName = process.env.QA_UI_PROFILE_NAME;
const deviceKey = process.env.QA_UI_DEVICE_KEY;

test.skip(!baseUrl || !sessionToken || !profileId || !profileName || !deviceKey || !isSafeMutationTarget(baseUrl), "Sessione QA isolata richiesta");

test("T-0132: la posizione acquisita offline viene inviata al ritorno della rete", async ({ browser }) => {
  const context = await browser.newContext({
    ...devices["Galaxy S9+"],
    viewport: { width: 360, height: 800 },
    permissions: ["geolocation"],
    geolocation: { latitude: 13.7563, longitude: 100.5018, accuracy: 12 },
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

  try {
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await expect(page.locator(".accessPill")).toContainText("Proprietario");
    await page.locator(".accessPill").tap();
    await context.setOffline(true);
    await page.getByRole("button", { name: "Condividi posizione", exact: true }).tap();
    await expect(page.getByText("Posizione salvata sul telefono. Sarà condivisa quando torna la rete.")).toBeVisible();

    const queued = await page.evaluate(async () => new Promise((resolve, reject) => {
      const request = indexedDB.open("india-insieme-offline", 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("requests", "readonly");
        const read = transaction.objectStore("requests").get(`location:${localStorage.getItem("india-profile-id")}`);
        read.onsuccess = () => resolve(read.result);
        read.onerror = () => reject(read.error);
      };
    }));
    expect(queued.payloadType).toBe("json");
    expect(queued.body).toMatchObject({ profile_id: profileId, latitude: 13.7563, longitude: 100.5018 });

    const sent = page.waitForResponse((response) => response.url().endsWith("/api/locations") && response.request().method() === "POST");
    await context.setOffline(false);
    expect((await sent).status()).toBe(200);
    await expect.poll(() => page.evaluate(async () => new Promise((resolve, reject) => {
      const request = indexedDB.open("india-insieme-offline", 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const transaction = request.result.transaction("requests", "readonly");
        const count = transaction.objectStore("requests").count();
        count.onsuccess = () => resolve(count.result);
        count.onerror = () => reject(count.error);
      };
    }))).toBe(0);

    const privateResponse = await page.request.get(`${baseUrl}/api/private`, {
      headers: { authorization: `Bearer ${sessionToken}`, "x-device-key": deviceKey },
    });
    expect(privateResponse.status()).toBe(200);
    const privateData = await privateResponse.json();
    expect(privateData.locations).toEqual(expect.arrayContaining([
      expect.objectContaining({ profile_id: profileId, latitude: 13.7563, longitude: 100.5018 }),
    ]));
  } finally {
    await context.setOffline(false).catch(() => {});
    await context.close();
  }
});
