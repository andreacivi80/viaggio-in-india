import test from "node:test";
import assert from "node:assert/strict";
import { unzipSync } from "fflate";
import { readFileSync } from "node:fs";
import { archiveEntries, createArchive } from "../scripts/create-clean-source-archive.mjs";

const forbidden = /(^|\/)(\.git|\.wrangler|artifacts|dist|node_modules|playwright-report|test-results)(\/|$)|(^|\/)\.env/i;

test("l'archivio sorgente include tutti i componenti necessari e nessun dato generato", () => {
  const names = Object.keys(archiveEntries());
  for (const required of [
    "README.md", "package.json", "src/main.jsx", "functions/api/[[path]].js",
    "db/schema.sql", "wrangler.jsonc", "docs/CONTROL-COVERAGE.md",
  ]) assert.ok(names.includes(required), `${required} deve essere consegnato`);
  assert.equal(names.some((name) => forbidden.test(name)), false);
});

test("lo ZIP prodotto è leggibile e contiene un manifesto coerente", () => {
  const { outputPath, fileCount } = createArchive();
  const archive = unzipSync(new Uint8Array(readFileSync(outputPath)));
  const names = Object.keys(archive);
  assert.equal(names.length, fileCount);
  assert.ok(names.includes("SOURCE-ARCHIVE-MANIFEST.json"));
  assert.equal(names.some((name) => forbidden.test(name)), false);
  const manifest = JSON.parse(new TextDecoder().decode(archive["SOURCE-ARCHIVE-MANIFEST.json"]));
  assert.equal(manifest.version, "1.48.37");
  assert.equal(manifest.files.length, fileCount - 1);
});
