-- Impedisce documenti orfani anche se una futura funzione salta il controllo API.
-- La migrazione è additiva: non modifica né riscrive documenti esistenti.
CREATE TRIGGER IF NOT EXISTS document_profile_insert_guard
BEFORE INSERT ON document_status
WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.profile_id)
BEGIN
  SELECT RAISE(ABORT, 'document profile missing');
END;

CREATE TRIGGER IF NOT EXISTS document_profile_update_guard
BEFORE UPDATE OF profile_id ON document_status
WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.profile_id)
BEGIN
  SELECT RAISE(ABORT, 'document profile missing');
END;
