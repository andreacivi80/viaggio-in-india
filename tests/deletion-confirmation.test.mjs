import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("le conferme descrivono chiaramente i dati eliminati", async () => {
  const source = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
  assert.match(source, /Eliminare questo contenuto\?[\s\S]*?Verranno rimossi il post e i suoi allegati\./);
  assert.match(source, /Eliminare questo commento\?[\s\S]*?Il testo e l’eventuale allegato verranno rimossi\./);
  assert.match(source, /Eliminare questo documento\?[\s\S]*?Verrà rimosso dalla cartella privata del viaggiatore\./);
  assert.match(source, /Eliminare l’invio in attesa\?[\s\S]*?Verrà rimosso soltanto dal telefono\. Nessun contenuto già pubblicato sarà eliminato\./);
  assert.match(source, /offlineQueueDialog: true[\s\S]*?cancelOnBack[\s\S]*?setPendingOfflineDelete\(null\)/);
  assert.match(source, /removeQueuedRequest\(pendingOfflineDelete\.id\)[\s\S]*?closeOfflineDelete\(\)/);
  assert.match(source, /Annulla[\s\S]*?Elimina/);
});
