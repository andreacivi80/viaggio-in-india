import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const profileName = process.env.QA_UI_PROFILE_NAME;
const inviteToken = process.env.QA_UI_INVITE_TOKEN;
const switchInviteToken = process.env.QA_UI_SWITCH_INVITE_TOKEN;
const coordinatorName = process.env.QA_UI_COORDINATOR_NAME;
const coordinatorInviteToken = process.env.QA_UI_COORDINATOR_INVITE_TOKEN;

test.skip(
  !profileName || !inviteToken || !switchInviteToken || !coordinatorName || !coordinatorInviteToken,
  "Profili QA e inviti personali richiesti",
);

test("invito personale, pubblicazione e riapertura restano collegati", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("india-group-code", "gruppo-gia-aperto");
    localStorage.setItem("india-profile-id", "profilo-di-un-altra-persona");
    localStorage.setItem("india-visitor-name", "Profilo Vecchio");
    localStorage.setItem("india-role", "coordinator");
    localStorage.setItem("india-guest-token", "ospite-precedente");
    localStorage.setItem("india-guest-name", "Ospite Precedente");
    localStorage.setItem("india-visitor-id", "visitatore-precedente");
  });
  await page.goto(`/?invite=${encodeURIComponent(inviteToken)}`, {
    waitUntil: "networkidle",
  });
  await expect(page.locator(".accessPill")).toContainText(profileName.split(" ")[0]);
  await expect(page).not.toHaveURL(/invite=/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("india-profile-id"))).not.toBe("profilo-di-un-altra-persona");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("india-visitor-name"))).toContain(profileName.split(" ")[0]);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("india-role"))).toBe("traveler");
  expect(await page.evaluate(() => localStorage.getItem("india-guest-token"))).toBe(null);
  expect(await page.evaluate(() => localStorage.getItem("india-guest-name"))).toBe(null);
  expect(await page.evaluate(() => localStorage.getItem("india-visitor-id"))).toBe(null);
  await page.locator(".accessPill").click();
  await expect(page.getByRole("button", { name: "Documenti e sicurezza" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Griglia coordinatore" })).toHaveCount(0);
  await page.locator(".accessPill").click();

  await page.getByRole("button", { name: "Pubblica" }).click();
  const sheet = page.locator(".uploadSheet");
  await expect(sheet.getByText("Pubblicazione del gruppo")).toBeVisible();
  await expect(sheet.getByPlaceholder("Password")).toHaveCount(0);

  const marker = `Percorso UI QA ${Date.now()}`;
  const publishButton = sheet.locator(".composerActions > button");
  await expect(publishButton).toBeDisabled();
  await sheet.getByPlaceholder("Racconta questo momento…").fill(marker);
  await expect(publishButton).toBeEnabled();
  let postRequests = 0;
  let releasePost;
  let markPostReached;
  const postReached = new Promise((resolve) => {
    markPostReached = resolve;
  });
  const postRelease = new Promise((resolve) => {
    releasePost = resolve;
  });
  await page.route("**/api/posts", async (route) => {
    if (route.request().method() === "POST") {
      postRequests += 1;
      markPostReached();
      await postRelease;
    }
    await route.continue();
  });
  const created = page.waitForResponse(
    (response) =>
      response.url().includes("/api/posts") &&
      response.request().method() === "POST",
  );
  await publishButton.click();
  await postReached;
  await expect(publishButton).toBeDisabled();
  await expect(sheet.getByText("Pubblicazione in corso…")).toBeVisible();
  await publishButton.evaluate((button) => button.click());
  expect(postRequests).toBe(1);
  releasePost();
  expect((await created).status()).toBe(201);
  expect(postRequests).toBe(1);
  await expect(page.getByText(marker)).toBeVisible();
  await expect(page.getByText("Pubblicazione riuscita.")).toBeVisible();
  const publicState = await (await page.request.get("/api/state")).json();
  expect(publicState.posts.filter((post) => post.text === marker)).toHaveLength(1);

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".accessPill")).toContainText(profileName.split(" ")[0]);
  await page.getByRole("button", { name: "Pubblica" }).click();
  await expect(page.locator(".uploadSheet").getByText("Pubblicazione del gruppo")).toBeVisible();
  await expect(page.locator(".uploadSheet").getByPlaceholder("Password")).toHaveCount(0);
});

