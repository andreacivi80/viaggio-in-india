import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const main = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const demo = await readFile(new URL("../demo/media-1.37.3.html", import.meta.url), "utf8");

test("il feed usa il lettore video social senza controls nativi", () => {
  assert.match(main, /function SocialVideo/);
  assert.match(main, /<SocialVideo[\s\S]*src=\{item\.media_url\}/);
  const component = main.slice(main.indexOf("function SocialVideo"), main.indexOf("function PostMedia"));
  assert.doesNotMatch(component, /<video[^>]*\bcontrols\b/);
  assert.match(component, /aria-label="Posizione del video"/);
  assert.match(styles, /\.socialVideoControls/);
});

test("foto con audio usa il lettore compatto e riproducibile", () => {
  assert.match(main, /<BackgroundAudio\s+compact/);
  assert.match(main, /compactAudioPlay/);
  assert.match(main, /audio\.play\(\)/);
  assert.match(styles, /\.compactAudioWave/);
});

test("pubblicazione accetta video e audio multipli dal telefono", () => {
  assert.match(main, /accept="video\/\*,\.mov,\.mp4"[\s\S]*multiple/);
  assert.match(main, /accept="audio\/\*,\.m4a,\.aac"[\s\S]*multiple/);
  assert.match(main, /addFiles\(e\.target\.files\)/);
});

test("la demo contiene tre lettori reali", () => {
  assert.equal((demo.match(/class="[^"]*player/g) || []).length >= 3, true);
  assert.match(demo, /SoundHelix-Song-1\.mp3/);
  assert.match(demo, /mov_bbb\.mp4/);
  assert.match(demo, /3\/3 lettori avviati correttamente/);
});
