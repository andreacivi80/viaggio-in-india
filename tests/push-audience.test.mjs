import test from "node:test";
import assert from "node:assert/strict";
import { canNotifySubscriber } from "../functions/api/[[path]].js";

const anonymous = { profile_id: "", guest_visitor_id: "" };
const guest = { profile_id: "", guest_visitor_id: "guest-b" };
const owner = { profile_id: "profile-a", guest_visitor_id: "" };
const traveler = { profile_id: "profile-b", guest_visitor_id: "" };

test("le notifiche pubbliche raggiungono il pubblico ma non tornano all’autore", () => {
  assert.equal(canNotifySubscriber(anonymous, { visibility: "public", author_profile_id: "profile-a" }), true);
  assert.equal(canNotifySubscriber(owner, { visibility: "public", author_profile_id: "profile-a" }), false);
});

test("le notifiche familiari richiedono un’identità ospite o personale", () => {
  assert.equal(canNotifySubscriber(anonymous, { visibility: "family", author_profile_id: "profile-a" }), false);
  assert.equal(canNotifySubscriber(guest, { visibility: "family", author_profile_id: "profile-a" }), true);
  assert.equal(canNotifySubscriber(traveler, { visibility: "family", author_profile_id: "profile-a" }), true);
});

test("le notifiche del gruppo non raggiungono pubblico e familiari", () => {
  assert.equal(canNotifySubscriber(anonymous, { visibility: "group", author_profile_id: "profile-a" }), false);
  assert.equal(canNotifySubscriber(guest, { visibility: "group", author_profile_id: "profile-a" }), false);
  assert.equal(canNotifySubscriber(traveler, { visibility: "group", author_profile_id: "profile-a" }), true);
});

test("un contenuto privato può notificare soltanto il proprietario", () => {
  const privatePayload = { visibility: "private", author_profile_id: "profile-a" };
  assert.equal(canNotifySubscriber(anonymous, privatePayload), false);
  assert.equal(canNotifySubscriber(guest, privatePayload), false);
  assert.equal(canNotifySubscriber(traveler, privatePayload), false);
  // L’autore viene escluso intenzionalmente: un contenuto Solo io non deve generare push.
  assert.equal(canNotifySubscriber(owner, privatePayload), false);
});

test("un commento non viene notificato allo stesso familiare che lo ha scritto", () => {
  assert.equal(canNotifySubscriber(guest, {
    visibility: "family",
    author_guest_id: "guest-b",
  }), false);
});
