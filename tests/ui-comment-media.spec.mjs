import { test, expect } from "@playwright/test";
import { fileURLToPath } from "node:url";

const inviteToken = process.env.QA_UI_INVITE_TOKEN;
const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const audioPath = fileURLToPath(new URL("../public/audio/india-insieme-demo.wav", import.meta.url));
const videoPath = fileURLToPath(new URL("../public/video/india-insieme-demo.webm", import.meta.url));

test.skip(!inviteToken || !baseUrl, "Invito QA e URL richiesti");

test("commenti con audio e video reali vengono salvati e riprodotti", async ({ page }) => {
  test.slow();
  let createdPostId = "";
  await page.goto(`${baseUrl}/?invite=${encodeURIComponent(inviteToken)}`, { waitUntil: "networkidle" });
  const sessionToken = await page.evaluate(() => localStorage.getItem("india-session-token"));
  expect(sessionToken).toBeTruthy();
  try {
    const marker = `Commenti media ${Date.now()}`;
    const createResponse = await page.request.post(`${baseUrl}/api/posts`, {
      headers: {
        authorization: `Bearer ${sessionToken}`,
        "x-idempotency-key": crypto.randomUUID(),
        "x-qa-silent": "true",
      },
      multipart: { day_index: "-1", visibility: "public", text: marker },
    });
    expect(createResponse.status()).toBe(201);
    createdPostId = (await createResponse.json()).id;
    await page.reload({ waitUntil: "networkidle" });
    const post = page.locator(".post").filter({ hasText: marker });
    await expect(post).toBeVisible();

    const sendAttachment = async ({ text, path }) => {
      await post.getByPlaceholder("Scrivi un commento…").fill(text);
      await post.locator('.reply input[type="file"]').setInputFiles(path);
      const responsePromise = page.waitForResponse(
        (response) => response.url().includes("/api/comments") && response.request().method() === "POST",
      );
      await post.getByRole("button", { name: "Invia commento" }).click();
      const response = await responsePromise;
      expect(response.status()).toBe(201);
      const comment = post.locator(".comment").filter({ hasText: text });
      await expect(comment).toBeVisible();
      return comment;
    };

    const audioComment = await sendAttachment({ text: "Risposta audio reale", path: audioPath });
    const audio = audioComment.locator("audio");
    await expect(audio).toBeVisible();
    await expect.poll(() => audio.evaluate((element) => element.duration)).toBeGreaterThan(0);

    const videoComment = await sendAttachment({ text: "Risposta video reale", path: videoPath });
    const video = videoComment.locator("video");
    await expect(video).toBeVisible();
    await expect.poll(() => video.evaluate((element) => element.duration)).toBeGreaterThan(0);
  } finally {
    if (createdPostId)
      await page.request.delete(`${baseUrl}/api/posts/${encodeURIComponent(createdPostId)}`, {
        headers: { authorization: `Bearer ${sessionToken}` },
        timeout: 15_000,
      }).catch(() => {});
  }
});
