import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
const migration = await readFile(new URL("../db/migrations/0015_weroad_predeparture_post.sql", import.meta.url), "utf8");
const source = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");

test("la seconda pubblicazione WEROAD è pubblica, nei preparativi e senza luogo", () => {
  for (const sql of [schema, migration]) {
    assert.match(sql, /'weroad-predeparture', 'India insieme', '', -1, 'public'/);
    assert.match(sql, /Il gruppo si sta formando/);
    assert.match(sql, /static:\/ui\/weroad-logo\.png/);
    assert.match(sql, /WEROAD · Preparativi per l’India/);
  }
});

test("il logo ufficiale è solo nella testata della Bacheca e il diario cita il gruppo WEROAD", () => {
  assert.match(source, /tab === "diary"[\s\S]*heroWeRoadLogo[\s\S]*weroad-logo\.png/);
  assert.doesNotMatch(source, /birthdayWeRoadLogo/);
  assert.match(source, /incontro con il gruppo WEROAD/);
});
