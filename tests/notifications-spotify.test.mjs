import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { spotifyLink, splitSpotifyCaption } from "../src/spotify.js";

const ui = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
const headers = await readFile(new URL("../public/_headers", import.meta.url), "utf8");

test("il centro notifiche distingue nuove e viste e consente eliminazione singola o totale", () => {
  assert.match(ui, /india-activity-dismissed/);
  assert.match(ui, /Nuova" : "Già vista/);
  assert.match(ui, /const dismissActivity = \(id\)/);
  assert.match(ui, /const clearActivity = \(\)/);
  assert.match(ui, /Cancella tutte/);
  assert.match(ui, /Elimina notifica di/);
  assert.match(ui, /<b>Nell’app<\/b><small>Sempre attivi<\/small>/);
  assert.match(ui, /pushEnabled \? "Attive" : "Non attive"/);
});

test("gli avvisi nell'app scadono dopo trenta giorni e le menzioni sono riconoscibili", () => {
  assert.match(ui, /30 \* 86400000/);
  assert.match(ui, /Ti ha menzionato in un commento/);
  assert.match(ui, /Ha messo Mi piace a un ricordo/);
  assert.match(ui, /activityItems\.slice\(0, 12\)/);
});

test("un link Spotify ufficiale diventa un embed sicuro e mantiene la didascalia", () => {
  const result = splitSpotifyCaption(
    "La canzone del viaggio\nhttps://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl?si=test",
  );
  assert.equal(result.caption, "La canzone del viaggio");
  assert.deepEqual(result.spotify, {
    url: "https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl",
    embedUrl: "https://open.spotify.com/embed/track/11dFghVXANMlKmJXsNCbNl?utm_source=generator",
  });
});

test("link esterni camuffati non vengono incorporati come Spotify", () => {
  for (const value of [
    "https://example.com/track/11dFghVXANMlKmJXsNCbNl",
    "javascript:alert(1)",
    "https://open.spotify.com.evil.example/track/abc",
  ]) assert.equal(spotifyLink(value), null);
});

test("la policy del sito permette esclusivamente il lettore Spotify ufficiale", () => {
  assert.match(headers, /frame-src https:\/\/www\.google\.com https:\/\/open\.spotify\.com/);
  assert.doesNotMatch(headers, /frame-src[^;]*spotify\.com\.evil/);
});
