-- Consenso esplicito solo per le nuove registrazioni.
-- I profili già esistenti non vengono riscritti né cancellati.
ALTER TABLE profiles ADD COLUMN privacy_consent_at TEXT;
ALTER TABLE profiles ADD COLUMN privacy_consent_version TEXT DEFAULT '';
