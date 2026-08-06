import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("i comandi sensibili della UI dipendono dalla sessione verificata e dal ruolo", async () => {
  const ui = await read("src/main.jsx");
  assert.match(ui, /const verifiedSessionToken = sessionProfile \? sessionToken : ""/);
  assert.match(ui, /currentProfile && verifiedSessionToken/);
  assert.match(ui, /const canManageGroup = sessionProfile\?\.role === "coordinator"/);
  assert.match(ui, /canManageGroup \|\| sessionProfile\?\.id === profileId/);
  assert.match(ui, /const viewerIsCoordinator = privateData\.viewer\?\.role === "coordinator"/);
  assert.match(ui, /\{p\.can_manage && \(/);
  assert.match(ui, /\{x\.can_manage && x\.text && \(/);
});

test("la documentazione collega ogni comando sensibile al controllo API corrispondente", async () => {
  const matrix = await read("docs/AUTHORIZATION-MATRIX.md");
  for (const command of [
    "Pubblica",
    "Condividi/rimuovi posizione",
    "Apri documenti",
    "Carica/elimina documento",
    "Crea profilo o invito",
    "Modifica/elimina contenuto",
    "Commenta/reagisce",
  ]) assert.match(matrix, new RegExp(command.replace("/", "\\/")));
  assert.match(matrix, /sicurezza non dipende dalla UI/i);
  assert.match(matrix, /richiesta forzata[\s\S]*respinta dal Worker/i);
});
