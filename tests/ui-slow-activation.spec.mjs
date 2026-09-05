import { test, expect, devices } from "@playwright/test";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const coordinatorToken = process.env.QA_COORDINATOR_TOKEN;
const coordinatorDeviceKey = process.env.QA_COORDINATOR_DEVICE_KEY;
const targetProfileId = process.env.QA_UNCLAIMED_PROFILE_ID;

test.skip(
  !baseUrl || !coordinatorToken || !coordinatorDeviceKey || !targetProfileId || !isSafeMutationTarget(baseUrl),
  "URL e identità QA richiesti",
);

test.use({ serviceWorkers: "block" });

test("l’invito collega automaticamente il telefono anche con rete lenta", async ({ browser }) => {
  test.setTimeout(90_000);
  const inviteResponse = await fetch(`${baseUrl}/api/auth/invites`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${coordinatorToken}`,
      "content-type": "application/json",
      "x-device-key": coordinatorDeviceKey,
    },
    body: JSON.stringify({ profile_id: targetProfileId }),
  });
  expect(inviteResponse.status).toBe(201);
  const invitation = await inviteResponse.json();
  expect(invitation.invite_token).toBeTruthy();

  const context = await browser.newContext({
    ...devices["Galaxy S9+"],
    viewport: { width: 360, height: 800 },
    serviceWorkers: "block",
  });
  try {
    const page = await context.newPage();
    await page.route("**/api/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      await route.continue();
    });
    await page.goto(`${baseUrl}/#invite=${encodeURIComponent(invitation.invite_token)}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page.locator(".accessPill")).toContainText("Invitato", { timeout: 45_000 });
    await expect.poll(() => page.evaluate(() => ({
      token: localStorage.getItem("india-session-token"),
      profile: localStorage.getItem("india-profile-id"),
      role: localStorage.getItem("india-role"),
      pendingInvite: sessionStorage.getItem("india-pending-invite"),
      claiming: sessionStorage.getItem("india-auth-claiming"),
      hash: location.hash,
    })), { timeout: 45_000 }).toEqual(expect.objectContaining({
      token: expect.any(String),
      profile: targetProfileId,
      role: "traveler",
      pendingInvite: null,
      claiming: null,
      hash: "",
    }));
    await page.locator(".accessPill").tap();
    await expect(page.getByRole("button", { name: "Griglia coordinatore" })).toHaveCount(0);
  } finally {
    await context.close();
  }
});
