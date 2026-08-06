import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
const migration = await readFile(new URL("../db/migrations/0015_weroad_predeparture_post.sql", import.meta.url), "utf8");
const source = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
const api = await readFile(new URL("../functions/api/[[path]].js", import.meta.url), "utf8");

test("la seconda pubblicazione WEROAD è pubblica, nei preparativi e senza luogo", () => {
  for (const sql of [schema, migration]) {
    assert.match(sql, /'weroad-predeparture', 'India insieme', '', -1, 'public'/);
    assert.match(sql, /Il gruppo si sta formando/);
    assert.match(sql, /static:\/ui\/weroad-logo\.png/);
    assert.match(sql, /WEROAD · Preparativi per l’India/);
  }
});

test("l’API inizializza la pubblicazione una sola volta senza toccare i dati esistenti", () => {
  assert.match(api, /async function ensureStaticPosts/);
  assert.match(api, /SELECT id FROM posts WHERE id='weroad-predeparture'/);
  assert.match(api, /INSERT OR IGNORE INTO posts/);
  assert.match(api, /INSERT OR IGNORE INTO post_media/);
  assert.match(api, /GET" && path === "state"[\s\S]*await ensureStaticPosts\(env\)/);
});

test("il marchio WEROAD è integrato nel riquadro viaggiatori e il diario cita il gruppo", () => {
  assert.match(source, /heroTravelersMain[\s\S]*heroWeRoadWordmark[\s\S]*<i>WE<\/i><em>ROAD<\/em>/);
  assert.doesNotMatch(source, /heroWeRoadLogo/);
  assert.doesNotMatch(source, /birthdayWeRoadLogo/);
  assert.match(source, /incontro con il gruppo WEROAD/);
});
