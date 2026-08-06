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
const verticalPassportPath = fileURLToPath(new URL("../public/cities/jaipur.jpg", import.meta.url));
const verticalPassport = await readFile(verticalPassportPath);
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

    const verticalUpload = travelerPage.waitForResponse(
      (response) => response.url().includes("/api/documents") && response.request().method() === "POST",
    );
    await passport.locator('input[type="file"]').setInputFiles({
      name: "passaporto-verticale.jpg",
      mimeType: "image/jpeg",
      buffer: verticalPassport,
    });
    expect((await verticalUpload).status()).toBe(200);
    await travelerContext.setOffline(true);
    await passport.getByRole("button", { name: "Apri" }).tap();
    await expect(travelerPage.getByText("Documento non disponibile. Tocca Riprova.")).toBeVisible();
    await expect(travelerPage.locator(".documentPreviewOverlay")).toHaveCount(0);
    await travelerContext.setOffline(false);
    await passport.getByRole("button", { name: "Apri" }).tap();
    viewer = travelerPage.locator(".documentPreviewOverlay");
    const previewImage = viewer.locator("img");
    await expect(previewImage).toBeVisible();
    const geometry = await previewImage.evaluate((image) => ({
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      objectFit: getComputedStyle(image).objectFit,
      image: image.getBoundingClientRect().toJSON(),
      card: image.closest(".documentPreviewCard").getBoundingClientRect().toJSON(),
    }));
    expect(geometry.naturalHeight).toBeGreaterThan(geometry.naturalWidth);
    expect(geometry.objectFit).toBe("contain");
    expect(geometry.image.width).toBeLessThanOrEqual(geometry.card.width + 1);
    expect(geometry.image.height).toBeLessThanOrEqual(geometry.card.height + 1);
    const deepLink = travelerPage.url();
    expect(deepLink).toContain("document_profile=");
    expect(deepLink).toContain("document_type=passport");
    expect(deepLink).not.toContain("passaporto-verticale.jpg");
    await viewer.getByRole("button", { name: "Chiudi documento" }).tap();
    expect(travelerPage.url()).not.toContain("document_type=");

    const linkedPage = await travelerContext.newPage();
    await linkedPage.goto(deepLink, { waitUntil: "domcontentloaded" });
    await expect(linkedPage.locator(".documentPreviewOverlay img")).toBeVisible({ timeout: 20_000 });
    await linkedPage.getByRole("button", { name: "Chiudi documento" }).tap();
    await linkedPage.close();

    await travelerPage.locator(".tabs").getByRole("button", { name: "Bacheca" }).tap();
    await travelerPage.locator(".accessPill").tap();
    await travelerPage.getByRole("button", { name: "Documenti e sicurezza" }).tap();
    await expect(travelerPage.getByRole("heading", { name: "Documenti e sicurezza" })).toBeVisible();
    await travelerPage.getByRole("button", { name: "Torna alla bacheca" }).tap();
    await expect(travelerPage.locator(".tabs").getByRole("button", { name: "Bacheca" })).toHaveAttribute("aria-current", "page");

    await travelerPage.locator(".accessPill").tap();
    await travelerPage.getByRole("button", { name: "Documenti e sicurezza" }).tap();
    await passport.getByRole("button", { name: "Elimina" }).tap();
    const verticalConfirm = travelerPage.locator(".confirmCard").filter({ hasText: "Eliminare questo documento?" });
    await verticalConfirm.getByRole("button", { name: "Elimina" }).tap();
    await expect(passport).toContainText("Non ancora caricato");
  } finally {
    await Promise.all([travelerContext.close(), coordinatorContext.close()]);
  }
});
