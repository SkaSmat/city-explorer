import { useState, useEffect } from "react";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyGoalCardProps {
  currentDistance: number; // in km
  dailyGoal?: number; // in km, default 5
  loading?: boolean;
}

export function DailyGoalCard({
  currentDistance,
  dailyGoal = 5,
  loading = false,
}: DailyGoalCardProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const progress = Math.min((currentDistance / dailyGoal) * 100, 100);
  const isGoalComplete = currentDistance >= dailyGoal;
  const remaining = Math.max(dailyGoal - currentDistance, 0);

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-5 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="h-3 bg-muted rounded-full mb-3" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    );
  }

  return (
    <div className={cn(
      "relative bg-card rounded-2xl border border-border p-4 sm:p-5 overflow-hidden transition-all duration-500",
      isGoalComplete && "border-emerald-500/50 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-900/20"
    )}>
      {/* Success background effect */}
      {isGoalComplete && (
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5" />
      )}

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-xl transition-colors",
              isGoalComplete ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-primary/10"
            )}>
              <Target className={cn(
                "w-5 h-5",
                isGoalComplete ? "text-emerald-500" : "text-primary"
              )} />
            </div>
            <h3 className="font-semibold text-base sm:text-lg">🎯 Today's Goal</h3>
          </div>
          <span className="text-sm font-mono text-muted-foreground">
            {currentDistance.toFixed(1)} / {dailyGoal} km
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-out",
              isGoalComplete 
                ? "bg-gradient-to-r from-emerald-500 to-emerald-400" 
                : "bg-gradient-to-r from-primary via-accent to-primary"
            )}
            style={{ 
              width: animated ? `${progress}%` : '0%',
            }}
          />
        </div>

        {/* Status Message */}
        <p className={cn(
          "text-sm font-medium",
          isGoalComplete ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
        )}>
          {isGoalComplete
            ? "🎉 Goal completed! Amazing work!"
            : `🔥 Keep going! ${remaining.toFixed(1)}km to go`
          }
        </p>
      </div>
    </div>
  );
}
