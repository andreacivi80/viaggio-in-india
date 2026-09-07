import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const visibleLegacyCopy = [
  /10\s*[—-]\s*23\s*agosto/i,
  /dal\s+Rajasthan\s+al\s+Gange/i,
  /India\s+insieme/i,
  /Viaggio\s+in\s+India/i,
  /Rajasthan/i,
  /Gange|Ganga|Ganja/i,
  /New\s+Delhi|Nuova\s+Delhi|\bDelhi\b/i,
  /\bAgra\b|\bJaipur\b|\bVaranasi\b/i,
  /Taj\s+Mahal/i,
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
