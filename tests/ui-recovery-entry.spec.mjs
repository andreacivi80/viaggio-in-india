import { test, expect, devices } from "@playwright/test";

const baseUrl = process.env.TEST_BASE_URL;
test.skip(!baseUrl, "URL QA richiesto");

test("su cellulare il visitatore vede il recupero del profilo prima di registrarsi", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["Galaxy S9+"], serviceWorkers: "block" });
  try {
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Pubblico", exact: true }).tap();
    await expect(page.getByRole("button", {
      name: "Sei già tra i viaggiatori? Recupera il profilo senza duplicarlo",
    })).toBeVisible();
    await expect(page.getByText("Accesso pubblico", { exact: true })).toBeVisible();
  } finally {
    await context.close();
  }
});
