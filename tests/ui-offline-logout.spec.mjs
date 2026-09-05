import { test, expect } from "@playwright/test";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

test.use({ serviceWorkers: "block" });

const baseUrl = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const inviteToken = process.env.QA_UI_INVITE_TOKEN;
const profileName = process.env.QA_UI_PROFILE_NAME;

test.skip(!inviteToken || !profileName || !isSafeMutationTarget(baseUrl), "Profilo e URL QA richiesti");

test("il viaggiatore blocca il dispositivo anche senza rete e resta pubblico al riavvio", async ({ context, page }) => {
  await page.goto(`${baseUrl}/#invite=${encodeURIComponent(inviteToken)}`, { waitUntil: "networkidle" });
  await expect.poll(() => page.evaluate(() => localStorage.getItem("india-session-token"))).toBeTruthy();

  await page.locator(".accessPill").tap();
  await page.getByRole("button", { name: "Documenti e sicurezza" }).tap();
  await expect(page.getByRole("heading", { name: "Documenti e sicurezza" })).toBeVisible();

  await context.setOffline(true);
  await page.getByRole("button", { name: "Blocca", exact: true }).tap();
  await expect.poll(() => page.evaluate(() => ({
    token: localStorage.getItem("india-session-token"),
    profile: localStorage.getItem("india-profile-id"),
    role: localStorage.getItem("india-role"),
    group: localStorage.getItem("india-group-code"),
  }))).toEqual({ token: null, profile: null, role: null, group: null });
  await expect(page.getByText("Accesso personale richiesto")).toBeVisible();

  await context.setOffline(false);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".accessPill")).toContainText("Pubblico");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("india-session-token"))).toBeNull();
});
