import { expect, test, devices } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const sessionToken = process.env.QA_UI_SESSION_TOKEN;
const profileId = process.env.QA_UI_PROFILE_ID;
const profileName = process.env.QA_UI_PROFILE_NAME;
const deviceKey = process.env.QA_UI_DEVICE_KEY;
const photoPath = fileURLToPath(new URL("../public/cities/agra.jpg", import.meta.url));
const videoPath = fileURLToPath(new URL("../public/video/india-insieme-demo.webm", import.meta.url));

test.skip(
  !sessionToken || !profileId || !profileName || !deviceKey || !isSafeMutationTarget(baseUrl),
  "Sessione personale e ambiente QA isolato richiesti",
);

test.use({
  serviceWorkers: "block",
  launchOptions: { args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] },
});

const wave = () => {
  const rate = 8_000;
  const samples = rate * 2;
  const buffer = Buffer.alloc(44 + samples * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + samples * 2, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24);
  buffer.writeUInt32LE(rate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i += 1)
    buffer.writeInt16LE(Math.round(Math.sin((i * Math.PI * 2 * 440) / rate) * 7_000), 44 + i * 2);
  return buffer;
};

const installSession = async (context) => context.addInitScript(({ token, id, name, key }) => {
  localStorage.setItem("india-session-token", token);
  localStorage.setItem("india-profile-id", id);
  localStorage.setItem("india-profile-name", name);
  localStorage.setItem("india-role", "traveler");
  localStorage.setItem("india-device-key", key);
}, { token: sessionToken, id: profileId, name: profileName, key: deviceKey });

test("Pubblica completo: touch, galleria, scatto, video, audio, posizione e secondo telefono", async ({ browser }) => {
  test.setTimeout(150_000);
  const authorContext = await browser.newContext({
    ...devices["Galaxy S9+"],
    viewport: { width: 360, height: 740 },
    serviceWorkers: "block",
    geolocation: { latitude: 28.6139, longitude: 77.2090, accuracy: 30 },
    permissions: ["geolocation", "microphone"],
  });
  const viewerContext = await browser.newContext({ ...devices["iPhone SE"], serviceWorkers: "block" });
  await installSession(authorContext);
  const author = await authorContext.newPage();
  const viewer = await viewerContext.newPage();
  let postId = "";
  try {
    await Promise.all([
      author.goto(baseUrl, { waitUntil: "domcontentloaded" }),
      viewer.goto(baseUrl, { waitUntil: "domcontentloaded" }),
    ]);
    await expect(author.locator(".accessPill")).toContainText("Proprietario", { timeout: 20_000 });
    await expect(viewer.locator(".accessPill")).toContainText("Pubblico");

    await viewer.getByRole("button", { name: "Pubblica", exact: true }).tap();
    const publicSheet = viewer.locator(".uploadSheet");
    await expect(publicSheet.getByText("Accesso privato", { exact: true })).toBeVisible();
    await expect(publicSheet.getByPlaceholder("Racconta questo momento…")).toHaveCount(0);
    const forbidden = new FormData();
    forbidden.set("text", "tentativo pubblico vietato");
    expect((await viewer.request.post(`${baseUrl}/api/posts`, { multipart: { text: "vietato" } })).status()).toBe(403);
    await publicSheet.getByRole("button", { name: "Chiudi" }).tap();

    await author.getByRole("button", { name: "Pubblica", exact: true }).tap();
    const sheet = author.locator(".uploadSheet");
    const gallery = sheet.locator('input[accept="image/*,.heic,.heif"][multiple]');
    const camera = sheet.locator('input[accept="image/*,.heic,.heif"][capture="environment"]');
    const videoInput = sheet.locator('input[accept="video/*,.mov,.mp4"]');
    const audioInput = sheet.locator('input[accept="audio/*,.m4a,.aac"]');
    await expect(gallery).toHaveCount(1);
    await expect(camera).toHaveCount(1);
    await expect(videoInput).toHaveCount(1);
    await expect(audioInput).toHaveCount(1);

    const photo = await readFile(photoPath);
    await gallery.setInputFiles({ name: "galleria.jpg", mimeType: "image/jpeg", buffer: photo });
    await camera.setInputFiles({ name: "scatto.jpg", mimeType: "image/jpeg", buffer: photo });
    await videoInput.setInputFiles({ name: "video.webm", mimeType: "video/webm", buffer: await readFile(videoPath) });
    await audioInput.setInputFiles({ name: "audio.wav", mimeType: "audio/wav", buffer: wave() });
    await expect(sheet.getByText("4 allegati pronti")).toBeVisible();

    const recorder = sheet.locator(".audioRecorder");
    await recorder.getByRole("button", { name: "Registra" }).tap();
    await expect(recorder.getByText("Registrazione in corso")).toBeVisible();
    await author.waitForTimeout(1_000);
    await recorder.getByRole("button", { name: "Ferma" }).tap();
    await expect(sheet.getByText("5 allegati pronti")).toBeVisible();

    await sheet.getByRole("button", { name: "Usa posizione" }).tap();
    await expect(sheet.getByText(/Posizione pronta:/)).toBeVisible({ timeout: 20_000 });
    const marker = `Pubblica completo ${Date.now()}`;
    await sheet.getByPlaceholder("Racconta questo momento…").fill(marker);
    const publishResponse = author.waitForResponse(
      (response) => response.url().endsWith("/api/posts") && response.request().method() === "POST",
    );
    await sheet.locator(".composerActions > button").tap();
    const response = await publishResponse;
    expect(response.status()).toBe(201);
    postId = (await response.json()).id;

    const ownerPost = author.locator(".post").filter({ hasText: marker });
    await expect(ownerPost).toBeVisible({ timeout: 20_000 });
    await expect(ownerPost.locator(".postPlace")).toBeVisible();
    await expect(ownerPost.locator(".postMediaCarousel img")).toHaveCount(2);
    await expect(ownerPost.locator("video")).toHaveCount(1);
    await expect(ownerPost.locator("audio")).toHaveCount(2);

    const publicPost = viewer.locator(".post").filter({ hasText: marker });
    await expect(publicPost).toBeVisible({ timeout: 25_000 });
    await expect(publicPost.locator(".postPlace")).toBeVisible();
    await expect(publicPost.locator(".postMediaCarousel img")).toHaveCount(2);
    await expect(publicPost.locator("video")).toHaveCount(1);
    await expect(publicPost.locator("audio")).toHaveCount(2);
    await expect(publicPost.getByRole("button", { name: "Altre opzioni" })).toHaveCount(0);
    expect((await viewer.request.delete(`${baseUrl}/api/posts/${postId}`)).status()).toBe(403);
  } finally {
    if (postId)
      await author.request.delete(`${baseUrl}/api/posts/${postId}`, {
        headers: { authorization: `Bearer ${sessionToken}`, "x-device-key": deviceKey },
      }).catch(() => {});
    await Promise.all([authorContext.close(), viewerContext.close()]);
  }
});
