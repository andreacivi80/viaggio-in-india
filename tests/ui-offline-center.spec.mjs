import { expect, test, devices } from "@playwright/test";

test.use({ ...devices["Galaxy S9+"], serviceWorkers: "allow" });

test("T-0116/T-0126/T-1256: centro offline leggibile e cancellazione circoscritta", async ({ browser }) => {
  const context = await browser.newContext({
    ...devices["Galaxy S9+"],
    viewport: { width: 360, height: 800 },
    serviceWorkers: "allow",
  });
  try {
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      localStorage.setItem("qa-offline-protected-marker", "resta");
    });
    await page.getByRole("button", { name: "Pubblico" }).tap();
    const center = page.getByRole("region", { name: "Pronto per l’offline" });
    await expect(center).toBeVisible();
    await expect(center.getByRole("status")).toContainText("App pronta");
    await expect(center).toContainText(/Rete: (?:Rete online|\w+)/);
    await expect(center).toContainText("invii locali in attesa");

    await center.getByRole("button", { name: "Cancella copie offline" }).tap();
    await expect(center).toContainText("non elimina dati dal server");
    await center.getByRole("button", { name: "Conferma elimina copie" }).tap();
    await expect(center.getByRole("status")).toContainText("non ancora salvata");
    expect(await page.evaluate(() => localStorage.getItem("qa-offline-protected-marker"))).toBe("resta");
    expect(await page.evaluate(async () => (await caches.keys()).filter((key) => key.startsWith("thailandia-insieme-")).length)).toBe(0);
  } finally {
    await context.close();
  }
});
