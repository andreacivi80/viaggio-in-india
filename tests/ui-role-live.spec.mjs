import { test, expect, devices } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const travelerName = process.env.QA_UI_PROFILE_NAME;
const coordinatorName = process.env.QA_UI_COORDINATOR_NAME;
const travelerInvite = process.env.QA_UI_INVITE_TOKEN;
const secondTravelerInvite = process.env.QA_UI_SWITCH_INVITE_TOKEN;
const coordinatorInvite = process.env.QA_UI_COORDINATOR_INVITE_TOKEN;
const expiredSessionToken = process.env.QA_UI_EXPIRED_SESSION_TOKEN;
const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");

test.skip(
  !travelerName || !coordinatorName || !travelerInvite || !secondTravelerInvite || !coordinatorInvite || !baseUrl,
  "Profili QA, due inviti Viaggiatore e invito Coordinatore richiesti",
);

const changeRole = (page, profileId, role) => page.evaluate(async ({ id, nextRole, name }) => {
  const form = new FormData();
  form.set("name", name);
  form.set("surname", "");
  form.set("age", "");
  form.set("job", "");
  form.set("origin_city", "");
  form.set("bio", "");
  form.set("role", nextRole);
  const response = await fetch(`/api/profiles/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${localStorage.getItem("india-session-token")}`,
      "x-device-key": localStorage.getItem("india-device-key"),
    },
    body: form,
  });
  return response.status;
}, { id: profileId, nextRole: role, name: travelerName });

