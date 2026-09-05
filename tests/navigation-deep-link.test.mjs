import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");

test("i parametri della mappa restano nell’URL e sopravvivono al reload", () => {
  assert.match(source, /const startsOnMap = initialParams\.get\("view"\) === "map"/);
  assert.match(source, /const initialMapDay = startsOnMap && initialParams\.has\("day"\)/);
  assert.doesNotMatch(source, /const initialUrl = new URL\(location\.href\)[\s\S]*?initialUrl\.searchParams\.delete\("view"\)/);
});
