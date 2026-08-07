-- The first bootstrap assigns the sole coordinator. Later registrations and
-- profile edits must never create a second coordinator.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_single_coordinator
ON profiles(role)
WHERE role = 'coordinator';
