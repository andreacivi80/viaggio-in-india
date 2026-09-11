import { test, expect, devices } from "@playwright/test";
import { days } from "../src/tripThailand.js";

test.use({ ...devices["Galaxy S9+"], serviceWorkers: "block" });

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

test("le undici giornate non inventano hotel non ancora comunicati", async ({ page }) => {
  await mockState(page);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Viaggio", exact: true }).tap();

  const dayButtons = page.getByRole("button", { name: /^Giorno \d+,/ });
  await expect(dayButtons).toHaveCount(days.length);
  for (let index = 0; index < days.length; index += 1) {
    await dayButtons.nth(index).tap();
    await expect(page.locator(".day .lodgingCard")).toHaveCount(0);
  }
});

test("le due notti speciali compaiono soltanto nelle giornate corrette", async ({ page }) => {
  await mockState(page);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Viaggio", exact: true }).tap();

  const expected = new Map([
    [4, "Notte nel floating village sul lago"],
    [8, "Notte in bus · Surat Thani → Bangkok"],
  ]);
  const dayButtons = page.getByRole("button", { name: /^Giorno \d+,/ });
  for (let index = 0; index < days.length; index += 1) {
    await dayButtons.nth(index).tap();
    const card = page.locator(".day .overnightCard");
    if (expected.has(index)) await expect(card).toContainText(expected.get(index));
    else await expect(card).toHaveCount(0);
  }
});

test("la vista generale resta pulita da hotel finché non vengono forniti", async ({ page }) => {
  await mockState(page);
  await page.goto("/?view=map", { waitUntil: "networkidle" });
  await expect(page.locator(".mapLoading")).toBeHidden({ timeout: 30_000 });
  await expect(page.locator(".overviewRouteMap .vectorMarker")).toHaveCount(8);
  await expect(page.locator(".specialTripMarker")).toHaveCount(0);
  await expect(page.locator(".routeChips button")).toHaveCount(days.length);
});
