import { test, expect, devices } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const groupCode = process.env.QA_UI_GROUP_CODE;
const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");

test.skip(!groupCode || !baseUrl, "Password e URL QA locale richiesti");

test("password con spazi porta alla registrazione ma non concede privilegi senza profilo", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["Galaxy S9+"], serviceWorkers: "block" });
  const page = await context.newPage();
  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".accessPill")).toContainText("Pubblico");
    await expect(page.getByRole("button", { name: "Bacheca", exact: true })).toHaveAttribute("aria-current", "page");
    expect((await page.request.get(`${baseUrl}/api/private`)).status()).toBe(401);

    await page.getByRole("button", { name: "Gruppo", exact: true }).tap();
    await expect(page.getByText("Accesso privato", { exact: true })).toBeVisible();
    await page.getByPlaceholder("Password").fill(`  ${groupCode}  `);
    await page.locator(".quickProfilePanel").getByRole("button", { name: "Accedi", exact: true }).tap();
    await expect(page.getByText("Entra nel gruppo", { exact: true })).toBeVisible();
    await expect(page.getByText("Password verificata · profilo non collegato", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("india-session-token"))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem("india-profile-id"))).toBeNull();
    expect((await page.request.get(`${baseUrl}/api/private`)).status()).toBe(401);
    await expect(page.getByRole("button", { name: "Documenti e sicurezza", exact: true })).toHaveCount(0);

    await page.getByRole("button", { name: "Bacheca", exact: true }).tap();
    await expect(page.getByRole("button", { name: "Bacheca", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.locator(".accessPill")).toContainText("Pubblico");
    await page.getByRole("button", { name: "Gruppo", exact: true }).tap();
    await expect(page.getByText("Entra nel gruppo", { exact: true })).toBeVisible();

    const uniqueName = `Accesso UI ${Date.now()}`;
    await page.getByPlaceholder("Nome *").fill(uniqueName);
    await page.getByRole("button", { name: "Viaggiatore", exact: true }).tap();
    await expect(page.getByRole("button", { name: "Viaggiatore", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.locator(".privacyConsent input").check();
    const registrationResponse = page.waitForResponse(
      (response) => response.url().endsWith("/api/auth/register") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Crea profilo e accedi", exact: true }).tap();
    expect((await registrationResponse).status()).toBe(201);
    await expect(page.locator(".accessPill")).toContainText("Accesso");
    await expect(page.getByText(new RegExp(`Telefono collegato a ${uniqueName}`))).toBeVisible();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("india-session-token"))).toBeTruthy();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("india-profile-id"))).toBeTruthy();
    expect(await page.evaluate(() => localStorage.getItem("india-group-code"))).toBeNull();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(".accessPill")).toContainText("Accesso");
    await page.getByRole("button", { name: "Gruppo", exact: true }).tap();
    await expect(page.getByRole("button", { name: "Documenti e posizione", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Griglia coordinatore", exact: true })).toHaveCount(0);

    await page.getByRole("button", { name: "Bacheca", exact: true }).tap();
    await page.getByRole("button", { name: "Pubblica", exact: true }).tap();
    const sheet = page.locator(".uploadSheet");
    await expect(sheet.getByPlaceholder("Racconta questo momento…")).toBeVisible();
    await expect(sheet.getByPlaceholder("Password")).toHaveCount(0);
    const postText = `Pubblicazione accesso UI ${Date.now()}`;
    await sheet.getByPlaceholder("Racconta questo momento…").fill(postText);
    const publishResponse = page.waitForResponse(
      (response) => response.url().endsWith("/api/posts") && response.request().method() === "POST",
    );
    await sheet.getByRole("button", { name: "Pubblica", exact: true }).tap();
    expect((await publishResponse).status()).toBe(201);
    await expect(page.locator(".post").filter({ hasText: postText })).toBeVisible();
  } finally {
    await context.close();
  }
});
