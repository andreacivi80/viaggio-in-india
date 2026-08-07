import { expect, test, devices } from "@playwright/test";

test.use({ ...devices["Galaxy S9+"], serviceWorkers: "block" });

test("lo schermo resta attivo in primo piano e viene liberato in background", async ({ page }) => {
  await page.addInitScript(() => {
    window.__wakeState = { requests: 0, releases: 0 };
    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: {
        request: async (kind) => {
          if (kind !== "screen") throw new Error("tipo errato");
          window.__wakeState.requests += 1;
          return {
            release: async () => { window.__wakeState.releases += 1; },
            addEventListener: () => {},
          };
        },
      },
    });
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => window.__wakeState.requests)).toBe(1);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => page.evaluate(() => window.__wakeState.releases)).toBe(1);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => page.evaluate(() => window.__wakeState.requests)).toBe(2);
});
