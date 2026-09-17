import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ui = readFileSync("src/main.jsx", "utf8");
const api = readFileSync("functions/api/[[path]].js", "utf8");
const schema = readFileSync("db/schema.sql", "utf8");
const migration = readFileSync("db/migrations/0033_profile_contact.sql", "utf8");

test("T-1196: il contatto della coordinatrice è persistito e visibile soltanto nel gruppo", () => {
  assert.match(schema, /contact TEXT DEFAULT ''/);
  assert.match(migration, /ALTER TABLE profiles ADD COLUMN contact/);
  assert.match(api, /ensureProfileContactSchema/);
  assert.match(api, /contact: String\(form\.get\("contact"\)/);
  assert.match(api, /origin_city,contact,bio/);
  assert.match(ui, /Contatto coordinatrice \(telefono o email\)/);
  assert.match(ui, /sessionToken && x\.role === "coordinator" && x\.contact/);
  assert.match(ui, /mailto:/);
  assert.match(ui, /tel:/);
  const publicProjection = api.match(/:\s*\{\s*id: p\.id,[\s\S]*?gender: p\.gender \|\| "",\s*\}/)?.[0] || "";
  assert.ok(publicProjection, "Proiezione profilo pubblico non trovata");
  assert.doesNotMatch(publicProjection, /contact:/, "Il pubblico non deve ricevere il contatto");
});
