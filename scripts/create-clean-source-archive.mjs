import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";
import { strToU8, zipSync } from "fflate";

const root = resolve(import.meta.dirname, "..");
const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
const outputDirectory = join(root, "artifacts", "source");
const outputPath = join(outputDirectory, `viaggio-thailandia-source-${version}.zip`);
const allowedRootDirectories = new Set(["db", "docs", "functions", "public", "scripts", "src", "tests"]);
const allowedRootFiles = new Set([
  ".gitignore", "README.md", "index.html", "package-lock.json", "package.json",
  "playwright.config.mjs", "playwright.release.config.mjs", "vite.config.js",
  "wrangler.jsonc", "wrangler.qa.jsonc",
]);
const excludedNames = new Set([
  ".git", ".wrangler", "artifacts", "dist", "node_modules", "playwright-report", "test-results",
]);

export function archiveEntries() {
  const entries = {};
  const visit = (absolutePath) => {
    const relativePath = relative(root, absolutePath).split(sep).join("/");
    const name = basename(absolutePath);
    if (excludedNames.has(name) || name.startsWith(".env")) return;
    const stats = statSync(absolutePath);
    if (stats.isDirectory()) {
      for (const child of readdirSync(absolutePath)) visit(join(absolutePath, child));
      return;
    }
    if (stats.isFile()) entries[relativePath] = new Uint8Array(readFileSync(absolutePath));
  };
  for (const directory of allowedRootDirectories) visit(join(root, directory));
  for (const file of allowedRootFiles) visit(join(root, file));
  return entries;
}

export function createArchive() {
  const entries = archiveEntries();
  mkdirSync(outputDirectory, { recursive: true });
  const manifest = {
    name: "Thailandia Insieme",
    version,
    generated_at: new Date().toISOString(),
    files: Object.keys(entries).sort(),
  };
  entries["SOURCE-ARCHIVE-MANIFEST.json"] = strToU8(`${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(outputPath, zipSync(entries, { level: 9 }));
  return { outputPath, fileCount: Object.keys(entries).length };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const result = createArchive();
  console.log(`SOURCE_ARCHIVE=${result.outputPath}`);
  console.log(`SOURCE_FILES=${result.fileCount}`);
}
