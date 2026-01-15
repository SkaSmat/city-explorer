import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Medal, Award, MapPin, Route, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useTranslation } from "@/lib/i18n";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeaderboardEntry {
  id: string;
  username: string;
  totalDistance: number;
  totalStreets: number;
  totalCities: number;
  rank: number;
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [sortBy, setSortBy] = useState<'distance' | 'streets' | 'cities'>('distance');

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
    const loadLeaderboard = async () => {
      try {
        setLoadingData(true);

        // Fetch all user profiles with their stats
        const { data: profiles, error } = await (supabase as any)
          .from('user_profiles')
          .select('id, username, total_distance_meters, total_streets_explored')
          .order('total_distance_meters', { ascending: false })
          .limit(100);

        if (error) {
          console.error('Error loading leaderboard:', error);
          setLoadingData(false);
          return;
        }

        // Fetch city counts for each user
        const userCityCounts: { [key: string]: number } = {};
        
        const { data: cityData } = await (supabase as any)
          .from('city_progress')
          .select('user_id, city');

        if (cityData) {
          cityData.forEach(entry => {
            userCityCounts[entry.user_id] = (userCityCounts[entry.user_id] || 0) + 1;
          });
        }

        const entries: LeaderboardEntry[] = (profiles || []).map((profile, index) => ({
          id: profile.id,
          username: profile.username || 'Explorer',
          totalDistance: profile.total_distance_meters || 0,
          totalStreets: profile.total_streets_explored || 0,
          totalCities: userCityCounts[profile.id] || 0,
          rank: index + 1,
        }));

        setLeaderboard(entries);
        setLoadingData(false);
      } catch (err) {
        console.error('Error loading leaderboard:', err);
        setLoadingData(false);
      }
    };

    loadLeaderboard();
  }, []);

  // Sort leaderboard based on selected criteria
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    switch (sortBy) {
      case 'streets':
        return b.totalStreets - a.totalStreets;
      case 'cities':
        return b.totalCities - a.totalCities;
      default:
        return b.totalDistance - a.totalDistance;
    }
  }).map((entry, index) => ({ ...entry, rank: index + 1 }));

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-slate-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-muted-foreground font-medium">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-slate-300/10 to-slate-400/10 border-slate-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/10 to-orange-500/10 border-amber-600/30';
      default:
        return 'bg-card border-border';
    }
  };

  const userRank = sortedLeaderboard.find(entry => entry.id === user?.id);

  return (
    <AppLayout>
      <div className="px-6 py-8 pb-24">
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
          <div>
            <h1 className="text-2xl font-bold">{t('leaderboard.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {sortedLeaderboard.length} explorateurs
            </p>
          </div>
        </header>

        {/* User's position */}
        {userRank && (
          <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                #{userRank.rank}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{t('leaderboard.you')}</p>
                <p className="font-semibold">{userRank.username}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">
                  {sortBy === 'distance' && `${(userRank.totalDistance / 1000).toFixed(1)} km`}
                  {sortBy === 'streets' && `${userRank.totalStreets} rues`}
                  {sortBy === 'cities' && `${userRank.totalCities} villes`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sort tabs */}
        <Tabs defaultValue="distance" className="mb-6" onValueChange={(v) => setSortBy(v as 'distance' | 'streets' | 'cities')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="distance" className="flex items-center gap-2">
              <Route className="w-4 h-4" />
              {t('leaderboard.distance')}
            </TabsTrigger>
            <TabsTrigger value="streets" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {t('leaderboard.streets')}
            </TabsTrigger>
            <TabsTrigger value="cities" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {t('leaderboard.cities')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Leaderboard list */}
        {loadingData ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : sortedLeaderboard.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">{t('leaderboard.noData')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedLeaderboard.map((entry) => {
              const isCurrentUser = entry.id === user?.id;
              
              return (
                <div
                  key={entry.id}
                  className={`rounded-2xl border p-4 transition-all ${getRankBg(entry.rank)} ${
                    isCurrentUser ? 'ring-2 ring-primary/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex-shrink-0">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      isCurrentUser 
                        ? 'bg-gradient-to-br from-primary to-accent' 
                        : 'bg-muted-foreground/30 text-foreground'
                    }`}>
                      {entry.username.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                        {entry.username}
                        {isCurrentUser && <span className="ml-2 text-xs">({t('leaderboard.you')})</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.totalCities} {t('leaderboard.cities').toLowerCase()} • {entry.totalStreets} {t('leaderboard.streets').toLowerCase()}
                      </p>
                    </div>

                    {/* Main stat */}
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold ${entry.rank <= 3 ? 'text-lg' : ''}`}>
                        {sortBy === 'distance' && `${(entry.totalDistance / 1000).toFixed(1)} km`}
                        {sortBy === 'streets' && entry.totalStreets}
                        {sortBy === 'cities' && entry.totalCities}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
