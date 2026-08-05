CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  surname TEXT DEFAULT '',
  age TEXT DEFAULT '',
  job TEXT DEFAULT '',
  origin_city TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  role TEXT DEFAULT 'traveler',
  gender TEXT DEFAULT '',
  avatar_key TEXT,
  privacy_consent_at TEXT,
  privacy_consent_version TEXT DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  author_name TEXT NOT NULL,
  profile_id TEXT,
  day_index INTEGER NOT NULL DEFAULT 0,
  visibility TEXT NOT NULL DEFAULT 'public',
  text TEXT DEFAULT '',
  place_name TEXT DEFAULT '',
  latitude REAL,
  longitude REAL,
  media_key TEXT,
  media_type TEXT,
  media_name TEXT,
  media_size INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS post_media (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  media_key TEXT NOT NULL,
  media_type TEXT,
  media_name TEXT,
  media_size INTEGER DEFAULT 0,
  position INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_post_media_post ON post_media(post_id, position);
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  profile_id TEXT DEFAULT '',
  visitor_id TEXT DEFAULT '',
  text TEXT DEFAULT '',
  media_key TEXT,
  media_type TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS reactions (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  author_name TEXT DEFAULT '',
  kind TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(post_id, visitor_id, kind)
);
CREATE TABLE IF NOT EXISTS document_status (
  profile_id TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  file_key TEXT,
  file_name TEXT,
  status TEXT NOT NULL DEFAULT 'missing',
  verified_by TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(profile_id, doc_type)
);
CREATE TABLE IF NOT EXISTS locations (
  profile_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS posts_created_idx ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS comments_post_idx ON comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS reactions_post_idx ON reactions(post_id);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  device_id TEXT UNIQUE,
  device_name TEXT DEFAULT 'Dispositivo',
  device_key_hash TEXT,
  created_at TEXT NOT NULL,
  last_used_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS auth_sessions_profile_idx
  ON auth_sessions(profile_id, expires_at);

CREATE TABLE IF NOT EXISTS profile_device_claims (
  profile_id TEXT PRIMARY KEY,
  claimed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS guest_sessions (
  token_hash TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS guest_sessions_expiry_idx
  ON guest_sessions(expires_at);

CREATE TABLE IF NOT EXISTS rate_limits (
  rate_key TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  bucket INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS rate_limits_expiry_idx
  ON rate_limits(expires_at);

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

CREATE TABLE IF NOT EXISTS profile_invites (
  token_hash TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);
CREATE TABLE IF NOT EXISTS sync_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  profile_id TEXT DEFAULT '',
  guest_visitor_id TEXT DEFAULT '',
  visitor_name TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
INSERT OR IGNORE INTO sync_state(id, version, updated_at)
VALUES(1, 0, CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO posts(
  id, author_name, profile_id, day_index, visibility, text, place_name,
  media_key, media_type, media_name, media_size, created_at
) VALUES(
  'india-welcome', 'India insieme', '', -1, 'public',
  'Il viaggio comincia qui. Foto, voci e ricordi del gruppo, tutti insieme.',
  '', NULL, NULL, NULL, 0, CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO post_media(
  id, post_id, media_key, media_type, media_name, media_size, position, created_at
) VALUES
  ('india-welcome-photo', 'india-welcome', 'static:/cities/india-insieme-collage.png', 'image/png', 'India insieme', 0, 0, CURRENT_TIMESTAMP),
  ('india-welcome-audio', 'india-welcome', 'static:/audio/india-insieme-demo.wav', 'audio/wav', 'Il suono dell’India', 0, 1, CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO posts(
  id, author_name, profile_id, day_index, visibility, text, place_name,
  media_key, media_type, media_name, media_size, created_at
) VALUES(
  'weroad-predeparture', 'India insieme', '', -1, 'public',
  'Il gruppo si sta formando: preparativi in corso, valigie quasi pronte e l’India sempre più vicina. Si parte insieme con WEROAD!',
  '', NULL, NULL, NULL, 0, '2026-08-04 13:30:16'
);
INSERT OR IGNORE INTO post_media(
  id, post_id, media_key, media_type, media_name, media_size, position, created_at
) VALUES(
  'weroad-predeparture-photo', 'weroad-predeparture', 'static:/ui/weroad-logo.png',
  'image/png', 'WEROAD · Preparativi per l’India', 55812, 0, '2026-08-04 13:30:16'
);
CREATE INDEX IF NOT EXISTS profile_invites_profile_idx
  ON profile_invites(profile_id, expires_at);

CREATE TRIGGER IF NOT EXISTS auth_sessions_profile_insert_guard
BEFORE INSERT ON auth_sessions
WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.profile_id)
BEGIN
  SELECT RAISE(ABORT, 'auth session profile missing');
END;
CREATE TRIGGER IF NOT EXISTS auth_sessions_profile_update_guard
BEFORE UPDATE OF profile_id ON auth_sessions
WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.profile_id)
BEGIN
  SELECT RAISE(ABORT, 'auth session profile missing');
END;
CREATE TRIGGER IF NOT EXISTS profile_invites_profile_insert_guard
BEFORE INSERT ON profile_invites
WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.profile_id)
  OR (NEW.created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.created_by))
BEGIN
  SELECT RAISE(ABORT, 'profile invite owner missing');
END;
CREATE TRIGGER IF NOT EXISTS profile_invites_profile_update_guard
BEFORE UPDATE OF profile_id, created_by ON profile_invites
WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.profile_id)
  OR (NEW.created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.created_by))
BEGIN
  SELECT RAISE(ABORT, 'profile invite owner missing');
END;
CREATE TRIGGER IF NOT EXISTS auth_profile_delete_cleanup
AFTER DELETE ON profiles
BEGIN
  DELETE FROM auth_sessions WHERE profile_id = OLD.id;
  DELETE FROM profile_invites WHERE profile_id = OLD.id OR created_by = OLD.id;
  DELETE FROM profile_device_claims WHERE profile_id = OLD.id;
END;
