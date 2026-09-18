import { test, expect, devices } from "@playwright/test";

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const inviteToken = process.env.QA_UI_INVITE_TOKEN;
const referencePostId = process.env.QA_REFERENCE_POST_ID;
const runId = process.env.QA_RUN_ID;

test.skip(!baseUrl || !inviteToken || !referencePostId || !runId, "Fixture QA commenti richiesta");

test("telefono pagina e cerca sessanta commenti senza duplicati", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["Galaxy S9+"], serviceWorkers: "block" });
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}/#invite=${encodeURIComponent(inviteToken)}`, { waitUntil: "networkidle" });
    const post = page.locator(`[data-scroll-anchor="post-${referencePostId}"]`);
    await expect(post).toBeVisible();
    await expect(post.getByRole("button", { name: "Visualizza tutti i 60 commenti" })).toBeVisible();

    const firstPage = page.waitForResponse((response) =>
      response.url().includes(`/api/comments?`) && response.url().includes(`post_id=${encodeURIComponent(referencePostId)}`),
    );
    await post.getByRole("button", { name: "Visualizza tutti i 60 commenti" }).tap();
    expect((await firstPage).status()).toBe(200);
    await expect(post.locator(".comment")).toHaveCount(50);
    await expect(post.getByRole("button", { name: "Carica commenti precedenti" })).toBeVisible();

    await post.getByRole("button", { name: "Carica commenti precedenti" }).tap();
    await expect(post.locator(".comment")).toHaveCount(60);
    expect(await post.locator(".comment").evaluateAll((items) =>
      new Set(items.map((item) => item.getAttribute("data-comment-id"))).size,
    )).toBe(60);

    const search = post.getByRole("searchbox", { name: "Cerca nei commenti" });
    await search.fill(`Bersaglio Bangkok ${runId}`);
    const searchResponsePromise = page.waitForResponse((response) =>
      response.url().includes("/api/comments?") && response.url().includes("q=Bersaglio"),
    );
    await post.getByRole("button", { name: "Cerca", exact: true }).tap();
    const searchResponse = await searchResponsePromise;
    const searchBody = await searchResponse.text();
    expect(searchResponse.status(), `${searchResponse.url()} ${searchBody}`).toBe(200);
    const searchPayload = JSON.parse(searchBody);
    expect(searchPayload.total).toBe(1);
    expect(searchPayload.comments).toHaveLength(1);
    await expect(post.locator(".comment")).toHaveCount(1);
    await expect(post.locator(".comment")).toContainText(`Bersaglio Bangkok ${runId}`);
    await expect(post.getByText("1 commenti trovati.")).toBeVisible();
  } finally {
    await context.close();
  }
});
