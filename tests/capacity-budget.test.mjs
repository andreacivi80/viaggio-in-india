import test from "node:test";
import assert from "node:assert/strict";
import {
  AUTHENTICATED_SYNC_INTERVAL_MS,
  PRIVATE_SYNC_INTERVAL_MS,
  PUBLIC_SYNC_INTERVAL_MS,
  SESSION_VERIFICATION_INTERVAL_MS,
} from "../src/syncIntervals.js";

const WORKERS_FREE_REQUESTS_PER_DAY = 100_000;
const ACTIVE_HOURS_PER_DAY = 6;
const PRIVATE_VIEW_HOURS_PER_DAY = 0.5;
const TRAVELERS = 18;
const FAMILY_VIEWERS = 18;
const ACTION_HEADROOM = 8_000;

const periodicRequests = (people, intervalMs) =>
  people * ACTIVE_HOURS_PER_DAY * 60 * 60 * 1000 / intervalMs;
const privateViewRequests = (people, intervalMs) =>
  people * PRIVATE_VIEW_HOURS_PER_DAY * 60 * 60 * 1000 / intervalMs;

test("il polling di 18 viaggiatori e 18 familiari conserva margine sul limite gratuito", () => {
  const travelerRequests = periodicRequests(TRAVELERS, SESSION_VERIFICATION_INTERVAL_MS)
    + periodicRequests(TRAVELERS, AUTHENTICATED_SYNC_INTERVAL_MS)
    + privateViewRequests(TRAVELERS, PRIVATE_SYNC_INTERVAL_MS);
  const familyRequests = periodicRequests(FAMILY_VIEWERS, PUBLIC_SYNC_INTERVAL_MS);
  const total = travelerRequests + familyRequests;

  assert.equal(travelerRequests, 61_560);
  assert.equal(familyRequests, 25_920);
  assert.equal(total, 87_480);
  assert.ok(
    total + ACTION_HEADROOM < WORKERS_FREE_REQUESTS_PER_DAY,
    `Il solo polling usa ${total} richieste e non lascia margine operativo`,
  );
});

test("gli intervalli mantengono sincronizzazione frequente senza verifiche di sessione aggressive", () => {
  assert.ok(AUTHENTICATED_SYNC_INTERVAL_MS <= 7_500);
  assert.ok(PRIVATE_SYNC_INTERVAL_MS <= 10_000);
  assert.ok(PUBLIC_SYNC_INTERVAL_MS <= 15_000);
  assert.ok(SESSION_VERIFICATION_INTERVAL_MS >= 60_000);
});
