import { supabaseGeo } from '@/lib/supabaseGeo';
import { toast } from 'sonner';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
}

interface UserStats {
  totalDistance: number;
  totalStreets: number;
  totalCities: number;
}

interface NewBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

class BadgeChecker {
  /**
   * Check and unlock badges for a user
   * Call this after tracking ends or when user stats change
   */
  async checkAndUnlockBadges(userId: string): Promise<NewBadge[]> {
    try {
      console.log('🏆 Checking badges for user:', userId);

      // 1. Fetch user stats
      const stats = await this.getUserStats(userId);

      if (!stats) {
        console.error('❌ Could not fetch user stats');
        return [];
      }

      console.log('📊 User stats:', stats);

      // 2. Fetch all badges
      const { data: allBadges, error: badgesError } = await supabaseGeo
        .from('badges')
        .select('*');

      if (badgesError || !allBadges) {
        console.error('❌ Error fetching badges:', badgesError);
        return [];
      }

      // 3. Fetch already unlocked badges
      const { data: unlockedBadges, error: unlockedError } = await supabaseGeo
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId);

      if (unlockedError) {
        console.error('❌ Error fetching unlocked badges:', unlockedError);
        return [];
      }

      const unlockedBadgeIds = new Set(
        (unlockedBadges || []).map(ub => ub.badge_id)
      );

      console.log('🔓 Already unlocked:', unlockedBadgeIds.size, 'badges');

      // 4. Check each badge condition
      const newlyUnlocked: NewBadge[] = [];

      for (const badge of allBadges) {
        // Skip if already unlocked
        if (unlockedBadgeIds.has(badge.id)) {
          continue;
        }

        // Check if condition is met
        const isUnlocked = this.checkBadgeCondition(badge, stats);

        if (isUnlocked) {
          console.log(`✨ Badge unlocked: ${badge.name}`);

          // Insert into user_badges
          const { error: insertError } = await supabaseGeo
            .from('user_badges')
            .insert({
              user_id: userId,
              badge_id: badge.id,
              unlocked_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error(`❌ Error unlocking badge ${badge.name}:`, insertError);
            continue;
          }

          newlyUnlocked.push({
            id: badge.id,
            name: badge.name,
            description: badge.description || '',
            icon: badge.icon || '🏆',
          });
        }
      }

      console.log(`🎉 Unlocked ${newlyUnlocked.length} new badges`);

      // 5. Show notifications for new badges
      this.showBadgeNotifications(newlyUnlocked);

      return newlyUnlocked;
    } catch (err) {
      console.error('❌ Error checking badges:', err);
      return [];
    }
  }

  /**
   * Fetch user statistics from database
   */
  private async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabaseGeo
        .from('user_profiles')
        .select('total_distance_meters, total_streets_explored')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      // Fetch city count
      const { data: cities, error: citiesError } = await supabaseGeo
        .from('city_progress')
        .select('city')
        .eq('user_id', userId);

      if (citiesError) {
        console.error('Error fetching cities:', citiesError);
      }

      return {
        totalDistance: profile.total_distance_meters || 0,
        totalStreets: profile.total_streets_explored || 0,
        totalCities: cities?.length || 0,
      };
    } catch (err) {
      console.error('Error fetching user stats:', err);
      return null;
    }
  }

  /**
   * Check if a badge condition is met
   */
  private checkBadgeCondition(badge: Badge, stats: UserStats): boolean {
    switch (badge.condition_type) {
      case 'distance':
        return stats.totalDistance >= badge.condition_value;

      case 'streets':
        return stats.totalStreets >= badge.condition_value;

      case 'cities':
        return stats.totalCities >= badge.condition_value;

      case 'neighborhood':
        // For neighborhood badges, we'd need to check specific neighborhood completion
        // For now, we'll skip this type as it requires more complex logic
        return false;

      default:
        console.warn(`Unknown badge condition type: ${badge.condition_type}`);
        return false;
    }
  }

  /**
   * Show toast notifications for newly unlocked badges
   */
  private showBadgeNotifications(badges: NewBadge[]): void {
    if (badges.length === 0) return;

    // Show a toast for each badge (with slight delay between them)
    badges.forEach((badge, index) => {
      setTimeout(() => {
        toast.success(`${badge.icon} Badge débloqué !`, {
          description: `${badge.name} - ${badge.description}`,
          duration: 5000,
          action: {
            label: 'Voir',
            onClick: () => {
              // Navigate to profile badges section
              window.location.href = '/profile';
            }
          }
        });
      }, index * 1000); // Stagger notifications by 1 second
    });

    // Also show a summary if multiple badges
    if (badges.length > 1) {
      setTimeout(() => {
        toast.info(`🎉 ${badges.length} nouveaux badges débloqués !`, {
          description: 'Consultez votre profil pour les voir',
          duration: 6000,
        });
      }, badges.length * 1000);
    }
  }
}

// Export singleton instance
export const badgeChecker = new BadgeChecker();
