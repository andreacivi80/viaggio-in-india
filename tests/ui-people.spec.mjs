import { test, expect, devices } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const travelerName = process.env.QA_UI_PROFILE_NAME;
const travelerInvite = process.env.QA_UI_INVITE_TOKEN;
const coordinatorInvite = process.env.QA_UI_COORDINATOR_INVITE_TOKEN;
const managedName = process.env.QA_UI_MANAGED_PROFILE_NAME;
const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");

test.skip(
  !travelerName || !travelerInvite || !coordinatorInvite || !managedName || !baseUrl,
  "Profili QA e URL richiesti",
);

const tapBottom = async (page, name) => {
  const button = page.locator(".tabs").getByRole("button", { name });
  const box = await button.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
};

const tapCenter = async (page, locator) => {
  await expect(locator).toBeVisible();
  await locator.evaluate((element) => element.scrollIntoView({
    behavior: "instant",
    block: "center",
    inline: "center",
  }));
  await expect.poll(() => locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return hit === element || element.contains(hit);
  })).toBe(true);
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
};

test("il coordinatore crea e aggiorna una persona mentre gli altri vedono i permessi corretti", async ({ browser }) => {
  test.slow();
  let coordinatorContext;
  let travelerContext;
  let publicContext;
  coordinatorContext = await browser.newContext({ ...devices["Galaxy S9+"] });
  const coordinatorPage = await coordinatorContext.newPage();
  try {
    await coordinatorPage.goto(`${baseUrl}/#invite=${encodeURIComponent(coordinatorInvite)}`, { waitUntil: "domcontentloaded" });
    await expect(coordinatorPage.locator(".accessPill")).toContainText("Coordinatore");
    await expect.poll(
      () => coordinatorPage.evaluate(() => localStorage.getItem("india-profile-id")),
    ).not.toBeNull();
    const coordinatorProfileId = await coordinatorPage.evaluate(() => localStorage.getItem("india-profile-id"));
    expect(coordinatorProfileId).toBeTruthy();
    await tapBottom(coordinatorPage, "Gruppo");
    const form = coordinatorPage.locator(".profileForm");
    await expect(form).toBeVisible();
    await form.getByRole("button", { name: "Inserisci viaggiatore" }).tap();
    await expect(form.getByRole("status")).toContainText("Inserisci almeno il nome.");

    await form.getByPlaceholder("Nome *").fill(managedName);
    await form.getByPlaceholder("Cognome").fill("Test");
    await form.getByPlaceholder("Età").fill("29");
    await form.getByPlaceholder("Lavoro").fill("Designer");
    await form.getByPlaceholder("Da dove vieni (es. Milano)").fill("Torino");
    await form.getByPlaceholder("Raccontaci qualcosa di te…").fill("Profilo creato dal collaudo mobile.");
    const createResponse = coordinatorPage.waitForResponse(
      (response) => response.url().endsWith("/api/profiles") && response.request().method() === "POST",
    );
    await form.getByRole("button", { name: "Inserisci viaggiatore" }).tap();
    expect((await createResponse).status()).toBe(201);
    await expect(form.getByRole("status")).toContainText("Viaggiatore inserito correttamente.");
    expect(await coordinatorPage.evaluate(() => localStorage.getItem("india-profile-id"))).toBe(coordinatorProfileId);

    let card = coordinatorPage.locator(".peopleGrid article").filter({ hasText: managedName });
    await expect(card).toContainText("Partecipante");
    await expect(card).toContainText("Torino");
    await expect(card).toContainText("29 anni");
    await expect(card).toContainText("Designer");
    await expect(card).toContainText("Profilo creato dal collaudo mobile.");

    await tapCenter(coordinatorPage, card.getByRole("button", { name: "Modifica profilo" }));
    await expect(form.getByText("Stai modificando questo viaggiatore")).toBeVisible();
    await expect(form.getByPlaceholder("Nome *")).toHaveValue(managedName);
    await form.getByPlaceholder("Da dove vieni (es. Milano)").fill("Bologna");
    await form.getByPlaceholder("Raccontaci qualcosa di te…").fill("Profilo aggiornato e sincronizzato.");
    await form.getByLabel("Ruolo nel viaggio").selectOption("coordinator");
    const updateResponse = coordinatorPage.waitForResponse(
      (response) => response.url().includes("/api/profiles/") && response.request().method() === "PUT",
    );
    await form.getByRole("button", { name: "Salva modifiche" }).tap();
    expect((await updateResponse).status()).toBe(200);
    await expect(form.getByRole("status")).toContainText("Profilo aggiornato correttamente.");
    expect(await coordinatorPage.evaluate(() => localStorage.getItem("india-profile-id"))).toBe(coordinatorProfileId);
    card = coordinatorPage.locator(".peopleGrid article").filter({ hasText: managedName });
    await expect(card).toContainText("Coordinatore");
    await expect(card).toContainText("Bologna");
    await expect(card).toContainText("Profilo aggiornato e sincronizzato.");

    await tapCenter(coordinatorPage, card.getByRole("button", { name: "Documenti e posizione" }));
    expect(await coordinatorPage.evaluate(() => localStorage.getItem("india-profile-id"))).toBe(coordinatorProfileId);
    await tapBottom(coordinatorPage, "Gruppo");
    await expect(coordinatorPage.locator(".accessPill")).toContainText("Coordinatore");
    card = coordinatorPage.locator(".peopleGrid article").filter({ hasText: managedName });

    const inviteResponse = coordinatorPage.waitForResponse(
      (response) => response.url().endsWith("/api/auth/invites") && response.request().method() === "POST",
    );
    await card.getByRole("button", { name: "Crea invito personale" }).tap();
    expect((await inviteResponse).status()).toBe(201);
    await expect(
      coordinatorPage.getByRole("status").filter({ hasText: `Invito pronto per ${managedName}` }),
    ).toBeVisible();
    await expect(card.getByRole("button", { name: "Copia link" })).toBeVisible();

    await coordinatorContext.close();
    coordinatorContext = undefined;
    travelerContext = await browser.newContext({ ...devices["Galaxy S9+"] });
    const travelerPage = await travelerContext.newPage();
    await travelerPage.goto(`${baseUrl}/#invite=${encodeURIComponent(travelerInvite)}`, { waitUntil: "domcontentloaded" });
    await tapBottom(travelerPage, "Gruppo");
    const travelerView = travelerPage.locator(".peopleGrid article").filter({ hasText: managedName });
    await expect(travelerView).toContainText("Coordinatore", { timeout: 15_000 });
    await expect(travelerView.getByRole("button", { name: /Modifica profilo|Crea invito personale|Documenti e posizione/ })).toHaveCount(0);
    await expect(travelerPage.locator(".profileForm")).toHaveCount(0);

    await travelerContext.close();
    travelerContext = undefined;
    publicContext = await browser.newContext({ ...devices["Galaxy S9+"] });
    const publicPage = await publicContext.newPage();
    await publicPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await tapBottom(publicPage, "Gruppo");
    await expect(publicPage.locator(".privateGroupGate")).toBeVisible();
    await expect(publicPage.locator(".quickProfilePanel").getByPlaceholder("Password")).toBeVisible();
    await expect(publicPage.locator(".peopleGrid article")).toHaveCount(0);
    await expect(publicPage.getByText(managedName)).toHaveCount(0);
  } finally {
    await Promise.all(
      [coordinatorContext, travelerContext, publicContext]
        .filter(Boolean)
        .map((context) => context.close()),
    );
  }
});
