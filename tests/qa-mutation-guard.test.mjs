import test from "node:test";
import assert from "node:assert/strict";
import { isSafeMutationTarget, requireSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

test("il dominio ufficiale non può essere usato dai test con scritture", () => {
  assert.equal(isSafeMutationTarget("https://viaggio-in-india-2026.pages.dev"), false);
  assert.throws(
    () => requireSafeMutationTarget("https://viaggio-in-india-2026.pages.dev"),
    /bloccato/,
  );
});

test("locale e QA sono gli unici bersagli accettati", () => {
  assert.equal(isSafeMutationTarget("http://127.0.0.1:4173"), true);
  assert.equal(isSafeMutationTarget("http://localhost:4173"), true);
  assert.equal(isSafeMutationTarget("https://viaggio-in-india-2026-qa.pages.dev"), true);
  assert.equal(isSafeMutationTarget("https://abc.viaggio-in-india-2026-qa.pages.dev"), true);
  assert.equal(isSafeMutationTarget("https://viaggio-in-india-2026-qa.pages.dev.evil.example"), false);
});
