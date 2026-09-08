import { test, expect, devices } from "@playwright/test";
import { days } from "../src/tripThailand.js";

test.use({ ...devices["Galaxy S9+"], serviceWorkers: "block" });

const waitForMap = async (page) => {
  await page.locator(".mapLoading").waitFor({ state: "hidden", timeout: 30_000 });
  await expect(page.locator(".realMap canvas")).toBeVisible();
};

const expectFullItalyViewport = async (map) => {
  await expect(map).toHaveAttribute("data-viewport-west", /-?\d+\.\d+/);
  await expect(map).toHaveAttribute("data-viewport-south", /-?\d+\.\d+/);
  await expect(map).toHaveAttribute("data-viewport-east", /-?\d+\.\d+/);
  await expect(map).toHaveAttribute("data-viewport-north", /-?\d+\.\d+/);
  const bounds = await map.evaluate((node) => ({
    west: Number(node.dataset.viewportWest),
    south: Number(node.dataset.viewportSouth),
    east: Number(node.dataset.viewportEast),
    north: Number(node.dataset.viewportNorth),
  }));
  expect(bounds.west).toBeLessThanOrEqual(6.4);
  expect(bounds.south).toBeLessThanOrEqual(35.4);
  expect(bounds.east).toBeGreaterThanOrEqual(18.9);
  expect(bounds.north).toBeGreaterThanOrEqual(47.2);
};

test("mappa generale: numeri piccoli, mezzi distinti e nessuna sovrapposizione", async ({ page }) => {
  await page.goto("/?view=map", { waitUntil: "networkidle" });
  await waitForMap(page);
  await expect(page.locator(".overviewRouteMap .vectorMarker")).toHaveCount(8);
  await expect(page.locator('.overviewRouteMap .overviewStageAnchor[data-stage-index="6"] .overviewStageConnector')).toBeVisible();
  await expect(page.locator('.overviewRouteMap .overviewStageAnchor[data-stage-index="7"]')).toHaveCount(0);
  await expect(page.locator(".overviewRouteMap .tripCityNameLabel")).toHaveCount(7);
  for (const city of ["Bangkok", "Hua Hin", "Chumphon", "Khao Sok", "Cheow Lan Lake", "Phi Phi Island", "Krabi"])
    await expect(page.locator(`.tripCityNameLabel[data-city-name="${city}"]`)).toBeVisible();
  await expect(page.locator(".overviewModeMarker")).toHaveCount(5);
  for (const reference of ["Bangkok–Hua Hin", "Kui Buri", "Cheow Lan", "Phi Phi", "Surat–Bangkok"])
    await expect(page.locator(`.overviewModeMarker[data-route-reference="${reference}"]`)).toHaveCount(1);
  await expect(page.locator(".overviewRouteLegend")).toContainText("Van");
  await expect(page.locator(".overviewRouteLegend")).toContainText("Bus notturno");
  await expect(page.locator(".overviewRouteLegend")).toContainText("Barca");
  await expect(page.locator(".overviewRouteLegend")).toContainText("Piedi");
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
  expect(geometry.distances.every((distance) => distance <= 58), JSON.stringify(geometry.distances)).toBe(true);
  expect(geometry.legendScaleOverlap).toBe(false);
});

test("la cartina resta utilizzabile se OpenFreeMap non risponde", async ({ page }) => {
  await page.route("**/styles/liberty*", (route) => route.abort("failed"));
  await page.goto("/?view=map", { waitUntil: "domcontentloaded" });
  const fallback = page.getByRole("status").filter({ hasText: "Cartina momentaneamente non disponibile" });
  await expect(fallback).toBeVisible({ timeout: 20_000 });
  await expect(fallback).toContainText("Bangkok");
  await expect(fallback).toContainText("Phi Phi Island");
  await expect(fallback).toContainText("Krabi");
  await expect(page.locator(".mapLoading")).toHaveCount(0);
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
  await expectFullItalyViewport(page.locator(".italyOriginsMap"));
});

test("cartina provenienze: un solo viaggiatore di Milano non restringe la vista", async ({ page }) => {
  const profiles = [
    { id: "milano-solo", name: "Viaggiatore", surname: "Milano", origin_city: "Milano", role: "traveler" },
  ];
  await page.route("**/api/state", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ sync_version: 1, profiles, posts: [] }),
  }));
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Apri la cartina di provenienza dei viaggiatori" }).click();
  const map = page.locator(".italyOriginsMap");
  await expect(page.locator('.italyOriginMarker[aria-label="1 da Milano"]')).toBeVisible();
  await expectFullItalyViewport(map);
  await page.setViewportSize({ width: 360, height: 740 });
  await expectFullItalyViewport(map);
});

test("cartina provenienze: diciotto viaggiatori su più città mantengono la vista nazionale", async ({ page }) => {
  const cities = ["Milano", "Mantova", "Roma", "Palermo", "Cagliari", "Torino"];
  const profiles = Array.from({ length: 18 }, (_, index) => ({
    id: `traveler-${index + 1}`,
    name: `Viaggiatore ${index + 1}`,
    surname: "Test",
    origin_city: cities[index % cities.length],
    role: "traveler",
  }));
  await page.route("**/api/state", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ sync_version: 1, profiles, posts: [] }),
  }));
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Apri la cartina di provenienza dei viaggiatori" }).click();
  await expect(page.locator(".italyOriginMarker")).toHaveCount(cities.length);
  await expectFullItalyViewport(page.locator(".italyOriginsMap"));
});

test("tutte le undici mappe giornaliere mostrano cartografia, percorso e nomi delle città", async ({ page }) => {
  await page.goto("/?view=map", { waitUntil: "networkidle" });
  await waitForMap(page);
  const dayButtons = page.locator(".routeChips button");
  await expect(dayButtons).toHaveCount(days.length);
  for (let index = 0; index < days.length; index += 1) {
    await dayButtons.nth(index).tap();
    await waitForMap(page);
    await expect(page.locator(".dayRouteMap .tripCityNameLabel").filter({ hasText: days[index].city })).toBeVisible();
    await expect(page.locator(".routeMapSummary")).toBeVisible();
    if (days[index].from !== days[index].to)
      await expect(page.locator(".routeEndpointMarker")).toHaveCount(2);
    const canvas = await page.locator(".dayRouteMap canvas").evaluate((node) => ({ width: node.width, height: node.height }));
    expect(canvas.width).toBeGreaterThan(300);
    expect(canvas.height).toBeGreaterThan(300);
  }
});
