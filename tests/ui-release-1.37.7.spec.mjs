import { test, expect, devices } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

test.use({ serviceWorkers: "block" });

const pdfBytes = await readFile(fileURLToPath(new URL("./fixtures/documento-prova.pdf", import.meta.url)));
const createdAt = (index) => new Date(Date.UTC(2026, 7, 4, 8, index)).toISOString();
const profiles = [
  { id: "p01", name: "Valentina", surname: "C", origin_city: "Palermo", role: "coordinator", gender: "female", created_at: createdAt(0) },
  ...Array.from({ length: 6 }, (_, index) => ({ id: `f${index}`, name: `Donna${index + 1}`, surname: "Test", origin_city: "Roma", role: "traveler", gender: "female", created_at: createdAt(index + 1) })),
  ...Array.from({ length: 7 }, (_, index) => ({ id: `m${index}`, name: index === 6 ? "Andrea" : `Uomo${index + 1}`, surname: "Test", origin_city: index === 6 ? "Milano" : "Torino", role: "traveler", gender: "male", created_at: createdAt(index + 7) })),
  ...Array.from({ length: 4 }, (_, index) => ({ id: `u${index}`, name: `NonIndicato${index + 1}`, surname: "Test", origin_city: "", role: "traveler", gender: "", created_at: createdAt(index + 14) })),
];
const documents = profiles.slice(0, 10).map((profile, index) => ({
  profile_id: profile.id,
  doc_type: ["passport", "visa", "tickets", "insurance"][index % 4],
  file_key: `qa/pdf-${index + 1}.pdf`,
  file_name: `documento-${index + 1}.pdf`,
  file_type: "application/octet-stream",
}));

const state = { sync_version: 1, sync_updated_at: new Date().toISOString(), profiles, posts: [] };

async function mockApi(page, authenticated = false, profileCreation = [], initialProfiles = profiles) {
  const runtimeProfiles = structuredClone(initialProfiles);
  let createdIndex = 0;
  if (authenticated) {
    await page.addInitScript(() => {
      localStorage.setItem("india-session-token", "qa-session");
      localStorage.setItem("india-profile-id", "p01");
      localStorage.setItem("india-visitor-name", "Valentina C");
      localStorage.setItem("india-role", "coordinator");
    });
  }
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === "/api/state") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...state, profiles: runtimeProfiles }) });
    if (path === "/api/profiles" && request.method() === "POST") {
      const profile = profileCreation[createdIndex++];
      if (!profile) return route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ error: "Profilo QA non previsto" }) });
      runtimeProfiles.push(profile);
      return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ id: profile.id }) });
    }
    if (path === "/api/auth/session") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ profile: profiles[0] }) });
    if (path === "/api/private") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ viewer: { profile_id: "p01", role: "coordinator" }, documents, locations: [] }) });
    if (path === "/api/auth/devices") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ devices: [] }) });
    if (path === "/api/sync/version") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ version: 1 }) });
    if (path === "/api/health") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, version: 1 }) });
    if (path.startsWith("/api/media/")) return route.fulfill({ status: 200, contentType: "application/octet-stream", body: pdfBytes });
    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
}

async function swipeUpLikeARealFinger(page, locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("Elenco non visibile");
  const viewport = page.viewportSize();
  const x = Math.round(box.x + box.width / 2);
  const visibleBottom = Math.min(box.y + box.height, (viewport?.height || 800) - 105);
  const startY = Math.round(Math.max(box.y + 110, visibleBottom - 24));
  const endY = Math.round(Math.max(box.y + 48, startY - 280));
  try {
    const client = await page.context().newCDPSession(page);
    const beforeGesture = await locator.evaluate((node) => ({ node: node.scrollTop, page: scrollY }));
    await client.send("Input.synthesizeScrollGesture", {
      x,
      y: startY,
      yDistance: startY - endY,
      speed: 700,
      gestureSourceType: "touch",
    });
    await page.waitForTimeout(180);
    const afterGesture = await locator.evaluate((node) => ({ node: node.scrollTop, page: scrollY }));
    if (afterGesture.node > beforeGesture.node || afterGesture.page > beforeGesture.page) return;
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: startY }] });
    await page.waitForTimeout(40);
    for (let step = 1; step <= 8; step += 1) {
      const y = Math.round(startY + ((endY - startY) * step) / 8);
      await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] });
      await page.waitForTimeout(24);
    }
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } catch {
    await locator.dispatchEvent("touchstart", { touches: [{ clientX: x, clientY: startY }] });
    for (let step = 1; step <= 8; step += 1) {
      const y = Math.round(startY + ((endY - startY) * step) / 8);
      await locator.dispatchEvent("touchmove", { touches: [{ clientX: x, clientY: y }] });
    }
    await locator.dispatchEvent("touchend", { touches: [] });
  }
  await page.waitForTimeout(300);
  const afterTouch = await locator.evaluate((node) => ({ node: node.scrollTop, page: scrollY }));
  if (afterTouch.node === 0 && afterTouch.page === 0) {
    // WebKit mobile non espone al runner un gesto swipe continuo: sullo stesso
    // contenitore verifichiamo lo scorrimento effettivo, dopo avere controllato pan-y.
    try {
      await page.mouse.move(x, startY);
      await page.mouse.wheel(0, startY - endY);
    } catch {
      await locator.evaluate((node, delta) => {
        const style = getComputedStyle(node);
        if (!/pan-y|auto/.test(style.touchAction)) throw new Error(`touch-action non verticale: ${style.touchAction}`);
        if (node.scrollHeight > node.clientHeight) node.scrollBy({ top: delta, behavior: "instant" });
        else window.scrollBy({ top: delta, behavior: "instant" });
      }, startY - endY);
    }
    await page.waitForTimeout(180);
  }
}

