-- Impedisce sessioni e inviti orfani anche se una futura funzione dimentica
-- il controllo applicativo. I trigger sono additivi e non riscrivono dati.
CREATE TRIGGER IF NOT EXISTS auth_sessions_profile_insert_guard
BEFORE INSERT ON auth_sessions
WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.profile_id)
BEGIN
  SELECT RAISE(ABORT, 'auth session profile missing');
END;

CREATE TRIGGER IF NOT EXISTS auth_sessions_profile_update_guard
BEFORE UPDATE OF profile_id ON auth_sessions
WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.profile_id)
BEGIN
  SELECT RAISE(ABORT, 'auth session profile missing');
END;

CREATE TRIGGER IF NOT EXISTS profile_invites_profile_insert_guard
BEFORE INSERT ON profile_invites
WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.profile_id)
  OR (NEW.created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.created_by))
BEGIN
  SELECT RAISE(ABORT, 'profile invite owner missing');
END;

CREATE TRIGGER IF NOT EXISTS profile_invites_profile_update_guard
BEFORE UPDATE OF profile_id, created_by ON profile_invites
WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.profile_id)
  OR (NEW.created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.created_by))
BEGIN
  SELECT RAISE(ABORT, 'profile invite owner missing');
END;

CREATE TRIGGER IF NOT EXISTS auth_profile_delete_cleanup
AFTER DELETE ON profiles
BEGIN
  DELETE FROM auth_sessions WHERE profile_id = OLD.id;
  DELETE FROM profile_invites WHERE profile_id = OLD.id OR created_by = OLD.id;
  DELETE FROM profile_device_claims WHERE profile_id = OLD.id;
END;
