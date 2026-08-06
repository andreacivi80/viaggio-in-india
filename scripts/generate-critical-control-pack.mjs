import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(root, "docs", "CONTROL-COVERAGE.csv");
const csvPath = path.join(root, "docs", "CRITICAL-CONTROLS-1.41.1.csv");
const markdownPath = path.join(root, "docs", "CRITICAL-CONTROLS-1.41.1.md");
const evidencePath = path.join(root, "docs", "CRITICAL-CONTROL-EVIDENCE-1.41.1.json");
const LIMIT = 120;

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
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [headers, ...records] = rows;
  return records.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

const categoryWeight = {
  "accessi-privacy": 110,
  documenti: 105,
  persistenza: 103,
  "profili-ruoli": 100,
  "mappe-posizione": 98,
  "sync-rete": 106,
  "media-upload": 103,
  "usabilita-mobile": 110,
  social: 100,
  altro: 72,
};

const priorityWeight = { P0: 55, P1: 28, P2: 12 };

const riskTerms = [
  [/password|session|invito|accesso|autorizz|consenso|privacy|cookie|token/i, 24],
  [/passaporto|visto|document|pdf|cache/i, 22],
  [/database|backup|riprist|migraz|rollback|persist|perdita dati/i, 20],
  [/profil|coordinator|ruolo|revoca|dispositivo/i, 18],
  [/elimin|sostituz|retry|interruzione|file mancant|archivio/i, 16],
  [/offline|telefono|notifica|posizion/i, 12],
];

const lowValueTerms = [
  [/README|ZIP|documentazione|resoconto|incremento della versione/i, -28],
  [/^eliminare\.?$|^documenti;?$|^coordinatore$|^controllo database$/i, -24],
  [/preferiti|accessibilit/i, -12],
];

function score(row) {
  let value = (categoryWeight[row.category] || 60) + (priorityWeight[row.priority] || 0);
  for (const [pattern, amount] of riskTerms) if (pattern.test(row.control)) value += amount;
  for (const [pattern, amount] of lowValueTerms) if (pattern.test(row.control)) value += amount;
  if (/;$/.test(row.control.trim())) value -= 6;
  if (row.control.trim().split(/\s+/).length < 4) value -= 18;
  return value;
}

