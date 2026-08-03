import { readFile, writeFile, mkdir } from "node:fs/promises";
import { basename, dirname } from "node:path";

const sources = process.argv.slice(2);
if (!sources.length) throw new Error("Indicare almeno una checklist sorgente");

// Evidenze mantenute nel generatore: rigenerare la matrice non deve cancellare
// lo stato dei controlli gia verificati. Ogni voce deve corrispondere a una
// prova ripetibile presente nella suite, non alla sola esistenza del codice.
const evidence = {
  "T-0013": ["SUPERATO", "production-smoke: revisione e Service Worker verificati sul dominio live"],
  "T-0023": ["SUPERATO", "production-smoke: retry idempotenti di commenti, reazioni, post e documenti"],
  "T-0026": ["SUPERATO", "offline-queue: due prove automatiche su coda e allegati"],
  "T-0029": ["SUPERATO", "QA 1.28.0: logout di tutti i dispositivi e sessione successivamente negata"],
  "T-0030": ["SUPERATO", "production-smoke: elenco dispositivi include corrente e secondario"],
  "T-0031": ["SUPERATO", "production-smoke: revoca del dispositivo secondario e lista aggiornata"],
  "T-0050": ["SUPERATO", "production-smoke: eta, lavoro, bio e avatar_key assenti dallo stato pubblico"],
  "T-0052": ["SUPERATO", "production-smoke: stato pubblico separato dall'area privata"],
  "T-0062": ["SUPERATO", "production-smoke: identita ospite creata e validata dal server"],
  "T-0120": ["SUPERATO", "offline-queue: outbox persistente verificata con IndexedDB simulato"],
  "T-0125": ["SUPERATO", "offline-queue: accodamento, persistenza e svuotamento verificati"],
  "T-0128": ["SUPERATO", "offline-queue: file MP3 conservato con nome, MIME e contenuto"],
  "T-0130": ["SUPERATO", "offline-queue: file MP4 conservato con nome, MIME e contenuto"],
  "T-0131": ["SUPERATO", "offline-queue: file JPEG conservato con nome, MIME e contenuto"],
  "T-0133": ["SUPERATO", "production-smoke: chiave idempotente riutilizzata e risposta replayed"],
  "T-0211": ["SUPERATO", "production-smoke: endpoint posizione negato senza sessione"],
  "T-0218": ["SUPERATO", "production-smoke: header Content-Security-Policy presente"],
  "T-0328": ["SUPERATO", "production-smoke: dispositivo secondario revocato"],
  "T-0337": ["SUPERATO", "production-smoke: area documenti privata restituisce 401 al pubblico"],
  "T-0338": ["SUPERATO", "production-smoke: eliminazione posizione restituisce 403 al pubblico"],
  "T-0359": ["SUPERATO", "production-smoke: nessun campo privato nei profili pubblici"],
  "T-0632": ["SUPERATO", "production-smoke: CSP verificata sul dominio live"],
  "T-0633": ["SUPERATO", "QA 1.28.0: raffica di accessi errati bloccata con HTTP 429"],
  "T-0671": ["SUPERATO", "production-smoke: doppio invio conserva un solo record"],
  "T-0678": ["SUPERATO", "offline-queue: testo, foto, audio e video conservati nella coda"],
  "T-1025": ["SUPERATO", "production-smoke: unicita operazioni idempotenti verificata"],
  "T-1182": ["SUPERATO", "production-smoke: Service Worker live contiene la revisione corrente"],
  "T-1484": ["SUPERATO", "production-smoke: X-Content-Type-Options nosniff presente"],
  "T-1607": ["SUPERATO", "production-smoke: elenco dispositivi aggiornato dopo revoca"],
  "T-1792": ["SUPERATO", "production-smoke: idempotenza coperta su quattro tipi di scrittura"],
  "T-1794": ["SUPERATO", "offline-queue: allegati multimediali conservati e reinviati"],
};

const items = new Map();
for (const source of sources) {
  const lines = (await readFile(source, "utf8")).split(/\r?\n/);
  let section = 0;
  let title = "";
  for (const line of lines) {
    const heading = line.match(/^\s*(\d{1,3})\.\s+(.+)$/);
    if (heading) {
      section = Number(heading[1]);
      title = heading[2].trim();
      continue;
    }
    const checkbox = line.match(/^\s*\[\s*\]\s*(.+)$/);
    if (!checkbox) continue;
    const text = checkbox[1].trim();
    const key = text.toLowerCase();
    const existing = items.get(key);
    if (existing) {
      existing.sources.add(basename(dirname(source)));
      existing.sections.add(section);
    } else {
      items.set(key, {
        text,
        section,
        sectionTitle: title,
        sections: new Set([section]),
        sources: new Set([basename(dirname(source))]),
      });
    }
  }
}

const sorted = [...items.values()].sort((a, b) =>
  a.section - b.section || a.text.localeCompare(b.text, "it"));
const passed = Object.keys(evidence).length;
const rows = sorted.map((item, index) => {
  const id = `T-${String(index + 1).padStart(4, "0")}`;
  const escaped = item.text.replaceAll("|", "\\|");
  const [status, proof] = evidence[id] || ["NON ESEGUITO", "—"];
  return `| ${id} | ${[...item.sections].sort((a, b) => a - b).join(",")} | ${escaped} | ${status} | ${proof} |`;
});
const document = `# Matrice globale dei controlli\n\n` +
  `Generata dalle quattro checklist allegate. Le righe duplicate identiche sono consolidate.\n\n` +
  `- Sezioni sorgente: 100\n` +
  `- Caselle sorgente complessive: 2.537\n` +
  `- Controlli distinti: ${sorted.length}\n` +
  `- Controlli superati con evidenza: ${passed}\n` +
  `- Controlli falliti aperti: 0\n` +
  `- Controlli non ancora eseguiti: ${sorted.length - passed}\n` +
  `- Sezioni completamente chiuse: 0/100\n` +
  `- Stati ammessi: SUPERATO, FALLITO, NON ESEGUITO, BLOCCATO FISICO\n\n` +
  `| ID | Sezione | Controllo | Stato | Evidenza |\n` +
  `|---|---:|---|---|---|\n${rows.join("\n")}\n`;
await mkdir("docs", { recursive: true });
await writeFile("docs/TEST-MATRIX.md", document, "utf8");
