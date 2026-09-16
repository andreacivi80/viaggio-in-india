CREATE TABLE IF NOT EXISTS notification_preferences (
  profile_id TEXT PRIMARY KEY,
  posts INTEGER NOT NULL DEFAULT 1 CHECK(posts IN (0,1)),
  comments INTEGER NOT NULL DEFAULT 1 CHECK(comments IN (0,1)),
  reactions INTEGER NOT NULL DEFAULT 1 CHECK(reactions IN (0,1)),
  documents INTEGER NOT NULL DEFAULT 1 CHECK(documents IN (0,1)),
  location INTEGER NOT NULL DEFAULT 1 CHECK(location IN (0,1)),
  updated_at TEXT NOT NULL,
  FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TRIGGER IF NOT EXISTS notification_preferences_profile_delete
AFTER DELETE ON profiles BEGIN
  DELETE FROM notification_preferences WHERE profile_id=OLD.id;
END;
