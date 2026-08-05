import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("i quattro compleanni sono associati alle giornate del viaggio", () => {
  assert.match(source, /Lun 10 ago[\s\S]*Antonella[\s\S]*age:\s*26[\s\S]*Ludovica[\s\S]*age:\s*28/);
  assert.match(source, /Lun 17 ago[\s\S]*Paolo[\s\S]*age:\s*37/);
  assert.match(source, /Ven 21 ago[\s\S]*Davide Spinaci[\s\S]*age:\s*29/);
});

test("il compleanno resta visibile anche senza profilo e usa la foto quando disponibile", () => {
  assert.match(source, /className="dayBirthdayRibbon"/);
  assert.match(source, /birthdayProfile\(people, birthday\.name\)/);
  assert.match(source, /profile\?\.avatar_url/);
  assert.match(source, /birthday\.name\[0\]/);
  assert.match(source, /birthday-party-we-road-v1\.jpg/);
  assert.match(source, /Gruppo di viaggiatori WEROAD in festa in India/);
  assert.match(source, /birthdayWeRoadLogo/);
  assert.match(source, /weroad-logo\.png/);
  assert.match(styles, /\.dayBirthdayRibbon\s*\{/);
});
