import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  HelpCircle,
  Shield,
  LogOut,
  ChevronRight,
  Route,
  MapPin,
  Building2,
  Flame,
  Calendar,
  Award,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { SkeletonStat, SkeletonBadge } from "@/components/ui/skeleton";
import { BadgesModal } from "@/components/BadgesModal";

interface UserStats {
  totalDistance: number;
  totalStreets: number;
  totalCities: number;
  currentStreak: number;
  memberSince: string;
  badgesUnlocked: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

interface ProfileData {
  total_distance_meters: number | null;
  total_streets_explored: number | null;
  created_at: string | null;
}

const settingsItems = [
  { icon: Settings, label: "Préférences", action: "settings" },
  { icon: Shield, label: "Confidentialité", action: "privacy" },
  { icon: HelpCircle, label: "Aide", action: "help" },
];

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    totalDistance: 0,
    totalStreets: 0,
    totalCities: 0,
    currentStreak: 0,
    memberSince: '',
    badgesUnlocked: 0,
  });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [showBadgesModal, setShowBadgesModal] = useState(false);

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

  // Load user stats and badges
  useEffect(() => {
    if (!user) return;

    const loadUserData = async () => {
      try {
        setLoadingData(true);

        // Fetch user profile stats
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('total_distance_meters, total_streets_explored, created_at')
          .eq('id', user.id)
          .single();

        const typedProfile = profile as ProfileData | null;

        if (profileError) {
          console.error('Error loading profile:', profileError);
        }

        // Fetch city count
        const { data: cities, error: citiesError } = await supabase
          .from('city_progress')
          .select('city')
          .eq('user_id', user.id);

        if (citiesError) {
          console.error('Error loading cities:', citiesError);
        }

        // Calculate streak
        const { data: tracks, error: tracksError } = await supabase
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
        const { data: allBadges, error: badgesError } = await supabase
          .from('badges')
          .select('*');

        if (badgesError) {
          console.error('Error loading badges:', badgesError);
        }

        // Fetch unlocked badges
        const { data: unlockedBadges, error: unlockedError } = await supabase
          .from('user_badges')
          .select('badge_id, unlocked_at')
          .eq('user_id', user.id);

        if (unlockedError) {
          console.error('Error loading unlocked badges:', unlockedError);
        }

        const unlockedMap = new Map(
          (unlockedBadges || []).map(ub => [ub.badge_id, ub.unlocked_at])
        );

        const badgesWithStatus: Badge[] = (allBadges || []).map(badge => ({
          id: badge.id,
          name: badge.name,
          description: badge.description || '',
          icon: badge.icon || '🏆',
          unlocked: unlockedMap.has(badge.id),
          unlockedAt: unlockedMap.get(badge.id) || null,
        }));

        // Update stats
        setStats({
          totalDistance: typedProfile?.total_distance_meters || 0,
          totalStreets: typedProfile?.total_streets_explored || 0,
          totalCities: cities?.length || 0,
          currentStreak: streak,
          memberSince: typedProfile?.created_at || user.created_at,
          badgesUnlocked: unlockedMap.size,
        });

        setBadges(badgesWithStatus);
        setLoadingData(false);
      } catch (err) {
        console.error('Error loading user data:', err);
        setLoadingData(false);
      }
    };

    loadUserData();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnexion réussie");
    navigate("/");
  };

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
  const email = user?.email || "";

  // Format stats for display
  const displayStats = [
    {
      icon: Route,
      label: "Distance totale",
      value: loadingData ? "..." : `${(stats.totalDistance / 1000).toFixed(1)} km`,
      color: "text-indigo-600"
    },
    {
      icon: MapPin,
      label: "Rues explorées",
      value: loadingData ? "..." : stats.totalStreets.toLocaleString(),
      color: "text-emerald-500"
    },
    {
      icon: Building2,
      label: "Villes visitées",
      value: loadingData ? "..." : stats.totalCities.toString(),
      color: "text-violet-500"
    },
    {
      icon: Flame,
      label: "Streak actuel",
      value: loadingData ? "..." : `${stats.currentStreak} jour${stats.currentStreak > 1 ? 's' : ''}`,
      color: "text-orange-500"
    },
    {
      icon: Calendar,
      label: "Membre depuis",
      value: loadingData ? "..." : new Date(stats.memberSince).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      color: "text-blue-500"
    },
    {
      icon: Award,
      label: "Badges obtenus",
      value: loadingData ? "..." : `${stats.badgesUnlocked} / ${badges.length}`,
      color: "text-yellow-500"
    },
  ];

  const handleSettingsClick = (action: string) => {
    switch (action) {
      case 'settings':
        navigate('/settings');
        break;
      case 'privacy':
        navigate('/privacy');
        break;
      case 'help':
        navigate('/help');
        break;
      default:
        break;
    }
  };

  return (
    <AppLayout>
      <div className="px-6 py-8 pb-24">
        {/* Profile Header */}
        <header className="text-center mb-8 animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-3xl animate-gradient shadow-lg">
            {username.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-2xl font-bold mb-1">{username}</h1>
          <p className="text-muted-foreground text-sm mb-4">{email}</p>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl transition-all hover:scale-105"
            onClick={() => navigate('/edit-profile')}
          >
            Modifier le profil
          </Button>
        </header>

        {/* Stats Grid */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Statistiques</h2>
          {loadingData ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <SkeletonStat key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {displayStats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`bg-card/95 backdrop-blur-sm rounded-xl border border-border p-4 card-hover animate-fade-in stagger-delay-${index + 1} shadow-sm`}
                  style={{ animationFillMode: 'both' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className="text-lg font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Badges Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Vos Badges</h2>
            {badges.length > 6 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={() => toast.info("🏆 Page complète des badges bientôt disponible !")}
              >
                Voir tout
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
          {loadingData ? (
            <div className="grid grid-cols-3 gap-3">
              {[...Array(9)].map((_, i) => (
                <SkeletonBadge key={i} />
              ))}
            </div>
          ) : badges.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Aucun badge disponible pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {badges.slice(0, 9).map((badge, index) => (
                <div
                  key={badge.id}
                  className={`bg-card rounded-xl border border-border p-4 text-center transition-all animate-scale-in stagger-delay-${index + 1} relative ${
                    badge.unlocked ? "card-hover" : "opacity-50 grayscale"
                  }`}
                  title={badge.description}
                  style={{ animationFillMode: 'both' }}
                >
                  {!badge.unlocked && (
                    <div className="absolute top-2 right-2">
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                  <div className={`text-3xl mb-2 ${badge.unlocked ? 'animate-pulse-ring' : ''}`}>{badge.icon}</div>
                  <p className="text-xs font-medium truncate">{badge.name}</p>
                  {badge.unlocked && badge.unlockedAt && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(badge.unlockedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Settings Section */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Paramètres</h2>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {settingsItems.map((item, index) => (
              <button
                key={item.label}
                onClick={() => handleSettingsClick(item.action)}
                className={`w-full flex items-center justify-between px-4 py-4 hover:bg-muted/50 transition-colors ${
                  index !== settingsItems.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </section>

        {/* Logout Button */}
        <Button
          variant="ghost"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Se déconnecter
        </Button>
      </div>

      {/* Badges Modal */}
      <BadgesModal
        open={showBadgesModal}
        onOpenChange={setShowBadgesModal}
        badges={badges}
      />
    </AppLayout>
  );
}
