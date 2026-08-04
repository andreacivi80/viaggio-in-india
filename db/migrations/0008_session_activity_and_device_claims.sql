ALTER TABLE auth_sessions ADD COLUMN last_used_at TEXT;

UPDATE auth_sessions
SET last_used_at=created_at
WHERE last_used_at IS NULL;

CREATE INDEX IF NOT EXISTS auth_sessions_activity_idx
  ON auth_sessions(last_used_at, expires_at);

CREATE TABLE IF NOT EXISTS profile_device_claims (
  profile_id TEXT PRIMARY KEY,
  claimed_at TEXT NOT NULL
);

INSERT OR IGNORE INTO profile_device_claims(profile_id, claimed_at)
SELECT profile_id, MIN(created_at)
FROM auth_sessions
GROUP BY profile_id;
