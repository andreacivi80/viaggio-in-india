import { test, expect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const sessionToken = process.env.QA_SESSION_TOKEN;
const profileId = process.env.QA_PROFILE_ID;
const deviceKey = process.env.QA_OWNER_DEVICE_KEY;
const audioPath = fileURLToPath(new URL("../public/audio/india-insieme-demo.wav", import.meta.url));
const videoPath = fileURLToPath(new URL("../public/video/india-insieme-demo.webm", import.meta.url));
const photoPath = fileURLToPath(new URL("../public/thailand/bangkok.jpg", import.meta.url));

test.skip(!sessionToken || !profileId || !deviceKey || !isSafeMutationTarget(baseUrl), "Sessione personale QA e URL locale/QA richiesti");

test("commenti con audio, video e fotografia reali vengono salvati e riaperti", async ({ page }) => {
  test.slow();
  let createdPostId = "";
  await page.addInitScript(({ token, id, key }) => {
    localStorage.setItem("india-session-token", token);
    localStorage.setItem("india-profile-id", id);
    localStorage.setItem("india-profile-name", "Proprietario QA");
    localStorage.setItem("india-visitor-name", "Proprietario QA");
    localStorage.setItem("india-role", "traveler");
    localStorage.setItem("india-device-key", key);
  }, { token: sessionToken, id: profileId, key: deviceKey });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await expect(page.locator(".accessPill")).not.toContainText("Pubblico", { timeout: 20_000 });
  try {
    const marker = `Commenti media ${Date.now()}`;
    const createResponse = await page.request.post(`${baseUrl}/api/posts`, {
      headers: {
        authorization: `Bearer ${sessionToken}`,
        "x-device-key": deviceKey,
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
      await post.getByRole("button", { name: "Invia commento" }).tap();
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

    const photoComment = await sendAttachment({ text: "Risposta fotografia reale", path: photoPath });
    const photo = photoComment.locator("img");
    await expect(photo).toBeVisible();
    await expect.poll(() => photo.evaluate((element) => element.complete && element.naturalWidth > 100)).toBe(true);
  } finally {
    if (createdPostId)
      await page.request.delete(`${baseUrl}/api/posts/${encodeURIComponent(createdPostId)}`, {
        headers: { authorization: `Bearer ${sessionToken}`, "x-device-key": deviceKey },
        timeout: 15_000,
      }).catch(() => {});
  }
});