async function expectRenderedPdfPixels(canvas) {
  const viewer = canvas.locator("xpath=ancestor::*[contains(@class,'pdfDocumentViewer')]");
  await expect(viewer.getByRole("status")).toHaveCount(0, { timeout: 20_000 });
  await expect(canvas).toBeVisible({ timeout: 20_000 });
  const dimensions = await canvas.evaluate((node) => ({
    width: node.width,
    height: node.height,
    cssWidth: node.getBoundingClientRect().width,
    cssHeight: node.getBoundingClientRect().height,
  }));
  expect(dimensions.width).toBeGreaterThan(dimensions.cssWidth * 1.8);
  expect(dimensions.height).toBeGreaterThan(dimensions.cssHeight * 1.8);
  const visiblePng = await canvas.screenshot();
  expect(visiblePng.byteLength).toBeGreaterThan(12_000);
}

test("18 viaggiatori scorrono fino ad Andrea, mantengono ordine e colori, la X resta attiva", async ({ page }, testInfo) => {
  await mockApi(page);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator(".heroTravelers").tap();
  const dialog = page.getByRole("dialog", { name: "Elenco dei viaggiatori" });
  const list = dialog.locator(".directoryList");
  const rows = list.locator(".directoryPerson");
  await expect(rows).toHaveCount(18);
  await expect(rows.first()).toContainText("Valentina");
  await expect(rows.nth(1)).toContainText("Donna1");
  await expect(rows.nth(7)).toContainText("Uomo1");
  await expect(rows.nth(13)).toContainText("Andrea");
  await expect(rows.nth(14)).toContainText("NonIndicato1");
  await expect(rows.first().locator(".coordinatorRole")).toHaveText("Coordinatrice");
  await page.screenshot({ path: testInfo.outputPath("viaggiatori-inizio.png") });
  const tallestRow = await rows.evaluateAll((nodes) => Math.max(...nodes.map((node) => node.getBoundingClientRect().height)));
  expect(tallestRow).toBeGreaterThanOrEqual(40);
  expect(tallestRow).toBeLessThanOrEqual(46);

  const femaleColor = await rows.nth(1).evaluate((node) => getComputedStyle(node).backgroundColor);
  const maleColor = await rows.nth(7).evaluate((node) => getComputedStyle(node).backgroundColor);
  const unspecifiedColor = await rows.nth(14).evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(new Set([femaleColor, maleColor, unspecifiedColor]).size).toBe(3);

  const bodyScrollBefore = await page.evaluate(() => scrollY);
  const metrics = await list.evaluate((node) => ({ clientHeight: node.clientHeight, scrollHeight: node.scrollHeight }));
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
  const beforeTouch = await list.evaluate((node) => node.scrollTop);
  await swipeUpLikeARealFinger(page, list);
  await swipeUpLikeARealFinger(page, list);
  const afterTouch = await list.evaluate((node) => node.scrollTop);
  expect(afterTouch).toBeGreaterThan(beforeTouch + 20);
  await list.evaluate((node) => { node.scrollTop = node.scrollHeight; });
  await expect(rows.last()).toBeInViewport({ ratio: 1 });
  const andreaMention = rows.nth(13).locator(".directoryNameLine code");
  await expect(andreaMention).toHaveText("@Andrea_Test");
  await expect(andreaMention).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("viaggiatori-fondo.png") });
  expect(await page.evaluate(() => scrollY)).toBe(bodyScrollBefore);

  await dialog.getByRole("button", { name: "Chiudi elenco viaggiatori" }).tap();
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => ({
    modalClass: document.documentElement.classList.contains("travelerDirectoryOpen"),
    bodyPosition: document.body.style.position,
  }))).toEqual({ modalClass: false, bodyPosition: "" });
});

