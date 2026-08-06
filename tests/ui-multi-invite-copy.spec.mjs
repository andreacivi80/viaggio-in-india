import { test, expect, devices } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const coordinatorName = process.env.QA_UI_COORDINATOR_NAME;
const coordinatorInvite = process.env.QA_UI_COORDINATOR_INVITE_TOKEN;
const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const targets = ["Proprietario", "Secondo", "Invitato"];

function isSafeMutationTarget(value) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "127.0.0.1" || host === "localhost" || host === "viaggio-in-india-2026-qa.pages.dev";
  } catch {
    return false;
  }
}

test.skip(
  !coordinatorName || !coordinatorInvite || !isSafeMutationTarget(baseUrl),
  "Coordinatore e URL locale/QA isolato richiesti",
);

const phone = { ...devices["Galaxy S9+"], viewport: { width: 412, height: 915 } };

async function tapCenter(page, locator) {
  await expect(locator).toBeVisible();
  await locator.evaluate((element) => element.scrollIntoView({ block: "center", inline: "center" }));
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

test("il coordinatore copia un invito personale distinto per ogni viaggiatore", async ({ browser }) => {
  test.slow();
  const coordinatorContext = await browser.newContext({ ...phone, serviceWorkers: "block" });
  await coordinatorContext.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseUrl });
  const copiedLinks = [];
  let coordinatorProfileId = "";
  try {
    const page = await coordinatorContext.newPage();
    await page.goto(`${baseUrl}/#invite=${encodeURIComponent(coordinatorInvite)}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".accessPill")).toContainText(coordinatorName.split(" ")[0]);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("india-profile-id"))).not.toBeNull();
    coordinatorProfileId = await page.evaluate(() => localStorage.getItem("india-profile-id"));

    await page.getByRole("button", { name: "Gruppo", exact: true }).tap();
    for (const target of targets) {
      const card = page.locator(".peopleGrid article").filter({ has: page.getByRole("heading", { name: new RegExp(`^${target}\\b`) }) });
      await expect(card).toHaveCount(1);
      const createResponse = page.waitForResponse(
        (response) => response.url().endsWith("/api/auth/invites") && response.request().method() === "POST",
      );
      await tapCenter(page, card.getByRole("button", { name: "Crea invito personale" }));
      expect((await createResponse).status()).toBe(201);
      await expect(page.getByRole("status").filter({ hasText: `Invito pronto per ${target}` })).toBeVisible();

      const copyButton = card.getByRole("button", { name: "Copia link" });
      await tapCenter(page, copyButton);
      await expect(page.getByRole("status").filter({ hasText: `Link di ${target} copiato` })).toBeVisible();
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      const parsed = new URL(copied);
      expect(parsed.origin).toBe(new URL(baseUrl).origin);
      expect(parsed.search).toBe("");
      expect(parsed.hash).toMatch(/^#invite=[a-z0-9]+$/i);
      copiedLinks.push({ target, url: copied });
      expect(await page.evaluate(() => localStorage.getItem("india-profile-id"))).toBe(coordinatorProfileId);
    }
    expect(new Set(copiedLinks.map(({ url }) => url)).size).toBe(targets.length);
  } finally {
    await coordinatorContext.close();
  }

  const claimedProfileIds = [];
  for (const { target, url } of copiedLinks) {
    const recipientContext = await browser.newContext({ ...phone, serviceWorkers: "block" });
    try {
      const page = await recipientContext.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".accessPill")).toContainText(target);
      await expect.poll(() => page.evaluate(() => localStorage.getItem("india-session-token"))).not.toBeNull();
      const state = await page.evaluate(() => ({
        profileId: localStorage.getItem("india-profile-id"),
        role: localStorage.getItem("india-role"),
        hash: location.hash,
        search: location.search,
      }));
      expect(state.profileId).toBeTruthy();
      expect(state.role).toBe("traveler");
      expect(state.hash).toBe("");
      expect(state.search).not.toContain("invite=");
      expect(state.profileId).not.toBe(coordinatorProfileId);
      claimedProfileIds.push(state.profileId);
    } finally {
      await recipientContext.close();
    }

    const reuseContext = await browser.newContext({ ...phone, serviceWorkers: "block" });
    try {
      const page = await reuseContext.newPage();
      const rejectedClaim = page.waitForResponse(
        (response) => response.url().endsWith("/api/auth/claim") && response.request().method() === "POST",
      );
      await page.goto(url, { waitUntil: "domcontentloaded" });
      expect([403, 409]).toContain((await rejectedClaim).status());
      await expect(page.locator(".accessPill")).toContainText("Pubblico");
      expect(await page.evaluate(() => localStorage.getItem("india-session-token"))).toBeNull();
    } finally {
      await reuseContext.close();
    }
  }
  expect(new Set(claimedProfileIds).size).toBe(targets.length);
});
