import { test, expect } from "@playwright/test";

const cities = ["Delhi", "Delhi", "Udaipur", "Udaipur", "Jodhpur", "Jodhpur", "Jaipur", "Jaipur", "Agra", "Agra", "Varanasi", "Varanasi", "Varanasi", "Delhi"];
const healthDeclarationByCity = {
  Delhi: ["Delhi", "South West Delhi", "New Delhi", "India settentrionale"],
  Udaipur: ["Rajasthan", "Udaipur", "Mewar", "Rajasthan meridionale"],
  Jodhpur: ["Rajasthan", "Jodhpur", "Marwar", "Rajasthan occidentale"],
  Jaipur: ["Rajasthan", "Jaipur", "Dhundhar", "Rajasthan orientale"],
  Agra: ["Uttar Pradesh", "Agra", "Braj", "Uttar Pradesh occidentale"],
  Varanasi: ["Uttar Pradesh", "Varanasi", "Purvanchal", "Uttar Pradesh orientale"],
};

test("giornate aperte mostrano clima, alba, tramonto e informazioni della città senza sovrapporsi", async ({ page }, testInfo) => {
  const forecasts = cities.map((city, index) => ({
    date: `2026-08-${String(10 + index).padStart(2, "0")}`,
    city,
    min: 25,
    max: 34,
    description: "Pioggia leggera",
    rain_probability: 42,
    relative_humidity: 74,
    sunrise: "05:48",
    sunset: "19:06",
  }));
  await page.route("**/api/weather", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ source: "QA", timezone: "Asia/Kolkata", forecasts }),
  }));
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator(".tabs").getByRole("button", { name: "Viaggio" }).tap();

  const pickers = page.locator(".diaryDayPicker button");
  for (const index of [0, 2]) {
    await pickers.nth(index).tap();
    const day = page.locator(".day").nth(index);
    const climate = day.locator(".dayClimateCard");
    await expect(climate).toBeVisible();
    await expect(climate).toContainText("34° / 25°");
    await expect(climate).toContainText("Umidità media 74%");
    await expect(climate).toContainText("ALBA");
    await expect(climate).toContainText("05:48");
    await expect(climate).toContainText("TRAMONTO");
    await expect(climate).toContainText("19:06");
    const images = climate.locator("img");
    await expect(images).toHaveCount(2);
    await expect.poll(() => images.evaluateAll((nodes) => nodes.every((image) => image.complete && image.naturalWidth === 192))).toBe(true);
    expect(await climate.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);

    const infoButton = day.getByRole("button", { name: `Scopri ${cities[index]}` });
    await expect(infoButton).toBeVisible();
    await infoButton.tap();
    const citySheet = page.getByRole("dialog", { name: `Conosci ${cities[index]}` });
    await expect(citySheet).toBeVisible();
    await expect(citySheet).toContainText("Abitanti");
    await expect(citySheet).toContainText("Superficie");
    await expect(citySheet).toContainText("Altitudine");
    await expect(citySheet).toContainText("Lingue diffuse");
    await expect(citySheet).toContainText("COSA LA RENDE SPECIALE");
    const healthCard = citySheet.getByRole("article", { name: "Dati per dichiarazione di salute" });
    await expect(healthCard).toBeVisible();
    await expect(healthCard).toContainText("Stato / territorio");
    await expect(healthCard).toContainText("Distretto");
    await expect(healthCard).toContainText("Città principale");
    await expect(healthCard).toContainText("Regione");
    for (const value of healthDeclarationByCity[cities[index]]) await expect(healthCard).toContainText(value);
    await expect(citySheet).not.toContainText("dati indicativi da fonti pubbliche indiane");
    await expect(citySheet).not.toContainText("Censimento 2011");
    expect(await citySheet.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    const citySheetBody = citySheet.locator(".citySheetBody");
    const scrollMetrics = await citySheetBody.evaluate((node) => ({
      clientHeight: node.clientHeight,
      scrollHeight: node.scrollHeight,
      overflowY: getComputedStyle(node).overflowY,
      touchAction: getComputedStyle(node).touchAction,
    }));
    expect(scrollMetrics.scrollHeight).toBeGreaterThan(scrollMetrics.clientHeight);
    expect(scrollMetrics.overflowY).toBe("auto");
    expect(scrollMetrics.touchAction).toBe("pan-y");
    await citySheetBody.evaluate((node) => node.scrollTo({ top: node.scrollHeight, behavior: "instant" }));
    await expect(citySheet.getByText("COSA LA RENDE SPECIALE")).toBeInViewport();
    const closeButton = citySheet.getByRole("button", { name: "Chiudi informazioni città" });
    await expect(closeButton.locator("svg")).toHaveCount(1);
    const closeSize = await closeButton.boundingBox();
    expect(closeSize.width).toBeGreaterThanOrEqual(44);
    expect(closeSize.height).toBeGreaterThanOrEqual(44);
    await closeButton.tap();
    await expect(citySheet).toHaveCount(0);
    if (index === 2) {
      const baggage = day.locator(".flightBaggageCard");
      await expect(baggage).toBeVisible();
      await baggage.locator("summary").tap();
      await expect(baggage).toContainText("55 x 35 x 25 cm");
      await expect(baggage).toContainText("7 kg");
      await expect(baggage).toContainText("158 cm totali - 15 kg");
    }
    if (index === 0) {
      await day.locator(".dayClimateCard").scrollIntoViewIfNeeded();
      await page.screenshot({ path: testInfo.outputPath("clima-e-citta.png"), fullPage: false });
    }
  }
});
