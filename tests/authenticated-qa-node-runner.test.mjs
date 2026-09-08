import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../scripts/run-authenticated-qa-node.mjs", import.meta.url), "utf8");

test("il runner Node limita ogni scrittura al database QA", () => {
  assert.match(source, /viaggio-in-india-2026-qa\.pages\.dev/);
  assert.match(source, /i test scriventi possono usare soltanto QA/);
  assert.match(source, /viaggio-in-india-qa-db/);
  assert.match(source, /npx-cli\.js/);
  assert.doesNotMatch(source, /d1 execute[^\n]*viaggio-in-india-db/);
});

test("il runner Node usa processi nascosti e pulizia limitata agli ID del run", () => {
  assert.match(source, /windowsHide: true/);
  assert.match(source, /shell: false/);
  assert.doesNotMatch(source, /powershell|pwsh|cmd\.exe/i);
  assert.match(source, /DELETE FROM profiles WHERE id IN/);
  assert.doesNotMatch(source, /DELETE FROM profiles;/);
  assert.doesNotMatch(source, /DELETE FROM posts;/);
  assert.match(source, /finally[\s\S]*?d1File\(cleanupPath\)/);
  assert.match(source, /attempt <= 3/);
});
