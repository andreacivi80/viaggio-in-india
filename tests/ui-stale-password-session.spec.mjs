import { test, expect, devices } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const groupCode = process.env.QA_UI_GROUP_CODE;
const expiredToken = process.env.QA_UI_EXPIRED_SESSION_TOKEN;
const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");

test.skip(!groupCode || !expiredToken || !baseUrl, "Credenziali QA locali richieste");

test("password e nuova registrazione eliminano identita e sessione obsolete senza contaminare il profilo", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["Galaxy S9+"], serviceWorkers: "block" });
  await context.addInitScript(({ token }) => {
    if (sessionStorage.getItem("qa-stale-identity-seeded") === "1") return;
    sessionStorage.setItem("qa-stale-identity-seeded", "1");
    localStorage.setItem("india-session-token", token);
    localStorage.setItem("india-profile-id", "profilo-obsoleto-di-prova");
    localStorage.setItem("india-role", "coordinator");
    localStorage.setItem("india-visitor-name", "Profilo prova 17859");
    localStorage.setItem("india-group-code", "vecchia-password-locale");
  }, { token: expiredToken });
  const page = await context.newPage();

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await expect.poll(() => page.evaluate(() => localStorage.getItem("india-session-token"))).toBeNull();
    await expect(page.locator(".accessPill")).toContainText("Pubblico");
    expect(await page.evaluate(() => ({
      profile: localStorage.getItem("india-profile-id"),
      role: localStorage.getItem("india-role"),
      name: localStorage.getItem("india-visitor-name"),
      groupCode: localStorage.getItem("india-group-code"),
    }))).toEqual({ profile: null, role: null, name: null, groupCode: null });

    await page.getByRole("button", { name: "Gruppo", exact: true }).tap();
    await page.getByPlaceholder("Password").fill(groupCode);
    await page.locator(".quickProfilePanel").getByRole("button", { name: "Accedi", exact: true }).tap();
    await expect(page.getByText("Password verificata · profilo non collegato", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("india-session-token"))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem("india-group-code"))).toBeNull();
    expect((await page.request.get(`${baseUrl}/api/private`)).status()).toBe(401);

    const name = `Nuovo profilo pulito ${Date.now()}`;
    await page.getByPlaceholder("Nome *").fill(name);
    await page.getByRole("button", { name: "Viaggiatore", exact: true }).tap();
    await page.locator(".privacyConsent input").check();
    const registration = page.waitForResponse(
      (response) => response.url().endsWith("/api/auth/register") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Crea profilo e accedi", exact: true }).tap();
    expect((await registration).status()).toBe(201);

    await expect.poll(() => page.evaluate(() => localStorage.getItem("india-session-token"))).toBeTruthy();

    const stored = await page.evaluate(() => ({
      token: localStorage.getItem("india-session-token"),
      profile: localStorage.getItem("india-profile-id"),
      role: localStorage.getItem("india-role"),
      name: localStorage.getItem("india-visitor-name"),
      groupCode: localStorage.getItem("india-group-code"),
    }));
    expect(stored.token).toBeTruthy();
    expect(stored.token).not.toBe(expiredToken);
    expect(stored.profile).not.toBe("profilo-obsoleto-di-prova");
    expect(stored.role).toBe("traveler");
    expect(stored.name).toBe(name);
    expect(stored.groupCode).toBeNull();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(".accessPill")).toContainText(name);
    await expect(page.locator(".accessPill")).toHaveClass(/unlocked/);
    await page.getByRole("button", { name: "Gruppo", exact: true }).tap();
    await expect(page.getByRole("heading", { name, exact: false })).toBeVisible();
    await expect(page.getByText("Profilo prova 17859", { exact: true })).toHaveCount(0);
  } finally {
    await context.close();
  }
});
