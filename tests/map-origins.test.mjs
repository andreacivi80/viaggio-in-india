import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("Mantova e gli alias italiani principali sono localizzati", () => {
  assert.match(source, /mantova:\s*\[10\.7914,\s*45\.1564\]/);
  assert.match(source, /mantua:\s*\[10\.7914,\s*45\.1564\]/);
  assert.match(source, /places\/search\?q=/);
  assert.match(source, /longitude\) >= 6\.4[\s\S]*latitude\) <= 47\.2/);
});

test("i punti italiani rimangono compatti anche con conteggi a due cifre", () => {
  assert.match(styles, /\.italyOriginMarker\s*\{[^}]*width:\s*28px;[^}]*height:\s*28px;[^}]*font-size:\s*11px;/s);
});

test("le icone della mappa generale sono ancorate a tratte reali", () => {
  for (const reference of ["DEL–UDR", "Udaipur–Jodhpur", "Agra–Varanasi", "Varanasi", "Jodhpur"])
    assert.ok(source.includes(`"${reference}"`), `riferimento mancante: ${reference}`);
  assert.match(source, /node\.dataset\.routeReference = reference/);
  for (const [reference, stage] of [["DEL–UDR", "2"], ["Udaipur–Jodhpur", "3"], ["Agra–Varanasi", "6"], ["Varanasi", "7"], ["Jodhpur", "4"]])
    assert.ok(source.includes(`"${reference}", "${stage}"`), `${reference} non è vicino alla tappa ${stage}`);
  assert.match(source, /node\.dataset\.nearStage = nearStage/);
});

test("la legenda dei mezzi non copre più la scala chilometrica", () => {
  assert.match(styles, /\.overviewRouteLegend\s*\{[^}]*top:\s*9px;[^}]*bottom:\s*auto;/s);
});

test("i nomi delle città non dipendono dalle etichette della cartografia esterna", () => {
  assert.match(source, /className = "tripCityNameLabel"/);
  assert.match(source, /node\.dataset\.cityName = name/);
  for (const city of ["Delhi", "Udaipur", "Ranakpur", "Jodhpur", "Jaipur", "Agra", "Varanasi"])
    assert.ok(source.includes(`${city}: [`), `offset etichetta mancante: ${city}`);
  assert.match(source, /setTimeout\(markVisualReady, 1800\)/);
});
