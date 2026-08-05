import { test, expect } from "@playwright/test";

const openApp = async (page) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".accessPill")).toBeVisible();
};
const tapCenter = async (page, locator) => {
  await expect(locator).toBeVisible();
  await expect.poll(() => locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return hit === element || element.contains(hit);
  })).toBe(true);
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
};

test("i cinque comandi inferiori aprono schermate reali senza pagina bianca", async ({ page }) => {
  await openApp(page);
  const cases = [
    ["Viaggio", "La storia, giorno per giorno"],
    ["Mappa", "Tutto l’itinerario"],
    ["Bacheca", "Raccontiamocele insieme"],
  ];
  for (const [buttonName, heading] of cases) {
    const button = page.locator(".tabs").getByRole("button", { name: buttonName });
    await tapCenter(page, button);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await expect(button).toHaveClass(/active/);
    await expect(page.locator("main")).toBeVisible();
    expect(await page.locator("main").evaluate((node) => node.getBoundingClientRect().height)).toBeGreaterThan(100);
  }
  await tapCenter(page, page.locator(".tabs").getByRole("button", { name: "Gruppo" }));
  await expect(page.locator(".quickProfilePanel").getByPlaceholder("Password")).toBeVisible();
  await page.getByRole("button", { name: "Chiudi pannello personale" }).tap();
  await tapCenter(page, page.locator(".tabs").getByRole("button", { name: "Pubblica" }));
  await expect(page.getByRole("heading", { name: "Che cosa vuoi condividere?" })).toBeVisible();
  await expect(page.locator(".uploadSheet").getByText("Accesso privato")).toBeVisible();
});

test("tutte le quattordici giornate si aprono con foto e contenuto", async ({ page }) => {
  test.slow();
  await openApp(page);
  await tapCenter(page, page.locator(".tabs").getByRole("button", { name: "Viaggio" }));
  const dayButtons = page.locator(".diaryDayPicker button");
  await expect(dayButtons).toHaveCount(14);
  for (let index = 0; index < 14; index += 1) {
    await dayButtons.nth(index).tap();
    const article = page.locator(".day").nth(index);
    await expect(article).toHaveClass(/open/);
    await expect(page.locator(".day.open")).toHaveCount(1);
    await expect(article.locator(".dayBody")).toBeVisible();
    await expect(article.locator(".dayBody > p")).not.toBeEmpty();
    await expect(article.locator(".journeyCard b")).toContainText(/\d+ km · \S+/);
    await expect(article.locator(".journeyCard > div > span")).not.toBeEmpty();
    await expect(article.locator(".objective")).toContainText("Obiettivo del giorno");
    await expect(article.locator(".diaryMiniMap")).toBeVisible();
    expect(await article.locator(".checks label").count()).toBeGreaterThan(0);
    await expect(article.getByRole("button", { name: "Percorso", exact: true })).toBeVisible();
    await expect(article.getByRole("button", { name: "Aggiungi ricordo" })).toBeVisible();
    const cityPhoto = article.locator("img");
    await cityPhoto.scrollIntoViewIfNeeded();
    await expect.poll(
      () => cityPhoto.evaluate((image) => image.complete && image.naturalWidth > 100),
      { timeout: 15_000, message: `foto della giornata ${index + 1} caricata nel viewport mobile` },
    ).toBe(true);
  }
});

test("spunte e navigazione del diario restano coerenti dopo il ricaricamento", async ({ page }) => {
  await openApp(page);
  await tapCenter(page, page.locator(".tabs").getByRole("button", { name: "Viaggio" }));
  await page.locator(".diaryDayPicker button").first().tap();
  const firstDay = page.locator(".day").first();
  await expect(firstDay.getByRole("button", { name: "Giorno precedente" })).toBeDisabled();
  const firstCheck = firstDay.locator('.checks input[type="checkbox"]').first();
  await firstDay.locator(".checks label").first().tap();
  await expect(firstCheck).toBeChecked();
  await firstDay.getByRole("button", { name: "Giorno successivo" }).tap();
  await expect(page.locator(".day").nth(1)).toHaveClass(/open/);
  await page.locator(".day").nth(1).getByRole("button", { name: "Giorno precedente" }).tap();
  await expect(firstDay).toHaveClass(/open/);
  await page.locator(".diaryDayPicker button").last().tap();
  await expect(page.locator(".day").last().getByRole("button", { name: "Giorno successivo" })).toBeDisabled();
  await page.reload({ waitUntil: "domcontentloaded" });
  await tapCenter(page, page.locator(".tabs").getByRole("button", { name: "Viaggio" }));
  await page.locator(".diaryDayPicker button").first().tap();
  await expect(page.locator(".day").first().locator('.checks input[type="checkbox"]').first()).toBeChecked();
});

test("la mappa seleziona automaticamente tutte le tappe e torna alla bacheca", async ({ page }) => {
  test.slow();
  await openApp(page);
  await tapCenter(page, page.locator(".tabs").getByRole("button", { name: "Mappa" }));
  await expect(page.locator(".maplibregl-map")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.vectorMarker[aria-label="Tappa 1: Delhi"]')).toBeVisible();
  await expect(page.locator('.vectorMarker[aria-label="Tappa 3: Ranakpur"]')).toBeVisible();
  await expect(page.locator('.vectorMarker[aria-label="Tappa 8: Delhi"]')).toBeVisible();
  await expect(page.locator(".vectorMarker")).toHaveCount(8);
  const routeButtons = page.locator(".routeChips button");
  await expect(routeButtons).toHaveCount(14);
  for (let index = 0; index < 14; index += 1) {
    await routeButtons.nth(index).tap();
    await expect(routeButtons.nth(index)).toHaveClass(/active/);
    await expect(page.locator(".mapTrip")).toContainText(`Giorno ${index + 1}`);
    await expect(page.locator(".vectorMarker").first()).toBeVisible();
    await expect(page.locator(".mapLoading")).toBeHidden({ timeout: 20_000 });
    await expect.poll(async () => {
      const mapBounds = await page.locator(".mapShell").boundingBox();
      const markerBounds = await page.locator(".vectorMarker").evaluateAll((markers) =>
        markers.map((marker) => {
          const rect = marker.getBoundingClientRect();
          return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
        }),
      );
      return Boolean(mapBounds) && markerBounds.every((marker) =>
        marker.left >= mapBounds.x &&
        marker.right <= mapBounds.x + mapBounds.width &&
        marker.top >= mapBounds.y &&
        marker.bottom <= mapBounds.y + mapBounds.height
      );
    }, { timeout: 10_000 }).toBe(true);
  }
  await page.getByRole("button", { name: "Vedi tutto" }).tap();
  await expect(page.getByRole("heading", { name: "Tutto l’itinerario" })).toBeVisible();
  await expect(page.locator(".vectorMarker")).toHaveCount(8);
  await page.getByRole("button", { name: /Torna alla Bacheca/ }).tap();
  await expect(page.getByRole("heading", { name: "Raccontiamocele insieme" })).toBeVisible();
});

test("la vista pubblica del gruppo non espone documenti o comandi di modifica", async ({ page }) => {
  await openApp(page);
  const groupButton = page.locator(".tabs").getByRole("button", { name: "Gruppo" });
  await tapCenter(page, groupButton);
  await expect(page.locator(".quickProfilePanel").getByPlaceholder("Password")).toBeVisible();
  await expect(page.getByText("Documenti e sicurezza")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Crea invito|Modifica|Elimina/i })).toHaveCount(0);
});
