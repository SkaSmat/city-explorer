-- =============================================
-- City Explorer - COMPLETE Supabase Schema
-- =============================================
-- Date: 12 Janvier 2026
-- This is the COMPLETE schema matching the actual code usage
-- Execute this entire script in Supabase SQL Editor
-- =============================================

-- Enable PostGIS extension (required for geometry types)
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================
-- 1. TABLES (with all columns actually used in code)
-- =============================================

-- Table: user_profiles
-- Stores user information and global stats
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY,
  username TEXT DEFAULT 'Explorer',
  total_distance_meters INTEGER DEFAULT 0,
  total_streets_explored INTEGER DEFAULT 0,
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: gps_tracks
-- Stores GPS tracking sessions
CREATE TABLE IF NOT EXISTS gps_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  route_geometry GEOMETRY(LINESTRING, 4326) NOT NULL,
  distance_meters INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gps_tracks_user_id ON gps_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracks_city ON gps_tracks(city);
CREATE INDEX IF NOT EXISTS idx_gps_tracks_started_at ON gps_tracks(started_at);

-- Table: explored_streets
-- IMPORTANT: Column is named 'street_osm_id' not 'osm_id' (matches code usage)
CREATE TABLE IF NOT EXISTS explored_streets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  street_osm_id BIGINT NOT NULL,
  street_name TEXT,
  first_explored_at TIMESTAMPTZ DEFAULT NOW(),
  track_id UUID REFERENCES gps_tracks(id) ON DELETE SET NULL,
  UNIQUE(user_id, street_osm_id)
);

CREATE INDEX IF NOT EXISTS idx_explored_streets_user_id ON explored_streets(user_id);
CREATE INDEX IF NOT EXISTS idx_explored_streets_city ON explored_streets(city);
CREATE INDEX IF NOT EXISTS idx_explored_streets_street_osm_id ON explored_streets(street_osm_id);

-- Table: city_progress
-- CRITICAL: Must have total_distance_meters column
CREATE TABLE IF NOT EXISTS city_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  streets_explored INTEGER DEFAULT 0,
  total_distance_meters INTEGER DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  first_visit TIMESTAMPTZ DEFAULT NOW(),
  total_sessions INTEGER DEFAULT 0,
  favorite BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, city)
);

CREATE INDEX IF NOT EXISTS idx_city_progress_user_id ON city_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_city_progress_last_activity ON city_progress(last_activity);

-- Table: badges
-- System-wide badge definitions
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: user_badges
-- Tracks unlocked badges per user
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- Table: overpass_cache
-- Caches Overpass API results for cities
CREATE TABLE IF NOT EXISTS overpass_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL UNIQUE,
  total_streets INTEGER NOT NULL,
  bbox TEXT,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_overpass_cache_city ON overpass_cache(city);
CREATE INDEX IF NOT EXISTS idx_overpass_cache_cached_at ON overpass_cache(cached_at);

-- =============================================
-- 2. MIGRATION: Add missing columns to existing tables
-- =============================================

-- Add bio, avatar_url, updated_at to user_profiles if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN bio TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add total_distance_meters to city_progress if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'city_progress' AND column_name = 'total_distance_meters'
  ) THEN
    ALTER TABLE city_progress ADD COLUMN total_distance_meters INTEGER DEFAULT 0;
  END IF;
END $$;

-- Rename osm_id to street_osm_id in explored_streets if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'explored_streets' AND column_name = 'osm_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'explored_streets' AND column_name = 'street_osm_id'
  ) THEN
    ALTER TABLE explored_streets RENAME COLUMN osm_id TO street_osm_id;
  END IF;
END $$;

-- =============================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE explored_streets ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE overpass_cache ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
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

-- Policies for gps_tracks
DROP POLICY IF EXISTS "Users can view own tracks" ON gps_tracks;
CREATE POLICY "Users can view own tracks"
  ON gps_tracks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tracks" ON gps_tracks;
CREATE POLICY "Users can insert own tracks"
  ON gps_tracks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for explored_streets
DROP POLICY IF EXISTS "Users can view own explored streets" ON explored_streets;
CREATE POLICY "Users can view own explored streets"
  ON explored_streets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own explored streets" ON explored_streets;
CREATE POLICY "Users can insert own explored streets"
  ON explored_streets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for city_progress
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

-- Policies for badges (public read)
DROP POLICY IF EXISTS "Anyone can view badges" ON badges;
CREATE POLICY "Anyone can view badges"
  ON badges FOR SELECT
  USING (true);

