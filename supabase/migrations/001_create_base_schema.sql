-- ============================================================
-- CITY EXPLORER - BASE SCHEMA
-- Create all tables, functions, and triggers
-- ============================================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- TABLE: user_profiles
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  public_profile BOOLEAN DEFAULT false,
  total_distance_meters INTEGER DEFAULT 0,
  total_streets_explored INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  last_activity_date DATE
);

-- ============================================================
-- TABLE: gps_tracks
-- ============================================================

CREATE TABLE IF NOT EXISTS gps_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  route_geometry GEOMETRY(LINESTRING, 4326) NOT NULL,
  distance_meters INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT DEFAULT 'gps',
  strava_activity_id BIGINT,

  -- Indexes for performance
  CONSTRAINT gps_tracks_distance_positive CHECK (distance_meters >= 0),
  CONSTRAINT gps_tracks_duration_positive CHECK (duration_seconds >= 0)
);

CREATE INDEX IF NOT EXISTS idx_gps_tracks_user_id ON gps_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracks_city ON gps_tracks(city);
CREATE INDEX IF NOT EXISTS idx_gps_tracks_started_at ON gps_tracks(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_gps_tracks_geometry ON gps_tracks USING GIST(route_geometry);

-- ============================================================
-- TABLE: explored_streets
-- ============================================================

CREATE TABLE IF NOT EXISTS explored_streets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  osm_id BIGINT NOT NULL,
  street_name TEXT,
  street_geometry GEOMETRY(LINESTRING, 4326),
  first_explored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  times_explored INTEGER DEFAULT 1,

  -- Ensure uniqueness per user/city/street
  UNIQUE(user_id, city, osm_id)
);

CREATE INDEX IF NOT EXISTS idx_explored_streets_user_city ON explored_streets(user_id, city);
CREATE INDEX IF NOT EXISTS idx_explored_streets_osm_id ON explored_streets(osm_id);
CREATE INDEX IF NOT EXISTS idx_explored_streets_geometry ON explored_streets USING GIST(street_geometry);

-- ============================================================
-- TABLE: city_progress
-- ============================================================

CREATE TABLE IF NOT EXISTS city_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  streets_explored INTEGER DEFAULT 0,
  total_distance_meters INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one row per user/city
  UNIQUE(user_id, city)
);

CREATE INDEX IF NOT EXISTS idx_city_progress_user_id ON city_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_city_progress_city ON city_progress(city);

-- ============================================================
-- TABLE: user_badges
-- ============================================================

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure user can only unlock badge once
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

