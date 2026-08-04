import { chromium } from "playwright";
import assert from "node:assert/strict";

const target = process.env.TEST_BASE_URL || "https://516511b3.viaggio-in-india-2026-qa.pages.dev";

const browser = await chromium.launch({ headless: true });
try {
  {
    const context = await browser.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    await page.goto(target, { waitUntil: "networkidle" });
    assert.equal(await page.evaluate(() => localStorage.getItem("india-group-code")), null);
    assert.equal(await page.evaluate(() => localStorage.getItem("india-session-token")), null);
    await page.getByRole("button", { name: "Gruppo" }).click();
    await page.getByPlaceholder("Password").waitFor({ state: "visible" });
    assert.equal(await page.getByRole("button", { name: "Vista gruppo" }).isDisabled(), true);
    await page.getByRole("button", { name: "Pubblico" }).waitFor({ state: "visible" });
    await context.close();
    console.log("PASS 1/3 telefono nuovo");
  }

  {
    const context = await browser.newContext({ serviceWorkers: "block" });
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
      localStorage.getItem("india-role") === null
    );
    await page.getByRole("button", { name: "Pubblico" }).waitFor({ state: "visible" });
    await page.getByRole("button", { name: "Gruppo" }).click();
    await page.getByPlaceholder("Password").waitFor({ state: "visible" });
    await context.close();
    console.log("PASS 2/3 memoria precedente eliminata");
  }

  {
    const context = await browser.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    await page.goto(target, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Gruppo" }).click();
    await page.getByPlaceholder("Password").fill("india26");
    await page.getByRole("button", { name: "Accedi", exact: true }).click();
    await page.waitForFunction(() => localStorage.getItem("india-group-code") === null);
    assert.equal(await page.evaluate(() => localStorage.getItem("india-session-token")), null);
    assert.equal(await page.getByRole("button", { name: "Vista gruppo" }).isDisabled(), true);
    await page.getByRole("button", { name: "Pubblico" }).waitFor({ state: "visible" });

    const privateStatus = await page.evaluate(async () => (await fetch("/api/private")).status);
    assert.ok([401, 403].includes(privateStatus), `API privata aperta: ${privateStatus}`);

    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Gruppo" }).click();
    await page.getByPlaceholder("Password").waitFor({ state: "visible" });
    await context.close();
    console.log("PASS 3/3 password non persistente e nessuna sessione");
  }

  console.log("REMOTE ACCESS GATE COMPLETE 3/3");
} finally {
  await browser.close();
}
