import { overpassService, type Street } from './OverpassService';
import { streetMatcher, type GPSPoint } from './StreetMatcher';
import { supabase } from '@/integrations/supabase/client';
import { badgeChecker } from './BadgeChecker';
import { toast } from 'sonner';

interface TrackingSession {
  sessionId: string;
  userId: string;
  city: string;
  startTime: number;
  gpsPoints: GPSPoint[];
  exploredStreetIds: Set<number>;
  streets: Street[];
  isActive: boolean;
  batteryOptimized: boolean;
}

class GPSTracker {
  private session: TrackingSession | null = null;
  private watchId: number | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  // Check if tracking is active
  isTrackingActive(): boolean {
    return this.session?.isActive || false;
  }

  // Force reset session (useful for cleaning up stuck sessions)
  forceReset(): void {
    console.log('🔄 Force resetting GPS tracker...');

    // Stop GPS watch
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    // Clear interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Clear session
    this.session = null;

    console.log('✅ GPS tracker reset complete');
  }

  // Démarrer le tracking
  async startTracking(userId: string, city: string): Promise<void> {
    // Force reset if session exists but shouldn't be active
    if (this.session && !this.session.isActive) {
      console.warn('⚠️ Found inactive session, cleaning up...');
      this.forceReset();
    }

    if (this.session?.isActive) {
      throw new Error('Tracking already in progress');
    }

    console.log('🚀 Starting GPS tracking...');

    // Vérifier la permission géolocalisation
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    // Créer la session
    this.session = {
      sessionId: crypto.randomUUID(),
      userId,
      city,
      startTime: Date.now(),
      gpsPoints: [],
      exploredStreetIds: new Set(),
      streets: [],
      isActive: true,
      batteryOptimized: false,
    };

    // Obtenir la position initiale
    const initialPosition = await this.getCurrentPosition();
    
    console.log(`📍 Initial position: ${initialPosition.lat}, ${initialPosition.lng}`);

    // Charger les rues autour de la position
    try {
      this.session.streets = await overpassService.getStreetsAroundPosition(
        initialPosition.lat,
        initialPosition.lng,
        2 // 2km de rayon
      );
      console.log(`🗺️ Loaded ${this.session.streets.length} streets`);
    } catch (error) {
      console.error('Failed to load streets:', error);
      throw new Error('Failed to load map data. Please check your connection.');
    }

    // Ajouter le point initial
    this.session.gpsPoints.push(initialPosition);

    // Démarrer le watch GPS
    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handlePositionError(error),
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    // Update toutes les 10 secondes initialement
    this.updateInterval = setInterval(() => {
      this.processCurrentTrack();
      this.checkBatteryOptimization();
    }, 10000);

    console.log('✅ Tracking started');
  }

  // Arrêter le tracking
  async stopTracking(): Promise<{ distance: number; newStreets: number; duration: number }> {
    if (!this.session?.isActive) {
      throw new Error('No active tracking session');
    }

    console.log('🛑 Stopping GPS tracking...');

    // Arrêter le watch GPS
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Process final
    await this.processCurrentTrack();

    // Calculer les stats
    const distance = streetMatcher.calculateTotalDistance(this.session.gpsPoints);
    const duration = Date.now() - this.session.startTime;
    const newStreets = this.session.exploredStreetIds.size;

    // Sauvegarder dans Supabase
    await this.saveTrackToDatabase(distance, duration);

    const result = { distance, newStreets, duration };

    // Check and unlock badges (after stats are updated in DB)
    const userId = this.session.userId;

    // Small delay to ensure DB updates are committed
    setTimeout(async () => {
      try {
        await badgeChecker.checkAndUnlockBadges(userId);
      } catch (err) {
        console.error('Error checking badges:', err);
      }
    }, 1000);

    // Nettoyer la session
    this.session = null;

    console.log('✅ Tracking stopped:', result);
    return result;
  }

  // Obtenir l'état actuel du tracking
  getCurrentState() {
    if (!this.session) return null;

    const distance = streetMatcher.calculateTotalDistance(this.session.gpsPoints);
    const duration = Date.now() - this.session.startTime;
    const lastPoint = this.session.gpsPoints[this.session.gpsPoints.length - 1];

    return {
      distance,
      duration,
      streetsExplored: this.session.exploredStreetIds.size,
      pointsRecorded: this.session.gpsPoints.length,
      isActive: this.session.isActive,
      currentPosition: lastPoint ? { lat: lastPoint.lat, lng: lastPoint.lng } : null,
      streets: this.session.streets,
      exploredStreetIds: this.session.exploredStreetIds,
      gpsPoints: this.session.gpsPoints,
    };
  }

