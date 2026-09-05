import { test, expect, devices } from "@playwright/test";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const owner = {
  token: process.env.QA_UI_SESSION_TOKEN,
  id: process.env.QA_UI_PROFILE_ID,
  name: process.env.QA_UI_PROFILE_NAME,
  key: process.env.QA_UI_DEVICE_KEY,
};
const other = {
  token: process.env.QA_SECOND_SESSION_TOKEN,
  id: process.env.QA_SECOND_PROFILE_ID,
  name: "Secondo QA",
  key: process.env.QA_OTHER_DEVICE_KEY,
};

test.skip(
  !baseUrl || !isSafeMutationTarget(baseUrl) || Object.values(owner).some((value) => !value) ||
    Object.values(other).some((value) => !value),
  "Due sessioni personali e URL QA richiesti",
);
test.use({ serviceWorkers: "block" });

async function personalContext(browser, member) {
  const context = await browser.newContext({
    ...devices["Galaxy S9+"],
    viewport: { width: 412, height: 915 },
    serviceWorkers: "block",
  });
  await context.addInitScript(({ token, id, name, key }) => {
    localStorage.setItem("india-session-token", token);
    localStorage.setItem("india-profile-id", id);
    localStorage.setItem("india-profile-name", name);
    localStorage.setItem("india-visitor-name", name);
    localStorage.setItem("india-role", "traveler");
    localStorage.setItem("india-device-key", key);
  }, member);
  return context;
}

async function openGroup(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".accessPill")).not.toContainText("Pubblico", { timeout: 20_000 });
  await page.locator(".tabs").getByRole("button", { name: "Gruppo" }).tap();
  await expect(page.locator(".peopleGrid")).toBeVisible();
}

test("il viaggiatore apre e modifica soltanto il proprio profilo, sincronizzato sugli altri telefoni", async ({ browser }) => {
  test.setTimeout(150_000);
  const ownerContext = await personalContext(browser, owner);
  const otherContext = await personalContext(browser, other);
  let original;
  let activeOwnerToken = owner.token;
  try {
    const ownerPage = await ownerContext.newPage();
    await openGroup(ownerPage);
    original = await ownerPage.evaluate(async ({ id, token, key }) => {
      const response = await fetch("/api/state", {
        headers: { authorization: `Bearer ${token}`, "x-device-key": key },
      });
      const state = await response.json();
      return state.profiles.find((profile) => profile.id === id);
    }, owner);
    expect(original?.id).toBe(owner.id);

    const ownCard = ownerPage.locator(".peopleGrid article").filter({ hasText: original.name }).first();
    await expect(ownCard.getByRole("button", { name: "Modifica profilo" })).toBeVisible();
    await ownCard.getByRole("button", { name: "Modifica profilo" }).tap();
    const form = ownerPage.locator(".profileForm");
    await expect(form.getByText("Stai modificando questo viaggiatore")).toBeVisible();
    const temporaryName = `ProfiloQA${process.env.QA_RUN_ID}`;
    await form.getByPlaceholder("Nome *").fill(temporaryName);
    await form.getByPlaceholder("Cognome").fill("Sincronizzato");
    const update = ownerPage.waitForResponse((response) =>
      new URL(response.url()).pathname === `/api/profiles/${owner.id}` && response.request().method() === "PUT");
    await form.getByRole("button", { name: "Salva modifiche" }).tap();
    expect((await update).status()).toBe(200);
    expect(await ownerPage.evaluate(() => localStorage.getItem("india-profile-id"))).toBe(owner.id);
    expect(await ownerPage.evaluate(() => localStorage.getItem("india-visitor-name"))).toBe(`${temporaryName} Sincronizzato`);
    await expect(ownerPage.locator(".peopleGrid article").filter({ hasText: temporaryName })).toBeVisible();
    activeOwnerToken = await ownerPage.evaluate(() => localStorage.getItem("india-session-token"));

    const otherPage = await otherContext.newPage();
    await openGroup(otherPage);
    const synchronizedCard = otherPage.locator(".peopleGrid article").filter({ hasText: temporaryName });
    await expect(synchronizedCard).toBeVisible({ timeout: 20_000 });
    await expect(synchronizedCard.getByRole("button", { name: "Modifica profilo" })).toHaveCount(0);
    expect(await otherPage.evaluate(() => localStorage.getItem("india-profile-id"))).toBe(other.id);

    await ownerPage.locator(".tabs").getByRole("button", { name: "Bacheca" }).tap();
    await expect(ownerPage.locator(".post").filter({ hasText: temporaryName })).toHaveCount(0);
  } finally {
    if (original) {
      const body = new FormData();
      for (const field of ["name", "surname", "age", "job", "origin_city", "bio", "gender"])
        body.set(field, original[field] ?? "");
      await fetch(`${baseUrl}/api/profiles/${encodeURIComponent(owner.id)}`, {
        method: "PUT",
        headers: { authorization: `Bearer ${activeOwnerToken}`, "x-device-key": owner.key },
        body,
      }).catch(() => {});
    }
    await Promise.all([ownerContext.close(), otherContext.close()]);
  }
});
