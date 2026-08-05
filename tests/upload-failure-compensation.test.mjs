import test from "node:test";
import assert from "node:assert/strict";
import { persistUploadPart } from "../functions/api/[[path]].js";

const bytes = new Uint8Array([1, 2, 3, 4]);
const upload = { id: "upload-fault-test" };

function environment({ failMediaOnce = false, failDatabaseOnce = false } = {}) {
  const stored = new Map();
  const rows = new Map();
  let mediaFailures = failMediaOnce ? 1 : 0;
  let databaseFailures = failDatabaseOnce ? 1 : 0;
  return {
    stored,
    rows,
    env: {
      MEDIA: {
        async put(key, value) {
          if (mediaFailures-- > 0) throw new Error("MEDIA non disponibile");
          stored.set(key, new Uint8Array(value));
        },
        async delete(key) { stored.delete(key); },
      },
      DB: {
        prepare() {
          return {
            bind(uploadId, partNumber, size, etag, updatedAt) {
              return {
                async run() {
                  if (databaseFailures-- > 0) throw new Error("D1 non disponibile");
                  rows.set(`${uploadId}/${partNumber}`, { size, etag, updatedAt });
                },
              };
            },
          };
        },
      },
    },
  };
}

test("interruzione D1 dopo la scrittura MEDIA elimina la parte orfana e consente il retry", async () => {
  const fixture = environment({ failDatabaseOnce: true });
  await assert.rejects(persistUploadPart(fixture.env, upload, 1, bytes, "etag-1", "2026-08-05T00:00:00Z"), /D1/);
  assert.equal(fixture.stored.size, 0);
  assert.equal(fixture.rows.size, 0);
  await persistUploadPart(fixture.env, upload, 1, bytes, "etag-1", "2026-08-05T00:00:01Z");
  assert.equal(fixture.stored.size, 1);
  assert.equal(fixture.rows.size, 1);
});

test("interruzione MEDIA dopo l'init D1 non registra la parte e il retry completa", async () => {
  const fixture = environment({ failMediaOnce: true });
  await assert.rejects(persistUploadPart(fixture.env, upload, 1, bytes, "etag-2", "2026-08-05T00:00:00Z"), /MEDIA/);
  assert.equal(fixture.stored.size, 0);
  assert.equal(fixture.rows.size, 0);
  await persistUploadPart(fixture.env, upload, 1, bytes, "etag-2", "2026-08-05T00:00:01Z");
  assert.equal(fixture.stored.size, 1);
  assert.equal(fixture.rows.size, 1);
});
