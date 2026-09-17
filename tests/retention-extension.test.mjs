import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const worker = readFileSync(new URL("../functions/api/[[path]].js", import.meta.url), "utf8");
const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
const client = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");

test("la proroga ha stato, scadenza e approvazione persistiti per profilo", () => {
  assert.match(schema, /CREATE TABLE IF NOT EXISTS retention_extensions/);
  assert.match(schema, /CHECK\(status IN \('pending','approved','rejected'\)\)/);
  assert.match(schema, /FOREIGN KEY\(profile_id\) REFERENCES profiles\(id\) ON DELETE CASCADE/);
  assert.match(schema, /FOREIGN KEY\(approved_by\) REFERENCES profiles\(id\) ON DELETE SET NULL/);
});

test("solo il proprietario richiede e solo la coordinatrice decide", () => {
  assert.match(worker, /Puoi richiedere la proroga soltanto per i tuoi dati/);
  assert.match(worker, /Solo la coordinatrice può autorizzare una proroga/);
  assert.match(worker, /session\.role !== "coordinator"/);
  assert.match(worker, /WHERE profile_id=\? AND status='pending'/);
});

test("date arbitrarie e proroghe superiori a dodici mesi vengono rifiutate", () => {
  assert.match(worker, /\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$/);
  assert.match(worker, /requestedDate < tomorrow \|\| requestedDate > maximum/);
  assert.match(worker, /Scegli una data futura entro dodici mesi/);
});

test("l'interfaccia espone richiesta, stato e autorizzazione senza auto-approvazione", () => {
  assert.match(client, /Conservazione dei tuoi dati/);
  assert.match(client, /Richiedi proroga/);
  assert.match(client, /Proroghe da autorizzare/);
  assert.match(client, /decision === "approve"/);
});
