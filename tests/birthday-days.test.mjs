import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const source = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
const itinerary = await readFile(new URL("../src/tripThailand.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("la nuova partenza non mostra compleanni finché non vengono forniti", () => {
  assert.doesNotMatch(itinerary, /birthdays\s*:/);
  assert.match(itinerary, /2026-12-26/);
  assert.match(itinerary, /2027-01-05/);
});

test("il compleanno resta visibile anche senza profilo e usa la foto quando disponibile", () => {
  assert.match(source, /className="dayBirthdayRibbon"/);
  assert.match(source, /birthdayProfile\(people, birthday\.name\)/);
  assert.match(source, /profile\?\.avatar_url/);
  assert.match(source, /birthday\.name\[0\]/);
  assert.match(source, /birthday-party-we-road-v1\.jpg/);
  assert.match(source, /Gruppo di viaggiatori WEROAD in festa in Thailandia/);
  assert.doesNotMatch(source, /birthdayWeRoadLogo/);
  assert.match(styles, /\.dayBirthdayRibbon\s*\{/);
});

test("la scena WEROAD ottimizzata resta leggera per la rete mobile", async () => {
  const image = await stat(new URL("../public/ui/birthday-party-we-road-v1.jpg", import.meta.url));
  assert.ok(image.size > 150_000);
  assert.ok(image.size < 400_000);
  assert.match(styles, /\.birthdayPartyScene[^}]*aspect-ratio:\s*2\s*\/\s*1/s);
  assert.match(styles, /\.heroWeRoadWordmark[^}]*min-width:\s*48px/s);
  assert.doesNotMatch(styles, /\.heroWeRoadLogo\s*\{/);
});
