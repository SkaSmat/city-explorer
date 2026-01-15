-- ============================================================
-- VERIFY CURRENT SCHEMA
-- Run this first to see what exists
-- ============================================================

-- Check existing tables
SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles',
    'gps_tracks',
    'explored_streets',
    'city_progress',
    'user_badges',
    'strava_connections'
  )
ORDER BY tablename;

-- Check columns in gps_tracks
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'gps_tracks'
ORDER BY ordinal_position;

-- Check columns in explored_streets
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'explored_streets'
ORDER BY ordinal_position;

-- Check columns in city_progress
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'city_progress'
ORDER BY ordinal_position;

-- Check columns in user_profiles
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check existing functions
SELECT
  proname as function_name,
  pronargs as num_args
FROM pg_proc
WHERE proname IN (
  'calculate_explored_streets_v2',
  'update_user_stats_from_track',
  'update_streak',
  'get_user_stats',
  'get_city_leaderboard'
)
ORDER BY proname;
