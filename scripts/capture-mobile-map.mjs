import { chromium, devices } from "@playwright/test";

const baseUrl = process.env.TEST_BASE_URL;
const output = process.env.MAP_SCREENSHOT;
if (!baseUrl || !output) throw new Error("TEST_BASE_URL e MAP_SCREENSHOT sono obbligatori");

const browser = await chromium.launch();
const context = await browser.newContext({ ...devices["Galaxy S9+"], serviceWorkers: "block" });
const page = await context.newPage();
await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
await page.getByRole("button", { name: "Mappa", exact: true }).tap();
await page.locator(".mapLoading").waitFor({ state: "hidden", timeout: 30_000 });
await page.locator(".overviewRouteMap").screenshot({ path: output });
await browser.close();
