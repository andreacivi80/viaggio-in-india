import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const forbidden = [
  ["VAPID", "PRIVATE", "KEY"].join("_"),
  ["CLOUDFLARE", "API", "TOKEN"].join("_"),
  ["CF", "API", "TOKEN"].join("_"),
  ["india", "26"].join(""),
];
const extensions = /\.(?:css|html|js|json|mjs)$/i;

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(path));
    else if (extensions.test(entry.name)) files.push(path);
  }
  return files;
}

const leaks = [];
for (const path of await filesUnder("dist")) {
  const source = await readFile(path, "utf8");
  for (const value of forbidden) {
    if (source.toLowerCase().includes(value.toLowerCase())) leaks.push(`${path}: ${value}`);
  }
}
if (leaks.length) throw new Error(`Segreti o identificatori riservati nel client:\n${leaks.join("\n")}`);
console.log("Scansione segreti client: nessuna credenziale nel bundle");
