import assert from "node:assert/strict";
import test from "node:test";
import { buildMapShareUrl } from "../src/mapLink.js";

test("il collegamento della mappa elimina parametri estranei e conserva la giornata", () => {
  assert.equal(
    buildMapShareUrl("https://example.test/?qa=123&post=old", 3),
    "https://example.test/?view=map&day=04",
  );
});

test("il collegamento della mappa completa non contiene una giornata", () => {
  assert.equal(
    buildMapShareUrl("https://example.test/percorso?day=08", null),
    "https://example.test/percorso?view=map",
  );
});
