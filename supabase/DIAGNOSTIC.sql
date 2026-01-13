-- =============================================
-- DIAGNOSTIC: Vérifier l'état actuel de la base
-- =============================================
-- Exécutez ce script pour voir exactement ce qui existe
-- =============================================

-- 1. Quelles tables existent?
SELECT '=== TABLES EXISTANTES ===' as section;
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Quelles colonnes dans explored_streets?
SELECT '=== COLONNES DE explored_streets ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'explored_streets'
ORDER BY ordinal_position;

-- 3. Quelles colonnes dans user_profiles?
SELECT '=== COLONNES DE user_profiles ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 4. Quelles colonnes dans city_progress?
SELECT '=== COLONNES DE city_progress ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'city_progress'
ORDER BY ordinal_position;

-- 5. Contraintes sur explored_streets
SELECT '=== CONTRAINTES explored_streets ===' as section;
SELECT conname as constraint_name, contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'explored_streets'::regclass;

-- =============================================
-- COPIEZ ET ENVOYEZ MOI LES RÉSULTATS
-- =============================================
