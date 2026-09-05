import { test, expect, devices } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const sessionToken = process.env.QA_UI_SESSION_TOKEN;
const profileId = process.env.QA_UI_PROFILE_ID;
const deviceKey = process.env.QA_UI_DEVICE_KEY;
const photoPath = fileURLToPath(new URL("../public/cities/agra.jpg", import.meta.url));

test.skip(!baseUrl || !sessionToken || !profileId || !deviceKey || !isSafeMutationTarget(baseUrl), "Sessione e URL QA richiesti");
test.use({ serviceWorkers: "block" });

test("il link di una fotografia riapre esattamente quella fotografia", async ({ browser }) => {
  const form = new FormData();
  form.set("visibility", "public");
  form.set("day_index", "0");
  form.set("text", `Deep link fotografia QA ${process.env.QA_RUN_ID}`);
  form.append("files", new Blob([await readFile(photoPath)], { type: "image/jpeg" }), "deep-link-agra.jpg");
  const headers = {
    authorization: `Bearer ${sessionToken}`,
    "x-device-key": deviceKey,
    "x-idempotency-key": crypto.randomUUID(),
    "x-qa-silent": "true",
  };
  const createResponse = await fetch(`${baseUrl}/api/posts`, { method: "POST", headers, body: form });
  expect(createResponse.status).toBe(201);
  const post = await createResponse.json();

  const context = await browser.newContext({
    ...devices["Galaxy S9+"],
    viewport: { width: 360, height: 800 },
    serviceWorkers: "block",
  });
  try {
    const page = await context.newPage();
    await page.goto(`${baseUrl}/?photo=${encodeURIComponent(`${post.id}:0`)}`, { waitUntil: "domcontentloaded" });
    const viewer = page.getByRole("dialog", { name: "Fotografia aperta" });
    await expect(viewer).toBeVisible({ timeout: 20_000 });
    await expect(viewer.locator("img")).toHaveJSProperty("complete", true);
    expect(await viewer.locator("img").evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(viewer).toBeVisible({ timeout: 20_000 });
    await viewer.getByRole("button", { name: "Chiudi foto" }).tap();
    await expect(viewer).toHaveCount(0);
    expect(new URL(page.url()).searchParams.has("photo")).toBe(false);
  } finally {
    await fetch(`${baseUrl}/api/posts/${post.id}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${sessionToken}`, "x-device-key": deviceKey },
    }).catch(() => {});
    await context.close();
  }
});
