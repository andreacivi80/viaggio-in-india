import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const mockPublicState = async (page) => {
  await page.route("**/api/state", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ sync_version: 1, profiles: [], posts: [] }),
  }));
};

const openJourney = async (page) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator(".tabs").getByRole("button", { name: "Viaggio", exact: true }).tap();
  await expect(page.locator(".diaryDayPicker")).toBeVisible();
};

test("titolo e anteprima del link identificano la Thailandia", async ({ page }) => {
  await mockPublicState(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle("Viaggio in Thailandia 2026 · Thailandia Insieme");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Viaggio in Thailandia 2026");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/thailand\/thailandia-insieme\.png$/);
  await expect(page.locator('img[alt="Bandiera della Thailandia"]')).toBeVisible();
  const heroBackground = await page.locator(".hero").evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(heroBackground).toContain("/thailand/khao-sok.jpg");
});

test("le undici giornate thailandesi hanno foto complete e contenuto", async ({ page }) => {
  test.slow();
  await mockPublicState(page);
  await openJourney(page);
  const days = page.locator(".diaryDayPicker button");
  await expect(days).toHaveCount(11);
  await expect(days.first()).toContainText("Bangkok");
  await expect(days.last()).toContainText("Bangkok");
  for (let index = 0; index < 11; index += 1) {
    await days.nth(index).tap();
    const article = page.locator(".day").nth(index);
    await expect(article).toHaveClass(/open/);
    await expect(article.locator(".dayBody")).toBeVisible();
    const image = article.locator('img[alt^="Vista di "]');
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((node) => node.complete && node.naturalWidth > 100)).toBe(true);
  }
});

test("la scheda Bangkok scorre con gesto touch fino alle informazioni finali", async ({ page }) => {
  await mockPublicState(page);
  await openJourney(page);
  await page.locator(".diaryDayPicker button").first().tap();
  await page.getByRole("button", { name: "Scopri Bangkok" }).tap();
  const sheet = page.getByRole("dialog", { name: "Conosci Bangkok" });
  await expect(sheet).toBeVisible();
  const before = await sheet.evaluate((node) => node.scrollTop);
  const box = await sheet.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height - 100);
  await sheet.evaluate((node) => node.scrollTo({ top: node.scrollHeight, behavior: "instant" }));
  await expect.poll(() => sheet.evaluate((node) => node.scrollTop)).toBeGreaterThan(before);
  await expect(sheet.getByText("COSA LA RENDE SPECIALE")).toBeVisible();
  await page.getByRole("button", { name: "Chiudi informazioni città" }).tap();
  await expect(sheet).toBeHidden();
});

test("mappa generale e mappe giornaliere mantengono tappe e percorsi", async ({ page }) => {
  test.slow();
  await mockPublicState(page);
  await page.goto("/?view=map", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".mapLoading")).toBeHidden({ timeout: 30_000 });
  await expect(page.locator(".overviewRouteMap .vectorMarker")).toHaveCount(8);
  await expect(page.locator(".overviewRouteMap .tripCityNameLabel")).toHaveCount(7);
  for (const city of ["Bangkok", "Hua Hin", "Chumphon", "Khao Sok", "Cheow Lan Lake", "Phi Phi Island", "Krabi"])
    await expect(page.locator(`.tripCityNameLabel[data-city-name="${city}"]`)).toBeVisible();
  const routeButtons = page.locator(".routeChips button");
  await expect(routeButtons).toHaveCount(11);
  for (let index = 0; index < 11; index += 1) {
    await routeButtons.nth(index).tap();
    await expect(page.locator(".mapLoading")).toBeHidden({ timeout: 30_000 });
    await expect(page.locator(".transportMapBadge")).toBeVisible();
    await expect(page.locator(".routeEndpointMarker")).toHaveCount(2);
  }
});
