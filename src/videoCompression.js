export const VIDEO_COMPRESSION_THRESHOLD = 25 * 1024 * 1024;
export const shouldCompressVideo = (file) =>
  file instanceof Blob && String(file.type || "").startsWith("video/") && file.size > VIDEO_COMPRESSION_THRESHOLD;

const waitFor = (target, success, failure) => new Promise((resolve, reject) => {
  const done = () => { cleanup(); resolve(); };
  const failed = () => { cleanup(); reject(new Error("Video non leggibile")); };
  const cleanup = () => {
    target.removeEventListener(success, done);
    target.removeEventListener(failure, failed);
  };
  target.addEventListener(success, done, { once: true });
  target.addEventListener(failure, failed, { once: true });
});

const preferredMimeType = (Recorder) => [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4",
].find((type) => Recorder.isTypeSupported?.(type)) || "";

export async function compressMobileVideo(file, {
  onProgress = () => {},
  documentRef = globalThis.document,
  Recorder = globalThis.MediaRecorder,
  urlApi = URL,
} = {}) {
  if (!shouldCompressVideo(file) || typeof Recorder !== "function") return file;
  const mimeType = preferredMimeType(Recorder);
  if (!mimeType) throw new Error("Nessun formato di compressione supportato");
  const video = documentRef.createElement("video");
  const objectUrl = urlApi.createObjectURL(file);
  let timer;
  try {
    video.preload = "auto";
    video.playsInline = true;
    video.muted = true;
    video.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none";
    documentRef.body?.appendChild(video);
    video.src = objectUrl;
    await waitFor(video, "loadeddata", "error");
    const duration = Number(video.duration);
    const capture = video.captureStream || video.mozCaptureStream;
    if (!Number.isFinite(duration) || duration <= 0) throw new Error("Durata video non disponibile");
    if (typeof capture !== "function") throw new Error("Il browser non consente la ricodifica video");
    await video.play();
    video.pause();
    video.currentTime = 0;
    const stream = capture.call(video);
    if (!stream.getTracks().length) throw new Error("Tracce video non disponibili");
    const chunks = [];
    const recorder = new Recorder(stream, {
      mimeType,
      videoBitsPerSecond: 1_600_000,
      audioBitsPerSecond: 96_000,
    });
    recorder.addEventListener("dataavailable", (event) => event.data?.size && chunks.push(event.data));
    const stopped = waitFor(recorder, "stop", "error");
    recorder.start(250);
    timer = setInterval(() => onProgress(Math.min(99, Math.round((video.currentTime / duration) * 100))), 250);
    await video.play();
    await waitFor(video, "ended", "error");
    recorder.stop();
    await stopped;
    onProgress(100);
    const blob = new Blob(chunks, { type: mimeType });
    if (!blob.size) throw new Error("Il browser ha prodotto un video vuoto");
    if (blob.size >= file.size) return file;
    const extension = mimeType.startsWith("video/mp4") ? "mp4" : "webm";
    const base = String(file.name || "video").replace(/\.[^.]+$/, "");
    return new File([blob], `${base}-ridotto.${extension}`, {
      type: mimeType.split(";")[0],
      lastModified: Date.now(),
    });
  } catch (error) {
    throw new Error(`Compressione non riuscita: ${error?.message || "errore del browser"}`);
  } finally {
    clearInterval(timer);
    video.pause?.();
    video.removeAttribute?.("src");
    video.load?.();
    video.remove?.();
    urlApi.revokeObjectURL(objectUrl);
  }
}
