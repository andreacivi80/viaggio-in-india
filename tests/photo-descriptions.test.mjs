import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [worker, client, schema, migration] = await Promise.all([
  readFile(new URL("../functions/api/[[path]].js", import.meta.url), "utf8"),
  readFile(new URL("../src/main.jsx", import.meta.url), "utf8"),
  readFile(new URL("../db/schema.sql", import.meta.url), "utf8"),
  readFile(new URL("../db/migrations/0034_photo_descriptions.sql", import.meta.url), "utf8"),
]);

test("le descrizioni delle foto sono additive e limitate dal server", () => {
  assert.match(schema, /description TEXT NOT NULL DEFAULT ''/);
  assert.match(migration, /ALTER TABLE post_media ADD COLUMN description/);
  assert.match(worker, /mediaDescriptions\.slice\(0, 10\).*slice\(0, 280\)/);
  assert.match(worker, /media\.type\?\.startsWith\("image\/"\)/);
});

test("la descrizione è facoltativa, visibile e usata come testo alternativo", () => {
  assert.match(client, /Descrivi questa foto \(facoltativo\)/);
  assert.match(client, /alt=\{item\.description \|\| "Ricordo del viaggio"\}/);
  assert.match(client, /className="photoDescription"/);
  assert.match(client, /media_descriptions/);
});
