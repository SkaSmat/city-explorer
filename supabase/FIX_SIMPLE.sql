-- =============================================
-- FIX SIMPLE: Recrée explored_streets from scratch
-- =============================================
-- ATTENTION: Cette approche DROP et recrée la table
-- Si vous avez des données dans explored_streets, elles seront PERDUES
-- =============================================

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================
-- 1. DROP et RECREER explored_streets
-- =============================================

-- Drop la table (avec CASCADE pour supprimer les dépendances)
DROP TABLE IF EXISTS explored_streets CASCADE;

-- Recrée avec le BON nom de colonne
CREATE TABLE explored_streets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  street_osm_id BIGINT NOT NULL,
  street_name TEXT,
  first_explored_at TIMESTAMPTZ DEFAULT NOW(),
  track_id UUID REFERENCES gps_tracks(id) ON DELETE SET NULL,
  UNIQUE(user_id, street_osm_id)
);

CREATE INDEX idx_explored_streets_user_id ON explored_streets(user_id);
CREATE INDEX idx_explored_streets_city ON explored_streets(city);
CREATE INDEX idx_explored_streets_street_osm_id ON explored_streets(street_osm_id);

-- =============================================
-- 2. FIX user_profiles - Ajouter colonnes manquantes
-- =============================================

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =============================================
-- 3. FIX city_progress - Ajouter total_distance_meters
-- =============================================

ALTER TABLE city_progress ADD COLUMN IF NOT EXISTS total_distance_meters INTEGER DEFAULT 0;

-- =============================================
-- 4. CREER overpass_cache si manquante
-- =============================================

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
-- 5. RLS POLICIES pour explored_streets
-- =============================================

ALTER TABLE explored_streets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own explored streets" ON explored_streets;
CREATE POLICY "Users can view own explored streets"
  ON explored_streets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own explored streets" ON explored_streets;
CREATE POLICY "Users can insert own explored streets"
  ON explored_streets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 6. RLS POLICIES pour overpass_cache
-- =============================================

ALTER TABLE overpass_cache ENABLE ROW LEVEL SECURITY;

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
-- 7. RPC FUNCTION - calculate_explored_streets_v2
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
  SET total_streets_explored = (
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

  RETURN QUERY SELECT v_new_streets_count, v_total_streets_count;
END;
$$;

-- =============================================
-- 8. BADGES (insert si manquants)
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
-- 9. VERIFICATION
-- =============================================

SELECT '✅ VERIFICATION' as status;

SELECT 'explored_streets columns:' as info;
SELECT column_name FROM information_schema.columns WHERE table_name = 'explored_streets' ORDER BY ordinal_position;

SELECT 'user_profiles has bio?' as info, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'bio') as result;

SELECT 'city_progress has total_distance_meters?' as info, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'city_progress' AND column_name = 'total_distance_meters') as result;

SELECT 'overpass_cache exists?' as info, EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'overpass_cache') as result;

SELECT 'Badge count:' as info, COUNT(*) as count FROM badges;

-- =============================================
-- FIN
-- =============================================