test("senza sessione il compositore non viene mostrato", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".accessPill")).toBeVisible();
  await page.getByRole("button", { name: "Pubblica" }).click();
  const sheet = page.locator(".uploadSheet");
  await expect(sheet.getByText("Accesso privato")).toBeVisible();
  await expect(sheet.getByText("Pubblicazione del gruppo")).toHaveCount(0);
  await expect(sheet.getByPlaceholder("Racconta questo momento…")).toHaveCount(0);
});

test("dalla vista pubblica si raggiunge sempre l’accesso con password", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator(".accessPill").click();
  await page.getByRole("button", { name: "Vista pubblica" }).click();
  const accessButton = page.getByRole("button", { name: "Accedi al gruppo" });
  await expect(accessButton).toBeVisible();
  await accessButton.click();
  await expect(page.getByText("Accesso privato", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
});

test("un token locale falso viene rimosso senza perdere la bozza", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("india-session-token", "token-non-valido");
    localStorage.setItem("india-draft", "Bozza da conservare");
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".accessPill")).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("india-session-token"))).toBe(null);
  expect(await page.evaluate(() => localStorage.getItem("india-draft"))).toBe("Bozza da conservare");
  await page.getByRole("button", { name: "Pubblica" }).click();
  await expect(page.locator(".uploadSheet").getByText("Accesso privato")).toBeVisible();
});

test("un token non ancora verificato non espone identità o comandi personali", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("india-session-token", "token-in-verifica");
    localStorage.setItem("india-group-code", "gruppo-gia-aperto");
    localStorage.setItem("india-profile-id", "profilo-vecchio");
    localStorage.setItem("india-visitor-name", "Profilo Vecchio");
    localStorage.setItem("india-role", "coordinator");
  });
  let releaseSession;
  const sessionReleased = new Promise((resolve) => {
    releaseSession = resolve;
  });
  await page.route("**/api/auth/session", async (route) => {
    await sessionReleased;
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "Sessione non valida" }),
    });
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".accessPill")).toContainText("Verifica");
  await expect(page.locator(".accessPill")).not.toContainText("Profilo Vecchio");
  await page.locator(".accessPill").click();
  await expect(page.getByRole("status")).toContainText("Verifico l’accesso personale");
  await expect(page.getByRole("button", { name: "Condividi posizione" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Documenti e sicurezza|Griglia coordinatore/ })).toHaveCount(0);
  await page.locator(".accessPill").click();
  await page.getByRole("button", { name: "Pubblica" }).click();
  const sheet = page.locator(".uploadSheet");
  await expect(sheet.getByText("Per pubblicare collega il tuo profilo")).toBeVisible();
  await expect(sheet.getByText("Pubblicazione del gruppo")).toHaveCount(0);
  await expect(sheet.getByPlaceholder("Racconta questo momento…")).toHaveCount(0);
  releaseSession();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("india-session-token"))).toBe(null);
  expect(await page.evaluate(() => localStorage.getItem("india-profile-id"))).toBe(null);
  expect(await page.evaluate(() => localStorage.getItem("india-visitor-name"))).toBe(null);
  expect(await page.evaluate(() => localStorage.getItem("india-role"))).toBe(null);
});

