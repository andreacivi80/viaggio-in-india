import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "allow" });

async function waitForController(page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return;
    await new Promise((resolve) =>
      navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }),
    );
  });
}

test("T-1587: due schede restano operative durante l'aggiornamento del Service Worker", async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  try {
    const first = await context.newPage();
    const second = await context.newPage();
    await Promise.all([
      first.goto("/", { waitUntil: "networkidle" }),
      second.goto("/", { waitUntil: "networkidle" }),
    ]);
    await Promise.all([waitForController(first), waitForController(second)]);

    await first.evaluate(() => { window.__twoTabSentinel = "prima-scheda-intatta"; });
    await second.evaluate(() => { window.__twoTabSentinel = "seconda-scheda-intatta"; });

    const before = await Promise.all([first, second].map((page) => page.evaluate(() => ({
      controller: navigator.serviceWorker.controller?.scriptURL || "",
      cacheKeys: [],
    }))));
    expect(before[0].controller).toMatch(/\/sw\.js$/);
    expect(before[1].controller).toBe(before[0].controller);

    await first.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) throw new Error("Service Worker non registrato");
      await registration.update();
      if (registration.waiting)
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
    });

    await expect.poll(() => first.evaluate(() => window.__twoTabSentinel)).toBe("prima-scheda-intatta");
    await expect.poll(() => second.evaluate(() => window.__twoTabSentinel)).toBe("seconda-scheda-intatta");
    await second.reload({ waitUntil: "networkidle" });
    await waitForController(second);
    await expect(second.getByRole("heading", { name: /Raccontiamocele insieme/i })).toBeVisible();
    expect(await second.evaluate(() => navigator.serviceWorker.controller?.scriptURL || "")).toBe(before[0].controller);
    await expect.poll(() => first.evaluate(() => window.__twoTabSentinel)).toBe("prima-scheda-intatta");
  } finally {
    await context.close();
  }
});
