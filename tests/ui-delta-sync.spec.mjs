import { test, expect, devices } from "@playwright/test";

test.use({ ...devices["Galaxy S9+"], serviceWorkers: "block" });

test("il telefono scarica lo stato completo soltanto quando cambia la versione", async ({ page }) => {
  test.setTimeout(45_000);
  let serverVersion = 1;
  let stateRequests = 0;
  let versionRequests = 0;
  await page.route("**/api/state*", async (route) => {
    stateRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sync_version: serverVersion,
        viewer: null,
        profiles: [],
        posts: [],
        trip_checks: {},
      }),
    });
  });
  await page.route("**/api/sync/version*", async (route) => {
    versionRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ version: serverVersion }),
    });
  });
  await page.route("**/api/weather*", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ forecasts: [] }),
  }));

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Raccontiamocele insieme/i })).toBeVisible();
  await page.waitForTimeout(1_000);
  const initialStateRequests = stateRequests;
  expect(initialStateRequests).toBeGreaterThanOrEqual(1);
  await page.waitForTimeout(11_000);
  expect(versionRequests).toBeGreaterThanOrEqual(2);
  expect(stateRequests).toBe(initialStateRequests);

  serverVersion = 2;
  await expect.poll(() => stateRequests, { timeout: 8_000 }).toBe(initialStateRequests + 1);
  await page.waitForTimeout(6_000);
  expect(stateRequests).toBe(initialStateRequests + 1);
});
