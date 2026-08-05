import { test, expect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const inviteToken = process.env.QA_UI_INVITE_TOKEN;
const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const photoPath = fileURLToPath(new URL("../public/cities/jaipur.jpg", import.meta.url));

test.skip(!inviteToken || !isSafeMutationTarget(baseUrl), "Invito QA e URL locale/QA richiesti");

const makeWave = () => {
  const samples = 8000;
  const buffer = Buffer.alloc(44 + samples * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + samples * 2, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(8000, 24);
  buffer.writeUInt32LE(16000, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples * 2, 40);
  return buffer;
};

const makeWebm = () => Buffer.from([
  0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81,
  0x01, 0x42, 0xf2, 0x81, 0x04, 0x42, 0xf3, 0x81, 0x08, 0x42, 0x82, 0x84,
  0x77, 0x65, 0x62, 0x6d, 0x42, 0x87, 0x81, 0x02, 0x42, 0x85, 0x81, 0x02,
]);

test("bozza, riselezione file e commento con foto restano utilizzabili", async ({ page }) => {
  test.slow();
  let createdPostId = "";
  await page.goto(`${baseUrl}/?invite=${encodeURIComponent(inviteToken)}`, { waitUntil: "networkidle" });
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("india-session-token")))
    .toBeTruthy();
  const sessionToken = await page.evaluate(() => localStorage.getItem("india-session-token"));
  const deviceKey = await page.evaluate(() => localStorage.getItem("india-device-key"));
  try {
    await page.getByRole("button", { name: "Pubblica" }).tap();
    let sheet = page.locator(".uploadSheet");
    const longText = `${"Un ricordo molto lungo. ".repeat(120)} 🧡 नमस्ते`;
    await sheet.getByPlaceholder("Racconta questo momento…").fill(longText);
    const gallery = sheet.locator('input[accept^="image"]').first();
    await gallery.setInputFiles([
      { name: "prima-foto.jpg", mimeType: "image/jpeg", buffer: await (await import("node:fs/promises")).readFile(photoPath) },
      { name: "seconda-foto.jpg", mimeType: "image/jpeg", buffer: await (await import("node:fs/promises")).readFile(photoPath) },
    ]);
    await expect(sheet.getByText("2 allegati pronti")).toBeVisible();
    await sheet.getByRole("button", { name: "Chiudi" }).tap();
    await page.getByRole("button", { name: "Pubblica" }).tap();
    sheet = page.locator(".uploadSheet");
    await expect(sheet.getByPlaceholder("Racconta questo momento…")).toHaveValue(longText);
    await expect(sheet.getByText("2 allegati pronti")).toBeVisible();
    await sheet.getByRole("button", { name: "Rimuovi prima-foto.jpg" }).tap();
    await expect(sheet.getByText("1 allegati pronti")).toBeVisible();
    await gallery.setInputFiles({ name: "prima-foto.jpg", mimeType: "image/jpeg", buffer: await (await import("node:fs/promises")).readFile(photoPath) });
    await expect(sheet.getByText("2 allegati pronti")).toBeVisible();
    await gallery.setInputFiles({ name: "documento.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7") });
    const invalidStatus = sheet.locator(".uploadStatus");
    await expect(invalidStatus).toContainText("documento.pdf");
    await expect(invalidStatus).toContainText("non supportato");
    await expect(invalidStatus).toContainText("application/pdf");
    const createResponsePromise = page.waitForResponse(
      (response) => response.url().endsWith("/api/posts") && response.request().method() === "POST",
    );
    await sheet.locator(".composerActions > button").tap();
    const createResponse = await createResponsePromise;
    expect(createResponse.status()).toBe(201);
    createdPostId = (await createResponse.json()).id;

    const post = page.locator(".post").filter({ hasText: "Un ricordo molto lungo." });
    await expect(post).toBeVisible();
    const reply = post.getByPlaceholder("Scrivi un commento…");
    await post.getByRole("button", { name: "Invia commento" }).tap();
    await expect(post.getByText("Scrivi un commento oppure aggiungi un allegato.")).toBeVisible();

    const sendComment = async ({ text, name, mimeType, buffer }) => {
      await reply.fill(text);
      await post.locator('.reply input[type="file"]').setInputFiles({ name, mimeType, buffer });
      await expect(post.getByText(`Allegato pronto: ${name}`)).toBeVisible();
      const responsePromise = page.waitForResponse(
        (response) => response.url().includes("/api/comments") && response.request().method() === "POST",
        { timeout: 60_000 },
      );
      await post.getByRole("button", { name: "Invia commento" }).tap();
      const response = await responsePromise;
      expect(response.status()).toBe(201);
      await expect(post.getByText(text, { exact: false })).toBeVisible();
    };

    await reply.fill("Ciao @");
    const mention = page.locator(".mentionSuggestions button").first();
    await expect(mention).toBeVisible();
    await mention.tap();
    const mentionText = `${await reply.inputValue()}foto 🧡 नमस्ते`;
    await sendComment({ text: mentionText, name: "risposta.jpg", mimeType: "image/jpeg", buffer: await (await import("node:fs/promises")).readFile(photoPath) });
  } finally {
    if (createdPostId)
      await page.request.delete(`${baseUrl}/api/posts/${encodeURIComponent(createdPostId)}`, {
        headers: { authorization: `Bearer ${sessionToken}`, "x-device-key": deviceKey },
        timeout: 15_000,
      }).catch(() => {});
    await page.evaluate(() => localStorage.removeItem("india-draft")).catch(() => {});
  }
});
