import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const registry = JSON.parse(readFileSync("docs/DOCUMENTED-FUNCTION-REGISTRY.json", "utf8"));
const interfaceSource = readFileSync("src/main.jsx", "utf8");

test("A0019: ogni funzione documentata è raggiungibile nell'interfaccia", () => {
  assert.ok(registry.functions.length >= 20, "Il registro funzionale è incompleto");
  const ids = new Set();
  for (const item of registry.functions) {
    assert.match(item.id, /^F\d{3}$/);
    assert.ok(!ids.has(item.id), `ID duplicato: ${item.id}`);
    ids.add(item.id);
    assert.ok(item.name);
    assert.ok(item.ui.length > 0, `${item.id} non ha evidenza UI`);
    for (const marker of item.ui) {
      assert.ok(interfaceSource.includes(marker), `${item.id} (${item.name}) non è presente nell'interfaccia: ${marker}`);
    }
  }
});
