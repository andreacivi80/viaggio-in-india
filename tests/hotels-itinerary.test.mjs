import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");

test("i cinque nuovi hotel sono collegati a indirizzi, coordinate e giornate", () => {
  const hotels = [
    ["Akshay Niwas Boutique Hotel by Amantra", "24.5793118, 73.6692829"],
    ["Hotel Rajwara Palace", "26.277971, 73.033025"],
    ["The Wall Street Beacon Hotel", "26.917646, 75.8116579"],
    ["Hotel Taj Vilas", "27.1580309, 78.0592253"],
    ["Costa River Varanasi", "25.3385012, 82.9795559"],
  ];
  for (const [name, coordinates] of hotels) {
    assert.match(source, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.ok(source.includes(`[${coordinates}]`), `Coordinate mancanti per ${name}`);
  }
  assert.equal((source.match(/name: "Akshay Niwas Boutique Hotel by Amantra"/g) || []).length, 2);
  assert.equal((source.match(/name: "Hotel Rajwara Palace"/g) || []).length, 2);
  assert.equal((source.match(/name: "The Wall Street Beacon Hotel"/g) || []).length, 2);
  assert.equal((source.match(/name: "Hotel Taj Vilas"/g) || []).length, 1);
  assert.equal((source.match(/name: "Costa River Varanasi"/g) || []).length, 2);
});

test("le linee di trasferimento usano gli hotel come estremi", () => {
  assert.match(source, /"Delhi-Udaipur-hotel"[\s\S]*?28\.5429119, 77\.2428399[\s\S]*?24\.5793118, 73\.6692829/);
  assert.match(source, /"Udaipur-Jodhpur"[\s\S]*?24\.5793118, 73\.6692829[\s\S]*?26\.277971, 73\.033025/);
  assert.match(source, /"Jodhpur-Jaipur"[\s\S]*?26\.277971, 73\.033025[\s\S]*?26\.917646, 75\.8116579/);
  assert.match(source, /"Jaipur-Agra"[\s\S]*?26\.917646, 75\.8116579[\s\S]*?27\.1580309, 78\.0592253/);
  assert.match(source, /"Agra-Varanasi-hotel"[\s\S]*?27\.1580309, 78\.0592253[\s\S]*?25\.3385012, 82\.9795559/);
});

