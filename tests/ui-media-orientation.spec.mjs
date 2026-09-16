import { test, expect, devices } from "@playwright/test";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const sessionToken = process.env.QA_UI_SESSION_TOKEN;
const profileId = process.env.QA_UI_PROFILE_ID;
const profileName = process.env.QA_UI_PROFILE_NAME;
const deviceKey = process.env.QA_UI_DEVICE_KEY;

test.skip(
  !baseUrl || !sessionToken || !profileId || !profileName || !deviceKey || !isSafeMutationTarget(baseUrl),
  "Sessione personale e ambiente QA isolato richiesti",
);
test.use({ ...devices["Galaxy S9+"], serviceWorkers: "block" });

const rasterFixture = async (page, width, height, label) => Buffer.from(await page.evaluate(
  async ({ width: w, height: h, label: text }) => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const context = canvas.getContext("2d");
    context.fillStyle = "#f97316";
    context.fillRect(0, 0, w, h);
    context.fillStyle = "#173b30";
    context.fillRect(w * 0.08, h * 0.08, w * 0.84, h * 0.84);
    context.fillStyle = "white";
    context.font = `${Math.max(28, Math.round(Math.min(w, h) / 10))}px sans-serif`;
    context.textAlign = "center";
    context.fillText(text, w / 2, h / 2);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    return [...new Uint8Array(await blob.arrayBuffer())];
  },
  { width, height, label },
));

const videoFixture = async (page, width, height, label) => Buffer.from(await page.evaluate(
  async ({ width: w, height: h, label: text }) => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const context = canvas.getContext("2d");
    const stream = canvas.captureStream(12);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8") ? "video/webm;codecs=vp8" : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks = [];
    recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
    const stopped = new Promise((resolve) => (recorder.onstop = resolve));
    recorder.start(100);
    const started = performance.now();
    while (performance.now() - started < 800) {
      context.fillStyle = Math.floor((performance.now() - started) / 150) % 2 ? "#2563eb" : "#db2777";
      context.fillRect(0, 0, w, h);
      context.fillStyle = "white";
      context.font = `${Math.max(24, Math.round(Math.min(w, h) / 9))}px sans-serif`;
      context.textAlign = "center";
      context.fillText(text, w / 2, h / 2);
      await new Promise((resolve) => setTimeout(resolve, 70));
    }
    recorder.stop();
    await stopped;
    const bytes = new Uint8Array(await new Blob(chunks, { type: mimeType }).arrayBuffer());
    return [...bytes];
  },
  { width, height, label },
));

test("foto e video verticali e orizzontali conservano proporzioni e contenuto", async ({ browser }) => {
  test.setTimeout(150_000);
  const context = await browser.newContext({ ...devices["Galaxy S9+"], viewport: { width: 360, height: 740 }, serviceWorkers: "block" });
  await context.addInitScript(({ token, id, name, key }) => {
    localStorage.setItem("india-session-token", token);
    localStorage.setItem("india-profile-id", id);
    localStorage.setItem("india-profile-name", name);
    localStorage.setItem("india-visitor-name", name);
    localStorage.setItem("india-role", "traveler");
    localStorage.setItem("india-device-key", key);
  }, { token: sessionToken, id: profileId, name: profileName, key: deviceKey });
  const page = await context.newPage();
  let postId = "";
  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".accessPill")).not.toContainText("Pubblico");
    const landscapePhoto = await rasterFixture(page, 1200, 600, "FOTO ORIZZONTALE");
    const portraitPhoto = await rasterFixture(page, 600, 1200, "FOTO VERTICALE");
    const landscapeVideo = await videoFixture(page, 640, 360, "VIDEO ORIZZONTALE");
    const portraitVideo = await videoFixture(page, 360, 640, "VIDEO VERTICALE");

    await page.getByRole("button", { name: "Pubblica", exact: true }).tap();
    const sheet = page.locator(".uploadSheet");
    await sheet.locator('input[accept^="image"]').first().setInputFiles([
      { name: "foto-orizzontale.jpg", mimeType: "image/jpeg", buffer: landscapePhoto },
      { name: "foto-verticale.jpg", mimeType: "image/jpeg", buffer: portraitPhoto },
    ]);
    await sheet.locator('input[accept="video/*,.mov,.mp4"]').setInputFiles([
      { name: "video-orizzontale.webm", mimeType: "video/webm", buffer: landscapeVideo },
      { name: "video-verticale.webm", mimeType: "video/webm", buffer: portraitVideo },
    ]);
    await expect(sheet.getByText("4 allegati pronti")).toBeVisible();
    const marker = `Orientamenti media QA ${process.env.QA_RUN_ID}`;
    await sheet.getByPlaceholder("Racconta questo momento…").fill(marker);
    const responsePromise = page.waitForResponse(
      (response) => response.url().endsWith("/api/posts") && response.request().method() === "POST",
    );
    await sheet.locator(".composerActions > button").tap();
    const response = await responsePromise;
    expect(response.status()).toBe(201);
    postId = (await response.json()).id;

    const card = page.locator(".post").filter({ hasText: marker });
    await expect(card).toBeVisible();
    const images = card.locator(".postMediaCarousel img");
    const videos = card.locator(".postMediaCarousel video");
    await expect(images).toHaveCount(2);
    await expect(videos).toHaveCount(2);
    await expect.poll(() => images.evaluateAll((items) => items.map((item) => [item.naturalWidth, item.naturalHeight]))).toEqual([
      [1200, 600],
      [600, 1200],
    ]);
    await expect.poll(() => videos.evaluateAll((items) => items.map((item) => [item.videoWidth, item.videoHeight]))).toEqual([
      [640, 360],
      [360, 640],
    ]);
    expect(await images.evaluateAll((items) => items.every((item) => getComputedStyle(item).objectFit === "contain"))).toBe(true);
    expect(await videos.evaluateAll((items) => items.every((item) => getComputedStyle(item).objectFit === "contain"))).toBe(true);
  } finally {
    if (postId) await fetch(`${baseUrl}/api/posts/${encodeURIComponent(postId)}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${sessionToken}`, "x-device-key": deviceKey },
    }).catch(() => {});
    await context.close();
  }
});
