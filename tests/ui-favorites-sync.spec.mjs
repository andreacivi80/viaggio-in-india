import { test, expect, devices } from "@playwright/test";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const first = {
  token: process.env.QA_COORDINATOR_TOKEN,
  id: process.env.QA_COORDINATOR_PROFILE_ID,
  key: process.env.QA_COORDINATOR_DEVICE_KEY,
};
const second = {
  token: process.env.QA_COORDINATOR_SECOND_TOKEN,
  id: process.env.QA_COORDINATOR_PROFILE_ID,
  key: process.env.QA_COORDINATOR_SECOND_DEVICE_KEY,
};

test.skip(
  !baseUrl || !isSafeMutationTarget(baseUrl) || [...Object.values(first), ...Object.values(second)].some((value) => !value),
  "Due sessioni dello stesso profilo e URL QA richiesti",
);

async function phoneContext(browser, member) {
  const context = await browser.newContext({
    ...devices["Galaxy S9+"],
    viewport: { width: 412, height: 915 },
    serviceWorkers: "block",
  });
  await context.addInitScript(({ token, id, key }) => {
    if (!localStorage.getItem("india-session-token"))
      localStorage.setItem("india-session-token", token);
    if (!localStorage.getItem("india-profile-id"))
      localStorage.setItem("india-profile-id", id);
    if (!localStorage.getItem("india-role"))
      localStorage.setItem("india-role", "coordinator");
    if (!localStorage.getItem("india-device-key"))
      localStorage.setItem("india-device-key", key);
  }, member);
  return context;
}

test("un preferito si sincronizza nei due sensi tra due telefoni dello stesso profilo", async ({ browser }) => {
  test.setTimeout(120_000);
  const firstContext = await phoneContext(browser, first);
  const secondContext = await phoneContext(browser, second);
  const firstPage = await firstContext.newPage();
  const secondPage = await secondContext.newPage();
  try {
    await Promise.all([
      firstPage.goto(baseUrl, { waitUntil: "domcontentloaded" }),
      secondPage.goto(baseUrl, { waitUntil: "domcontentloaded" }),
    ]);
    const firstPost = firstPage.locator(".post").first();
    const secondPost = secondPage.locator(".post").first();
    await expect(firstPost).toBeVisible();
    await expect(secondPost).toBeVisible();

    const cleanupPostId = await firstPost.getAttribute("data-scroll-anchor");
    const postId = cleanupPostId.replace(/^post-/, "");
    await firstPage.evaluate(async (id) => fetch(`/api/bookmarks/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        authorization: `Bearer ${localStorage.getItem("india-session-token")}`,
        "x-device-key": localStorage.getItem("india-device-key"),
      },
    }), postId);
    await Promise.all([firstPage.reload({ waitUntil: "domcontentloaded" }), secondPage.reload({ waitUntil: "domcontentloaded" })]);

    const saveResponse = firstPage.waitForResponse((response) =>
      new URL(response.url()).pathname === `/api/bookmarks/${postId}` && response.request().method() === "PUT");
    await firstPage.locator(".post").first().getByRole("button", { name: "Salva" }).tap();
    expect((await saveResponse).status()).toBe(200);
    await expect(firstPage.locator(".post").first().getByRole("button", { name: "Rimuovi dai salvati" })).toHaveAttribute("aria-pressed", "true");
    await expect(secondPage.locator(".post").first().getByRole("button", { name: "Rimuovi dai salvati" })).toBeVisible({ timeout: 20_000 });

    const removeResponse = secondPage.waitForResponse((response) =>
      new URL(response.url()).pathname === `/api/bookmarks/${postId}` && response.request().method() === "DELETE");
    await secondPage.locator(".post").first().getByRole("button", { name: "Rimuovi dai salvati" }).tap();
    expect((await removeResponse).status()).toBe(200);
    await expect(firstPage.locator(".post").first().getByRole("button", { name: "Salva" })).toBeVisible({ timeout: 20_000 });
  } finally {
    await firstPage.evaluate(async () => {
      const anchor = document.querySelector(".post")?.dataset.scrollAnchor || "";
      const id = anchor.replace(/^post-/, "");
      if (id) await fetch(`/api/bookmarks/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${localStorage.getItem("india-session-token")}`,
          "x-device-key": localStorage.getItem("india-device-key"),
        },
      });
    }).catch(() => {});
    await Promise.all([firstContext.close(), secondContext.close()]);
  }
});
