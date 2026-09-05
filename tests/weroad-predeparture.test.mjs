import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
const migration = await readFile(new URL("../db/migrations/0015_weroad_predeparture_post.sql", import.meta.url), "utf8");
const source = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
const api = await readFile(new URL("../functions/api/[[path]].js", import.meta.url), "utf8");

test("la pubblicazione WEROAD storica resta idempotente negli schemi", () => {
  for (const sql of [schema, migration]) {
    assert.match(sql, /'weroad-predeparture', 'India insieme', '', -1, 'public'/);
    assert.match(sql, /Il gruppo si sta formando/);
    assert.match(sql, /INSERT OR IGNORE INTO post_media/);
  }
});

test("l’API converte soltanto la pubblicazione statica in Thailandia senza toccare i dati degli utenti", () => {
  assert.match(api, /async function ensureStaticPosts/);
  assert.match(api, /WHERE post_id='india-welcome' AND id IN \('india-welcome-photo','india-welcome-audio'\)/);
  assert.match(api, /WHERE id='india-welcome' AND profile_id=''/);
  assert.match(api, /INSERT OR IGNORE INTO posts/);
  assert.match(api, /INSERT OR IGNORE INTO post_media/);
  assert.match(api, /ON CONFLICT\(id\) DO UPDATE SET author_name=excluded\.author_name,text=excluded\.text/);
  assert.match(api, /static:\/thailand\/thailandia-insieme\.png/);
  assert.match(api, /Thailandia insieme/);
  assert.match(api, /GET" && path === "state"[\s\S]*await ensureStaticPosts\(env\)/);
});

test("il marchio WEROAD è integrato nel riquadro viaggiatori e il diario cita il gruppo", async () => {
  assert.match(source, /heroTravelersMain[\s\S]*heroWeRoadWordmark[\s\S]*<i>WE<\/i><em>ROAD<\/em>/);
  assert.doesNotMatch(source, /heroWeRoadLogo/);
  assert.doesNotMatch(source, /birthdayWeRoadLogo/);
  assert.match(await readFile(new URL("../src/tripThailand.js", import.meta.url), "utf8"), /incontro con il gruppo/);
});
