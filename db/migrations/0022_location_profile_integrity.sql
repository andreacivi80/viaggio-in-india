-- Le posizioni devono appartenere a un profilo esistente. La cancellazione
-- diretta di un profilo non può lasciare dati privati orfani.
CREATE TRIGGER IF NOT EXISTS location_profile_insert_guard
BEFORE INSERT ON locations
WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.profile_id)
BEGIN
  SELECT RAISE(ABORT, 'location profile missing');
END;

CREATE TRIGGER IF NOT EXISTS location_profile_update_guard
BEFORE UPDATE OF profile_id ON locations
WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.profile_id)
BEGIN
  SELECT RAISE(ABORT, 'location profile missing');
END;

CREATE TRIGGER IF NOT EXISTS private_profile_delete_cleanup
AFTER DELETE ON profiles
BEGIN
  DELETE FROM locations WHERE profile_id = OLD.id;
  DELETE FROM document_status WHERE profile_id = OLD.id;
END;
