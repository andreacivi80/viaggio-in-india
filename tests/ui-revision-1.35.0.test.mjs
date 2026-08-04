import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = await readFile(new URL("src/main.jsx", root), "utf8");
const styles = await readFile(new URL("src/styles.css", root), "utf8");

test("il Gruppo non viene montato senza una sessione verificata", () => {
  assert.match(source, /tab === "people" && verifiedSessionToken &&/);
  assert.match(source, /tab === "people" && !verifiedSessionToken &&/);
  assert.match(source, /Accesso privato richiesto/);
});

test("la scelta del ruolo comunica e mostra lo stato selezionato", () => {
  assert.match(source, /aria-pressed=\{bootstrapForm\.role === "traveler"\}/);
  assert.match(source, /aria-pressed=\{bootstrapForm\.role === "coordinator"\}/);
  assert.match(styles, /\.roleChoice button\[aria-pressed="true"\]/);
});

test("le fotografie social sono adattate senza ritaglio", () => {
  assert.match(styles, /\.postMediaSlide > img[\s\S]*?object-fit: contain/);
  assert.doesNotMatch(styles, /\.postMediaSlide > img[\s\S]{0,240}?object-fit: cover/);
});

test("l'audio associato alla foto usa i controlli per la riproduzione in background", () => {
  assert.match(source, /function BackgroundAudio/);
  assert.match(source, /navigator\.mediaSession\.metadata/);
  assert.match(source, /setActionHandler\("play"/);
  assert.match(source, /className="photoAudioOverlay"[\s\S]*?<BackgroundAudio/);
});

test("graffetta e invio usano i controlli compatti della revisione 1.37.3", () => {
  assert.match(styles, /\.reply label,\s*\n\s*\.reply button \{\s*\n\s*width: 36px;\s*\n\s*height: 36px;/);
  assert.match(styles, /\.reply label svg,\s*\n\s*\.reply button svg \{\s*\n\s*width: 13px;\s*\n\s*height: 13px;/);
});

test("Apri documento usa un visualizzatore interno e mantiene il download", () => {
  assert.match(source, /documentPreviewOverlay\$\{/);
  assert.match(source, /documentPreview\.type === "application\/pdf"/);
  assert.match(source, /documentPreview\.type\.startsWith\("image\/"\)/);
  assert.match(source, /download=\{documentPreview\.name\}/);
  assert.doesNotMatch(source, /window\.open\("about:blank"/);
});
