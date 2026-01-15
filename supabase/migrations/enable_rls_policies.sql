-- Enable Row Level Security on all tables
-- Execute this in Supabase SQL Editor after merging PR

-- ============================================================
-- USER PROFILES
-- ============================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile (for new signups)
CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================================
-- GPS TRACKS
-- ============================================================

ALTER TABLE gps_tracks ENABLE ROW LEVEL SECURITY;

-- Users can read their own GPS tracks
CREATE POLICY "Users can read own tracks"
ON gps_tracks FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own GPS tracks
CREATE POLICY "Users can insert own tracks"
ON gps_tracks FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own GPS tracks
CREATE POLICY "Users can update own tracks"
ON gps_tracks FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================================
-- EXPLORED STREETS
-- ============================================================

ALTER TABLE explored_streets ENABLE ROW LEVEL SECURITY;

-- Users can read their own explored streets
CREATE POLICY "Users can read own streets"
ON explored_streets FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own explored streets
CREATE POLICY "Users can insert own streets"
ON explored_streets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can read public streets (for leaderboard comparison)
CREATE POLICY "Users can read public streets for leaderboard"
ON explored_streets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = explored_streets.user_id
    AND user_profiles.public_profile = true
  )
);

-- ============================================================
-- STRAVA CONNECTIONS
-- ============================================================

ALTER TABLE strava_connections ENABLE ROW LEVEL SECURITY;

-- Users can read their own Strava connection
CREATE POLICY "Users can read own strava connection"
ON strava_connections FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own Strava connection
CREATE POLICY "Users can insert own strava connection"
ON strava_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own Strava connection (token refresh)
CREATE POLICY "Users can update own strava connection"
ON strava_connections FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own Strava connection
CREATE POLICY "Users can delete own strava connection"
ON strava_connections FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================
-- USER BADGES
-- ============================================================

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Users can read their own badges
CREATE POLICY "Users can read own badges"
ON user_badges FOR SELECT
USING (auth.uid() = user_id);

-- Users can receive badges (insert)
CREATE POLICY "Users can receive badges"
ON user_badges FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can read public badges (for leaderboard)
CREATE POLICY "Users can read public badges"
ON user_badges FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = user_badges.user_id
    AND user_profiles.public_profile = true
  )
);

-- ============================================================
-- CITY PROGRESS
-- ============================================================

ALTER TABLE city_progress ENABLE ROW LEVEL SECURITY;

-- Users can read their own city progress
CREATE POLICY "Users can read own city progress"
ON city_progress FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own city progress
CREATE POLICY "Users can insert own city progress"
ON city_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own city progress
CREATE POLICY "Users can update own city progress"
ON city_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Users can read public city progress (for leaderboard)
CREATE POLICY "Users can read public city progress"
ON city_progress FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = city_progress.user_id
    AND user_profiles.public_profile = true
  )
);

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Check that RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'user_profiles',
  'gps_tracks',
  'explored_streets',
  'strava_connections',
  'user_badges',
  'city_progress'
);

-- Should show: rowsecurity = true for all tables
