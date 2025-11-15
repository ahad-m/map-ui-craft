-- Disable RLS on mosques table to allow public read access
-- This matches the configuration of schools and universities tables
ALTER TABLE public.mosques DISABLE ROW LEVEL SECURITY;