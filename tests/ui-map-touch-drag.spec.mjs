import { test, expect, devices } from "@playwright/test";

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
test.skip(!baseUrl, "URL QA richiesta");
test.use({ ...devices["Galaxy S9+"], viewport: { width: 412, height: 915 }, serviceWorkers: "block" });

test("la mappa si apre, resta sopra il contenuto senza coprire il menu e risponde al trascinamento touch", async ({ page, context }) => {
  const openingStartedAt = Date.now();
  await page.goto(`${baseUrl}/?view=map`, { waitUntil: "domcontentloaded" });
  const section = page.locator(".mapSection");
  const canvas = page.locator(".maplibregl-canvas");
  const marker = page.locator(".vectorMarker").first();
  await expect(section).toBeVisible({ timeout: 20_000 });
  await expect(canvas).toBeVisible({ timeout: 20_000 });
  const openingMs = Date.now() - openingStartedAt;
  expect(openingMs).toBeLessThan(12_000);
  console.log(`MAP_TOUCH_OPEN_MS=${openingMs}`);
  await expect(marker).toBeVisible();
  await expect(page.locator(".tabs")).toBeVisible();
  await expect(page.locator(".confirmOverlay")).toHaveCount(0);

  const canvasBox = await canvas.boundingBox();
  const markerBefore = await marker.boundingBox();
  expect(canvasBox).toBeTruthy();
  expect(markerBefore).toBeTruthy();
  const x = canvasBox.x + canvasBox.width * 0.55;
  const y = canvasBox.y + canvasBox.height * 0.55;
  const client = await context.newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y, radiusX: 7, radiusY: 7, force: 1, id: 1 }],
  });
  for (let step = 1; step <= 5; step += 1)
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + step * 16, y: y + step * 4, radiusX: 7, radiusY: 7, force: 1, id: 1 }],
    });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(500);

  const markerAfter = await marker.boundingBox();
  expect(markerAfter).toBeTruthy();
  expect(Math.hypot(markerAfter.x - markerBefore.x, markerAfter.y - markerBefore.y)).toBeGreaterThan(15);

  await page.getByRole("button", { name: "Bacheca", exact: true }).tap();
  await expect(page.locator(".mapSection")).toHaveCount(0);
  await expect(page.getByPlaceholder("Luogo, persona, racconto…")).toBeVisible();
});
