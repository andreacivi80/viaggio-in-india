import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field || row.length) rows.push([...row, field]);
  const [headers, ...records] = rows;
  return records.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

test("il pacchetto ristretto contiene 120 controlli critici unici e ancora pendenti", () => {
  const pack = parseCsv(fs.readFileSync(path.join(root, "docs", "CRITICAL-CONTROLS-1.41.1.csv"), "utf8"));
  const coverage = parseCsv(fs.readFileSync(path.join(root, "docs", "CONTROL-COVERAGE.csv"), "utf8"));
  const sourceStatus = new Map(coverage.map((row) => [`${row.source_rows}|${row.control}`, row.status]));

  assert.equal(pack.length, 120);
  assert.equal(new Set(pack.map((row) => row.critical_id)).size, 120);
  assert.equal(new Set(pack.map((row) => `${row.source_rows}|${row.control}`)).size, 120);
  assert.deepEqual(
    Object.fromEntries(["K0", "K1", "K2"].map((band) => [band, pack.filter((row) => row.band === band).length])),
    { K0: 40, K1: 50, K2: 30 },
  );
  for (const row of pack) {
    assert.match(row.critical_id, /^K-\d{3}$/);
    assert.ok(["P0", "P1"].includes(row.priority));
    assert.notEqual(sourceStatus.get(`${row.source_rows}|${row.control}`), "passed");
    assert.ok(row.required_evidence.length > 20);
  }
});
