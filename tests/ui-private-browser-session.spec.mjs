import { test, expect, devices } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const travelerName = process.env.QA_UI_PROFILE_NAME;
const inviteToken = process.env.QA_UI_INVITE_TOKEN;
const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");

test.skip(!travelerName || !inviteToken || !baseUrl, "Invito e URL QA locale richiesti");

const phone = { ...devices["Galaxy S9+"], viewport: { width: 412, height: 915 } };

test("la sessione privata resta nel contesto corrente ma non sopravvive alla sua chiusura", async ({ browser }) => {
  test.slow();
  let cleanUrl;
  const privateContext = await browser.newContext({ ...phone, serviceWorkers: "block" });
  try {
    const page = await privateContext.newPage();
    await page.goto(`${baseUrl}/#invite=${encodeURIComponent(inviteToken)}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".accessPill")).toContainText(travelerName.split(" ")[0]);

    const connectedState = await page.evaluate(() => ({
      token: localStorage.getItem("india-session-token"),
      profile: localStorage.getItem("india-profile-id"),
      role: localStorage.getItem("india-role"),
      visitorName: localStorage.getItem("india-visitor-name"),
      groupCode: localStorage.getItem("india-group-code"),
      pendingInvite: sessionStorage.getItem("india-pending-invite"),
      claiming: sessionStorage.getItem("india-auth-claiming"),
      hash: location.hash,
      search: location.search,
      href: location.href,
    }));
    expect(connectedState.token).toBeTruthy();
    expect(connectedState.profile).toBeTruthy();
    expect(connectedState.role).toBe("traveler");
    expect(connectedState.groupCode).toBeNull();
    expect(connectedState.pendingInvite).toBeNull();
    expect(connectedState.claiming).toBeNull();
    expect(connectedState.hash).toBe("");
    expect(connectedState.search).not.toContain("invite=");
    expect(connectedState.href).not.toContain(inviteToken);
    cleanUrl = connectedState.href;

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(".accessPill")).toContainText(travelerName.split(" ")[0]);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("india-session-token"))).toBe(connectedState.token);
    await page.getByRole("button", { name: "Gruppo", exact: true }).tap();
    await expect(page.getByRole("button", { name: "Documenti e posizione", exact: true })).toBeVisible();
  } finally {
    await privateContext.close();
  }

  const freshPrivateContext = await browser.newContext({ ...phone, serviceWorkers: "block" });
  try {
    const freshPage = await freshPrivateContext.newPage();
    await freshPage.goto(cleanUrl || baseUrl, { waitUntil: "domcontentloaded" });
    await expect(freshPage.locator(".accessPill")).toContainText("Pubblico");
    await expect(freshPage.getByRole("button", { name: "Documenti e sicurezza", exact: true })).toHaveCount(0);
    await expect(freshPage.getByRole("button", { name: "Griglia coordinatore", exact: true })).toHaveCount(0);
    expect(await freshPage.evaluate(() => ({
      token: localStorage.getItem("india-session-token"),
      profile: localStorage.getItem("india-profile-id"),
      role: localStorage.getItem("india-role"),
      visitorName: localStorage.getItem("india-visitor-name"),
      groupCode: localStorage.getItem("india-group-code"),
      pendingInvite: sessionStorage.getItem("india-pending-invite"),
    }))).toEqual({
      token: null,
      profile: null,
      role: null,
      visitorName: null,
      groupCode: null,
      pendingInvite: null,
    });
    expect((await freshPage.request.get(`${baseUrl}/api/private`)).status()).toBe(401);
  } finally {
    await freshPrivateContext.close();
  }
});
