ALTER TABLE push_subscriptions ADD COLUMN guest_visitor_id TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS push_subscriptions_profile_idx
  ON push_subscriptions(profile_id, guest_visitor_id);

CREATE INDEX IF NOT EXISTS posts_visibility_created_idx
  ON posts(visibility, created_at DESC);
