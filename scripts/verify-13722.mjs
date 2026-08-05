import { spawn } from "node:child_process";
import { chromium, devices } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", "4173"], { stdio: "ignore", windowsHide: true });
const base = "http://127.0.0.1:4173";
const waitServer = async () => {
  for (let i = 0; i < 40; i += 1) {
    try { if ((await fetch(base)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("preview unavailable");
};
const createdAt = (i) => new Date(Date.UTC(2026, 7, 4, 8, i)).toISOString();
const profiles = [
  { id: "p01", name: "Valentina", surname: "Careri", age: "45", job: "Architetto", origin_city: "Palermo", role: "coordinator", gender: "female", created_at: createdAt(0) },
  ...Array.from({ length: 6 }, (_, i) => ({ id: "f"+i, name: "Donna"+(i+1), surname: "Test", origin_city: "Roma", role: "traveler", gender: "female", created_at: createdAt(i+1) })),
  ...Array.from({ length: 7 }, (_, i) => ({ id: "m"+i, name: i === 6 ? "Andrea" : "Uomo"+(i+1), surname: "Test", origin_city: "Torino", role: "traveler", gender: "male", created_at: createdAt(i+7) })),
  ...Array.from({ length: 4 }, (_, i) => ({ id: "u"+i, name: "NonIndicato"+(i+1), surname: "Test", origin_city: "", role: "traveler", gender: "", created_at: createdAt(i+14) })),
];
let browser;
try {
  await waitServer();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ...devices["Galaxy S9+"], serviceWorkers: "block" });
  await context.addInitScript(() => {
    localStorage.setItem("india-session-token", "qa-session");
    localStorage.setItem("india-profile-id", "p01");
    localStorage.setItem("india-visitor-name", "Valentina Careri");
    localStorage.setItem("india-role", "coordinator");
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/state") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ sync_version: 1, profiles, posts: [] }) });
    if (path === "/api/auth/session") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ profile: profiles[0] }) });
    if (path === "/api/weather") {
      const cities = ["Delhi","Delhi","Udaipur","Udaipur","Jodhpur","Jodhpur","Jaipur","Jaipur","Agra","Agra","Varanasi","Varanasi","Varanasi","Delhi"];
      const forecasts = cities.map((city,i) => ({ date: "2026-08-"+String(10+i).padStart(2,"0"), city, min: 25, max: 34, description: "Pioggia leggera", rain_probability: 42, relative_humidity: 74, sunrise: "05:48", sunset: "19:06" }));
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ forecasts }) });
    }
    if (path === "/api/private") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ viewer: { profile_id: "p01", role: "coordinator" }, documents: [], locations: [] }) });
    if (path === "/api/auth/devices") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ devices: [] }) });
    if (path === "/api/sync/version") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ version: 1 }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.locator(".accessPill").waitFor();
  await page.getByRole("button", { name: "Viaggio", exact: true }).tap();
  await page.locator(".diaryDayPicker button").nth(0).tap();
  await page.getByRole("button", { name: "Scopri Delhi" }).tap();
  const city = page.getByRole("dialog", { name: "Conosci Delhi" });
  await city.waitFor();
  for (const label of ["Abitanti", "Superficie", "Altitudine", "Lingue diffuse", "COSA LA RENDE SPECIALE"]) {
    if (!(await city.getByText(label, { exact: false }).count())) throw new Error("city field missing: "+label);
  }
  if (await city.evaluate((n) => n.scrollWidth > n.clientWidth + 1)) throw new Error("city sheet horizontal overflow");
  await mkdir("test-results/1.37.22", { recursive: true });
  await page.screenshot({ path: "test-results/1.37.22/city-sheet-s20.png" });
  await city.getByRole("button", { name: "Chiudi informazioni citta" }).tap();
  await page.locator(".diaryDayPicker button").nth(2).tap();
  const baggage = page.locator(".day").nth(2).locator(".flightBaggageCard");
  await baggage.locator("summary").tap();
  for (const text of ["55 x 35 x 25 cm", "7 kg", "158 cm totali - 15 kg"]) {
    if (!(await baggage.getByText(text, { exact: false }).count())) throw new Error("baggage value missing: "+text);
  }
  const badge = page.locator(".day").nth(2).locator(".transportMapBadge");
  await badge.waitFor();
  if (!String(await badge.getAttribute("aria-label")).includes("Aereo")) throw new Error("air badge missing");
  await page.screenshot({ path: "test-results/1.37.22/flight-day-s20.png" });
  await page.getByRole("button", { name: "Gruppo", exact: true }).tap();
  const cards = page.locator(".peopleGrid .profileCard");
  if (await cards.count() !== 18) throw new Error("expected 18 traveler cards");
  const sizes = await cards.evaluateAll((nodes) => nodes.map((n) => ({ w: Math.round(n.getBoundingClientRect().width), h: Math.round(n.getBoundingClientRect().height) })));
  if (Math.max(...sizes.map((x) => x.w)) - Math.min(...sizes.map((x) => x.w)) > 1) throw new Error("traveler widths differ");
  if (Math.max(...sizes.map((x) => x.h)) - Math.min(...sizes.map((x) => x.h)) > 1) throw new Error("traveler heights differ");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  if (!(await cards.last().isVisible())) throw new Error("last traveler not visible after scroll");
  await page.screenshot({ path: "test-results/1.37.22/group-18-s20.png" });
  console.log("L2_13722_PASS=city-sheet,flight-baggage,transport-badge,18-uniform-travelers");
  await context.close();
} finally {
  await browser?.close().catch(() => {});
  server.kill();
}
