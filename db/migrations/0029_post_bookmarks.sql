CREATE TABLE IF NOT EXISTS post_bookmarks (
  profile_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(profile_id, post_id),
  FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS post_bookmarks_post_idx ON post_bookmarks(post_id);

CREATE TRIGGER IF NOT EXISTS sync_post_bookmarks_insert
AFTER INSERT ON post_bookmarks
BEGIN
  UPDATE sync_state SET version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS sync_post_bookmarks_delete
AFTER DELETE ON post_bookmarks
BEGIN
  UPDATE sync_state SET version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1;
END;
