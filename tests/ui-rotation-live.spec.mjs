import { expect, test, devices } from "@playwright/test";

const baseUrl = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const sessionToken = process.env.QA_UI_SESSION_TOKEN;
const profileId = process.env.QA_UI_PROFILE_ID;
const profileName = process.env.QA_UI_PROFILE_NAME;
const deviceKey = process.env.QA_UI_DEVICE_KEY;
test.skip(!baseUrl || !sessionToken || !profileId || !profileName || !deviceKey,
  "Profilo viaggiatore QA richiesto");
test.use({ serviceWorkers: "block" });

const assertViewport = async (page) => {
  await expect(page.locator(".appRecovery")).toHaveCount(0);
  expect(await page.locator(".app").evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  const tabs = page.locator(".tabs button");
  for (let index = 0; index < await tabs.count(); index += 1) {
    const box = await tabs.nth(index).boundingBox();
    expect(box).toBeTruthy();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
};

test("rotazione touch mantiene fruibili tutte le sezioni principali", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["Galaxy S9+"], serviceWorkers: "block" });
  await context.addInitScript(({ token, id, name, key }) => {
    localStorage.setItem("india-session-token", token);
    localStorage.setItem("india-profile-id", id);
    localStorage.setItem("india-profile-name", name);
    localStorage.setItem("india-role", "traveler");
    localStorage.setItem("india-device-key", key);
  }, { token: sessionToken, id: profileId, name: profileName, key: deviceKey });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".accessPill")).not.toContainText("Pubblico");
    for (const tabName of ["Bacheca", "Viaggio", "Mappa", "Gruppo"]) {
      await page.locator(".tabs").getByRole("button", { name: tabName, exact: true }).tap();
      await assertViewport(page);
      if (tabName === "Viaggio") {
        await page.locator(".offlineEmergencyCard summary").tap();
        const embassy = page.locator('.offlineEmergencyCard a[href="tel:+66818256103"]');
        await expect(embassy).toBeVisible();
        await expect(embassy).toContainText("AMBASCIATA D’ITALIA");
        await expect(embassy).toContainText("+66 81 825 6103");
      }
      await page.setViewportSize({ width: 740, height: 360 });
      await page.waitForTimeout(250);
      await assertViewport(page);
      await page.mouse.wheel(0, 600);
      await page.setViewportSize({ width: 360, height: 740 });
      await page.waitForTimeout(250);
      await assertViewport(page);
    }
    expect(pageErrors.filter((message) => !message.includes("WebGL"))).toEqual([]);
  } finally {
    await context.close();
  }
});
