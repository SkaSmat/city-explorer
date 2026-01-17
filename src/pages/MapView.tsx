import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Navigation, Pause, MapPin, Route, Clock, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/layout/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { gpsTracker } from "@/services/GPSTracker";
import { explorationEvents } from "@/hooks/useExplorationRefresh";
import { toast } from "sonner";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapView() {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  
  const [cityName, setCityName] = useState("Détection...");
  const [userId, setUserId] = useState<string | null>(null);
  const [detectedCity, setDetectedCity] = useState<string>("");
  
  // GPS Tracker state
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStats, setTrackingStats] = useState({
    distance: 0,
    duration: 0,
    streetsExplored: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStreets, setIsLoadingStreets] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check auth and get user ID
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
      } else {
        setUserId(session.user.id);
      }
    });
  }, [navigate]);

  // Clean up any stuck GPS sessions on mount
  useEffect(() => {
    // Force reset GPS tracker to clean up any stuck sessions
    if (gpsTracker.isTrackingActive()) {
      console.warn('⚠️ Found active GPS session on mount, resetting...');
      gpsTracker.forceReset();
      toast.info('Session GPS précédente nettoyée');
    }
  }, []); // Run once on mount

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [
              "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
            minzoom: 0,
            maxzoom: 19,
            paint: {
              "raster-brightness-min": 0.3,  // Darken the map slightly
              "raster-brightness-max": 0.9,  // Reduce brightness
              "raster-saturation": -0.3,     // Reduce saturation for less colorful background
            }
          },
        ],
      },
      center: [2.3522, 48.8566], // Paris default
      zoom: 14,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), "top-right");

    // Load previously explored streets when map is ready
    mapRef.current.on('load', async () => {
      if (userId) {
        await loadExploredStreets();
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Load explored streets from database
  const loadExploredStreets = async () => {
    if (!userId || !mapRef.current) return;

    try {
      // Get user's explored streets
      const { data: exploredData, error } = await supabase
        .from('explored_streets')
        .select('street_osm_id, city')
        .eq('user_id', userId);

      if (error) {
        console.error('Error loading explored streets:', error);
        return;
      }

      if (!exploredData || exploredData.length === 0) {
        console.log('No previously explored streets found');
        return;
      }

      console.log(`📍 Found ${exploredData.length} previously explored streets`);
      
      // Note: To fully display explored streets, we'd need to fetch their geometries
      // from Overpass or store them. For now, this sets up the foundation.
      
    } catch (err) {
      console.error('Failed to load explored streets:', err);
    }
  };

  // Update stats and position every second during tracking
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      const state = gpsTracker.getCurrentState();
      if (state) {
        setTrackingStats({
          distance: Math.round(state.distance),
          duration: Math.round(state.duration / 1000),
          streetsExplored: state.streetsExplored
        });

        // Update blue marker position
        if (state.currentPosition && mapRef.current) {
          const { lat, lng } = state.currentPosition;

          // Create marker if it doesn't exist
          if (!markerRef.current) {
            markerRef.current = new maplibregl.Marker({
              color: '#3B82F6',
              scale: 1.2
            })
              .setLngLat([lng, lat])
              .addTo(mapRef.current);
          } else {
            // Update marker position
            markerRef.current.setLngLat([lng, lat]);
          }

          // Optionally recenter map on user position
          mapRef.current.panTo([lng, lat], { duration: 500 });
        }

        // Update GPS track line (blue trail)
        if (state.gpsPoints && state.gpsPoints.length >= 2 && mapRef.current) {
          const map = mapRef.current;

          // Convert GPS points to GeoJSON LineString
          const trackGeoJSON: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: state.gpsPoints.map(p => [p.lng, p.lat])
              }
            }]
          };

          // Add or update GPS track source
          if (map.getSource('gps-track')) {
            (map.getSource('gps-track') as maplibregl.GeoJSONSource).setData(trackGeoJSON);
          } else {
            map.addSource('gps-track', {
              type: 'geojson',
              data: trackGeoJSON
            });

            // Add GPS track glow layer (background)
            map.addLayer({
              id: 'gps-track-layer-glow',
              type: 'line',
              source: 'gps-track',
              paint: {
                'line-color': '#3B82F6', // Blue
                'line-width': 10,
                'line-opacity': 0.2,
                'line-blur': 6
              }
            });

            // Add GPS track main layer
            map.addLayer({
              id: 'gps-track-layer',
              type: 'line',
              source: 'gps-track',
              paint: {
                'line-color': '#3B82F6', // Blue
                'line-width': 5,
                'line-opacity': 0.9
              }
            });
          }
        }

        // Update streets layer with explored streets
        if (state.streets && state.exploredStreetIds && mapRef.current) {
          const map = mapRef.current;
          const exploredIds = Array.from(state.exploredStreetIds);

          // Convert streets to GeoJSON
          const geojson: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: state.streets.map(street => ({
              type: 'Feature',
              id: street.id,
              properties: {
                name: street.name,
                type: street.type,
                explored: exploredIds.includes(street.id)
              },
              geometry: {
                type: 'LineString',
                coordinates: street.coordinates
              }
            }))
          };

          // Add or update source
          if (map.getSource('streets')) {
            (map.getSource('streets') as maplibregl.GeoJSONSource).setData(geojson);
          } else {
            map.addSource('streets', {
              type: 'geojson',
              data: geojson
            });

            // Add glow layer for explored streets (background)
            map.addLayer({
              id: 'streets-layer-glow',
              type: 'line',
              source: 'streets',
              paint: {
                'line-color': [
                  'case',
                  ['get', 'explored'],
                  '#FC4C02', // Strava orange for explored
                  'rgba(0,0,0,0)' // Transparent for unexplored
                ],
                'line-width': 8,
                'line-opacity': 0.3,
                'line-blur': 4
              }
            });

            // Add main layer for streets
            map.addLayer({
              id: 'streets-layer',
              type: 'line',
              source: 'streets',
              paint: {
                'line-color': [
                  'case',
                  ['get', 'explored'],
                  '#FC4C02', // Strava orange for explored
                  '#E5E7EB'  // Very light gray for unexplored (barely visible)
                ],
                'line-width': 4,
                'line-opacity': [
                  'case',
                  ['get', 'explored'],
                  0.9,  // Bright for explored
                  0.3   // Very faint for unexplored
                ]
              }
            });
          }
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      // Remove marker when tracking stops
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      // Keep GPS track layer visible after tracking (but remove source to allow re-add)
      // We DON'T remove the streets layer to keep explored streets visible!
    };
  }, [isTracking]);

  // Cleanup GPS tracking on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // If tracking is active when component unmounts, stop it
      if (isTracking) {
        console.log('⚠️ Component unmounting while tracking active - stopping GPS tracker');
        gpsTracker.stopTracking().catch(err => {
          console.error('Error stopping tracker on unmount:', err);
        });
      }
    };
  }, []); // Empty deps = runs only on mount/unmount

  // Detect city using reverse geocoding
  const detectCity = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'StreetExplorer/1.0'
          }
        }
      );
      const data = await response.json();
      
      const city = data.address?.city || 
                   data.address?.town || 
                   data.address?.village || 
                   data.address?.municipality ||
                   'Unknown City';
      
      console.log('📍 Detected city:', city);
      return city;
    } catch (error) {
      console.error('Failed to detect city:', error);
      return 'Unknown City';
    }
  };

  // Start tracking
  const handleStartTracking = async () => {
    if (!userId) {
      toast.error("Vous devez être connecté pour utiliser le GPS");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check geolocation permission first
      if (!navigator.geolocation) {
        throw new Error("La géolocalisation n'est pas supportée par votre navigateur");
      }

      // Check permission status if API available
      if ('permissions' in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          if (permissionStatus.state === 'denied') {
            throw new Error("Permission GPS refusée. Veuillez l'activer dans les paramètres de votre navigateur.");
          }
        } catch (permErr) {
          // Permissions API might not be available, continue anyway
          console.warn('Permissions API error:', permErr);
        }
      }

      toast.info("📍 Recherche de votre position...", { duration: 2000 });

      // Get current position and detect city
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      toast.success("✅ Position trouvée! Détection de la ville...", { duration: 1500 });

      const currentCity = await detectCity(
        position.coords.latitude,
        position.coords.longitude
      );

      setCityName(currentCity);
      setDetectedCity(currentCity);

      // Center map on current position
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 16,
          duration: 1000
        });
      }

      // Show loading for streets
      setIsLoadingStreets(true);
      toast.info(`🗺️ Chargement des rues de ${currentCity}...`, { duration: 3000 });

      await gpsTracker.startTracking(userId, currentCity);

      setIsTracking(true);
      setIsLoading(false);
      setIsLoadingStreets(false);

      toast.success("🎉 Tracking démarré!", { duration: 2000 });
    } catch (err: any) {
      console.error('Start tracking error:', err);

      let errorMessage = err.message || "Erreur inconnue";

      // Handle specific geolocation errors
      if (err.code === 1) {
        errorMessage = "Permission GPS refusée. Activez la localisation dans les paramètres.";
      } else if (err.code === 2) {
        errorMessage = "Position GPS indisponible. Vérifiez votre connexion.";
      } else if (err.code === 3) {
        errorMessage = "Délai GPS dépassé. Vérifiez que le GPS est activé.";
      }

      setError(errorMessage);
      setIsLoading(false);
      setIsLoadingStreets(false);

      toast.error("Échec du démarrage", {
        description: errorMessage,
        duration: 5000
      });
    }
  };

  // Stop tracking
  const handleStopTracking = async () => {
    try {
      setIsLoading(true);

      const result = await gpsTracker.stopTracking();

      // Trigger refresh for Home page data
      explorationEvents.trigger();

      // Show success toast
      toast.success('🎉 Exploration complete!', {
        description: `${Math.round(result.distance)}m traveled • ${result.newStreets} streets discovered`,
        duration: 5000,
        action: {
          label: 'View stats',
          onClick: () => navigate('/home')
        }
      });

      // Reset stats but keep map layers visible
      setTrackingStats({ distance: 0, duration: 0, streetsExplored: 0 });

    } catch (err: any) {
      console.error('Error stopping tracking:', err);
      setError(err.message || 'Failed to stop tracking');
      toast.error('Error stopping tracking', {
        description: err.message || 'Could not save your activity',
        duration: 5000
      });
    } finally {
      // ALWAYS reset UI state, even if there was an error
      setIsTracking(false);
      setIsLoading(false);
    }
  };

  const handleToggleTracking = () => {
    if (isTracking) {
      handleStopTracking();
    } else {
      handleStartTracking();
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative h-screen w-full">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-card/90 backdrop-blur-sm border-b border-border safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate("/home")}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h1 className="font-semibold">{cityName}</h1>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Route className="w-4 h-4" />
              {(trackingStats.distance / 1000).toFixed(2)} km
              <span className="text-muted-foreground/50">•</span>
              <MapPin className="w-4 h-4" />
              {trackingStats.streetsExplored} rues
            </p>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Error Message */}
      {error && (
        <div className="absolute top-20 left-4 right-4 z-10 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium mb-2">{error}</p>
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={() => {
                    setError(null);
                    handleStartTracking();
                  }}
                  variant="outline"
                  size="sm"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  Réessayer
                </Button>
                <Button
                  onClick={() => navigate("/gps-diagnostic")}
                  variant="outline"
                  size="sm"
                  className="border-destructive/50 text-destructive/80 hover:bg-destructive/5"
                >
                  Diagnostic GPS
                </Button>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-destructive/60 hover:text-destructive"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Tracking Stats Panel */}
      {isTracking && (
        <div className="absolute top-24 left-4 right-4 z-10 bg-card/95 backdrop-blur-sm border border-border rounded-xl p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Route className="w-3 h-3" />
                Distance
              </p>
              <p className="text-lg font-bold text-primary">
                {(trackingStats.distance / 1000).toFixed(2)} km
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                Durée
              </p>
              <p className="text-lg font-bold text-primary">
                {formatDuration(trackingStats.duration)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Map className="w-3 h-3" />
                Rues
              </p>
              <p className="text-lg font-bold text-primary">
                {trackingStats.streetsExplored}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Start/Stop Tracking Button */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
        <Button
          onClick={handleToggleTracking}
          disabled={isLoading || isLoadingStreets}
          className={`w-48 h-48 rounded-full text-xl font-bold shadow-2xl transition-all duration-300 ${
            isTracking
              ? "bg-red-500 hover:bg-red-600"
              : isLoading || isLoadingStreets
              ? "bg-indigo-600/70"
              : "bg-indigo-600 hover:bg-indigo-700 hover:scale-105"
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            {isLoading || isLoadingStreets ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                <span className="text-sm">Chargement...</span>
              </>
            ) : isTracking ? (
              <>
                <Pause className="w-12 h-12" />
                <span className="text-sm font-semibold">STOP</span>
              </>
            ) : (
              <>
                <Navigation className="w-12 h-12" />
                <span className="text-sm font-semibold">START</span>
              </>
            )}
          </div>
        </Button>
      </div>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}
