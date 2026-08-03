CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS auth_sessions_profile_idx
  ON auth_sessions(profile_id, expires_at);

CREATE TABLE IF NOT EXISTS profile_invites (
  token_hash TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);
CREATE INDEX IF NOT EXISTS profile_invites_profile_idx
  ON profile_invites(profile_id, expires_at);
