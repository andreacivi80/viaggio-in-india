import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const accountId = "4750912726b08c1c18d36a0df35a7334";
const productionProject = "viaggio-in-thailandia-2026";
const qaProject = "viaggio-in-india-2026-qa";

const productionConfig = JSON.parse(await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
const qaConfig = JSON.parse(await readFile(new URL("../wrangler.qa.jsonc", import.meta.url), "utf8"));

const expected = {
  [productionProject]: {
    DB: productionConfig.d1_databases.find(({ binding }) => binding === "DB")?.database_id,
    MEDIA: productionConfig.kv_namespaces.find(({ binding }) => binding === "MEDIA")?.id,
  },
  [qaProject]: {
    DB: qaConfig.d1_databases.find(({ binding }) => binding === "DB")?.database_id,
    MEDIA: qaConfig.kv_namespaces.find(({ binding }) => binding === "MEDIA")?.id,
  },
};

const tokenPaths = [
  process.env.WRANGLER_CONFIG_PATH,
  process.env.APPDATA && join(process.env.APPDATA, "xdg.config", ".wrangler", "config", "default.toml"),
  join(homedir(), ".wrangler", "config", "default.toml"),
].filter(Boolean);

let token = process.env.CLOUDFLARE_API_TOKEN;
for (const path of tokenPaths) {
  if (token) break;
  try {
    const config = await readFile(path, "utf8");
    token = config.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
  } catch {
    // Continue with the next standard Wrangler credentials location.
  }
}
if (!token) throw new Error("Credenziali Wrangler non disponibili.");

const result = {};
for (const project of [productionProject, qaProject]) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${project}`,
    { headers: { authorization: `Bearer ${token}` } },
  );
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(`Lettura Cloudflare fallita per ${project}: HTTP ${response.status}`);
  }

  const environments = project === qaProject ? ["production", "preview"] : ["production"];
  result[project] = {};
  for (const environment of environments) {
    const deploymentConfig = payload.result.deployment_configs?.[environment] ?? {};
    const bindings = deploymentConfig.bindings ?? {};
    const actual = {
      DB: bindings.DB?.id ?? deploymentConfig.d1_databases?.DB?.id,
      MEDIA: bindings.MEDIA?.namespace_id ?? deploymentConfig.kv_namespaces?.MEDIA?.namespace_id,
    };
    if (actual.DB !== expected[project].DB || actual.MEDIA !== expected[project].MEDIA) {
      const bindingSummary = Object.fromEntries(Object.entries(bindings).map(([name, value]) => [name, {
        type: value?.type,
        id: value?.id,
        namespace_id: value?.namespace_id,
      }]));
      throw new Error(`${project}/${environment}: binding remoto inatteso: ${JSON.stringify({ actual, expected: expected[project], configKeys: Object.keys(deploymentConfig), bindings: bindingSummary })}`);
    }
    result[project][environment] = actual;
  }
}

if (result[productionProject].production.DB === result[qaProject].production.DB) {
  throw new Error("Produzione e QA condividono il binding DB.");
}
if (result[productionProject].production.MEDIA === result[qaProject].production.MEDIA) {
  throw new Error("Produzione e QA condividono il binding MEDIA.");
}

console.log(JSON.stringify({ status: "PASS", projects: result }, null, 2));
