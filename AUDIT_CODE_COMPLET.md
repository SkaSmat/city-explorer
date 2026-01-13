# 🔍 Audit Complet du Code - Besoins Base de Données

## Résumé Exécutif

L'application City Explorer nécessite **7 tables** avec des colonnes très spécifiques.

---

## 📊 Tables Requises (par ordre de dépendance)

### 1️⃣ user_profiles (BASE - aucune dépendance)
```sql
id UUID PRIMARY KEY
username TEXT DEFAULT 'Explorer'
total_distance_meters INTEGER DEFAULT 0
total_streets_explored INTEGER DEFAULT 0
bio TEXT DEFAULT ''
avatar_url TEXT
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**Utilisé dans:**
- Home.tsx (stats dashboard)
- Profile.tsx (profil utilisateur)
- EditProfile.tsx (édition bio/avatar)
- Leaderboard.tsx (classement)
- BadgeChecker.ts (vérification badges)

---

### 2️⃣ gps_tracks (dépend de user_profiles)
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE
city TEXT NOT NULL
route_geometry GEOMETRY(LINESTRING, 4326) NOT NULL  -- ⚠️ PostGIS requis
distance_meters INTEGER NOT NULL
duration_seconds INTEGER NOT NULL
started_at TIMESTAMPTZ NOT NULL
ended_at TIMESTAMPTZ NOT NULL
created_at TIMESTAMPTZ DEFAULT NOW()
```

**Utilisé dans:**
- GPSTracker.ts (sauvegarde des traces GPS)
- Home.tsx (calcul de streaks)
- Profile.tsx (statistiques)

**⚠️ IMPORTANT:** Nécessite PostGIS extension pour `GEOMETRY(LINESTRING, 4326)`

---

### 3️⃣ explored_streets (dépend de user_profiles + gps_tracks)
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE
city TEXT NOT NULL
street_osm_id BIGINT NOT NULL  -- ⚠️ PAS "osm_id" mais "street_osm_id"
street_name TEXT
first_explored_at TIMESTAMPTZ DEFAULT NOW()
track_id UUID REFERENCES gps_tracks(id) ON DELETE SET NULL
UNIQUE(user_id, street_osm_id)
```

**Utilisé dans:**
- MapView.tsx:103 → `.select('street_osm_id, city')`
- calculate_explored_streets_v2 RPC

**🔴 ERREUR FRÉQUENTE:** Le code utilise `street_osm_id`, PAS `osm_id`!

---

### 4️⃣ city_progress (dépend de user_profiles)
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE
city TEXT NOT NULL
streets_explored INTEGER DEFAULT 0
total_distance_meters INTEGER DEFAULT 0  -- ⚠️ COLONNE CRITIQUE MANQUANTE
last_activity TIMESTAMPTZ DEFAULT NOW()
first_visit TIMESTAMPTZ DEFAULT NOW()
total_sessions INTEGER DEFAULT 0
favorite BOOLEAN DEFAULT FALSE
UNIQUE(user_id, city)
```

**Utilisé dans:**
- Home.tsx:96 → `.select('city, streets_explored, total_distance_meters, last_activity')`
- Cities.tsx:59 → même requête
- Profile.tsx:118 → compte des villes
- BadgeChecker.ts:141 → badges multi-villes

**🔴 ERREUR ACTUELLE:** `total_distance_meters` manque → erreur 400

---

### 5️⃣ badges (table système)
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
name TEXT NOT NULL
description TEXT
icon TEXT
condition_type TEXT NOT NULL  -- 'distance', 'streets', 'cities', 'neighborhood'
condition_value INTEGER NOT NULL
created_at TIMESTAMPTZ DEFAULT NOW()
```

**Badges à insérer (8 badges):**
1. First Steps (1 km)
2. Explorer (10 km)
3. Street Collector (10 rues)
4. Neighborhood Explorer (100%)
5. Globe Trotter (3 villes)
6. Marathon Walker (42 km)
7. Street Master (100 rues)
8. City Explorer (10 villes)

**Utilisé dans:**
- BadgeChecker.ts:47 → `.select('*')`
- Profile.tsx:158 → affichage badges

---

### 6️⃣ user_badges (dépend de user_profiles + badges)
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE
badge_id UUID REFERENCES badges(id) ON DELETE CASCADE
unlocked_at TIMESTAMPTZ DEFAULT NOW()
UNIQUE(user_id, badge_id)
```

