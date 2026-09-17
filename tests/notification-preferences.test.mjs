import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  authorizedNotificationSubscriptions,
  notificationPreferenceAllows,
  sanitizePushPayload,
} from "../functions/api/[[path]].js";

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

test("la posizione volontaria avvisa solo altri membri che l'hanno autorizzata", () => {
  const subscriptions = [
    { id: "author", profile_id: "profile-a", guest_visitor_id: "", pref_location: 1, profile_role: "traveler" },
    { id: "allowed", profile_id: "profile-b", guest_visitor_id: "", pref_location: 1, profile_role: "traveler" },
    { id: "disabled", profile_id: "profile-c", guest_visitor_id: "", pref_location: 0, profile_role: "traveler" },
    { id: "family", profile_id: "", guest_visitor_id: "guest-a", pref_location: 1, profile_role: "" },
  ];
  const result = authorizedNotificationSubscriptions(subscriptions, {
    tag: "location-profile-a-1",
    visibility: "group",
    author_profile_id: "profile-a",
  });
  assert.deepEqual(result.map(({ id }) => id), ["allowed"]);
});

test("documenti mancanti o aggiornati raggiungono solo il destinatario o la coordinatrice abilitati", () => {
  const subscriptions = [
    { id: "owner", profile_id: "profile-a", guest_visitor_id: "", pref_documents: 1, profile_role: "traveler" },
    { id: "other", profile_id: "profile-b", guest_visitor_id: "", pref_documents: 1, profile_role: "traveler" },
    { id: "coordinator", profile_id: "profile-c", guest_visitor_id: "", pref_documents: 1, profile_role: "coordinator" },
    { id: "coordinator-off", profile_id: "profile-d", guest_visitor_id: "", pref_documents: 0, profile_role: "coordinator" },
  ];
  const updatedByCoordinator = { tag: "document-profile-a-passport", visibility: "group", author_profile_id: "profile-c" };
  assert.deepEqual(
    authorizedNotificationSubscriptions(subscriptions, updatedByCoordinator, { targetProfileId: "profile-a" }).map(({ id }) => id),
    ["owner"],
  );
  const uploadedByOwner = { tag: "document-profile-a-passport", visibility: "group", author_profile_id: "profile-a" };
  assert.deepEqual(
    authorizedNotificationSubscriptions(subscriptions, uploadedByOwner, { recipientRole: "coordinator" }).map(({ id }) => id),
    ["coordinator"],
  );
});

test("l'invito personale raggiunge soltanto il profilo destinatario", () => {
  const subscriptions = [
    { id: "author", profile_id: "profile-coordinator", guest_visitor_id: "", profile_role: "coordinator" },
    { id: "target-device-1", profile_id: "profile-target", guest_visitor_id: "", profile_role: "traveler" },
    { id: "target-device-2", profile_id: "profile-target", guest_visitor_id: "", profile_role: "traveler" },
    { id: "other", profile_id: "profile-other", guest_visitor_id: "", profile_role: "traveler" },
    { id: "guest", profile_id: "", guest_visitor_id: "guest-a", profile_role: "" },
  ];
  const payload = {
    tag: "invite-profile-target-123",
    visibility: "group",
    author_profile_id: "profile-coordinator",
  };
  assert.deepEqual(
    authorizedNotificationSubscriptions(subscriptions, payload, { targetProfileId: "profile-target" })
      .map(({ id }) => id),
    ["target-device-1", "target-device-2"],
  );
});

test("la notifica invito non espone token, link segreti o testo controllato dal client", () => {
  const safe = sanitizePushPayload({
    tag: "invite-profile-target-123",
    title: "token segreto",
    body: "CodiceGruppoDemo2026 invite_token=super-secret",
    url: "/?invite=super-secret",
  });
  assert.equal(safe.title, "Thailandia Insieme");
  assert.equal(safe.body, "Hai ricevuto un nuovo invito personale.");
  assert.equal(safe.url, "/");
  assert.doesNotMatch(JSON.stringify(safe), /super-secret|CodiceGruppoDemo2026/);
});
