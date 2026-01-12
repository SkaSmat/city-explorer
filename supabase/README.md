# City Explorer - Supabase Setup Guide

## 📋 Overview

This guide helps you set up the Supabase database for City Explorer, including tables, policies, and the RPC function.

## 🚀 Quick Start

### Option 1: Disable RLS (Recommended for MVP)

If you want to get started quickly without authentication complexities:

1. Go to your Supabase SQL Editor
2. Run this command:

```sql
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE gps_tracks DISABLE ROW LEVEL SECURITY;
ALTER TABLE explored_streets DISABLE ROW LEVEL SECURITY;
ALTER TABLE city_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;
```

**✅ This is the fastest way to get your MVP working.**

### Option 2: Enable RLS (Recommended for Production)

For production with proper security:

1. Go to your Supabase SQL Editor
2. Copy the entire content of `schema.sql`
3. Execute it in the SQL Editor

This will:
- Create all necessary tables
- Enable RLS on all tables
- Create policies for secure data access
- Create the `calculate_explored_streets_v2` RPC function
- Seed initial badges

## 🔍 Verify Your Setup

### 1. Check if RLS is enabled

Run this query in SQL Editor:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'gps_tracks', 'explored_streets', 'city_progress', 'badges', 'user_badges');
```

**Expected result:**
- `rowsecurity = false` if RLS is disabled (MVP mode)
- `rowsecurity = true` if RLS is enabled (Production mode)

### 2. Check policies (if RLS is enabled)

```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected result:** You should see policies like:
- `Users can view own profile`
- `Users can insert own tracks`
- etc.

### 3. Test the RPC function

Replace the UUIDs with real values from your database:

```sql
SELECT * FROM calculate_explored_streets_v2(
  '00000000-0000-0000-0000-000000000001'::uuid, -- track_id (any valid UUID)
  'your-user-id-here'::uuid, -- your actual user ID
  ARRAY[123456, 789012]::bigint[], -- OSM street IDs
  'Paris' -- city name
);
```

**Expected result:** Should return:
```
new_streets_count | total_streets_count
------------------+--------------------
2                 | 2
```

## 🐛 Common Issues & Fixes

### Issue 1: "foreign key constraint violated"

**Cause:** User doesn't exist in `user_profiles` table.

**Fix:** The app now automatically creates users with `ensureUserInGeo()` before tracking starts. If you still see this error, manually create your user:

```sql
INSERT INTO user_profiles (id, username)
VALUES ('your-user-id-here', 'YourUsername')
ON CONFLICT (id) DO NOTHING;
```

### Issue 2: "permission denied for table gps_tracks"

**Cause:** RLS is enabled but policies are not set up correctly.

**Fix:** Either:
- **Option A (Quick):** Disable RLS (see Quick Start)
- **Option B (Secure):** Run the full `schema.sql` to create policies

### Issue 3: "function calculate_explored_streets_v2 does not exist"

**Cause:** RPC function not created yet.

**Fix:** Copy and run the function definition from `schema.sql` (section 3).

## 📊 Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `user_profiles` | User information and total stats |
| `gps_tracks` | GPS tracking sessions |
| `explored_streets` | Streets explored by users |
| `city_progress` | Progress per city per user |
| `badges` | Available badges in the system |
| `user_badges` | Badges unlocked by users |

### Key Indexes

All tables have optimized indexes for:
- User lookups (`user_id`)
- City filtering (`city`)
- Time-based queries (`started_at`, `last_activity`)

## 🔐 Security Recommendations

### For MVP/Testing
- ✅ Disable RLS for faster development
- ✅ Use the `anon` key (already in code)
- ⚠️ Don't expose `service_role` key

### For Production
- ✅ Enable RLS with policies
- ✅ Use `anon` key for client-side
- ✅ Use `service_role` key only in backend/functions
- ✅ Enable Supabase Auth for user management

## 📝 Next Steps

After setting up the database:

1. ✅ Test tracking on the map
2. ✅ Verify data is saved in `gps_tracks`
3. ✅ Check that `explored_streets` is populated
4. ✅ Confirm badges appear in the Profile page

## 🆘 Need Help?

If you encounter issues:

1. Check the browser console for errors
2. Check Supabase logs in the Dashboard
3. Run the verification queries above
4. Check that your Supabase URL and anon key are correct in `supabaseGeo.ts`

---

**Database Version:** 1.0.0
**Last Updated:** 2026-01-12
