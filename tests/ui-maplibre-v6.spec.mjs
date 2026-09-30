import { expect, test, devices } from "@playwright/test";

const baseUrl = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
test.skip(!baseUrl, "URL QA richiesta");
test.use({ ...devices["Galaxy S9+"], serviceWorkers: "block" });

test("MapLibre v6 carica worker, percorso e marker senza fallback", async ({ page }) => {
  const diagnostics = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) diagnostics.push(`console:${message.type()}:${message.text()}`);
  });
  page.on("pageerror", (error) => diagnostics.push(`pageerror:${error.message}`));
  page.on("requestfailed", (request) => diagnostics.push(`request:${request.url()}:${request.failure()?.errorText || "failed"}`));

  await page.goto(`${baseUrl}/?view=map`, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".maplibregl-canvas")).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(13_000);
  expect(await page.locator(".overviewRouteMap .vectorMarker").count(), diagnostics.join("\n")).toBe(8);
  await expect(page.getByText("Cartina momentaneamente non disponibile")).toHaveCount(0);
  const relevantDiagnostics = diagnostics.filter((entry) =>
    /Worker failed to load|pageerror:|request:.*maplibre|console:error:.*maplibre/i.test(entry),
  );
  expect(relevantDiagnostics, diagnostics.join("\n")).toEqual([]);
});
