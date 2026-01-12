# 🏆 Badge System Documentation

## Overview

The badge system automatically rewards users for achieving milestones in their exploration journey. Badges are checked and unlocked automatically after each tracking session.

---

## 📋 Available Badges

| Badge | Icon | Condition | Value | Description |
|-------|------|-----------|-------|-------------|
| **First Steps** | 👣 | Distance | 1 km | Walk your first kilometer |
| **Explorer** | 🚶 | Distance | 10 km | Walk 10 kilometers |
| **Marathon Walker** | 🏃 | Distance | 42 km | Walk 42 kilometers total |
| **Street Collector** | 🗺️ | Streets | 10 | Explore 10 different streets |
| **Street Master** | ⭐ | Streets | 100 | Explore 100 different streets |
| **Globe Trotter** | 🌍 | Cities | 3 | Explore 3 different cities |
| **City Explorer** | 🏙️ | Cities | 10 | Explore 10 different cities |
| **Neighborhood Explorer** | 🏘️ | Neighborhood | 100% | Complete 100% of a neighborhood |

---

## 🔧 How It Works

### 1. Automatic Check After Tracking

When a user stops tracking, the system automatically:

1. Saves the GPS track to the database
2. Updates user statistics (distance, streets, cities)
3. **Checks for badge unlocks** via `BadgeChecker`
4. Shows toast notifications for newly unlocked badges

**Code flow:**

```typescript
GPSTracker.stopTracking()
  → saveTrackToDatabase()
  → badgeChecker.checkAndUnlockBadges(userId)
    → getUserStats()
    → checkBadgeCondition()
    → Insert into user_badges
    → showBadgeNotifications()
```

### 2. Badge Verification Logic

For each badge, the system checks:

```typescript
switch (badge.condition_type) {
  case 'distance':
    return userStats.totalDistance >= badge.condition_value;

  case 'streets':
    return userStats.totalStreets >= badge.condition_value;

  case 'cities':
    return userStats.totalCities >= badge.condition_value;

  case 'neighborhood':
    // Complex logic - requires neighborhood completion tracking
    return false; // Not implemented yet
}
```

### 3. Preventing Duplicates

The system ensures badges are only unlocked once:

```typescript
// Fetch already unlocked badges
const unlockedBadgeIds = new Set(existingBadges.map(b => b.badge_id));

// Skip if already unlocked
if (unlockedBadgeIds.has(badge.id)) {
  continue;
}
```

---

## 🎨 User Experience

### Toast Notifications

When a badge is unlocked:

1. **Single badge:** Toast with badge icon, name, and description
   ```
   👣 Badge débloqué !
   First Steps - Walk your first kilometer
   [Voir] button → Navigate to profile
   ```

2. **Multiple badges:** Individual toasts + summary
   ```
   🎉 3 nouveaux badges débloqués !
   Consultez votre profil pour les voir
   ```

### Profile Display

In the Profile page:

- **Unlocked badges:** Full color, hover effect, unlock date
- **Locked badges:** Grayscale, 50% opacity, lock icon 🔒
- **Hover:** Shows badge description as tooltip

---

## 🗄️ Database Schema

### Tables Used

**1. `badges`** - All available badges

