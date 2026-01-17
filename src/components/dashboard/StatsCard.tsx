import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subValue?: string;
  progress?: number;
  progressLabel?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  colorClass?: string;
  delay?: number;
  animated?: boolean;
  hasBadge?: boolean;
}

export function StatsCard({
  icon: Icon,
  label,
  value,
  subValue,
  progress,
  progressLabel,
  change,
  changeType = 'positive',
  colorClass = 'text-primary',
  delay = 0,
  animated = true,
  hasBadge = false,
}: StatsCardProps) {
  return (
    <div 
      className="group relative bg-card rounded-2xl border border-border p-4 sm:p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 animate-fade-in overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Gradient border on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5" />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className={cn("p-2 sm:p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110", 
            colorClass === 'text-primary' ? 'bg-primary/10' :
            colorClass === 'text-emerald-500' ? 'bg-emerald-500/10' :
            colorClass === 'text-violet-500' ? 'bg-violet-500/10' :
            colorClass === 'text-orange-500' ? 'bg-orange-500/10' :
            'bg-primary/10'
          )}>
            <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", colorClass)} />
          </div>
          
          {change && (
            <span className={cn(
              "text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full",
              changeType === 'positive' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
              changeType === 'negative' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
              changeType === 'neutral' && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
            )}>
              {change}
            </span>
          )}

          {/* New Badge Indicator with pulse animation */}
          {hasBadge && (
            <span className="text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 animate-pulse">
              🏅 New badge!
            </span>
          )}
        </div>

        {/* Value */}
        <div className="mb-2 sm:mb-3">
          <p className="text-xl sm:text-3xl font-bold font-mono tracking-tight">
            {value}
          </p>
          {subValue && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{subValue}</p>
          )}
        </div>

        {/* Label */}
        <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-3 sm:mb-4">{label}</p>

        {/* Progress Bar with Animation */}
        {progress !== undefined && (
          <div className="space-y-1.5 sm:space-y-2">
            <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out",
                  colorClass === 'text-primary' ? 'bg-gradient-to-r from-primary to-accent' :
                  colorClass === 'text-emerald-500' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                  colorClass === 'text-violet-500' ? 'bg-gradient-to-r from-violet-500 to-violet-400' :
                  colorClass === 'text-orange-500' ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
                  'bg-gradient-to-r from-primary to-accent'
                )}
                style={{ 
                  width: animated ? `${Math.min(Math.max(progress, 0), 100)}%` : '0%',
                  transitionDelay: `${delay + 200}ms`
                }}
              />
            </div>
            {progressLabel && (
              <p className="text-[10px] sm:text-xs text-muted-foreground">{progressLabel}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
