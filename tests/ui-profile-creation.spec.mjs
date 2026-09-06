import { test, expect, devices } from "@playwright/test";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const coordinator = {
  id: process.env.QA_COORDINATOR_PROFILE_ID,
  token: process.env.QA_COORDINATOR_TOKEN,
  key: process.env.QA_COORDINATOR_DEVICE_KEY,
};

test.skip(
  !baseUrl || !isSafeMutationTarget(baseUrl) || Object.values(coordinator).some((value) => !value),
  "Sessione coordinatrice QA richiesta",
);

test.use({ ...devices["Galaxy S9+"], viewport: { width: 412, height: 915 }, serviceWorkers: "block" });

test("la coordinatrice crea due viaggiatori e tutti i telefoni leggono lo stesso conteggio", async ({ browser }) => {
  test.setTimeout(150_000);
  const context = await browser.newContext({
    ...devices["Galaxy S9+"],
    viewport: { width: 412, height: 915 },
    serviceWorkers: "block",
  });
  await context.addInitScript(({ id, token, key }) => {
    localStorage.setItem("india-session-token", token);
    localStorage.setItem("india-profile-id", id);
    localStorage.setItem("india-profile-name", "Coordinatrice QA");
    localStorage.setItem("india-visitor-name", "Coordinatrice QA");
    localStorage.setItem("india-role", "coordinator");
    localStorage.setItem("india-device-key", key);
  }, coordinator);
  const page = await context.newPage();
  const createdIds = [];
  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".accessPill")).not.toContainText("Pubblico", { timeout: 20_000 });
    const initialCount = await page.evaluate(async () => {
      const response = await fetch("/api/state", { headers: {
        authorization: `Bearer ${localStorage.getItem("india-session-token")}`,
        "x-device-key": localStorage.getItem("india-device-key"),
      } });
      return (await response.json()).profiles.length;
    });
    await page.locator(".tabs").getByRole("button", { name: "Gruppo" }).tap();
    const form = page.locator(".profileForm");
    await expect(form).toBeVisible();

    for (const suffix of ["A", "B"]) {
      const name = `Viaggiatore${suffix}${process.env.QA_RUN_ID}`;
      await form.getByPlaceholder("Nome *").fill(name);
      await form.getByPlaceholder("Cognome").fill("CreazioneQA");
      const responsePromise = page.waitForResponse((response) =>
        new URL(response.url()).pathname === "/api/profiles" && response.request().method() === "POST");
      await form.getByRole("button", { name: "Inserisci viaggiatore" }).tap();
      const response = await responsePromise;
      expect(response.status()).toBe(201);
      createdIds.push((await response.json()).id);
      await expect(page.locator(".peopleGrid article").filter({ hasText: name })).toContainText("Partecipante");
    }

    const finalState = await page.evaluate(async () => {
      const response = await fetch("/api/state", { headers: {
        authorization: `Bearer ${localStorage.getItem("india-session-token")}`,
        "x-device-key": localStorage.getItem("india-device-key"),
      } });
      return response.json();
    });
    expect(finalState.profiles.length).toBe(initialCount + 2);
    for (const id of createdIds)
      expect(finalState.profiles.find((profile) => profile.id === id)?.role).toBe("traveler");
  } finally {
    for (const id of createdIds)
      await page.evaluate(async (profileId) => fetch(`/api/profiles/${encodeURIComponent(profileId)}`, {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${localStorage.getItem("india-session-token")}`,
          "x-device-key": localStorage.getItem("india-device-key"),
        },
      }), id).catch(() => {});
    await context.close();
  }
});
