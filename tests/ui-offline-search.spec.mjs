import { expect, test, devices } from "@playwright/test";

test.use({ ...devices["Galaxy S9+"], serviceWorkers: "block" });

test("T-1696: la ricerca usa solo i dati già disponibili e funziona offline", async ({ browser }) => {
  const context = await browser.newContext({
    ...devices["Galaxy S9+"],
    viewport: { width: 360, height: 800 },
    serviceWorkers: "block",
  });
  try {
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "networkidle" });
    const apiRequests = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname.startsWith("/api/")) apiRequests.push(request.url());
    });

    const input = page.getByRole("searchbox", { name: "Cerca nei contenuti disponibili" });
    await expect(input).toBeVisible();
    await expect(page.getByText("Ricerca locale · funziona anche offline")).toBeVisible();
    const before = apiRequests.length;
    await context.setOffline(true);
    await input.fill("termine-inesistente-qa-1696");
    await expect(page.getByText("Nessun contenuto trovato")).toBeVisible();
    await page.waitForTimeout(500);
    expect(apiRequests.length).toBe(before);
    await input.fill("");
    await expect(page.getByText("Nessun contenuto trovato")).toHaveCount(0);
  } finally {
    await context.setOffline(false).catch(() => {});
    await context.close();
  }
});
