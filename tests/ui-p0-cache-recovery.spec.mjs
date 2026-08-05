import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "allow" });

test("P0: cache vecchia e cache difettosa vengono eliminate mantenendo l'app offline", async ({ page, context }) => {
  test.setTimeout(90_000);
  await page.goto("/", { waitUntil: "networkidle" });
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
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => caches.keys()), { timeout: 20_000 }).toEqual([
    "india-insieme-v1.37.19",
  ]);
  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Raccontiamocele insieme/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("body")).not.toContainText(/pagina vecchia|pagina non valida/i);
  } finally {
    await context.setOffline(false);
  }
});
