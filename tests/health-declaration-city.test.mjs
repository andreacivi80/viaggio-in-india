import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cityFacts, days } from "../src/tripThailand.js";

const source = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");

test("tutte le tappe Thailandia espongono i dati amministrativi richiesti", () => {
  const visitedCities = [...new Set(days.map((day) => day.city))];
  assert.deepEqual(visitedCities, [
    "Bangkok", "Hua Hin", "Chumphon", "Khao Sok", "Cheow Lan Lake", "Phi Phi Island", "Krabi",
  ]);
  for (const city of visitedCities) {
    const declaration = cityFacts[city]?.healthDeclaration;
    assert.ok(declaration, `${city} deve avere la sezione sanitaria`);
    for (const field of ["state", "district", "mainCity", "region"])
      assert.ok(String(declaration[field] || "").trim(), `${city}: ${field} mancante`);
  }
});

test("il pannello città mostra i quattro campi sanitari con etichette accessibili", () => {
  assert.match(source, /aria-label="Dati per dichiarazione di salute"/);
  for (const label of ["Stato / territorio", "Distretto", "Città principale", "Regione"])
    assert.ok(source.includes(`<dt>${label}</dt>`), `${label} deve essere visibile`);
});
