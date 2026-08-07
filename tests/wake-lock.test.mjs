import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");

test("lo schermo resta attivo durante l'uso e il blocco viene rilasciato in background", () => {
  assert.match(source, /navigator\.wakeLock\?\.request/);
  assert.match(source, /navigator\.wakeLock\.request\("screen"\)/);
  assert.match(source, /document\.visibilityState === "visible"/);
  assert.match(source, /else releaseWakeLock\(\)/);
  assert.match(source, /window\.addEventListener\("pointerdown", requestWakeLock/);
  assert.match(source, /window\.removeEventListener\("pointerdown", requestWakeLock\)/);
});
