import { test, expect, devices } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const groupCode = process.env.QA_GROUP_CODE;
const token = process.env.QA_COORDINATOR_TOKEN;
const profileId = process.env.QA_COORDINATOR_PROFILE_ID;
const deviceKey = process.env.QA_COORDINATOR_DEVICE_KEY;
const phone = { ...devices["Galaxy S9+"], viewport: { width: 412, height: 915 } };

test.skip(!baseUrl || !groupCode || !token || !profileId || !deviceKey, "Credenziali QA richieste");

test("la coordinatrice conferma due fattori con touch prima dei comandi amministrativi", async ({ browser }) => {
  const context = await browser.newContext({ ...phone, serviceWorkers: "block" });
  try {
    const page = await context.newPage();
    await page.addInitScript(({ tokenValue, profileValue, deviceValue }) => {
      localStorage.setItem("india-session-token", tokenValue);
      localStorage.setItem("india-profile-id", profileValue);
      localStorage.setItem("india-role", "coordinator");
      localStorage.setItem("india-visitor-name", "Coordinatrice QA");
      localStorage.setItem("india-device-key", deviceValue);
    }, { tokenValue: token, profileValue: profileId, deviceValue: deviceKey });
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".accessPill")).toContainText("Coordinatore");
    await page.getByRole("button", { name: "Gruppo", exact: true }).tap();
    const panel = page.locator(".adminStepUp");
    await expect(panel).toBeVisible();
    await expect(page.locator(".profileForm")).toHaveCount(0);

    await panel.getByLabel("Password per funzioni amministrative").fill(`${groupCode}-errata`);
    await panel.getByRole("button", { name: "Attiva per 10 minuti" }).tap();
    await expect(panel.getByRole("status")).toContainText("Password non corretta");
    expect(await page.evaluate(() => sessionStorage.getItem("thailand-admin-step-up"))).toBeNull();

    await panel.getByLabel("Password per funzioni amministrative").fill(groupCode);
    await panel.getByRole("button", { name: "Attiva per 10 minuti" }).tap();
    await expect(page.getByText(/amministrazione attiva/i)).toBeVisible();
    await expect(page.locator(".profileForm")).toBeVisible();
    expect(await page.evaluate(() => Boolean(sessionStorage.getItem("thailand-admin-step-up")))).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem("thailand-admin-step-up"))).toBeNull();
  } finally {
    await context.close();
  }
});
