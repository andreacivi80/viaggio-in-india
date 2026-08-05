import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const [namespaceId, key, outputDirectory] = process.argv.slice(2);
if (!namespaceId || !key || !outputDirectory)
  throw new Error("Uso: node scripts/test-kv-media-backup-restore.mjs <namespace-id> <key> <cartella-backup>");

const localWrangler = fileURLToPath(new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url));
const npxCache = join(process.env.LOCALAPPDATA || "", "npm-cache", "_npx");
const cachedWranglers = existsSync(npxCache)
  ? readdirSync(npxCache, { recursive: true })
      .map(String)
      .filter((entry) => /node_modules[\\/]wrangler[\\/]bin[\\/]wrangler\.js$/.test(entry))
      .map((entry) => join(npxCache, entry))
  : [];
const wranglerCli = existsSync(localWrangler) ? localWrangler : cachedWranglers.at(-1);
if (!wranglerCli) throw new Error("Wrangler non disponibile nella cache locale");
const wrangler = (...args) => execFileSync(process.execPath, [wranglerCli, ...args], {
  cwd: process.cwd(),
  encoding: null,
  windowsHide: true,
  stdio: ["ignore", "pipe", "pipe"],
  maxBuffer: 100 * 1024 * 1024,
});
const get = () => wrangler("kv", "key", "get", key, "--namespace-id", namespaceId, "--remote");
const hash = (value) => createHash("sha256").update(value).digest("hex");

mkdirSync(outputDirectory, { recursive: true });
const before = get();
const backupPath = join(outputDirectory, `qa-media-${Date.now()}.bin`);
writeFileSync(backupPath, before);
const expectedHash = hash(before);

wrangler("kv", "key", "delete", key, "--namespace-id", namespaceId, "--remote");
let deleted = false;
try { get(); } catch { deleted = true; }
if (!deleted) throw new Error("Il file MEDIA non risulta eliminato prima del ripristino");

wrangler(
  "kv", "key", "put", key,
  "--path", backupPath,
  "--namespace-id", namespaceId,
  "--remote",
  "--metadata", JSON.stringify({ contentType: "image/png", name: "foto-ripristinata.png" }),
);
const restored = get();
const restoredHash = hash(restored);
if (restoredHash !== expectedHash)
  throw new Error(`Hash differente dopo il ripristino: ${expectedHash} != ${restoredHash}`);

// Il file era una fixture QA: dopo la prova non deve restare nell'archivio.
wrangler("kv", "key", "delete", key, "--namespace-id", namespaceId, "--remote");
console.log(JSON.stringify({ backupPath, bytes: before.byteLength, sha256: expectedHash, restored: true, cleaned: true }));
