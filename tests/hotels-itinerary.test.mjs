import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { days, places, roadPaths } from "../src/tripThailand.js";

const source = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");

test("le undici giornate Thailandia sono collegate a percorsi validi", () => {
  assert.equal(days.length, 11);
  for (const [index, day] of days.entries()) {
    assert.ok(day.date && day.city && day.title, `Giorno ${index + 1}: intestazione incompleta`);
    assert.ok(places[day.city], `Giorno ${index + 1}: città senza coordinate`);
    const segments = day.segments || [{ path: day.path }];
    for (const segment of segments) {
      const route = roadPaths[segment.path];
      assert.ok(Array.isArray(route) && route.length >= 2, `Giorno ${index + 1}: percorso ${segment.path} mancante`);
      for (const coordinates of route)
        assert.ok(Array.isArray(coordinates) && coordinates.length === 2 && coordinates.every(Number.isFinite));
    }
  }
  assert.equal(days[8].overnight, "Notte in bus · Surat Thani → Bangkok");
});

test("lo zoom giornaliero privilegia gli spostamenti brevi", () => {
  assert.match(source, /day\.km <= 15[\s\S]*?13\.2[\s\S]*?day\.km <= 40[\s\S]*?12\.4/);
  assert.match(source, /top: 76, right: 40, bottom: 76, left: 40/);
  assert.match(source, /visibleMarkerIndexes\.map\(\(index\) => places\[sequence\[index\]\]\)/);
  assert.match(source, /specialStops\.map\(\(\[, , coordinates\]\) => coordinates\)/);
});

test("le tratte Thailandia restano continue nei trasferimenti composti", () => {
  for (const day of days.filter((item) => item.segments)) {
    for (let index = 1; index < day.segments.length; index += 1) {
      const previous = roadPaths[day.segments[index - 1].path];
      const current = roadPaths[day.segments[index].path];
      const gap = Math.hypot(previous.at(-1)[0] - current[0][0], previous.at(-1)[1] - current[0][1]);
      assert.ok(gap < 1.5, `${day.date}: discontinuità eccessiva tra ${day.segments[index - 1].path} e ${day.segments[index].path}`);
    }
  }
});
