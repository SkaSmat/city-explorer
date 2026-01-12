-- =============================================
-- Script de Vérification Rapide
-- =============================================
-- Exécutez ce script APRÈS avoir exécuté COMPLETE_SCHEMA.sql
-- pour vérifier que tout est bien configuré
-- =============================================

-- 1. Vérifier que toutes les tables existent
SELECT
  '✅ Tables existantes' as check_name,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) = 7 THEN '✅ OK'
    ELSE '❌ MANQUANT: ' || (7 - COUNT(*))::text || ' table(s)'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'gps_tracks', 'explored_streets', 'city_progress', 'badges', 'user_badges', 'overpass_cache');

-- 2. Vérifier les colonnes de user_profiles
SELECT
  '✅ user_profiles columns' as check_name,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) >= 8 THEN '✅ OK'
    ELSE '❌ Colonnes manquantes'
  END as status
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN ('id', 'username', 'total_distance_meters', 'total_streets_explored', 'bio', 'avatar_url', 'created_at', 'updated_at');

-- 3. Vérifier que city_progress a total_distance_meters
SELECT
  '✅ city_progress.total_distance_meters' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'city_progress' AND column_name = 'total_distance_meters'
    ) THEN '✅ OK'
    ELSE '❌ MANQUANT'
  END as status;

-- 4. Vérifier que explored_streets a street_osm_id
SELECT
  '✅ explored_streets.street_osm_id' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'explored_streets' AND column_name = 'street_osm_id'
    ) THEN '✅ OK'
    ELSE '❌ MANQUANT (probablement nommé osm_id)'
  END as status;

-- 5. Vérifier que la table overpass_cache existe
SELECT
  '✅ overpass_cache table' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = 'overpass_cache'
    ) THEN '✅ OK'
    ELSE '❌ MANQUANT'
  END as status;

-- 6. Vérifier le nombre de badges
SELECT
  '✅ Badges count' as check_name,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) >= 8 THEN '✅ OK (' || COUNT(*)::text || ' badges)'
    ELSE '❌ Seulement ' || COUNT(*)::text || ' badges (attendu: 8)'
  END as status
FROM badges;

-- 7. Vérifier que RLS est activé
SELECT
  '✅ RLS enabled' as check_name,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) = 7 THEN '✅ OK'
    ELSE '❌ RLS non activé sur ' || (7 - COUNT(*))::text || ' table(s)'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'gps_tracks', 'explored_streets', 'city_progress', 'badges', 'user_badges', 'overpass_cache')
  AND rowsecurity = true;

-- 8. Vérifier que la fonction RPC existe
SELECT
  '✅ RPC function' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'calculate_explored_streets_v2'
    ) THEN '✅ OK'
    ELSE '❌ MANQUANT'
  END as status;

-- 9. Liste détaillée de toutes les colonnes de toutes les tables
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('user_profiles', 'gps_tracks', 'explored_streets', 'city_progress', 'badges', 'user_badges', 'overpass_cache')
ORDER BY table_name, ordinal_position;

-- 10. Résumé final
SELECT
  '==================================' as summary,
  'RÉSUMÉ DE LA VÉRIFICATION' as title;

SELECT
  CASE
    WHEN (
      SELECT COUNT(*) FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('user_profiles', 'gps_tracks', 'explored_streets', 'city_progress', 'badges', 'user_badges', 'overpass_cache')
    ) = 7
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'city_progress' AND column_name = 'total_distance_meters'
    )
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'explored_streets' AND column_name = 'street_osm_id'
    )
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'user_profiles' AND column_name = 'bio'
    )
    AND (SELECT COUNT(*) FROM badges) >= 8
    THEN '✅✅✅ TOUT EST BON! Vous pouvez utiliser l''application ✅✅✅'
    ELSE '❌ IL Y A ENCORE DES PROBLÈMES - Voir les détails ci-dessus'
  END as final_status;
