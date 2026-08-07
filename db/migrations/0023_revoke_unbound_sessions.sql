-- Le vecchie sessioni prive del binding al dispositivo vengono revocate.
-- Profili e contenuti restano invariati; l'utente effettua un nuovo accesso.
UPDATE auth_sessions
SET revoked_at = COALESCE(revoked_at, datetime('now'))
WHERE device_key_hash IS NULL;

UPDATE guest_sessions
SET revoked_at = COALESCE(revoked_at, datetime('now'))
WHERE device_key_hash IS NULL;
