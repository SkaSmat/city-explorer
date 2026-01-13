# 🔧 Remise en Place Complète du Schéma Supabase

## 📋 Résumé des Incohérences Trouvées

### ❌ Problèmes Identifiés dans Votre Base Actuelle

1. **`user_profiles` - Colonnes manquantes:**
   - ❌ `bio` TEXT - utilisé dans EditProfile.tsx
   - ❌ `avatar_url` TEXT - utilisé dans EditProfile.tsx
   - ❌ `updated_at` TIMESTAMPTZ - utilisé dans EditProfile.tsx

2. **`city_progress` - Colonne manquante:**
   - ❌ `total_distance_meters` INTEGER - utilisé dans Home.tsx, Profile.tsx, Cities.tsx
   - C'est cette erreur qui cause: `column city_progress.total_distance_meters does not exist`

3. **`explored_streets` - Nom de colonne incorrect:**
   - ❌ Votre base a probablement: `osm_id`
   - ✅ Le code utilise: `street_osm_id`
   - Fichier concerné: MapView.tsx ligne 103

4. **`overpass_cache` - Table manquante:**
   - ❌ Table complètement absente
   - ✅ Utilisée dans CityProgressService.ts

---

## ✅ Solution: Script SQL Complet

J'ai créé un script SQL **COMPLET** qui:
- ✅ Crée toutes les tables avec TOUTES les colonnes nécessaires
- ✅ Ajoute les colonnes manquantes si les tables existent déjà
- ✅ Renomme `osm_id` → `street_osm_id` automatiquement
- ✅ Configure les RLS policies
- ✅ Crée la fonction RPC `calculate_explored_streets_v2`
- ✅ Insert les badges par défaut

**Fichier:** `supabase/COMPLETE_SCHEMA.sql`

---

## 🚀 Procédure d'Exécution

### Étape 1: Ouvrir Supabase Dashboard

1. Allez sur: https://supabase.com/dashboard
2. Sélectionnez votre projet: **anujltoavoafclklucdx**
3. Menu gauche → **SQL Editor** (icône </> ou "SQL")

### Étape 2: Créer une Nouvelle Requête

1. Cliquez sur **"New query"** ou le bouton **"+"**
2. Donnez un nom (ex: "Complete Schema Fix")

### Étape 3: Copier le Script Complet

Ouvrez le fichier `supabase/COMPLETE_SCHEMA.sql` dans votre repo et copiez **TOUT** le contenu.

Ou copiez directement depuis le terminal:

```bash
cat supabase/COMPLETE_SCHEMA.sql
```

### Étape 4: Coller et Exécuter

1. Collez le script complet dans l'éditeur SQL de Supabase
2. Cliquez sur **"Run"** ou appuyez sur **Ctrl+Enter** (Cmd+Enter sur Mac)
3. Attendez la fin de l'exécution (~10-20 secondes)

### Étape 5: Vérifier le Résultat

À la fin du script, vous verrez des résultats de vérification:

**Tableau 1: Tables existantes**
```
user_profiles
gps_tracks
explored_streets
city_progress
badges
user_badges
overpass_cache
```
Vous devez voir les 7 tables.

**Tableau 2: RLS Status**
```
tablename              | rowsecurity
-----------------------|------------
user_profiles          | true
gps_tracks            | true
explored_streets      | true
city_progress         | true
badges                | true
user_badges           | true
overpass_cache        | true
```
Toutes doivent avoir `rowsecurity = true`.

**Tableau 3: Badge Count**
```
badge_count
-----------
8
```
Vous devez avoir 8 badges.

---

## 🧪 Tester l'Application

### Après avoir exécuté le script SQL:

1. **Rafraîchissez votre app Lovable** (F5)
2. **Ouvrez la console** (F12)
3. **Vérifiez les logs:**

✅ **Logs attendus (succès):**
```
🧪 Testing Supabase external connection...
✅ Badges query successful: (8) [{…}, {…}, ...]
✅ Cache query successful: []
🎉 Connection to external Supabase OK!
```

❌ **Logs d'erreur (avant le fix):**
```
❌ Badges query failed: {message: 'Invalid API key'}
Error loading cities: {message: 'column city_progress.total_distance_meters does not exist'}
Error loading explored streets: {message: 'column explored_streets.street_osm_id does not exist'}
```

---

## 📊 Tables et Colonnes - Référence Complète

