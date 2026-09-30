import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
if (!process.argv.includes("--confirm-production"))
  throw new Error("Pubblicazione ufficiale bloccata: specificare --confirm-production");

const config = readFileSync(join(root, "wrangler.jsonc"), "utf8");
if (!/"database_name"\s*:\s*"viaggio-in-india-db"/.test(config))
  throw new Error("Configurazione D1 di produzione non riconosciuta");
if (/"database_name"\s*:\s*"viaggio-in-india-qa-db"/.test(config))
  throw new Error("Protezione dati: configurazione QA rilevata nel deploy ufficiale");

const npxCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js");
const runNode = (file, args) => {
  const result = spawnSync(process.execPath, [file, ...args], {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    shell: false,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Comando di pubblicazione non riuscito (${result.status})`);
  return `${result.stdout || ""}\n${result.stderr || ""}`;
};

if (!process.argv.includes("--skip-build")) {
  const npmCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
  runNode(npmCli, ["run", "build"]);
}

const production = runNode(npxCli, [
  "--yes", "wrangler@4.118.0", "pages", "deploy", "dist",
  "--project-name", "viaggio-in-thailandia-2026", "--branch", "main", "--commit-dirty=true",
]);
const productionUrl = production.match(/https:\/\/[a-z0-9-]+\.viaggio-in-thailandia-2026\.pages\.dev/)?.[0];
if (!productionUrl) throw new Error("URL del deployment ufficiale non rilevato");

const redirect = runNode(npxCli, [
  "--yes", "wrangler@4.118.0", "pages", "deploy", "redirect-old-site",
  "--project-name", "viaggio-in-india-2026", "--branch", "main", "--commit-dirty=true",
]);
const redirectUrl = redirect.match(/https:\/\/[a-z0-9-]+\.viaggio-in-india-2026\.pages\.dev/)?.[0];
if (!redirectUrl) throw new Error("URL del reindirizzamento legacy non rilevato");

console.log(`PRODUCTION_URL=${productionUrl}`);
console.log(`REDIRECT_URL=${redirectUrl}`);
