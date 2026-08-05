import { test, expect, devices } from "@playwright/test";

test.use({ ...devices["Galaxy S9+"], serviceWorkers: "block" });

test("i quattro compleanni sono visibili nelle giornate anche con un solo profilo registrato", async ({ page }) => {
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

  await expect(page.locator(".dayBirthdayRibbon")).toHaveCount(3);
  await expect(page.locator(".birthdayPickerDot")).toHaveCount(3);
  await expect(page.locator('.dayBirthdayRibbon[aria-label*="Antonella, 26 anni"]')).toContainText("Ludovica · 28 anni");
  await page.getByRole("button", { name: /Giorno 8, Lun 17 ago, Jaipur/ }).click();
  await expect(page.locator('.dayBirthdayRibbon[aria-label*="Paolo, 37 anni"]')).toBeVisible();
  await page.getByRole("button", { name: /Giorno 12, Ven 21 ago, Varanasi/ }).click();
  await expect(page.locator('.dayBirthdayRibbon[aria-label*="Davide Spinaci, 29 anni"]')).toBeVisible();
  await page.getByRole("button", { name: /Giorno 1, Lun 10 ago, Delhi/ }).click();
  await expect(page.locator('.dayBirthdayRibbon[aria-label*="Antonella"] .birthdayPartyScene')).toBeVisible();
  await expect(page.locator('.dayBirthdayRibbon[aria-label*="Antonella"] .birthdayWeRoadLogo')).toHaveCount(0);
  await expect(page.locator('.dayBirthdayRibbon[aria-label*="Antonella"] .birthdayTravelers img')).toHaveCount(1);

  const layout = await page.locator('.dayBirthdayRibbon[aria-label*="Antonella"]').evaluate((ribbon) => {
    const ribbonBox = ribbon.getBoundingClientRect();
    const articleBox = ribbon.closest("article").getBoundingClientRect();
    return {
      inside: ribbonBox.left >= articleBox.left && ribbonBox.right <= articleBox.right,
      viewport: ribbonBox.right <= innerWidth,
    };
  });
  expect(layout).toEqual({ inside: true, viewport: true });
  await page.locator('.dayBirthdayRibbon[aria-label*="Antonella"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/1.38.2-birthdays-s9.png", fullPage: false });
});
