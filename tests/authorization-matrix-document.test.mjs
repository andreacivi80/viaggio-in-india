import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("la matrice autorizzativa documenta tutti i ruoli e le risorse sensibili", async () => {
  const matrix = await readFile(new URL("../docs/AUTHORIZATION-MATRIX.md", import.meta.url), "utf8");
  for (const role of ["Pubblico", "Familiare / ospite", "Viaggiatore", "Proprietario", "Coordinatore"])
    assert.match(matrix, new RegExp(role.replace("/", "\\/")));
  for (const resource of ["post privato", "documenti", "posizioni", "notifica globale", "inviti"])
    assert.match(matrix, new RegExp(resource, "i"));
  assert.match(matrix, /password comune[\s\S]*non autorizza operazioni private/i);
  assert.match(matrix, /token scaduto[\s\S]*token alterato[\s\S]*401/i);
  assert.match(matrix, /Logout e revoca[\s\S]*nuovo invito[\s\S]*token differente/i);
  assert.match(matrix, /Cache-Control: no-store/i);
  assert.match(matrix, /extended-p0-access-session-boundaries\.mjs[\s\S]*17\/17/i);
  assert.match(matrix, /ui-role-live\.spec\.mjs[\s\S]*Galaxy S20 FE/i);
  assert.match(matrix, /sessione realmente scaduta[\s\S]*dati locali obsoleti/i);
  assert.match(matrix, /ui-location\.spec\.mjs[\s\S]*Galaxy S20 FE/i);
  assert.match(matrix, /diniego senza alcuna richiesta di scrittura[\s\S]*riattivato il permesso/i);
});
