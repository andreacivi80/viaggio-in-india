ALTER TABLE profiles ADD COLUMN gender TEXT DEFAULT '';
UPDATE profiles SET gender='male' WHERE lower(trim(name))='andrea' AND (gender IS NULL OR gender='');
UPDATE profiles SET gender='female' WHERE lower(trim(name))='sara' AND (gender IS NULL OR gender='');
UPDATE profiles SET gender='female' WHERE lower(trim(name))='valentina' AND (gender IS NULL OR gender='');
