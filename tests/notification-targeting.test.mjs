import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  authorizedNotificationSubscriptions,
  mentionedProfileIds,
  notificationPreferenceAllows,
  profileMentionHandle,
  sanitizePushPayload,
} from "../functions/api/[[path]].js";

const worker = readFileSync(new URL("../functions/api/[[path]].js", import.meta.url), "utf8");

test("le menzioni individuano il profilo esatto senza collisioni parziali", () => {
  const profiles = [
    { id: "p1", name: "Andréa", surname: "Test" },
    { id: "p2", name: "Andrea", surname: "Testa" },
    { id: "p3", name: "Sara", surname: "Rossi" },
  ];
  assert.equal(profileMentionHandle(profiles[0]), "Andrea_Test");
  assert.deepEqual(mentionedProfileIds("Ciao @Andrea_Test, benvenuto", profiles), ["p1"]);
  assert.deepEqual(mentionedProfileIds("@Sara_Rossi e @Andrea_Testa", profiles), ["p2", "p3"]);
  assert.deepEqual(mentionedProfileIds("test@example.com @Andrea_Test_extra", profiles), []);
});
test("menzione e risposta raggiungono solo il destinatario, senza autore o duplicati", () => {
  const subscriptions = [
    { id: "author", profile_id: "p-author", guest_visitor_id: "", pref_comments: 1 },
    { id: "target-a", profile_id: "p-target", guest_visitor_id: "", pref_comments: 1 },
    { id: "target-b", profile_id: "p-target", guest_visitor_id: "", pref_comments: 1 },
    { id: "disabled", profile_id: "p-disabled", guest_visitor_id: "", pref_comments: 0 },
    { id: "other", profile_id: "p-other", guest_visitor_id: "", pref_comments: 1 },
    { id: "reply-guest", profile_id: "", guest_visitor_id: "g-target", pref_comments: 1 },
  ];
  const payload = { visibility: "group", author_profile_id: "p-author", tag: "mention-comment-c1" };
  assert.deepEqual(
    authorizedNotificationSubscriptions(subscriptions, payload, { targetProfileId: "p-target" }).map(({ id }) => id),
    ["target-a", "target-b"],
  );
  assert.deepEqual(
    authorizedNotificationSubscriptions(subscriptions, payload, { excludeProfileIds: ["p-target", "p-disabled"] })
      .map(({ id }) => id),
    ["other"],
  );
  assert.deepEqual(
    authorizedNotificationSubscriptions(
      subscriptions,
      { visibility: "family", author_profile_id: "p-author", tag: "reply-comment-c1" },
      { targetGuestId: "g-target" },
    ).map(({ id }) => id),
    ["reply-guest"],
  );
});

test("menzioni e risposte rispettano la preferenza commenti e il deep link privato", () => {
  assert.equal(notificationPreferenceAllows({ profile_id: "p1", pref_comments: 0 }, { tag: "mention-comment-c1" }), false);
  assert.equal(notificationPreferenceAllows({ profile_id: "p1", pref_comments: 1 }, { tag: "reply-comment-c1" }), true);
  const safe = sanitizePushPayload({
    tag: "mention-comment-c1",
    title: "Nome privato",
    body: "Testo privato",
    url: "/?post=p1&comment=c1",
  });
  assert.equal(safe.title, "Thailandia Insieme");
  assert.equal(safe.body, "È stato aggiunto un nuovo commento.");
  assert.equal(safe.url, "/?post=p1&comment=c1");
  assert.doesNotMatch(JSON.stringify(safe), /Nome privato|Testo privato/);
});

test("proprietà e visibilità sono verificate prima di ogni notifica sociale", () => {
  const commentStart = worker.indexOf('path === "comments"');
  const commentNotify = worker.indexOf("const profileRows = commentText.includes", commentStart);
  assert.ok(commentStart >= 0 && commentNotify > commentStart);
  assert.ok(worker.indexOf("canViewPost(targetPost, session, guest)", commentStart) < commentNotify);
  assert.ok(worker.indexOf("SELECT id,parent_comment_id,profile_id,visitor_id", commentStart) < commentNotify);

  const reactionStart = worker.indexOf('path === "comment-reactions"');
  const reactionNotify = worker.indexOf("notifySubscribers(env", reactionStart);
  assert.ok(reactionStart >= 0 && reactionNotify > reactionStart);
  assert.ok(worker.indexOf("canViewPost(target, session, guest)", reactionStart) < reactionNotify);
  assert.match(worker.slice(reactionStart, reactionNotify + 500), /targetProfileId: target\.comment_profile_id/);
});
