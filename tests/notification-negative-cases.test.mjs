import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const worker = readFileSync("functions/api/[[path]].js", "utf8");
const client = readFileSync("src/main.jsx", "utf8");

const routeSlice = (start, end) => {
  const from = worker.indexOf(start);
  const to = worker.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `Rotta non isolata: ${start}`);
  return worker.slice(from, to);
};

test("A0036/T-0749/U0586: una richiesta negata non raggiunge mai l'invio push", () => {
  const cases = [
    ["if (request.method === \"POST\" && path === \"posts\")", "if (request.method === \"DELETE\" && path.startsWith(\"posts/\"))", /if \(!session\)[\s\S]*?return json\([^]*?403\)/],
    ["if (request.method === \"POST\" && path === \"comments\")", "if (request.method === \"PUT\" && path.startsWith(\"comments/\"))", /if \(!session && !guest\)[\s\S]*?return json\([^]*?401\)/],
    ["if (path === \"locations\" && request.method === \"POST\")", "if (path.startsWith(\"locations/\")", /if \(!session\)[\s\S]*?return json\([^]*?401\)/],
    ["if (path === \"documents\" && request.method === \"POST\")", "if (path.startsWith(\"documents/\")", /if \(!session \|\| \(!coordinatorVerificationOnly/],
  ];
  for (const [start, end, denial] of cases) {
    const source = routeSlice(start, end);
    const denialIndex = source.search(denial);
    const notifyIndex = source.indexOf("notifySubscribers");
    assert.ok(denialIndex >= 0, `${start}: controllo autorizzativo assente`);
    assert.ok(notifyIndex < 0 || denialIndex < notifyIndex, `${start}: push raggiungibile prima del diniego`);
  }
});

test("A0303: zero notifiche produce uno stato vuoto stabile e cancellabile", () => {
  assert.match(client, /!activityItems\.length && <small>Nessuna nuova attività\.<\/small>/);
  assert.match(client, /activityItems\.length > 0 && <button onClick=\{clearActivity\}>Cancella tutte<\/button>/);
  assert.match(client, /activityItems\.slice\(0, 12\)\.map/);
});
