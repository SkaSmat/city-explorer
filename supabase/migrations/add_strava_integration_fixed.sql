-- Migration: Add Strava Integration (Fixed)
-- Description: Add tables for Strava OAuth connections and update gps_tracks table
-- This version handles cases where some elements already exist

-- Create strava_connections table
CREATE TABLE IF NOT EXISTS strava_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  strava_athlete_id BIGINT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  athlete_username TEXT,
  athlete_firstname TEXT,
  athlete_lastname TEXT,
  athlete_profile TEXT,
  athlete_profile_medium TEXT,
  athlete_profile_large TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(strava_athlete_id)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_strava_connections_user_id ON strava_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_strava_connections_strava_athlete_id ON strava_connections(strava_athlete_id);

-- Add Strava-related columns to gps_tracks table
ALTER TABLE gps_tracks
ADD COLUMN IF NOT EXISTS strava_activity_id BIGINT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Add index for Strava activity ID lookups
CREATE INDEX IF NOT EXISTS idx_gps_tracks_strava_activity_id ON gps_tracks(strava_activity_id);

-- Drop and recreate unique constraint to prevent duplicate imports
-- (handles case where constraint already exists from previous attempt)
DO $$
BEGIN
  -- Try to drop the constraint if it exists
  ALTER TABLE gps_tracks DROP CONSTRAINT IF EXISTS unique_strava_activity_per_user;

  -- Create the constraint
  ALTER TABLE gps_tracks
  ADD CONSTRAINT unique_strava_activity_per_user
  UNIQUE (user_id, strava_activity_id);
EXCEPTION
  WHEN others THEN
    -- If any error occurs, just continue
    RAISE NOTICE 'Constraint handling completed with notice: %', SQLERRM;
END $$;

-- Enable Row Level Security (RLS) on strava_connections
ALTER TABLE strava_connections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Users can view own strava connection" ON strava_connections;
CREATE POLICY "Users can view own strava connection"
  ON strava_connections
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own strava connection" ON strava_connections;
CREATE POLICY "Users can insert own strava connection"
  ON strava_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own strava connection" ON strava_connections;
CREATE POLICY "Users can update own strava connection"
  ON strava_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own strava connection" ON strava_connections;
CREATE POLICY "Users can delete own strava connection"
  ON strava_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments to document the table
COMMENT ON TABLE strava_connections IS 'Stores Strava OAuth connections for users';
COMMENT ON COLUMN gps_tracks.strava_activity_id IS 'Strava activity ID if imported from Strava';
COMMENT ON COLUMN gps_tracks.source IS 'Source of the track: manual, strava, or other integrations';
