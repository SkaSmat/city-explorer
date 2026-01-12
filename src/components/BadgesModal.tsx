import { Lock, Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

interface BadgesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badges: Badge[];
}

export function BadgesModal({ open, onOpenChange, badges }: BadgesModalProps) {
  const unlockedBadges = badges.filter(b => b.unlocked);
  const lockedBadges = badges.filter(b => !b.unlocked);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Tous les badges ({unlockedBadges.length}/{badges.length})
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {/* Unlocked Badges */}
          {unlockedBadges.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Débloqués ({unlockedBadges.length})
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {unlockedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="bg-card rounded-xl border border-border p-3 text-center hover:border-primary transition-colors"
                  >
                    <div className="text-3xl mb-2">{badge.icon}</div>
                    <p className="text-xs font-medium truncate">{badge.name}</p>
                    {badge.unlockedAt && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(badge.unlockedAt).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locked Badges */}
          {lockedBadges.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                À débloquer ({lockedBadges.length})
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {lockedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="bg-card rounded-xl border border-border p-3 text-center opacity-60 grayscale relative"
                  >
                    <div className="absolute top-2 right-2">
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div className="text-3xl mb-2">{badge.icon}</div>
                    <p className="text-xs font-medium truncate">{badge.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                      {badge.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {badges.length === 0 && (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">Aucun badge disponible</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
