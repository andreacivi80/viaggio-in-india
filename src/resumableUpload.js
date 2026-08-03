const DEFAULT_PART_SIZE = 4 * 1024 * 1024;
const LARGE_FILE_THRESHOLD = 8 * 1024 * 1024;
const manifestKey = (file, scope, visibility) =>
  `india-upload:${scope}:${visibility}:${file.name}:${file.size}:${file.lastModified}`;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const shouldUseResumableUpload = (file) => file.size >= LARGE_FILE_THRESHOLD;

async function checkedJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Caricamento non riuscito (${response.status})`);
  return payload;
}

async function requestWithRetry(url, options, attempts = 5) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status < 500) return response;
      lastError = new Error(`Errore temporaneo ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts - 1) await wait(Math.min(8000, 500 * 2 ** attempt));
  }
  throw lastError;
}

export async function uploadFileResumable({
  api = "/api",
  file,
  scope,
  visibility = "private",
  headers = {},
  onProgress = () => {},
}) {
  const key = manifestKey(file, scope, visibility);
  let manifest;
  try { manifest = JSON.parse(localStorage.getItem(key) || "null"); } catch { manifest = null; }
  if (manifest?.upload_id) {
    const status = await requestWithRetry(`${api}/uploads/${manifest.upload_id}`, { headers });
    if (status.ok) {
      const current = await status.json();
      manifest.part_size = current.part_size || DEFAULT_PART_SIZE;
      manifest.uploaded_parts = current.uploaded_parts || [];
    } else manifest = null;
  }
  if (!manifest) {
    manifest = await checkedJson(await requestWithRetry(`${api}/uploads/init`, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify({
        scope,
        visibility,
        file_name: file.name,
        file_size: file.size,
        content_type: file.type || "application/octet-stream",
      }),
    }));
    manifest.uploaded_parts = [];
  }
  localStorage.setItem(key, JSON.stringify(manifest));
  const partSize = manifest.part_size || DEFAULT_PART_SIZE;
  const completed = new Set((manifest.uploaded_parts || []).map((part) => Number(part.part_number)));
  const totalParts = Math.ceil(file.size / partSize);
  for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
    if (completed.has(partNumber)) {
      onProgress(Math.min(100, Math.round((partNumber * partSize / file.size) * 100)));
      continue;
    }
    const chunk = file.slice((partNumber - 1) * partSize, Math.min(file.size, partNumber * partSize));
    const uploaded = await checkedJson(await requestWithRetry(
      `${api}/uploads/${manifest.upload_id}/parts/${partNumber}`,
      { method: "PUT", headers: { "content-type": "application/octet-stream", ...headers }, body: chunk },
    ));
    manifest.uploaded_parts.push(uploaded);
    localStorage.setItem(key, JSON.stringify(manifest));
    onProgress(Math.round((Math.min(file.size, partNumber * partSize) / file.size) * 100));
  }
  const result = await checkedJson(await requestWithRetry(
    `${api}/uploads/${manifest.upload_id}/complete`,
    { method: "POST", headers },
  ));
  localStorage.removeItem(key);
  return result;
}
