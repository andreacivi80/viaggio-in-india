import { test, expect, devices } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const travelerName = process.env.QA_UI_PROFILE_NAME;
const coordinatorName = process.env.QA_UI_COORDINATOR_NAME;
const travelerInvite = process.env.QA_UI_INVITE_TOKEN;
const secondTravelerInvite = process.env.QA_UI_SWITCH_INVITE_TOKEN;
const coordinatorInvite = process.env.QA_UI_COORDINATOR_INVITE_TOKEN;
const expiredSessionToken = process.env.QA_UI_EXPIRED_SESSION_TOKEN;
const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");

test.skip(
  !travelerName || !coordinatorName || !travelerInvite || !secondTravelerInvite || !coordinatorInvite || !expiredSessionToken || !baseUrl,
  "Inviti e sessione scaduta locali richiesti",
);

const phone = { ...devices["Galaxy S9+"], viewport: { width: 412, height: 915 } };

test("un invito ricevuto dalla persona sbagliata non sostituisce una sessione valida", async ({ browser }) => {
  test.slow();
  const travelerContext = await browser.newContext({ ...phone, serviceWorkers: "block" });
  const coordinatorContext = await browser.newContext({ ...phone, serviceWorkers: "block" });
  try {
    const travelerPage = await travelerContext.newPage();
    await travelerPage.goto(`${baseUrl}/#invite=${encodeURIComponent(travelerInvite)}`, { waitUntil: "domcontentloaded" });
    await expect(travelerPage.locator(".accessPill")).toContainText(travelerName.split(" ")[0]);
    const original = await travelerPage.evaluate(() => ({
      token: localStorage.getItem("india-session-token"),
      profile: localStorage.getItem("india-profile-id"),
      role: localStorage.getItem("india-role"),
    }));
    expect(original.token).toBeTruthy();
    expect(original.profile).toBeTruthy();
    expect(original.role).toBe("traveler");
    await expect.poll(() => travelerPage.evaluate(() => ({
      claiming: sessionStorage.getItem("india-auth-claiming"),
      pending: sessionStorage.getItem("india-pending-invite"),
    }))).toEqual({ claiming: null, pending: null });

    await travelerPage.goto(`${baseUrl}/?misdelivery=1#invite=${encodeURIComponent(coordinatorInvite)}`, { waitUntil: "domcontentloaded" });
    await expect.poll(() => travelerPage.evaluate(() => sessionStorage.getItem("india-pending-invite"))).toBeNull();
    if (!(await travelerPage.locator(".quickProfilePanel").isVisible()))
      await travelerPage.locator(".accessPill").tap();
    await expect(travelerPage.getByText(new RegExp(`già collegato a ${travelerName.split(" ")[0]}`, "i"))).toBeVisible();
    await expect.poll(() => travelerPage.evaluate(() => ({
      token: localStorage.getItem("india-session-token"),
      profile: localStorage.getItem("india-profile-id"),
      role: localStorage.getItem("india-role"),
      pending: sessionStorage.getItem("india-pending-invite"),
    }))).toEqual({ ...original, pending: null });
    await expect(travelerPage.getByRole("button", { name: "Griglia coordinatore" })).toHaveCount(0);

    const coordinatorPage = await coordinatorContext.newPage();
    await coordinatorPage.goto(`${baseUrl}/#invite=${encodeURIComponent(coordinatorInvite)}`, { waitUntil: "domcontentloaded" });
    await expect(coordinatorPage.locator(".accessPill")).toContainText(coordinatorName.split(" ")[0]);
    await coordinatorPage.locator(".accessPill").tap();
    await expect(coordinatorPage.getByRole("button", { name: "Griglia coordinatore" })).toBeVisible();
  } finally {
    await Promise.all([travelerContext.close(), coordinatorContext.close()]);
  }
});

test("una sessione scaduta viene rimossa e non impedisce il nuovo invito", async ({ browser }) => {
  const context = await browser.newContext({ ...phone, serviceWorkers: "block" });
  try {
    const page = await context.newPage();
    await page.addInitScript((token) => {
      localStorage.setItem("india-session-token", token);
      localStorage.setItem("india-profile-id", "profilo-scaduto");
      localStorage.setItem("india-role", "coordinator");
      localStorage.setItem("india-visitor-name", "Profilo scaduto");
    }, expiredSessionToken);
    await page.goto(`${baseUrl}/#invite=${encodeURIComponent(secondTravelerInvite)}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".accessPill")).toContainText(travelerName.split(" ")[0]);
    await expect.poll(() => page.evaluate(() => ({
      token: localStorage.getItem("india-session-token"),
      profile: localStorage.getItem("india-profile-id"),
      role: localStorage.getItem("india-role"),
      pending: sessionStorage.getItem("india-pending-invite"),
    }))).toEqual(expect.objectContaining({
      profile: expect.not.stringMatching(/^profilo-scaduto$/),
      role: "traveler",
      pending: null,
    }));
  } finally {
    await context.close();
  }
});
