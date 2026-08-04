INSERT OR IGNORE INTO sync_state(id, version, updated_at)
VALUES(1, 0, CURRENT_TIMESTAMP);

-- Un endpoint non può dimenticare di avvisare gli altri dispositivi:
-- ogni mutazione condivisa aggiorna automaticamente la versione globale.
CREATE TRIGGER IF NOT EXISTS sync_profiles_insert AFTER INSERT ON profiles BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_profiles_update AFTER UPDATE ON profiles BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_profiles_delete AFTER DELETE ON profiles BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_posts_insert AFTER INSERT ON posts BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_posts_update AFTER UPDATE ON posts BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_posts_delete AFTER DELETE ON posts BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_post_media_insert AFTER INSERT ON post_media BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_post_media_update AFTER UPDATE ON post_media BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_post_media_delete AFTER DELETE ON post_media BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_comments_insert AFTER INSERT ON comments BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_comments_update AFTER UPDATE ON comments BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_comments_delete AFTER DELETE ON comments BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_reactions_insert AFTER INSERT ON reactions BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_reactions_update AFTER UPDATE ON reactions BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_reactions_delete AFTER DELETE ON reactions BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_documents_insert AFTER INSERT ON document_status BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_documents_update AFTER UPDATE ON document_status BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_documents_delete AFTER DELETE ON document_status BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_locations_insert AFTER INSERT ON locations BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_locations_update AFTER UPDATE ON locations BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS sync_locations_delete AFTER DELETE ON locations BEGIN
  UPDATE sync_state SET version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=1;
END;
