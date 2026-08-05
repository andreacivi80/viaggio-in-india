-- Aggiunge il binding del token al dispositivo senza revocare le sessioni esistenti.
-- Le sessioni precedenti vengono associate alla prima chiave valida presentata
-- dalla nuova applicazione; le nuove sessioni nascono già associate.
ALTER TABLE auth_sessions ADD COLUMN device_key_hash TEXT;
