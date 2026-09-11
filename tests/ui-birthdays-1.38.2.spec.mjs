import { test, expect, devices } from "@playwright/test";

test.use({ ...devices["Galaxy S9+"], serviceWorkers: "block" });

test("la nuova partenza non mostra compleanni finché non vengono forniti", async ({ page }) => {
  await page.route("**/api/state", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      sync_version: 1,
      profiles: [{
        id: "antonella-profile",
        name: "Antonella",
        surname: "Test",
        role: "traveler",
        avatar_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23e86b65'/%3E%3C/svg%3E",
      }],
      posts: [],
    }),
  }));
  await page.goto("/?view=diary", { waitUntil: "networkidle" });
  await page.locator(".tabs").getByRole("button", { name: "Viaggio", exact: true }).click();

  await expect(page.locator(".day")).toHaveCount(11);
  await expect(page.locator(".dayBirthdayRibbon")).toHaveCount(0);
  await expect(page.locator(".birthdayPickerDot")).toHaveCount(0);
});
