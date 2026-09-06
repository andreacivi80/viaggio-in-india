import { test, expect, devices } from "@playwright/test";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const travelerName = process.env.QA_UI_PROFILE_NAME;
const travelerInvite = process.env.QA_UI_INVITE_TOKEN;
const coordinatorName = process.env.QA_UI_COORDINATOR_NAME;
const coordinatorInvite = process.env.QA_UI_COORDINATOR_INVITE_TOKEN;

test.skip(
  !baseUrl || !isSafeMutationTarget(baseUrl) || !travelerName || !travelerInvite || !coordinatorName || !coordinatorInvite,
  "Due inviti personali e URL QA richiesti",
);

test.use({ ...devices["Galaxy S9+"], viewport: { width: 412, height: 915 }, serviceWorkers: "block" });

test("lo stesso telefono cambia profilo soltanto dopo il blocco volontario", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto(`${baseUrl}/#invite=${encodeURIComponent(travelerInvite)}`, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".accessPill")).toContainText(travelerName.split(" ")[0]);
  const travelerState = await page.evaluate(() => ({
    token: localStorage.getItem("india-session-token"),
    profileId: localStorage.getItem("india-profile-id"),
    role: localStorage.getItem("india-role"),
    hash: location.hash,
  }));
  expect(travelerState.token).toBeTruthy();
  expect(travelerState.profileId).toBeTruthy();
  expect(travelerState.role).toBe("traveler");
  expect(travelerState.hash).toBe("");

  await page.locator(".accessPill").tap();
  await page.getByRole("button", { name: "Documenti e sicurezza" }).tap();
  await expect(page.getByRole("heading", { name: "Documenti e sicurezza" })).toBeVisible();
  const logoutResponse = page.waitForResponse((response) =>
    new URL(response.url()).pathname === "/api/auth/logout" && response.request().method() === "POST");
  await page.getByRole("button", { name: "Blocca" }).tap();
  expect((await logoutResponse).status()).toBe(200);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("india-session-token"))).toBeNull();

  const oldSessionStatus = await page.evaluate(async ({ token }) => {
    const response = await fetch("/api/auth/session", { headers: { authorization: `Bearer ${token}` } });
    return response.status;
  }, travelerState);
  expect([401, 403]).toContain(oldSessionStatus);

  const claimResponse = page.waitForResponse((response) =>
    new URL(response.url()).pathname === "/api/auth/claim" && response.request().method() === "POST");
  await page.goto(`${baseUrl}/#invite=${encodeURIComponent(coordinatorInvite)}`, { waitUntil: "domcontentloaded" });
  expect((await claimResponse).status()).toBe(200);
  await expect(page.locator(".accessPill")).toContainText(coordinatorName.split(" ")[0]);
  const coordinatorState = await page.evaluate(() => ({
    token: localStorage.getItem("india-session-token"),
    profileId: localStorage.getItem("india-profile-id"),
    role: localStorage.getItem("india-role"),
    hash: location.hash,
    search: location.search,
  }));
  expect(coordinatorState.token).toBeTruthy();
  expect(coordinatorState.token).not.toBe(travelerState.token);
  expect(coordinatorState.profileId).not.toBe(travelerState.profileId);
  expect(coordinatorState.role).toBe("coordinator");
  expect(coordinatorState.hash).toBe("");
  expect(coordinatorState.search).not.toContain("invite=");

  await page.locator(".accessPill").tap();
  await expect(page.getByRole("button", { name: "Griglia coordinatore" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Documenti e sicurezza" })).toHaveCount(0);
});
