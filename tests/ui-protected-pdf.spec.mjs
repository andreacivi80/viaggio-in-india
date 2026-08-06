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

const makeTwoPagePdf = () => {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 5 0 R >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 6 0 R >>",
    "<< /Length 0 >>\nstream\n\nendstream",
    "<< /Length 0 >>\nstream\n\nendstream",
  ];
  let source = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(source));
    source += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(source);
  source += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  source += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  source += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(source);
};

const twoPagePdf = makeTwoPagePdf();

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

    const multipageUpload = travelerPage.waitForResponse(
      (response) => response.url().includes("/api/documents") && response.request().method() === "POST",
    );
    await passport.locator('input[type="file"]').setInputFiles({
      name: "passaporto-due-pagine.pdf",
      mimeType: "application/pdf",
      buffer: twoPagePdf,
    });
    expect((await multipageUpload).status()).toBe(200);
    await passport.getByRole("button", { name: "Apri" }).tap();
    viewer = travelerPage.locator(".documentPreviewOverlay");
    await expect(viewer.locator(".pdfPageCanvas")).toHaveCount(2, { timeout: 20_000 });
    await viewer.getByRole("button", { name: "Chiudi documento" }).tap();
    await passport.getByRole("button", { name: "Elimina" }).tap();
    const multipageConfirm = travelerPage.locator(".confirmCard").filter({ hasText: "Eliminare questo documento?" });
    await multipageConfirm.getByRole("button", { name: "Elimina" }).tap();
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

    for (const [label, filename] of [
      ["Passaporto", "passaporto.pdf"],
      ["Visto India", "visto.pdf"],
      ["Biglietti", "biglietti.pdf"],
      ["Assicurazione", "assicurazione.pdf"],
    ]) {
      const card = travelerPage.locator(".document").filter({ hasText: label });
      const responsePromise = travelerPage.waitForResponse(
        (response) => response.url().includes("/api/documents") && response.request().method() === "POST",
      );
      await card.locator('input[type="file"]').setInputFiles({
        name: filename,
        mimeType: "application/pdf",
        buffer: twoPagePdf,
      });
      expect((await responsePromise).status()).toBe(200);
      await expect(card).toContainText("✓ Presente");
    }

    await coordinatorPage.reload({ waitUntil: "domcontentloaded" });
    await openGroup(coordinatorPage);
    const refreshedCoordinatorCard = coordinatorPage.locator(".peopleGrid article").filter({ hasText: coordinatorName });
    await refreshedCoordinatorCard.getByRole("button", { name: "Documenti e posizione" }).tap();
    await expect(
      coordinatorPage.locator(".documentPersonCard").filter({ hasText: travelerName }),
    ).toContainText("4/4");

    for (const label of ["Passaporto", "Visto India", "Biglietti", "Assicurazione"]) {
      const card = travelerPage.locator(".document").filter({ hasText: label });
      await card.getByRole("button", { name: "Elimina" }).tap();
      const cleanupConfirm = travelerPage.locator(".confirmCard").filter({ hasText: "Eliminare questo documento?" });
      await cleanupConfirm.getByRole("button", { name: "Elimina" }).tap();
      await expect(card).toContainText("Non ancora caricato");
    }
  } finally {
    await Promise.all([travelerContext.close(), coordinatorContext.close()]);
  }
});
