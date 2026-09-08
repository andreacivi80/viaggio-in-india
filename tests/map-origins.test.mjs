import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
const itinerary = await readFile(new URL("../src/tripThailand.js", import.meta.url), "utf8");
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

test("la cartina WEROAD mantiene sempre l'Italia intera anche con una sola provenienza", () => {
  assert.match(source, /const ITALY_OVERVIEW_BOUNDS = \[\[6\.4, 35\.4\], \[18\.9, 47\.2\]\]/);
  assert.match(source, /map\.fitBounds\(ITALY_OVERVIEW_BOUNDS, \{ padding: 24, maxZoom: 5\.2, duration: 0 \}\)/);
  assert.doesNotMatch(source, /groups\.length === 1\) map\.easeTo/);
  assert.match(source, /resizeObserver = new ResizeObserver\(showAllItaly\)/);
  assert.match(source, /settleTimer = setTimeout\(showAllItaly, 320\)/);
});

test("le icone della mappa generale sono ancorate a tratte reali", () => {
  for (const reference of ["Bangkok–Hua Hin", "Kui Buri", "Cheow Lan", "Phi Phi", "Surat–Bangkok"])
    assert.ok(itinerary.includes(`"${reference}"`), `riferimento mancante: ${reference}`);
  assert.match(source, /node\.dataset\.routeReference = reference/);
  for (const [reference, stage] of [["Bangkok–Hua Hin", "2"], ["Kui Buri", "3"], ["Cheow Lan", "5"], ["Phi Phi", "6"], ["Surat–Bangkok", "7"]])
    assert.ok(itinerary.includes(`"${reference}", "${stage}"`), `${reference} non è vicino alla tappa ${stage}`);
  assert.match(source, /node\.dataset\.nearStage = nearStage/);
  assert.match(source, /const route = roadPaths\[pathName\] \|\| \[\]/);
  assert.match(source, /const lat = fromLat \+ \(toLat - fromLat\) \* ratio/);
  for (const path of ["bangkok-huahin", "huahin-chumphon", "khaosok-pier", "krabi-phiphi", "surat-bangkok"])
    assert.match(itinerary, new RegExp(`"${path}", 0(?:\\.|,)`), `icona non ancorata alla tratta ${path}`);
});

test("i simboli dei mezzi restano separati dai nomi di Phi Phi e delle tappe vicine", () => {
  assert.match(itinerary, /"krabi-phiphi", 0\.56, "Phi Phi", "6"/);
  assert.match(itinerary, /"khaosok-pier", 0\.78, "Cheow Lan", "5"/);
  assert.doesNotMatch(itinerary, /"Phi Phi Island", \[[^\]]+\]/);
  assert.match(itinerary, /"Cheow Lan", "5", \[20, -32\]/);
  assert.match(itinerary, /"Phi Phi", "6", \[-26, -12\]/);
  assert.match(source, /offset: markerOffset/);
});

test("le tappe 2-7 restano sul percorso o a contatto col relativo tratto", () => {
  assert.match(
    itinerary,
    /overviewStageOffsets\s*=\s*\[\s*\[-6,\s*-6\],\s*\[0,\s*0\],\s*\[0,\s*0\],\s*\[-8,\s*-6\],\s*\[8,\s*-6\],\s*\[-22,\s*18\],\s*\[0,\s*0\],\s*\[6,\s*6\]/s,
  );
  for (const city of ["Hua Hin", "Chumphon", "Khao Sok", "Cheow Lan Lake", "Phi Phi Island", "Krabi"])
    assert.ok(placesOnRoute(itinerary, city), `${city} deve appartenere a una tratta della mappa generale`);
});

function placesOnRoute(sourceText, city) {
  const placesBlock = sourceText.match(/export const places = \{([\s\S]*?)\n\};/)?.[1] || "";
  const key = city.includes(" ") ? JSON.stringify(city) : city;
  const coordinates = placesBlock.match(new RegExp(`${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*(\\[[^\\]]+\\])`))?.[1];
  if (!coordinates) return false;
  const routesBlock = sourceText.match(/export const roadPaths = \{([\s\S]*?)\n\};/)?.[1] || "";
  return routesBlock.includes(coordinates);
}

test("la legenda dei mezzi non copre più la scala chilometrica", () => {
  assert.match(styles, /\.overviewRouteLegend\s*\{[^}]*top:\s*9px;[^}]*bottom:\s*auto;/s);
  assert.match(source, /🚐 Van/);
  assert.match(source, /🚌 Bus notturno/);
  assert.doesNotMatch(source, /<span className="air">✈️ Aereo<\/span>/);
  assert.doesNotMatch(source, /<span className="rail">🚆 Treno<\/span>/);
});

test("i nomi delle città non dipendono dalle etichette della cartografia esterna", () => {
  assert.match(source, /className = "tripCityNameLabel"/);
  assert.match(source, /node\.dataset\.cityName = name/);
  for (const city of ["Bangkok", "Hua Hin", "Chumphon", "Khao Sok", "Cheow Lan Lake", "Phi Phi Island", "Krabi"])
    assert.ok(itinerary.includes(`${JSON.stringify(city)}:`) || itinerary.includes(`${city}:`), `offset etichetta mancante: ${city}`);
  assert.match(source, /setTimeout\(markVisualReady, 1800\)/);
});
