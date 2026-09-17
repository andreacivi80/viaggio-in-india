import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const lines = readFileSync("docs/REQUIREMENT-TRACEABILITY.csv", "utf8").trim().split(/\r?\n/);
const columns = lines[0].split(",");
const rows = lines.slice(1).map((line) => Object.fromEntries(line.split(",").map((value, index) => [columns[index], value])));
const apiInventory = JSON.parse(readFileSync("docs/API-AUTHORIZATION-INVENTORY.json", "utf8"));
const endpoints = new Set([...apiInventory.exact, ...apiInventory.dynamic].map((item) => item.path));
const schema = readFileSync("db/schema.sql", "utf8");

test("A0460/A0480: ogni requisito operativo ha una catena completa e verificabile", () => {
  assert.equal(rows.length, 24);
  assert.equal(new Set(rows.map((row) => row.id)).size, rows.length);
  for (const row of rows) {
    for (const column of columns) assert.ok(row[column], `${row.id}: manca ${column}`);
    assert.equal(row.status, "COMPLETE", `${row.id}: catena non completa`);
    assert.ok(existsSync(row.test), `${row.id}: test inesistente ${row.test}`);
    if (row.api !== "N/A") {
      for (const endpoint of row.api.split(";")) assert.ok(endpoints.has(endpoint), `${row.id}: API non inventariata ${endpoint}`);
    }
    if (row.database !== "N/A") {
      for (const table of row.database.split(";")) {
        assert.match(schema, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`), `${row.id}: tabella inesistente ${table}`);
      }
    }
  }
});
