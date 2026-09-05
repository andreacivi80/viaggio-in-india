import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
const serviceWorker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
const serviceWorkerRegister = await readFile(new URL("../public/sw-register.js", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

test("K0: un errore React non lascia una schermata bianca e non cancella i dati", () => {
  assert.match(source, /class AppErrorBoundary extends React\.Component/);
  assert.match(source, /static getDerivedStateFromError\(\)/);
  assert.match(source, /I dati salvati non vengono cancellati/);
  assert.match(source, /<AppErrorBoundary><App \/><\/AppErrorBoundary>/);
});

test("K0: storage browser negato o pieno non provoca lo shutdown dell'app", () => {
  assert.match(source, /const safeWebStorage = \(name\) =>/);
  assert.match(source, /catch \{ return fallback\.get\(key\) \?\? null; \}/);
  assert.match(source, /catch \{ \/\* mantiene la sessione in memoria \*\//);
  assert.match(source, /const localStorage = safeWebStorage\("localStorage"\)/);
  assert.match(source, /const sessionStorage = safeWebStorage\("sessionStorage"\)/);
});

test("K1: aggiornamento e recupero offline usano cache versionata e fallback della shell", () => {
  assert.match(serviceWorker, new RegExp(`thailandia-insieme-v${packageJson.version.replaceAll(".", "\\.")}`));
  assert.match(serviceWorker, /\.filter\(\(key\) => key !== CACHE\)/);
  assert.match(serviceWorker, /event\.request\.mode === "navigate"/);
  assert.match(serviceWorker, /event\.respondWith\(network\.catch\(\(\) => cached/);
  assert.match(serviceWorker, /hit \|\| caches\.match\("\.\/"\)/);
});

test("K1: API e documenti privati restano esclusi dal fallback offline", () => {
  assert.match(serviceWorker, /url\.pathname\.startsWith\("\/api\/"\)/);
  assert.match(serviceWorker, /event\.respondWith\(fetch\(event\.request\)\)/);
  const precache = serviceWorker.match(/const PRECACHE = \[([\s\S]*?)\];/)?.[1] || "";
  assert.doesNotMatch(precache, /\/api\//);
});

test("K0: un aggiornamento non ricarica la pagina durante scrittura, registrazione o upload", () => {
  assert.match(serviceWorkerRegister, /registration\.update\(\)/);
  assert.match(serviceWorkerRegister, /SKIP_WAITING/);
  assert.doesNotMatch(serviceWorkerRegister, /location\.reload\s*\(/);
  assert.doesNotMatch(serviceWorkerRegister, /controllerchange/);
});

test("K1: la sincronizzazione riduce il polling e accelera soltanto su ritorno online o in primo piano", () => {
  assert.match(source, /setInterval\(checkVersion, 5000\)/);
  assert.match(source, /if \(document\.hidden \|\| !navigator\.onLine\) return/);
  assert.match(source, /addEventListener\("online", checkVersion\)/);
  assert.match(source, /document\.addEventListener\("visibilitychange", onReturn\)/);
  assert.doesNotMatch(source, /setInterval\(checkVersion, 2500\)/);
});
