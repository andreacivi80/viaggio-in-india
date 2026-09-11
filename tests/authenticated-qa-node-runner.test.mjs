import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../scripts/run-authenticated-qa-node.mjs", import.meta.url), "utf8");
const rateLimitDimensionsSource = await readFile(
  new URL("./extended-p0-rate-limit-dimensions.mjs", import.meta.url),
  "utf8",
);
const backupCommentsSource = await readFile(
  new URL("./extended-p0-backup-comments.mjs", import.meta.url),
  "utf8",
);
const localBackupRunnerSource = await readFile(
  new URL("../scripts/run-local-backup-content.mjs", import.meta.url),
  "utf8",
);
const backupContentSource = await readFile(
  new URL("./extended-p0-backup-content.mjs", import.meta.url),
  "utf8",
);

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
  assert.match(source, /testFiles[\s\S]*?split\(","\)/);
});

test("il runner Node esegue anche i collaudi touch Playwright senza shell intermedia", () => {
  assert.match(source, /endsWith\("\.spec\.mjs"\)/);
  assert.match(source, /"playwright", "test"/);
  assert.match(source, /QA_UI_SESSION_TOKEN: tokens\.owner/);
  assert.match(source, /QA_UI_DEVICE_KEY: deviceKeys\.owner/);
  assert.match(source, /QA_UI_INVITE_TOKEN: tokens\.invite/);
  assert.match(source, /QA_UI_SWITCH_INVITE_TOKEN: tokens\.switchInvite/);
  assert.match(source, /QA_UI_COORDINATOR_INVITE_TOKEN: tokens\.coordinatorInvite/);
  assert.match(source, /QA_UI_EXPIRED_SESSION_TOKEN: tokens\.expired/);
  assert.match(source, /configurazione QA incompleta/);
  assert.match(source, /testSource\.match\(\/QA_UI_/);
  assert.match(source, /Test QA inesistente/);
  assert.match(source, /INSERT INTO profile_invites/);
});

test("il runner prepara le posizioni di scadenza solo per il relativo controllo", () => {
  assert.match(source, /testFiles\.includes\("extended-p0-location-retention\.mjs"\)/);
  assert.match(source, /Posizione scaduta QA/);
  assert.match(source, /48 \* 86400000/);
});

test("il runner distingue il secondo telefono proprio dal telefono di un altro profilo", () => {
  assert.match(source, /QA_SECOND_DEVICE_ID: value\("device-owner-secondary"\)/);
  assert.match(source, /QA_OTHER_DEVICE_ID: value\("device-other"\)/);
});

test("il collaudo dei limiti usa l'IP reale senza falsificare intestazioni Cloudflare", () => {
  assert.doesNotMatch(rateLimitDimensionsSource, /cf-connecting-ip/i);
  assert.match(rateLimitDimensionsSource, /QA_OWNER_DEVICE_KEY/);
  assert.match(rateLimitDimensionsSource, /QA_COORDINATOR_SECOND_DEVICE_KEY/);
});

test("l'esportazione QA usa un processo nascosto senza shell intermedia", () => {
  assert.match(backupCommentsSource, /windowsHide: true/);
  assert.match(backupCommentsSource, /shell: false/);
  assert.match(backupCommentsSource, /spawn\(process\.execPath/);
  assert.doesNotMatch(backupCommentsSource, /powershell|pwsh|shell: true/i);
});

test("il backup completo usa soltanto database locale e processi invisibili", () => {
  assert.match(localBackupRunnerSource, /"--local"/);
  assert.doesNotMatch(localBackupRunnerSource, /"--remote"/);
  assert.match(localBackupRunnerSource, /windowsHide: true/);
  assert.match(localBackupRunnerSource, /shell: false/);
  assert.match(localBackupRunnerSource, /taskkill[\s\S]*?"\/PID"[\s\S]*?String\(server\.pid\)[\s\S]*?"\/T"/);
  assert.doesNotMatch(localBackupRunnerSource, /powershell|pwsh|cmd\.exe/i);
  assert.match(backupContentSource, /QA_OWNER_DEVICE_KEY/);
  assert.match(backupContentSource, /"x-device-key": deviceKey/);
});
