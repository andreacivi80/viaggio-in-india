import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const branchArgument = process.argv.find((argument) => argument.startsWith("--branch="));
const branch = branchArgument?.slice("--branch=".length) || "main";
const deployRoot = mkdtempSync(join(tmpdir(), "thailandia-qa-deploy-"));

function runNode(file, args) {
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
  if (result.status !== 0) throw new Error(`Pubblicazione QA non riuscita (${result.status})`);
  return `${result.stdout || ""}\n${result.stderr || ""}`;
}

try {
  cpSync(join(root, "dist"), join(deployRoot, "dist"), { recursive: true });
  cpSync(join(root, "functions"), join(deployRoot, "functions"), { recursive: true });
  cpSync(join(root, "package.json"), join(deployRoot, "package.json"));
  cpSync(join(root, "wrangler.qa.jsonc"), join(deployRoot, "wrangler.jsonc"));
  symlinkSync(join(root, "node_modules"), join(deployRoot, "node_modules"), "junction");

  const config = readFileSync(join(deployRoot, "wrangler.jsonc"), "utf8");
  if (!/"database_name"\s*:\s*"viaggio-in-india-qa-db"/.test(config))
    throw new Error("Protezione dati: il pacchetto QA non usa il database QA");
  if (/"database_name"\s*:\s*"viaggio-in-india-db"/.test(config))
    throw new Error("Protezione dati: rilevato un binding di produzione nel pacchetto QA");

  const output = runNode(join(root, "node_modules", "wrangler", "bin", "wrangler.js"), [
    "pages", "deploy", "dist", "--cwd", deployRoot,
    "--project-name", "viaggio-in-india-2026-qa", "--branch", branch, "--commit-dirty=true",
  ]);
  const deploymentUrl = output.match(/https:\/\/[a-z0-9-]+\.viaggio-in-india-2026-qa\.pages\.dev/)?.[0];
  if (!deploymentUrl) throw new Error("URL QA non rilevato");
  console.log(`DEPLOYMENT_URL=${deploymentUrl}`);
} finally {
  rmSync(deployRoot, { recursive: true, force: true });
}
