import { test, expect, devices } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const coordinatorToken = process.env.QA_COORDINATOR_TOKEN;
const coordinatorProfileId = process.env.QA_COORDINATOR_PROFILE_ID;
const coordinatorDeviceKey = process.env.QA_COORDINATOR_DEVICE_KEY;

test.skip(
  !baseUrl || !coordinatorToken || !coordinatorProfileId || !coordinatorDeviceKey,
  "Sessione coordinatore QA richiesta",
);

test("etichette posizione recente, vecchia e scaduta su cellulare", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["Galaxy S9+"] });
  const page = await context.newPage();
  try {
    await page.addInitScript(({ token, profileId, deviceKey }) => {
      localStorage.setItem("india-session-token", token);
      localStorage.setItem("india-profile-id", profileId);
      localStorage.setItem("india-profile-name", "Coordinatore QA");
      localStorage.setItem("india-visitor-name", "Coordinatore QA");
      localStorage.setItem("india-role", "coordinator");
      localStorage.setItem("india-device-key", deviceKey);
    }, { token: coordinatorToken, profileId: coordinatorProfileId, deviceKey: coordinatorDeviceKey });

    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".accessPill")).toContainText("Coordinatore");
    await page.locator("button.accessPill").tap();
    await page.getByRole("button", { name: "Griglia coordinatore" }).tap();
    await page.getByRole("button", { name: /Apri mappa posizioni/ }).tap();

    await expect(page.locator(".locationList article")).toHaveCount(3);
    await expect(page.locator(".locationFreshness.recent")).toHaveText("Posizione recente");
    await expect(page.locator(".locationFreshness.old")).toHaveText("Posizione vecchia");
    await expect(page.locator(".locationFreshness.expired")).toHaveText("Posizione scaduta");
  } finally {
    await context.close();
  }
});
