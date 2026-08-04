CREATE TABLE IF NOT EXISTS upload_sessions (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  upload_id TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  scope TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  content_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploading',
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  completed_at TEXT,
  consumed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_owner
  ON upload_sessions(profile_id, status, expires_at);

CREATE TABLE IF NOT EXISTS upload_parts (
  upload_session_id TEXT NOT NULL,
  part_number INTEGER NOT NULL,
  part_size INTEGER NOT NULL,
  etag TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(upload_session_id, part_number)
);
CREATE INDEX IF NOT EXISTS idx_upload_parts_session
  ON upload_parts(upload_session_id, part_number);
