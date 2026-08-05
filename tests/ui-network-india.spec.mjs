import { test, expect } from "@playwright/test";

const BASE_URL = process.env.TEST_BASE_URL || "https://viaggio-in-india-2026-qa.pages.dev/";

async function emulateSlowMobile(page) {
  const session = await page.context().newCDPSession(page);
  await session.send("Network.enable");
  await session.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 450,
    downloadThroughput: Math.floor(420 * 1024 / 8),
    uploadThroughput: Math.floor(160 * 1024 / 8),
    connectionType: "cellular3g",
  });
  return session;
}

test("rete mobile lenta: la bacheca appare senza pagina bianca", async ({ page }) => {
  test.setTimeout(90_000);
  const session = await emulateSlowMobile(page);
  try {
    const startedAt = Date.now();
    const response = await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: /Raccontiamocele insieme/i })).toBeVisible({ timeout: 45_000 });
    await expect(page.locator("body")).not.toContainText(/application error|pagina bianca/i);
    expect(Date.now() - startedAt).toBeLessThan(60_000);
  } finally {
    await session.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
      connectionType: "none",
    }).catch(() => {});
    await session.detach().catch(() => {});
  }
});

test("la bacheca non scarica subito i moduli pesanti di mappe, PDF e HEIC", async ({ page }) => {
  const scripts = [];
  page.on("response", (response) => {
    const url = response.url();
    if (/\/assets\/.*\.(?:js|mjs)(?:\?|$)/.test(url)) scripts.push(url);
  });
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /Raccontiamocele insieme/i })).toBeVisible();
  expect(scripts.some((url) => /maplibre/i.test(url))).toBeFalsy();
  expect(scripts.some((url) => /pdf-/i.test(url) || /pdf\.worker/i.test(url))).toBeFalsy();
  expect(scripts.some((url) => /heic2any/i.test(url))).toBeFalsy();
});

test("dopo la prima apertura la bacheca pubblica si riapre senza rete", async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  try {
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /Raccontiamocele insieme/i })).toBeVisible();
    await page.waitForTimeout(1500);
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Raccontiamocele insieme/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("body")).not.toContainText(/documenti privati|passaporto caricato/i);
  } finally {
    await context.setOffline(false).catch(() => {});
    await context.close();
  }
});
