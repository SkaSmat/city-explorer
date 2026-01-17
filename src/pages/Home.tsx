import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, Plus, ChevronRight, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { explorationEvents } from "@/hooks/useExplorationRefresh";
import { User } from "@supabase/supabase-js";
import { SkeletonCityCard } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { cityProgressService } from "@/services/CityProgressService";
import { StatsDashboard } from "@/components/dashboard/StatsDashboard";
import { BadgeShowcase } from "@/components/badges/BadgeShowcase";

interface UserStats {
  totalDistance: number;
  totalStreets: number;
  totalCities: number;
  currentStreak: number;
}

interface CityProgress {
  city: string;
  streetsExplored: number;
  totalDistanceMeters: number;
  lastActivity: string;
  progressPercent: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress?: number;
  requirement?: string;
}

export default function Home() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    totalDistance: 0,
    totalStreets: 0,
    totalCities: 0,
    currentStreak: 0,
  });
  const [cities, setCities] = useState<CityProgress[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

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

  // Subscribe to exploration events for auto-refresh
  useEffect(() => {
    const unsubscribe = explorationEvents.subscribe(() => {
      setRefreshKey(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  // Load user stats, cities, and badges
  useEffect(() => {
    if (!user) return;

    const loadUserData = async () => {
      try {
        setLoadingData(true);

        // Fetch user profile stats
        const { data: profile, error: profileError } = await (supabase as any)
          .from('user_profiles')
          .select('total_distance_meters, total_streets_explored, created_at')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error loading profile:', profileError);
        }

        // Fetch city progress
        const { data: cityData, error: cityError } = await (supabase as any)
          .from('city_progress')
          .select('city, streets_explored, total_distance_meters, last_activity')
          .eq('user_id', user.id)
          .order('last_activity', { ascending: false });

        if (cityError) {
          console.error('Error loading cities:', cityError);
        }

        // Calculate streak (days with activity)
        const { data: tracks, error: tracksError } = await (supabase as any)
          .from('gps_tracks')
          .select('started_at')
          .eq('user_id', user.id)
          .order('started_at', { ascending: false });

        let streak = 0;
        if (tracks && tracks.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const uniqueDays = new Set(
            tracks.map((t: any) => new Date(t.started_at).toISOString().split('T')[0])
          );

          const sortedDays = Array.from(uniqueDays).sort().reverse();

          let currentDate = new Date(today);
          for (const day of sortedDays) {
            const trackDate = new Date(day as string);
            const diffDays = Math.floor((currentDate.getTime() - trackDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === streak || diffDays === streak + 1) {
              streak++;
            } else {
              break;
            }
          }
        }

        // Fetch badges
        const { data: allBadges, error: badgesError } = await (supabase as any)
          .from('badges')
          .select('*');

        const { data: unlockedBadges, error: unlockedError } = await (supabase as any)
          .from('user_badges')
          .select('badge_id, unlocked_at')
          .eq('user_id', user.id);

        const unlockedMap = new Map(
          (unlockedBadges || []).map((ub: any) => [ub.badge_id, ub.unlocked_at])
        );

        const badgesWithStatus: Badge[] = (allBadges || []).map((badge: any) => ({
          id: badge.id,
          name: badge.name,
          description: badge.description || '',
          icon: badge.icon || '🏆',
          unlocked: unlockedMap.has(badge.id),
          unlockedAt: unlockedMap.get(badge.id) || null,
          requirement: badge.condition_type ? `${badge.condition_value} ${badge.condition_type}` : undefined,
          progress: 0, // Could calculate based on user stats
        }));

        setBadges(badgesWithStatus);

        // Update stats
        setStats({
          totalDistance: profile?.total_distance_meters || 0,
          totalStreets: profile?.total_streets_explored || 0,
          totalCities: cityData?.length || 0,
          currentStreak: streak,
        });

        // Update cities with progress - start with 0, then calculate
        const citiesWithProgress: CityProgress[] = (cityData || []).map((city: any) => ({
          city: city.city,
          streetsExplored: city.streets_explored,
          totalDistanceMeters: city.total_distance_meters,
          lastActivity: city.last_activity,
          progressPercent: 0,
        }));

        setCities(citiesWithProgress);
        setLoadingData(false);

        // Calculate progress percentages in background
        if (citiesWithProgress.length > 0) {
          const progressMap = await cityProgressService.getCitiesProgress(
            citiesWithProgress.map(c => ({ city: c.city, streetsExplored: c.streetsExplored }))
          );
          
          setCities(prev => prev.map(city => ({
            ...city,
            progressPercent: progressMap.get(city.city) || 0,
          })));
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        setLoadingData(false);
      }
    };

    loadUserData();
  }, [user, refreshKey]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "Explorer";

  const getFlag = (cityName: string) => {
    if (cityName.toLowerCase().includes('paris') || cityName.toLowerCase().includes('lyon')) return '🇫🇷';
    if (cityName.toLowerCase().includes('london')) return '🇬🇧';
    if (cityName.toLowerCase().includes('new york')) return '🇺🇸';
    return '🌍';
  };

  return (
    <AppLayout>
      <div className="px-4 sm:px-6 py-6 pb-24 max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg animate-gradient shadow-md">
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('home.welcomeBack')}</p>
              <h1 className="text-xl font-bold">{username}</h1>
            </div>
          </div>
          <button
            className="relative p-2 rounded-full hover:bg-muted transition-all hover:scale-110"
            aria-label="Notifications"
            onClick={() => toast.info("🔔 Système de notifications bientôt disponible !")}
          >
            <Bell className="w-6 h-6 text-muted-foreground" />
          </button>
        </header>

        {/* Stats Dashboard */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">{t('home.yourStats') || 'Your Stats'}</h2>
          <StatsDashboard
            totalDistance={stats.totalDistance}
            totalStreets={stats.totalStreets}
            totalCities={stats.totalCities}
            currentStreak={stats.currentStreak}
            loading={loadingData}
          />
        </section>

        {/* Badge Showcase */}
        {badges.length > 0 && (
          <section className="mb-10">
            <BadgeShowcase
              badges={badges}
              loading={loadingData}
              maxVisible={6}
              onViewAll={() => navigate('/profile')}
            />
          </section>
        )}

        {/* Cities Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('home.yourCities')}</h2>
            {cities.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={() => navigate('/cities')}
              >
                {t('home.seeAll') || 'See all'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          {loadingData ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <SkeletonCityCard key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {cities.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-2xl border border-border">
                  <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    {t('home.noCities')}
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    {t('home.startExploring')}
                  </p>
                  <Button onClick={() => navigate('/map')}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('home.addCity')}
                  </Button>
                </div>
              ) : (
                <>
                  {cities.slice(0, 3).map((city, index) => (
                    <Link
                      key={city.city}
                      to="/map"
                      className="block bg-card rounded-2xl border border-border p-4 transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Mini map placeholder */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex-shrink-0 overflow-hidden border border-border">
                          <div className="w-full h-full grid grid-cols-4 gap-0.5 p-2">
                            {Array.from({ length: 16 }).map((_, i) => {
                              const seed = city.city.charCodeAt(i % city.city.length) + i;
                              const isExplored = (seed % 3) === 0;
                              return (
                                <div
                                  key={i}
                                  className={`rounded-sm transition-colors ${
                                    isExplored ? "bg-primary/60" : "bg-muted-foreground/20"
                                  }`}
                                />
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{getFlag(city.city)}</span>
                            <h3 className="font-semibold text-base sm:text-lg truncate">{city.city}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {city.streetsExplored.toLocaleString()} {t('home.streets')} • {(city.totalDistanceMeters / 1000).toFixed(1)} km
                          </p>
                          {city.progressPercent > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{t('home.progress')}</span>
                                <span className="font-medium text-primary">{city.progressPercent}%</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                                  style={{ width: `${city.progressPercent}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-2" />
                      </div>
                    </Link>
                  ))}

                  {/* Add City Button */}
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl py-6 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
                    onClick={() => navigate('/map')}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {t('home.addCity')}
                  </Button>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
