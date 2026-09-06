import test from "node:test";
import assert from "node:assert/strict";
import {
  overviewSegments,
  overviewStageOffsets,
  places,
  roadPaths,
  routeSequence,
} from "../src/tripThailand.js";

const samePoint = (left, right) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

test("le tappe 6 e 7 restano collegate agli estremi reali della rotta Phi Phi–Krabi", () => {
  const phiPhiIndex = routeSequence.indexOf("Phi Phi Island");
  const krabiIndex = routeSequence.indexOf("Krabi");
  assert.equal(phiPhiIndex + 1, 6);
  assert.equal(krabiIndex + 1, 7);
  const phiPhiOffset = overviewStageOffsets[phiPhiIndex];
  const krabiOffset = overviewStageOffsets[krabiIndex];
  assert.ok(phiPhiOffset[0] < 0 && phiPhiOffset[1] > 0, "il punto 6 va separato verso sud-ovest");
  assert.ok(krabiOffset[0] > 0 && krabiOffset[1] < 0, "il punto 7 va separato verso nord-est");
  assert.ok(Math.hypot(...phiPhiOffset) >= 10, "il numero 6 deve essere leggibile e separato dal 7");
  assert.ok(Math.hypot(...krabiOffset) >= 10, "il numero 7 deve essere leggibile e separato dal 6");
  assert.ok(Math.hypot(...phiPhiOffset) <= 20, "il punto 6 deve restare visivamente vicino alla rotta");
  assert.ok(Math.hypot(...krabiOffset) <= 20, "il punto 7 deve restare visivamente vicino alla rotta");

  const segment = overviewSegments.find(({ path }) => path === "phiphi-krabi");
  assert.ok(segment, "la rotta generale deve contenere il tratto 6→7");
  const path = roadPaths[segment.path];
  assert.ok(samePoint(path[0], places["Phi Phi Island"]), "il tratto deve partire dal punto 6");
  assert.ok(samePoint(path.at(-1), places.Krabi), "il tratto deve arrivare al punto 7");
});
