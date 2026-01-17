import { useState, useEffect } from "react";
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
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const distanceKm = totalDistance / 1000;
  const nextLevelDistance = Math.ceil(distanceKm / 10) * 10 || 10; // Next 10km milestone
  const distanceProgress = animated ? (distanceKm / nextLevelDistance) * 100 : 0;

  // Estimate city completion (rough estimate based on average city having ~2000 streets)
  const cityStreets = 2000;
  const cityProgress = animated ? Math.min((totalStreets / cityStreets) * 100, 100) : 0;

  // Calculate streak progress
  const streakProgress = animated ? Math.min((currentStreak / 30) * 100, 100) : 0;

  // Dynamic labels based on actual data
  const getStreetsChangeLabel = () => {
    if (totalStreets === 0) return "Start exploring!";
    return `${cityProgress.toFixed(1)}% of city`;
  };

  const getDistanceChangeLabel = () => {
    if (distanceKm === 0) return "Start walking!";
    return `${(nextLevelDistance - distanceKm).toFixed(1)}km to Level ${Math.ceil(nextLevelDistance / 10)}`;
  };

  const stats = [
    {
      icon: Route,
      label: "Total Distance",
      value: loading ? "..." : `${distanceKm.toFixed(1)}km`,
      progress: loading ? 0 : distanceProgress,
      progressLabel: loading ? "" : getDistanceChangeLabel(),
      change: loading || distanceKm === 0 ? undefined : "+2.3 km",
      changeType: 'positive' as const,
      colorClass: "text-primary",
    },
    {
      icon: MapPin,
      label: "Streets Explored",
      value: loading ? "..." : totalStreets.toLocaleString(),
      subValue: loading ? "" : getStreetsChangeLabel(),
      progress: loading ? 0 : cityProgress,
      progressLabel: loading ? "" : (totalStreets > 0 ? `${totalStreets} streets discovered` : undefined),
      change: loading || totalStreets === 0 ? undefined : `+${Math.min(totalStreets, 8)}`,
      changeType: 'positive' as const,
      colorClass: "text-emerald-500",
    },
    {
      icon: Building2,
      label: "Cities Visited",
      value: loading ? "..." : totalCities.toString(),
      subValue: loading ? "" : totalCities > 0 ? undefined : "Start exploring!",
      hasBadge: totalCities > 0,
      change: totalCities > 0 ? "Recent" : undefined,
      changeType: 'neutral' as const,
      colorClass: "text-violet-500",
    },
    {
      icon: Flame,
      label: "Current Streak",
      value: loading ? "..." : `${currentStreak}`,
      subValue: loading ? "" : currentStreak > 0 ? `${currentStreak} day${currentStreak > 1 ? 's' : ''} 🔥` : "Start today!",
      progress: loading ? 0 : streakProgress,
      progressLabel: loading ? "" : currentStreak >= 7 ? "🎯 Weekly goal complete!" : `${7 - currentStreak} days to weekly goal`,
      colorClass: "text-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, index) => (
        <StatsCard
          key={stat.label}
          {...stat}
          delay={index * 100}
          animated={animated}
        />
      ))}
    </div>
  );
}
