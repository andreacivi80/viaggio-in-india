import { test, expect, devices } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const coordinatorName = process.env.QA_BOOTSTRAP_NAME;
const postMarker = process.env.QA_BOOTSTRAP_POST;
const groupCode = process.env.QA_UI_GROUP_CODE;
const deviceForProject = (projectName) => projectName === "iPhone-piccolo"
  ? devices["iPhone SE"]
  : projectName === "Samsung-vecchio"
    ? { ...devices["Galaxy S9+"], viewport: { width: 360, height: 740 } }
    : { ...devices["Galaxy S9+"], viewport: { width: 412, height: 915 } };

test.skip(!coordinatorName || !postMarker || !groupCode, "Identificativi e codice bootstrap QA richiesti");

test("il tasto Gruppo porta subito alla password su un telefono nuovo", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Gruppo", exact: true }).tap();
  await expect(page.getByText("Accesso privato", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
  await expect(page.locator(".quickProfilePanel").getByRole("button", { name: "Accedi", exact: true })).toBeVisible();
});

test("telefono nuovo: password, primo coordinatore, pubblicazione, riapertura e secondo telefono", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "Samsung-S20-FE", "Il primo coordinatore è un bootstrap unico; gli altri telefoni verificano l'accesso separatamente.");
  const runCoordinatorName = `${coordinatorName}-${testInfo.project.name}`;
  const runPostMarker = `${postMarker}-${testInfo.project.name}`;
  const device = deviceForProject(testInfo.project.name);
  const firstContext = await browser.newContext({
    ...device,
    serviceWorkers: "block",
  });
  const firstPage = await firstContext.newPage();
  await firstPage.goto("/", { waitUntil: "networkidle" });

  await expect(firstPage.locator(".accessPill")).toContainText("Pubblico");
  await firstPage.locator(".accessPill").tap();
  await expect(firstPage.getByText("Accesso privato", { exact: true })).toBeVisible();
  await firstPage.getByPlaceholder("Password").fill(groupCode);
  const groupResponse = firstPage.waitForResponse(
    (response) => response.url().endsWith("/api/auth/group") && response.request().method() === "POST",
  );
  await firstPage.getByRole("button", { name: "Accedi", exact: true }).tap();
  expect((await groupResponse).status()).toBe(200);

  await expect(firstPage.getByText("Entra nel gruppo", { exact: true })).toBeVisible();
  await expect(firstPage.getByRole("button", { name: "Coordinatore", exact: true })).toBeDisabled();
  await firstPage.getByPlaceholder("Nome *").fill(runCoordinatorName);
  await firstPage.getByPlaceholder("Cognome").fill("Collaudo");
  await firstPage.getByPlaceholder("Da dove vieni").fill("Roma");
  await expect(firstPage.getByRole("checkbox")).not.toBeChecked();
  await firstPage.getByRole("checkbox").check();
  const bootstrapResponse = firstPage.waitForResponse(
    (response) => response.url().endsWith("/api/auth/bootstrap") && response.request().method() === "POST",
  );
  await firstPage.getByRole("button", { name: "Crea profilo e accedi" }).tap();
  expect((await bootstrapResponse).status()).toBe(201);
  await expect(firstPage.locator(".accessPill")).toContainText(runCoordinatorName);
  await expect(firstPage.getByRole("button", { name: "Griglia coordinatore" })).toBeVisible();
  await expect(firstPage.getByText("STAI PARTECIPANDO COME")).toHaveCount(0);
  await expect.poll(() => firstPage.evaluate(() => localStorage.getItem("india-session-token"))).toBeTruthy();
  await expect.poll(() => firstPage.evaluate(() => localStorage.getItem("india-profile-id"))).toBeTruthy();
  await expect.poll(() => firstPage.evaluate(() => localStorage.getItem("india-role"))).toBe("coordinator");

  await firstPage.locator(".accessPill").tap();
  await firstPage.getByRole("button", { name: "Pubblica", exact: true }).tap();
  const sheet = firstPage.locator(".uploadSheet");
  await expect(sheet.getByText(/Pubblicazione (del gruppo|viaggiatore)/)).toBeVisible();
  await expect(sheet.getByPlaceholder("Password")).toHaveCount(0);
  await sheet.getByPlaceholder("Racconta questo momento…").fill(runPostMarker);
  const postResponse = firstPage.waitForResponse(
    (response) => response.url().endsWith("/api/posts") && response.request().method() === "POST",
  );
  await sheet.locator(".composerActions > button").tap();
  expect((await postResponse).status()).toBe(201);
  await expect(firstPage.getByText(runPostMarker, { exact: true })).toBeVisible();

  const persistedState = await firstContext.storageState();
  await firstContext.close();

  const reopenedContext = await browser.newContext({
    ...device,
    serviceWorkers: "block",
    storageState: persistedState,
  });
  const reopenedPage = await reopenedContext.newPage();
  await reopenedPage.goto("/", { waitUntil: "networkidle" });
  await expect(reopenedPage.locator(".accessPill")).toContainText(runCoordinatorName);
  await expect(reopenedPage.getByText("STAI PARTECIPANDO COME")).toHaveCount(0);
  await reopenedPage.getByRole("button", { name: "Pubblica", exact: true }).tap();
  await expect(reopenedPage.locator(".uploadSheet").getByText(/Pubblicazione (del gruppo|viaggiatore)/)).toBeVisible();
  await expect(reopenedPage.locator(".uploadSheet").getByPlaceholder("Password")).toHaveCount(0);
  await reopenedContext.close();

  const publicContext = await browser.newContext({
    ...device,
    serviceWorkers: "block",
  });
  const publicPage = await publicContext.newPage();
  await publicPage.goto("/", { waitUntil: "networkidle" });
  await expect(publicPage.locator(".accessPill")).toContainText("Pubblico");
  await expect(publicPage.getByText(runPostMarker, { exact: true })).toBeVisible();
  await publicContext.close();
});
