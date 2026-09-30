import { readdir, readFile, writeFile } from "node:fs/promises";
import { relative } from "node:path";

const html = await readFile("dist/index.html", "utf8");
const workerPath = "dist/sw.js";
const worker = await readFile(workerPath, "utf8");
const htmlAssets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
  .map((match) => match[1])
  .filter((path) => /^(?:\.\/|\/)?assets\//.test(path))
  .map((path) => `/${path.replace(/^(?:\.\/|\/)?/, "")}`);
const builtAssets = (await readdir("dist/assets", { recursive: true, withFileTypes: true }))
  .filter((entry) => entry.isFile())
  .map((entry) => {
    const relativeParent = relative("dist/assets", entry.parentPath);
    return `/assets/${relativeParent ? `${relativeParent.replaceAll("\\", "/")}/` : ""}${entry.name}`;
  });
// I moduli caricati in modo dinamico (per esempio MapLibre) non compaiono
// nell'HTML. Precaricare l'intero output Vite evita che la prima apertura
// della mappa fallisca se il telefono perde la rete prima del primo tap.
const assets = [...new Set([...htmlAssets, ...builtAssets])].sort();
if (assets.some((asset) => asset.includes("/dist/") || asset.includes("\\")))
  throw new Error("Percorso precache non valido");
if (!assets.length) throw new Error("Nessun asset principale trovato per la cache offline");
if (!worker.includes("/* BUILD_PRECACHE */")) throw new Error("Segnaposto precache assente dal Service Worker");
const injected = worker.replace(
  "/* BUILD_PRECACHE */",
  assets.map((asset) => JSON.stringify(asset)).join(",\n  "),
);
await writeFile(workerPath, injected, "utf8");
console.log(`Precache offline: ${assets.length} asset principali`);
