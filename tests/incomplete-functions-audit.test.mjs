import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("A0197: ogni funzione incompleta rilevata deve essere classificata", () => {
  const result = spawnSync(process.execPath, ["scripts/audit-interactive-elements.mjs"], {
    encoding: "utf8",
    shell: false,
  });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.deepEqual(report.issues, [], "Sono presenti elementi interattivi non classificati");
  assert.deepEqual(
    report.incompleteMarkers,
    [],
    "Una funzione dichiarata incompleta deve essere completata, rimossa o esplicitamente classificata",
  );
});
