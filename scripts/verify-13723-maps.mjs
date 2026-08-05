import { chromium, devices } from "playwright";
import fs from "node:fs/promises";

const out = "test-results/1.37.23";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ...devices["Galaxy S9+"], serviceWorkers: "block" });
const page = await context.newPage();

async function openMap(day, file) {
  const suffix = day == null ? "" : `&day=${day}`;
  await page.goto(`http://127.0.0.1:4176/?view=map${suffix}`, { waitUntil: "networkidle" });
  await page.locator(".mapLoading").waitFor({ state: "hidden", timeout: 30000 });
  await page.screenshot({ path: `${out}/${file}`, fullPage: false });
}

await openMap(null, "overview-s9.png");
const overview = await page.evaluate(() => ({
  numbered: [...document.querySelectorAll(".overviewRouteMap .vectorMarker")].map((el) => ({
    text: el.textContent, rect: el.getBoundingClientRect().toJSON(),
  })),
  modes: [...document.querySelectorAll(".overviewModeMarker")].map((el) => ({
    text: el.textContent, rect: el.getBoundingClientRect().toJSON(),
  })),
  legend: document.querySelector(".overviewRouteLegend")?.textContent,
}));
await openMap(1, "delhi-day2-s9.png");
await openMap(3, "flight-day3-s9.png");
await openMap(10, "train-day10-s9.png");
console.log(JSON.stringify(overview));
await browser.close();
