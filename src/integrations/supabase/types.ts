export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
          public_profile: boolean
          total_distance_meters: number
          total_streets_explored: number
          current_streak: number
          last_activity_date: string | null
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
          public_profile?: boolean
          total_distance_meters?: number
          total_streets_explored?: number
          current_streak?: number
          last_activity_date?: string | null
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
          public_profile?: boolean
          total_distance_meters?: number
          total_streets_explored?: number
          current_streak?: number
          last_activity_date?: string | null
        }
      }
      gps_tracks: {
        Row: {
          id: string
          user_id: string
          city: string
          route_geometry: string // PostGIS geometry stored as WKT
          distance_meters: number
          duration_seconds: number
          started_at: string
          ended_at: string
          created_at: string
          source: string // 'gps' | 'strava' | 'manual'
          strava_activity_id: number | null
        }
        Insert: {
          id?: string
          user_id: string
          city: string
          route_geometry: string
          distance_meters: number
          duration_seconds: number
          started_at: string
          ended_at: string
          created_at?: string
          source?: string
          strava_activity_id?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          city?: string
          route_geometry?: string
          distance_meters?: number
          duration_seconds?: number
          started_at?: string
          ended_at?: string
          created_at?: string
          source?: string
          strava_activity_id?: number | null
        }
      }
      explored_streets: {
        Row: {
          id: string
          user_id: string
          city: string
          osm_id: number
          street_name: string | null
          street_geometry: string | null // PostGIS geometry
          first_explored_at: string
          times_explored: number
        }
        Insert: {
          id?: string
          user_id: string
          city: string
          osm_id: number
          street_name?: string | null
          street_geometry?: string | null
          first_explored_at?: string
          times_explored?: number
        }
        Update: {
          id?: string
          user_id?: string
          city?: string
          osm_id?: number
          street_name?: string | null
          street_geometry?: string | null
          first_explored_at?: string
          times_explored?: number
        }
      }
      explored_streets_v2: {
        Row: {
          id: string
          user_id: string
          city: string
          street_osm_id: number
          street_name: string | null
          first_explored_at: string
          times_explored: number
        }
        Insert: {
          id?: string
          user_id: string
          city: string
          street_osm_id: number
          street_name?: string | null
          first_explored_at?: string
          times_explored?: number
        }
        Update: {
          id?: string
          user_id?: string
          city?: string
          street_osm_id?: number
          street_name?: string | null
          first_explored_at?: string
          times_explored?: number
        }
      }
      city_progress: {
        Row: {
          id: string
          user_id: string
          city: string
          streets_explored: number
          total_distance_meters: number
          last_activity: string
        }
        Insert: {
          id?: string
          user_id: string
          city: string
          streets_explored?: number
          total_distance_meters?: number
          last_activity?: string
        }
        Update: {
          id?: string
          user_id?: string
          city?: string
          streets_explored?: number
          total_distance_meters?: number
          last_activity?: string
        }
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_id: string
          unlocked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_id?: string
          unlocked_at?: string
        }
      }
      badges: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          condition_type: string
          condition_value: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          condition_type: string
          condition_value: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          condition_type?: string
          condition_value?: number
          created_at?: string
        }
      }
      strava_connections: {
        Row: {
          id: string
          user_id: string
          strava_athlete_id: number
          access_token: string
          refresh_token: string
          token_expires_at: string | null
          athlete_username: string | null
          athlete_firstname: string | null
          athlete_lastname: string | null
          athlete_profile: string | null
          athlete_profile_medium: string | null
          athlete_profile_large: string | null
          athlete_data: Json | null
          expires_at: string | null
          connected_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          strava_athlete_id: number
          access_token: string
          refresh_token: string
          token_expires_at?: string | null
          athlete_username?: string | null
          athlete_firstname?: string | null
          athlete_lastname?: string | null
          athlete_profile?: string | null
          athlete_profile_medium?: string | null
          athlete_profile_large?: string | null
          athlete_data?: Json | null
          expires_at?: string | null
          connected_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          strava_athlete_id?: number
          access_token?: string
          refresh_token?: string
          token_expires_at?: string | null
          athlete_username?: string | null
          athlete_firstname?: string | null
          athlete_lastname?: string | null
          athlete_profile?: string | null
          athlete_profile_medium?: string | null
          athlete_profile_large?: string | null
          athlete_data?: Json | null
          expires_at?: string | null
          connected_at?: string
          updated_at?: string
        }
      }
      overpass_cache: {
        Row: {
          id: string
          city: string
          total_streets: number
          cached_at: string
          bbox: Json | null
        }
        Insert: {
          id?: string
          city: string
          total_streets: number
          cached_at?: string
          bbox?: Json | null
        }
        Update: {
          id?: string
          city?: string
          total_streets?: number
          cached_at?: string
          bbox?: Json | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_explored_streets_v2: {
        Args: {
          p_track_id: string
          p_user_id: string
          p_explored_osm_ids: number[]
          p_city: string
        }
        Returns: number
      }
      update_streak: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
      get_user_stats: {
        Args: {
          p_user_id: string
        }
        Returns: {
          total_distance: number
          total_streets: number
          total_cities: number
          current_streak: number
        }[]
      }
      get_city_leaderboard: {
        Args: {
          p_city: string
          p_limit?: number
        }
        Returns: {
          user_id: string
          username: string
          avatar_url: string | null
          streets_explored: number
          total_distance_meters: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier imports
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
