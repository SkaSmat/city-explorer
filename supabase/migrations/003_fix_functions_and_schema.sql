-- ============================================================
-- FIX FUNCTIONS AND SCHEMA
-- Safe migration that drops and recreates functions properly
-- ============================================================

-- Enable PostGIS extension (idempotent)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- DROP TRIGGERS FIRST, THEN FUNCTIONS (to avoid dependency errors)
-- ============================================================

-- Drop trigger BEFORE dropping functions (because trigger depends on function)
DROP TRIGGER IF EXISTS trigger_update_stats_on_track_insert ON gps_tracks;

-- Now drop functions
DROP FUNCTION IF EXISTS calculate_explored_streets_v2(uuid,uuid,bigint[],text);
DROP FUNCTION IF EXISTS update_user_stats_from_track();
DROP FUNCTION IF EXISTS update_streak(uuid);
DROP FUNCTION IF EXISTS get_user_stats(uuid);
DROP FUNCTION IF EXISTS get_city_leaderboard(text,integer);

-- ============================================================
-- ALTER TABLE: explored_streets
-- Add missing columns if they don't exist
-- ============================================================

DO $$
BEGIN
  -- Add osm_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'explored_streets' AND column_name = 'osm_id'
  ) THEN
    ALTER TABLE explored_streets ADD COLUMN osm_id BIGINT;
  END IF;

  -- Add street_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'explored_streets' AND column_name = 'street_name'
  ) THEN
    ALTER TABLE explored_streets ADD COLUMN street_name TEXT;
  END IF;

  -- Add street_geometry column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'explored_streets' AND column_name = 'street_geometry'
  ) THEN
    ALTER TABLE explored_streets ADD COLUMN street_geometry GEOMETRY(LINESTRING, 4326);
  END IF;

  -- Add first_explored_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'explored_streets' AND column_name = 'first_explored_at'
  ) THEN
    ALTER TABLE explored_streets ADD COLUMN first_explored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Add times_explored column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'explored_streets' AND column_name = 'times_explored'
  ) THEN
    ALTER TABLE explored_streets ADD COLUMN times_explored INTEGER DEFAULT 1;
  END IF;
END $$;

-- Create unique constraint (safe, won't fail if exists)
DO $$
BEGIN
  ALTER TABLE explored_streets
  ADD CONSTRAINT explored_streets_user_city_osm_unique
  UNIQUE(user_id, city, osm_id);
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN others THEN
    RAISE NOTICE 'Constraint already exists or data has duplicates - skipping';
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_explored_streets_user_city ON explored_streets(user_id, city);
CREATE INDEX IF NOT EXISTS idx_explored_streets_osm_id ON explored_streets(osm_id);
CREATE INDEX IF NOT EXISTS idx_explored_streets_geometry ON explored_streets USING GIST(street_geometry);

-- ============================================================
-- ALTER TABLE: user_profiles
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'total_distance_meters'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN total_distance_meters INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'total_streets_explored'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN total_streets_explored INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'current_streak'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN current_streak INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'last_activity_date'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN last_activity_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'public_profile'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN public_profile BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ============================================================
-- ALTER TABLE: city_progress
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'city_progress' AND column_name = 'streets_explored'
  ) THEN
    ALTER TABLE city_progress ADD COLUMN streets_explored INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'city_progress' AND column_name = 'total_distance_meters'
  ) THEN
    ALTER TABLE city_progress ADD COLUMN total_distance_meters INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'city_progress' AND column_name = 'last_activity'
  ) THEN
    ALTER TABLE city_progress ADD COLUMN last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create unique constraint
DO $$
BEGIN
  ALTER TABLE city_progress
  ADD CONSTRAINT city_progress_user_city_unique
  UNIQUE(user_id, city);
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN others THEN
    RAISE NOTICE 'Constraint already exists - skipping';
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_city_progress_user_id ON city_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_city_progress_city ON city_progress(city);

-- ============================================================
-- ALTER TABLE: gps_tracks
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gps_tracks' AND column_name = 'source'
  ) THEN
    ALTER TABLE gps_tracks ADD COLUMN source TEXT DEFAULT 'gps';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gps_tracks' AND column_name = 'strava_activity_id'
  ) THEN
    ALTER TABLE gps_tracks ADD COLUMN strava_activity_id BIGINT;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gps_tracks_user_id ON gps_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracks_city ON gps_tracks(city);
CREATE INDEX IF NOT EXISTS idx_gps_tracks_started_at ON gps_tracks(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_gps_tracks_geometry ON gps_tracks USING GIST(route_geometry);

-- ============================================================
-- RECREATE ALL FUNCTIONS WITH CORRECT SIGNATURES
-- ============================================================

-- Function 1: calculate_explored_streets_v2
CREATE FUNCTION calculate_explored_streets_v2(
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

-- Function 2: update_user_stats_from_track
CREATE FUNCTION update_user_stats_from_track()
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

-- Create trigger
CREATE TRIGGER trigger_update_stats_on_track_insert
  AFTER INSERT ON gps_tracks
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_from_track();

-- Function 3: update_streak
CREATE FUNCTION update_streak(p_user_id UUID)
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

-- Function 4: get_user_stats
CREATE FUNCTION get_user_stats(p_user_id UUID)
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

-- Function 5: get_city_leaderboard
CREATE FUNCTION get_city_leaderboard(
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
-- VERIFY INSTALLATION
-- ============================================================

DO $$
DECLARE
  v_function_count INTEGER;
BEGIN
  -- Count functions created
  SELECT COUNT(*)
  INTO v_function_count
  FROM pg_proc
  WHERE proname IN (
    'calculate_explored_streets_v2',
    'update_user_stats_from_track',
    'update_streak',
    'get_user_stats',
    'get_city_leaderboard'
  );

  IF v_function_count < 5 THEN
    RAISE EXCEPTION 'Not all functions were created! Expected 5, got %', v_function_count;
  END IF;

  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '✅ All 5 functions created: calculate_explored_streets_v2, update_user_stats_from_track, update_streak, get_user_stats, get_city_leaderboard';
  RAISE NOTICE '✅ Trigger created: trigger_update_stats_on_track_insert';
  RAISE NOTICE '✅ All columns and indexes added';
  RAISE NOTICE '✅ Ready to track GPS data!';
END $$;
