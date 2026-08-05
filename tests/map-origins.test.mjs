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
  assert.match(source, /midpointLngLat\(places\["Aeroporto DEL"\], places\["Aeroporto UDR"\]\)/);
  assert.match(source, /roadPaths\["Udaipur-Jodhpur"\]/);
  assert.match(source, /midpointLngLat\(places\["Agra Cantt"\], places\["Varanasi Junction"\]\)/);
  assert.match(source, /"Barca sul Gange a Varanasi", "boat", \[83\.009, 25\.305\], \[34, 22\]/);
});
