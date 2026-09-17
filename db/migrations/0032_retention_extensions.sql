CREATE TABLE IF NOT EXISTS retention_extensions (
  profile_id TEXT PRIMARY KEY,
  retain_until TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  requested_at TEXT NOT NULL,
  decided_at TEXT,
  approved_by TEXT,
  FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY(approved_by) REFERENCES profiles(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS retention_extensions_status_idx
  ON retention_extensions(status, retain_until);
CREATE TRIGGER IF NOT EXISTS sync_retention_extensions_insert
AFTER INSERT ON retention_extensions BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_retention_extensions_update
AFTER UPDATE ON retention_extensions BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_retention_extensions_delete
AFTER DELETE ON retention_extensions BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
