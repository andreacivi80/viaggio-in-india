import { test, expect, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

test.use({ serviceWorkers: "block" });

const travelerName = process.env.QA_UI_PROFILE_NAME;
const travelerInvite = process.env.QA_UI_INVITE_TOKEN;
const coordinatorName = process.env.QA_UI_COORDINATOR_NAME;
const coordinatorInvite = process.env.QA_UI_COORDINATOR_INVITE_TOKEN;
const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");

test.skip(
  !travelerName || !travelerInvite || !coordinatorName || !coordinatorInvite || !baseUrl,
  "Profili e inviti locali richiesti",
);

const protectedPdfPath = fileURLToPath(new URL("./fixtures/documento-prova-protetto.pdf", import.meta.url));
const protectedPdf = await readFile(protectedPdfPath);
const phone = { ...devices["Galaxy S9+"], viewport: { width: 412, height: 915 } };

const openGroup = async (page) => {
  await page.getByRole("button", { name: "Gruppo", exact: true }).tap();
};

const expectProtectedPreview = async (page) => {
  const viewer = page.locator(".documentPreviewOverlay");
  await expect(viewer).toBeVisible();
  await expect(viewer.getByRole("status")).toHaveText(
    "PDF protetto da password. Aprilo nel lettore PDF del telefono.",
    { timeout: 20_000 },
  );
  await expect(viewer.locator(".pdfPageCanvas")).toHaveCount(0);
  await expect(viewer.getByRole("link", { name: "Apri nel lettore PDF del telefono" })).toBeVisible();
  await expect(viewer.getByPlaceholder("Password")).toHaveCount(0);
  return viewer;
};

test("PDF protetto resta privato, scaricabile e non blocca il visualizzatore mobile", async ({ browser }) => {
  test.slow();
  const travelerContext = await browser.newContext({ ...phone, serviceWorkers: "block", acceptDownloads: true });
  const coordinatorContext = await browser.newContext({ ...phone, serviceWorkers: "block", acceptDownloads: true });
  try {
    const travelerPage = await travelerContext.newPage();
    await travelerPage.goto(`${baseUrl}/#invite=${encodeURIComponent(travelerInvite)}`, { waitUntil: "domcontentloaded" });
    await openGroup(travelerPage);
    const travelerCard = travelerPage.locator(".peopleGrid article").filter({ hasText: travelerName });
    await travelerCard.getByRole("button", { name: "Documenti e posizione" }).tap();
    const passport = travelerPage.locator(".document").filter({ hasText: "Passaporto" });
    const uploadResponse = travelerPage.waitForResponse(
      (response) => response.url().includes("/api/documents") && response.request().method() === "POST",
    );
    await passport.locator('input[type="file"]').setInputFiles({
      name: "passaporto-protetto.pdf",
      mimeType: "application/pdf",
      buffer: protectedPdf,
    });
    expect((await uploadResponse).status()).toBe(200);
    await expect(passport).toContainText("✓ Presente");
    await expect(passport).toContainText("passaporto-protetto.pdf");

    await passport.getByRole("button", { name: "Apri" }).tap();
    let viewer = await expectProtectedPreview(travelerPage);
    const downloadPromise = travelerPage.waitForEvent("download");
    await viewer.getByRole("link", { name: "Scarica", exact: true }).tap();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("passaporto-protetto.pdf");
    await viewer.getByRole("button", { name: "Chiudi documento" }).tap();

    const coordinatorPage = await coordinatorContext.newPage();
    await coordinatorPage.goto(`${baseUrl}/#invite=${encodeURIComponent(coordinatorInvite)}`, { waitUntil: "domcontentloaded" });
    await openGroup(coordinatorPage);
    const coordinatorCard = coordinatorPage.locator(".peopleGrid article").filter({ hasText: coordinatorName });
    await coordinatorCard.getByRole("button", { name: "Documenti e posizione" }).tap();
    const travelerStatus = coordinatorPage.locator(".documentPersonCard").filter({ hasText: travelerName });
    await expect(travelerStatus).toContainText("1/4");
    await travelerStatus.getByRole("button", { name: new RegExp(`${travelerName}: Passaporto presente`) }).tap();
    viewer = await expectProtectedPreview(coordinatorPage);
    await viewer.getByRole("button", { name: "Chiudi documento" }).tap();

    await passport.getByRole("button", { name: "Elimina" }).tap();
    const confirm = travelerPage.locator(".confirmCard").filter({ hasText: "Eliminare questo documento?" });
    const deleteResponse = travelerPage.waitForResponse(
      (response) => response.url().includes("/api/documents/") && response.request().method() === "DELETE",
    );
    await confirm.getByRole("button", { name: "Elimina" }).tap();
    expect((await deleteResponse).status()).toBe(200);
    await expect(passport).toContainText("Non ancora caricato");
  } finally {
    await Promise.all([travelerContext.close(), coordinatorContext.close()]);
  }
});
