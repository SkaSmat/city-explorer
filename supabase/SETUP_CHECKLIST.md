# 🚀 Supabase Setup Checklist

Quick checklist to ensure your Supabase is properly configured for City Explorer.

## ✅ Pre-requisites

- [ ] Supabase project created at https://supabase.com
- [ ] Project URL copied
- [ ] Anon key copied
- [ ] Both added to `src/lib/supabaseGeo.ts`

## 🗄️ Database Setup

### Option 1: Quick MVP Setup (5 minutes)

Perfect for testing and development:

- [ ] Go to Supabase SQL Editor
- [ ] Copy content from `supabase/migrations/disable-rls-mvp.sql`
- [ ] Execute the query
- [ ] Verify RLS is **DISABLED** (🔓)

### Option 2: Production Setup (15 minutes)

For production with security:

- [ ] Go to Supabase SQL Editor
- [ ] Copy content from `supabase/schema.sql`
- [ ] Execute the entire file
- [ ] Verify RLS is **ENABLED** (🔒)
- [ ] Copy content from `supabase/migrations/enable-rls-production.sql`
- [ ] Execute to create policies
- [ ] Verify policies are created

## 🔍 Verification Steps

Run these queries in SQL Editor to verify:

### 1. Check if tables exist

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_profiles', 'gps_tracks', 'explored_streets', 'city_progress', 'badges', 'user_badges')
ORDER BY table_name;
```

**Expected:** 6 tables listed

### 2. Check RLS status

```sql
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '🔒 ENABLED' ELSE '🔓 DISABLED' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'gps_tracks', 'explored_streets', 'city_progress', 'badges', 'user_badges')
ORDER BY tablename;
```

**Expected:**
- MVP: All show 🔓 DISABLED
- Production: All show 🔒 ENABLED

### 3. Check if RPC function exists

```sql
SELECT proname, proargnames
FROM pg_proc
WHERE proname = 'calculate_explored_streets_v2';
```

**Expected:** 1 row with function name

### 4. Check if badges are seeded

```sql
SELECT name FROM badges ORDER BY name;
```

**Expected:** At least 5-8 badges listed

## 🧪 Test Your Setup

### Manual Test in SQL Editor

Replace `your-user-id` with a real UUID:

```sql
-- 1. Create test user
INSERT INTO user_profiles (id, username)
VALUES ('your-user-id', 'Test User')
ON CONFLICT (id) DO NOTHING;

-- 2. Create test track
INSERT INTO gps_tracks (user_id, city, route_geometry, distance_meters, duration_seconds, started_at, ended_at)
VALUES (
  'your-user-id',
  'Paris',
  'SRID=4326;LINESTRING(2.3522 48.8566, 2.3532 48.8576)',
  100,
  60,
  NOW(),
  NOW()
)
RETURNING id;

-- 3. Test RPC (use the track ID from above)
SELECT * FROM calculate_explored_streets_v2(
  'track-id-from-above'::uuid,
  'your-user-id'::uuid,
  ARRAY[123456, 789012]::bigint[],
  'Paris'
);

-- Expected result: new_streets_count = 2, total_streets_count = 2
```

### Automated Test (if you have Node.js)

```bash
npx tsx supabase/test-connection.ts
```

This will automatically test:
- ✅ Connection
- ✅ Table access
- ✅ RPC function
- ✅ Data insertion

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "relation does not exist" | Run `schema.sql` to create tables |
| "permission denied" | Check RLS status, disable for MVP or add policies |
| "foreign key violation" | User doesn't exist, app now auto-creates via `ensureUserInGeo()` |
| "function does not exist" | Run RPC function creation from `schema.sql` section 3 |

## 📋 Final Checklist

Before testing the app:

- [ ] Database tables created
- [ ] RLS configured (disabled for MVP or enabled with policies)
- [ ] RPC function created
- [ ] Badges seeded
- [ ] Test queries executed successfully
- [ ] Supabase URL in code is correct
- [ ] Anon key in code is correct

## 🎯 Next Steps

Once everything is ✅:

1. Start your app: `npm run dev`
2. Log in to the app
3. Go to Map page
4. Click START to begin tracking
5. Walk around and watch streets turn green!
6. Check Supabase dashboard to see data flowing in

## 🆘 Still Having Issues?

1. Check browser console for errors
2. Check Supabase logs in Dashboard → Logs
3. Try the automated test script
4. Read the detailed `README.md` in this folder
5. Verify all environment variables

---

**Ready?** Head to the app and start exploring! 🗺️🚀