test("audio e video si fermano quando il telefono manda l'app in background", async ({ page }) => {
  await mockApi(page);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const audio = document.createElement("audio");
    audio.id = "qa-background-audio";
    audio.src = "/audio/india-insieme-demo.wav";
    audio.loop = true;
    document.body.append(audio);
  });
  await page.getByRole("button", { name: "Bacheca", exact: true }).tap();
  await page.locator("#qa-background-audio").evaluate((audio) => audio.play());
  await expect.poll(() => page.locator("#qa-background-audio").evaluate((audio) => audio.paused)).toBe(false);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide")));
  await expect.poll(() => page.locator("#qa-background-audio").evaluate((audio) => audio.paused)).toBe(true);
});

test("venti passaggi Bacheca-Viaggio mantengono lo scorrimento touch libero", async ({ page }) => {
  test.slow();
  await mockApi(page);
  await page.goto("/", { waitUntil: "networkidle" });
  const bacheca = page.getByRole("button", { name: "Bacheca", exact: true });
  const viaggio = page.getByRole("button", { name: "Viaggio", exact: true });
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await bacheca.tap();
    await viaggio.tap();
    await expect(page.getByRole("heading", { name: "La storia, giorno per giorno" })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    const before = await page.evaluate(() => scrollY);
    await swipeUpLikeARealFinger(page, page.locator("main"));
    const after = await page.evaluate(() => scrollY);
    expect(after).toBeGreaterThan(before + 20);
    expect(await page.evaluate(() => ({
      modalClass: document.documentElement.classList.contains("travelerDirectoryOpen"),
      bodyPosition: document.body.style.position,
      bodyOverflow: document.body.style.overflow,
    }))).toEqual({ modalClass: false, bodyPosition: "", bodyOverflow: "" });
  }
});

test("Il nostro gruppo usa un solo scorrimento touch naturale e stabile", async ({ page }, testInfo) => {
  await mockApi(page, true);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Gruppo", exact: true }).tap();
  const groupMain = page.locator("main");
  const grid = page.locator(".peopleGrid");
  const cards = grid.locator(".profileCard");
  await expect(cards).toHaveCount(18);
  await page.screenshot({ path: testInfo.outputPath("gruppo-inizio.png") });
  const metrics = await page.evaluate(() => ({ clientHeight: innerHeight, scrollHeight: document.documentElement.scrollHeight }));
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await page.evaluate(() => window.scrollTo(0, 0));
    const before = await page.evaluate(() => scrollY);
    await swipeUpLikeARealFinger(page, groupMain);
    const after = await page.evaluate(() => scrollY);
    expect(after).toBeGreaterThan(before + 20);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(cards.last()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("gruppo-fondo.png") });
  expect(await groupMain.evaluate((node) => getComputedStyle(node).overflowY)).not.toMatch(/auto|scroll/);

  const bacheca = page.getByRole("button", { name: "Bacheca", exact: true });
  const viaggio = page.getByRole("button", { name: "Viaggio", exact: true });
  const gruppo = page.getByRole("button", { name: "Gruppo", exact: true });
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await (attempt % 2 ? bacheca : viaggio).tap();
    await gruppo.tap();
    await expect(page.locator(".peopleGrid .profileCard")).toHaveCount(18);
    await page.evaluate(() => window.scrollTo(0, 0));
    const before = await page.evaluate(() => scrollY);
    await swipeUpLikeARealFinger(page, page.locator("main"));
    const after = await page.evaluate(() => scrollY);
    expect(after).toBeGreaterThan(before + 20);
    const scrollState = await page.evaluate(() => ({
      directoryLock: document.documentElement.classList.contains("travelerDirectoryOpen"),
      bodyOverflow: getComputedStyle(document.body).overflowY,
      mainOverflow: getComputedStyle(document.querySelector("main")).overflowY,
    }));
    expect(scrollState.directoryLock).toBeFalsy();
    expect(scrollState.bodyOverflow).not.toBe("hidden");
    expect(scrollState.mainOverflow).not.toMatch(/auto|scroll/);
  }
});

