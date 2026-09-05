import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const groupCode = process.env.QA_UI_GROUP_CODE;
const testBaseUrl = process.env.TEST_BASE_URL || "";
const canMutateQa = process.env.QA_UI_ALLOW_REGISTRATION === "true"
  && /^https:\/\/([^.]+\.)?viaggio-in-india-2026-qa\.pages\.dev\/?$/i.test(testBaseUrl);

test("un dispositivo pubblico non vede comandi o dati privati", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator(".accessPill")).toContainText("Pubblico");
  await page.getByRole("button", { name: "Gruppo", exact: true }).tap();
  await expect(page.getByText("Accesso privato", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Documenti e sicurezza" })).toHaveCount(0);
  await expect(page.getByText("Griglia coordinatore")).toHaveCount(0);

  expect((await page.request.get("/api/private")).status()).toBe(401);
  expect((await page.request.get("/api/auth/devices")).status()).toBe(401);
  expect((await page.request.delete("/api/locations/profilo-altrui")).status()).toBe(403);
  expect((await page.request.delete("/api/documents/profilo-altrui/passport")).status()).toBe(403);
});

test("una password errata non sblocca il gruppo", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Gruppo", exact: true }).tap();
  await page.getByPlaceholder("Password").fill("codice-sbagliato");
  await page.locator(".quickProfilePanel").getByRole("button", { name: "Accedi", exact: true }).tap();
  await expect(page.getByText("Codice non corretto", { exact: true })).toBeVisible();
  await expect(page.locator(".accessPill")).toContainText("Pubblico");
  await expect(page.getByRole("heading", { name: "Documenti e sicurezza" })).toHaveCount(0);
});

test("senza sessione il compositore resta chiuso", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Pubblica", exact: true }).tap();
  const sheet = page.locator(".uploadSheet");
  await expect(sheet.getByText("Accesso privato", { exact: true })).toBeVisible();
  await expect(sheet.getByText("Pubblicazione del gruppo")).toHaveCount(0);
  await expect(sheet.getByPlaceholder("Racconta questo momento…")).toHaveCount(0);
});

test("password corretta crea il primo coordinatore o un nuovo viaggiatore senza auto-promozione", async ({ page }) => {
  test.skip(!groupCode || !canMutateQa, "Registrazione abilitata soltanto nell'ambiente QA isolato");
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Gruppo", exact: true }).tap();
  await page.getByPlaceholder("Password").fill(groupCode);
  await page.locator(".quickProfilePanel").getByRole("button", { name: "Accedi", exact: true }).tap();
  await expect(page.getByText("Entra nel gruppo", { exact: true })).toBeVisible();
  const travelerRole = page.getByRole("button", { name: "Viaggiatore", exact: true });
  const coordinatorRole = page.getByRole("button", { name: "Coordinatore", exact: true });
  const creatingFirstCoordinator = (await coordinatorRole.count()) === 1;
  await expect(creatingFirstCoordinator ? coordinatorRole : travelerRole).toBeDisabled();

  const uniqueName = `QA ${Date.now()}`;
  await page.getByPlaceholder("Nome *").fill(uniqueName);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Crea profilo e accedi", exact: true }).tap();
  await expect(page.locator(".accessPill")).toContainText("QA");
  const ownCard = page.locator(".profileCard").filter({ has: page.getByRole("heading", { name: uniqueName, exact: true }) });
  await expect(ownCard.getByRole("button", { name: "Documenti e posizione", exact: true })).toBeVisible();
  if (creatingFirstCoordinator) await expect(ownCard).toContainText("Coordinatore");
  else await expect(ownCard).not.toContainText("Coordinatore");

  const cleanup = await page.evaluate(async () => {
    const token = localStorage.getItem("india-session-token");
    const id = localStorage.getItem("india-profile-id");
    const deviceKey = localStorage.getItem("india-device-key");
    if (!token || !id) return 0;
    return (await fetch(`/api/profiles/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}`, "x-device-key": deviceKey || "" },
    })).status;
  });
  expect(creatingFirstCoordinator ? [409] : [200]).toContain(cleanup);
});

test("un token locale falso viene rimosso senza perdere la bozza", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("india-session-token", "token-non-valido");
    localStorage.setItem("india-draft", "Bozza da conservare");
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => localStorage.getItem("india-session-token"))).toBe(null);
  expect(await page.evaluate(() => localStorage.getItem("india-draft"))).toBe("Bozza da conservare");
  await page.getByRole("button", { name: "Pubblica", exact: true }).tap();
  await expect(page.locator(".uploadSheet").getByText("Accesso privato", { exact: true })).toBeVisible();
});

test("una vecchia cache privata non appare durante il caricamento pubblico", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("india-people", JSON.stringify([{ id: "profilo-cache", name: "Persona pubblica", age: "99", job: "Lavoro segreto", bio: "BIOGRAFIA PRIVATA NON VISIBILE" }]));
    localStorage.setItem("india-posts", JSON.stringify([
      { id: "post-privato-cache", visibility: "private", text: "POST PRIVATO NON VISIBILE", can_manage: true },
      { id: "post-pubblico-cache", visibility: "public", text: "Ricordo pubblico dalla cache", can_manage: true },
    ]));
  });
  let releaseState;
  const stateReleased = new Promise((resolve) => { releaseState = resolve; });
  await page.route("**/api/state", async (route) => { await stateReleased; await route.continue(); });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Ricordo pubblico dalla cache")).toBeVisible();
  await expect(page.getByText("POST PRIVATO NON VISIBILE")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Elimina", exact: true })).toHaveCount(0);
  releaseState();
});
