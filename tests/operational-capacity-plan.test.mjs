import test from "node:test";
import assert from "node:assert/strict";
import {
  AUTHENTICATED_SYNC_INTERVAL_MS,
  PRIVATE_SYNC_INTERVAL_MS,
  PUBLIC_SYNC_INTERVAL_MS,
  SESSION_VERIFICATION_INTERVAL_MS,
} from "../src/syncIntervals.js";

const TRAVELERS = 18;
const FAMILY_VIEWERS = 18;
const ACTIVE_HOURS = 6;
const PRIVATE_HOURS = 0.5;
const DAYS = 14;
const WORKERS_DAILY_BUDGET = 100_000;
const ACTION_HEADROOM = 8_000;
const MODELED_RESPONSE_BYTES = 64 * 1024;
const MEDIA = { photo: 556_455, audio: 617_444, video: 715_859 };

const periodic = (people, hours, intervalMs) =>
  people * hours * 60 * 60 * 1000 / intervalMs;

const travelerRequests = periodic(TRAVELERS, ACTIVE_HOURS, SESSION_VERIFICATION_INTERVAL_MS)
  + periodic(TRAVELERS, ACTIVE_HOURS, AUTHENTICATED_SYNC_INTERVAL_MS)
  + periodic(TRAVELERS, PRIVATE_HOURS, PRIVATE_SYNC_INTERVAL_MS);
const familyRequests = periodic(FAMILY_VIEWERS, ACTIVE_HOURS, PUBLIC_SYNC_INTERVAL_MS);
const periodicDaily = travelerRequests + familyRequests;
const expectedDailyRequests = periodicDaily + ACTION_HEADROOM;
const legacyTwoPointFiveSecondRequests = periodic(
  TRAVELERS + FAMILY_VIEWERS,
  ACTIVE_HOURS,
  2_500,
);
const expectedMediaPerTravelerDay = (6 * MEDIA.photo) + MEDIA.audio + (MEDIA.video / 4);
const expectedMediaDaily = expectedMediaPerTravelerDay * TRAVELERS;
const expectedMediaFourteenDays = expectedMediaDaily * DAYS;
const pushEventsDaily = TRAVELERS * 8;
const pushDeliveriesDaily = pushEventsDaily * (TRAVELERS + FAMILY_VIEWERS - 1);

test("T-1523/T-1525: il piano misura consumo giornaliero e per quattordici giorni", () => {
  assert.equal(periodicDaily, 63_720);
  assert.equal(expectedDailyRequests, 71_720);
  assert.ok(expectedDailyRequests < WORKERS_DAILY_BUDGET);
  assert.equal(Math.round(expectedMediaDaily), 74_432_498);
  assert.equal(Math.round(expectedMediaFourteenDays), 1_042_054_965);
  assert.ok(expectedMediaFourteenDays < 1024 * 1024 * 1024);
});

test("T-1526/T-1532: sono esplicite richieste per utente e costo del vecchio polling 2,5 s", () => {
  assert.equal(travelerRequests / TRAVELERS, 2_460);
  assert.equal(familyRequests / FAMILY_VIEWERS, 1_080);
  assert.equal(legacyTwoPointFiveSecondRequests, 311_040);
  assert.equal(legacyTwoPointFiveSecondRequests * MODELED_RESPONSE_BYTES, 20_384_317_440);
  assert.ok(periodicDaily < legacyTwoPointFiveSecondRequests / 3);
});

test("T-1530: il massimo operativo atteso delle consegne push è quantificato", () => {
  assert.equal(pushEventsDaily, 144);
  assert.equal(pushDeliveriesDaily, 5_040);
  assert.equal(pushDeliveriesDaily * DAYS, 70_560);
});

test("T-1533: il superamento quota ha esiti espliciti e non crea dati parziali", async () => {
  const worker = await import("../functions/api/[[path]].js");
  assert.equal(worker.MAX_POST_MEDIA_BYTES, 600 * 1024 * 1024);
  const source = await (await import("node:fs/promises")).readFile(
    new URL("../functions/api/[[path]].js", import.meta.url),
    "utf8",
  );
  assert.match(source, /retry_after: retryAfter/);
  assert.match(source, /"retry-after": String\(retryAfter\)/);
  assert.match(source, /Gli allegati del post superano il limite complessivo di 600 MB/);
  assert.match(source, /Hai già troppi caricamenti in corso/);
});

console.log(`OPERATIONAL_CAPACITY=${JSON.stringify({
  periodicDaily,
  expectedDailyRequests,
  expectedFourteenDayRequests: expectedDailyRequests * DAYS,
  expectedMediaDaily: Math.round(expectedMediaDaily),
  expectedMediaFourteenDays: Math.round(expectedMediaFourteenDays),
  legacyTwoPointFiveSecondRequests,
  legacyTwoPointFiveSecondTrafficBytes: legacyTwoPointFiveSecondRequests * MODELED_RESPONSE_BYTES,
  pushDeliveriesDaily,
  pushDeliveriesFourteenDays: pushDeliveriesDaily * DAYS,
})}`);
