import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const visibleLegacyCopy = [
  /\bIndia\b/,
  /\bindian[oaie]\b/i,
  /10\s*[—-]\s*23\s*agosto/i,
  /\b10\s+agosto\b|\b23\s+agosto\b/i,
  /dal\s+Rajasthan\s+al\s+Gange/i,
  /India\s+insieme/i,
  /Viaggio\s+in\s+India/i,
  /Rajasthan/i,
  /Gange|Ganga|Ganja/i,
  /New\s+Delhi|Nuova\s+Delhi|\bDelhi\b/i,
  /\bAgra\b|\bJaipur\b|\bVaranasi\b/i,
  /\bJodhpur\b|\bUdaipur\b|\bRanakpur\b/i,
  /Taj\s+Mahal/i,
  /Rockland|Rajwara|Akshay\s+Niwas|Wall\s+Street\s+Beacon|Taj\s+Vilas|Costa\s+River/i,
  /Asia\/Kolkata|Ora\s+India/i,
];

test("il pacchetto pubblico non contiene testi visibili del vecchio viaggio in India", () => {
  const assets = readdirSync("dist/assets")
    .filter((file) => file.endsWith(".js"))
    .map((file) => `dist/assets/${file}`);
  const bundle = ["dist/index.html", ...assets]
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
  for (const pattern of visibleLegacyCopy) assert.doesNotMatch(bundle, pattern);
  assert.match(bundle, /26 DICEMBRE 2026/);
  assert.match(bundle, /da Bangkok al Mare delle Andamane/);
});

test("sorgente attivo e seed non conservano contenuti del vecchio itinerario", () => {
  const activeSources = [
    "src/main.jsx",
    "src/tripThailand.js",
    "functions/api/[[path]].js",
    "db/schema.sql",
    "db/reset-for-release.sql",
  ].map((file) => readFileSync(file, "utf8")).join("\n");
  for (const pattern of visibleLegacyCopy) assert.doesNotMatch(activeSources, pattern);
  assert.match(activeSources, /Thailandia insieme/);
  assert.match(activeSources, /Bangkok/);
});

test("gli asset pubblici del vecchio itinerario sono stati rimossi", () => {
  for (const path of [
    "public/cities/agra.jpg",
    "public/cities/delhi.jpg",
    "public/cities/india-flag-real.png",
    "public/cities/india-insieme-collage.png",
    "public/cities/jaipur.jpg",
    "public/cities/jodhpur.jpg",
    "public/cities/ranakpur.jpg",
    "public/cities/taj-hero-v2.webp",
    "public/cities/udaipur.jpg",
    "public/cities/varanasi.jpg",
    "public/cities/SOURCES.md",
  ]) assert.equal(existsSync(path), false, `${path} non deve essere pubblicato`);
});
