import { test, expect } from "@playwright/test";

async function emulateNetwork(page, profile) {
  const handler = async (route) => {
    const type = route.request().resourceType();
    const estimatedBytes = type === "document" ? 2_000
      : type === "script" ? 330_000
        : type === "stylesheet" ? 165_000
          : type === "image" ? 120_000
            : 12_000;
    const transferMs = (estimatedBytes * 8 * 1000) / (profile.downloadKbps * 1024);
    await new Promise((resolve) => setTimeout(resolve, Math.min(8_000, profile.latency + transferMs)));
    await route.continue().catch(() => {});
  };
  await page.route("**/*", handler);
  return () => page.unroute("**/*", handler);
}

const networkProfiles = [
  { name: "Wi-Fi indiana debole", latency: 280, downloadKbps: 1400, uploadKbps: 450, connectionType: "wifi" },
  { name: "SIM indiana 3G", latency: 450, downloadKbps: 420, uploadKbps: 160, connectionType: "cellular3g" },
  { name: "roaming italiano congestionato", latency: 700, downloadKbps: 256, uploadKbps: 96, connectionType: "cellular3g" },
  { name: "eSIM indiana 4G", latency: 180, downloadKbps: 2200, uploadKbps: 700, connectionType: "cellular4g" },
];

for (const profile of networkProfiles) {
  test(`${profile.name}: la bacheca appare senza pagina bianca`, async ({ page }) => {
    test.setTimeout(90_000);
    const restoreNetwork = await emulateNetwork(page, profile);
    try {
      const startedAt = Date.now();
      const response = await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
      expect(response?.ok()).toBeTruthy();
      await expect(page.getByRole("heading", { name: /Raccontiamocele insieme/i })).toBeVisible({ timeout: 45_000 });
      await expect(page.locator("body")).not.toContainText(/application error|pagina bianca/i);
      expect(Date.now() - startedAt).toBeLessThan(60_000);
    } finally {
      await restoreNetwork().catch(() => {});
    }
  });
}

test("la bacheca non scarica subito i moduli pesanti di mappe, PDF e HEIC", async ({ page }) => {
  const scripts = [];
  page.on("response", (response) => {
    const url = response.url();
    if (/\/assets\/.*\.(?:js|mjs)(?:\?|$)/.test(url)) scripts.push(url);
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /Raccontiamocele insieme/i })).toBeVisible();
  expect(scripts.some((url) => /maplibre/i.test(url))).toBeFalsy();
  expect(scripts.some((url) => /pdf-/i.test(url) || /pdf\.worker/i.test(url))).toBeFalsy();
  expect(scripts.some((url) => /heic2any/i.test(url))).toBeFalsy();
});

test("dopo la prima apertura la bacheca pubblica si riapre senza rete", async ({ browser, browserName }) => {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  try {
    const page = await context.newPage();
    const diagnostics = [];
    page.on("console", (message) => diagnostics.push(`console:${message.type()}:${message.text()}`));
    page.on("pageerror", (error) => diagnostics.push(`pageerror:${error.message}`));
    page.on("requestfailed", (request) => diagnostics.push(`failed:${request.url()}:${request.failure()?.errorText || ""}`));
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /Raccontiamocele insieme/i })).toBeVisible();
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
      }
    });
    await expect.poll(() => page.evaluate(async () => {
      const keys = await caches.keys();
      const cache = await caches.open(keys.find((key) => key.startsWith("india-insieme-")) || "");
      const requests = await cache.keys();
      return requests.some((request) => /\/assets\/.*\.js$/.test(new URL(request.url).pathname));
    })).toBe(true);
    const cachedShell = await page.evaluate(async () => {
      const key = (await caches.keys()).find((item) => item.startsWith("india-insieme-"));
      if (!key) return { root: false, script: false, style: false };
      const cache = await caches.open(key);
      const scriptUrl = Array.from(document.scripts).map((script) => script.src).find((url) => /\/assets\/.*\.js$/.test(url));
      const styleUrl = document.querySelector('link[rel="stylesheet"]')?.href;
      const [root, script, style] = await Promise.all([
        cache.match(new URL("/", location.href).href),
        scriptUrl ? cache.match(scriptUrl) : null,
        styleUrl ? cache.match(styleUrl) : null,
      ]);
      return {
        root: Boolean(root && (await root.text()).includes('<div id="root"></div>')),
        script: Boolean(script && /javascript/i.test(script.headers.get("content-type") || "")),
        style: Boolean(style && /text\/css/i.test(style.headers.get("content-type") || "")),
      };
    });
    expect(cachedShell).toEqual({ root: true, script: true, style: true });
    // Playwright/WebKit non implementa in modo stabile reload + setOffline.
    // Su WebKit verifichiamo quindi byte e MIME dell'intero app shell in cache;
    // la riapertura offline reale resta coperta sui due profili Android.
    if (browserName === "webkit") return;
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    if (!(await page.getByRole("heading", { name: /Raccontiamocele insieme/i }).count())) {
      console.log("OFFLINE_DIAGNOSTICS", JSON.stringify({
        url: page.url(),
        controller: await page.evaluate(() => Boolean(navigator.serviceWorker.controller)).catch(() => false),
        html: (await page.content().catch(() => "")).slice(0, 500),
        diagnostics,
      }));
    }
    await expect(page.getByRole("heading", { name: /Raccontiamocele insieme/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("body")).not.toContainText(/documenti privati|passaporto caricato/i);
  } finally {
    await context.setOffline(false).catch(() => {});
    await context.close();
  }
});
