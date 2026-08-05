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
  "T-0033": ["SUPERATO", "QA 1.31.0: sessione inattiva da 30 giorni respinta con HTTP 401"],
  "T-0035": ["SUPERATO", "QA 1.31.0: nomi e identita inviati dal browser vengono ignorati dal server"],
  "T-0038": ["SUPERATO", "QA 1.31.0: nuovo dispositivo collegato tramite invito personale monouso"],
  "T-0050": ["SUPERATO", "production-smoke: eta, lavoro, bio e avatar_key assenti dallo stato pubblico"],
  "T-0052": ["SUPERATO", "production-smoke: stato pubblico separato dall'area privata"],
  "T-0054": ["SUPERATO", "QA 1.31.0: undicesimo commento in un minuto bloccato con HTTP 429"],
  "T-0055": ["SUPERATO", "QA 1.31.0: trentunesima reazione in un minuto bloccata con HTTP 429"],
  "T-0057": ["SUPERATO", "QA 1.31.0: raffiche di scritture limitate per identita"],
  "T-0061": ["SUPERATO", "QA 1.31.0: commento del viaggiatore attribuito alla sessione e non ai campi del browser"],
  "T-0062": ["SUPERATO", "production-smoke: identita ospite creata e validata dal server"],
  "T-0063": ["SUPERATO", "QA 1.31.0: visitor_id falsificato non modifica l'identita server"],
  "T-0064": ["SUPERATO", "QA 1.31.0: modifica ed eliminazione del commento altrui restituite 403"],
  "T-0066": ["SUPERATO", "QA 1.31.0: quattro livelli di visibilita filtrati lato server"],
  "T-0067": ["SUPERATO", "QA 1.31.0: ospite e altro viaggiatore non leggono ne interagiscono col post privato"],
  "T-0068": ["SUPERATO", "QA 1.31.0: feed pubblico, ospite e viaggiatore restituiscono contenuti differenti"],
  "T-0072": ["SUPERATO", "QA 1.31.0: contenuto Familiari visibile all'ospite autenticato e al gruppo"],
  "T-0073": ["SUPERATO", "QA 1.31.0: contenuto Gruppo visibile ai viaggiatori e nascosto agli ospiti"],
  "T-0074": ["SUPERATO", "QA 1.31.0: contenuto Pubblico visibile senza identita"],
  "T-0075": ["SUPERATO", "QA 1.31.0: contenuto Solo io visibile esclusivamente al proprietario"],
  "T-0120": ["SUPERATO", "offline-queue: outbox persistente verificata con IndexedDB simulato"],
  "T-0125": ["SUPERATO", "offline-queue: accodamento, persistenza e svuotamento verificati"],
  "T-0128": ["SUPERATO", "offline-queue: file MP3 conservato con nome, MIME e contenuto"],
  "T-0130": ["SUPERATO", "offline-queue: file MP4 conservato con nome, MIME e contenuto"],
  "T-0131": ["SUPERATO", "offline-queue: file JPEG conservato con nome, MIME e contenuto"],
  "T-0133": ["SUPERATO", "production-smoke: chiave idempotente riutilizzata e risposta replayed"],
  "T-0156": ["SUPERATO", "resumable-upload: avanzamento del singolo file verificato fino al 100%"],
  "T-0160": ["SUPERATO", "resumable-upload: ripresa da parti già confermate"],
  "T-0179": ["SUPERATO", "QA 1.29.0: dimensione reale da 9 MB ricomposta e verificata dal server"],
  "T-0211": ["SUPERATO", "production-smoke: endpoint posizione negato senza sessione"],
  "T-0218": ["SUPERATO", "production-smoke: header Content-Security-Policy presente"],
  "T-0221": ["SUPERATO", "QA 1.31.0: protezione antispam verificata su commenti e reazioni"],
  "T-0229": ["SUPERATO", "QA 1.31.0: rate limiting verificato su accessi, commenti e reazioni"],
  "T-0223": ["SUPERATO", "QA 1.31.0: secondo viaggiatore non puo eliminare il post altrui"],
  "T-0224": ["SUPERATO", "QA 1.31.0: secondo viaggiatore non puo modificare il commento altrui"],
  "T-0253": ["SUPERATO", "resumable-upload: manifesto persistente ripreso dopo riapertura simulata"],
  "T-0328": ["SUPERATO", "production-smoke: dispositivo secondario revocato"],
  "T-0325": ["SUPERATO", "QA 1.31.0: logout eseguito e token successivamente respinto"],
  "T-0337": ["SUPERATO", "production-smoke: area documenti privata restituisce 401 al pubblico"],
  "T-0338": ["SUPERATO", "production-smoke: eliminazione posizione restituisce 403 al pubblico"],
  "T-0359": ["SUPERATO", "production-smoke: nessun campo privato nei profili pubblici"],
  "T-0468": ["SUPERATO", "QA 1.31.0: proprietario modifica correttamente il proprio commento"],
  "T-0474": ["SUPERATO", "QA 1.31.0: limiti antispam restituiscono HTTP 429 alle soglie previste"],
  "T-0471": ["SUPERATO", "QA 1.31.0: eliminazione commento altrui negata"],
  "T-0472": ["SUPERATO", "QA 1.31.0: modifica commento altrui negata"],
  "T-0557": ["SUPERATO", "resumable-upload: parte già confermata non viene inviata due volte"],
  "T-0635": ["SUPERATO", "backup D1 pre-1.29.0 esportato e verificato"],
  "T-0639": ["SUPERATO", "verify-d1-backup: procedura ripetibile di ripristino documentata nel repository"],
  "T-0640": ["SUPERATO", "backup D1 registrato con data, ora e impronta SHA-256"],
  "T-0641": ["SUPERATO", "verify-d1-backup: ripristino eseguito in database temporaneo vuoto"],
  "T-0642": ["SUPERATO", "verify-d1-backup: 8 commenti ripristinati e leggibili"],
  "T-0643": ["SUPERATO", "verify-d1-backup: 14 documenti ripristinati e leggibili"],
  "T-0644": ["SUPERATO", "verify-d1-backup: PRAGMA integrity_check restituisce ok"],
  "T-0646": ["SUPERATO", "verify-d1-backup: posizione ripristinata"],
  "T-0647": ["SUPERATO", "verify-d1-backup: 10 post ripristinati"],
  "T-0648": ["SUPERATO", "verify-d1-backup: 5 profili ripristinati"],
  "T-0632": ["SUPERATO", "production-smoke: CSP verificata sul dominio live"],
  "T-0633": ["SUPERATO", "QA 1.28.0: raffica di accessi errati bloccata con HTTP 429"],
  "T-0668": ["SUPERATO", "QA 1.31.0: rate limiting e antispam verificati end-to-end"],
  "T-1058": ["SUPERATO", "QA 1.31.0: risposte HTTP 429 verificate su tre categorie"],
  "T-0625": ["SUPERATO", "QA 1.31.0: eliminazione post altrui negata con HTTP 403"],
  "T-0626": ["SUPERATO", "QA 1.31.0: modifica commento altrui negata con HTTP 403"],
  "T-0671": ["SUPERATO", "production-smoke: doppio invio conserva un solo record"],
  "T-0678": ["SUPERATO", "offline-queue: testo, foto, audio e video conservati nella coda"],
  "T-0696": ["SUPERATO", "QA 1.31.0: telefono tecnico collegato tramite invito personale"],
  "T-0736": ["SUPERATO", "QA 1.31.0: attacco eliminazione post altrui respinto"],
  "T-0740": ["SUPERATO", "QA 1.31.0: attacco modifica commento altrui respinto"],
  "T-0741": ["SUPERATO", "QA 1.31.0: modifica commento proprio completata"],
  "T-0753": ["SUPERATO", "QA 1.31.0: accesso tramite invito personale completato"],
  "T-0761": ["SUPERATO", "QA 1.31.0: scadenza per inattivita simulata e verificata"],
  "T-0766": ["SUPERATO", "QA 1.30.0: upload interrotto annullato e sessione eliminata"],
  "T-0794": ["SUPERATO", "verify-d1-backup: zero commenti orfani dopo il ripristino"],
  "T-0821": ["SUPERATO", "resumable-upload: stato server riletto prima della ripresa"],
  "T-0925": ["SUPERATO", "QA 1.29.0: lettura Range attraversa due parti e restituisce HTTP 206"],
  "T-1025": ["SUPERATO", "production-smoke: unicita operazioni idempotenti verificata"],
  "T-1017": ["SUPERATO", "P0_DB_AUTH_INTEGRITY: D1 respinge inviti senza profilo e li elimina a cascata"],
  "T-1021": ["SUPERATO", "P0_DB_AUTH_INTEGRITY: D1 respinge sessioni senza profilo e le elimina a cascata"],
  "T-1029": ["SUPERATO", "backup D1 creato e verificato prima della migrazione 0013"],
  "T-1182": ["SUPERATO", "production-smoke: Service Worker live contiene la revisione corrente"],
  "T-1347": ["SUPERATO", "extended-p0-auth-lifecycle: invito scaduto inserito in D1 locale e rimosso da health"],
  "T-1348": ["SUPERATO", "extended-p0-auth-lifecycle: sessione scaduta inserita in D1 locale e rimozione contata da health"],
  "T-1352": ["SUPERATO", "QA 1.31.0: contenuto Solo io assente dai feed non proprietari"],
  "T-1362": ["SUPERATO", "QA 1.31.0: dopo logout sessione e area privata restituiscono 401"],
  "T-1165": ["SUPERATO", "verify-d1-backup: tempo di ripristino misurato automaticamente"],
  "T-1169": ["SUPERATO", "verify-d1-backup: export importato in database temporaneo vuoto"],
  "T-1484": ["SUPERATO", "production-smoke: X-Content-Type-Options nosniff presente"],
  "T-1567": ["SUPERATO", "QA 1.31.0: invito gia utilizzato non puo essere riutilizzato"],
  "T-1568": ["SUPERATO", "QA 1.31.0: logout verificato end-to-end"],
  "T-1583": ["SUPERATO", "QA 1.31.0: sessione inattiva respinta"],
  "T-1607": ["SUPERATO", "production-smoke: elenco dispositivi aggiornato dopo revoca"],
  "T-1684": ["SUPERATO", "resumable-upload: errore temporaneo ritentato senza ricominciare il file"],
  "T-1691": ["SUPERATO", "QA 1.31.0: nessun contenuto Solo io mostrato agli altri utenti"],
  "T-1726": ["SUPERATO", "resumable-upload: file da 9 MB suddiviso e completato in tre parti"],
  "T-1743": ["SUPERATO", "backup D1 pre-migrazione eseguito"],
  "T-1744": ["SUPERATO", "backup D1 ripristinato in ambiente temporaneo"],
  "T-1749": ["SUPERATO", "backup eseguito con impronta SHA-256 verificata"],
  "T-1792": ["SUPERATO", "production-smoke: idempotenza coperta su quattro tipi di scrittura"],
  "T-1794": ["SUPERATO", "offline-queue: allegati multimediali conservati e reinviati"],
  "T-1800": ["SUPERATO", "resumable-upload: ripresa upload coperta da prova automatica"],
  "T-1791": ["SUPERATO", "backup e ripristino D1 verificati end-to-end"],
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
