-- ============================================================
-- DIAGNOSTIC COMPLET - À EXÉCUTER EN PREMIER
-- Copiez les résultats et envoyez-les moi
-- ============================================================

-- 1. VÉRIFIER LES TABLES EXISTANTES
SELECT
  'TABLES' as type,
  tablename as name,
  'exists' as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. VÉRIFIER LES COLONNES DE explored_streets
SELECT
  'explored_streets COLUMNS' as type,
  column_name as name,
  data_type as status
FROM information_schema.columns
WHERE table_name = 'explored_streets'
ORDER BY ordinal_position;

-- 3. VÉRIFIER LES COLONNES DE user_profiles
SELECT
  'user_profiles COLUMNS' as type,
  column_name as name,
  data_type as status
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 4. VÉRIFIER LES COLONNES DE gps_tracks
SELECT
  'gps_tracks COLUMNS' as type,
  column_name as name,
  data_type as status
FROM information_schema.columns
WHERE table_name = 'gps_tracks'
ORDER BY ordinal_position;

-- 5. VÉRIFIER LES COLONNES DE city_progress
SELECT
  'city_progress COLUMNS' as type,
  column_name as name,
  data_type as status
FROM information_schema.columns
WHERE table_name = 'city_progress'
ORDER BY ordinal_position;

-- 6. VÉRIFIER LES FONCTIONS EXISTANTES (avec leurs signatures)
SELECT
  'FUNCTIONS' as type,
  p.proname as name,
  pg_get_function_identity_arguments(p.oid) as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'calculate_explored_streets_v2',
    'calculate_explored_streets',
    'update_user_stats_from_track',
    'update_streak',
    'get_user_stats',
    'get_city_leaderboard'
  )
ORDER BY p.proname;

-- 7. VÉRIFIER LES TRIGGERS
SELECT
  'TRIGGERS' as type,
  trigger_name as name,
  event_object_table as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- 8. VÉRIFIER RLS (Row Level Security)
SELECT
  'RLS' as type,
  tablename as name,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 9. VÉRIFIER LES POLICIES RLS
SELECT
  'RLS POLICIES' as type,
  tablename as name,
  policyname as status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 10. VÉRIFIER PostGIS
SELECT
  'EXTENSIONS' as type,
  extname as name,
  extversion as status
FROM pg_extension
WHERE extname IN ('postgis', 'postgis_topology')
ORDER BY extname;
