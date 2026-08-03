ALTER TABLE comments ADD COLUMN profile_id TEXT DEFAULT '';
CREATE INDEX IF NOT EXISTS comments_profile_idx
  ON comments(profile_id, created_at);