**Utilisé dans:**
- BadgeChecker.ts:57 → `.select('badge_id')`
- BadgeChecker.ts:90 → `.insert({ user_id, badge_id })`
- Profile.tsx:167 → affichage badges débloqués

---

### 7️⃣ overpass_cache (indépendant)
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
city TEXT NOT NULL UNIQUE
total_streets INTEGER NOT NULL
bbox TEXT
cached_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**Utilisé dans:**
- CityProgressService.ts:96 → `.select('total_streets, cached_at')`
- CityProgressService.ts:128 → `.upsert({ city, total_streets, bbox })`

**But:** Cache les requêtes Overpass API pour éviter de surcharger

---

## ⚙️ Fonction RPC Requise

### calculate_explored_streets_v2(p_track_id, p_user_id, p_explored_osm_ids[], p_city)

**Appelée par:** GPSTracker.ts:257

**Opérations:**
1. Insert dans `explored_streets` (ON CONFLICT DO NOTHING)
2. Compte les nouvelles rues
3. Update `user_profiles.total_streets_explored`
4. Upsert dans `city_progress`
5. Update `city_progress.total_distance_meters` (SUM gps_tracks)
6. Update `user_profiles.total_distance_meters` (SUM gps_tracks)

**Retourne:** `{ new_streets_count, total_streets_count }`

---

## 🔐 RLS Policies Requises

**Tables avec RLS user-specific:**
- user_profiles (SELECT/INSERT/UPDATE où auth.uid() = id)
- gps_tracks (SELECT/INSERT où auth.uid() = user_id)
- explored_streets (SELECT/INSERT où auth.uid() = user_id)
- city_progress (SELECT/INSERT/UPDATE où auth.uid() = user_id)
- user_badges (SELECT/INSERT où auth.uid() = user_id)

**Tables avec RLS public:**
- badges (SELECT public)
- overpass_cache (SELECT/INSERT/UPDATE public)

---

## 📑 Index Requis

**gps_tracks:**
- idx_gps_tracks_user_id
- idx_gps_tracks_city
- idx_gps_tracks_started_at

**explored_streets:**
- idx_explored_streets_user_id
- idx_explored_streets_city
- idx_explored_streets_street_osm_id

**city_progress:**
- idx_city_progress_user_id
- idx_city_progress_last_activity

**user_badges:**
- idx_user_badges_user_id
- idx_user_badges_badge_id

**overpass_cache:**
- idx_overpass_cache_city
- idx_overpass_cache_cached_at

---

## 🔴 Problèmes Fréquents Identifiés

### 1. Colonne manquante: total_distance_meters
**Symptôme:** `ERROR: column city_progress.total_distance_meters does not exist`
**Cause:** Colonne oubliée lors de création manuelle
**Fix:** `ALTER TABLE city_progress ADD COLUMN total_distance_meters INTEGER DEFAULT 0;`

### 2. Mauvais nom de colonne: osm_id vs street_osm_id
**Symptôme:** `ERROR: column explored_streets.street_osm_id does not exist`
**Cause:** Table créée avec `osm_id` mais code utilise `street_osm_id`
**Fix:** `ALTER TABLE explored_streets RENAME COLUMN osm_id TO street_osm_id;`

### 3. Colonnes profil manquantes: bio, avatar_url, updated_at
**Symptôme:** Erreur dans EditProfile.tsx
**Cause:** Colonnes ajoutées dans code mais pas en DB
**Fix:** Ajouter les 3 colonnes à user_profiles

### 4. Table overpass_cache manquante
**Symptôme:** Erreur dans CityProgressService
**Cause:** Table oubliée
**Fix:** Créer la table complète

### 5. PostGIS non activé
**Symptôme:** `ERROR: type "geometry" does not exist`
**Cause:** Extension PostGIS pas activée
**Fix:** `CREATE EXTENSION IF NOT EXISTS postgis;`

---

## ✅ Checklist Complète

- [ ] Extension PostGIS activée
- [ ] 7 tables créées
- [ ] Toutes colonnes présentes (vérifier bio, avatar_url, total_distance_meters, street_osm_id)
- [ ] 8 badges insérés
- [ ] Fonction RPC calculate_explored_streets_v2 créée
- [ ] RLS activé sur toutes les tables
- [ ] Policies créées (user-specific + public)
- [ ] Index créés pour performance
- [ ] Contraintes UNIQUE en place

---

**Date:** 13 Janvier 2026
**Source:** Analyse complète du codebase TypeScript
