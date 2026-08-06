import { test, expect, devices } from "@playwright/test";

const inviteToken = process.env.QA_UI_INVITE_TOKEN;
const switchInviteToken = process.env.QA_UI_SWITCH_INVITE_TOKEN;
const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");

test.skip(!inviteToken || !switchInviteToken || !baseUrl, "Inviti QA e URL richiesti");

const phones = [
  ["iPhone SE", devices["iPhone SE"]],
  ["iPhone 13", devices["iPhone 13"]],
  ["Samsung Galaxy S9+", devices["Galaxy S9+"]],
];

const expectUsableTouchTarget = async (locator) => {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
};

test("intestazione e navigazione sono leggibili e toccabili sui telefoni principali", async ({ browser }) => {
  test.slow();
  for (const [name, device] of phones) {
    const context = await browser.newContext({ ...device });
    const page = await context.newPage();
    await test.step(name, async () => {
      await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".versionBadge")).toBeVisible();
      await expectUsableTouchTarget(page.locator(".accessPill"));
      await expectUsableTouchTarget(page.locator(".headerIcon"));
      const appWidth = await page.locator(".app").evaluate((element) => element.scrollWidth);
      const viewportWidth = page.viewportSize().width;
      expect(appWidth).toBeLessThanOrEqual(viewportWidth);
      const tabs = page.locator(".tabs button");
      await expect(tabs).toHaveCount(5);
      for (let index = 0; index < 5; index += 1)
        await expectUsableTouchTarget(tabs.nth(index));
    });
    await context.close();
  }
});

test("pubblicazione e commenti restano usabili senza zoom involontario su iPhone e Samsung", async ({ browser }) => {
  test.slow();
  const authenticatedPhones = [
    [...phones[0], inviteToken],
    [...phones[2], switchInviteToken],
  ];
  for (const [name, device, deviceInviteToken] of authenticatedPhones) {
    const context = await browser.newContext({ ...device });
    const page = await context.newPage();
    await test.step(name, async () => {
      await page.goto(`${baseUrl}/#invite=${encodeURIComponent(deviceInviteToken)}`, {
        waitUntil: "networkidle",
      });
      await page.getByRole("button", { name: "Pubblica" }).tap();
      const sheet = page.locator(".uploadSheet");
      await expect(sheet.getByText("Pubblicazione del gruppo")).toBeVisible();
      const composerText = sheet.getByPlaceholder("Racconta questo momento…");
      const marker = `Controllo responsive ${name} ${Date.now()}`;
      await composerText.fill(marker);
      expect(Number.parseFloat(await composerText.evaluate((element) => getComputedStyle(element).fontSize)))
        .toBeGreaterThanOrEqual(16);
      const responsePromise = page.waitForResponse(
        (response) => response.url().endsWith("/api/posts") && response.request().method() === "POST",
      );
      await sheet.locator(".composerActions > button").tap();
      expect((await responsePromise).status()).toBe(201);
      const post = page.locator(".post").filter({ hasText: marker });
      await expect(post).toBeVisible();
      await post.scrollIntoViewIfNeeded();
      const reply = post.getByPlaceholder("Scrivi un commento…");
      await reply.fill("Un commento abbastanza lungo da occupare più righe e verificare l’allineamento dei comandi.");
      expect(Number.parseFloat(await reply.evaluate((element) => getComputedStyle(element).fontSize)))
        .toBeGreaterThanOrEqual(16);
      await expectUsableTouchTarget(post.locator(".reply label"));
      await expectUsableTouchTarget(post.getByRole("button", { name: "Invia commento" }));
      const replyBox = await reply.boundingBox();
      const attachBox = await post.locator(".reply label").boundingBox();
      const sendBox = await post.getByRole("button", { name: "Invia commento" }).boundingBox();
      const replyMiddle = replyBox.y + replyBox.height / 2;
      expect(Math.abs(attachBox.y + attachBox.height / 2 - replyMiddle)).toBeLessThanOrEqual(2);
      expect(Math.abs(sendBox.y + sendBox.height / 2 - replyMiddle)).toBeLessThanOrEqual(2);
    });
    await context.close();
  }
});
