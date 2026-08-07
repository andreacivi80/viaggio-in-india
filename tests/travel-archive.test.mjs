import test from "node:test";
import assert from "node:assert/strict";
import { strFromU8, unzipSync } from "fflate";
import { createTravelArchive, visibleArchiveMedia } from "../src/travelArchive.js";

const posts = [{
  id: "post-1",
  author_name: "Andrea",
  day_index: 0,
  visibility: "group",
  text: "Primo giorno",
  media: [
    { media_url: "/api/media/foto", media_type: "image/jpeg", media_name: "Delhi.jpg" },
    { media_url: "/api/media/audio", media_type: "audio/mpeg", media_name: "Voce.mp3" },
  ],
  comments: [{
    author_name: "Sara",
    text: "Risposta",
    media_url: "/api/media/video",
    media_type: "video/mp4",
    media_name: "Saluto.mp4",
  }],
}];

test("l’archivio comprende pubblicazioni, foto, audio e video visibili", async () => {
  assert.equal(visibleArchiveMedia(posts).length, 3);
  const requested = [];
  const { blob, total, failed } = await createTravelArchive({
    posts,
    requestHeaders: { authorization: "Bearer gruppo" },
    fetchImpl: async (url, options) => {
      requested.push({ url, options });
      return new Response(new TextEncoder().encode(`contenuto:${url}`), { status: 200 });
    },
  });
  assert.equal(total, 3);
  assert.deepEqual(failed, []);
  assert.equal(requested.length, 3);
  assert.ok(requested.every(({ options }) => options.headers.authorization === "Bearer gruppo"));
  const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
  assert.ok(files["LEGGIMI.txt"]);
  assert.ok(files["pubblicazioni.json"]);
  assert.match(strFromU8(files["pubblicazioni.json"]), /Primo giorno/);
  assert.ok(Object.keys(files).some((name) => name.endsWith("Delhi.jpg")));
  assert.ok(Object.keys(files).some((name) => name.endsWith("Voce.mp3")));
  assert.ok(Object.keys(files).some((name) => name.endsWith("Saluto.mp4")));
});

test("un contenuto temporaneamente indisponibile non annulla tutto il download", async () => {
  const { blob, failed } = await createTravelArchive({
    posts,
    fetchImpl: async (url) => url.endsWith("audio")
      ? new Response("non disponibile", { status: 503 })
      : new Response(new Uint8Array([1, 2, 3]), { status: 200 }),
  });
  assert.equal(failed.length, 1);
  const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
  assert.match(strFromU8(files["contenuti-non-disponibili.txt"]), /Voce\.mp3/);
});

test("il comando resta dentro il Gruppo protetto da sessione personale", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) => readFile(new URL("../src/main.jsx", import.meta.url), "utf8"));
  assert.match(source, /tab === "people" && verifiedSessionToken[\s\S]*?<People/);
  assert.match(source, /tab === "people" && !verifiedSessionToken[\s\S]*?Gruppo privato/);
  assert.match(source, /function People\([\s\S]*?Scarica dati/);
});
