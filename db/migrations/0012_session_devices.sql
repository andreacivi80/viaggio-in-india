ALTER TABLE auth_sessions ADD COLUMN device_id TEXT;
ALTER TABLE auth_sessions ADD COLUMN device_name TEXT DEFAULT 'Dispositivo';
UPDATE auth_sessions
SET device_id=lower(hex(randomblob(16)))
WHERE device_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS auth_sessions_device_idx
  ON auth_sessions(device_id);
