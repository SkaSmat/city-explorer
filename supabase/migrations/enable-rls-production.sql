-- =============================================
-- ENABLE RLS FOR PRODUCTION (Secure Setup)
-- =============================================
-- This migration enables Row Level Security with proper policies
-- Use this for production deployment with authentication

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE explored_streets ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Policies for user_profiles
-- =============================================

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- =============================================
-- Policies for gps_tracks
-- =============================================

DROP POLICY IF EXISTS "Users can view own tracks" ON gps_tracks;
CREATE POLICY "Users can view own tracks"
  ON gps_tracks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tracks" ON gps_tracks;
CREATE POLICY "Users can insert own tracks"
  ON gps_tracks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Policies for explored_streets
-- =============================================

DROP POLICY IF EXISTS "Users can view own explored streets" ON explored_streets;
CREATE POLICY "Users can view own explored streets"
  ON explored_streets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own explored streets" ON explored_streets;
CREATE POLICY "Users can insert own explored streets"
  ON explored_streets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Policies for city_progress
-- =============================================

DROP POLICY IF EXISTS "Users can view own city progress" ON city_progress;
CREATE POLICY "Users can view own city progress"
  ON city_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own city progress" ON city_progress;
CREATE POLICY "Users can insert own city progress"
  ON city_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own city progress" ON city_progress;
CREATE POLICY "Users can update own city progress"
  ON city_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- Policies for badges (public read)
-- =============================================

DROP POLICY IF EXISTS "Anyone can view badges" ON badges;
CREATE POLICY "Anyone can view badges"
  ON badges FOR SELECT
  USING (true);

-- =============================================
-- Policies for user_badges
-- =============================================

DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
CREATE POLICY "Users can view own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own badges" ON user_badges;
CREATE POLICY "Users can insert own badges"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Verify RLS and policies
SELECT
  schemaname,
  tablename,
  CASE
    WHEN rowsecurity THEN '🔒 ENABLED'
    ELSE '🔓 DISABLED'
  END as rls_status,
  (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'gps_tracks', 'explored_streets', 'city_progress', 'badges', 'user_badges')
ORDER BY tablename;
