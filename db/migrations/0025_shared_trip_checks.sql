CREATE TABLE IF NOT EXISTS trip_checks (
  check_key TEXT PRIMARY KEY,
  checked INTEGER NOT NULL DEFAULT 0 CHECK (checked IN (0, 1)),
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TRIGGER IF NOT EXISTS sync_trip_checks_insert AFTER INSERT ON trip_checks BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_trip_checks_update AFTER UPDATE ON trip_checks BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_trip_checks_delete AFTER DELETE ON trip_checks BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
