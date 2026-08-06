CREATE TABLE IF NOT EXISTS security_audit_log (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  actor_profile_id TEXT,
  actor_role TEXT NOT NULL DEFAULT '',
  device_id TEXT NOT NULL DEFAULT '',
  resource_type TEXT NOT NULL DEFAULT '',
  resource_id TEXT NOT NULL DEFAULT '',
  result TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS security_audit_created_idx
  ON security_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS security_audit_actor_idx
  ON security_audit_log(actor_profile_id, created_at DESC);
