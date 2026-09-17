import { test, expect, devices } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const sessionToken = process.env.QA_UI_SESSION_TOKEN;
const profileId = process.env.QA_UI_PROFILE_ID;
const profileName = process.env.QA_UI_PROFILE_NAME;
const deviceKey = process.env.QA_UI_DEVICE_KEY;

test.skip(
  !baseUrl || !sessionToken || !profileId || !profileName || !deviceKey,
  "Profilo viaggiatore QA richiesto",
);

test("posizione indoor, in movimento e stato senza posizioni su cellulare", async ({ browser }) => {
  const context = await browser.newContext({
    ...devices["Galaxy S9+"],
    geolocation: { latitude: 13.7563, longitude: 100.5018, accuracy: 1200 },
    permissions: ["geolocation"],
  });
  const page = await context.newPage();
  try {
    await page.addInitScript(({ token, id, name, key }) => {
      localStorage.setItem("india-session-token", token);
      localStorage.setItem("india-profile-id", id);
      localStorage.setItem("india-profile-name", name);
      localStorage.setItem("india-visitor-name", name);
      localStorage.setItem("india-role", "traveler");
      localStorage.setItem("india-device-key", key);
      Object.defineProperty(navigator, "getBattery", {
        configurable: true,
        value: async () => ({ level: 0.42, charging: false }),
      });
    }, { token: sessionToken, id: profileId, name: profileName, key: deviceKey });

    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const client = await context.newCDPSession(page);
    await client.send("Performance.enable");
    await page.locator("button.accessPill").tap();
    const firstUpdate = page.waitForResponse(
      (response) => response.url().endsWith("/api/locations") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Condividi posizione" }).tap();
    expect((await firstUpdate).status()).toBe(200);
    await page.getByRole("button", { name: "Documenti e sicurezza" }).tap();
    await page.getByRole("button", { name: /Apri mappa posizioni/ }).tap();
    await expect(page.locator(".peopleLocationMap")).toHaveAttribute("data-map-settled", "true", { timeout: 30_000 });
    await page.waitForTimeout(1_000);

    const mapMetricsBefore = await client.send("Performance.getMetrics");
    const batteryBefore = await page.evaluate(async () => (await navigator.getBattery()).level);
    await page.waitForTimeout(5_000);
    const mapMetricsAfter = await client.send("Performance.getMetrics");
    const batteryAfter = await page.evaluate(async () => (await navigator.getBattery()).level);
    const metric = (metrics, name) => metrics.metrics.find((item) => item.name === name)?.value || 0;
    const mapTaskSeconds = metric(mapMetricsAfter, "TaskDuration") - metric(mapMetricsBefore, "TaskDuration");
    expect(batteryAfter).toBe(batteryBefore);
    expect(mapTaskSeconds).toBeLessThan(1);
    console.log(`MAP_BATTERY_MEASUREMENT=${JSON.stringify({ batteryBefore, batteryAfter, mapTaskSeconds })}`);

    const ownLocation = page.locator(".locationList article").filter({ hasText: profileName });
    await expect(ownLocation).toContainText("13.7563, 100.5018");
    await expect(ownLocation).toContainText("Precisione stimata · ±1200 m · segnale GPS debole");

    await context.setGeolocation({ latitude: 13.7700, longitude: 100.5300, accuracy: 18 });
    const movingUpdate = page.waitForResponse(
      (response) => response.url().endsWith("/api/locations") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Aggiorna ora" }).tap();
    expect((await movingUpdate).status()).toBe(200);
    await expect(ownLocation).toContainText("13.7700, 100.5300");
    await expect(ownLocation).toContainText("Precisione stimata · ±18 m");
    await expect(page.locator(".locationList article")).toHaveCount(1);

    const deletion = page.waitForResponse(
      (response) => response.url().includes("/api/locations/") && response.request().method() === "DELETE",
    );
    await ownLocation.getByRole("button", { name: "Cancella posizione" }).tap();
    expect((await deletion).status()).toBe(200);
    await expect(page.locator(".locationList article")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Chiudi mappa posizioni/ })).toContainText("0");
  } finally {
    await context.close();
  }
});
