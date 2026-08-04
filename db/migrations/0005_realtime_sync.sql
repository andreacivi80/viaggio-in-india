CREATE TABLE IF NOT EXISTS sync_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
INSERT OR IGNORE INTO sync_state(id, version, updated_at)
VALUES(1, 0, CURRENT_TIMESTAMP);

CREATE TRIGGER IF NOT EXISTS profiles_sync_insert AFTER INSERT ON profiles BEGIN UPDATE sync_state SET version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1; END;
CREATE TRIGGER IF NOT EXISTS profiles_sync_update AFTER UPDATE ON profiles BEGIN UPDATE sync_state SET version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1; END;
CREATE TRIGGER IF NOT EXISTS profiles_sync_delete AFTER DELETE ON profiles BEGIN UPDATE sync_state SET version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1; END;
CREATE TRIGGER IF NOT EXISTS posts_sync_insert AFTER INSERT ON posts BEGIN UPDATE sync_state SET version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1; END;
CREATE TRIGGER IF NOT EXISTS posts_sync_update AFTER UPDATE ON posts BEGIN UPDATE sync_state SET version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1; END;
CREATE TRIGGER IF NOT EXISTS posts_sync_delete AFTER DELETE ON posts BEGIN UPDATE sync_state SET version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1; END;
CREATE TRIGGER IF NOT EXISTS post_media_sync_insert AFTER INSERT ON post_media BEGIN UPDATE sync_state SET version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1; END;
CREATE TRIGGER IF NOT EXISTS post_media_sync_delete AFTER DELETE ON post_media BEGIN UPDATE sync_state SET version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1; END;
CREATE TRIGGER IF NOT EXISTS comments_sync_insert AFTER INSERT ON comments BEGIN UPDATE sync_state SET version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1; END;
CREATE TRIGGER IF NOT EXISTS comments_sync_update AFTER UPDATE ON comments BEGIN UPDATE sync_state SET version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1; END;
CREATE TRIGGER IF NOT EXISTS comments_sync_delete AFTER DELETE ON comments BEGIN UPDATE sync_state SET version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1; END;
CREATE TRIGGER IF NOT EXISTS reactions_sync_insert AFTER INSERT ON reactions BEGIN UPDATE sync_state SET version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1; END;
CREATE TRIGGER IF NOT EXISTS reactions_sync_update AFTER UPDATE ON reactions BEGIN UPDATE sync_state SET version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1; END;
CREATE TRIGGER IF NOT EXISTS reactions_sync_delete AFTER DELETE ON reactions BEGIN UPDATE sync_state SET version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1; END;
CREATE TRIGGER IF NOT EXISTS locations_sync_insert AFTER INSERT ON locations BEGIN UPDATE sync_state SET version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1; END;
CREATE TRIGGER IF NOT EXISTS locations_sync_update AFTER UPDATE ON locations BEGIN UPDATE sync_state SET version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1; END;
CREATE TRIGGER IF NOT EXISTS locations_sync_delete AFTER DELETE ON locations BEGIN UPDATE sync_state SET version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1; END;
CREATE TRIGGER IF NOT EXISTS documents_sync_insert AFTER INSERT ON document_status BEGIN UPDATE sync_state SET version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1; END;
CREATE TRIGGER IF NOT EXISTS documents_sync_update AFTER UPDATE ON document_status BEGIN UPDATE sync_state SET version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1; END;
CREATE TRIGGER IF NOT EXISTS documents_sync_delete AFTER DELETE ON document_status BEGIN UPDATE sync_state SET version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1; END;