### Table: `user_profiles`
```sql
id UUID PRIMARY KEY
username TEXT
total_distance_meters INTEGER
total_streets_explored INTEGER
bio TEXT                           -- ⚠️ NOUVELLE
avatar_url TEXT                    -- ⚠️ NOUVELLE
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ             -- ⚠️ NOUVELLE
```

### Table: `gps_tracks`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES user_profiles(id)
city TEXT
route_geometry GEOMETRY(LINESTRING, 4326)
distance_meters INTEGER
duration_seconds INTEGER
started_at TIMESTAMPTZ
ended_at TIMESTAMPTZ
created_at TIMESTAMPTZ
```

### Table: `explored_streets`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES user_profiles(id)
city TEXT
street_osm_id BIGINT             -- ⚠️ RENOMMÉ (était osm_id)
street_name TEXT
first_explored_at TIMESTAMPTZ
track_id UUID REFERENCES gps_tracks(id)
UNIQUE(user_id, street_osm_id)
```

### Table: `city_progress`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES user_profiles(id)
city TEXT
streets_explored INTEGER
total_distance_meters INTEGER     -- ⚠️ NOUVELLE (cause de l'erreur 400)
last_activity TIMESTAMPTZ
first_visit TIMESTAMPTZ
total_sessions INTEGER
favorite BOOLEAN
UNIQUE(user_id, city)
```

### Table: `badges`
```sql
id UUID PRIMARY KEY
name TEXT
description TEXT
icon TEXT
condition_type TEXT
condition_value INTEGER
created_at TIMESTAMPTZ
```

### Table: `user_badges`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES user_profiles(id)
badge_id UUID REFERENCES badges(id)
unlocked_at TIMESTAMPTZ
UNIQUE(user_id, badge_id)
```

### Table: `overpass_cache` ⚠️ NOUVELLE TABLE
```sql
id UUID PRIMARY KEY
city TEXT UNIQUE
total_streets INTEGER
bbox TEXT
cached_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

---

## ⚠️ Important: Si Vous Avez Déjà des Données

Le script est **SAFE** pour les données existantes:

✅ **Ce qui est préservé:**
- Toutes les données existantes dans `user_profiles`, `gps_tracks`, etc.
- Les colonnes existantes ne sont pas modifiées
- Les relations et contraintes sont maintenues

✅ **Ce qui est ajouté:**
- Colonnes manquantes (avec valeurs par défaut)
- Tables manquantes (`overpass_cache`)
- Renommage de colonne (`osm_id` → `street_osm_id`)

❌ **AUCUNE donnée ne sera supprimée**

---

## 🔍 Si Vous Rencontrez des Erreurs

### Erreur: "relation already exists"
➡️ **Normal** - Le script utilise `IF NOT EXISTS`, continuez

### Erreur: "policy already exists"
➡️ **Normal** - Le script fait `DROP POLICY IF EXISTS` avant de recréer

### Erreur: "column already exists"
➡️ **Normal** - Le script vérifie avant d'ajouter

### Erreur: "permission denied"
➡️ **Problème:** Vous n'utilisez pas la bonne clé API
➡️ **Solution:** Vérifiez que vous êtes connecté en tant qu'admin sur le dashboard

---

## 📚 Fichiers Créés

| Fichier | Description |
|---------|-------------|
| `supabase/COMPLETE_SCHEMA.sql` | Script SQL complet à exécuter |
| `supabase/migration_add_total_distance.sql` | Migration simple (partielle) |
| `supabase/schema.sql` | Ancien schéma (incomplet) |
| `SUPABASE_FIX_INSTRUCTIONS.md` | Instructions pour la migration simple |
| `GUIDE_SUPABASE_KEYS.md` | Guide pour obtenir les clés JWT |
| `SECURITY.md` | Procédure de rotation des clés |

**Recommandation:** Utilisez `COMPLETE_SCHEMA.sql` - c'est le plus à jour et complet.

---

## ✅ Checklist de Vérification

Après exécution du script, cochez:

- [ ] Script exécuté sans erreur critique
- [ ] 7 tables visibles dans la vérification
- [ ] 8 badges insérés
- [ ] RLS activé sur toutes les tables
- [ ] App Lovable rafraîchie
- [ ] Console ne montre plus d'erreur "column does not exist"
- [ ] Console montre "🎉 Connection to external Supabase OK!"

---

**Créé le:** 12 Janvier 2026
**Status:** Prêt à exécuter
**Version:** Complete Schema v1.0