function quote(value) {
  const normalized = String(value).replaceAll('"', '""');
  return /[",\n]/.test(normalized) ? `"${normalized}"` : normalized;
}

function isActionable(row) {
  const control = row.control.trim();
  if (control.split(/\s+/).length < 4) return false;
  if (/;$/.test(control)) return false;
  if (/README|\bZIP\b|documentazione sia assente|tabella requisito/i.test(control)) return false;
  if (/^(Valutare|Definire|Documentare|Calcolare|Aggiornare|Preferenze)\b/i.test(control)) return false;
  if (/documentato come funzione/i.test(control)) return false;
  if (/autenticazione a più fattori|proroga autorizzata della conservazione/i.test(control)) return false;
  if (/^Notifica per (invito personale|posizione condivisa|documento mancante)/i.test(control)) return false;
  if (/notifica prioritaria al Coordinatore/i.test(control)) return false;
  if (/Backup delle chiavi Push/i.test(control)) return false;
  if (/Service Worker utilizzi la cache 1\.21\.5/i.test(control)) return false;
  if (/Preferiti salvati nel database/i.test(control)) return false;
  if (/Misurare batteria con posizione attiva/i.test(control)) return false;
  if (/Posizione all’interno di un edificio/i.test(control)) return false;
  if (/Centro [“\"]Pronto per l.offline/i.test(control)) return false;
  if (/Notifica (con apertura del commento preciso|per reazione|per risposta a un commento)/i.test(control)) return false;
  if (/Non compromettere documenti e funzioni essenziali|differenze tra itinerario, mappe e documenti/i.test(control)) return false;
  return true;
}

const candidates = parseCsv(fs.readFileSync(sourcePath, "utf8"))
  .filter((row) => ["P0", "P1", "P2"].includes(row.priority) && row.status !== "passed")
  .filter(isActionable)
  .map((row, index) => ({ ...row, sourceOrder: index, riskScore: score(row) }))
  .sort((left, right) => right.riskScore - left.riskScore || left.sourceOrder - right.sourceOrder);

if (candidates.length < LIMIT) throw new Error(`Controlli critici pendenti insufficienti: ${candidates.length}`);

const selected = candidates.slice(0, LIMIT).map((row, index) => ({
  id: `K-${String(index + 1).padStart(3, "0")}`,
  band: index < 40 ? "K0" : index < 90 ? "K1" : "K2",
  ...row,
}));
const recordedEvidence = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
const passedCount = selected.filter((row) => recordedEvidence[row.source_rows]).length;

const rationale = {
  "accessi-privacy": "Accesso, consenso o segreto: un errore può esporre funzioni riservate.",
  documenti: "Passaporti, visti e PDF richiedono isolamento, disponibilità e cancellazione corretti.",
  persistenza: "Aggiornamenti, guasti e retry non devono perdere o duplicare dati.",
  "profili-ruoli": "Identità e ruolo devono determinare esattamente ciò che ogni persona può fare.",
  "mappe-posizione": "La posizione deve essere disponibile solo al gruppo e rimovibile dal proprietario.",
  "sync-rete": "Più telefoni e reti instabili devono convergere senza perdita o duplicazione.",
  "media-upload": "Foto, audio e video reali devono caricarsi, riaprirsi e riprendere dopo un errore.",
  "usabilita-mobile": "I flussi fondamentali devono restare raggiungibili e azionabili tramite touch.",
  social: "Commenti e reazioni devono rispettare identità, proprietà e sincronizzazione.",
  altro: "Il flusso di eliminazione deve essere esplicito, recuperabile e coerente.",
};

const expectedEvidence = {
  "accessi-privacy": "API reale locale/QA + gesto touch + verifica diniego e assenza di scritture",
  documenti: "PDF/immagine reali + matrice proprietario/viaggiatore/coordinatore/pubblico + controllo storage",
  persistenza: "snapshot database prima/dopo + fault injection + retry + riapertura su secondo dispositivo",
  "profili-ruoli": "creazione/modifica profilo reale + cambio ruolo + verifica UI/API/database",
  "mappe-posizione": "condivisione/rimozione reale + secondo dispositivo + diniego pubblico",
  "sync-rete": "due o più dispositivi + rete degradata/interrotta + confronto stato finale",
  "media-upload": "file reale da telefono + interruzione/retry + riproduzione o apertura finale",
  "usabilita-mobile": "gesto touch su Samsung e iPhone + geometria + risultato API",
  social: "due identità reali + commento/reazione/eliminazione + propagazione immediata",
  altro: "azione reale + conferma UI + verifica database/storage/notifiche",
};

const csvHeaders = ["critical_id", "band", "priority", "category", "execution_status", "control", "source_rows", "risk_score", "required_evidence", "evidence"];
const csv = [
  csvHeaders.join(","),
  ...selected.map((row) => [row.id, row.band, row.priority, row.category, recordedEvidence[row.source_rows] ? "passed" : "pending", row.control, row.source_rows, row.riskScore, expectedEvidence[row.category], recordedEvidence[row.source_rows] || ""].map(quote).join(",")),
].join("\n") + "\n";

const grouped = Object.groupBy(selected, (row) => row.band);
const markdown = [
  "# Pacchetto ristretto dei controlli critici — revisione 1.41.1",
  "",
  `Controlli selezionati: **${selected.length}** tra ${candidates.length} controlli P0–P2 ancora privi di evidenza conclusiva.`,
  `Stato del pacchetto: **${passedCount} superati**, **${selected.length - passedCount} pendenti**.`,
  "",
  "Sono esclusi i controlli già superati e i doppioni. La selezione privilegia rischi che possono bloccare il viaggio, esporre dati privati, perdere contenuti o produrre comportamenti diversi tra telefoni. Ogni controllo richiede una prova reale locale o QA; la produzione resta in sola lettura.",
  "",
  "- **K0 (40):** blocca qualsiasi rilascio.",
  "- **K1 (50):** deve passare prima della condivisione stabile.",
  "- **K2 (30):** rischio alto residuo, da chiudere subito dopo K0/K1.",
  "",
  ...["K0", "K1", "K2"].flatMap((band) => [
    `## ${band}`,
    "",
    ...(grouped[band] || []).map((row) => `${recordedEvidence[row.source_rows] ? "- [x]" : "- [ ]"} **${row.id} · ${row.category}** — ${row.control}\n  Sorgente: \`${row.source_rows}\`. ${recordedEvidence[row.source_rows] || rationale[row.category]}`),
    "",
  ]),
].join("\n");

fs.writeFileSync(csvPath, csv, "utf8");
fs.writeFileSync(markdownPath, markdown, "utf8");

const counts = Object.fromEntries(Object.entries(grouped).map(([band, rows]) => [band, rows.length]));
console.log(JSON.stringify({ selected: selected.length, passed: passedCount, pending: selected.length - passedCount, candidates: candidates.length, counts, csvPath, markdownPath }, null, 2));
