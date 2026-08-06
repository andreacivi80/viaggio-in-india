import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("diagramma e tabella descrivono gli stati realmente applicati dal client", async () => {
  const [states, ui] = await Promise.all([
    read("../docs/CREDENTIAL-STATE-MACHINE.md"),
    read("../src/main.jsx"),
  ]);
  assert.match(states, /```mermaid[\s\S]*stateDiagram-v2/);
  for (const state of ["Pubblico", "PasswordVerificata", "Ospite", "SessionePersonale", "Viaggiatore", "Coordinatore"])
    assert.match(states, new RegExp(`\\b${state}\\b`));
  assert.match(states, /sessione server valida[\s\S]*ruolo server[\s\S]*profilo server[\s\S]*dati locali/i);
  assert.match(states, /Password comune valida, nessuna sessione \| Pubblico \| Password verificata · profilo non collegato/i);
  assert.match(ui, /effectiveSessionToken[\s\S]*currentProfile\?\.name[\s\S]*"Pubblico"/);
  assert.match(ui, /"Password verificata · profilo non collegato"/);
});

test("l’elenco dei dinieghi resta allineato ai messaggi server e al recupero UI", async () => {
  const [messages, ui, worker] = await Promise.all([
    read("../docs/ACCESS-DENIAL-MESSAGES.md"),
    read("../src/main.jsx"),
    read("../functions/api/[[path]].js"),
  ]);
  const serverMessages = [
    "Codice non corretto",
    "Sessione non valida",
    "Accesso personale richiesto",
    "Solo il coordinatore può creare inviti",
    "Solo il coordinatore può revocare inviti",
    "Solo il coordinatore può creare profili",
    "Documento non autorizzato",
    "Contenuto non autorizzato",
    "Non puoi modificare questo profilo",
    "Non puoi eliminare questo profilo",
    "Non puoi modificare questo commento",
    "Non puoi eliminare questo commento",
    "Puoi aggiornare soltanto la tua posizione",
    "Non puoi cancellare questa posizione",
    "Identità ospite richiesta",
    "Invito non valido o scaduto",
    "Invito già utilizzato",
  ];
  for (const message of serverMessages) {
    assert.ok(worker.includes(message), `Messaggio server assente: ${message}`);
    assert.ok(messages.includes(message), `Messaggio non documentato: ${message}`);
  }
  const recoveryMessages = [
    "Inserisci la password per vedere il gruppo e collegare il tuo profilo.",
    "Questo dispositivo non è ancora autorizzato",
    "Inserisci la password comune e collega il tuo profilo.",
    "I comandi privati restano bloccati fino alla conferma del server.",
    "La sessione è scaduta. Bozza e allegati sono conservati: riapri il tuo invito personale.",
  ];
  for (const message of recoveryMessages) {
    assert.ok(ui.includes(message), `Recupero UI assente: ${message}`);
    assert.ok(messages.includes(message), `Recupero non documentato: ${message}`);
  }
  assert.match(messages, /password comune[\s\S]*non viene mai usata[\s\S]*operazione privata/i);
});
