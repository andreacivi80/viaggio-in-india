import { test, expect, devices } from "@playwright/test";

const travelerName = process.env.QA_UI_PROFILE_NAME;
const travelerInvite = process.env.QA_UI_INVITE_TOKEN;
const coordinatorName = process.env.QA_UI_COORDINATOR_NAME;
const coordinatorInvite = process.env.QA_UI_COORDINATOR_INVITE_TOKEN;
const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");

test.skip(
  !travelerName || !travelerInvite || !coordinatorName || !coordinatorInvite || !baseUrl,
  "Profili QA Viaggiatore e Coordinatore richiesti",
);

const tapBottom = async (page, name) => {
  const button = page.locator(".tabs").getByRole("button", { name });
  await expect.poll(() => button.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return hit === element || element.contains(hit);
  })).toBe(true);
  const box = await button.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
};

const openPersonalPanel = async (page) => {
  await page.locator("button.accessPill").tap();
  await expect(page.locator(".quickProfilePanel")).toBeVisible();
};

test("GPS volontario, mappa India, Google Maps, rimozione e sincronizzazione", async ({ browser }) => {
  test.slow();
  const travelerContext = await browser.newContext({
    ...devices["Galaxy S9+"],
    geolocation: { latitude: 28.6139, longitude: 77.2090 },
    permissions: ["geolocation"],
  });
  const coordinatorContext = await browser.newContext({ ...devices["Galaxy S9+"] });
  const publicContext = await browser.newContext({ ...devices["Galaxy S9+"] });
  const travelerPage = await travelerContext.newPage();
  const coordinatorPage = await coordinatorContext.newPage();
  const publicPage = await publicContext.newPage();
  try {
    await travelerPage.goto(`${baseUrl}/#invite=${encodeURIComponent(travelerInvite)}`, {
      waitUntil: "networkidle",
    });
    await openPersonalPanel(travelerPage);
    await expect(travelerPage.locator(".quickProfilePanel")).toContainText(travelerName);
    const locationResponse = travelerPage.waitForResponse(
      (response) => response.url().endsWith("/api/locations") && response.request().method() === "POST",
    );
    await travelerPage.getByRole("button", { name: "Condividi posizione" }).tap();
    expect((await locationResponse).status()).toBe(200);
    await expect(travelerPage.getByText("Posizione condivisa adesso.")).toBeVisible();

    await travelerPage.getByRole("button", { name: "Documenti e sicurezza" }).tap();
    const mapToggle = travelerPage.getByRole("button", { name: /Apri mappa posizioni/ });
    await expect(mapToggle).toContainText(/\d+/);
    await mapToggle.tap();
    const travelerLocation = travelerPage.locator(".locationList article").filter({ hasText: travelerName });
    await expect(travelerLocation).toContainText("28.6139, 77.2090");
    await expect(travelerLocation.getByRole("link", { name: "Google Maps" })).toHaveAttribute(
      "href",
      /google\.com\/maps\/search\/\?api=1&query=28\.6139,77\.209/,
    );
    await expect(travelerLocation.getByRole("link", { name: "Naviga" })).toHaveAttribute(
      "href",
      /google\.com\/maps\/dir\/\?api=1&destination=28\.6139,77\.209/,
    );
    await expect(travelerPage.locator(".peopleLocationMap")).toHaveAttribute(
      "aria-label",
      "Posizioni del gruppo sulla cartina dell'India",
    );
    await expect(travelerPage.locator(".personMapMarker").filter({ hasText: travelerName[0] }).first()).toBeVisible({
      timeout: 20_000,
    });
    await travelerPage.getByRole("button", { name: /Chiudi mappa posizioni/ }).tap();
    await expect(travelerPage.locator(".peopleLocationMap")).toHaveCount(0);

    await coordinatorPage.goto(`${baseUrl}/#invite=${encodeURIComponent(coordinatorInvite)}`, {
      waitUntil: "networkidle",
    });
    await openPersonalPanel(coordinatorPage);
    await coordinatorPage.getByRole("button", { name: "Griglia coordinatore" }).tap();
    await coordinatorPage.getByRole("button", { name: /Apri mappa posizioni/ }).tap();
    const syncedLocation = coordinatorPage.locator(".locationList article").filter({ hasText: travelerName });
    await expect(syncedLocation).toContainText("28.6139, 77.2090", { timeout: 15_000 });
    await expect(syncedLocation.getByRole("button", { name: "Cancella posizione" })).toHaveCount(0);
    await coordinatorPage.getByRole("button", { name: /Chiudi mappa posizioni/ }).tap();
    await expect(coordinatorPage.locator(".peopleLocationMap")).toHaveCount(0);

    await publicPage.goto(baseUrl, { waitUntil: "networkidle" });
    await openPersonalPanel(publicPage);
    await expect(publicPage.locator(".lockedComposer")).toContainText("Accesso privato");
    await expect(publicPage.locator(".locationList")).toHaveCount(0);
    await expect(publicPage.locator(".locationMapToggle")).toHaveCount(0);

    await tapBottom(travelerPage, "Bacheca");
    await openPersonalPanel(travelerPage);
    const deleteResponse = travelerPage.waitForResponse(
      (response) => response.url().includes("/api/locations/") && response.request().method() === "DELETE",
    );
    await travelerPage.getByRole("button", { name: "Cancella posizione" }).tap();
    expect((await deleteResponse).status()).toBe(200);
    await expect(travelerPage.getByText("Posizione cancellata.")).toBeVisible();
    await expect(syncedLocation).toHaveCount(0, { timeout: 15_000 });

    await travelerContext.clearPermissions();
    let deniedRequestCount = 0;
    travelerPage.on("request", (request) => {
      if (request.url().endsWith("/api/locations") && request.method() === "POST") deniedRequestCount += 1;
    });
    await travelerPage.getByRole("button", { name: "Condividi posizione" }).tap();
    await expect(travelerPage.getByText("Permesso posizione non disponibile.")).toBeVisible();
    expect(deniedRequestCount).toBe(0);
  } finally {
    await Promise.all([
      travelerContext.close(),
      coordinatorContext.close(),
      publicContext.close(),
    ]);
  }
});
