-- =============================================
-- DISABLE RLS FOR MVP (Quick Setup)
-- =============================================
-- This migration disables Row Level Security for faster MVP development
-- Use this if you want to get started quickly without authentication complexities

-- For production, use enable-rls-production.sql instead

ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE gps_tracks DISABLE ROW LEVEL SECURITY;
ALTER TABLE explored_streets DISABLE ROW LEVEL SECURITY;
ALTER TABLE city_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;

-- Verify RLS status
SELECT
  schemaname,
  tablename,
  CASE
    WHEN rowsecurity THEN '🔒 ENABLED'
    ELSE '🔓 DISABLED'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'gps_tracks', 'explored_streets', 'city_progress', 'badges', 'user_badges')
ORDER BY tablename;
