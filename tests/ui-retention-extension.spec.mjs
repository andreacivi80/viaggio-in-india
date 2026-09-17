import { test, expect, devices } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const travelerName = process.env.QA_UI_PROFILE_NAME;
const travelerInvite = process.env.QA_UI_INVITE_TOKEN;
const coordinatorName = process.env.QA_UI_COORDINATOR_NAME;
const coordinatorInvite = process.env.QA_UI_COORDINATOR_INVITE_TOKEN;
const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
test.skip(!travelerName || !travelerInvite || !coordinatorName || !coordinatorInvite || !baseUrl,
  "Profili e inviti QA richiesti");

const phone = { ...devices["Galaxy S9+"], viewport: { width: 412, height: 915 } };
const retainUntil = new Date(Date.now() + 40 * 86400000).toISOString().slice(0, 10);

async function tap(page, locator) {
  await expect(locator).toBeVisible();
  await locator.evaluate((element) => element.scrollIntoView({ block: "center", inline: "center" }));
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

test("il viaggiatore richiede e la coordinatrice autorizza la proroga con touch", async ({ browser }) => {
  test.slow();
  const travelerContext = await browser.newContext({ ...phone, serviceWorkers: "block" });
  const coordinatorContext = await browser.newContext({ ...phone, serviceWorkers: "block" });
  try {
    const travelerPage = await travelerContext.newPage();
    await travelerPage.goto(`${baseUrl}/#invite=${encodeURIComponent(travelerInvite)}`, { waitUntil: "domcontentloaded" });
    await expect(travelerPage.locator(".accessPill")).toContainText(travelerName.split(" ")[0]);
    await tap(travelerPage, travelerPage.locator(".accessPill"));
    await tap(travelerPage, travelerPage.getByRole("button", { name: "Documenti e sicurezza" }));
    const retention = travelerPage.getByRole("region", { name: "Conservazione dei dati" });
    await expect(retention).toBeVisible();
    await retention.locator('input[type="date"]').fill(retainUntil);
    const requestResponse = travelerPage.waitForResponse((response) =>
      response.url().endsWith("/api/retention-extension") && response.request().method() === "POST");
    await tap(travelerPage, retention.getByRole("button", { name: "Richiedi proroga" }));
    expect((await requestResponse).status()).toBe(200);
    await expect(retention).toContainText("In attesa");

    const coordinatorPage = await coordinatorContext.newPage();
    await coordinatorPage.goto(`${baseUrl}/#invite=${encodeURIComponent(coordinatorInvite)}`, { waitUntil: "domcontentloaded" });
    await expect(coordinatorPage.locator(".accessPill")).toContainText(coordinatorName.split(" ")[0]);
    await tap(coordinatorPage, coordinatorPage.locator(".accessPill"));
    await tap(coordinatorPage, coordinatorPage.getByRole("button", { name: "Griglia coordinatore" }));
    const requests = coordinatorPage.locator(".retentionRequests");
    await expect(requests).toContainText(travelerName.split(" ")[0]);
    const approveResponse = coordinatorPage.waitForResponse((response) =>
      response.url().includes("/api/retention-extension/") && response.request().method() === "PUT");
    await tap(coordinatorPage, requests.getByRole("button", { name: "Autorizza" }));
    expect((await approveResponse).status()).toBe(200);
    await expect(requests).toHaveCount(0);
    await expect(retention).toContainText("Autorizzata", { timeout: 15_000 });
  } finally {
    await Promise.all([travelerContext.close(), coordinatorContext.close()]);
  }
});
