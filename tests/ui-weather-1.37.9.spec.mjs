import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "block" });

test("meteo IMD e ora India restano compatti nella prima giornata disponibile", async ({ page }) => {
  const weather = await (await page.request.get("/api/weather")).json();
  const delhi = weather.forecasts.find((forecast) => forecast.date === "2026-08-10" && forecast.city === "Delhi");
  const delhiDayTwo = weather.forecasts.find((forecast) => forecast.date === "2026-08-11" && forecast.city === "Delhi");
  expect(delhi).toBeTruthy();
  expect(delhiDayTwo).toBeTruthy();
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Viaggio", exact: true }).tap();

  const dayOnePicker = page.getByRole("button", { name: /Giorno 1, Lun 10 ago, Delhi/i });
  await expect(dayOnePicker.locator(".dayPickerWeather")).toContainText(`${delhi.max}°/${delhi.min}°`, { timeout: 20_000 });
  await expect(dayOnePicker.locator(".dayPickerWeather span")).toHaveCount(1);
  const dayTwoPicker = page.getByRole("button", { name: /Giorno 2, Mar 11 ago, Delhi/i });
  await expect(dayTwoPicker.locator(".dayPickerWeather")).toContainText(`${delhiDayTwo.max}°/${delhiDayTwo.min}°`);
  await expect(page.locator(".dayPickerWeather")).toHaveCount(11);

  const firstDay = page.locator("#day-1");
  await expect(firstDay.locator(".dayWeatherLine")).toContainText("Ora India");
  await expect(firstDay.locator(".dayWeatherLine")).toContainText(`${delhi.max}°/${delhi.min}°`);
  await expect(firstDay.locator(".dayWeatherLine")).toContainText(/Pioggia|Nuvoloso|Temporali|Sereno|Meteo IMD/);
  await expect(firstDay.locator(".dayWeatherLine")).toHaveAttribute("title", delhi.description);

  const geometry = await firstDay.locator(".dayHero").evaluate((node) => ({
    scrollWidth: node.scrollWidth,
    clientWidth: node.clientWidth,
    lineHeight: node.querySelector(".dayWeatherLine")?.getBoundingClientRect().height || 0,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(geometry.lineHeight).toBeLessThanOrEqual(38);
});

test("meteo e ora non si sovrappongono sulle quattordici fotografie", async ({ page }) => {
  const cities = ["Delhi", "Delhi", "Udaipur", "Udaipur", "Jodhpur", "Jodhpur", "Jaipur", "Jaipur", "Agra", "Agra", "Varanasi", "Varanasi", "Varanasi", "Delhi"];
  const forecasts = cities.map((city, index) => ({
    date: `2026-08-${String(10 + index).padStart(2, "0")}`,
    city,
    min: 24,
    max: 34,
    description: index % 2 ? "Generally cloudy sky with moderate rain" : "Partly cloudy sky with one or two spells of rain or thundershowers",
    rain_probability: 84,
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

  for (let index = 0; index < 14; index += 1) {
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
    expect(geometry.text).toContain("Ora India");
    expect(geometry.background).toMatch(/^rgba?\(/);
    expect(geometry.background).not.toBe("rgba(0, 0, 0, 0)");
  }
});
