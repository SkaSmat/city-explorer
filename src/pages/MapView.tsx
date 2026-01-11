import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Navigation, Pause, MapPin, Route, Clock, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/layout/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { gpsTracker } from "@/services/GPSTracker";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapView() {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  
  const [cityName, setCityName] = useState("Paris");
  const [userId, setUserId] = useState<string | null>(null);
  
  // GPS Tracker state
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStats, setTrackingStats] = useState({
    distance: 0,
    duration: 0,
    streetsExplored: 0
  });
  const [isLoading, setIsLoading] = useState(false);
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
          },
        ],
      },
      center: [2.3522, 48.8566], // Paris default
      zoom: 14,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), "top-right");

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update stats every second during tracking
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
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isTracking]);

  // Start tracking
  const handleStartTracking = async () => {
    if (!userId) {
      setError("Vous devez être connecté");
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await gpsTracker.startTracking(userId, cityName);
      
      setIsTracking(true);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  // Stop tracking
  const handleStopTracking = async () => {
    try {
      setIsLoading(true);
      
      const result = await gpsTracker.stopTracking();
      
      setIsTracking(false);
      setIsLoading(false);
      
      // Show success message
      alert(`Exploration terminée!\n${Math.round(result.distance)}m parcourus\n${result.newStreets} rues découvertes`);
      
      // Reset stats
      setTrackingStats({ distance: 0, duration: 0, streetsExplored: 0 });
      
    } catch (err: any) {
      setError(err.message);
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
          <p className="text-sm font-medium">{error}</p>
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
          disabled={isLoading}
          className={`w-32 h-32 rounded-full text-lg font-bold shadow-2xl transition-all duration-300 ${
            isTracking
              ? "bg-destructive hover:bg-destructive/90"
              : "bg-primary hover:bg-primary/90 animate-pulse-ring"
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            {isLoading ? (
              <span className="text-sm">Loading...</span>
            ) : isTracking ? (
              <>
                <Pause className="w-8 h-8" />
                <span className="text-xs">STOP</span>
              </>
            ) : (
              <>
                <Navigation className="w-8 h-8" />
                <span className="text-xs">START</span>
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
