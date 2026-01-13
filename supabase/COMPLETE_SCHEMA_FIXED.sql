-- =============================================
-- City Explorer - FIXED Complete Schema
-- =============================================
-- Date: 12 Janvier 2026
-- Fixed: Migration runs BEFORE table creation to avoid conflicts
-- =============================================

-- Enable PostGIS extension (required for geometry types)
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================
-- STEP 1: MIGRATIONS FIRST (before creating tables)
-- =============================================

-- Rename osm_id to street_osm_id in explored_streets if needed
DO $$
BEGIN
  -- Check if table exists AND has osm_id column
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'explored_streets'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'explored_streets' AND column_name = 'osm_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'explored_streets' AND column_name = 'street_osm_id'
  ) THEN
    -- Drop constraints that depend on osm_id
    ALTER TABLE explored_streets DROP CONSTRAINT IF EXISTS explored_streets_user_id_osm_id_key;

    -- Rename the column
    ALTER TABLE explored_streets RENAME COLUMN osm_id TO street_osm_id;

    -- Recreate unique constraint with new column name
    ALTER TABLE explored_streets ADD CONSTRAINT explored_streets_user_id_street_osm_id_key UNIQUE (user_id, street_osm_id);

    RAISE NOTICE '✅ Renamed osm_id to street_osm_id in explored_streets';
  ELSE
    RAISE NOTICE 'ℹ️ explored_streets already has street_osm_id or table does not exist yet';
  END IF;
END $$;

-- Add missing columns to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN bio TEXT DEFAULT '';
    RAISE NOTICE '✅ Added bio to user_profiles';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;
    RAISE NOTICE '✅ Added avatar_url to user_profiles';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ Added updated_at to user_profiles';
  END IF;
END $$;

-- Add total_distance_meters to city_progress
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'city_progress' AND column_name = 'total_distance_meters'
  ) THEN
    ALTER TABLE city_progress ADD COLUMN total_distance_meters INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Added total_distance_meters to city_progress';
  END IF;
END $$;

-- =============================================
-- STEP 2: CREATE TABLES (if they don't exist)
-- =============================================

-- Table: user_profiles
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

-- Table: explored_streets
CREATE TABLE IF NOT EXISTS explored_streets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  street_osm_id BIGINT NOT NULL,
  street_name TEXT,
  first_explored_at TIMESTAMPTZ DEFAULT NOW(),
  track_id UUID REFERENCES gps_tracks(id) ON DELETE SET NULL
);

-- Table: city_progress
CREATE TABLE IF NOT EXISTS city_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  streets_explored INTEGER DEFAULT 0,
  total_distance_meters INTEGER DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  first_visit TIMESTAMPTZ DEFAULT NOW(),
  total_sessions INTEGER DEFAULT 0,
  favorite BOOLEAN DEFAULT FALSE
);

-- Table: badges
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
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: overpass_cache
CREATE TABLE IF NOT EXISTS overpass_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL UNIQUE,
  total_streets INTEGER NOT NULL,
  bbox TEXT,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- STEP 3: CREATE INDEXES AND CONSTRAINTS
-- =============================================

-- Indexes for gps_tracks
CREATE INDEX IF NOT EXISTS idx_gps_tracks_user_id ON gps_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracks_city ON gps_tracks(city);
CREATE INDEX IF NOT EXISTS idx_gps_tracks_started_at ON gps_tracks(started_at);

-- Unique constraint and indexes for explored_streets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'explored_streets_user_id_street_osm_id_key'
  ) THEN
    ALTER TABLE explored_streets ADD CONSTRAINT explored_streets_user_id_street_osm_id_key UNIQUE (user_id, street_osm_id);
    RAISE NOTICE '✅ Added unique constraint on explored_streets';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_explored_streets_user_id ON explored_streets(user_id);
CREATE INDEX IF NOT EXISTS idx_explored_streets_city ON explored_streets(city);
CREATE INDEX IF NOT EXISTS idx_explored_streets_street_osm_id ON explored_streets(street_osm_id);

-- Unique constraint and indexes for city_progress
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'city_progress_user_id_city_key'
  ) THEN
    ALTER TABLE city_progress ADD CONSTRAINT city_progress_user_id_city_key UNIQUE (user_id, city);
    RAISE NOTICE '✅ Added unique constraint on city_progress';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_city_progress_user_id ON city_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_city_progress_last_activity ON city_progress(last_activity);

-- Unique constraint and indexes for user_badges
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_badges_user_id_badge_id_key'
  ) THEN
    ALTER TABLE user_badges ADD CONSTRAINT user_badges_user_id_badge_id_key UNIQUE (user_id, badge_id);
    RAISE NOTICE '✅ Added unique constraint on user_badges';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- Indexes for overpass_cache
CREATE INDEX IF NOT EXISTS idx_overpass_cache_city ON overpass_cache(city);
CREATE INDEX IF NOT EXISTS idx_overpass_cache_cached_at ON overpass_cache(cached_at);

-- =============================================
-- STEP 4: ROW LEVEL SECURITY (RLS) POLICIES
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

-- Policies for overpass_cache (public read/write)
DROP POLICY IF EXISTS "Anyone can view cache" ON overpass_cache;
CREATE POLICY "Anyone can view cache"
  ON overpass_cache FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert cache" ON overpass_cache;
CREATE POLICY "Anyone can insert cache"
  ON overpass_cache FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update cache" ON overpass_cache;
CREATE POLICY "Anyone can update cache"
  ON overpass_cache FOR UPDATE
  USING (true);

-- =============================================
-- STEP 5: RPC FUNCTION
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
-- STEP 6: SEED DATA
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
-- STEP 7: VERIFICATION
-- =============================================

-- Verify tables
SELECT
  '✅ Tables' as check_name,
  COUNT(*) as found,
  '7 expected' as expected
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'gps_tracks', 'explored_streets', 'city_progress', 'badges', 'user_badges', 'overpass_cache');

-- Verify badges
SELECT
  '✅ Badges' as check_name,
  COUNT(*) as found,
  '8 expected' as expected
FROM badges;

-- Verify critical columns
SELECT
  '✅ Columns Check' as check_name,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'bio')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'city_progress' AND column_name = 'total_distance_meters')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'explored_streets' AND column_name = 'street_osm_id')
    THEN '✅ ALL GOOD'
    ELSE '❌ MISSING COLUMNS'
  END as status;

-- =============================================
-- END
-- =============================================
