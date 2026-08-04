import { chromium } from "playwright";
import assert from "node:assert/strict";

const target = process.env.TEST_BASE_URL || "https://516511b3.viaggio-in-india-2026-qa.pages.dev";
const browser = await chromium.launch({ headless: true });
const results = [];

async function scenario(name, run) {
  const context = await browser.newContext({ serviceWorkers: "block" });
  try {
    await run(context);
    results.push({ name, status: "PASS" });
    console.log(`PASS ${results.length}/3 ${name}`);
  } catch (error) {
    results.push({ name, status: "FAIL", error: error.message });
    console.error(`FAIL ${results.length}/3 ${name}: ${error.message}`);
  } finally {
    await context.close();
  }
}

try {
  await scenario("telefono nuovo", async (context) => {
    const page = await context.newPage();
    await page.goto(target, { waitUntil: "networkidle" });
    assert.equal(await page.evaluate(() => localStorage.getItem("india-group-code")), null);
    assert.equal(await page.evaluate(() => localStorage.getItem("india-session-token")), null);
    await page.getByRole("button", { name: "Gruppo" }).click();
    await page.getByPlaceholder("Password").waitFor({ state: "visible" });
    assert.equal(await page.getByRole("button", { name: "Vista gruppo" }).isDisabled(), true);
    await page.getByRole("button", { name: "Pubblico" }).waitFor({ state: "visible" });
  });

  await scenario("memoria precedente eliminata", async (context) => {
    await context.addInitScript(() => {
      localStorage.setItem("india-group-code", "vecchio-codice");
      localStorage.setItem("india-profile-id", "profilo-falso");
      localStorage.setItem("india-role", "coordinator");
    });
    const page = await context.newPage();
    await page.goto(target, { waitUntil: "networkidle" });
    await page.waitForFunction(() =>
      localStorage.getItem("india-group-code") === null &&
      localStorage.getItem("india-profile-id") === null &&
      localStorage.getItem("india-role") === null,
      null,
      { timeout: 10000 }
    );
    await page.getByRole("button", { name: "Pubblico" }).waitFor({ state: "visible" });
    await page.getByRole("button", { name: "Gruppo" }).click();
    await page.getByPlaceholder("Password").waitFor({ state: "visible" });
  });

  await scenario("password senza identità non crea sessione", async (context) => {
    const page = await context.newPage();
    await page.goto(target, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Gruppo" }).click();
    await page.getByPlaceholder("Password").fill("india26");
    await page.getByRole("button", { name: "Accedi", exact: true }).click();
    await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(() => localStorage.getItem("india-group-code")), null);
    assert.equal(await page.evaluate(() => localStorage.getItem("india-session-token")), null);
    assert.equal(await page.getByRole("button", { name: "Vista gruppo" }).isDisabled(), true);
    await page.getByRole("button", { name: "Pubblico" }).waitFor({ state: "visible" });

    const privateStatus = await page.evaluate(async () => (await fetch("/api/private")).status);
    assert.ok([401, 403].includes(privateStatus), `API privata aperta: ${privateStatus}`);

    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Gruppo" }).click();
    await page.getByPlaceholder("Password").waitFor({ state: "visible" });
  });

  const passed = results.filter((result) => result.status === "PASS").length;
  console.log("REMOTE ACCESS GATE RESULT", JSON.stringify({ passed, total: results.length, results }));
  if (passed !== results.length) process.exitCode = 1;
} finally {
  await browser.close();
}
