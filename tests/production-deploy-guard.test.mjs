import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workflowPath = new URL("../.github/workflows/deploy-qa-1373.yml", import.meta.url);
const deployScriptPath = new URL("../scripts/deploy-cloudflare-session.ps1", import.meta.url);
const nodeDeployScriptPath = new URL("../scripts/deploy-production.mjs", import.meta.url);

test("un push su main pubblica soltanto in QA", async () => {
  const workflow = await readFile(workflowPath, "utf8");
  assert.match(workflow, /deploy_production:[\s\S]*default: false/);
  assert.match(
    workflow,
    /deploy-production:[\s\S]*github\.event_name == 'workflow_dispatch' && inputs\.deploy_production == true/,
  );

  const automaticJob = workflow.split(/^  deploy-production:/m)[0];
  assert.doesNotMatch(automaticJob, /--project-name viaggio-in-india-2026 --branch main/);
  assert.match(automaticJob, /--project-name viaggio-in-india-2026-qa --branch main/);
});

test("lo script locale richiede una conferma esplicita per la produzione", async () => {
  const script = await readFile(deployScriptPath, "utf8");
  assert.match(script, /\[string\]\$Target = "qa"/);
  assert.match(script, /\[switch\]\$ConfirmProduction/);
  assert.match(script, /-not \$ConfirmProduction/);
  assert.match(script, /Pubblicazione ufficiale bloccata/);
});

test("il deploy ufficiale Node resta invisibile e protetto", async () => {
  const script = await readFile(nodeDeployScriptPath, "utf8");
  assert.match(script, /--confirm-production/);
  assert.match(script, /windowsHide: true/);
  assert.match(script, /shell: false/);
  assert.match(script, /viaggio-in-india-qa-db/);
  assert.doesNotMatch(script, /powershell|pwsh/i);
});