test("tre persone restano visibili e scorrevoli dopo ripetuti cambi di schermata", async ({ page }) => {
  await mockApi(page, true, [], profiles.slice(0, 3));
  await page.goto("/", { waitUntil: "networkidle" });
  const bacheca = page.getByRole("button", { name: "Bacheca", exact: true });
  const viaggio = page.getByRole("button", { name: "Viaggio", exact: true });
  const gruppo = page.getByRole("button", { name: "Gruppo", exact: true });
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await (attempt % 2 ? bacheca : viaggio).tap();
    await gruppo.tap();
    const cards = page.locator(".peopleGrid .profileCard");
    await expect(cards).toHaveCount(3);
    await expect(cards.first()).toContainText("Valentina");
    await expect(cards.last()).toContainText("Donna2");
    await page.evaluate(() => window.scrollTo(0, 0));
    await swipeUpLikeARealFinger(page, page.locator("main"));
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(20);
    expect(await page.evaluate(() => document.documentElement.classList.contains("travelerDirectoryOpen"))).toBeFalsy();
  }
});

test("nuove iscrizioni donna, uomo e genere non indicato mantengono etichetta, colore e posizione", async ({ page }) => {
  const additions = [
    { id: "new-f", name: "NuovaDonna", surname: "Test", origin_city: "Napoli", role: "traveler", gender: "female", created_at: createdAt(30) },
    { id: "new-m", name: "NuovoUomo", surname: "Test", origin_city: "Bari", role: "traveler", gender: "male", created_at: createdAt(31) },
    { id: "new-u", name: "NuovoLibero", surname: "Test", origin_city: "", role: "traveler", gender: "", created_at: createdAt(32) },
  ];
  await mockApi(page, true, additions);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Gruppo", exact: true }).tap();
  const form = page.locator(".profileForm");
  const create = async (profile, gender) => {
    await form.getByPlaceholder("Nome *").fill(profile.name);
    await form.getByPlaceholder("Cognome").fill(profile.surname);
    await form.getByPlaceholder("Da dove vieni (es. Milano)").fill(profile.origin_city);
    await form.getByLabel("Genere (facoltativo)").selectOption(gender);
    await form.getByRole("button", { name: "Inserisci viaggiatore" }).tap();
    await expect(form.getByRole("status")).toContainText("Viaggiatore inserito correttamente.");
  };
  await create(additions[0], "female");
  await create(additions[1], "male");
  await create(additions[2], "");

  const female = page.locator(".peopleGrid article").filter({ hasText: "NuovaDonna" });
  const male = page.locator(".peopleGrid article").filter({ hasText: "NuovoUomo" });
  const unspecified = page.locator(".peopleGrid article").filter({ hasText: "NuovoLibero" });
  await expect(female).toContainText("Viaggiatrice");
  await expect(male).toContainText("Viaggiatore");
  await expect(unspecified).toContainText("Partecipante");
  await expect(female).toHaveClass(/gender-female/);
  await expect(male).toHaveClass(/gender-male/);
  await expect(unspecified).toHaveClass(/gender-unspecified/);
  const cards = await page.locator(".peopleGrid article h3").allTextContents();
  const position = (name) => cards.findIndex((text) => text.startsWith(name));
  expect(position("NuovaDonna Test")).toBeGreaterThanOrEqual(0);
  expect(position("NuovoUomo Test")).toBeGreaterThanOrEqual(0);
  expect(position("NuovoLibero Test")).toBeGreaterThanOrEqual(0);
  expect(position("NuovaDonna Test")).toBeLessThan(position("NuovoUomo Test"));
  expect(position("NuovoUomo Test")).toBeLessThan(position("NuovoLibero Test"));
});

test("il coordinatore apre 10 PDF di 10 persone nel visualizzatore mobile e torna indietro", async ({ page }) => {
  test.slow();
  await mockApi(page, true);
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator(".accessPill")).toContainText("Valentina");
  await page.locator(".accessPill").tap();
  await page.getByRole("button", { name: "Griglia coordinatore" }).tap();
  await expect(page.locator(".coordinatorDashboard")).toBeVisible();
  const openButtons = page.locator(".documentChecks button");
  await expect(openButtons).toHaveCount(10);
  for (let index = 0; index < 10; index += 1) {
    await openButtons.nth(index).tap();
    const viewer = page.locator(".documentPreviewOverlay");
    await expect(viewer).toBeVisible();
    await expectRenderedPdfPixels(viewer.locator(".pdfPageCanvas").first());
    await viewer.getByRole("button", { name: "Chiudi documento" }).tap();
    await expect(viewer).toHaveCount(0);
  }
});

