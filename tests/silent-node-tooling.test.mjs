import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const deploy = await readFile(new URL("../scripts/deploy-qa.mjs", import.meta.url), "utf8");

test("il comando QA predefinito non avvia PowerShell", () => {
  assert.equal(packageJson.scripts["deploy:qa"], "node scripts/deploy-qa.mjs");
  assert.doesNotMatch(packageJson.scripts["deploy:qa"], /powershell|pwsh/i);
});

test("il deploy Node nasconde i processi e non usa una shell intermedia", () => {
  assert.match(deploy, /windowsHide: true/);
  assert.match(deploy, /shell: false/);
  assert.doesNotMatch(deploy, /powershell|pwsh|cmd\.exe/i);
  assert.match(deploy, /viaggio-in-india-qa-db/);
  assert.match(deploy, /npx-cli\.js/);
  assert.match(deploy, /rilevato un binding di produzione/);
});
