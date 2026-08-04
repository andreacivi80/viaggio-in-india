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