-- ============================================================
-- FUNCTION: calculate_explored_streets_v2
-- Core function to process GPS tracks and record explored streets
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_explored_streets_v2(
  p_track_id UUID,
  p_user_id UUID,
  p_explored_osm_ids BIGINT[],
  p_city TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_streets INTEGER := 0;
  v_osm_id BIGINT;
  v_street_exists BOOLEAN;
BEGIN
  -- Loop through each explored OSM ID
  FOREACH v_osm_id IN ARRAY p_explored_osm_ids
  LOOP
    -- Check if street already explored by this user in this city
    SELECT EXISTS(
      SELECT 1 FROM explored_streets
      WHERE user_id = p_user_id
        AND city = p_city
        AND osm_id = v_osm_id
    ) INTO v_street_exists;

    IF v_street_exists THEN
      -- Increment times explored
      UPDATE explored_streets
      SET times_explored = times_explored + 1
      WHERE user_id = p_user_id
        AND city = p_city
        AND osm_id = v_osm_id;
    ELSE
      -- Insert new explored street
      INSERT INTO explored_streets (user_id, city, osm_id)
      VALUES (p_user_id, p_city, v_osm_id)
      ON CONFLICT (user_id, city, osm_id) DO NOTHING;

      v_new_streets := v_new_streets + 1;
    END IF;
  END LOOP;

  -- Update city progress
  INSERT INTO city_progress (user_id, city, streets_explored, last_activity)
  VALUES (
    p_user_id,
    p_city,
    v_new_streets,
    NOW()
  )
  ON CONFLICT (user_id, city) DO UPDATE SET
    streets_explored = city_progress.streets_explored + v_new_streets,
    last_activity = NOW();

  -- Update user profile total streets
  UPDATE user_profiles
  SET
    total_streets_explored = total_streets_explored + v_new_streets,
    last_activity_date = CURRENT_DATE
  WHERE id = p_user_id;

  RETURN v_new_streets;
END;
$$;

-- ============================================================
-- FUNCTION: update_user_stats_from_track
-- Triggered after GPS track insert to update user stats
-- ============================================================

CREATE OR REPLACE FUNCTION update_user_stats_from_track()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update user profile total distance
  UPDATE user_profiles
  SET
    total_distance_meters = total_distance_meters + NEW.distance_meters,
    last_activity_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = NEW.user_id;

  -- Update city progress total distance
  INSERT INTO city_progress (user_id, city, total_distance_meters, last_activity)
  VALUES (NEW.user_id, NEW.city, NEW.distance_meters, NEW.ended_at)
  ON CONFLICT (user_id, city) DO UPDATE SET
    total_distance_meters = city_progress.total_distance_meters + NEW.distance_meters,
    last_activity = NEW.ended_at;

  RETURN NEW;
END;
$$;

-- Create trigger on gps_tracks
DROP TRIGGER IF EXISTS trigger_update_stats_on_track_insert ON gps_tracks;
CREATE TRIGGER trigger_update_stats_on_track_insert
  AFTER INSERT ON gps_tracks
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_from_track();

-- ============================================================
-- FUNCTION: update_streak
-- Calculate and update user streak based on activity
-- ============================================================

CREATE OR REPLACE FUNCTION update_streak(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_new_streak INTEGER;
BEGIN
  -- Get current streak and last activity
  SELECT last_activity_date, current_streak
  INTO v_last_activity, v_current_streak
  FROM user_profiles
  WHERE id = p_user_id;

  -- If no previous activity, start streak at 1
  IF v_last_activity IS NULL THEN
    v_new_streak := 1;
  -- If last activity was yesterday, increment streak
  ELSIF v_last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
    v_new_streak := v_current_streak + 1;
  -- If last activity was today, keep streak
  ELSIF v_last_activity = CURRENT_DATE THEN
    v_new_streak := v_current_streak;
  -- If gap > 1 day, reset streak
  ELSE
    v_new_streak := 1;
  END IF;

  -- Update user profile
  UPDATE user_profiles
  SET current_streak = v_new_streak
  WHERE id = p_user_id;

  RETURN v_new_streak;
END;
$$;

-- ============================================================
-- FUNCTION: get_user_stats
-- Get complete user statistics in one query
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS TABLE(
  total_distance INTEGER,
  total_streets INTEGER,
  total_cities INTEGER,
  current_streak INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(up.total_distance_meters, 0) as total_distance,
    COALESCE(up.total_streets_explored, 0) as total_streets,
    COALESCE((SELECT COUNT(DISTINCT city) FROM city_progress WHERE user_id = p_user_id), 0)::INTEGER as total_cities,
    COALESCE(up.current_streak, 0) as current_streak
  FROM user_profiles up
  WHERE up.id = p_user_id;
END;
$$;

-- ============================================================
-- FUNCTION: get_city_leaderboard
-- Get top explorers for a specific city
-- ============================================================

CREATE OR REPLACE FUNCTION get_city_leaderboard(
  p_city TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  streets_explored INTEGER,
  total_distance_meters INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.user_id,
    up.username,
    up.avatar_url,
    cp.streets_explored,
    cp.total_distance_meters
  FROM city_progress cp
  JOIN user_profiles up ON up.id = cp.user_id
  WHERE cp.city = p_city
    AND up.public_profile = true
  ORDER BY cp.streets_explored DESC, cp.total_distance_meters DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE user_profiles IS 'User profiles with aggregate statistics';
COMMENT ON TABLE gps_tracks IS 'GPS tracking sessions with route geometry';
COMMENT ON TABLE explored_streets IS 'Streets explored by users (unique per user/city/street)';
COMMENT ON TABLE city_progress IS 'Per-city progress statistics for users';
COMMENT ON TABLE user_badges IS 'Badges unlocked by users';

COMMENT ON FUNCTION calculate_explored_streets_v2 IS 'Process GPS track and record newly explored streets';
COMMENT ON FUNCTION update_user_stats_from_track IS 'Trigger function to update stats when track inserted';
COMMENT ON FUNCTION update_streak IS 'Calculate and update user activity streak';
COMMENT ON FUNCTION get_user_stats IS 'Get complete user statistics in single query';
COMMENT ON FUNCTION get_city_leaderboard IS 'Get leaderboard for specific city';
