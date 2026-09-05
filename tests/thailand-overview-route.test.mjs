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

test("le tappe 6 e 7 sono centrate sugli estremi reali della rotta Phi Phi–Krabi", () => {
  const phiPhiIndex = routeSequence.indexOf("Phi Phi Island");
  const krabiIndex = routeSequence.indexOf("Krabi");
  assert.equal(phiPhiIndex + 1, 6);
  assert.equal(krabiIndex + 1, 7);
  const phiPhiOffset = overviewStageOffsets[phiPhiIndex];
  const krabiOffset = overviewStageOffsets[krabiIndex];
  assert.ok(phiPhiOffset[0] < 0 && phiPhiOffset[1] > 0, "il punto 6 va separato verso sud-ovest");
  assert.ok(krabiOffset[0] > 0 && krabiOffset[1] < 0, "il punto 7 va separato verso nord-est");
  assert.ok(Math.hypot(...phiPhiOffset) < 9, "la rotta deve entrare nel cerchio del punto 6");
  assert.ok(Math.hypot(...krabiOffset) < 9, "la rotta deve entrare nel cerchio del punto 7");

  const segment = overviewSegments.find(({ path }) => path === "phiphi-krabi");
  assert.ok(segment, "la rotta generale deve contenere il tratto 6→7");
  const path = roadPaths[segment.path];
  assert.ok(samePoint(path[0], places["Phi Phi Island"]), "il tratto deve partire dal punto 6");
  assert.ok(samePoint(path.at(-1), places.Krabi), "il tratto deve arrivare al punto 7");
});
