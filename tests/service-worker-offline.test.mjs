import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
const packageData = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

test("il Service Worker usa una cache versionata e chiavi URL riutilizzabili offline", () => {
  assert.match(worker, new RegExp(`india-insieme-v${packageData.version.replaceAll(".", "\\.")}`));
  assert.match(worker, /const cacheKey = event\.request\.mode === "navigate"[\s\S]*?url\.href/);
  assert.match(worker, /cached\.then\(\(hit\) => hit \|\| network\)/);
  assert.match(worker, /cache\.put\(cacheKey, response\.clone\(\)\)/);
});

test("le API private non vengono mai servite dalla cache offline", () => {
  assert.match(worker, /url\.pathname\.startsWith\("\/api\/"\)[\s\S]*?event\.respondWith\(fetch\(event\.request\)\)/);
});
