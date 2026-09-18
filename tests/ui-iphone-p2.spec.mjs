import { test, expect, devices } from "@playwright/test";

const baseUrl = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
test.skip(!baseUrl, "URL QA richiesto");

const iphoneProfiles = [
  ["iPhone SE", devices["iPhone SE"]],
  ["iPhone 13", devices["iPhone 13"]],
  ["iPhone 13 Pro Max", devices["iPhone 13 Pro Max"]],
];

const tapCenter = async (page, locator) => {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
};

for (const [name, device] of iphoneProfiles) {
  test(`${name}: touch, scorrimento e geometria pubblica restano utilizzabili`, async ({ browser }) => {
    const context = await browser.newContext({ ...device, serviceWorkers: "allow" });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await expect(page.locator(".versionBadge")).toBeVisible();
    expect(await page.locator(".app").evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);

    for (const [tab, heading] of [
      ["Viaggio", "La storia, giorno per giorno"],
      ["Mappa", "Tutto l’itinerario"],
      ["Bacheca", "Raccontiamocele insieme"],
    ]) {
      const button = page.locator(".tabs").getByRole("button", { name: tab, exact: true });
      await tapCenter(page, button);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }

    await tapCenter(page, page.locator(".tabs").getByRole("button", { name: "Viaggio", exact: true }));
    await page.locator(".diaryDayPicker button").last().tap();
    await expect(page.locator(".day").last()).toHaveClass(/open/);
    await page.locator(".day").last().evaluate((node) => node.scrollIntoView({ block: "start" }));
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await context.close();
  });
}

test("iPhone standalone: manifest, icona e Service Worker sono serviti correttamente", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["iPhone 13"], serviceWorkers: "allow" });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "standalone", { configurable: true, value: true });
  });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  expect(await page.evaluate(() => navigator.standalone)).toBe(true);
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  const manifestResponse = await page.request.get(new URL(manifestHref, baseUrl).href);
  expect(manifestResponse.status()).toBe(200);
  expect((await manifestResponse.json()).display).toBe("standalone");
  const iconHref = await page.locator('link[rel="apple-touch-icon"]').getAttribute("href");
  expect((await page.request.get(new URL(iconHref, baseUrl).href)).status()).toBe(200);
  await expect.poll(() => page.evaluate(async () => Boolean(await navigator.serviceWorker.getRegistration()))).toBe(true);
  await context.close();
});

test("iPhone: struttura semantica navigabile per tecnologie assistive", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  for (const name of ["Viaggio", "Mappa", "Bacheca", "Gruppo", "Pubblica"])
    await expect(page.locator(".tabs").getByRole("button", { name, exact: true })).toHaveCount(1);
  await expect(page.getByRole("button", { name: /Apri elenco viaggiatori/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Attività recenti" })).toBeVisible();
  await context.close();
});
