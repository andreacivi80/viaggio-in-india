import { test, expect, devices } from "@playwright/test";

test.use({ serviceWorkers: "block" });
const baseUrl = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const deviceA = { token: process.env.QA_SESSION_TOKEN, key: process.env.QA_OWNER_DEVICE_KEY };
const deviceB = { token: process.env.QA_SECOND_DEVICE_TOKEN, key: process.env.QA_SECOND_DEVICE_KEY };
test.skip(!baseUrl || !deviceA.token || !deviceA.key || !deviceB.token || !deviceB.key,
  "Due dispositivi QA dello stesso profilo richiesti");

const seed = (context, device) => context.addInitScript(({ token, key }) => {
  localStorage.setItem("india-session-token", token);
  localStorage.setItem("india-device-key", key);
}, device);

test("il telefono revocato riceve un avviso visibile e perde i comandi privati", async ({ browser }) => {
  test.setTimeout(45_000);
  const contextA = await browser.newContext({ ...devices["Galaxy S9+"], viewport: { width: 412, height: 915 }, serviceWorkers: "block" });
  const contextB = await browser.newContext({ ...devices["Galaxy S9+"], viewport: { width: 360, height: 740 }, serviceWorkers: "block" });
  await seed(contextA, deviceA);
  await seed(contextB, deviceB);
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  try {
    await Promise.all([
      pageA.goto(baseUrl, { waitUntil: "domcontentloaded" }),
      pageB.goto(baseUrl, { waitUntil: "domcontentloaded" }),
    ]);
    await expect(pageA.locator(".accessPill")).not.toContainText("Pubblico");
    await expect(pageB.locator(".accessPill")).not.toContainText("Pubblico");
    const deviceIdA = await pageA.evaluate(async () => {
      const response = await fetch("/api/auth/devices", {
        headers: {
          authorization: `Bearer ${localStorage.getItem("india-session-token")}`,
          "x-device-key": localStorage.getItem("india-device-key"),
        },
      });
      const { devices } = await response.json();
      return devices.find((device) => device.current)?.device_id || "";
    });
    expect(deviceIdA).toBeTruthy();
    const revoked = await pageB.evaluate(async (deviceId) => {
      const response = await fetch(`/api/auth/devices/${encodeURIComponent(deviceId)}`, {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${localStorage.getItem("india-session-token")}`,
          "x-device-key": localStorage.getItem("india-device-key"),
        },
      });
      return response.status;
    }, deviceIdA);
    expect(revoked).toBe(200);

    const alert = pageA.getByRole("alert");
    await expect(alert).toContainText("questo dispositivo è stato revocato oppure la sessione è scaduta", { timeout: 12_000 });
    await expect(pageA.locator(".accessPill")).toContainText("Pubblico");
    expect(await pageA.evaluate(() => localStorage.getItem("india-session-token"))).toBe(null);
    await alert.getByRole("button", { name: "Chiudi avviso accesso" }).tap();
    await expect(alert).toHaveCount(0);
    await pageA.getByRole("button", { name: "Gruppo", exact: true }).tap();
    await expect(pageA.getByText("Accesso privato", { exact: true })).toBeVisible();
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
