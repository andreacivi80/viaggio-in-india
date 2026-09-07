import { test, expect, devices } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const sessionToken = process.env.QA_UI_SESSION_TOKEN;
const profileId = process.env.QA_UI_PROFILE_ID;
const profileName = process.env.QA_UI_PROFILE_NAME;
const deviceKey = process.env.QA_UI_DEVICE_KEY;

test.skip(
  !baseUrl || !sessionToken || !profileId || !profileName || !deviceKey,
  "Sessione Viaggiatore QA richiesta",
);

test("la vista Viaggiatore deriva dal server e non può diventare Coordinatore sul telefono", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["Galaxy S9+"], serviceWorkers: "block" });
  const page = await context.newPage();
  try {
    await page.addInitScript(({ token, id, name, key }) => {
      localStorage.setItem("india-session-token", token);
      localStorage.setItem("india-profile-id", id);
      localStorage.setItem("india-profile-name", name);
      localStorage.setItem("india-visitor-name", name);
      localStorage.setItem("india-device-key", key);
      // Simula un telefono manipolato o rimasto su una vecchia vista Coordinatore.
      localStorage.setItem("india-role", "coordinator");
    }, { token: sessionToken, id: profileId, name: profileName, key: deviceKey });

    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await expect.poll(() => page.evaluate(() => localStorage.getItem("india-role"))).toBe("traveler");
    await expect.poll(() => page.evaluate(() => localStorage.getItem("india-profile-id"))).toBe(profileId);
    await expect(page.locator(".accessPill")).toContainText(profileName.split(" ")[0]);

    const serverIdentity = await page.evaluate(async () => {
      const response = await fetch("/api/auth/session", {
        headers: {
          authorization: `Bearer ${localStorage.getItem("india-session-token")}`,
          "x-device-key": localStorage.getItem("india-device-key"),
        },
      });
      return { status: response.status, body: await response.json() };
    });
    expect(serverIdentity.status).toBe(200);
    expect(serverIdentity.body.profile.id).toBe(profileId);
    expect(serverIdentity.body.profile.role).toBe("traveler");

    await page.locator(".accessPill").tap();
    await expect(page.getByRole("button", { name: "Documenti e sicurezza" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Griglia coordinatore" })).toHaveCount(0);

    await page.getByRole("button", { name: "Gruppo", exact: true }).tap();
    await expect(page.getByText("Accesso privato", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Scarica dati", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Griglia coordinatore" })).toHaveCount(0);

    const forbiddenCoordinatorAction = await page.evaluate(async (id) => {
      const response = await fetch("/api/auth/invites", {
        method: "POST",
        headers: {
          authorization: `Bearer ${localStorage.getItem("india-session-token")}`,
          "x-device-key": localStorage.getItem("india-device-key"),
          "content-type": "application/json",
        },
        body: JSON.stringify({ profile_id: id }),
      });
      return response.status;
    }, profileId);
    expect(forbiddenCoordinatorAction).toBe(403);
  } finally {
    await context.close();
  }
});
