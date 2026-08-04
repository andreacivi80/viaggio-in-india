import { test, expect, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

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
const pdfBytes = await readFile(pdfPath);
const deviceForProject = (projectName) => projectName === "iPhone-piccolo"
  ? devices["iPhone SE"]
  : projectName === "Samsung-vecchio"
    ? { ...devices["Galaxy S9+"], viewport: { width: 360, height: 740 } }
    : { ...devices["Galaxy S9+"], viewport: { width: 412, height: 915 } };

const expectPdfVisible = async (viewer) => {
  const canvas = viewer.locator(".pdfPageCanvas").first();
  await expect(viewer.getByRole("status")).toHaveCount(0, { timeout: 20_000 });
  await expect(canvas).toBeVisible();
  expect((await canvas.screenshot()).byteLength).toBeGreaterThan(12_000);
};

test("viaggiatore gestisce 10 PDF reali e il coordinatore vede e apre l'ultimo", async ({ browser }, testInfo) => {
  test.slow();
  const device = deviceForProject(testInfo.project.name);
  const travelerContext = await browser.newContext({ ...device });
  const coordinatorContext = await browser.newContext({ ...device });
  const travelerPage = await travelerContext.newPage();
  const coordinatorPage = await coordinatorContext.newPage();
  try {
    await travelerPage.goto(`${baseUrl}/?invite=${encodeURIComponent(travelerInvite)}`, {
      waitUntil: "networkidle",
    });
    await tapBottom(travelerPage, "Gruppo");
    await expect(travelerPage.getByRole("heading", { name: "Facce, nomi e storie" })).toBeVisible();
    const travelerCard = travelerPage.locator(".peopleGrid article").filter({ hasText: travelerName });
    await travelerCard.getByRole("button", { name: "Documenti e posizione" }).tap();
    await expect(travelerPage.getByRole("heading", { name: "Documenti e sicurezza" })).toBeVisible();
    await expect(travelerPage.locator(".coordinatorDashboard")).toHaveCount(0);

    const passport = travelerPage.locator(".document").filter({ hasText: "Passaporto" });
    for (let iteration = 1; iteration <= 10; iteration += 1) {
      const fileName = `documento-reale-${iteration}.pdf`;
      const uploadResponse = travelerPage.waitForResponse(
        (response) => response.url().includes("/api/documents") && response.request().method() === "POST",
      );
      await passport.locator('input[type="file"]').setInputFiles({ name: fileName, mimeType: "application/pdf", buffer: pdfBytes });
      expect((await uploadResponse).status()).toBe(200);
      await expect(passport).toContainText("✓ Presente");
      await expect(passport).toContainText(fileName);

      await passport.getByRole("button", { name: "Apri" }).tap();
      const viewer = travelerPage.locator(".documentPreviewOverlay");
      await expect(viewer).toBeVisible();
      await expectPdfVisible(viewer);
      await viewer.getByRole("button", { name: "Chiudi documento" }).tap();
      await expect(viewer).toHaveCount(0);

      if (iteration < 10) {
        await passport.getByRole("button", { name: "Elimina" }).tap();
        const confirmIteration = travelerPage.locator(".confirmCard").filter({ hasText: "Eliminare questo documento?" });
        const deleteIteration = travelerPage.waitForResponse(
          (response) => response.url().includes("/api/documents/") && response.request().method() === "DELETE",
        );
        await confirmIteration.getByRole("button", { name: "Elimina" }).tap();
        expect((await deleteIteration).status()).toBe(200);
        await expect(passport).toContainText("Non ancora caricato");
      }
    }

    const downloadPromise = travelerPage.waitForEvent("download");
    await passport.getByRole("button", { name: "Scarica" }).tap();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("documento-reale-10.pdf");

    await coordinatorPage.goto(`${baseUrl}/?invite=${encodeURIComponent(coordinatorInvite)}`, {
      waitUntil: "networkidle",
    });
    await tapBottom(coordinatorPage, "Gruppo");
    const coordinatorCard = coordinatorPage.locator(".peopleGrid article").filter({ hasText: coordinatorName });
    await coordinatorCard.getByRole("button", { name: "Documenti e posizione" }).tap();
    await expect(coordinatorPage.locator(".coordinatorDashboard")).toBeVisible();
    const travelerStatus = coordinatorPage.locator(".documentPersonCard").filter({ hasText: travelerName });
    await expect(travelerStatus).toContainText("1/4");
    await expect(
      travelerStatus.getByRole("button", { name: new RegExp(`${travelerName}: Passaporto presente`) }),
    ).toBeVisible();
    await travelerStatus.getByRole("button", { name: new RegExp(`${travelerName}: Passaporto presente`) }).tap();
    const coordinatorViewer = coordinatorPage.locator(".documentPreviewOverlay");
    await expect(coordinatorViewer).toBeVisible();
    await expectPdfVisible(coordinatorViewer);
    await coordinatorViewer.getByRole("button", { name: "Chiudi documento" }).tap();

    await passport.getByRole("button", { name: "Elimina" }).tap();
    let confirm = travelerPage.locator(".confirmCard").filter({ hasText: "Eliminare questo documento?" });
    await confirm.getByRole("button", { name: "Annulla" }).tap();
    await expect(passport).toContainText("✓ Presente");
    await passport.getByRole("button", { name: "Elimina" }).tap();
    confirm = travelerPage.locator(".confirmCard").filter({ hasText: "Eliminare questo documento?" });
    const deleteResponse = travelerPage.waitForResponse(
      (response) => response.url().includes("/api/documents/") && response.request().method() === "DELETE",
    );
    await confirm.getByRole("button", { name: "Elimina" }).tap();
    expect((await deleteResponse).status()).toBe(200);
    await expect(passport).toContainText("Non ancora caricato");
    await expect(travelerStatus).toContainText("0/4", { timeout: 15_000 });
  } finally {
    await Promise.all([travelerContext.close(), coordinatorContext.close()]);
  }
});