test("promozione, retrocessione e revoca aggiornano subito un telefono già aperto", async ({ browser }) => {
  test.slow();
  const travelerContext = await browser.newContext({ ...devices["Galaxy S9+"], serviceWorkers: "block" });
  const secondContext = await browser.newContext({ ...devices["Galaxy S9+"], serviceWorkers: "block" });
  const coordinatorContext = await browser.newContext({ ...devices["Galaxy S9+"], serviceWorkers: "block" });
  const travelerPage = await travelerContext.newPage();
  const secondPage = await secondContext.newPage();
  const coordinatorPage = await coordinatorContext.newPage();
  try {
    await travelerPage.goto(`${baseUrl}/#invite=${encodeURIComponent(travelerInvite)}`, { waitUntil: "domcontentloaded" });
    await secondPage.goto(`${baseUrl}/#invite=${encodeURIComponent(secondTravelerInvite)}`, { waitUntil: "domcontentloaded" });
    await coordinatorPage.goto(`${baseUrl}/#invite=${encodeURIComponent(coordinatorInvite)}`, { waitUntil: "domcontentloaded" });
    await expect(travelerPage.locator(".accessPill")).toContainText(travelerName.split(" ")[0]);
    await expect(secondPage.locator(".accessPill")).toContainText(travelerName.split(" ")[0]);
    await expect(coordinatorPage.locator(".accessPill")).toContainText(coordinatorName.split(" ")[0]);
    const profileId = await travelerPage.evaluate(() => localStorage.getItem("india-profile-id"));
    expect(profileId).toBeTruthy();

    expect(await changeRole(coordinatorPage, profileId, "coordinator")).toBe(200);
    await expect.poll(
      () => travelerPage.evaluate(() => localStorage.getItem("india-role")),
      { timeout: 12_000 },
    ).toBe("coordinator");
    await travelerPage.locator(".accessPill").tap();
    await expect(travelerPage.getByRole("button", { name: "Griglia coordinatore" })).toBeVisible();
    await expect(travelerPage.getByRole("button", { name: "Documenti e sicurezza" })).toHaveCount(0);
    await travelerPage.locator(".accessPill").tap();

    expect(await changeRole(coordinatorPage, profileId, "traveler")).toBe(200);
    const staleCoordinatorStatus = await travelerPage.evaluate(async (targetProfileId) => {
      const response = await fetch("/api/auth/invites", {
        method: "POST",
        headers: {
          authorization: `Bearer ${localStorage.getItem("india-session-token")}`,
          "x-device-key": localStorage.getItem("india-device-key"),
          "content-type": "application/json",
        },
        body: JSON.stringify({ profile_id: targetProfileId }),
      });
      return response.status;
    }, profileId);
    expect(staleCoordinatorStatus).toBe(403);
    await expect.poll(
      () => travelerPage.evaluate(() => localStorage.getItem("india-role")),
      { timeout: 12_000 },
    ).toBe("traveler");
    await travelerPage.locator(".accessPill").tap();
    await expect(travelerPage.getByRole("button", { name: "Documenti e sicurezza" })).toBeVisible();
    await expect(travelerPage.getByRole("button", { name: "Griglia coordinatore" })).toHaveCount(0);
    await travelerPage.getByRole("button", { name: "Documenti e sicurezza" }).tap();
    await expect(travelerPage.getByText("Dispositivo sbloccato")).toBeVisible();
    const soonRevokedToken = await travelerPage.evaluate(() => localStorage.getItem("india-session-token"));
    const travelerDeviceId = await travelerPage.evaluate(async () => {
      const response = await fetch("/api/auth/devices", {
        headers: {
          authorization: `Bearer ${localStorage.getItem("india-session-token")}`,
          "x-device-key": localStorage.getItem("india-device-key"),
        },
      });
      const { devices } = await response.json();
      return devices.find((device) => device.current)?.device_id || "";
    });
    expect(travelerDeviceId).toBeTruthy();
    await travelerPage.evaluate(() => {
      history.pushState({ authorizedPreview: true }, "", "?view=map&day=1");
      localStorage.setItem("india-profile-id", localStorage.getItem("india-profile-id") || "profilo-obsoleto");
      localStorage.setItem("india-role", "coordinator");
      localStorage.setItem("india-visitor-name", "Profilo locale obsoleto");
    });

    const revokeStatus = await secondPage.evaluate(async (targetDeviceId) => {
      const authorization = `Bearer ${localStorage.getItem("india-session-token")}`;
      const deviceKey = localStorage.getItem("india-device-key");
      const response = await fetch(`/api/auth/devices/${encodeURIComponent(targetDeviceId)}`, {
        method: "DELETE",
        headers: { authorization, "x-device-key": deviceKey },
      });
      return response.status;
    }, travelerDeviceId);
    expect(revokeStatus).toBe(200);
    const revokedSessionStatus = await travelerPage.evaluate(async () => {
      const response = await fetch("/api/auth/session", {
        headers: {
          authorization: `Bearer ${localStorage.getItem("india-session-token")}`,
          "x-device-key": localStorage.getItem("india-device-key"),
        },
      });
      return response.status;
    });
    expect(revokedSessionStatus).toBe(401);
    const revokedCommandStatus = await travelerPage.evaluate(async ({ id, token }) => {
      const response = await fetch(`/api/locations/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${token}`,
          "x-device-key": localStorage.getItem("india-device-key"),
        },
      });
      return response.status;
    }, { id: profileId, token: soonRevokedToken });
    expect(revokedCommandStatus).toBe(403);
    await expect.poll(
      () => travelerPage.evaluate(() => localStorage.getItem("india-session-token")),
      { timeout: 12_000 },
    ).toBe(null);
    await expect.poll(
      () => travelerPage.evaluate(() => ({
        profileId: localStorage.getItem("india-profile-id"),
        role: localStorage.getItem("india-role"),
        visitorName: localStorage.getItem("india-visitor-name"),
      })),
      { timeout: 12_000 },
    ).toEqual({ profileId: null, role: null, visitorName: null });
    await expect(travelerPage.getByText("Questo dispositivo non è ancora autorizzato")).toBeVisible();
    await expect(travelerPage.getByText("Dispositivo sbloccato")).toHaveCount(0);

    await travelerPage.goBack({ waitUntil: "domcontentloaded" });
    await expect.poll(() => travelerPage.evaluate(() => localStorage.getItem("india-session-token"))).toBe(null);
    await travelerPage.getByRole("button", { name: "Gruppo", exact: true }).tap();
    await expect(travelerPage.getByText("Accesso privato", { exact: true })).toBeVisible();
    await expect(travelerPage.getByRole("button", { name: "Documenti e sicurezza", exact: true })).toHaveCount(0);
    await expect(travelerPage.getByRole("button", { name: "Griglia coordinatore", exact: true })).toHaveCount(0);
  } finally {
    await Promise.all([travelerContext.close(), secondContext.close(), coordinatorContext.close()]);
  }
});

test("una sessione realmente scaduta non recupera profilo o privilegi dalla memoria del telefono", async ({ browser }) => {
  test.skip(!expiredSessionToken || !baseUrl, "Sessione locale realmente scaduta richiesta");
  const context = await browser.newContext({ ...devices["Galaxy S9+"], serviceWorkers: "block" });
  const page = await context.newPage();
  try {
    await page.addInitScript((token) => {
      localStorage.setItem("india-session-token", token);
      localStorage.setItem("india-profile-id", "profilo-locale-obsoleto");
      localStorage.setItem("india-role", "coordinator");
      localStorage.setItem("india-visitor-name", "Nome locale obsoleto");
    }, expiredSessionToken);
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await expect.poll(
      () => page.evaluate(() => ({
        token: localStorage.getItem("india-session-token"),
        profileId: localStorage.getItem("india-profile-id"),
        role: localStorage.getItem("india-role"),
        visitorName: localStorage.getItem("india-visitor-name"),
      })),
      { timeout: 12_000 },
    ).toEqual({ token: null, profileId: null, role: null, visitorName: null });
    await expect(page.locator(".accessPill")).toContainText("Pubblico");
    await page.getByRole("button", { name: "Gruppo", exact: true }).tap();
    await expect(page.getByText("Accesso privato", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Documenti e sicurezza", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Griglia coordinatore", exact: true })).toHaveCount(0);
  } finally {
    await context.close();
  }
});
