import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "block" });
const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4186";

test("dieci viaggiatori nello stesso punto restano leggibili sulla mappa mobile", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("india-session-token", "qa-session");
    localStorage.setItem("india-profile-id", "p01");
    localStorage.setItem("india-visitor-name", "Viaggiatore 1");
    localStorage.setItem("india-role", "traveler");
    localStorage.setItem("india-device-key", "a".repeat(64));
  });
  const profiles = Array.from({ length: 10 }, (_, index) => ({
    id: `p${String(index + 1).padStart(2, "0")}`, name: `Viaggiatore ${index + 1}`, surname: "QA",
    role: "traveler", created_at: new Date(Date.UTC(2026, 8, 7, 10, index)).toISOString(),
  }));
  const locations = profiles.map((profile, index) => ({
    profile_id: profile.id, display_name: `${profile.name} ${profile.surname}`,
    latitude: 13.756331, longitude: 100.501762, accuracy: 12,
    updated_at: new Date(Date.UTC(2026, 8, 7, 11, index)).toISOString(),
  }));
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    const json = path === "/api/state" ? { sync_version: 1, profiles, posts: [] }
      : path === "/api/auth/session" ? { profile: profiles[0] }
      : path === "/api/private" ? { viewer: { profile_id: "p01", role: "traveler" }, documents: [], locations }
      : path === "/api/sync/version" ? { version: 1 }
      : path === "/api/auth/devices" ? { devices: [] } : {};
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(json) });
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await expect(page.locator("button.accessPill")).toContainText("Viaggiatore");
  await page.locator("button.accessPill").tap();
  await page.getByRole("button", { name: "Documenti e sicurezza" }).tap();
  await page.getByRole("button", { name: /Apri mappa posizioni/ }).tap();
  await expect(page.locator(".locationList article")).toHaveCount(10);
  const groupMarker = page.locator(".personMapMarkerGroup");
  await expect(groupMarker).toHaveCount(1, { timeout: 20_000 });
  await expect(groupMarker).toHaveText("10");
  await expect(groupMarker).toHaveAttribute("aria-label", "10 viaggiatori in questa posizione");
  await groupMarker.tap();
  const popup = page.locator(".personMapPopup");
  await expect(popup).toBeVisible();
  await expect(popup.locator("strong")).toHaveCount(10);
  await expect(popup).toContainText("Viaggiatore 1 QA");
  await expect(popup).toContainText("Viaggiatore 10 QA");
  await context.close();
});
