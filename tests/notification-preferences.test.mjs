import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { notificationPreferenceAllows } from "../functions/api/[[path]].js";

const worker = readFileSync(new URL("../functions/api/[[path]].js", import.meta.url), "utf8");
const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");

test("le cinque preferenze sono persistite per profilo e protette da sessione", () => {
  for (const key of ["posts", "comments", "reactions", "documents", "location"])
    assert.match(schema, new RegExp(`\\b${key} INTEGER NOT NULL DEFAULT 1`));
  assert.match(worker, /path === "notification-preferences"/);
  assert.match(worker, /sessionFromRequest\(request, env\)/);
  assert.match(worker, /WHERE profile_id=\?/);
});

test("il filtro push rispetta ogni categoria e mantiene gli avvisi tecnici", () => {
  const subscription = {
    profile_id: "profile-1",
    pref_posts: 0,
    pref_comments: 1,
    pref_reactions: 0,
    pref_documents: 1,
    pref_location: 0,
  };
  assert.equal(notificationPreferenceAllows(subscription, { tag: "post-1" }), false);
  assert.equal(notificationPreferenceAllows(subscription, { tag: "comment-1" }), true);
  assert.equal(notificationPreferenceAllows(subscription, { tag: "reaction-post-1" }), false);
  assert.equal(notificationPreferenceAllows(subscription, { tag: "document-passport" }), true);
  assert.equal(notificationPreferenceAllows(subscription, { tag: "location-profile-1" }), false);
  assert.equal(notificationPreferenceAllows(subscription, { tag: "technical-error" }), true);
});

test("assenza di una riga conserva valori predefiniti sicuri", () => {
  const subscription = { profile_id: "profile-1" };
  for (const tag of ["post-1", "comment-1", "reaction-1", "document-1", "location-1"])
    assert.equal(notificationPreferenceAllows(subscription, { tag }), true);
});
