CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  surname TEXT DEFAULT '',
  age TEXT DEFAULT '',
  job TEXT DEFAULT '',
  origin_city TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  role TEXT DEFAULT 'traveler',
  avatar_key TEXT,
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
  visitor_name TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
INSERT OR IGNORE INTO sync_state(id, version, updated_at)
VALUES(1, 0, CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS profile_invites_profile_idx
  ON profile_invites(profile_id, expires_at);
