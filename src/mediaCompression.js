export const PHOTO_MAX_EDGE = 2560;
export const PHOTO_COMPRESSION_THRESHOLD = 2 * 1024 * 1024;

export function scaledPhotoSize(width, height, maxEdge = PHOTO_MAX_EDGE) {
  const safeWidth = Math.max(1, Number(width) || 1);
  const safeHeight = Math.max(1, Number(height) || 1);
  const scale = Math.min(1, maxEdge / Math.max(safeWidth, safeHeight));
  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
  };
}

export const shouldCompressPhoto = (file) =>
  file instanceof Blob &&
  /image\/(?:jpeg|jpg|webp)/i.test(String(file.type || "")) &&
  Number(file.size || 0) > PHOTO_COMPRESSION_THRESHOLD;

export async function compressMobilePhoto(
  file,
  {
    createBitmap = globalThis.createImageBitmap,
    canvasFactory = () => document.createElement("canvas"),
    fileFactory = (parts, name, options) => new File(parts, name, options),
  } = {},
) {
  if (!shouldCompressPhoto(file) || typeof createBitmap !== "function") return file;
  let bitmap;
  try {
    bitmap = await createBitmap(file, { imageOrientation: "from-image" });
    const size = scaledPhotoSize(bitmap.width, bitmap.height);
    const canvas = canvasFactory();
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, size.width, size.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
    if (!blob || blob.size >= file.size) return file;
    const baseName = String(file.name || "foto").replace(/\.[^.]+$/, "");
    return fileFactory([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Number(file.lastModified || Date.now()),
    });
  } catch {
    return file;
  } finally {
    bitmap?.close?.();
  }
}
