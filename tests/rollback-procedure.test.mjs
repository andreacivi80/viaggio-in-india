import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const procedure = readFileSync(new URL("../docs/ROLLBACK-PROCEDURE.md", import.meta.url), "utf8");

test("la procedura distingue rollback applicativo e dati e assegna l'autorizzazione", () => {
  assert.match(procedure, /rollback dell'applicazione/i);
  assert.match(procedure, /rollback dei dati/i);
  assert.match(procedure, /responsabile del rilascio/i);
  assert.match(procedure, /Nessun viaggiatore o visitatore può avviarlo/i);
});

test("RTO e RPO sono espliciti e misurati durante l'incidente", () => {
  assert.match(procedure, /RTO applicazione:[\s\S]*15 minuti/i);
  assert.match(procedure, /RTO dati:[\s\S]*30 minuti/i);
  assert.match(procedure, /RPO dati:[\s\S]*zero/i);
  assert.match(procedure, /ora di inizio, ora di ripristino e durata effettiva/i);
});

test("il rollback protegge dati reali e richiede verifiche complete", () => {
  assert.match(procedure, /export D1 prima di qualsiasi migrazione/i);
  assert.match(procedure, /verify-d1-backup\.py/i);
  assert.match(procedure, /non deve mai riscrivere o cancellare il database/i);
  assert.match(procedure, /non usare `DROP`, `TRUNCATE`, reset o una migrazione inversa distruttiva/i);
  assert.match(procedure, /due smoke test consecutivi/i);
  assert.match(procedure, /documenti sono apribili/i);
  assert.match(procedure, /non esistono file orfani/i);
});
