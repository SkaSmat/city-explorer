-- =============================================
-- Migration: Add total_distance_meters to city_progress
-- =============================================
-- Date: 12 Janvier 2026
-- Issue: column city_progress.total_distance_meters does not exist
-- Solution: Add the missing column if it doesn't exist

-- Add total_distance_meters column to city_progress table
DO $$
BEGIN
  -- Check if column exists, if not, add it
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'city_progress'
      AND column_name = 'total_distance_meters'
  ) THEN
    ALTER TABLE city_progress
    ADD COLUMN total_distance_meters INTEGER DEFAULT 0;

    RAISE NOTICE 'Column total_distance_meters added to city_progress';
  ELSE
    RAISE NOTICE 'Column total_distance_meters already exists in city_progress';
  END IF;
END $$;

-- Populate existing rows with calculated distances
-- This updates any existing city_progress records with the correct distance
UPDATE city_progress cp
SET total_distance_meters = (
  SELECT COALESCE(SUM(distance_meters), 0)
  FROM gps_tracks gt
  WHERE gt.user_id = cp.user_id
    AND gt.city = cp.city
)
WHERE total_distance_meters IS NULL OR total_distance_meters = 0;

-- Verification query
SELECT
  table_name,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'city_progress'
  AND column_name = 'total_distance_meters';
