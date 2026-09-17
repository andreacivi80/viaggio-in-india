import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  SLOW_UPLOAD_NOTICE_DELAY_MS,
  slowUploadMessage,
  uploadProgressMessage,
} from "../src/uploadFeedback.js";

const client = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");

test("A0321: superato il tempo previsto compare un messaggio utile e non distruttivo", () => {
  assert.equal(SLOW_UPLOAD_NOTICE_DELAY_MS, 20_000);
  const message = slowUploadMessage("il documento");
  assert.match(message, /più del previsto/i);
  assert.match(message, /Non chiudere l’app/i);
  assert.match(message, /senza duplicati/i);
});

test("il progresso lento resta leggibile e limitato tra zero e cento", () => {
  assert.equal(uploadProgressMessage("Caricamento", -2), "Caricamento: 0%");
  assert.equal(uploadProgressMessage("Caricamento", 55, true), "Caricamento: 55% · rete lenta, il caricamento continua");
  assert.equal(uploadProgressMessage("Caricamento", 101), "Caricamento: 100%");
});

test("pubblicazioni e documenti cancellano sempre il timer senza interrompere l’upload", () => {
  const timerUses = client.match(/setTimeout\(\(\) => \{\s*slowUploadNoticeShown = true;/g) || [];
  const timerClears = client.match(/clearTimeout\(slowUploadTimer\)/g) || [];
  assert.equal(timerUses.length, 2);
  assert.equal(timerClears.length, 2);
  assert.match(client, /role="status"[\s\S]{0,100}\{fileStatus\}/);
  assert.match(client, /documentStatus && \([\s\S]{0,100}<small[^>]*role="status"/);
});
