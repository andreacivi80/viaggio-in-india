const loadBitmap = async (file) => {
  if (typeof createImageBitmap === "function") return createImageBitmap(file);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
};

const canvasBlob = (canvas, type) => new Promise((resolve, reject) =>
  canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Immagine non modificabile")), type, 0.9),
);

export async function editPhoto(file, { rotate = 0, cropSquare = false } = {}) {
  if (!file?.type?.startsWith("image/")) throw new Error("Seleziona una fotografia");
  const bitmap = await loadBitmap(file);
  const sourceWidth = bitmap.naturalWidth || bitmap.width;
  const sourceHeight = bitmap.naturalHeight || bitmap.height;
  const side = cropSquare ? Math.min(sourceWidth, sourceHeight) : null;
  const sx = cropSquare ? Math.floor((sourceWidth - side) / 2) : 0;
  const sy = cropSquare ? Math.floor((sourceHeight - side) / 2) : 0;
  const sw = side || sourceWidth;
  const sh = side || sourceHeight;
  const quarterTurn = Math.abs(rotate) % 180 === 90;
  const canvas = document.createElement("canvas");
  canvas.width = quarterTurn ? sh : sw;
  canvas.height = quarterTurn ? sw : sh;
  const context = canvas.getContext("2d", { alpha: false });
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((rotate * Math.PI) / 180);
  context.drawImage(bitmap, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
  bitmap.close?.();
  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await canvasBlob(canvas, outputType);
  const extension = outputType === "image/png" ? "png" : "jpg";
  const base = String(file.name || "foto").replace(/\.[^.]+$/, "");
  return new File([blob], `${base}-modificata.${extension}`, {
    type: outputType,
    lastModified: Date.now(),
  });
}
