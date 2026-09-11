import { test, expect, devices } from "@playwright/test";

test.use({ ...devices["Galaxy S9+"], serviceWorkers: "block" });

test("un link apre anche un commento vecchio e la discussione resta aperta dopo la sincronizzazione", async ({ page }) => {
  test.setTimeout(75_000);
  let serverVersion = 1;
  const comments = [
    { id: "comment-target", author_name: "Anna", text: "Commento preciso da aprire" },
    { id: "comment-two", author_name: "Bruno", text: "Secondo commento" },
    { id: "comment-three", author_name: "Carla", text: "Terzo commento" },
    { id: "comment-four", author_name: "Diego", text: "Quarto commento" },
  ];
  const state = () => ({
    sync_version: serverVersion,
    viewer: null,
    profiles: [],
    trip_checks: {},
    posts: [{
      id: "post-deep-comment",
      author_name: "India insieme",
      text: "Pubblicazione con discussione completa",
      visibility: "public",
      day_index: -1,
      created_at: "2026-09-05T10:00:00.000Z",
      media: [],
      reactions: [],
      comments: [...comments],
    }],
  });

  await page.route("**/api/state*", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(state()),
  }));
  await page.route("**/api/sync/version*", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ version: serverVersion }),
  }));
  await page.route("**/api/weather*", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ forecasts: [] }),
  }));

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-scroll-anchor="post-post-deep-comment"]')).toBeVisible();
  await page.goto("/?post=post-deep-comment&comment=comment-target", { waitUntil: "domcontentloaded" });
  const post = page.locator('[data-scroll-anchor="post-post-deep-comment"]');
  const target = post.locator('[data-comment-id="comment-target"]');
  await expect(post).toBeVisible();
  await expect(target).toBeVisible();
  await expect(post.getByRole("button", { name: "Mostra soltanto gli ultimi commenti" })).toBeVisible();

  serverVersion = 2;
  comments.push({ id: "comment-five", author_name: "Elena", text: "Commento arrivato durante la lettura" });
  await expect(post.getByText("Commento arrivato durante la lettura")).toBeVisible({ timeout: 25_000 });
  await expect(target).toBeVisible();

  await post.getByRole("button", { name: "Mostra soltanto gli ultimi commenti" }).tap();
  await expect(target).toHaveCount(0);
  await expect(post.getByRole("button", { name: "Visualizza tutti i 5 commenti" })).toBeVisible();
  await post.getByRole("button", { name: "Visualizza tutti i 5 commenti" }).tap();
  await expect(target).toBeVisible();

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-comment-id="comment-target"]')).toBeVisible();
  await page.goBack({ waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-scroll-anchor="post-post-deep-comment"]')).toBeVisible();
});
