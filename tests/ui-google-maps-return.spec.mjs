import { expect, test } from "@playwright/test";
import { days } from "../src/tripThailand.js";

const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:4186";

test("dopo Google Maps il telefono torna alla stessa giornata e la mappa resta utilizzabile", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: baseUrl,
    viewport: { width: 360, height: 740 },
    isMobile: true,
    hasTouch: true,
  });
  await context.route("https://www.google.com/maps/**", (route) => route.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<!doctype html><title>Google Maps</title><h1>Percorso aperto</h1>",
  }));
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Mappa", exact: true }).tap();
  const chosenDay = 4;
  await page.locator(".routeChips button").nth(chosenDay).tap();

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Apri questo percorso in Google Maps" }).tap();
  const googleMaps = await popupPromise;
  await googleMaps.waitForLoadState("domcontentloaded");
  const externalUrl = new URL(googleMaps.url());
  expect(externalUrl.searchParams.get("origin")).toBe(`${days[chosenDay].from}, Thailand`);
  expect(externalUrl.searchParams.get("destination")).toBe(`${days[chosenDay].to}, Thailand`);
  await googleMaps.close();

  await page.bringToFront();
  await expect(page.locator(".mapSection")).toBeVisible();
  await expect(page.locator(".mapHeading h2")).toHaveText(`${days[chosenDay].from} → ${days[chosenDay].to}`);
  await expect(page.locator(".routeChips button").nth(chosenDay)).toHaveClass(/active/);
  expect(new URL(page.url()).searchParams.get("day")).toBe("05");
  await page.locator(".routeChips button").nth(chosenDay + 1).tap();
  await expect(page.locator(".routeChips button").nth(chosenDay + 1)).toHaveClass(/active/);
  await context.close();
});
