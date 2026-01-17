import { supabase } from '@/integrations/supabase/client';
import { overpassService } from './OverpassService';
import { streetMatcher, type GPSPoint } from './StreetMatcher';
import { toast } from 'sonner';
import { logger } from './Logger';
// Types are managed externally - using 'as any' for Supabase queries

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  start_date: string;
  start_date_local: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_latlng: [number, number];
}

interface StravaStream {
  latlng: {
    data: [number, number][];
  };
  time: {
    data: number[];
  };
  altitude?: {
    data: number[];
  };
}

interface StravaAthlete {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  profile: string;
}

class StravaService {
  private readonly clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
  private readonly redirectUri = `${window.location.origin}/auth/strava/callback`;
  private readonly supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  /**
   * Get Strava OAuth authorization URL
   */
  getAuthUrl(): string {
    const scopes = 'read,activity:read_all';
    return `https://www.strava.com/oauth/authorize?client_id=${this.clientId}&response_type=code&redirect_uri=${encodeURIComponent(this.redirectUri)}&scope=${scopes}&approval_prompt=force`;
  }

  /**
   * Exchange authorization code for access token
   * SECURITY: Uses server-side Edge Function to protect client secret
   * Edge Function: supabase/functions/strava-exchange
   */
  async exchangeToken(code: string): Promise<{ access_token: string; refresh_token: string; athlete: StravaAthlete }> {
    try {
      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User must be authenticated to connect Strava');
      }

      // Call Edge Function (client secret is secure on server)
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/strava-exchange`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to exchange Strava token: ${error}`);
      }

      const data = await response.json();

      // Edge Function returns athlete data but saves tokens securely in DB
      // We need to fetch the connection to get tokens for API calls
      const { data: connection, error: connError } = await (supabase as any)
        .from('strava_connections')
        .select('access_token, refresh_token')
        .eq('user_id', session.user.id)
        .single();

      if (connError || !connection) {
        throw new Error('Failed to retrieve Strava connection');
      }

      return {
        access_token: connection.access_token as string,
        refresh_token: connection.refresh_token as string,
        athlete: data.athlete,
      };
    } catch (error) {
      logger.error('Strava token exchange error:', error);
      throw error;
    }
  }

  /**
   * Save Strava connection to database
   */
  async saveConnection(userId: string, accessToken: string, refreshToken: string, athlete: StravaAthlete): Promise<void> {
    try {
      const connectionData = {
        user_id: userId,
        strava_athlete_id: athlete.id,
        access_token: accessToken,
        refresh_token: refreshToken,
        athlete_username: athlete.username,
        athlete_firstname: athlete.firstname,
        athlete_lastname: athlete.lastname,
        athlete_profile: athlete.profile,
        expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours default
        athlete_data: {
          id: athlete.id,
          username: athlete.username,
          firstname: athlete.firstname,
          lastname: athlete.lastname,
          profile: athlete.profile,
        },
      };

      const { error } = await (supabase as any)
        .from('strava_connections')
        .upsert(connectionData);

      if (error) throw error;
    } catch (error) {
      logger.error('Error saving Strava connection:', error);
      throw error;
    }
  }

  /**
   * Get user's Strava activities
   */
  async getActivities(accessToken: string, perPage = 200): Promise<StravaActivity[]> {
    try {
      const response = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch Strava activities');
      }

      return await response.json();
    } catch (error) {
      logger.error('Error fetching Strava activities:', error);
      throw error;
    }
  }

  /**
   * Get detailed activity stream (GPS points)
   */
  async getActivityStream(activityId: number, accessToken: string): Promise<StravaStream> {
    try {
      const response = await fetch(
        `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=latlng,time,altitude&key_by_type=true`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch activity stream');
      }

      return await response.json();
    } catch (error) {
      logger.error('Error fetching activity stream:', error);
      throw error;
    }
  }

  /**
   * Import activities with rate limiting
   */
  async importActivities(
    userId: string,
    accessToken: string,
    activities: StravaActivity[],
    onProgress?: (current: number, total: number) => void
  ): Promise<{ imported: number; skipped: number; errors: number }> {
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < activities.length; i++) {
      try {
        // Update progress
        onProgress?.(i + 1, activities.length);

        // Check if already imported
        const { data: existing } = await (supabase as any)
          .from('gps_tracks')
          .select('id')
          .eq('strava_activity_id', activities[i].id)
          .maybeSingle();

        if (existing) {
          logger.info(`Skipping already imported activity ${activities[i].id}`);
          skipped++;
          continue;
        }

        // Get detailed stream
        const stream = await this.getActivityStream(activities[i].id, accessToken);

        if (!stream.latlng?.data || stream.latlng.data.length === 0) {
          logger.info(`Skipping activity ${activities[i].id} (no GPS data)`);
          skipped++;
          continue;
        }

        // Process and save
        await this.processAndSaveActivity(userId, activities[i], stream);
        imported++;

        // Rate limit: pause every 50 requests (30 seconds)
        if ((i + 1) % 50 === 0 && i < activities.length - 1) {
          logger.info('Rate limit pause (30s)...');
          await new Promise(resolve => setTimeout(resolve, 30000));
        } else {
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        logger.error(`Error importing activity ${activities[i].id}:`, error);
        errors++;
      }
    }

    return { imported, skipped, errors };
  }

  /**
   * Process and save a single activity
   */
  private async processAndSaveActivity(
    userId: string,
    activity: StravaActivity,
    stream: StravaStream
  ): Promise<void> {
    try {
      // Convert Strava stream to GPS points
      const gpsPoints: GPSPoint[] = stream.latlng.data.map((point, i) => ({
        lat: point[0],
        lng: point[1],
        timestamp: new Date(activity.start_date).getTime() + stream.time.data[i] * 1000,
        altitude: stream.altitude?.data[i],
      }));

      // Detect city from first point
      const city = await this.detectCity(gpsPoints[0].lat, gpsPoints[0].lng);

      // Load streets around the route (use larger radius for long activities)
      const radius = Math.max(2, Math.min(10, activity.distance / 2000)); // 2-10km based on activity length
      const streets = await overpassService.getStreetsAroundPosition(
        gpsPoints[0].lat,
        gpsPoints[0].lng,
        radius
      );

      // Match streets
      const exploredStreetIds = streetMatcher.findIntersectingStreets(gpsPoints, streets);

      // Simplify GPS points for storage
      const simplifiedPoints = streetMatcher.simplifyTrack(gpsPoints, 50);

      // Convert to PostGIS LineString
      const coordsWKT = simplifiedPoints.map(p => `${p.lng} ${p.lat}`).join(', ');
      const geometry = `SRID=4326;LINESTRING(${coordsWKT})`;

      // Save track to database
      const trackData = {
        user_id: userId,
        city,
        route_geometry: geometry,
        distance_meters: Math.round(activity.distance),
        duration_seconds: activity.moving_time,
        started_at: activity.start_date,
        ended_at: new Date(new Date(activity.start_date).getTime() + activity.moving_time * 1000).toISOString(),
        strava_activity_id: activity.id,
        source: 'strava',
      };

      const { data: track, error: trackError } = await (supabase as any)
        .from('gps_tracks')
        .insert(trackData)
        .select()
        .single();

      if (trackError) throw trackError;

      // Save explored streets
      if (exploredStreetIds.length > 0 && track) {
        const { error } = await (supabase as any).rpc('calculate_explored_streets_v2', {
          p_track_id: (track as any).id,
          p_user_id: userId,
          p_explored_osm_ids: Array.from(exploredStreetIds),
          p_city: city,
        });

        if (error) throw error;
      }

      logger.info(`Imported activity: ${activity.name} (${exploredStreetIds.length} streets)`);
    } catch (error) {
      logger.error('Error processing activity:', error);
      throw error;
    }
  }

  /**
   * Detect city from coordinates
   */
  private async detectCity(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'CityExplorer/1.0',
          },
        }
      );
      const data = await response.json();

      return (
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.municipality ||
        'Unknown City'
      );
    } catch (error) {
      logger.error('City detection error:', error);
      return 'Unknown City';
    }
  }

  /**
   * Disconnect Strava account
   */
  async disconnect(userId: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from('strava_connections')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Compte Strava déconnecté');
    } catch (error) {
      logger.error('Error disconnecting Strava:', error);
      toast.error('Erreur lors de la déconnexion');
      throw error;
    }
  }
}

export const stravaService = new StravaService();
