import assert from "node:assert/strict";
import test from "node:test";

import { filterPostsOffline, searchablePostText } from "../src/offlineSearch.js";

const posts = [
  { id: "1", text: "Arrivo a Bangkok", author_name: "Andréa", place_name: "Thailandia", media: [], comments: [] },
  { id: "2", text: "Escursione sul lago", author_name: "Sara", media: [{ media_name: "Khao Sok.jpg" }], comments: [] },
  { id: "3", text: "Tramonto", author_name: "Paolo", media: [], comments: [{ text: "Bellissimo mare", author_name: "Luca" }] },
];

test("la ricerca locale trova testo, autore, luogo, media e commenti", () => {
  assert.deepEqual(filterPostsOffline(posts, "bangkok").map((post) => post.id), ["1"]);
  assert.deepEqual(filterPostsOffline(posts, "andrea thailandia").map((post) => post.id), ["1"]);
  assert.deepEqual(filterPostsOffline(posts, "khao sok").map((post) => post.id), ["2"]);
  assert.deepEqual(filterPostsOffline(posts, "bellissimo luca").map((post) => post.id), ["3"]);
});

test("ricerca senza accenti e query vuota restano stabili", () => {
  assert.match(searchablePostText(posts[0]), /andrea/);
  assert.equal(filterPostsOffline(posts, "").length, 3);
  assert.equal(filterPostsOffline(posts, "inesistente").length, 0);
});
