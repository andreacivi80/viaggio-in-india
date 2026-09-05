import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [ui, worker, queue] = await Promise.all([
  readFile(new URL("../src/main.jsx", import.meta.url), "utf8"),
  readFile(new URL("../functions/api/[[path]].js", import.meta.url), "utf8"),
  readFile(new URL("../src/offlineQueue.js", import.meta.url), "utf8"),
]);

test("le bozze restano private sul dispositivo e non vengono sincronizzate", () => {
  assert.match(ui, /localStorage\.getItem\("india-draft"\)/);
  assert.match(ui, /localStorage\.setItem\("india-draft", text\)/);
  assert.match(ui, /localStorage\.removeItem\("india-draft"\)/);
  assert.doesNotMatch(worker, /path === "drafts?"|CREATE TABLE IF NOT EXISTS drafts?/i);
  assert.match(queue, /const DB_NAME = "india-insieme-offline"/);
  assert.match(queue, /indexedDB\.open\(DB_NAME, DB_VERSION\)/);
});
