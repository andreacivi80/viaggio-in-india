import { test, expect, devices } from "@playwright/test";

test.use({ ...devices["Galaxy S9+"], serviceWorkers: "block" });

const waitForMap = async (page) => {
  await page.locator(".mapLoading").waitFor({ state: "hidden", timeout: 30_000 });
  await expect(page.locator(".realMap canvas")).toBeVisible();
};

test("mappa generale: numeri piccoli, mezzi distinti e nessuna sovrapposizione", async ({ page }) => {
  await page.goto("/?view=map", { waitUntil: "networkidle" });
  await waitForMap(page);
  await expect(page.locator(".overviewRouteMap .vectorMarker")).toHaveCount(8);
  await expect(page.locator(".overviewRouteMap .tripCityNameLabel")).toHaveCount(7);
  for (const city of ["Delhi", "Udaipur", "Ranakpur", "Jodhpur", "Jaipur", "Agra", "Varanasi"])
    await expect(page.locator(`.tripCityNameLabel[data-city-name="${city}"]`)).toBeVisible();
  await expect(page.locator(".overviewModeMarker")).toHaveCount(5);
  await expect(page.locator('.overviewModeMarker[data-route-reference="DEL–UDR"]')).toHaveCount(1);
  await expect(page.locator('.overviewModeMarker[data-route-reference="Udaipur–Jodhpur"]')).toHaveCount(1);
  await expect(page.locator('.overviewModeMarker[data-route-reference="Agra–Varanasi"]')).toHaveCount(1);
  await expect(page.locator('.overviewModeMarker[data-route-reference="Varanasi"]')).toHaveCount(1);
  await expect(page.locator('.overviewModeMarker[data-route-reference="Jodhpur"]')).toHaveCount(1);
  await expect(page.locator(".overviewRouteLegend")).toContainText("Aereo");
  await expect(page.locator(".overviewRouteLegend")).toContainText("Van");
  await expect(page.locator(".overviewRouteLegend")).toContainText("Treno");
  const geometry = await page.evaluate(() => {
    const boxes = (selector) => [...document.querySelectorAll(selector)].map((el) => {
      const r = el.getBoundingClientRect();
      return { name: el.dataset.routeReference || el.textContent, nearStage: el.dataset.nearStage || "", left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width };
    });
    const numbered = boxes(".overviewRouteMap .vectorMarker");
    const modes = boxes(".overviewModeMarker");
    const overlaps = modes.flatMap((mode) => numbered.filter((point) =>
      mode.left < point.right && mode.right > point.left && mode.top < point.bottom && mode.bottom > point.top,
    ).map((point) => `${mode.name}:${point.name}`));
    const distances = modes.map((mode) => {
      const target = numbered.find((point) => point.name === mode.nearStage);
      return target ? Math.hypot((mode.left + mode.right - target.left - target.right) / 2, (mode.top + mode.bottom - target.top - target.bottom) / 2) : Infinity;
    });
    const legend = document.querySelector(".overviewRouteLegend")?.getBoundingClientRect();
    const scale = document.querySelector(".maplibregl-ctrl-scale")?.getBoundingClientRect();
    const legendScaleOverlap = Boolean(legend && scale && legend.left < scale.right && legend.right > scale.left && legend.top < scale.bottom && legend.bottom > scale.top);
    return { numbered, overlaps, distances, legendScaleOverlap };
  });
  expect(geometry.numbered.every((box) => box.width <= 19)).toBe(true);
  expect(geometry.overlaps).toEqual([]);
  expect(geometry.distances.every((distance) => distance <= 58)).toBe(true);
  expect(geometry.legendScaleOverlap).toBe(false);
});

test("cartina provenienze: Mantova è riconosciuta e i gruppi restano compatti", async ({ page }) => {
  const profiles = [
    { id: "mantova-1", name: "Viaggiatore", surname: "Mantova", origin_city: "Mantova", role: "traveler" },
    { id: "milano-1", name: "Viaggiatore", surname: "Milano", origin_city: "Milano", role: "traveler" },
    { id: "milano-2", name: "Viaggiatrice", surname: "Milano", origin_city: "Milano", role: "traveler" },
  ];
  await page.route("**/api/state", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ sync_version: 1, profiles, posts: [] }),
  }));
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Apri la cartina di provenienza dei viaggiatori" }).click();
  await expect(page.getByRole("dialog", { name: "Da dove arriviamo" })).toBeVisible();
  await expect(page.locator('.italyOriginMarker[aria-label="1 da Mantova"]')).toBeVisible();
  await expect(page.locator('.italyOriginMarker[aria-label="2 da Milano"]')).toBeVisible();
  const sizes = await page.locator(".italyOriginMarker").evaluateAll((markers) => markers.map((marker) => {
    const rect = marker.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  expect(sizes.every(({ width, height }) => width <= 30 && height <= 30)).toBe(true);
});

for (const [day, expectedMode, expectedStops] of [
  [3, "Aereo", 3],
  [10, "Treno notturno", 3],
  [13, "Treno", 3],
]) {
  test(`giorno ${day}: percorso ${expectedMode} agganciato a scali e alloggio`, async ({ page }) => {
    await page.goto(`/?view=map&day=${day}`, { waitUntil: "networkidle" });
    await waitForMap(page);
    await expect(page.locator(".transportMapBadge")).toContainText(expectedMode);
    await expect(page.locator(".routeEndpointMarker")).toHaveCount(2);
    await expect(page.locator(".specialTripMarker")).toHaveCount(expectedStops);
    await expect(page.locator(".routeMapSummary")).toBeVisible();
  });
}

test("tutte le quattordici mappe giornaliere mostrano cartografia e nomi delle città", async ({ page }) => {
  const expectedCities = ["Delhi", "Delhi", "Udaipur", "Udaipur", "Jodhpur", "Jodhpur", "Jaipur", "Jaipur", "Agra", "Agra", "Varanasi", "Varanasi", "Varanasi", "Delhi"];
  await page.goto("/?view=map", { waitUntil: "networkidle" });
  await waitForMap(page);
  const dayButtons = page.locator(".routeChips button");
  await expect(dayButtons).toHaveCount(14);
  for (let index = 0; index < 14; index += 1) {
    await dayButtons.nth(index).tap();
    await waitForMap(page);
    await expect(page.locator(".dayRouteMap .tripCityNameLabel").filter({ hasText: expectedCities[index] })).toBeVisible();
    await expect(page.locator(".routeMapSummary")).toBeVisible();
    const canvas = await page.locator(".dayRouteMap canvas").evaluate((node) => ({ width: node.width, height: node.height }));
    expect(canvas.width).toBeGreaterThan(300);
    expect(canvas.height).toBeGreaterThan(300);
  }
});
