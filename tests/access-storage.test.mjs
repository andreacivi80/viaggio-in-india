import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");

test("la password comune non viene mai conservata nel dispositivo", () => {
  assert.doesNotMatch(source, /getItem\(["']india-group-code["']\)/);
  assert.doesNotMatch(source, /setItem\(["']india-group-code["']/);
  assert.match(source, /removeItem\(["']india-group-code["']\)/);
});

test("un profilo corrente deriva soltanto da una sessione confermata", () => {
  assert.match(source, /const currentProfile = sessionProfile/);
  assert.doesNotMatch(
    source,
    /people\.find\([\s\S]{0,400}india-visitor-name/,
    "un semplice nome pubblico non deve diventare identità da viaggiatore",
  );
});

test("la vista gruppo richiede una sessione personale verificata", () => {
  assert.match(source, /disabled=\{!verifiedSessionToken\}/);
  assert.match(source, /className=\{!publicPreview && verifiedSessionToken/);
});
