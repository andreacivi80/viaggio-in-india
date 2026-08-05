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
});
