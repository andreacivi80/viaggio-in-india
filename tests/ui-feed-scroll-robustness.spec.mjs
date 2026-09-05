import { test, expect, devices } from "@playwright/test";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const sessionToken = process.env.QA_UI_SESSION_TOKEN;
const deviceKey = process.env.QA_UI_DEVICE_KEY;
test.skip(!baseUrl || !sessionToken || !deviceKey || !isSafeMutationTarget(baseUrl), "Sessione e URL QA richiesti");
test.use({ serviceWorkers: "block" });

test("un feed lungo resta scorrevole e sopravvive a un aggiornamento fallito", async ({ browser }) => {
  test.setTimeout(120_000);
  const created = [];
  const prefix = `Feed lungo QA ${process.env.QA_RUN_ID}`;
  const authHeaders = { authorization: `Bearer ${sessionToken}`, "x-device-key": deviceKey };
  try {
    for (let index = 0; index < 18; index += 1) {
      const form = new FormData();
      form.set("visibility", "public");
      form.set("day_index", String(index % 14));
      form.set("text", `${prefix} elemento ${String(index + 1).padStart(2, "0")}`);
      const response = await fetch(`${baseUrl}/api/posts`, {
        method: "POST",
        headers: { ...authHeaders, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
        body: form,
      });
      expect(response.status).toBe(201);
      created.push((await response.json()).id);
    }

    const context = await browser.newContext({
      ...devices["Galaxy S9+"],
      viewport: { width: 360, height: 740 },
      serviceWorkers: "block",
    });
    try {
      const page = await context.newPage();
      await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
      await expect(page.getByText(`${prefix} elemento 18`, { exact: true })).toBeVisible({ timeout: 20_000 });
      const oldest = page.getByText(`${prefix} elemento 01`, { exact: true });
      await oldest.scrollIntoViewIfNeeded();
      await expect(oldest).toBeVisible();
      expect(await page.evaluate(() => scrollY)).toBeGreaterThan(1_000);

      await page.route("**/api/state", (route) => route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "rete temporaneamente indisponibile" }),
      }));
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.getByText(`${prefix} elemento 18`, { exact: true })).toBeVisible({ timeout: 20_000 });
      await page.getByText(`${prefix} elemento 01`, { exact: true }).scrollIntoViewIfNeeded();
      await expect(page.getByText(`${prefix} elemento 01`, { exact: true })).toBeVisible();

      await page.unroute("**/api/state");
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.getByText(`${prefix} elemento 18`, { exact: true })).toBeVisible({ timeout: 20_000 });
      await page.getByText(`${prefix} elemento 01`, { exact: true }).scrollIntoViewIfNeeded();
      await expect(page.getByText(`${prefix} elemento 01`, { exact: true })).toBeVisible();
    } finally {
      await context.close();
    }
  } finally {
    await Promise.allSettled(created.map((id) => fetch(`${baseUrl}/api/posts/${id}`, { method: "DELETE", headers: authHeaders })));
  }
});
