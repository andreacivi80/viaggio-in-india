import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("il nome del viaggiatore nel popup mappa viene inserito soltanto come testo", async () => {
  const ui = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
  const start = ui.indexOf("function PeopleLocationMap");
  const end = ui.indexOf("function App", start);
  const locationMap = ui.slice(start, end);
  assert.match(locationMap, /popupName\.textContent = location\.display_name/);
  assert.match(locationMap, /setDOMContent\(popupContent\)/);
  assert.doesNotMatch(locationMap, /setHTML\([\s\S]*location\.display_name/);
});
