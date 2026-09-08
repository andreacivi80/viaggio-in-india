import { readFileSync } from "node:fs";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') {
      row.push(field);
      field = "";
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  const headers = rows.shift() || [];
  return rows.filter((candidate) => candidate.some(Boolean)).map((candidate) =>
    Object.fromEntries(headers.map((header, index) => [header, candidate[index] || ""])),
  );
}

const controls = parseCsv(readFileSync(new URL("../docs/CONTROL-COVERAGE.csv", import.meta.url), "utf8"));
const pending = controls.filter((control) => control.status !== "passed");
const urgent = pending.filter((control) => control.priority === "P0" || control.priority === "P1");

console.log(`COLUMNS=${Object.keys(controls[0] || {}).join("|")}`);
console.log(`PENDING_TOTAL=${pending.length}`);
console.log(`PENDING_P0_P1=${urgent.length}`);
for (const control of urgent) {
  console.log([
    control.priority,
    control.category,
    control.control,
    control.source_rows,
    control.evidence,
  ].join(" | "));
}
