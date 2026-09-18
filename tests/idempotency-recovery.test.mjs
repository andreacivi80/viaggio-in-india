import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../functions/api/[[path]].js", import.meta.url), "utf8");

test("una prenotazione idempotente bloccata può essere recuperata senza doppia esecuzione", () => {
  assert.match(worker, /Date\.parse\(String\(existing\.created_at/);
  assert.match(worker, /Date\.now\(\) - 2 \* 60 \* 1000/);
  assert.match(worker, /WHERE operation_hash=\? AND state='processing' AND created_at=\?/);
  assert.match(worker, /if \(Number\(reclaimed\?\.meta\?\.changes \|\| 0\) > 0\) return \{ operationHash \}/);
});