```sql
CREATE TABLE badges (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  condition_type TEXT NOT NULL, -- 'distance', 'streets', 'cities', 'neighborhood'
  condition_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**2. `user_badges`** - Unlocked badges per user

```sql
CREATE TABLE user_badges (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  badge_id UUID REFERENCES badges(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);
```

**3. `user_profiles`** - User stats for verification

```sql
-- Used to check badge conditions
total_distance_meters INTEGER,
total_streets_explored INTEGER
```

**4. `city_progress`** - City count

```sql
-- Count of distinct cities = total cities explored
SELECT COUNT(*) FROM city_progress WHERE user_id = ?
```

---

## 🧪 Testing

### Manual Testing

1. **Set up test data:**

```sql
-- Update user stats to trigger badges
UPDATE user_profiles SET
  total_distance_meters = 1500,
  total_streets_explored = 12
WHERE id = 'your-user-id';

-- Add multiple cities
INSERT INTO city_progress (user_id, city, streets_explored) VALUES
  ('your-user-id', 'Paris', 5),
  ('your-user-id', 'Lyon', 4),
  ('your-user-id', 'Marseille', 3);
```

2. **Clear existing badges (optional):**

```sql
DELETE FROM user_badges WHERE user_id = 'your-user-id';
```

3. **Trigger badge check:**

In the app:
- Go to Map page
- Start and stop tracking
- OR manually call: `badgeChecker.checkAndUnlockBadges(userId)`

4. **Verify results:**

```sql
-- Check unlocked badges
SELECT b.name, b.icon, ub.unlocked_at
FROM user_badges ub
JOIN badges b ON b.id = ub.badge_id
WHERE ub.user_id = 'your-user-id'
ORDER BY ub.unlocked_at DESC;
```

### Automated Tests

Run the test suite:

```typescript
import { runAllBadgeTests } from '@/services/BadgeChecker.test';

// In browser console or test framework
await runAllBadgeTests('your-user-id');
```

See `src/services/BadgeChecker.test.ts` for detailed test scenarios.

---

## 📈 Statistics

Badge unlocking is based on these cumulative stats:

| Stat | Source | Update Trigger |
|------|--------|----------------|
| **Total Distance** | `user_profiles.total_distance_meters` | After each track via RPC function |
| **Total Streets** | `user_profiles.total_streets_explored` | After each track via RPC function |
| **Total Cities** | `COUNT(DISTINCT city) FROM city_progress` | When exploring new city |

These stats are automatically updated by the `calculate_explored_streets_v2` RPC function after each tracking session.

---

## 🔄 Badge Check Flow

```
User stops tracking
       ↓
GPSTracker.stopTracking()
       ↓
Save track to DB
       ↓
Update user stats (via RPC)
       ↓
[1 second delay for DB commit]
       ↓
BadgeChecker.checkAndUnlockBadges(userId)
       ↓
Fetch user stats (distance, streets, cities)
       ↓
Fetch all badges from DB
       ↓
Fetch already unlocked badges
       ↓
For each badge:
  - Skip if already unlocked
  - Check condition (distance/streets/cities)
  - If met: Insert into user_badges
  - Add to newly unlocked list
       ↓
Show toast notifications
       ↓
Return list of new badges
```

---

## 🚀 Future Enhancements

### Neighborhood Badge Implementation

The "Neighborhood Explorer" badge requires tracking neighborhood completion:

```typescript
// TODO: Implement neighborhood tracking
interface Neighborhood {
  id: string;
  name: string;
  city: string;
  totalStreets: number;
  exploredStreets: number;
}

// Check if user completed 100% of any neighborhood
const hasCompletedNeighborhood = neighborhoods.some(n =>
  n.exploredStreets / n.totalStreets >= 1.0
);
```

### Additional Badge Ideas

- **Early Bird** 🐦: Track before 7am
- **Night Owl** 🦉: Track after 10pm
- **Weekend Warrior** 💪: 10 sessions on weekends
- **Daily Habit** 🔥: 7 day streak
- **Speed Demon** ⚡: Walk 10km in under 2 hours
- **Tourist** 📸: Visit 5 landmarks
- **Local Legend** 👑: Explore 80% of home city

---

## 📝 Implementation Checklist

- [x] Create BadgeChecker service
- [x] Integrate with GPSTracker
- [x] Add toast notifications
- [x] Display badges in Profile page
- [x] Show locked vs unlocked states
- [x] Add unlock dates
- [x] Prevent duplicate unlocks
- [x] Add test suite
- [x] Document the system
- [ ] Implement neighborhood badges
- [ ] Add badge animations
- [ ] Create badge detail modal
- [ ] Add social sharing for badges

---

## 🐛 Troubleshooting

### Badge not unlocking

1. **Check user stats:**
   ```sql
   SELECT * FROM user_profiles WHERE id = 'user-id';
   ```

2. **Check if already unlocked:**
   ```sql
   SELECT * FROM user_badges WHERE user_id = 'user-id';
   ```

3. **Check badge conditions:**
   ```sql
   SELECT * FROM badges ORDER BY condition_value;
   ```

4. **Check console logs:**
   - Look for "🏆 Checking badges"
   - Look for "✨ Badge unlocked"
   - Look for error messages

### Toast not showing

- Ensure `sonner` is installed and `<Toaster />` is in App.tsx
- Check browser console for errors
- Try manually: `toast.success('Test')`

### Stats not updating

- Check RPC function `calculate_explored_streets_v2` is working
- Verify DB permissions (RLS policies)
- Check that tracking is saving to `gps_tracks` table

---

**Last Updated:** 2026-01-12
**Author:** Claude Code AI
**Version:** 1.0.0
