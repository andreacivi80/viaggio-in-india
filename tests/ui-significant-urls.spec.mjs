import { test, expect, devices } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const sessionToken = process.env.QA_UI_SESSION_TOKEN;
const deviceKey = process.env.QA_UI_DEVICE_KEY;
const photoPath = fileURLToPath(new URL("../public/thailand/thailandia-insieme.png", import.meta.url));
test.skip(!baseUrl || !sessionToken || !deviceKey || !isSafeMutationTarget(baseUrl), "Sessione e URL QA richiesti");
test.use({ serviceWorkers: "block" });

test("tutti gli URL pubblici significativi sopravvivono alla ricarica mobile", async ({ browser }) => {
  test.setTimeout(120_000);
  const form = new FormData();
  form.set("visibility", "public");
  form.set("day_index", "0");
  form.set("text", `URL significativi QA ${process.env.QA_RUN_ID}`);
  form.append("files", new Blob([await readFile(photoPath)], { type: "image/png" }), "url-significativo.png");
  const create = await fetch(`${baseUrl}/api/posts`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${sessionToken}`,
      "x-device-key": deviceKey,
      "x-idempotency-key": crypto.randomUUID(),
      "x-qa-silent": "true",
    },
    body: form,
  });
  expect(create.status).toBe(201);
  const post = await create.json();
  const context = await browser.newContext({
    ...devices["Galaxy S9+"],
    viewport: { width: 360, height: 800 },
    serviceWorkers: "block",
  });
  try {
    const page = await context.newPage();
    const cases = [
      { path: "/", ready: () => page.getByRole("heading", { name: /Raccontiamocele insieme/i }) },
      { path: "/?view=map", ready: () => page.locator(".overviewRouteMap canvas") },
      { path: "/?view=map&day=1", ready: () => page.locator(".dayRouteMap canvas") },
      { path: `/?post=${encodeURIComponent(post.id)}`, ready: () => page.locator(`[data-scroll-anchor="post-${post.id}"]`) },
      { path: `/?photo=${encodeURIComponent(`${post.id}:0`)}`, ready: () => page.getByRole("dialog", { name: "Fotografia aperta" }) },
    ];
    for (const route of cases) {
      const response = await page.goto(`${baseUrl}${route.path}`, { waitUntil: "domcontentloaded" });
      expect(response?.ok()).toBeTruthy();
      await expect(route.ready()).toBeVisible({ timeout: 30_000 });
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(route.ready()).toBeVisible({ timeout: 30_000 });
      await expect(page.locator("body")).not.toContainText(/application error|pagina bianca/i);
    }
  } finally {
    await fetch(`${baseUrl}/api/posts/${post.id}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${sessionToken}`, "x-device-key": deviceKey },
    }).catch(() => {});
    await context.close();
  }
});