test("logout e cambio persona non lasciano identità o privilegi del profilo precedente", async ({ page }) => {
  await page.goto(`/?invite=${encodeURIComponent(switchInviteToken)}`, { waitUntil: "networkidle" });
  await expect(page.locator(".accessPill")).toContainText(profileName.split(" ")[0]);
  const travelerProfileId = await page.evaluate(() => localStorage.getItem("india-profile-id"));
  await page.locator(".accessPill").click();
  await page.getByRole("button", { name: "Documenti e sicurezza" }).click();
  const logoutResponse = page.waitForResponse(
    (response) => response.url().endsWith("/api/auth/logout") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Blocca" }).click();
  expect((await logoutResponse).status()).toBe(200);
  await expect(page.getByText("Questo dispositivo non è ancora autorizzato")).toBeVisible();
  for (const key of [
    "india-session-token",
    "india-profile-id",
    "india-visitor-name",
    "india-role",
    "india-guest-token",
    "india-guest-name",
    "india-visitor-id",
  ]) {
    expect(await page.evaluate((storageKey) => localStorage.getItem(storageKey), key)).toBe(null);
  }

  await page.goto(`/?invite=${encodeURIComponent(coordinatorInviteToken)}`, { waitUntil: "networkidle" });
  await expect(page.locator(".accessPill")).toContainText(coordinatorName.split(" ")[0]);
  expect(await page.evaluate(() => localStorage.getItem("india-profile-id"))).not.toBe(travelerProfileId);
  expect(await page.evaluate(() => localStorage.getItem("india-visitor-name"))).toContain(coordinatorName.split(" ")[0]);
  expect(await page.evaluate(() => localStorage.getItem("india-role"))).toBe("coordinator");
  await page.locator(".accessPill").click();
  const coordinatorPanel = page.locator(".quickProfilePanel");
  await expect(coordinatorPanel).toContainText(coordinatorName);
  await expect(coordinatorPanel).not.toContainText(profileName);
  await expect(page.getByRole("button", { name: "Griglia coordinatore" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Documenti e sicurezza" })).toHaveCount(0);
});

test("una vecchia cache privata non appare durante il caricamento pubblico", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("india-people", JSON.stringify([{
      id: "profilo-cache",
      name: "Persona pubblica",
      age: "99",
      job: "Lavoro segreto",
      bio: "BIOGRAFIA PRIVATA NON VISIBILE",
      avatar_key: "private/avatar.jpg",
    }]));
    localStorage.setItem("india-posts", JSON.stringify([
      {
        id: "post-privato-cache",
        visibility: "private",
        text: "POST PRIVATO NON VISIBILE",
        can_manage: true,
        profile_id: "profilo-cache",
      },
      {
        id: "post-pubblico-cache",
        visibility: "public",
        text: "Ricordo pubblico dalla cache",
        can_manage: true,
        profile_id: "profilo-cache",
      },
    ]));
  });
  let releaseState;
  const stateReleased = new Promise((resolve) => {
    releaseState = resolve;
  });
  await page.route("**/api/state", async (route) => {
    await stateReleased;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Ricordo pubblico dalla cache")).toBeVisible();
  await expect(page.getByText("POST PRIVATO NON VISIBILE")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Elimina" })).toHaveCount(0);
  await page.locator(".tabs").getByRole("button", { name: "Gruppo" }).click();
  await expect(page.getByText("Persona pubblica", { exact: true })).toBeVisible();
  await expect(page.getByText("BIOGRAFIA PRIVATA NON VISIBILE")).toHaveCount(0);
  await expect(page.getByText("Lavoro segreto")).toHaveCount(0);
  await expect(page.getByText("99 anni")).toHaveCount(0);
  releaseState();
});

test("URL e API riservati non aprono dati privati senza sessione", async ({ page }) => {
  await page.goto("/?view=vault&profile=profilo-altrui", { waitUntil: "networkidle" });
  await expect(page.locator(".accessPill")).toContainText("Pubblico");
  await expect(page).not.toHaveURL(/view=vault/);
  await expect(page.getByRole("heading", { name: "Documenti e sicurezza" })).toHaveCount(0);
  await expect(page.getByText("Dispositivo sbloccato")).toHaveCount(0);
  await expect(page.getByText("Griglia coordinatore")).toHaveCount(0);

  const privateResponse = await page.request.get("/api/private");
  expect(privateResponse.status()).toBe(401);
  expect((await privateResponse.json()).error).toMatch(
    /Sessione non valida|Accesso personale richiesto/,
  );
  expect((await page.request.get("/api/auth/devices")).status()).toBe(401);
  expect((await page.request.delete("/api/locations/profilo-altrui")).status()).toBe(403);
  expect((await page.request.delete("/api/documents/profilo-altrui/passport")).status()).toBe(403);
  expect((await page.request.fetch("/api/profiles/profilo-altrui", {
    method: "PUT",
    multipart: { name: "Tentativo pubblico", role: "coordinator" },
  })).status()).toBe(403);
});
