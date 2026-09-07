-- RESET ESPLICITO DELLA SOLA FASE DI PROVA.
-- Eseguire una sola volta prima dell'inserimento dei dati reali.
-- Non viene richiamato automaticamente da build o revisioni future.

DELETE FROM upload_parts;
DELETE FROM upload_sessions;
DELETE FROM idempotency_operations;
DELETE FROM profile_invites;
DELETE FROM profile_device_claims;
DELETE FROM auth_sessions;
DELETE FROM guest_sessions;
DELETE FROM push_subscriptions;
DELETE FROM document_status;
DELETE FROM locations;
DELETE FROM reactions;
DELETE FROM comments;
DELETE FROM post_media;
DELETE FROM posts;
DELETE FROM profiles;

INSERT INTO posts(
  id, author_name, profile_id, day_index, visibility, text, place_name,
  media_key, media_type, media_name, media_size, created_at
) VALUES(
  'weroad-predeparture', 'Thailandia insieme', '', -1, 'public',
  'Il gruppo si sta formando: preparativi in corso, zaini quasi pronti e la Thailandia sempre più vicina. Da Bangkok a Khao Sok, Phi Phi e Krabi: si parte insieme con WEROAD!',
  '', NULL, NULL, NULL, 0, CURRENT_TIMESTAMP
);

INSERT INTO post_media(
  id, post_id, media_key, media_type, media_name, media_size, position, created_at
) VALUES
  ('weroad-predeparture-photo', 'weroad-predeparture', 'static:/thailand/thailandia-insieme.png', 'image/png', 'Thailandia Insieme · preparativi WEROAD', 2615298, 0, CURRENT_TIMESTAMP);

UPDATE sync_state
SET version = version + 1, updated_at = CURRENT_TIMESTAMP
WHERE id = 1;
