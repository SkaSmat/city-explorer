import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, ChevronRight, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { supabaseGeo } from "@/lib/supabaseGeo";
import { User } from "@supabase/supabase-js";
import { SkeletonCityCard } from "@/components/ui/skeleton";

interface CityProgress {
  city: string;
  streetsExplored: number;
  totalDistanceMeters: number;
  lastActivity: string;
  progressPercent: number;
}

export default function Cities() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<CityProgress[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        if (!session?.user) {
          navigate("/login");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const loadCities = async () => {
      try {
        setLoadingData(true);

        const { data: cityData, error: cityError } = await supabaseGeo
          .from('city_progress')
          .select('city, streets_explored, total_distance_meters, last_activity')
          .eq('user_id', user.id)
          .order('last_activity', { ascending: false });

        if (cityError) {
          console.error('Error loading cities:', cityError);
        }

        const citiesWithProgress: CityProgress[] = (cityData || []).map(city => ({
          city: city.city,
          streetsExplored: city.streets_explored,
          totalDistanceMeters: city.total_distance_meters,
          lastActivity: city.last_activity,
          progressPercent: 0,
        }));

        setCities(citiesWithProgress);
        setLoadingData(false);
      } catch (err) {
        console.error('Error loading cities:', err);
        setLoadingData(false);
      }
    };

    loadCities();
  }, [user]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const getFlag = (cityName: string) => {
    if (cityName.toLowerCase().includes('paris') || cityName.toLowerCase().includes('lyon')) return '🇫🇷';
    if (cityName.toLowerCase().includes('london')) return '🇬🇧';
    if (cityName.toLowerCase().includes('new york')) return '🇺🇸';
    return '🌍';
  };

  const filteredCities = cities.filter(city =>
    city.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="px-6 py-8">
        {/* Header */}
        <header className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Mes Villes</h1>
        </header>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Rechercher une ville..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>

        {/* Stats Summary */}
        <div className="bg-card rounded-2xl border border-border p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{cities.length}</p>
              <p className="text-xs text-muted-foreground">Villes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary">
                {cities.reduce((acc, c) => acc + c.streetsExplored, 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Rues</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">
                {(cities.reduce((acc, c) => acc + c.totalDistanceMeters, 0) / 1000).toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">km</p>
            </div>
          </div>
        </div>

        {/* Cities List */}
        {loadingData ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <SkeletonCityCard key={i} />
            ))}
          </div>
        ) : filteredCities.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Aucune ville trouvée" : "Aucune ville explorée"}
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate('/map')} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Commencer à explorer
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCities.map((city, index) => (
              <Link
                key={city.city}
                to="/map"
                className={`block bg-card rounded-2xl border border-border p-4 card-hover animate-fade-in`}
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                    <div className="w-full h-full grid grid-cols-4 gap-0.5 p-2">
                      {Array.from({ length: 16 }).map((_, i) => {
                        const seed = city.city.charCodeAt(i % city.city.length) + i;
                        const isExplored = (seed % 3) === 0;
                        return (
                          <div
                            key={i}
                            className={`rounded-sm ${
                              isExplored ? "bg-secondary/60" : "bg-muted-foreground/20"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getFlag(city.city)}</span>
                      <h3 className="font-semibold">{city.city}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {city.streetsExplored.toLocaleString()} rues • {(city.totalDistanceMeters / 1000).toFixed(1)} km
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Dernière activité: {new Date(city.lastActivity).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-2" />
                </div>
              </Link>
            ))}

            <Button
              variant="outline"
              className="w-full rounded-2xl py-6 border-dashed border-2"
              onClick={() => navigate('/map')}
            >
              <Plus className="w-5 h-5 mr-2" />
              Explorer une nouvelle ville
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
