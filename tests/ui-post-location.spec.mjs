import { test, expect, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const profileName = process.env.QA_UI_PROFILE_NAME;
const inviteToken = process.env.QA_UI_INVITE_TOKEN;
const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const photoPath = fileURLToPath(new URL("../public/cities/agra.jpg", import.meta.url));

test.skip(!profileName || !inviteToken || !isSafeMutationTarget(baseUrl), "Profilo QA, invito e URL locale/QA richiesti");

test("foto con GPS, rimozione prima dell'invio e apertura Google Maps", async ({ browser }) => {
  test.slow();
  const context = await browser.newContext({
    ...devices["Galaxy S9+"],
    viewport: { width: 412, height: 915 },
    geolocation: { latitude: 28.6139, longitude: 77.2090, accuracy: 3500 },
    permissions: ["geolocation"],
  });
  const page = await context.newPage();
  const createdIds = [];
  try {
    await page.goto(`${baseUrl}/#invite=${encodeURIComponent(inviteToken)}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".accessPill")).toContainText(profileName.split(" ")[0], { timeout: 20_000 });

    const publish = async ({ marker, keepLocation }) => {
      await page.getByRole("button", { name: "Pubblica", exact: true }).tap();
      const sheet = page.locator(".uploadSheet");
      await sheet.getByPlaceholder("Racconta questo momento…").fill(marker);
      await sheet.locator('input[accept^="image"]').first().setInputFiles(photoPath);
      await expect(sheet.getByText("1 allegati pronti")).toBeVisible();
      await sheet.getByRole("button", { name: "Usa posizione" }).tap();
      await expect(sheet.getByText(/Posizione pronta:/)).toBeVisible();
      if (!keepLocation) {
        await sheet.getByRole("button", { name: "Rimuovi", exact: true }).tap();
        await expect(sheet.getByText("Posizione rimossa.")).toBeVisible();
      }
      const responsePromise = page.waitForResponse(
        (response) => response.url().endsWith("/api/posts") && response.request().method() === "POST",
      );
      await sheet.locator(".composerActions > button").tap();
      const response = await responsePromise;
      expect(response.status()).toBe(201);
      const post = await response.json();
      createdIds.push(post.id);
      return page.locator(".post").filter({ hasText: marker });
    };

    const withoutLocation = await publish({ marker: `GPS rimosso ${Date.now()}`, keepLocation: false });
    await expect(withoutLocation).toBeVisible();
    await expect(withoutLocation.locator(".postPlace")).toHaveCount(0);

    const withLocation = await publish({ marker: `GPS foto ${Date.now()}`, keepLocation: true });
    await expect(withLocation).toBeVisible();
    await expect(withLocation.locator("img").first()).toBeVisible();
    const placeLink = withLocation.locator("a.postPlace");
    await expect(placeLink).toHaveAttribute("href", /google\.com\/maps\?q=28\.6139,77\.209/);
  } finally {
    if (createdIds.length) {
      await page.evaluate(async (ids) => {
        const token = localStorage.getItem("india-session-token");
        const deviceKey = localStorage.getItem("india-device-key");
        await Promise.all(ids.map((id) => fetch(`/api/posts/${id}`, {
          method: "DELETE",
          headers: { authorization: `Bearer ${token}`, "x-device-key": deviceKey || "" },
        })));
      }, createdIds).catch(() => {});
    }
    await context.close();
  }
});
