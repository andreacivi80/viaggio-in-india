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
  const currentProfileBlock =
    source.match(/const currentProfile =[\s\S]*?;\r?\n\s*useEffect/)?.[0] || "";
  assert.doesNotMatch(
    currentProfileBlock,
    /india-visitor-name/,
    "un semplice nome pubblico non deve diventare identità da viaggiatore",
  );
});

test("il pannello personale mostra direttamente password o comandi del profilo", () => {
  assert.match(source, /La password è comune a tutti i viaggiatori/);
  assert.match(source, /currentProfile && verifiedSessionToken/);
  assert.doesNotMatch(source, /className="accessModeSwitch"/);
});

test("il ruolo scelto al primo accesso viene salvato dalla risposta del server", () => {
  assert.match(source, /aria-label="Scegli il ruolo"/);
  assert.match(source, /result\.profile\.role \|\| "traveler"/);
  assert.match(source, /currentProfile\.role === "coordinator"/);
});
