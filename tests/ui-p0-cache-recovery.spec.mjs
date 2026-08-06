import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

const packageData = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

test.use({ serviceWorkers: "allow" });

test("P0: cache vecchia e cache difettosa vengono eliminate mantenendo l'app offline", async ({ page, context }) => {
  test.setTimeout(90_000);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Raccontiamocele insieme/i })).toBeVisible();
  await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
    const oldCache = await caches.open("india-insieme-v1.37.18");
    await oldCache.put("./", new Response("pagina vecchia", { headers: { "content-type": "text/html" } }));
    const brokenCache = await caches.open("india-insieme-cache-difettosa");
    await brokenCache.put("./", new Response("pagina non valida", { status: 500 }));
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => caches.keys()), { timeout: 20_000 }).toEqual([
    `india-insieme-v${packageData.version}`,
  ]);
  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Raccontiamocele insieme/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("body")).not.toContainText(/pagina vecchia|pagina non valida/i);
    await page.getByRole("button", { name: "Viaggio", exact: true }).tap();
    await page.getByText("Emergenza e dati offline", { exact: true }).tap();
    await expect(page.getByRole("link", { name: /112/ })).toHaveAttribute("href", "tel:112");
    await expect(page.getByRole("link", { name: /91 98101 58737/ })).toHaveAttribute("href", "tel:+919810158737");
    await expect(page.getByText(/Le giornate conservano localmente tappe/)).toBeVisible();
    await expect(page.getByText("Rockland Hotel C.R. Park", { exact: true })).toBeVisible();
    await expect(page.getByText(/B-207.*Outer Ring Road.*New Delhi/i)).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
