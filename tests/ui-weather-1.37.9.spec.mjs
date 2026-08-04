import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "block" });

test("meteo IMD e ora India restano compatti nella prima giornata disponibile", async ({ page }) => {
  const weather = await (await page.request.get("/api/weather")).json();
  const delhi = weather.forecasts.find((forecast) => forecast.date === "2026-08-10" && forecast.city === "Delhi");
  expect(delhi).toBeTruthy();
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Viaggio", exact: true }).tap();

  const dayOnePicker = page.getByRole("button", { name: /Giorno 1, Lun 10 ago, Delhi/i });
  await expect(dayOnePicker.locator(".dayPickerWeather")).toHaveText(`${delhi.max}°/${delhi.min}°`, { timeout: 20_000 });
  await expect(page.locator(".dayPickerWeather")).toHaveCount(1);

  const firstDay = page.locator("#day-1");
  await expect(firstDay.locator(".dayWeatherLine")).toContainText("Ora India");
  await expect(firstDay.locator(".dayWeatherLine")).toContainText(`${delhi.max}° / ${delhi.min}°`);
  await expect(firstDay.locator(".dayWeatherLine")).toContainText(/Pioggia|Nuvoloso|Temporali|Sereno|Meteo IMD/);
  await expect(firstDay.locator(".dayWeatherLine")).toHaveAttribute("title", delhi.description);

  const geometry = await firstDay.locator(".dayHero").evaluate((node) => ({
    scrollWidth: node.scrollWidth,
    clientWidth: node.clientWidth,
    lineHeight: node.querySelector(".dayWeatherLine")?.getBoundingClientRect().height || 0,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(geometry.lineHeight).toBeLessThanOrEqual(24);
});

test("meteo e ora non si sovrappongono sulle quattordici fotografie", async ({ page }) => {
  const cities = ["Delhi", "Delhi", "Udaipur", "Udaipur", "Jodhpur", "Jodhpur", "Jaipur", "Jaipur", "Agra", "Agra", "Varanasi", "Varanasi", "Varanasi", "Delhi"];
  const forecasts = cities.map((city, index) => ({
    date: `2026-08-${String(10 + index).padStart(2, "0")}`,
    city,
    min: 24,
    max: 34,
    description: index % 2 ? "Generally cloudy sky with moderate rain" : "Partly cloudy sky with one or two spells of rain or thundershowers",
  }));
  await page.route("**/api/state", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ sync_version: 1, profiles: [], posts: [] }),
  }));
  await page.route("**/api/weather", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ source: "India Meteorological Department", timezone: "Asia/Kolkata", forecasts }),
  }));
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Viaggio", exact: true }).tap();

  for (let index = 0; index < 14; index += 1) {
    await page.getByRole("button", { name: new RegExp(`Giorno ${index + 1},`) }).tap();
    const hero = page.locator(`#day-${index + 1} .dayHero`);
    const geometry = await hero.evaluate((node) => {
      const line = node.querySelector(".dayWeatherLine");
      const heroBox = node.getBoundingClientRect();
      const lineBox = line.getBoundingClientRect();
      return {
        overflow: node.scrollWidth - node.clientWidth,
        lineTop: lineBox.top,
        lineBottom: lineBox.bottom,
        heroTop: heroBox.top,
        heroBottom: heroBox.bottom,
        background: getComputedStyle(line).backgroundColor,
      };
    });
    expect(geometry.overflow).toBeLessThanOrEqual(1);
    expect(geometry.lineTop).toBeGreaterThanOrEqual(geometry.heroTop);
    expect(geometry.lineBottom).toBeLessThanOrEqual(geometry.heroBottom);
    expect(geometry.background).toMatch(/^rgba?\(/);
    expect(geometry.background).not.toBe("rgba(0, 0, 0, 0)");
  }
});
