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
  await expect(page.locator(".overviewModeMarker")).toHaveCount(5);
  await expect(page.locator(".overviewRouteLegend")).toContainText("Aereo");
  await expect(page.locator(".overviewRouteLegend")).toContainText("Van");
  await expect(page.locator(".overviewRouteLegend")).toContainText("Treno");
  const geometry = await page.evaluate(() => {
    const boxes = (selector) => [...document.querySelectorAll(selector)].map((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width };
    });
    const numbered = boxes(".overviewRouteMap .vectorMarker");
    const modes = boxes(".overviewModeMarker");
    const overlaps = modes.flatMap((mode) => numbered.filter((point) =>
      mode.left < point.right && mode.right > point.left && mode.top < point.bottom && mode.bottom > point.top,
    ));
    return { numbered, overlaps: overlaps.length };
  });
  expect(geometry.numbered.every((box) => box.width <= 19)).toBe(true);
  expect(geometry.overlaps).toBe(0);
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
