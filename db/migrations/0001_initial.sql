-- Baseline additiva per ricostruire un database vuoto e per rendere verificabile
-- l'intera catena delle migrazioni. Su un database esistente non riscrive dati.
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  surname TEXT DEFAULT '',
  age TEXT DEFAULT '',
  job TEXT DEFAULT '',
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

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_post_media_post ON post_media(post_id, position);
CREATE INDEX IF NOT EXISTS comments_post_idx ON comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS reactions_post_idx ON reactions(post_id);
