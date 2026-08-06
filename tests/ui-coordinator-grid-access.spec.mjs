import { test, expect, devices } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const groupCode = process.env.QA_UI_GROUP_CODE;
const travelerName = process.env.QA_UI_PROFILE_NAME;
const travelerInvite = process.env.QA_UI_INVITE_TOKEN;
const coordinatorName = process.env.QA_UI_COORDINATOR_NAME;
const coordinatorInvite = process.env.QA_UI_COORDINATOR_INVITE_TOKEN;
const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");

test.skip(
  !groupCode || !travelerName || !travelerInvite || !coordinatorName || !coordinatorInvite || !baseUrl,
  "Password, profili e inviti locali richiesti",
);

const phone = { ...devices["Galaxy S9+"], viewport: { width: 412, height: 915 } };

const openGroup = async (page) => {
  await page.getByRole("button", { name: "Gruppo", exact: true }).tap();
};

const openPersonalPanel = async (page) => {
  await page.locator(".accessPill").tap();
};

const watchPrivateExposure = async (page) => {
  await page.addInitScript(() => {
    window.__privateExposure = [];
    const inspect = () => {
      const grid = document.querySelector(".coordinatorDashboard");
      const button = [...document.querySelectorAll("button")]
        .find((element) => element.textContent?.includes("Griglia coordinatore"));
      if (grid || button) window.__privateExposure.push(performance.now());
    };
    new MutationObserver(inspect).observe(document, { childList: true, subtree: true });
  });
};

test("la griglia è disponibile soltanto alla sessione coordinatore verificata", async ({ browser }) => {
  test.slow();
  const publicContext = await browser.newContext({ ...phone, serviceWorkers: "block" });
  const passwordContext = await browser.newContext({ ...phone, serviceWorkers: "block" });
  const travelerContext = await browser.newContext({ ...phone, serviceWorkers: "block" });
  const coordinatorContext = await browser.newContext({ ...phone, serviceWorkers: "block" });
  try {
    const publicPage = await publicContext.newPage();
    await watchPrivateExposure(publicPage);
    await publicPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await openGroup(publicPage);
    await expect(publicPage.getByText("Accesso privato", { exact: true })).toBeVisible();
    await expect(publicPage.getByRole("button", { name: "Griglia coordinatore" })).toHaveCount(0);
    expect((await publicPage.request.get(`${baseUrl}/api/private`)).status()).toBe(401);
    expect(await publicPage.evaluate(() => window.__privateExposure)).toEqual([]);

    const passwordPage = await passwordContext.newPage();
    await watchPrivateExposure(passwordPage);
    await passwordPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await openGroup(passwordPage);
    await passwordPage.getByPlaceholder("Password").fill(groupCode);
    await passwordPage.locator(".quickProfilePanel").getByRole("button", { name: "Accedi", exact: true }).tap();
    await expect(passwordPage.getByText("Password verificata · profilo non collegato", { exact: true })).toBeVisible();
    await expect(passwordPage.getByRole("button", { name: "Griglia coordinatore" })).toHaveCount(0);
    expect(await passwordPage.evaluate(() => localStorage.getItem("india-session-token"))).toBeNull();
    expect((await passwordPage.request.get(`${baseUrl}/api/private`)).status()).toBe(401);
    expect(await passwordPage.evaluate(() => window.__privateExposure)).toEqual([]);

    const travelerPage = await travelerContext.newPage();
    await watchPrivateExposure(travelerPage);
    await travelerPage.goto(`${baseUrl}/#invite=${encodeURIComponent(travelerInvite)}`, { waitUntil: "domcontentloaded" });
    await expect(travelerPage.locator(".accessPill")).toContainText(travelerName.split(" ")[0]);
    await openPersonalPanel(travelerPage);
    await expect(travelerPage.getByRole("button", { name: "Documenti e sicurezza" })).toBeVisible();
    await expect(travelerPage.getByRole("button", { name: "Griglia coordinatore" })).toHaveCount(0);
    expect(await travelerPage.evaluate(() => window.__privateExposure)).toEqual([]);

    await travelerPage.evaluate(() => {
      localStorage.setItem("india-role", "coordinator");
      localStorage.setItem("india-profile-id", "profilo-coordinatore-falso");
    });
    await travelerPage.reload({ waitUntil: "domcontentloaded" });
    await expect.poll(() => travelerPage.evaluate(() => localStorage.getItem("india-role"))).toBe("traveler");
    await expect.poll(() => travelerPage.evaluate(() => localStorage.getItem("india-profile-id"))).not.toBe("profilo-coordinatore-falso");
    await openPersonalPanel(travelerPage);
    await expect(travelerPage.getByRole("button", { name: "Documenti e sicurezza" })).toBeVisible();
    await expect(travelerPage.getByRole("button", { name: "Griglia coordinatore" })).toHaveCount(0);

    const coordinatorPage = await coordinatorContext.newPage();
    await coordinatorPage.goto(`${baseUrl}/#invite=${encodeURIComponent(coordinatorInvite)}`, { waitUntil: "domcontentloaded" });
    await expect(coordinatorPage.locator(".accessPill")).toContainText(coordinatorName.split(" ")[0]);
    await openPersonalPanel(coordinatorPage);
    await expect(coordinatorPage.getByRole("button", { name: "Griglia coordinatore" })).toBeVisible();
    await coordinatorPage.getByRole("button", { name: "Griglia coordinatore" }).tap();
    await expect(coordinatorPage.locator(".coordinatorDashboard")).toBeVisible();
    await expect(coordinatorPage.getByRole("heading", { name: "Controllo documenti" })).toBeVisible();

    await openGroup(travelerPage);
    await expect(travelerPage.locator(".coordinatorDashboard")).toHaveCount(0);
    await expect(travelerPage.locator(".profileForm")).toHaveCount(0);
  } finally {
    await Promise.all([
      publicContext.close(),
      passwordContext.close(),
      travelerContext.close(),
      coordinatorContext.close(),
    ]);
  }
});
