import { test, expect, devices } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const coordinatorName = process.env.QA_BOOTSTRAP_NAME;
const postMarker = process.env.QA_BOOTSTRAP_POST;

test.skip(!coordinatorName || !postMarker, "Identificativi bootstrap QA richiesti");

test("il tasto Gruppo porta subito alla password su un telefono nuovo", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Gruppo", exact: true }).click();
  await expect(page.getByText("Accesso privato", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Accedi", exact: true })).toBeVisible();
});

test("telefono nuovo: password, primo coordinatore, pubblicazione, riapertura e secondo telefono", async ({ browser }) => {
  const firstContext = await browser.newContext({
    ...devices["Galaxy S9+"],
    serviceWorkers: "block",
  });
  const firstPage = await firstContext.newPage();
  await firstPage.goto("/", { waitUntil: "networkidle" });

  await expect(firstPage.locator(".accessPill")).toContainText("Pubblico");
  await firstPage.locator(".accessPill").click();
  await expect(firstPage.getByText("Accesso privato", { exact: true })).toBeVisible();
  await firstPage.getByPlaceholder("Password").fill("india26");
  const groupResponse = firstPage.waitForResponse(
    (response) => response.url().endsWith("/api/auth/group") && response.request().method() === "POST",
  );
  await firstPage.getByRole("button", { name: "Accedi", exact: true }).click();
  expect((await groupResponse).status()).toBe(200);

  await expect(firstPage.getByText("Crea il primo coordinatore", { exact: true })).toBeVisible();
  await firstPage.getByPlaceholder("Nome *").fill(coordinatorName);
  await firstPage.getByPlaceholder("Cognome").fill("Collaudo");
  await firstPage.getByPlaceholder("Da dove vieni").fill("Roma");
  const bootstrapResponse = firstPage.waitForResponse(
    (response) => response.url().endsWith("/api/auth/bootstrap") && response.request().method() === "POST",
  );
  await firstPage.getByRole("button", { name: "Crea e collega questo telefono" }).click();
  expect((await bootstrapResponse).status()).toBe(201);
  await expect(firstPage.locator(".accessPill")).toContainText(coordinatorName);
  await expect(firstPage.getByRole("button", { name: "Griglia coordinatore" })).toBeVisible();
  await expect(firstPage.getByText("STAI PARTECIPANDO COME")).toHaveCount(0);
  await expect.poll(() => firstPage.evaluate(() => localStorage.getItem("india-session-token"))).toBeTruthy();
  await expect.poll(() => firstPage.evaluate(() => localStorage.getItem("india-profile-id"))).toBeTruthy();
  await expect.poll(() => firstPage.evaluate(() => localStorage.getItem("india-role"))).toBe("coordinator");

  await firstPage.locator(".accessPill").click();
  await firstPage.getByRole("button", { name: "Pubblica", exact: true }).click();
  const sheet = firstPage.locator(".uploadSheet");
  await expect(sheet.getByText(/Pubblicazione (del gruppo|viaggiatore)/)).toBeVisible();
  await expect(sheet.getByPlaceholder("Password")).toHaveCount(0);
  await sheet.getByPlaceholder("Racconta questo momento…").fill(postMarker);
  const postResponse = firstPage.waitForResponse(
    (response) => response.url().endsWith("/api/posts") && response.request().method() === "POST",
  );
  await sheet.locator(".composerActions > button").click();
  expect((await postResponse).status()).toBe(201);
  await expect(firstPage.getByText(postMarker, { exact: true })).toBeVisible();

  const persistedState = await firstContext.storageState();
  await firstContext.close();

  const reopenedContext = await browser.newContext({
    ...devices["Galaxy S9+"],
    serviceWorkers: "block",
    storageState: persistedState,
  });
  const reopenedPage = await reopenedContext.newPage();
  await reopenedPage.goto("/", { waitUntil: "networkidle" });
  await expect(reopenedPage.locator(".accessPill")).toContainText(coordinatorName);
  await expect(reopenedPage.getByText("STAI PARTECIPANDO COME")).toHaveCount(0);
  await reopenedPage.getByRole("button", { name: "Pubblica", exact: true }).click();
  await expect(reopenedPage.locator(".uploadSheet").getByText(/Pubblicazione (del gruppo|viaggiatore)/)).toBeVisible();
  await expect(reopenedPage.locator(".uploadSheet").getByPlaceholder("Password")).toHaveCount(0);
  await reopenedContext.close();

  const publicContext = await browser.newContext({
    ...devices["Galaxy S9+"],
    serviceWorkers: "block",
  });
  const publicPage = await publicContext.newPage();
  await publicPage.goto("/", { waitUntil: "networkidle" });
  await expect(publicPage.locator(".accessPill")).toContainText("Pubblico");
  await expect(publicPage.getByText(postMarker, { exact: true })).toBeVisible();
  await publicContext.close();
});
