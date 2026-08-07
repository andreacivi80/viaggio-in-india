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
    addText("LEGGIMI.txt", "Archivio Viaggio in India. Contiene le pubblicazioni e i contenuti multimediali visibili a questo utente al momento del download. I documenti privati non sono inclusi.\n");
    addText("pubblicazioni.json", JSON.stringify(manifest, null, 2));
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
