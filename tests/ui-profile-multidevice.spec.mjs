import { test, expect, devices } from "@playwright/test";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const profileId = process.env.QA_UI_PROFILE_ID;
const profileName = process.env.QA_UI_PROFILE_NAME;
const primary = { token: process.env.QA_UI_SESSION_TOKEN, key: process.env.QA_UI_DEVICE_KEY };
const secondary = { token: process.env.QA_SECOND_DEVICE_TOKEN, key: process.env.QA_SECOND_DEVICE_KEY };

test.skip(
  !baseUrl || !isSafeMutationTarget(baseUrl) || !profileId || !profileName ||
    Object.values(primary).some((value) => !value) || Object.values(secondary).some((value) => !value),
  "Profilo QA con due sessioni personali richiesto",
);

async function profileContext(browser, device) {
  const context = await browser.newContext({
    ...devices["Galaxy S9+"],
    viewport: { width: 412, height: 915 },
    serviceWorkers: "block",
  });
  await context.addInitScript(({ id, name, token, key }) => {
    if (localStorage.getItem("india-session-token")) return;
    localStorage.setItem("india-session-token", token);
    localStorage.setItem("india-profile-id", id);
    localStorage.setItem("india-profile-name", name);
    localStorage.setItem("india-visitor-name", name);
    localStorage.setItem("india-role", "traveler");
    localStorage.setItem("india-device-key", key);
  }, { id: profileId, name: profileName, ...device });
  return context;
}

async function openOwnProfile(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".accessPill")).not.toContainText("Pubblico", { timeout: 20_000 });
  await page.locator(".tabs").getByRole("button", { name: "Gruppo" }).tap();
  const card = page.locator(".peopleGrid article").filter({ has: page.getByRole("button", { name: "Modifica profilo" }) }).first();
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Modifica profilo" }).tap();
  await expect(page.locator(".profileForm").getByText("Stai modificando questo viaggiatore")).toBeVisible();
  return page.locator(".profileForm");
}

async function saveProfile(page, values) {
  const form = page.locator(".profileForm");
  await form.getByPlaceholder("Nome *").fill(values.name);
  await form.getByPlaceholder("Cognome").fill(values.surname);
  await form.getByPlaceholder("Età").fill(values.age);
  const response = page.waitForResponse((candidate) =>
    new URL(candidate.url()).pathname === `/api/profiles/${profileId}` && candidate.request().method() === "PUT");
  await form.getByRole("button", { name: "Salva modifiche" }).tap();
  expect((await response).status()).toBe(200);
}

test("lo stesso profilo resta integro tra due telefoni e durante due modifiche concorrenti", async ({ browser }) => {
  test.setTimeout(180_000);
  const firstContext = await profileContext(browser, primary);
  const secondContext = await profileContext(browser, secondary);
  let firstPage;
  let secondPage;
  let original;
  try {
    firstPage = await firstContext.newPage();
    secondPage = await secondContext.newPage();
    await Promise.all([
      firstPage.goto(baseUrl, { waitUntil: "domcontentloaded" }),
      secondPage.goto(baseUrl, { waitUntil: "domcontentloaded" }),
    ]);
    original = await firstPage.evaluate(async (id) => {
      const response = await fetch("/api/state", { headers: {
        authorization: `Bearer ${localStorage.getItem("india-session-token")}`,
        "x-device-key": localStorage.getItem("india-device-key"),
      } });
      const state = await response.json();
      return { profile: state.profiles.find((item) => item.id === id), count: state.profiles.length };
    }, profileId);
    expect(original.profile?.id).toBe(profileId);

    const secondCount = await secondPage.evaluate(async () => {
      const response = await fetch("/api/state", { headers: {
        authorization: `Bearer ${localStorage.getItem("india-session-token")}`,
        "x-device-key": localStorage.getItem("india-device-key"),
      } });
      return (await response.json()).profiles.length;
    }, secondary);
    expect(secondCount).toBe(original.count);

    await openOwnProfile(secondPage);
    const secondaryName = `SecondoTel${process.env.QA_RUN_ID}`;
    await saveProfile(secondPage, { name: secondaryName, surname: "Integro", age: "31" });
    await firstPage.reload({ waitUntil: "domcontentloaded" });
    await firstPage.locator(".tabs").getByRole("button", { name: "Gruppo" }).tap();
    await expect(firstPage.locator(".peopleGrid article").filter({ hasText: secondaryName })).toBeVisible();

    const firstForm = await openOwnProfile(firstPage);
    const secondForm = await openOwnProfile(secondPage);
    const candidateA = { name: `ConcA${process.env.QA_RUN_ID}`, surname: "CompletoA", age: "41" };
    const candidateB = { name: `ConcB${process.env.QA_RUN_ID}`, surname: "CompletoB", age: "52" };
    await firstForm.getByPlaceholder("Nome *").fill(candidateA.name);
    await firstForm.getByPlaceholder("Cognome").fill(candidateA.surname);
    await firstForm.getByPlaceholder("Età").fill(candidateA.age);
    await secondForm.getByPlaceholder("Nome *").fill(candidateB.name);
    await secondForm.getByPlaceholder("Cognome").fill(candidateB.surname);
    await secondForm.getByPlaceholder("Età").fill(candidateB.age);
    const responses = Promise.all([
      firstPage.waitForResponse((candidate) => new URL(candidate.url()).pathname === `/api/profiles/${profileId}` && candidate.request().method() === "PUT"),
      secondPage.waitForResponse((candidate) => new URL(candidate.url()).pathname === `/api/profiles/${profileId}` && candidate.request().method() === "PUT"),
    ]);
    await Promise.all([
      firstForm.getByRole("button", { name: "Salva modifiche" }).tap(),
      secondForm.getByRole("button", { name: "Salva modifiche" }).tap(),
    ]);
    expect((await responses).map((response) => response.status())).toEqual([200, 200]);

    await expect.poll(async () => firstPage.evaluate(async ({ id, accepted }) => {
      const response = await fetch("/api/state", { headers: {
        authorization: `Bearer ${localStorage.getItem("india-session-token")}`,
        "x-device-key": localStorage.getItem("india-device-key"),
      } });
      const profile = (await response.json()).profiles.find((item) => item.id === id);
      return accepted.some((candidate) => profile?.name === candidate.name && profile?.surname === candidate.surname && String(profile?.age) === candidate.age);
    }, { id: profileId, accepted: [candidateA, candidateB] }), { timeout: 20_000 }).toBe(true);
  } finally {
    if (original?.profile && firstPage)
      await firstPage.evaluate(async ({ id, profile }) => {
        const body = new FormData();
        for (const field of ["name", "surname", "age", "job", "origin_city", "bio", "gender"])
          body.set(field, profile[field] ?? "");
        await fetch(`/api/profiles/${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: {
            authorization: `Bearer ${localStorage.getItem("india-session-token")}`,
            "x-device-key": localStorage.getItem("india-device-key"),
          },
          body,
        });
      }, { id: profileId, profile: original.profile }).catch(() => {});
    await Promise.all([firstContext.close(), secondContext.close()]);
  }
});
