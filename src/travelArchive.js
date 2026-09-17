const safePart = (value, fallback = "contenuto") => {
  const cleaned = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return cleaned || fallback;
};

const extensionFor = (media = {}) => {
  const original = String(media.media_name || "").match(/\.([a-zA-Z0-9]{1,8})$/)?.[1];
  if (original) return original.toLowerCase();
  const type = String(media.media_type || "").toLowerCase();
  if (type.includes("jpeg")) return "jpg";
  if (type.includes("quicktime")) return "mov";
  if (type.includes("mpeg")) return type.startsWith("audio/") ? "mp3" : "mp4";
  return type.split("/")[1]?.replace(/[^a-z0-9]/g, "") || "bin";
};

export function visibleArchiveMedia(posts = []) {
  const items = [];
  const seen = new Set();
  const add = (media, folder, fallbackName) => {
    if (!media?.media_url || seen.has(media.media_url)) return;
    seen.add(media.media_url);
    const extension = extensionFor(media);
    const baseName = safePart(String(media.media_name || "").replace(/\.[^.]+$/, ""), fallbackName);
    items.push({ ...media, archivePath: `${folder}/${baseName}.${extension}` });
  };
  posts.forEach((post, postIndex) => {
    const day = Number(post.day_index);
    const dayFolder = day < 0 ? "pre-partenza" : `giorno-${String(day + 1).padStart(2, "0")}`;
    const postFolder = `${dayFolder}/pubblicazione-${String(postIndex + 1).padStart(3, "0")}`;
    const media = post.media?.length
      ? post.media
      : post.media_url
        ? [{ media_url: post.media_url, media_type: post.media_type, media_name: post.media_name }]
        : [];
    media.forEach((item, index) => add(item, postFolder, `contenuto-${index + 1}`));
    (post.comments || []).forEach((comment, index) => add(comment, `${postFolder}/commenti`, `allegato-${index + 1}`));
  });
  return items;
}

const escapeHtml = (value) => String(value || "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

export function createOfflineAlbumHtml(posts = [], media = visibleArchiveMedia(posts)) {
  const pathByUrl = new Map(media.map((item) => [item.media_url, item.archivePath]));
  const mediaMarkup = (item) => {
    const path = pathByUrl.get(item?.media_url);
    if (!path) return "";
    const type = String(item.media_type || "");
    const source = escapeHtml(path);
    if (type.startsWith("image/")) return `<img src="${source}" alt="${escapeHtml(item.media_name || "Foto del viaggio")}" loading="lazy">`;
    if (type.startsWith("video/")) return `<video src="${source}" controls preload="metadata"></video>`;
    if (type.startsWith("audio/")) return `<audio src="${source}" controls preload="metadata"></audio>`;
    return `<a href="${source}">${escapeHtml(item.media_name || "Apri allegato")}</a>`;
  };
  const cards = posts.map((post) => {
    const postMedia = post.media?.length
      ? post.media
      : post.media_url
        ? [{ media_url: post.media_url, media_type: post.media_type, media_name: post.media_name }]
        : [];
    const comments = (post.comments || []).map((comment) =>
      `<li><b>${escapeHtml(comment.author_name || "Ospite")}</b> ${escapeHtml(comment.text || "")}${mediaMarkup(comment)}</li>`,
    ).join("");
    return `<article><header><b>${escapeHtml(post.author_name || "Viaggiatore")}</b><small>${escapeHtml(post.created_at || "")}</small></header><p>${escapeHtml(post.text || "")}</p>${postMedia.map(mediaMarkup).join("")}${comments ? `<ul>${comments}</ul>` : ""}</article>`;
  }).join("");
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'"><title>Album offline · Thailandia Insieme</title><style>body{max-width:760px;margin:auto;padding:20px;font:16px system-ui;background:#f7f3ea;color:#17241f}h1{color:#c6531c}article{margin:16px 0;padding:16px;border-radius:16px;background:#fff;box-shadow:0 5px 20px #0001}header{display:flex;justify-content:space-between;gap:12px}small{color:#66736c}img,video{display:block;width:100%;max-height:70vh;object-fit:contain;margin:12px 0;border-radius:12px;background:#111}audio{width:100%;margin:12px 0}li{margin:8px 0}</style></head><body><h1>Thailandia Insieme</h1><p>Album consultabile senza connessione. Include soltanto i contenuti visibili al momento del download.</p>${cards || "<p>Nessuna pubblicazione disponibile.</p>"}</body></html>`;
}

export async function createTravelArchive({ posts = [], requestHeaders = {}, fetchImpl = fetch, onProgress = () => {} }) {
  const { Zip, ZipPassThrough, strToU8 } = await import("fflate");
  const media = visibleArchiveMedia(posts);
  const chunks = [];
  const failed = [];
  let completed = 0;
  const archivePromise = new Promise((resolve, reject) => {
    const zip = new Zip((error, data, final) => {
      if (error) return reject(error);
      chunks.push(data);
      if (final) resolve(new Blob(chunks, { type: "application/zip" }));
    });
    const addText = (name, value) => {
      const entry = new ZipPassThrough(name);
      zip.add(entry);
      entry.push(strToU8(value), true);
    };
    const manifest = posts.map((post) => ({
      id: post.id,
      autore: post.author_name || "",
      data: post.created_at || "",
      giorno: Number(post.day_index),
      visibilita: post.visibility || "public",
      luogo: post.place_name || "",
      testo: post.text || "",
      commenti: (post.comments || []).map((comment) => ({
        autore: comment.author_name || "",
        data: comment.created_at || "",
        testo: comment.text || "",
      })),
    }));
    addText("LEGGIMI.txt", "Archivio Viaggio in Thailandia. Contiene le pubblicazioni e i contenuti multimediali visibili a questo utente al momento del download. I documenti privati non sono inclusi.\n");
    addText("pubblicazioni.json", JSON.stringify(manifest, null, 2));
    addText("album-offline.html", createOfflineAlbumHtml(posts, media));
    (async () => {
      for (const item of media) {
        try {
          const response = await fetchImpl(item.media_url, { headers: requestHeaders, cache: "no-store" });
          if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
          const entry = new ZipPassThrough(item.archivePath);
          zip.add(entry);
          const reader = response.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            entry.push(value, false);
          }
          entry.push(new Uint8Array(0), true);
        } catch {
          failed.push(item.archivePath);
        }
        completed += 1;
        onProgress({ completed, total: media.length, failed: failed.length });
      }
      if (failed.length) addText("contenuti-non-disponibili.txt", failed.join("\n"));
      zip.end();
    })().catch(reject);
  });
  return { blob: await archivePromise, total: media.length, failed };
}
