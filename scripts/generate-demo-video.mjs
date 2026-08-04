import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const image = readFileSync(new URL("../public/cities/india-insieme-collage.png", import.meta.url)).toString("base64");
const audio = readFileSync(new URL("../public/audio/india-insieme-demo.wav", import.meta.url)).toString("base64");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const encoded = await page.evaluate(async ({ imageBase64, audioBase64 }) => {
  const image = new Image();
  image.src = `data:image/png;base64,${imageBase64}`;
  await image.decode();
  const audioBytes = Uint8Array.from(atob(audioBase64), (character) => character.charCodeAt(0));
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(audioBytes.buffer);
  const destination = audioContext.createMediaStreamDestination();
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(destination);
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const context = canvas.getContext("2d");
  const videoStream = canvas.captureStream(24);
  const stream = new MediaStream([...videoStream.getVideoTracks(), ...destination.stream.getAudioTracks()]);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
    ? "video/webm;codecs=vp9,opus"
    : "video/webm";
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2_400_000 });
  const chunks = [];
  recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
  const stopped = new Promise((resolve) => (recorder.onstop = resolve));
  recorder.start(250);
  source.start();
  const started = performance.now();
  const duration = 8000;
  await new Promise((resolve) => {
    const draw = (now) => {
      const progress = Math.min(1, (now - started) / duration);
      const scale = 1.02 + progress * 0.06;
      const width = canvas.width * scale;
      const height = canvas.height * scale;
      context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      context.fillStyle = `rgba(7, 30, 24, ${0.08 + progress * 0.08})`;
      context.fillRect(0, 0, canvas.width, canvas.height);
      if (progress < 1) requestAnimationFrame(draw);
      else resolve();
    };
    requestAnimationFrame(draw);
  });
  recorder.stop();
  source.stop();
  await stopped;
  await audioContext.close();
  const bytes = new Uint8Array(await new Blob(chunks, { type: mimeType }).arrayBuffer());
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(binary);
}, { imageBase64: image, audioBase64: audio });
await browser.close();
mkdirSync(new URL("../public/video/", import.meta.url), { recursive: true });
writeFileSync(new URL("../public/video/india-insieme-demo.webm", import.meta.url), Buffer.from(encoded, "base64"));
