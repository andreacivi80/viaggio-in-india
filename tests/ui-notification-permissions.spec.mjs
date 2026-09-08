import { expect, test, devices } from "@playwright/test";

test.use({ ...devices["Galaxy S9+"], serviceWorkers: "block" });

const profile = {
  id: "profilo-notifiche-locale",
  name: "Viaggiatore",
  surname: "Notifiche",
  role: "traveler",
  origin_city: "Milano",
};

async function preparePhone(page, permission) {
  await page.addInitScript(({ permissionValue, currentProfile }) => {
    localStorage.clear();
    localStorage.setItem("india-session-token", "token-notifiche-locale");
    localStorage.setItem("india-profile-id", currentProfile.id);
    localStorage.setItem("india-profile-name", currentProfile.name);
    localStorage.setItem("india-role", currentProfile.role);
    localStorage.setItem("india-device-key", "a".repeat(64));
    window.__notificationPermissionRequests = 0;
    window.__pushSubscriptionRequests = 0;
    const subscription = {
      endpoint: "https://push.example.test/subscription-local",
      toJSON: () => ({
        endpoint: "https://push.example.test/subscription-local",
        keys: { p256dh: "chiave-p256dh", auth: "chiave-auth" },
      }),
      unsubscribe: async () => true,
    };
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: {
        get permission() { return permissionValue; },
        requestPermission: async () => {
          window.__notificationPermissionRequests += 1;
          return permissionValue;
        },
      },
    });
    Object.defineProperty(window, "PushManager", { configurable: true, value: function PushManager() {} });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        ready: Promise.resolve({
          pushManager: {
            getSubscription: async () => permissionValue === "granted" ? subscription : null,
            subscribe: async () => {
              window.__pushSubscriptionRequests += 1;
              return subscription;
            },
          },
        }),
      },
    });
  }, { permissionValue: permission, currentProfile: profile });

  await page.route("**/api/auth/session", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ profile }),
  }));
  await page.route("**/api/state*", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ sync_version: 1, profiles: [profile], posts: [] }),
  }));
  await page.route("**/api/weather", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ forecasts: [] }),
  }));
  await page.route("**/api/push/config", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ public_key: "BA" }),
  }));
}

test("il consenso notifiche registra una sola sottoscrizione e mostra lo stato attivo", async ({ page }) => {
  await preparePhone(page, "granted");
  let subscriptions = 0;
  await page.route("**/api/push/subscribe", async (route) => {
    subscriptions += 1;
    expect(route.request().method()).toBe("POST");
    const headers = route.request().headers();
    expect(headers.authorization).toBe("Bearer token-notifiche-locale");
    expect(headers["x-device-key"]).toBe("a".repeat(64));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator(".accessPill").tap();
  const panel = page.locator(".quickProfilePanel");
  await panel.getByRole("button", { name: "Attiva notifiche" }).tap();

  await expect(panel.getByRole("button", { name: "Disattiva notifiche" })).toBeVisible();
  await expect(panel.locator(".quickStatus")).toContainText("Notifiche sul telefono attive.");
  expect(subscriptions).toBe(1);
  expect(await page.evaluate(() => window.__notificationPermissionRequests)).toBe(1);
  expect(await page.evaluate(() => window.__pushSubscriptionRequests)).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem("india-push-enabled"))).toBe("true");
});

test("il diniego notifiche non crea sottoscrizioni e resta riprovabile", async ({ page }) => {
  await preparePhone(page, "denied");
  let subscriptions = 0;
  await page.route("**/api/push/subscribe", async (route) => {
    subscriptions += 1;
    await route.fulfill({ status: 500 });
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator(".accessPill").tap();
  const panel = page.locator(".quickProfilePanel");
  const activate = panel.getByRole("button", { name: "Attiva notifiche" });
  await activate.tap();

  await expect(panel.locator(".quickStatus")).toContainText("Notifiche non autorizzate.");
  await expect(activate).toBeVisible();
  expect(subscriptions).toBe(0);
  expect(await page.evaluate(() => window.__notificationPermissionRequests)).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem("india-push-enabled"))).toBeNull();
});
