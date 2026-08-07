import { expect, test, devices } from "@playwright/test";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const sessionToken = process.env.QA_UI_SESSION_TOKEN;
const profileId = process.env.QA_UI_PROFILE_ID;
const profileName = process.env.QA_UI_PROFILE_NAME;
const deviceKey = process.env.QA_UI_DEVICE_KEY;

test.skip(
  !sessionToken || !profileId || !profileName || !deviceKey || !isSafeMutationTarget(baseUrl),
  "Sessione personale e ambiente QA isolato richiesti",
);

test.use({ ...devices["Galaxy S9+"], viewport: { width: 360, height: 740 }, serviceWorkers: "block" });

test("Scarica dati è disponibile nel Gruppo autenticato e produce uno ZIP", async ({ context, page }) => {
  await context.addInitScript(({ token, id, name, key }) => {
    localStorage.setItem("india-session-token", token);
    localStorage.setItem("india-profile-id", id);
    localStorage.setItem("india-profile-name", name);
    localStorage.setItem("india-role", "traveler");
    localStorage.setItem("india-device-key", key);
  }, { token: sessionToken, id: profileId, name: profileName, key: deviceKey });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Gruppo", exact: true }).tap();
  const button = page.getByRole("button", { name: "Scarica dati", exact: true });
  await expect(button).toBeVisible();
  await button.scrollIntoViewIfNeeded();
  const downloadPromise = page.waitForEvent("download");
  await button.tap();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^viaggio-india-\d{4}-\d{2}-\d{2}\.zip$/);
  await expect(page.getByRole("status")).toContainText("Archivio scaricato");
});

test("il visitatore pubblico non vede Scarica dati", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["iPhone SE"], serviceWorkers: "block" });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Gruppo", exact: true }).tap();
  await expect(page.getByRole("button", { name: "Scarica dati", exact: true })).toHaveCount(0);
  await expect(page.getByText("Gruppo privato", { exact: true })).toBeVisible();
  await context.close();
});
