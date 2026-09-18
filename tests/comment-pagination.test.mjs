import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  decodeCommentCursor,
  encodeCommentCursor,
  normalizeCommentPageLimit,
} from "../functions/api/[[path]].js";

test("comment page limits are bounded for mobile payloads", () => {
  assert.equal(normalizeCommentPageLimit(), 50);
  assert.equal(normalizeCommentPageLimit("0"), 50);
  assert.equal(normalizeCommentPageLimit("25"), 25);
  assert.equal(normalizeCommentPageLimit("10000"), 100);
});

test("comment cursor is opaque, URL safe and reversible", () => {
  const source = { created_at: "2026-08-10T12:34:56.000Z", id: "commento/à+1" };
  const cursor = encodeCommentCursor(source);
  assert.match(cursor, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(decodeCommentCursor(cursor), source);
  assert.equal(decodeCommentCursor("non-un-cursore"), null);
});

test("state is bounded and the comments endpoint supports pagination and search", () => {
  const worker = fs.readFileSync(new URL("../functions/api/[[path]].js", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
  assert.match(worker, /ROW_NUMBER\(\) OVER \(PARTITION BY post_id/);
  assert.match(worker, /comment_count:/);
  assert.match(worker, /request\.method === "GET" && path === "comments"/);
  assert.match(worker, /INSTR\(LOWER\(text\), \?\)>0/);
  assert.match(worker, /next_cursor:/);
  assert.match(app, /placeholder="Cerca nei commenti"/);
  assert.match(app, /Carica commenti precedenti/);
});