  // Handler position update
  private handlePositionUpdate(position: GeolocationPosition) {
    if (!this.session?.isActive) return;

    const point: GPSPoint = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: position.timestamp,
    };

    this.session.gpsPoints.push(point);
    console.log(`📍 Position updated: ${point.lat}, ${point.lng}`);
  }

  // Handler position error
  private handlePositionError(error: GeolocationPositionError) {
    console.error('GPS error:', error.message);

    if (error.code === error.PERMISSION_DENIED) {
      toast.error('Permission GPS refusée', {
        description: 'Veuillez activer la localisation dans les paramètres de votre navigateur.',
        duration: 5000,
        action: {
          label: 'Comment faire?',
          onClick: () => {
            toast.info('Paramètres de localisation', {
              description: 'Chrome: Paramètres > Confidentialité > Paramètres des sites > Localisation\nSafari: Paramètres > Confidentialité > Services de localisation',
              duration: 8000
            });
          }
        }
      });
      this.stopTracking();
    } else if (error.code === error.TIMEOUT) {
      toast.warning('Délai dépassé', {
        description: 'La localisation GPS prend trop de temps. Vérifiez votre connexion GPS.'
      });
    } else if (error.code === error.POSITION_UNAVAILABLE) {
      toast.error('Position indisponible', {
        description: 'Impossible d\'obtenir votre position. Vérifiez que le GPS est activé.'
      });
    }
  }

  // Process le track actuel et trouve les rues explorées
  private processCurrentTrack() {
    if (!this.session?.isActive) return;

    const exploredIds = streetMatcher.findIntersectingStreets(
      this.session.gpsPoints,
      this.session.streets
    );

    exploredIds.forEach(id => this.session!.exploredStreetIds.add(id));

    console.log(`🗺️ ${this.session.exploredStreetIds.size} streets explored so far`);
  }

  // Check if battery optimization should be enabled (after 30 minutes)
  private checkBatteryOptimization() {
    if (!this.session?.isActive || this.session.batteryOptimized) return;

    const duration = Date.now() - this.session.startTime;
    const thirtyMinutes = 30 * 60 * 1000;

    if (duration >= thirtyMinutes) {
      console.log('🔋 Enabling battery optimization (reducing GPS frequency)');
      this.session.batteryOptimized = true;

      // Stop current watch
      if (this.watchId !== null) {
        navigator.geolocation.clearWatch(this.watchId);
      }

      // Restart with lower frequency (maximumAge increased to 10 seconds)
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.handlePositionUpdate(position),
        (error) => this.handlePositionError(error),
        {
          enableHighAccuracy: true,
          maximumAge: 10000, // Increased from 5000
          timeout: 15000,     // Increased from 10000
        }
      );

      // Reduce update interval from 10s to 15s
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }
      this.updateInterval = setInterval(() => {
        this.processCurrentTrack();
      }, 15000);

      toast.info('Mode économie d\'énergie activé', {
        description: 'La fréquence GPS a été réduite pour économiser la batterie.',
        duration: 4000
      });
    }
  }

  // Obtenir la position actuelle (promesse)
  private getCurrentPosition(): Promise<GPSPoint> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: position.timestamp,
          });
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  // Sauvegarder le track dans Supabase
  private async saveTrackToDatabase(distance: number, duration: number) {
    if (!this.session) return;

    try {
      // Simplifier le track pour réduire la taille
      const simplifiedPoints = streetMatcher.simplifyTrack(this.session.gpsPoints, 20);

      // Convertir en LineString WKT pour PostGIS
      const coordsWKT = simplifiedPoints
        .map(p => `${p.lng} ${p.lat}`)
        .join(', ');
      const geometry = `SRID=4326;LINESTRING(${coordsWKT})`;

      // Insérer le track
      const { data: track, error: trackError } = await (supabase as any)
        .from('gps_tracks')
        .insert({
          user_id: this.session.userId,
          city: this.session.city,
          route_geometry: geometry,
          distance_meters: Math.round(distance),
          duration_seconds: Math.round(duration / 1000),
          started_at: new Date(this.session.startTime).toISOString(),
          ended_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (trackError) throw trackError;

      console.log('✅ Track saved to database');

      // Appeler la fonction pour calculer les rues explorées
      const exploredIds = Array.from(this.session.exploredStreetIds);
      
      if (exploredIds.length > 0 && track) {
        const { data, error } = await (supabase as any).rpc('calculate_explored_streets_v2', {
          p_track_id: track.id,
          p_user_id: this.session.userId,
          p_explored_osm_ids: exploredIds,
          p_city: this.session.city,
        });

        if (error) throw error;

        console.log(`✅ ${data} new streets recorded`);
      }

    } catch (error) {
      console.error('Failed to save track:', error);
      throw error;
    }
  }
}

export const gpsTracker = new GPSTracker();
