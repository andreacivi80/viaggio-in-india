import { test, expect, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

const travelerName = process.env.QA_UI_PROFILE_NAME;
const travelerInvite = process.env.QA_UI_INVITE_TOKEN;
const coordinatorName = process.env.QA_UI_COORDINATOR_NAME;
const coordinatorInvite = process.env.QA_UI_COORDINATOR_INVITE_TOKEN;
const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");

test.skip(
  !travelerName || !travelerInvite || !coordinatorName || !coordinatorInvite || !baseUrl,
  "Profili QA Viaggiatore e Coordinatore richiesti",
);

const tapBottom = async (page, name) => {
  const button = page.locator(".tabs").getByRole("button", { name });
  await expect.poll(() => button.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return hit === element || element.contains(hit);
  })).toBe(true);
  const box = await button.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
};

const pdfPath = fileURLToPath(new URL("./fixtures/documento-prova.pdf", import.meta.url));

test("viaggiatore gestisce il proprio PDF e il coordinatore vede la griglia aggiornata", async ({ browser }) => {
  test.slow();
  const travelerContext = await browser.newContext({ ...devices["Galaxy S9+"] });
  const coordinatorContext = await browser.newContext({ ...devices["Galaxy S9+"] });
  const travelerPage = await travelerContext.newPage();
  const coordinatorPage = await coordinatorContext.newPage();
  try {
    await travelerPage.goto(`${baseUrl}/?invite=${encodeURIComponent(travelerInvite)}`, {
      waitUntil: "networkidle",
    });
    await tapBottom(travelerPage, "Gruppo");
    await expect(travelerPage.getByRole("heading", { name: "Facce, nomi e storie" })).toBeVisible();
    const travelerCard = travelerPage.locator(".peopleGrid article").filter({ hasText: travelerName });
    await travelerCard.getByRole("button", { name: "Documenti e posizione" }).click();
    await expect(travelerPage.getByRole("heading", { name: "Documenti e sicurezza" })).toBeVisible();
    await expect(travelerPage.locator(".coordinatorDashboard")).toHaveCount(0);

    const passport = travelerPage.locator(".document").filter({ hasText: "Passaporto" });
    const uploadResponse = travelerPage.waitForResponse(
      (response) => response.url().includes("/api/documents") && response.request().method() === "POST",
    );
    await passport.locator('input[type="file"]').setInputFiles(pdfPath);
    expect((await uploadResponse).status()).toBe(200);
    await expect(passport).toContainText("✓ Presente");
    await expect(passport).toContainText("documento-prova.pdf");

    await passport.getByRole("button", { name: "Apri" }).click();
    await expect(travelerPage.getByText("Documento aperto.")).toBeVisible();
    const viewer = travelerPage.locator(".documentPreviewOverlay");
    await expect(viewer).toBeVisible();
    await expect(viewer.locator(".pdfPageCanvas").first()).toBeVisible({ timeout: 20_000 });
    await viewer.getByRole("button", { name: "Chiudi documento" }).click();
    await expect(viewer).toHaveCount(0);

    const downloadPromise = travelerPage.waitForEvent("download");
    await passport.getByRole("button", { name: "Scarica" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("documento-prova.pdf");

    await coordinatorPage.goto(`${baseUrl}/?invite=${encodeURIComponent(coordinatorInvite)}`, {
      waitUntil: "networkidle",
    });
    await tapBottom(coordinatorPage, "Gruppo");
    const coordinatorCard = coordinatorPage.locator(".peopleGrid article").filter({ hasText: coordinatorName });
    await coordinatorCard.getByRole("button", { name: "Documenti e posizione" }).click();
    await expect(coordinatorPage.locator(".coordinatorDashboard")).toBeVisible();
    const travelerStatus = coordinatorPage.locator(".documentPersonCard").filter({ hasText: travelerName });
    await expect(travelerStatus).toContainText("1/4");
    await expect(
      travelerStatus.getByRole("button", { name: new RegExp(`${travelerName}: Passaporto presente`) }),
    ).toBeVisible();

    await passport.getByRole("button", { name: "Elimina" }).click();
    let confirm = travelerPage.locator(".confirmCard").filter({ hasText: "Eliminare questo documento?" });
    await confirm.getByRole("button", { name: "Annulla" }).click();
    await expect(passport).toContainText("✓ Presente");
    await passport.getByRole("button", { name: "Elimina" }).click();
    confirm = travelerPage.locator(".confirmCard").filter({ hasText: "Eliminare questo documento?" });
    const deleteResponse = travelerPage.waitForResponse(
      (response) => response.url().includes("/api/documents/") && response.request().method() === "DELETE",
    );
    await confirm.getByRole("button", { name: "Elimina" }).click();
    expect((await deleteResponse).status()).toBe(200);
    await expect(passport).toContainText("Non ancora caricato");
    await expect(travelerStatus).toContainText("0/4", { timeout: 15_000 });
  } finally {
    await Promise.all([travelerContext.close(), coordinatorContext.close()]);
  }
});
