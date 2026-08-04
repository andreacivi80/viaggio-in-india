import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const hotelDays = [
  [0, "Rockland Hotel C.R. Park"],
  [1, "Rockland Hotel C.R. Park"],
  [2, "Akshay Niwas Boutique Hotel by Amantra"],
  [3, "Akshay Niwas Boutique Hotel by Amantra"],
  [4, "Hotel Rajwara Palace"],
  [5, "Hotel Rajwara Palace"],
  [6, "The Wall Street Beacon Hotel"],
  [7, "The Wall Street Beacon Hotel"],
  [8, "Hotel Taj Vilas"],
  [9, "Hotel Taj Vilas"],
  [10, "Costa River Varanasi"],
  [11, "Costa River Varanasi"],
  [12, "Costa River Varanasi"],
];

async function mockState(page) {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/state") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ sync_version: 1, profiles: [], posts: [] }) });
    }
    if (path === "/api/weather") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ forecasts: [] }) });
    }
    if (path === "/api/sync/version") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ version: 1 }) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
}

test("gli alloggi compaiono nelle giornate corrette e restano leggibili su mobile", async ({ page }, testInfo) => {
  await mockState(page);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Viaggio", exact: true }).tap();
  for (const [dayIndex, hotelName] of hotelDays) {
    await page.getByRole("button", { name: new RegExp(`^Giorno ${dayIndex + 1},`) }).tap();
    const lodging = page.locator(".day .lodgingCard");
    await expect(lodging).toBeVisible();
    await expect(lodging).toContainText(hotelName);
    await expect(lodging.getByRole("link", { name: "Apri" })).toBeVisible();
  }
  await page.getByRole("button", { name: /^Giorno 10,/ }).tap();
  await expect(page.locator(".day .overnightCard")).toContainText("Notte in treno · Agra → Varanasi");
  await page.getByRole("button", { name: /^Giorno 13,/ }).tap();
  await expect(page.locator(".day .overnightCard")).toContainText("Notte in treno · Varanasi → Delhi");
  await page.locator(".day").nth(12).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("hotel-varanasi-mobile.png") });
});

test("gli spostamenti brevi occupano una porzione leggibile della cartina", async ({ page }, testInfo) => {
  await mockState(page);
  await page.goto("/?view=map&day=4", { waitUntil: "networkidle" });
  await expect(page.locator(".mapLoading")).toBeHidden({ timeout: 30_000 });
  const city = page.locator('.vectorMarker[aria-label="Tappa 2: Udaipur"]');
  const hotel = page.locator('.specialTripMarker[aria-label="Akshay Niwas Boutique Hotel by Amantra"]');
  const [cityBox, hotelBox] = await Promise.all([city.boundingBox(), hotel.boundingBox()]);
  const distance = Math.hypot(
    cityBox.x + cityBox.width / 2 - hotelBox.x - hotelBox.width / 2,
    cityBox.y + cityBox.height / 2 - hotelBox.y - hotelBox.height / 2,
  );
  expect(distance).toBeGreaterThan(24);
  await page.screenshot({ path: testInfo.outputPath("zoom-udaipur-mobile.png") });
});

test("la cartina ridistribuisce ogni giornata sull'hotel e mostra tutti gli hotel nell'insieme", async ({ page }, testInfo) => {
  await mockState(page);
  await page.goto("/?view=map&day=3", { waitUntil: "networkidle" });
  const map = page.locator(".realMap");
  await expect(map).toBeVisible();
  for (const [dayIndex, hotelName] of hotelDays) {
    await page.locator(".routeChips button").nth(dayIndex).tap();
    const marker = page.locator(`.specialTripMarker[aria-label="${hotelName}"]`);
    await expect(marker).toBeVisible({ timeout: 20_000 });
    const [mapBox, markerBox] = await Promise.all([map.boundingBox(), marker.boundingBox()]);
    expect(markerBox.x).toBeGreaterThanOrEqual(mapBox.x);
    expect(markerBox.y).toBeGreaterThanOrEqual(mapBox.y);
    expect(markerBox.x + markerBox.width).toBeLessThanOrEqual(mapBox.x + mapBox.width);
    expect(markerBox.y + markerBox.height).toBeLessThanOrEqual(mapBox.y + mapBox.height);
  }
  await page.getByRole("button", { name: "Vedi tutto" }).tap();
  await expect(page.locator(".vectorMarker")).toHaveCount(8);
  await expect(page.locator(".specialTripMarker")).toHaveCount(6);
  await expect(page.locator(".mapLoading")).toBeHidden({ timeout: 30_000 });
  await page.screenshot({ path: testInfo.outputPath("mappa-hotel-completa.png") });
});
