import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const manifest = JSON.parse(await readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
const source = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");

test("i metadati iPhone dichiarano una PWA installabile e standalone", () => {
  assert.match(html, /name="viewport"[\s\S]*?viewport-fit=cover/);
  assert.match(html, /name="apple-mobile-web-app-capable" content="yes"/);
  assert.match(html, /name="apple-mobile-web-app-status-bar-style" content="black-translucent"/);
  assert.match(html, /name="apple-mobile-web-app-title" content="Thailandia Insieme"/);
  assert.match(html, /rel="apple-touch-icon"/);
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, ".");
  assert.ok(manifest.icons.some((icon) => /maskable/.test(icon.purpose || "")));
});

test("la selezione iPhone copre le due componenti di una Live Photo", () => {
  assert.match(source, /accept="image\/\*,\.heic,\.heif"/);
  assert.match(source, /accept="video\/\*,\.mov,\.mp4"/);
  assert.match(source, /image\\\/\(heic\|heif\)/);
  assert.match(source, /import\("heic2any"\)/);
});

test("l'interfaccia pubblica espone nomi accessibili alle funzioni principali", () => {
  for (const label of [
    "Apri elenco viaggiatori",
    "Apri la cartina di provenienza dei viaggiatori",
    "Attività recenti",
    "Cerca nei commenti",
    "Invia commento",
  ]) assert.match(source, new RegExp(`aria-label=[^\\n]*${label}`));
});
