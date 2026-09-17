import { expect, test, devices } from "@playwright/test";

test.use({ ...devices["Galaxy S9+"], serviceWorkers: "block" });

test("T-0105: ultima sincronizzazione è leggibile e non si sovrappone su telefono", async ({ browser }) => {
  const context = await browser.newContext({
    ...devices["Galaxy S9+"],
    viewport: { width: 360, height: 800 },
    serviceWorkers: "block",
  });
  try {
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "networkidle" });
    const sync = page.locator(".syncStatus");
    await expect(sync).toHaveText(/^Sync \d{2}:\d{2}$/);
    await expect(sync).toHaveAttribute("aria-label", /^Ultima sincronizzazione: Sync \d{2}:\d{2}$/);

    const boxes = await page.locator(".versionBadge, .syncStatus, .accessPill, .headerIcon").evaluateAll((nodes) =>
      nodes.map((node) => {
        const box = node.getBoundingClientRect();
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
      }),
    );
    for (let index = 0; index < boxes.length; index += 1) {
      expect(boxes[index].left).toBeGreaterThanOrEqual(0);
      expect(boxes[index].right).toBeLessThanOrEqual(360);
      if (index) expect(boxes[index].left).toBeGreaterThanOrEqual(boxes[index - 1].right - 1);
    }

    await context.setOffline(true);
    await expect(sync).toContainText("Offline · sync");
  } finally {
    await context.setOffline(false).catch(() => {});
    await context.close();
  }
});
