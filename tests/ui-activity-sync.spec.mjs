import { test, expect, devices } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const baseUrl = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const deviceA = { token: process.env.QA_SESSION_TOKEN, key: process.env.QA_OWNER_DEVICE_KEY };
const deviceB = { token: process.env.QA_SECOND_DEVICE_TOKEN, key: process.env.QA_SECOND_DEVICE_KEY };
test.skip(!baseUrl || !deviceA.token || !deviceA.key || !deviceB.token || !deviceB.key,
  "Due dispositivi QA dello stesso profilo richiesti");

const seedSession = (context, device) => context.addInitScript(({ token, key }) => {
  localStorage.setItem("india-session-token", token);
  localStorage.setItem("india-device-key", key);
  localStorage.removeItem("india-activity-read");
}, device);

test("il gesto touch che legge le notifiche aggiorna il badge sul secondo telefono", async ({ browser }) => {
  test.setTimeout(45_000);
  const contextA = await browser.newContext({ ...devices["Galaxy S9+"], viewport: { width: 412, height: 915 }, serviceWorkers: "block" });
  const contextB = await browser.newContext({ ...devices["Galaxy S9+"], viewport: { width: 360, height: 740 }, serviceWorkers: "block" });
  await seedSession(contextA, deviceA);
  await seedSession(contextB, deviceB);
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  try {
    await Promise.all([
      pageA.goto(baseUrl, { waitUntil: "domcontentloaded" }),
      pageB.goto(baseUrl, { waitUntil: "domcontentloaded" }),
    ]);
    await expect(pageA.locator(".accessPill")).not.toContainText("Pubblico");
    await expect(pageB.locator(".accessPill")).not.toContainText("Pubblico");
    await expect(pageA.locator(".notificationBadge")).toBeVisible();
    await expect(pageB.locator(".notificationBadge")).toBeVisible();

    await pageA.getByRole("button", { name: "Attività recenti" }).tap();
    await expect(pageA.locator(".notificationPanel")).toBeVisible();
    await expect(pageA.locator(".notificationBadge")).toHaveCount(0);
    await expect(pageB.locator(".notificationBadge")).toHaveCount(0, { timeout: 12_000 });

    const synchronized = await pageB.evaluate(async () => {
      const response = await fetch("/api/state", {
        cache: "no-store",
        headers: {
          authorization: `Bearer ${localStorage.getItem("india-session-token")}`,
          "x-device-key": localStorage.getItem("india-device-key"),
        },
      });
      return (await response.json()).activity_state?.last_read_at || "";
    });
    expect(synchronized).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
