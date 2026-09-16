import { test, expect, devices } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const token = process.env.QA_UI_SESSION_TOKEN;
const profileId = process.env.QA_UI_PROFILE_ID;
const deviceKey = process.env.QA_UI_DEVICE_KEY;

test.skip(!baseUrl || !token || !profileId || !deviceKey, "Sessione QA richiesta");

test("le preferenze notifiche si toccano e persistono su Galaxy S9+", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["Galaxy S9+"] });
  const page = await context.newPage();
  try {
    await page.addInitScript(({ token: sessionToken, profileId: id, deviceKey: key }) => {
      localStorage.setItem("india-session-token", sessionToken);
      localStorage.setItem("india-profile-id", id);
      localStorage.setItem("india-visitor-name", "Proprietario QA");
      localStorage.setItem("india-role", "traveler");
      localStorage.setItem("india-device-key", key);
    }, { token, profileId, deviceKey });

    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".accessPill")).toContainText("Proprietario");
    await page.locator("button.accessPill").tap();
    const posts = page.getByLabel("Nuove pubblicazioni");
    const location = page.getByLabel("Posizioni condivise");
    await expect(posts).toBeChecked();
    await expect(location).toBeChecked();

    await posts.tap();
    await location.tap();
    await expect(posts).not.toBeChecked();
    await expect(location).not.toBeChecked();
    await expect(page.locator(".quickStatus")).toContainText("aggiornate");

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator("button.accessPill").tap();
    await expect(page.getByLabel("Nuove pubblicazioni")).not.toBeChecked();
    await expect(page.getByLabel("Posizioni condivise")).not.toBeChecked();

    await page.getByLabel("Nuove pubblicazioni").tap();
    await page.getByLabel("Posizioni condivise").tap();
    await expect(page.getByLabel("Nuove pubblicazioni")).toBeChecked();
    await expect(page.getByLabel("Posizioni condivise")).toBeChecked();
  } finally {
    await context.close();
  }
});
