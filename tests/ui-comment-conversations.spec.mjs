import { test, expect, devices } from "@playwright/test";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const runId = process.env.QA_RUN_ID || "";
const members = {
  owner: {
    token: process.env.QA_SESSION_TOKEN,
    id: process.env.QA_PROFILE_ID,
    key: process.env.QA_OWNER_DEVICE_KEY,
    name: "Proprietario QA",
  },
  other: {
    token: process.env.QA_SECOND_SESSION_TOKEN,
    id: process.env.QA_SECOND_PROFILE_ID,
    key: process.env.QA_OTHER_DEVICE_KEY,
    name: "Secondo QA",
  },
};

test.skip(
  !baseUrl || !runId || !isSafeMutationTarget(baseUrl) || Object.values(members).some(({ token, id, key }) => !token || !id || !key),
  "Due identità personali e URL QA richiesti",
);

async function phoneContext(browser, member) {
  const context = await browser.newContext({
    ...devices["Galaxy S9+"],
    viewport: { width: 412, height: 915 },
    serviceWorkers: "block",
  });
  await context.addInitScript(({ token, id, key, name }) => {
    localStorage.setItem("india-session-token", token);
    localStorage.setItem("india-profile-id", id);
    localStorage.setItem("india-profile-name", name);
    localStorage.setItem("india-visitor-name", name);
    localStorage.setItem("india-role", "traveler");
    localStorage.setItem("india-device-key", key);
  }, member);
  return context;
}

test("due telefoni rispondono e reagiscono ai commenti con tocchi reali", async ({ browser }) => {
  test.setTimeout(210_000);
  const ownerContext = await phoneContext(browser, members.owner);
  const otherContext = await phoneContext(browser, members.other);
  const ownerPage = await ownerContext.newPage();
  const otherPage = await otherContext.newPage();
  let rootId = "";
  try {
    await Promise.all([
      ownerPage.goto(baseUrl, { waitUntil: "domcontentloaded" }),
      otherPage.goto(baseUrl, { waitUntil: "domcontentloaded" }),
    ]);
    console.log("TOUCH_COMMENT_PAGES=READY");
    await Promise.all([
      expect(ownerPage.locator(".accessPill")).not.toContainText("Pubblico", { timeout: 20_000 }),
      expect(otherPage.locator(".accessPill")).not.toContainText("Pubblico", { timeout: 20_000 }),
    ]);
    console.log("TOUCH_COMMENT_SESSIONS=VERIFIED");
    const referenceText = `Pubblicazione di riferimento QA ${runId}`;
    const ownerPost = ownerPage.locator(".post").filter({ hasText: referenceText });
    const otherPost = otherPage.locator(".post").filter({ hasText: referenceText });
    await expect(ownerPost).toBeVisible();
    await expect(otherPost).toBeVisible();
    console.log("TOUCH_COMMENT_REFERENCE_POST=VISIBLE");

    const rootText = `Commento touch ${Date.now()}`;
    await ownerPost.getByPlaceholder("Scrivi un commento…").fill(rootText);
    console.log("TOUCH_COMMENT_INPUT=FILLED");
    await ownerPost.getByRole("button", { name: "Invia commento" }).tap();
    console.log("TOUCH_COMMENT_SEND=TAPPED");
    const rootComment = ownerPost.locator("[data-comment-id]").filter({ hasText: rootText });
    await expect(rootComment).toBeVisible({ timeout: 20_000 });
    rootId = await rootComment.getAttribute("data-comment-id");
    expect(rootId).toBeTruthy();
    console.log("TOUCH_COMMENT_ROOT=OK");

    await otherPage.reload({ waitUntil: "domcontentloaded" });
    const refreshedOtherPost = otherPage.locator(".post").filter({ hasText: referenceText });
    const otherRoot = refreshedOtherPost.locator(`[data-comment-id="${rootId}"]`);
    await expect(otherRoot).toContainText(rootText);
    await otherRoot.getByRole("button", { name: "Rispondi" }).tap();
    await expect(refreshedOtherPost.locator(".replyTarget")).toContainText(members.owner.name);

    const replyText = `Risposta touch ${Date.now()}`;
    await refreshedOtherPost.getByPlaceholder("Scrivi un commento…").fill(replyText);
    await refreshedOtherPost.getByRole("button", { name: "Invia commento" }).tap();
    const createdReply = refreshedOtherPost.locator("[data-comment-id]").filter({ hasText: replyText });
    await expect(createdReply).toBeVisible({ timeout: 20_000 });
    const replyId = await createdReply.getAttribute("data-comment-id");
    expect(replyId).toBeTruthy();
    await expect(createdReply).toHaveClass(/commentReply/);
    console.log("TOUCH_COMMENT_REPLY=OK");

    await ownerPage.reload({ waitUntil: "domcontentloaded" });
    const refreshedOwnerPost = ownerPage.locator(".post").filter({ hasText: referenceText });
    const ownerReply = refreshedOwnerPost.locator(`[data-comment-id="${replyId}"]`);
    await expect(ownerReply).toContainText(replyText);
    await ownerReply.getByRole("button", { name: `Cuore al commento di ${members.other.name}` }).tap();
    await expect(ownerReply.getByRole("button", { name: `Cuore al commento di ${members.other.name}` })).toHaveAttribute("aria-pressed", "true");
    console.log("TOUCH_COMMENT_REACTION=OK");

    await otherPage.reload({ waitUntil: "domcontentloaded" });
    const syncedReply = otherPage.locator(".post").filter({ hasText: referenceText }).locator(`[data-comment-id="${replyId}"]`);
    await expect(syncedReply.locator(".commentReactions")).toContainText("1");
    console.log("TOUCH_COMMENT_SYNC=OK");

    const refreshedRoot = refreshedOwnerPost.locator(`[data-comment-id="${rootId}"]`);
    await refreshedRoot.getByRole("button", { name: "Elimina" }).tap();
    await ownerPage.locator(".confirmCard").filter({ hasText: "Eliminare questo commento?" })
      .getByRole("button", { name: "Elimina" }).tap();
    await expect(refreshedOwnerPost.getByText(replyText)).toHaveCount(0, { timeout: 20_000 });
    rootId = "";
    console.log("TOUCH_COMMENT_DELETE_CASCADE=OK");
  } finally {
    if (rootId)
      await ownerPage.evaluate(async (commentId) => fetch(`/api/comments/${encodeURIComponent(commentId)}`, {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${localStorage.getItem("india-session-token")}`,
          "x-device-key": localStorage.getItem("india-device-key"),
        },
      }), rootId).catch(() => {});
  }
});
