ALTER TABLE comments ADD COLUMN parent_comment_id TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_comments_parent
ON comments(parent_comment_id, created_at);

CREATE TABLE IF NOT EXISTS comment_reactions (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  author_name TEXT DEFAULT '',
  kind TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(comment_id, actor_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment
ON comment_reactions(comment_id, created_at);
