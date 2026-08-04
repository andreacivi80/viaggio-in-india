import { test, expect } from "@playwright/test";

const baseUrl = (process.env.TEST_BASE_URL || "https://viaggio-in-india-2026.pages.dev")
  .replace(/\/$/, "");

test.use({ serviceWorkers: "block" });

test("telefono nuovo: Gruppo richiede la password e non concede identità personale", async ({ page }) => {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await expect
    .poll(() => page.evaluate(() => ({
      groupCode: localStorage.getItem("india-group-code"),
      sessionToken: localStorage.getItem("india-session-token"),
    })))
    .toEqual({ groupCode: null, sessionToken: null });

  await page.getByRole("button", { name: "Gruppo" }).click();
  await expect(page.getByText("Accesso privato", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Vista gruppo" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Pubblico" })).toBeVisible();
});

test("telefono già usato: il vecchio codice salvato viene eliminato e Gruppo resta chiuso", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("india-group-code", "vecchio-codice-memorizzato");
  });
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("india-group-code")))
    .toBe(null);
  await expect(page.getByRole("button", { name: "Pubblico" })).toBeVisible();
  await page.getByRole("button", { name: "Gruppo" }).click();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Vista gruppo" })).toBeDisabled();
});

test("password comune verificata: non resta salvata e non crea una sessione personale", async ({ page }) => {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Gruppo" }).click();
  await page.getByPlaceholder("Password").fill("india26");
  await page.getByRole("button", { name: "Accedi", exact: true }).click();

  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("india-group-code")))
    .toBe(null);
  await expect(page.getByRole("button", { name: "Pubblico" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Vista gruppo" })).toBeDisabled();
  await expect(page.getByText("Crea il primo coordinatore")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("india-session-token")))
    .toBe(null);

  const privateResponse = await page.request.get(`${baseUrl}/api/private`);
  expect([401, 403]).toContain(privateResponse.status());

  const profileResponse = await page.request.post(`${baseUrl}/api/profiles`, {
    headers: { "x-group-code": "india26" },
    multipart: { name: "Tentativo senza sessione" },
  });
  expect([401, 403]).toContain(profileResponse.status());

  const postResponse = await page.request.post(`${baseUrl}/api/posts`, {
    headers: { "x-group-code": "india26" },
    multipart: { text: "Tentativo senza sessione", visibility: "public" },
  });
  expect([401, 403]).toContain(postResponse.status());

  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Gruppo" }).click();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
});
