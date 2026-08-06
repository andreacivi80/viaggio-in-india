import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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

test("Playwright rifiuta il dominio ufficiale prima di eseguire qualsiasi test", () => {
  const result = spawnSync(
    process.execPath,
    ["node_modules/@playwright/test/cli.js", "test", "--config", "playwright.release.config.mjs", "--list"],
    {
      cwd: new URL("..", import.meta.url),
      env: { ...process.env, TEST_BASE_URL: "https://viaggio-in-india-2026.pages.dev" },
      encoding: "utf8",
      windowsHide: true,
    },
  );
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /Test con scritture bloccato/);
});
