import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "block" });

test("campanella mobile gestisce nuove, viste, eliminazione e Spotify", async ({ page }) => {
  const createdAt = new Date().toISOString();
  await page.addInitScript(() => localStorage.clear());
  await page.route("**/api/state*", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      sync_version: 1,
      profiles: [],
      posts: [{
        id: "post-notifiche",
        author_name: "Sara",
        day_index: 0,
        visibility: "public",
        text: "La canzone del viaggio\n\nhttps://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl",
        place_name: "",
        created_at: createdAt,
        media: [],
        comments: [{
          id: "commento-notifiche",
          author_name: "Valentina",
          text: "Bellissimo!",
          created_at: createdAt,
        }],
        reactions: [{
          kind: "heart",
          author_name: "Andrea",
          total: 1,
          created_at: createdAt,
        }],
      }],
    }),
  }));
  await page.route("**/api/weather", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ forecasts: [] }),
  }));
  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page.locator(".spotifyCard iframe")).toHaveAttribute(
    "src",
    /open\.spotify\.com\/embed\/track\/11dFghVXANMlKmJXsNCbNl/,
  );
  await expect(page.locator(".postCaption")).toHaveText("La canzone del viaggio");

  await page.getByRole("button", { name: "Attività recenti" }).tap();
  await expect(page.locator(".notificationItem")).toHaveCount(3);
  await expect(page.getByText("Nuova", { exact: true })).toHaveCount(3);
  await expect(page.getByText("Ha messo Mi piace a un ricordo")).toBeVisible();

  await page.locator(".notificationItem").filter({ hasText: "Nuovo ricordo" }).locator(".notificationOpenItem").tap();
  await expect(page).toHaveURL(/post=post-notifiche/);
  await expect(page.locator('[data-scroll-anchor="post-post-notifiche"]')).toBeVisible();
  await page.goBack();
  await expect(page.locator(".notificationPanel")).toBeVisible();

  await page.locator(".notificationItem").filter({ hasText: "Valentina" }).locator(".notificationOpenItem").tap();
  await expect(page).toHaveURL(/post=post-notifiche.*comment=commento-notifiche/);
  await expect(page.locator('[data-comment-id="commento-notifiche"]')).toBeVisible();
  await page.goBack();
  await expect(page.locator(".notificationPanel")).toBeVisible();

  await page.getByRole("button", { name: "Elimina notifica di Sara" }).tap();
  await expect(page.locator(".notificationItem")).toHaveCount(2);
  await page.getByRole("button", { name: "Cancella tutte" }).tap();
  await expect(page.locator(".notificationItem")).toHaveCount(0);
  await expect(page.getByText("Nessuna nuova attività.")).toBeVisible();

  await page.getByRole("button", { name: "Chiudi notifiche" }).tap();
  await page.getByRole("button", { name: "Attività recenti" }).tap();
  await expect(page.locator(".notificationItem")).toHaveCount(0);
});

test("un collegamento di notifica eliminato mostra un messaggio chiaro", async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.route("**/api/state*", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ sync_version: 2, profiles: [], posts: [] }),
  }));
  await page.route("**/api/weather", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ forecasts: [] }),
  }));
  await page.goto("/?post=ricordo-eliminato", { waitUntil: "networkidle" });
  await expect(page.getByRole("alert")).toContainText("Contenuto non più disponibile.");
});
