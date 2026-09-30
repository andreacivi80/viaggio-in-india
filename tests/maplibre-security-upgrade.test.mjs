import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const packageJson = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
const packageLock = JSON.parse(await readFile(new URL("package-lock.json", root), "utf8"));
const source = await readFile(new URL("src/main.jsx", root), "utf8");
const precacheBuilder = await readFile(new URL("scripts/inject-sw-precache.mjs", root), "utf8");

test("MapLibre usa una versione non vulnerabile all'XSS GHSA-jrc7-96c5-q579", () => {
  assert.equal(packageJson.dependencies["maplibre-gl"], "6.11.2");
  assert.equal(packageLock.packages["node_modules/maplibre-gl"].version, "6.11.2");
});

test("la migrazione MapLibre v6 usa ESM e configura il worker del bundler", () => {
  assert.match(source, /maplibre-gl-worker\.mjs\?worker&url/);
  assert.match(source, /maplibregl\.setWorkerUrl\(maplibreWorkerUrl\)/);
  assert.doesNotMatch(source, /\{\s*default:\s*maplibregl\s*\}/);
  assert.doesNotMatch(source, /const\s+\{\s*default:\s*maplibregl\s*\}\s*=\s*await/);
  assert.equal((source.match(/loadMapLibre\(\)/g) || []).length, 4);
});

test("la cache offline include anche i moduli caricati dinamicamente", () => {
  assert.match(precacheBuilder, /readdir\("dist\/assets", \{ recursive: true/);
  assert.match(precacheBuilder, /relative\("dist\/assets", entry\.parentPath\)/);
  assert.match(precacheBuilder, /asset\.includes\("\/dist\/"\)/);
  assert.match(precacheBuilder, /\.\.\.htmlAssets, \.\.\.builtAssets/);
});
