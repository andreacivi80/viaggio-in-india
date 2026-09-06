CREATE TABLE IF NOT EXISTS activity_state (
  profile_id TEXT PRIMARY KEY,
  last_read_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TRIGGER IF NOT EXISTS sync_activity_state_insert
AFTER INSERT ON activity_state BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS sync_activity_state_update
AFTER UPDATE ON activity_state BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
