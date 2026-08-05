import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const profileName = process.env.QA_UI_PROFILE_NAME;
const inviteToken = process.env.QA_UI_INVITE_TOKEN;
const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const photoPath = fileURLToPath(new URL("../public/cities/agra.jpg", import.meta.url));
const videoPath = fileURLToPath(new URL("../public/video/india-insieme-demo.webm", import.meta.url));

test.skip(!profileName || !inviteToken || !baseUrl, "Profilo QA, invito e URL richiesti");

const makeWave = () => {
  const sampleRate = 8000;
  const seconds = 1;
  const samples = sampleRate * seconds;
  const buffer = Buffer.alloc(44 + samples * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + samples * 2, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples * 2, 40);
  for (let index = 0; index < samples; index += 1)
    buffer.writeInt16LE(Math.round(Math.sin((index * 2 * Math.PI * 660) / sampleRate) * 9000), 44 + index * 2);
  return buffer;
};

const makePlayableWebm = async (page) => {
  const base64 = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const context = canvas.getContext("2d");
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const destination = audio.createMediaStreamDestination();
    oscillator.frequency.value = 440;
    oscillator.connect(destination);
    oscillator.start();
    const videoStream = canvas.captureStream(12);
    const stream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...destination.stream.getAudioTracks(),
    ]);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
      ? "video/webm;codecs=vp8,opus"
      : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks = [];
    recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
    const stopped = new Promise((resolve) => (recorder.onstop = resolve));
    recorder.start(100);
    const started = performance.now();
    while (performance.now() - started < 900) {
      const elapsed = performance.now() - started;
      context.fillStyle = elapsed % 300 < 150 ? "#f97316" : "#173b30";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "white";
      context.font = "bold 28px sans-serif";
      context.fillText("India Insieme", 58, 126);
      await new Promise((resolve) => setTimeout(resolve, 70));
    }
    recorder.stop();
    await stopped;
    oscillator.stop();
    await audio.close();
    const bytes = new Uint8Array(await new Blob(chunks, { type: mimeType }).arrayBuffer());
    let binary = "";
    for (let index = 0; index < bytes.length; index += 0x8000)
      binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
    return btoa(binary);
  });
  return Buffer.from(base64, "base64");
};

const swipeMediaLikeAFinger = async (page, carousel) => {
  const box = await carousel.boundingBox();
  expect(box).not.toBeNull();
  const client = await page.context().newCDPSession(page);
  const startX = Math.round(box.x + box.width * 0.82);
  const endX = Math.round(box.x + box.width * 0.18);
  const y = Math.round(box.y + box.height / 2);
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: startX, y }] });
  for (let step = 1; step <= 10; step += 1) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: Math.round(startX + ((endX - startX) * step) / 10), y }],
    });
    await page.waitForTimeout(25);
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(250);
};

test("foto, video con audio e messaggio audio si caricano e restano riproducibili", async ({ page }) => {
  test.slow();
  let createdPostId = "";
  await page.goto(`${baseUrl}/?invite=${encodeURIComponent(inviteToken)}`, { waitUntil: "networkidle" });
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("india-session-token")))
    .toBeTruthy();
  const sessionToken = await page.evaluate(() => localStorage.getItem("india-session-token"));
  const video = await readFile(videoPath);
  expect(video.byteLength).toBeGreaterThan(0);
  const audio = makeWave();
  try {
    await page.getByRole("button", { name: "Pubblica" }).tap();
    const sheet = page.locator(".uploadSheet");
    await sheet.locator('input[accept^="image"]').first().setInputFiles(photoPath);
    await expect(sheet.getByText("1 allegati pronti")).toBeVisible();
    await sheet.locator('input[accept^="video"]').setInputFiles({
      name: "prova-video.webm",
      mimeType: "video/webm",
      buffer: video,
    });
    await expect(sheet.getByText("2 allegati pronti")).toBeVisible();
    await sheet.locator('input[accept^="audio"]').setInputFiles({
      name: "prova-audio.wav",
      mimeType: "audio/wav",
      buffer: audio,
    });
    await expect(sheet.getByText("3 allegati pronti")).toBeVisible();
    await expect(sheet.locator(".attachmentPreviews img")).toHaveCount(1);
    await expect(sheet.locator(".attachmentPreviews video")).toHaveCount(1);
    await expect(sheet.locator(".attachmentPreviews audio")).toHaveCount(1);
    const text = `Media UI ${Date.now()}`;
    await sheet.getByPlaceholder("Racconta questo momento…").fill(text);
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/posts") && response.request().method() === "POST",
    );
    await sheet.locator(".composerActions > button").tap();
    const response = await responsePromise;
    expect(response.status()).toBe(201);
    createdPostId = (await response.json()).id;
    const post = page.locator(".post").filter({ hasText: text });
    await expect(post).toBeVisible();
    await expect(post.locator("img", { has: undefined })).toBeVisible();
    const audioPlayer = post.locator("audio");
    await expect(audioPlayer).toHaveCount(1);
    await expect(audioPlayer).toBeHidden();
    await expect.poll(() => audioPlayer.evaluate((element) => element.duration)).toBeGreaterThan(0);
    const compactPlay = post.getByRole("button", { name: "Ascolta il racconto" });
    await expect(compactPlay).toBeVisible();
    await compactPlay.tap();
    await expect.poll(() => audioPlayer.evaluate((element) => element.paused)).toBe(false);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide")));
    await expect.poll(() => audioPlayer.evaluate((element) => element.paused)).toBe(true);
    const carousel = post.locator(".postMediaCarousel");
    const beforeSwipe = await carousel.evaluate((element) => element.scrollLeft);
    await swipeMediaLikeAFinger(page, carousel);
    await expect.poll(() => carousel.evaluate((element) => element.scrollLeft)).toBeGreaterThan(beforeSwipe + 20);
    await expect(post.locator(".mediaCounter")).toHaveText("2 contenuti · scorri");
    await expect(post.getByRole("button", { name: /Contenuto (precedente|successivo)/ })).toHaveCount(0);
    const videoPlayer = post.locator("video");
    await expect(videoPlayer).toBeVisible();
    await expect.poll(() => videoPlayer.evaluate((element) => element.duration)).toBeGreaterThan(0);

    await page.getByRole("button", { name: "Pubblica" }).tap();
    const secondSheet = page.locator(".uploadSheet");
    const photoBytes = await readFile(photoPath);
    const tenPhotos = Array.from({ length: 10 }, (_, index) => ({
      name: `foto-${index + 1}.jpg`,
      mimeType: "image/jpeg",
      buffer: photoBytes,
    }));
    await secondSheet.locator('input[accept^="image"]').first().setInputFiles(tenPhotos);
    await expect(secondSheet.getByText("10 allegati pronti")).toBeVisible();
    await secondSheet.locator('input[accept^="audio"]').setInputFiles({
      name: "undicesimo.wav",
      mimeType: "audio/wav",
      buffer: audio,
    });
    await expect(secondSheet.getByText(/massimo 10 contenuti/)).toBeVisible();
    await expect(secondSheet.getByText("10 allegati pronti")).toBeVisible();
  } finally {
    if (createdPostId && sessionToken)
      await page.request.delete(`${baseUrl}/api/posts/${encodeURIComponent(createdPostId)}`, {
        headers: { authorization: `Bearer ${sessionToken}` },
      }).catch(() => {});
  }
});
