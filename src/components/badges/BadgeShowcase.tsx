import { useState, useEffect } from "react";
import { Lock, Award, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress?: number; // 0-100 for locked badges
  requirement?: string;
}

interface BadgeShowcaseProps {
  badges: Badge[];
  onViewAll?: () => void;
  maxVisible?: number;
  loading?: boolean;
}

export function BadgeShowcase({ 
  badges, 
  onViewAll,
  maxVisible = 12,
  loading = false 
}: BadgeShowcaseProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const totalCount = badges.length;
  const visibleBadges = badges.slice(0, maxVisible);

  // Calculate correct progress percentage (0 if no badges)
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
          <div className="h-6 w-24 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold">Badges</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{unlockedCount}</span>/{totalCount} unlocked
            </p>
          </div>
        </div>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll} className="text-primary text-xs sm:text-sm">
            View all
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Progress Bar with Animation */}
      <div className="space-y-2">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full transition-all duration-1000 ease-out"
            style={{ width: animated ? `${progressPercent}%` : '0%' }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right">
          {progressPercent.toFixed(0)}% complete
        </p>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-4">
        {visibleBadges.map((badge, index) => (
          <button
            key={badge.id}
            onClick={() => setSelectedBadge(badge)}
            onMouseEnter={() => setHoveredBadge(badge.id)}
            onMouseLeave={() => setHoveredBadge(null)}
            className={cn(
              "relative aspect-square rounded-xl sm:rounded-2xl border-2 transition-all duration-300 animate-scale-in overflow-hidden group",
              badge.unlocked
                ? "bg-card border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
                : "bg-muted/50 border-border/50 grayscale hover:grayscale-0 hover:border-muted-foreground/30"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Glow effect for unlocked badges */}
            {badge.unlocked && (
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 opacity-0 transition-opacity duration-300",
                hoveredBadge === badge.id && "opacity-100"
              )} />
            )}

            {/* Shimmer effect on hover */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-700",
              hoveredBadge === badge.id && "translate-x-full"
            )} />

            {/* Lock icon for locked badges */}
            {!badge.unlocked && (
              <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10">
                <div className="p-0.5 sm:p-1 rounded-full bg-muted-foreground/20">
                  <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
                </div>
              </div>
            )}

            {/* Sparkle for recently unlocked */}
            {badge.unlocked && badge.unlockedAt && isRecent(badge.unlockedAt) && (
              <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 animate-pulse" />
              </div>
            )}

            {/* Badge content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-1 sm:p-2">
              <span className={cn(
                "text-2xl sm:text-4xl mb-0.5 sm:mb-1 transition-transform duration-300",
                hoveredBadge === badge.id && "scale-110"
              )}>
                {badge.icon}
              </span>
              <p className="text-[8px] sm:text-xs font-medium text-center leading-tight line-clamp-2 px-0.5 sm:px-1">
                {badge.name}
              </p>
            </div>

            {/* Progress bar for locked badges with animation */}
            {!badge.unlocked && badge.progress !== undefined && badge.progress > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-muted">
                <div 
                  className="h-full bg-primary/60 transition-all duration-700 ease-out"
                  style={{ width: animated ? `${badge.progress}%` : '0%' }}
                />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Badge Detail Modal */}
      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent className="max-w-sm">
          {selectedBadge && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-4xl">{selectedBadge.icon}</span>
                  <div>
                    <h3 className="font-bold">{selectedBadge.name}</h3>
                    {selectedBadge.unlocked ? (
                      <p className="text-xs text-emerald-500 font-medium">
                        ✓ Unlocked {selectedBadge.unlockedAt && formatDate(selectedBadge.unlockedAt)}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Locked</p>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 pt-4">
                <p className="text-muted-foreground">{selectedBadge.description}</p>
                
                {!selectedBadge.unlocked && selectedBadge.requirement && (
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-sm font-medium mb-2">Requirement:</p>
                    <p className="text-sm text-muted-foreground">{selectedBadge.requirement}</p>
                    {selectedBadge.progress !== undefined && (
                      <div className="mt-3 space-y-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${selectedBadge.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-right text-muted-foreground">{selectedBadge.progress}% complete</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedBadge.unlocked && (
                  <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <Award className="w-5 h-5 text-emerald-500" />
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">Achievement Unlocked!</span>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
}

function isRecent(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
}
