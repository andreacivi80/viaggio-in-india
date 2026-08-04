CREATE TABLE IF NOT EXISTS idempotency_operations (
  operation_hash TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'processing',
  response_status INTEGER,
  response_json TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idempotency_operations_expiry_idx
  ON idempotency_operations(expires_at);
