import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const client = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");

test("A0371: scegliere un documento non avvia il caricamento senza conferma", () => {
  assert.match(client, /\[pendingDocumentUpload, setPendingDocumentUpload\] = useState\(null\)/);
  assert.doesNotMatch(client, /onChange=\{\(e\) => upload\(type, e\.target\.files/);
  assert.match(client, /setPendingDocumentUpload\(\{ type, label, file, replacing: true \}\)/);
  assert.match(client, /setPendingDocumentUpload\(\{ type, label, file, replacing: false \}\)/);
});

test("la conferma dichiara destinatari, file e permette annullamento", () => {
  assert.match(client, /aria-label="Conferma caricamento documento"/);
  assert.match(client, /Sarà visibile soltanto a te e alla coordinatrice/);
  assert.match(client, /pendingDocumentUpload\.file\.name/);
  assert.match(client, />Annulla<\/button>/);
  assert.match(client, /await upload\(pending\.type, pending\.file\)/);
});
