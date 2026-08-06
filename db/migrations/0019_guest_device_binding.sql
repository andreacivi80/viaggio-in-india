-- Migrazione additiva: le sessioni ospite esistenti restano valide e vengono
-- associate al dispositivo alla prima richiesta che presenta la relativa chiave.
ALTER TABLE guest_sessions ADD COLUMN device_key_hash TEXT;
