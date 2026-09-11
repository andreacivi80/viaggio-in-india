import { expect, test, devices } from "@playwright/test";

test.use({ ...devices["Galaxy S9+"], serviceWorkers: "block" });

test("cancellare i dati del browser riporta al Pubblico senza modificare il server", async ({ page, context }) => {
  const profile = { id: "profilo-clear-locale", name: "Prova", surname: "Locale", role: "coordinator" };
  const mutations = [];
  await page.addInitScript(({ currentProfile }) => {
    if (window.name === "browser-data-seeded") return;
    window.name = "browser-data-seeded";
    localStorage.setItem("india-session-token", "token-clear-locale");
    localStorage.setItem("india-profile-id", currentProfile.id);
    localStorage.setItem("india-profile-name", currentProfile.name);
    localStorage.setItem("india-role", currentProfile.role);
    localStorage.setItem("india-device-key", "b".repeat(64));
  }, { currentProfile: profile });
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) mutations.push(`${request.method()} ${request.url()}`);
    const url = new URL(request.url());
    if (url.pathname.endsWith("/api/auth/session"))
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ profile }) });
    if (url.pathname.endsWith("/api/state"))
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ sync_version: 1, profiles: [profile], posts: [] }) });
    if (url.pathname.endsWith("/api/weather"))
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ forecasts: [] }) });
    return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "non previsto" }) });
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".accessPill")).toContainText("Prova");
  await page.locator(".accessPill").tap();
  await expect(page.getByRole("button", { name: "Griglia coordinatore" })).toBeVisible();

  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
    if ("caches" in window)
      await Promise.all((await caches.keys()).map((name) => caches.delete(name)));
    if (indexedDB.databases)
      await Promise.all((await indexedDB.databases()).map(({ name }) => name && new Promise((resolve) => {
        const deletion = indexedDB.deleteDatabase(name);
        deletion.onsuccess = deletion.onerror = deletion.onblocked = () => resolve();
      })));
  });
  await context.clearCookies();
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.locator(".accessPill")).toContainText("Pubblico");
  await page.getByRole("button", { name: "Gruppo", exact: true }).tap();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Documenti e sicurezza", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => ({
    token: localStorage.getItem("india-session-token"),
    profile: localStorage.getItem("india-profile-id"),
    role: localStorage.getItem("india-role"),
    visitor: localStorage.getItem("india-visitor-name"),
  }))).toEqual({ token: null, profile: null, role: null, visitor: null });
  expect(mutations).toEqual([]);
});
