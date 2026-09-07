import { expect, test } from "@playwright/test";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const postId = process.env.QA_REFERENCE_POST_ID;
const token = process.env.QA_SESSION_TOKEN;
const deviceKey = process.env.QA_OWNER_DEVICE_KEY;
const profileId = process.env.QA_PROFILE_ID;

test("notifica reale apre post e commento precisi e gestisce il contenuto eliminato", async ({ page }) => {
  expect(base).toMatch(/viaggio-in-india-2026-qa\.pages\.dev$/);
  expect(postId).toBeTruthy();
  const headers = {
    authorization: `Bearer ${token}`,
    "x-device-key": deviceKey,
  };
  const commentForm = new FormData();
  commentForm.set("post_id", postId);
  commentForm.set("text", "Commento notifica QA reale");
  const commentResponse = await fetch(`${base}/api/comments`, {
    method: "POST",
    headers: { ...headers, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
    body: commentForm,
  });
  expect(commentResponse.status).toBe(201);
  const comment = await commentResponse.json();

  await page.addInitScript(({ savedToken, savedDeviceKey, savedProfileId }) => {
    localStorage.setItem("india-session-token", savedToken);
    localStorage.setItem("india-device-key", savedDeviceKey);
    localStorage.setItem("india-profile-id", savedProfileId);
    localStorage.setItem("india-visitor-name", "Proprietario QA");
  }, { savedToken: token, savedDeviceKey: deviceKey, savedProfileId: profileId });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Attività recenti" }).tap();

  await page.locator(".notificationItem").filter({ hasText: "Nuovo ricordo" }).first().locator(".notificationOpenItem").tap();
  await expect(page).toHaveURL(new RegExp(`post=${postId}`));
  await expect(page.locator(`[data-scroll-anchor="post-${postId}"]`)).toBeVisible();
  await page.goBack();
  await expect(page.locator(".notificationPanel")).toBeVisible();

  await page.locator(".notificationItem").filter({ hasText: "Commento notifica QA reale" }).locator(".notificationOpenItem").tap();
  await expect(page).toHaveURL(new RegExp(`post=${postId}.*comment=${comment.id}`));
  await expect(page.locator(`[data-comment-id="${comment.id}"]`)).toBeVisible();

  const deleteStatus = await page.evaluate(async ({ apiBase, targetPostId }) => {
    const activeToken = localStorage.getItem("india-session-token");
    const activeDeviceKey = localStorage.getItem("india-device-key");
    const response = await fetch(`${apiBase}/api/posts/${targetPostId}`, {
      method: "DELETE",
      headers: {
        authorization: `Bearer ${activeToken}`,
        "x-device-key": activeDeviceKey,
      },
    });
    return response.status;
  }, { apiBase: base, targetPostId: postId });
  expect(deleteStatus).toBe(200);
  await page.goto(`${base}/?post=${encodeURIComponent(postId)}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await expect(page.getByRole("alert")).toContainText("Contenuto non più disponibile.");
});
