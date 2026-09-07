import { expect, test } from "@playwright/test";
import { days } from "../src/tripThailand.js";

const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:4186";

test("il link copiato apre sul secondo telefono la stessa giornata della mappa", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: baseUrl,
    viewport: { width: 360, height: 740 },
    isMobile: true,
    hasTouch: true,
  });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(baseUrl).origin });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Mappa", exact: true }).tap();
  const chosenDay = 3;
  await page.locator(".routeChips button").nth(chosenDay).tap();
  await page.getByRole("button", { name: "Copia collegamento della mappa" }).tap();
  await expect(page.getByText("Collegamento della mappa copiato.")).toBeVisible();

  const copied = await page.evaluate(() => navigator.clipboard.readText());
  const copiedUrl = new URL(copied);
  expect(copiedUrl.origin).toBe(new URL(baseUrl).origin);
  expect(copiedUrl.searchParams.get("view")).toBe("map");
  expect(copiedUrl.searchParams.get("day")).toBe("04");
  expect(copiedUrl.searchParams.has("qa")).toBe(false);

  const secondPhone = await context.newPage();
  await secondPhone.goto(copied, { waitUntil: "domcontentloaded" });
  await expect(secondPhone.locator(".mapSection")).toBeVisible();
  await expect(secondPhone.locator(".mapHeading h2")).toHaveText(`${days[chosenDay].from} → ${days[chosenDay].to}`);
  await expect(secondPhone.locator(".routeChips button").nth(chosenDay)).toHaveClass(/active/);
  await context.close();
});
