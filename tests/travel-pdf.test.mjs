import test from "node:test";
import assert from "node:assert/strict";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { days } from "../src/tripThailand.js";
import { createTravelPdf, diaryPdfLines, tripPdfLines } from "../src/travelPdf.js";

const parse = async (blob) => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  assert.equal(new TextDecoder().decode(bytes.slice(0, 8)), "%PDF-1.4");
  const document = await getDocument({ data: bytes, disableWorker: true }).promise;
  const text = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    text.push((await page.getTextContent()).items.map((item) => item.str).join(" "));
  }
  return text.join(" ");
};

test("il PDF del viaggio è valido e contiene tutte le giornate", async () => {
  const text = await parse(createTravelPdf("Programma del viaggio", tripPdfLines(days)));
  assert.match(text, /Programma del viaggio/);
  assert.match(text, /GIORNO 1/);
  assert.match(text, new RegExp(`GIORNO ${days.length}`));
  assert.match(text, /Bangkok/);
});

test("il PDF del diario include pubblicazioni e commenti visibili", async () => {
  const text = await parse(createTravelPdf("Diario del viaggio", diaryPdfLines([{
    author_name: "Andrea",
    created_at: "2026-12-26T12:00:00.000Z",
    text: "Prima giornata insieme",
    place: "Bangkok",
    comments: [{ author_name: "Sara", text: "Bellissimo" }],
  }])));
  assert.match(text, /Diario del viaggio/);
  assert.match(text, /Prima giornata insieme/);
  assert.match(text, /Sara: Bellissimo/);
});

test("testi non affidabili restano testo PDF e non istruzioni", async () => {
  const bytes = new Uint8Array(await createTravelPdf("Diario", ["(x) \\ /JavaScript <script>"]).arrayBuffer());
  const raw = new TextDecoder().decode(bytes);
  assert.doesNotMatch(raw, /\/JavaScript\s*<</);
  assert.match(raw, /\\\(x\\\)/);
});