-- Policies for user_badges
DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
CREATE POLICY "Users can view own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own badges" ON user_badges;
CREATE POLICY "Users can insert own badges"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for overpass_cache (public read)
DROP POLICY IF EXISTS "Anyone can view cache" ON overpass_cache;
CREATE POLICY "Anyone can view cache"
  ON overpass_cache FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can upsert cache" ON overpass_cache;
CREATE POLICY "Anyone can upsert cache"
  ON overpass_cache FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update cache" ON overpass_cache;
CREATE POLICY "Anyone can update cache"
  ON overpass_cache FOR UPDATE
  USING (true);

-- =============================================
-- 4. RPC FUNCTION: calculate_explored_streets_v2
-- =============================================

CREATE OR REPLACE FUNCTION calculate_explored_streets_v2(
  p_track_id UUID,
  p_user_id UUID,
  p_explored_osm_ids BIGINT[],
  p_city TEXT
)
RETURNS TABLE(new_streets_count INTEGER, total_streets_count INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_streets_count INTEGER := 0;
  v_total_streets_count INTEGER := 0;
  v_osm_id BIGINT;
BEGIN
  -- Insert new explored streets (ignore if already exists)
  FOREACH v_osm_id IN ARRAY p_explored_osm_ids
  LOOP
    INSERT INTO explored_streets (user_id, city, street_osm_id, track_id, first_explored_at)
    VALUES (p_user_id, p_city, v_osm_id, p_track_id, NOW())
    ON CONFLICT (user_id, street_osm_id) DO NOTHING;

    -- Count if it was a new insert
    IF FOUND THEN
      v_new_streets_count := v_new_streets_count + 1;
    END IF;
  END LOOP;

  -- Get total streets explored by this user in this city
  SELECT COUNT(*)
  INTO v_total_streets_count
  FROM explored_streets
  WHERE user_id = p_user_id AND city = p_city;

  -- Update user_profiles stats
  UPDATE user_profiles
  SET
    total_streets_explored = (
      SELECT COUNT(*) FROM explored_streets WHERE user_id = p_user_id
    )
  WHERE id = p_user_id;

  -- Update or insert city_progress
  INSERT INTO city_progress (user_id, city, streets_explored, last_activity, total_sessions)
  VALUES (p_user_id, p_city, v_total_streets_count, NOW(), 1)
  ON CONFLICT (user_id, city)
  DO UPDATE SET
    streets_explored = v_total_streets_count,
    last_activity = NOW(),
    total_sessions = city_progress.total_sessions + 1;

  -- Update total distance in city_progress
  UPDATE city_progress
  SET total_distance_meters = (
    SELECT COALESCE(SUM(distance_meters), 0)
    FROM gps_tracks
    WHERE user_id = p_user_id AND city = p_city
  )
  WHERE user_id = p_user_id AND city = p_city;

  -- Update total distance in user_profiles
  UPDATE user_profiles
  SET total_distance_meters = (
    SELECT COALESCE(SUM(distance_meters), 0)
    FROM gps_tracks
    WHERE user_id = p_user_id
  )
  WHERE id = p_user_id;

  -- Return results
  RETURN QUERY SELECT v_new_streets_count, v_total_streets_count;
END;
$$;

-- =============================================
-- 5. SEED DATA: Default Badges
-- =============================================

INSERT INTO badges (name, description, icon, condition_type, condition_value)
VALUES
  ('First Steps', 'Walk your first kilometer', '👣', 'distance', 1000),
  ('Explorer', 'Walk 10 kilometers', '🚶', 'distance', 10000),
  ('Street Collector', 'Explore 10 different streets', '🗺️', 'streets', 10),
  ('Neighborhood Explorer', 'Complete 100% of a neighborhood', '🏘️', 'neighborhood', 100),
  ('Globe Trotter', 'Explore 3 different cities', '🌍', 'cities', 3),
  ('Marathon Walker', 'Walk 42 kilometers total', '🏃', 'distance', 42000),
  ('Street Master', 'Explore 100 different streets', '⭐', 'streets', 100),
  ('City Explorer', 'Explore 10 different cities', '🏙️', 'cities', 10)
ON CONFLICT DO NOTHING;

-- =============================================
-- 6. VERIFICATION QUERIES
-- =============================================

-- Verify all tables exist
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'gps_tracks', 'explored_streets', 'city_progress', 'badges', 'user_badges', 'overpass_cache')
ORDER BY tablename;

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'gps_tracks', 'explored_streets', 'city_progress', 'badges', 'user_badges', 'overpass_cache')
ORDER BY tablename;

-- Count badges
SELECT COUNT(*) as badge_count FROM badges;

-- =============================================
-- END OF COMPLETE SCHEMA
-- =============================================
