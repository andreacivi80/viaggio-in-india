import { readFile, writeFile } from "node:fs/promises";

const MATRIX_MD = "docs/TEST-MATRIX.md";
const USABILITY_CSV = "docs/USABILITY-MATRIX.csv";
const ADDENDUM_CSV = "docs/USABILITY-ADDENDUM-MATRIX.csv";
const OUTPUT_CSV = "docs/CONTROL-COVERAGE.csv";
const OUTPUT_MD = "docs/CONTROL-COVERAGE.md";
const EVIDENCE_JSON = "docs/CONTROL-EVIDENCE.json";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else value += char;
  }
  if (value || row.length) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }
  const [headers, ...data] = rows.filter((item) => item.some(Boolean));
  return data.map((items) => Object.fromEntries(headers.map((header, index) => [header, items[index] || ""])));
}

function splitMarkdownRow(line) {
  const cells = [];
  let current = "";
  let escaped = false;
  for (const char of line.slice(1, -1)) {
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === "\\") escaped = true;
    else if (char === "|") {
      cells.push(current.trim());
      current = "";
    } else current += char;
  }
  cells.push(current.trim());
  return cells;
}

function normalize(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[“”‘’]/g, "'")
    .replace(/\b1\.\d+(?:\.\d+)?\b/g, "<versione>")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function priority(control) {
  const text = normalize(control);
  if (/password|session|autorizz|privacy|privat|passaport|document|coordinator|access|token|elimin|propriet|database|backup|ripristin|migraz|perdita dat|invit/.test(text)) return "P0";
  if (/sincron|offline|rete|upload|caric|foto|video|audio|pdf|posizion|gps|concorren|idempoten|cache|service worker|notific/.test(text)) return "P1";
  if (/touch|mobile|iphone|samsung|scroll|responsive|mappa|meteo|viaggiator|comment|reazion|like|ruolo|profil/.test(text)) return "P2";
  return "P3";
}

function category(control) {
  const text = normalize(control);
  if (/password|session|autorizz|privacy|privat|access|token|invit|propriet/.test(text)) return "accessi-privacy";
  if (/passaport|document|pdf|visto|bigliett/.test(text)) return "documenti";
  if (/foto|video|audio|media|upload|caric/.test(text)) return "media-upload";
  if (/sincron|offline|rete|cache|service worker|concorren|idempoten/.test(text)) return "sync-rete";
  if (/posizion|gps|mappa|naviga/.test(text)) return "mappe-posizione";
  if (/viaggiator|coordinator|ruolo|profil|sesso/.test(text)) return "profili-ruoli";
  if (/comment|reazion|like|social|pubblic/.test(text)) return "social";
  if (/touch|mobile|iphone|samsung|scroll|responsive|graf|visual|estetic/.test(text)) return "usabilita-mobile";
  if (/database|backup|ripristin|migraz|perdita dat/.test(text)) return "persistenza";
  if (/meteo|hotel|itinerar|giornat|viaggio/.test(text)) return "itinerario";
  return "altro";
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const entries = [];
const markdown = await readFile(MATRIX_MD, "utf8");
for (const line of markdown.split(/\r?\n/)) {
  if (!/^\| T-\d+ /.test(line)) continue;
  const [id, section, control, status, evidence] = splitMarkdownRow(line);
  entries.push({ source: "globale", id, section, control, status: status === "SUPERATO" ? "passed" : "pending", evidence: evidence === "—" ? "" : evidence });
}

for (const [source, file] of [["usabilita", USABILITY_CSV], ["addendum", ADDENDUM_CSV]]) {
  const rows = parseCsv(await readFile(file, "utf8"));
  for (const row of rows) entries.push({ source, id: row.id, section: row.section, control: row.control, status: row.status, evidence: row.evidence || "" });
}

const unique = new Map();
for (const entry of entries) {
  const key = normalize(entry.control);
  const current = unique.get(key) || {
    control: entry.control,
    priority: priority(entry.control),
    category: category(entry.control),
    status: "pending",
    evidence: new Set(),
    sourceRows: [],
  };
  current.sourceRows.push(`${entry.source}:${entry.id}`);
  if (entry.status.toLowerCase() === "passed" || entry.status.toUpperCase() === "SUPERATO") current.status = "passed";
  if (entry.evidence) current.evidence.add(entry.evidence);
  unique.set(key, current);
}

const verifiedEvidence = JSON.parse(await readFile(EVIDENCE_JSON, "utf8"));
for (const record of verifiedEvidence) {
  const item = unique.get(normalize(record.control));
  if (!item) throw new Error(`Controllo con evidenza non trovato: ${record.control}`);
  item.status = "passed";
  item.evidence.add(record.evidence);
}

const controls = [...unique.values()].sort((a, b) => a.priority.localeCompare(b.priority) || a.category.localeCompare(b.category) || a.control.localeCompare(b.control, "it"));
const count = (filter) => controls.filter(filter).length;
const summary = {
  sourceRows: entries.length,
  unique: controls.length,
  duplicates: entries.length - controls.length,
  passed: count((item) => item.status === "passed"),
  pending: count((item) => item.status !== "passed"),
};

const headers = ["priority", "category", "status", "control", "source_rows", "evidence"];
const csv = [headers.join(","), ...controls.map((item) => [item.priority, item.category, item.status, item.control, item.sourceRows.join(";"), [...item.evidence].join(" | ")].map(csvCell).join(","))].join("\n") + "\n";
await writeFile(OUTPUT_CSV, csv, "utf8");

const categories = [...new Set(controls.map((item) => item.category))].sort();
const priorities = ["P0", "P1", "P2", "P3"];
const rows = priorities.flatMap((level) => categories.map((name) => {
  const subset = controls.filter((item) => item.priority === level && item.category === name);
  if (!subset.length) return null;
  const passed = subset.filter((item) => item.status === "passed").length;
  return `| ${level} | ${name} | ${passed} | ${subset.length - passed} | ${subset.length} |`;
}).filter(Boolean));
const report = `# Copertura riconciliata dei controlli\n\n` +
  `Questa vista non dichiara superato un controllo senza evidenza registrata. Mantiene il totale delle righe sorgente e consolida i doppioni testuali per il lavoro tecnico.\n\n` +
  `- Righe sorgente: ${summary.sourceRows}\n` +
  `- Controlli unici normalizzati: ${summary.unique}\n` +
  `- Doppioni consolidati: ${summary.duplicates}\n` +
  `- Superati con evidenza gia registrata: ${summary.passed}\n` +
  `- Da verificare o collegare a evidenza: ${summary.pending}\n\n` +
  `| Priorita | Categoria | Superati | Pendenti | Totale |\n|---|---|---:|---:|---:|\n${rows.join("\n")}\n`;
await writeFile(OUTPUT_MD, report, "utf8");
console.log(JSON.stringify(summary));
