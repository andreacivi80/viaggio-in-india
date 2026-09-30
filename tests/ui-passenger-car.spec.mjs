import { expect, test, devices } from "@playwright/test";

test.use({ serviceWorkers: "allow" });

const baseUrl = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const sessionToken = process.env.QA_UI_SESSION_TOKEN;
const profileId = process.env.QA_UI_PROFILE_ID;
const profileName = process.env.QA_UI_PROFILE_NAME;
const deviceKey = process.env.QA_UI_DEVICE_KEY;

test.skip(
  !baseUrl || !sessionToken || !profileId || !profileName || !deviceKey,
  "Profilo viaggiatore QA richiesto",
);

const tapTab = async (page, name) => {
  const button = page.locator(".tabs").getByRole("button", { name, exact: true });
  const box = await button.boundingBox();
  expect(box).toBeTruthy();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  await button.tap();
};

test("passeggero in automobile: touch, cambio rete e posizione in movimento restano coerenti", async ({ browser }) => {
  const context = await browser.newContext({
    ...devices["Galaxy S9+"],
    geolocation: { latitude: 13.7563, longitude: 100.5018, accuracy: 35 },
    permissions: ["geolocation"],
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  try {
    await page.addInitScript(({ token, id, name, key }) => {
      localStorage.setItem("india-session-token", token);
      localStorage.setItem("india-profile-id", id);
      localStorage.setItem("india-profile-name", name);
      localStorage.setItem("india-visitor-name", name);
      localStorage.setItem("india-role", "traveler");
      localStorage.setItem("india-device-key", key);
    }, { token: sessionToken, id: profileId, name: profileName, key: deviceKey });

    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".versionBadge")).toBeVisible();
    expect(await page.locator(".app").evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      if (navigator.serviceWorker.controller) return;
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Service Worker non controlla la pagina")), 10_000);
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          clearTimeout(timeout);
          resolve();
        }, { once: true });
        registration.active?.postMessage({ type: "SKIP_WAITING" });
      });
    });

    const firstLocation = page.waitForResponse(
      (response) => response.url().endsWith("/api/locations") && response.request().method() === "POST",
    );
    await page.locator("button.accessPill").tap();
    await page.getByRole("button", { name: "Condividi posizione" }).tap();
    expect((await firstLocation).status()).toBe(200);

    await context.setOffline(true);
    await tapTab(page, "Viaggio");
    await expect(page.getByRole("heading", { name: "La storia, giorno per giorno" })).toBeVisible();
    await tapTab(page, "Mappa");
    await expect(page.getByRole("heading", { name: "Tutto l’itinerario" })).toBeVisible();
    await tapTab(page, "Bacheca");
    await expect(page.getByRole("heading", { name: "Raccontiamocele insieme" })).toBeVisible();
    await expect(page.locator(".appRecovery")).toHaveCount(0);

    await context.setOffline(false);
    await context.setGeolocation({ latitude: 13.8124, longitude: 100.5615, accuracy: 22 });
    await page.locator("button.accessPill").tap();
    await page.getByRole("button", { name: "Documenti e sicurezza" }).tap();
    const movingUpdate = page.waitForResponse(
      (response) => response.url().endsWith("/api/locations") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Aggiorna ora" }).tap();
    expect((await movingUpdate).status()).toBe(200);
    await page.getByRole("button", { name: /Apri mappa posizioni/ }).tap();

    const ownLocation = page.locator(".locationList article").filter({ hasText: profileName });
    await expect(ownLocation).toHaveCount(1);
    await expect(ownLocation).toContainText("13.8124, 100.5615");
    await expect(ownLocation).toContainText("Precisione stimata · ±22 m");
    expect(pageErrors).toEqual([]);

    const deletion = page.waitForResponse(
      (response) => response.url().includes("/api/locations/") && response.request().method() === "DELETE",
    );
    await ownLocation.getByRole("button", { name: "Cancella posizione" }).tap();
    expect((await deletion).status()).toBe(200);
    await expect(page.locator(".locationList article")).toHaveCount(0);
  } finally {
    await context.setOffline(false).catch(() => {});
    await context.close();
  }
});
