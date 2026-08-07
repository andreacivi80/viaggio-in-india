import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");

test("tutte le tappe espongono i dati amministrativi richiesti dalla dichiarazione di salute", () => {
  const required = [
    ['Delhi', 'district: "South West Delhi"', 'mainCity: "New Delhi"'],
    ['Udaipur', 'district: "Udaipur"', 'state: "Rajasthan"'],
    ['Jodhpur', 'district: "Jodhpur"', 'state: "Rajasthan"'],
    ['Jaipur', 'district: "Jaipur"', 'state: "Rajasthan"'],
    ['Agra', 'district: "Agra"', 'state: "Uttar Pradesh"'],
    ['Varanasi', 'district: "Varanasi"', 'state: "Uttar Pradesh"'],
  ];
  for (const [city, district, stateOrCity] of required) {
    const start = source.indexOf(`  ${city}: {`);
    assert.notEqual(start, -1, `${city} deve essere presente`);
    const block = source.slice(start, start + 700);
    assert.match(block, /healthDeclaration:/, `${city} deve avere la sezione sanitaria`);
    assert.ok(block.includes(district), `${city}: distretto mancante`);
    assert.ok(block.includes(stateOrCity), `${city}: stato o città principale mancante`);
    assert.match(block, /region:/, `${city}: regione mancante`);
  }
});

test("il pannello città mostra i quattro campi sanitari con etichette accessibili", () => {
  assert.match(source, /aria-label="Dati per dichiarazione di salute"/);
  for (const label of ["Stato / territorio", "Distretto", "Città principale", "Regione"]) {
    assert.ok(source.includes(`<dt>${label}</dt>`), `${label} deve essere visibile`);
  }
});
