# 🏃 Strava Integration Setup Guide

## ✅ Configuration Already Done

The following has been completed:

1. ✅ Strava OAuth service created (`src/services/StravaService.ts`)
2. ✅ OAuth callback page (`src/pages/StravaCallback.tsx`)
3. ✅ Activity import UI (`src/pages/StravaImport.tsx`)
4. ✅ "Connect with Strava" buttons added to Login and Signup pages
5. ✅ Strava connection management in Settings page
6. ✅ Environment variables configured in `.env`
7. ✅ Database migration created (`supabase/migrations/add_strava_integration.sql`)

## 🚀 Next Steps to Activate

### 1. Strava API Application ✅ DONE

You've already created your Strava API application with:
- **Client ID:** 195798
- **Client Secret:** 5a38980fa7899bd4075c58945e401d56e960e397
- **Authorization Callback Domain:** urbanexplorer.lovable.app
- **Callback URL:** https://urbanexplorer.lovable.app/auth/strava/callback

### 2. Run Database Migration 🔴 TODO

You need to execute the migration to create the `strava_connections` table:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `anujltoavoafclklucdx`
3. Go to **SQL Editor**
4. Click **New query**
5. Copy and paste the contents of `supabase/migrations/add_strava_integration.sql`
6. Click **Run** or press `Ctrl+Enter`

**What this migration does:**
- Creates `strava_connections` table to store OAuth tokens
- Adds `strava_activity_id` and `source` columns to `gps_tracks`
- Creates indexes for performance
- Sets up RLS policies for data security
- Prevents duplicate imports with unique constraints

### 3. Test the Integration 🧪

Once the migration is complete:

1. **Restart your development server** to load the new environment variables:
   ```bash
   npm run dev
   ```

2. **Test the OAuth Flow:**
   - Go to https://urbanexplorer.lovable.app/login
   - Click "Continuer avec Strava"
   - You should be redirected to Strava
   - Authorize the app
   - You should be redirected back to the import page

3. **Test Activity Import:**
   - Select activity types (Walk/Run/Bike)
   - Choose number of activities to import
   - Click "Importer les activités"
   - Wait for the import to complete
   - Check your profile to see updated stats

## 🔍 How It Works

### OAuth Flow

```
User clicks "Connect with Strava"
  ↓
Redirects to Strava OAuth page
  ↓
User authorizes app
  ↓
Strava redirects to /auth/strava/callback with code
  ↓
Exchange code for access_token + refresh_token
  ↓
Create account OR link to existing account
  ↓
Save connection in strava_connections table
  ↓
Redirect to /strava-import page
```

### Activity Import Process

```
User selects activities to import
  ↓
For each activity:
  1. Fetch activity details from Strava API
  2. Fetch GPS stream (lat/lng coordinates)
  3. Match GPS coordinates to city streets
  4. Save to gps_tracks table with strava_activity_id
  5. Update explored_streets and city_progress
  ↓
Display results: imported/skipped/errors
```

### Rate Limiting

- Strava API limit: **100 requests per 15 minutes**
- Import pauses every 50 activities for 30 seconds
- Progress bar updates in real-time

## 📊 Database Schema

### New Table: `strava_connections`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References user_profiles(id) |
| `strava_athlete_id` | BIGINT | Strava athlete ID (unique) |
| `access_token` | TEXT | OAuth access token |
| `refresh_token` | TEXT | OAuth refresh token |
| `token_expires_at` | TIMESTAMPTZ | Token expiration |
| `athlete_username` | TEXT | Strava username |
| `athlete_firstname` | TEXT | Athlete first name |
| `athlete_lastname` | TEXT | Athlete last name |
| `athlete_profile` | TEXT | Profile photo URL |
| `connected_at` | TIMESTAMPTZ | Connection timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### Updated Table: `gps_tracks`

**New columns:**
- `strava_activity_id` (BIGINT): Strava activity ID if imported
- `source` (TEXT): Source of track ('manual', 'strava', etc.)

**New constraint:**
- Unique constraint on `(user_id, strava_activity_id)` to prevent duplicates

## 🔐 Security Notes

### Environment Variables

**VITE_STRAVA_CLIENT_ID** ✅ Safe for client-side
- Public identifier for your app
- Can be exposed in browser

**VITE_STRAVA_CLIENT_SECRET** ⚠️ SENSITIVE
- Should ideally be stored server-side only
- In production, move token exchange to backend API
- For MVP, it's acceptable in .env (not committed to git)

### Row Level Security (RLS)

The migration enables RLS on `strava_connections` with policies:
- Users can only see their own connection
- Users can only modify their own connection
- No cross-user data access

## 🐛 Troubleshooting

### Error: "Invalid redirect_uri"
- Check that callback domain is exactly: `urbanexplorer.lovable.app`
- Make sure you're accessing the app via https://urbanexplorer.lovable.app

### Error: "Table strava_connections does not exist"
- Run the migration in Supabase SQL Editor
- Verify with: `SELECT * FROM strava_connections LIMIT 1;`

### Error: "Access token expired"
- Implement token refresh logic (future improvement)
- For now, user needs to reconnect Strava

### Import Fails Silently
- Check browser console for errors
- Check Supabase logs in Dashboard
- Verify GPS stream data exists for activities

## 📈 Future Improvements

1. **Automatic Token Refresh:** Use refresh_token to get new access_token
2. **Webhook Integration:** Real-time activity sync when new activities are posted
3. **Activity Filtering:** More granular filters (date range, distance, etc.)
4. **Background Sync:** Periodic background import of new activities
5. **Server-Side Token Exchange:** Move OAuth flow to backend for security

## 🎉 Success Checklist

- [ ] Migration executed successfully
- [ ] Development server restarted
- [ ] Can click "Connect with Strava" button
- [ ] OAuth redirect works
- [ ] Account created/linked successfully
- [ ] Can see import page with activities
- [ ] Activities import successfully
- [ ] Stats updated in profile
- [ ] Streets marked as explored on map
- [ ] Can disconnect Strava in Settings

---

**Version:** 1.0.0
**Last Updated:** 2026-01-13
**Commit:** bcafd4a
