import { readFile, writeFile } from "node:fs/promises";

const html = await readFile("dist/index.html", "utf8");
const workerPath = "dist/sw.js";
const worker = await readFile(workerPath, "utf8");
const assets = [...new Set(
  [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => match[1])
    .filter((path) => /^(?:\.\/|\/)?assets\//.test(path))
    .map((path) => `/${path.replace(/^(?:\.\/|\/)?/, "")}`),
)];
if (!assets.length) throw new Error("Nessun asset principale trovato per la cache offline");
if (!worker.includes("/* BUILD_PRECACHE */")) throw new Error("Segnaposto precache assente dal Service Worker");
const injected = worker.replace(
  "/* BUILD_PRECACHE */",
  assets.map((asset) => JSON.stringify(asset)).join(",\n  "),
);
await writeFile(workerPath, injected, "utf8");
console.log(`Precache offline: ${assets.length} asset principali`);
