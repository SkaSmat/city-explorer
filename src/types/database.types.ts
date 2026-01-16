/**
 * Database Types
 * Re-export of Supabase generated types for easier imports
 *
 * Usage:
 * import type { UserProfile, GPSTrack, GPSTrackInsert } from '@/types/database.types'
 */

import type { Database } from '@/integrations/supabase/types'

// Table Row types (for SELECT queries)
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type GPSTrack = Database['public']['Tables']['gps_tracks']['Row']
export type ExploredStreet = Database['public']['Tables']['explored_streets']['Row']
export type ExploredStreetV2 = Database['public']['Tables']['explored_streets_v2']['Row']
export type CityProgress = Database['public']['Tables']['city_progress']['Row']
export type UserBadge = Database['public']['Tables']['user_badges']['Row']
export type Badge = Database['public']['Tables']['badges']['Row']
export type StravaConnection = Database['public']['Tables']['strava_connections']['Row']
export type OverpassCache = Database['public']['Tables']['overpass_cache']['Row']

// Insert types (for INSERT operations)
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type GPSTrackInsert = Database['public']['Tables']['gps_tracks']['Insert']
export type ExploredStreetInsert = Database['public']['Tables']['explored_streets']['Insert']
export type ExploredStreetV2Insert = Database['public']['Tables']['explored_streets_v2']['Insert']
export type CityProgressInsert = Database['public']['Tables']['city_progress']['Insert']
export type UserBadgeInsert = Database['public']['Tables']['user_badges']['Insert']
export type BadgeInsert = Database['public']['Tables']['badges']['Insert']
export type StravaConnectionInsert = Database['public']['Tables']['strava_connections']['Insert']
export type OverpassCacheInsert = Database['public']['Tables']['overpass_cache']['Insert']

// Update types (for UPDATE operations)
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']
export type GPSTrackUpdate = Database['public']['Tables']['gps_tracks']['Update']
export type ExploredStreetUpdate = Database['public']['Tables']['explored_streets']['Update']
export type ExploredStreetV2Update = Database['public']['Tables']['explored_streets_v2']['Update']
export type CityProgressUpdate = Database['public']['Tables']['city_progress']['Update']
export type UserBadgeUpdate = Database['public']['Tables']['user_badges']['Update']
export type BadgeUpdate = Database['public']['Tables']['badges']['Update']
export type StravaConnectionUpdate = Database['public']['Tables']['strava_connections']['Update']
export type OverpassCacheUpdate = Database['public']['Tables']['overpass_cache']['Update']

// RPC Function types
export type CalculateExploredStreetsV2Args = Database['public']['Functions']['calculate_explored_streets_v2']['Args']
export type UpdateStreakArgs = Database['public']['Functions']['update_streak']['Args']
export type GetUserStatsArgs = Database['public']['Functions']['get_user_stats']['Args']
export type GetUserStatsReturn = Database['public']['Functions']['get_user_stats']['Returns'][number]
export type GetCityLeaderboardArgs = Database['public']['Functions']['get_city_leaderboard']['Args']
export type GetCityLeaderboardReturn = Database['public']['Functions']['get_city_leaderboard']['Returns'][number]
