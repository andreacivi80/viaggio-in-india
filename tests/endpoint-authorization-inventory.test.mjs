import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const key = ({ method, path }) => `${method} ${path}`;

test("ogni endpoint dichiarato nel Worker è presente nell’inventario autorizzativo", async () => {
  const [worker, rawInventory] = await Promise.all([
    read("functions/api/[[path]].js"),
    read("docs/API-AUTHORIZATION-INVENTORY.json"),
  ]);
  const inventory = JSON.parse(rawInventory);
  const discovered = [];
  for (const match of worker.matchAll(/request\.method === "([A-Z]+)" && path === "([^"]+)"/g))
    discovered.push(`${match[1]} ${match[2]}`);
  for (const match of worker.matchAll(/path === "([^"]+)" && request\.method === "([A-Z]+)"/g))
    discovered.push(`${match[2]} ${match[1]}`);
  for (const match of worker.matchAll(/request\.method === "([A-Z]+)" && path\.startsWith\("([^"]+)"\)/g))
    discovered.push(`${match[1]} ${match[2]}*`);
  for (const match of worker.matchAll(/path\.startsWith\("([^"]+)"\) && request\.method === "([A-Z]+)"/g))
    discovered.push(`${match[2]} ${match[1]}*`);
  assert.deepEqual(
    [...new Set(discovered)].sort(),
    inventory.exact.map(key).sort(),
    "una nuova rotta non può essere aggiunta senza dichiararne il livello di accesso",
  );
});

test("le rotte dinamiche e i controlli server critici restano esplicitamente classificati", async () => {
  const [worker, rawInventory] = await Promise.all([
    read("functions/api/[[path]].js"),
    read("docs/API-AUTHORIZATION-INVENTORY.json"),
  ]);
  const inventory = JSON.parse(rawInventory);
  assert.equal(inventory.exact.length, 39);
  assert.equal(inventory.dynamic.length, 5);
  for (const entry of [...inventory.exact, ...inventory.dynamic])
    assert.ok(entry.access && entry.access !== "unknown", `policy mancante per ${entry.path}`);
  for (const pattern of [
    /const uploadStatusMatch = path\.match/,
    /const uploadPartMatch = path\.match/,
    /const uploadCompleteMatch = path\.match/,
    /\["GET", "HEAD"\]\.includes\(request\.method\) && path\.startsWith\("media\/"\)/,
  ]) assert.match(worker, pattern);
  assert.match(worker, /path === "auth\/unlock"[\s\S]*?return json\([^;]+403\)/);
  assert.match(worker, /path === "push\/test"[\s\S]*?session\.role !== "coordinator"/);
  assert.match(worker, /path === "security\/audit"[\s\S]*?session\.role !== "coordinator"/);
  assert.match(worker, /path === "comments"[\s\S]*?sessionFromRequest[\s\S]*?guestFromRequest[\s\S]*?!session && !guest/);
  assert.match(worker, /path === "private"[\s\S]*?sessionFromRequest[\s\S]*?!session/);
  assert.match(worker, /path === "documents"[\s\S]*?ownsDocument[\s\S]*?coordinatorVerificationOnly/);
});
