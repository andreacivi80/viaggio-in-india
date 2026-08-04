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
  'india-welcome', 'India insieme', '', -1, 'public',
  'Il viaggio comincia qui. Foto, voci e ricordi del gruppo, tutti insieme.',
  '', NULL, NULL, NULL, 0, CURRENT_TIMESTAMP
);

INSERT INTO post_media(
  id, post_id, media_key, media_type, media_name, media_size, position, created_at
) VALUES
  ('india-welcome-photo', 'india-welcome', 'static:/cities/india-insieme-collage.png', 'image/png', 'India insieme', 0, 0, CURRENT_TIMESTAMP),
  ('india-welcome-audio', 'india-welcome', 'static:/audio/india-insieme-demo.wav', 'audio/wav', 'Il suono dell’India', 0, 1, CURRENT_TIMESTAMP);

UPDATE sync_state
SET version = version + 1, updated_at = CURRENT_TIMESTAMP
WHERE id = 1;
