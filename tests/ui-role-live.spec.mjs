import { test, expect, devices } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const travelerName = process.env.QA_UI_PROFILE_NAME;
const travelerInvite = process.env.QA_UI_INVITE_TOKEN;
const secondTravelerInvite = process.env.QA_UI_SWITCH_INVITE_TOKEN;
const coordinatorInvite = process.env.QA_UI_COORDINATOR_INVITE_TOKEN;
const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");

test.skip(
  !travelerName || !travelerInvite || !secondTravelerInvite || !coordinatorInvite || !baseUrl,
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
    headers: { authorization: `Bearer ${localStorage.getItem("india-session-token")}` },
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
    await travelerPage.goto(`${baseUrl}/?invite=${encodeURIComponent(travelerInvite)}`, { waitUntil: "networkidle" });
    await secondPage.goto(`${baseUrl}/?invite=${encodeURIComponent(secondTravelerInvite)}`, { waitUntil: "networkidle" });
    await coordinatorPage.goto(`${baseUrl}/?invite=${encodeURIComponent(coordinatorInvite)}`, { waitUntil: "networkidle" });
    const profileId = await travelerPage.evaluate(() => localStorage.getItem("india-profile-id"));
    expect(profileId).toBeTruthy();

    expect(await changeRole(coordinatorPage, profileId, "coordinator")).toBe(200);
    await expect.poll(
      () => travelerPage.evaluate(() => localStorage.getItem("india-role")),
      { timeout: 12_000 },
    ).toBe("coordinator");
    await travelerPage.locator(".accessPill").click();
    await expect(travelerPage.getByRole("button", { name: "Griglia coordinatore" })).toBeVisible();
    await expect(travelerPage.getByRole("button", { name: "Documenti e sicurezza" })).toHaveCount(0);
    await travelerPage.locator(".accessPill").click();

    expect(await changeRole(coordinatorPage, profileId, "traveler")).toBe(200);
    const staleCoordinatorStatus = await travelerPage.evaluate(async (targetProfileId) => {
      const response = await fetch("/api/auth/invites", {
        method: "POST",
        headers: {
          authorization: `Bearer ${localStorage.getItem("india-session-token")}`,
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
    await travelerPage.locator(".accessPill").click();
    await expect(travelerPage.getByRole("button", { name: "Documenti e sicurezza" })).toBeVisible();
    await expect(travelerPage.getByRole("button", { name: "Griglia coordinatore" })).toHaveCount(0);
    await travelerPage.getByRole("button", { name: "Documenti e sicurezza" }).click();
    await expect(travelerPage.getByText("Dispositivo sbloccato")).toBeVisible();
    const soonRevokedToken = await travelerPage.evaluate(() => localStorage.getItem("india-session-token"));

    const revokeStatus = await secondPage.evaluate(async () => {
      const authorization = `Bearer ${localStorage.getItem("india-session-token")}`;
      const devicesResponse = await fetch("/api/auth/devices", { headers: { authorization } });
      const { devices } = await devicesResponse.json();
      const target = devices.find((device) => !device.current);
      if (!target) return 404;
      const response = await fetch(`/api/auth/devices/${encodeURIComponent(target.device_id)}`, {
        method: "DELETE",
        headers: { authorization },
      });
      return response.status;
    });
    expect(revokeStatus).toBe(200);
    const revokedCommandStatus = await travelerPage.evaluate(async ({ id, token }) => {
      const response = await fetch(`/api/locations/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      });
      return response.status;
    }, { id: profileId, token: soonRevokedToken });
    expect(revokedCommandStatus).toBe(403);
    await expect.poll(
      () => travelerPage.evaluate(() => localStorage.getItem("india-session-token")),
      { timeout: 12_000 },
    ).toBe(null);
    await expect(travelerPage.getByText("Questo dispositivo non è ancora autorizzato")).toBeVisible();
    await expect(travelerPage.getByText("Dispositivo sbloccato")).toHaveCount(0);
  } finally {
    await Promise.all([travelerContext.close(), secondContext.close(), coordinatorContext.close()]);
  }
});
