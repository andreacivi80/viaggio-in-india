import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [main, worker] = await Promise.all([
  readFile(new URL("../src/main.jsx", import.meta.url), "utf8"),
  readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
]);

test("la posizione usa solo rilevamenti espliciti e non mantiene il GPS in ascolto", () => {
  assert.doesNotMatch(main, /watchPosition\s*\(/);
  assert.match(main, /getCurrentPosition\s*\(/);
});

test("le notifiche restano event-driven nel Service Worker", () => {
  assert.match(worker, /addEventListener\(["']push["']/);
  assert.doesNotMatch(worker, /setInterval\s*\(/);
  assert.doesNotMatch(worker, /watchPosition\s*\(/);
});
