const mediaLimit = (type = "") =>
  type.startsWith("video/") ? 500 * 1024 * 1024 : 120 * 1024 * 1024;

const readableSize = (bytes) => `${(Number(bytes || 0) / 1024 / 1024).toFixed(1)} MB`;

export function validateMediaSelection(file) {
  if (!file || typeof file.name !== "string")
    return "Il file selezionato non è leggibile.";
  const type = String(file.type || "").toLowerCase();
  const heicByName = /\.(heic|heif)$/i.test(file.name);
  const allowed = /^(image|video|audio)\//.test(type) || heicByName;
  if (!allowed || type === "image/svg+xml")
    return `File “${file.name}” non supportato (${type || "tipo sconosciuto"}, ${readableSize(file.size)}). Usa una foto, un video o un audio del telefono.`;
  if (!Number(file.size))
    return `Il file “${file.name}” è vuoto e non può essere caricato.`;
  const limit = mediaLimit(type || (heicByName ? "image/heic" : ""));
  if (file.size > limit)
    return `File “${file.name}” troppo grande: ${readableSize(file.size)}. Il limite è ${Math.round(limit / 1024 / 1024)} MB.`;
  return "";
}
