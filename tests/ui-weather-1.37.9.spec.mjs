import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const cities = ["Bangkok", "Hua Hin", "Chumphon", "Khao Sok", "Cheow Lan Lake", "Phi Phi Island", "Krabi", "Krabi", "Krabi", "Bangkok", "Bangkok"];
const dates = ["2026-12-26", "2026-12-27", "2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03", "2027-01-04", "2027-01-05"];
const forecasts = cities.map((city, index) => ({
  date: dates[index], city, min: 24, max: 34,
  description: index % 2 ? "Nuvoloso con pioggia moderata" : "Parzialmente nuvoloso con rovesci",
  rain_probability: 84,
}));

test("meteo e ora Thailandia restano compatti nella prima giornata disponibile", async ({ page }) => {
  await page.route("**/api/weather", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ source: "QA", timezone: "Asia/Bangkok", forecasts }),
  }));
  const bangkok = forecasts[0];
  const huaHin = forecasts[1];
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Viaggio", exact: true }).tap();

  const dayOnePicker = page.getByRole("button", { name: /Giorno 1, Sab 26 dic, Bangkok/i });
  await expect(dayOnePicker.locator(".dayPickerWeather")).toContainText(`${bangkok.max}°/${bangkok.min}°`, { timeout: 20_000 });
  await expect(dayOnePicker.locator(".dayPickerWeather span")).toHaveCount(1);
  const dayTwoPicker = page.getByRole("button", { name: /Giorno 2, Dom 27 dic, Hua Hin/i });
  await expect(dayTwoPicker.locator(".dayPickerWeather")).toContainText(`${huaHin.max}°/${huaHin.min}°`);
  await expect(page.locator(".dayPickerWeather")).toHaveCount(11);

  const firstDay = page.locator("#day-1");
  await expect(firstDay.locator(".dayWeatherLine")).toContainText("Ora Thailandia");
  await expect(firstDay.locator(".dayWeatherLine")).toContainText(`${bangkok.max}°/${bangkok.min}°`);
  await expect(firstDay.locator(".dayWeatherLine")).toContainText(/Pioggia|Nuvoloso|Rovesci|Sereno|Meteo/i);
  await expect(firstDay.locator(".dayWeatherLine")).toHaveAttribute("title", bangkok.description);

  const geometry = await firstDay.locator(".dayHero").evaluate((node) => ({
    scrollWidth: node.scrollWidth,
    clientWidth: node.clientWidth,
    lineHeight: node.querySelector(".dayWeatherLine")?.getBoundingClientRect().height || 0,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(geometry.lineHeight).toBeLessThanOrEqual(38);
});

test("meteo e ora non si sovrappongono sulle undici fotografie", async ({ page }) => {
  await page.route("**/api/state", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ sync_version: 1, profiles: [], posts: [] }),
  }));
  await page.route("**/api/weather", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ source: "QA", timezone: "Asia/Bangkok", forecasts }),
  }));
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Viaggio", exact: true }).tap();
  await expect(page.getByText("spuntate", { exact: true })).toHaveCount(0);

  for (const name of ["Giorno precedente", "Giorno successivo"]) {
    const arrowButton = page.locator(".diaryNavigator").getByRole("button", { name, exact: true });
    const centers = await arrowButton.evaluate((node) => {
      const button = node.getBoundingClientRect();
      const icon = node.querySelector("svg").getBoundingClientRect();
      return {
        x: Math.abs((button.left + button.width / 2) - (icon.left + icon.width / 2)),
        y: Math.abs((button.top + button.height / 2) - (icon.top + icon.height / 2)),
      };
    });
    expect(centers.x).toBeLessThanOrEqual(1);
    expect(centers.y).toBeLessThanOrEqual(1);
  }

  for (let index = 0; index < 11; index += 1) {
    await page.getByRole("button", { name: new RegExp(`Giorno ${index + 1},`) }).tap();
    const hero = page.locator(`#day-${index + 1} .dayHero`);
    const geometry = await hero.evaluate((node) => {
      const line = node.querySelector(".dayWeatherLine");
      const title = node.querySelector("h3");
      const heroBox = node.getBoundingClientRect();
      const lineBox = line.getBoundingClientRect();
      const titleBox = title.getBoundingClientRect();
      return {
        overflow: node.scrollWidth - node.clientWidth,
        lineTop: lineBox.top,
        lineBottom: lineBox.bottom,
        heroTop: heroBox.top,
        heroBottom: heroBox.bottom,
        titleTop: titleBox.top,
        titleBottom: titleBox.bottom,
        titleClipped: title.scrollHeight > title.clientHeight + 1,
        weatherClipped: line.scrollHeight > line.clientHeight + 1,
        weatherHorizontalClipped: line.scrollWidth > line.clientWidth + 1,
        whiteSpace: getComputedStyle(line).whiteSpace,
        text: line.textContent.replace(/\s+/g, " ").trim(),
        background: getComputedStyle(line).backgroundColor,
      };
    });
    expect(geometry.overflow).toBeLessThanOrEqual(1);
    expect(geometry.lineTop).toBeGreaterThanOrEqual(geometry.heroTop);
    expect(geometry.lineBottom).toBeLessThanOrEqual(geometry.heroBottom);
    expect(geometry.titleTop).toBeGreaterThanOrEqual(geometry.heroTop);
    expect(geometry.titleBottom).toBeLessThanOrEqual(geometry.heroBottom);
    expect(geometry.titleClipped).toBe(false);
    expect(geometry.weatherClipped).toBe(false);
    expect(geometry.weatherHorizontalClipped, JSON.stringify(geometry)).toBe(false);
    expect(geometry.whiteSpace).toBe("nowrap");
    expect(geometry.text).toContain("84%");
    expect(geometry.text).toContain("Ora Thailandia");
    expect(geometry.background).toMatch(/^rgba?\(/);
    expect(geometry.background).not.toBe("rgba(0, 0, 0, 0)");
  }
});
