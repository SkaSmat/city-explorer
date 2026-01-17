import { Route, MapPin, Building2, Flame } from "lucide-react";
import { StatsCard } from "./StatsCard";

interface StatsDashboardProps {
  totalDistance: number; // in meters
  totalStreets: number;
  totalCities: number;
  currentStreak: number;
  loading?: boolean;
}

export function StatsDashboard({
  totalDistance,
  totalStreets,
  totalCities,
  currentStreak,
  loading = false,
}: StatsDashboardProps) {
  const distanceKm = totalDistance / 1000;
  const nextLevelDistance = Math.ceil(distanceKm / 10) * 10; // Next 10km milestone
  const distanceProgress = (distanceKm / nextLevelDistance) * 100;

  // Estimate city completion (rough estimate based on average city having ~2000 streets)
  const cityStreets = 2000;
  const cityProgress = Math.min((totalStreets / cityStreets) * 100, 100);

  // Calculate weekly change (mock data - would come from backend)
  const weeklyDistanceChange = "+2.3 km";
  const weeklyStreetsChange = "+8 this week";

  const stats = [
    {
      icon: Route,
      label: "Total Distance",
      value: loading ? "..." : `${distanceKm.toFixed(1)}km`,
      progress: loading ? 0 : distanceProgress,
      progressLabel: loading ? "" : `${(nextLevelDistance - distanceKm).toFixed(1)}km to Level ${Math.ceil(nextLevelDistance / 10)}`,
      change: loading ? undefined : weeklyDistanceChange,
      changeType: 'positive' as const,
      colorClass: "text-primary",
    },
    {
      icon: MapPin,
      label: "Streets Explored",
      value: loading ? "..." : totalStreets.toLocaleString(),
      subValue: loading ? "" : `${cityProgress.toFixed(1)}% of city`,
      progress: loading ? 0 : cityProgress,
      progressLabel: loading ? "" : weeklyStreetsChange,
      change: loading ? undefined : "+8",
      changeType: 'positive' as const,
      colorClass: "text-emerald-500",
    },
    {
      icon: Building2,
      label: "Cities Visited",
      value: loading ? "..." : totalCities.toString(),
      subValue: loading ? "" : totalCities > 0 ? "🏅 New badge!" : "Start exploring!",
      change: totalCities > 0 ? "Recent" : undefined,
      changeType: 'neutral' as const,
      colorClass: "text-violet-500",
    },
    {
      icon: Flame,
      label: "Current Streak",
      value: loading ? "..." : `${currentStreak}`,
      subValue: loading ? "" : currentStreak > 0 ? `${currentStreak} day${currentStreak > 1 ? 's' : ''} 🔥` : "Start today!",
      progress: loading ? 0 : Math.min((currentStreak / 30) * 100, 100),
      progressLabel: loading ? "" : currentStreak >= 7 ? "🎯 Weekly goal complete!" : `${7 - currentStreak} days to weekly goal`,
      colorClass: "text-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <StatsCard
          key={stat.label}
          {...stat}
          delay={index * 100}
        />
      ))}
    </div>
  );
}
