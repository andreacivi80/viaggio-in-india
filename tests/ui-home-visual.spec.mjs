import { test, expect, devices } from "@playwright/test";

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
test.skip(!baseUrl, "URL QA richiesto");

const phones = [
  ["iPhone SE", devices["iPhone SE"]],
  ["Samsung Galaxy S9+", devices["Galaxy S9+"]],
];

const intersects = (a, b) =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

test("bacheca armonica: i comandi non coprono il Taj Mahal", async ({ browser }, testInfo) => {
  for (const [name, device] of phones) {
    const context = await browser.newContext({ ...device });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    const hero = page.locator(".hero");
    await expect(hero).toBeVisible();
    expect(await hero.evaluate((element) => getComputedStyle(element).backgroundImage)).toContain("taj-hero-v2.webp");

    const heroBox = await hero.boundingBox();
    const controlLocators = [
      page.locator(".flag"),
      page.locator(".versionBadge"),
      page.locator(".accessPill"),
      page.locator(".headerIcon"),
      page.locator(".heroTravelers"),
    ];
    const controls = await Promise.all(controlLocators.map((locator) => locator.boundingBox()));
    expect(controls.every(Boolean)).toBe(true);
    for (const box of controls) {
      expect(box.x).toBeGreaterThanOrEqual(heroBox.x);
      expect(box.x + box.width).toBeLessThanOrEqual(heroBox.x + heroBox.width + 1);
      expect(box.y).toBeGreaterThanOrEqual(heroBox.y);
      expect(box.y + box.height).toBeLessThanOrEqual(heroBox.y + heroBox.height + 1);
    }
    for (let left = 0; left < 4; left += 1)
      for (let right = left + 1; right < 4; right += 1)
        expect(intersects(controls[left], controls[right]), `${name}: comandi superiori sovrapposti`).toBe(false);
    expect(intersects(controls[4], controls[2]), `${name}: viaggiatori sopra accesso`).toBe(false);
    expect(intersects(controls[4], controls[3]), `${name}: viaggiatori sopra notifiche`).toBe(false);
    const travelerParts = await Promise.all([
      page.locator(".heroTravelerCopy").boundingBox(),
      page.locator(".heroWeRoadWordmark").boundingBox(),
      page.locator(".heroTravelersMapButton").boundingBox(),
    ]);
    expect(travelerParts.every(Boolean)).toBe(true);
    expect(intersects(travelerParts[0], travelerParts[1]), `${name}: WEROAD sopra il conteggio`).toBe(false);
    expect(intersects(travelerParts[1], travelerParts[2]), `${name}: WEROAD sopra il più`).toBe(false);

    const visualAreas = await Promise.all(controlLocators.map((locator) => locator.evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const insetX = Number.parseFloat(style.getPropertyValue("--visual-inset-x")) || 0;
      const insetY = Number.parseFloat(style.getPropertyValue("--visual-inset-y")) || 0;
      return Math.max(0, rect.width - insetX * 2) * Math.max(0, rect.height - insetY * 2);
    })));
    const controlArea = visualAreas.reduce((sum, area) => sum + area, 0);
    expect(controlArea / (heroBox.width * heroBox.height)).toBeLessThan(0.30);
    const centerCoveredByButton = await hero.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return Boolean(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height * 0.58)?.closest("button"));
    });
    expect(centerCoveredByButton, `${name}: centro della foto coperto`).toBe(false);
    await page.screenshot({ path: testInfo.outputPath(`bacheca-${name.replaceAll(/[^a-z0-9]+/gi, "-")}.png`), fullPage: false });
    await context.close();
  }
});

test("bacheca compatta: titolo su una riga e navigazione senza sovrapposizioni", async ({ browser }) => {
  for (const [name, device] of phones) {
    const context = await browser.newContext({ ...device });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const heading = page.getByRole("heading", { name: "Raccontiamocele insieme" });
    await expect(heading).toBeVisible();
    const headingLayout = await heading.evaluate((element) => ({
      height: element.getBoundingClientRect().height,
      lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    expect(headingLayout.scrollWidth, `${name}: titolo tagliato`).toBeLessThanOrEqual(headingLayout.clientWidth + 1);
    expect(headingLayout.height, `${name}: titolo su più righe`).toBeLessThanOrEqual(headingLayout.lineHeight * 1.35);
    const buttons = page.locator(".tabs button");
    await expect(buttons).toHaveCount(5);
    for (let index = 0; index < 5; index += 1) {
      const box = await buttons.nth(index).boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await context.close();
  }
});
