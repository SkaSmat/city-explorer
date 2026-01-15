# 🚨 MIGRATION URGENTE - À FAIRE MAINTENANT

## Problème Actuel

❌ Le GPS tracking fonctionne mais **rien ne se sauvegarde** dans la base de données
❌ Le tableau de bord reste vide
❌ Les couleurs orange Strava n'apparaissent pas (car aucune rue enregistrée comme explorée)

## Cause

La fonction PostgreSQL `calculate_explored_streets_v2` n'existe pas dans votre Supabase.
Le code l'appelle mais elle n'est pas là → Erreur silencieuse → Rien ne se sauvegarde.

## Solution Immédiate

### Étape 1: Ouvrir Supabase SQL Editor

1. Allez sur: **https://supabase.com/dashboard/project/anujltoavoafclklucdx**
2. Cliquez sur **SQL Editor** dans le menu de gauche
3. Cliquez sur **New Query**

### Étape 2: Exécuter le SQL de Migration

**IMPORTANT:** Utilisez le fichier `002_alter_existing_schema.sql` (pas le 001!)

1. Copiez **TOUT** le contenu du fichier:
   ```
   supabase/migrations/002_alter_existing_schema.sql
   ```

2. Collez-le dans l'éditeur SQL

3. Cliquez sur **RUN** en bas à droite

**Note:** Ce fichier est safe - il ajoute seulement les colonnes/fonctions manquantes sans supprimer vos données existantes!

### Étape 3: Vérifier le Succès

Si tout se passe bien, vous verrez:
```
Success. No rows returned
```

Vous pouvez vérifier que la fonction existe en exécutant:
```sql
SELECT proname
FROM pg_proc
WHERE proname = 'calculate_explored_streets_v2';
```

Résultat attendu:
```
proname
---------------------------------
calculate_explored_streets_v2
```

## Ce que Cette Migration Fait

### Tables Créées/Vérifiées
- ✅ `user_profiles` - Profils utilisateurs avec stats agrégées
- ✅ `gps_tracks` - Sessions GPS avec géométrie PostGIS
- ✅ `explored_streets` - Rues explorées (unique par user/city/street)
- ✅ `city_progress` - Progression par ville
- ✅ `user_badges` - Badges débloqués

### Fonctions PostgreSQL Créées
1. **`calculate_explored_streets_v2`** (LA PLUS IMPORTANTE)
   - Appelée après chaque session GPS
   - Enregistre les nouvelles rues explorées
   - Met à jour les stats utilisateur
   - Met à jour la progression par ville

2. **`update_user_stats_from_track`**
   - Trigger automatique après insertion GPS track
   - Met à jour total_distance_meters
   - Met à jour city_progress

3. **`update_streak`**
   - Calcule la streak (jours consécutifs)
   - Reset si gap > 1 jour

4. **`get_user_stats`**
   - Récupère toutes les stats en 1 requête
   - Optimisé pour performance

5. **`get_city_leaderboard`**
   - Top 50 explorateurs par ville
   - Utilisé pour le leaderboard

### Indexes Créés pour Performance
- Index sur user_id, city, dates
- Index PostGIS GIST pour géométries
- Index composites pour requêtes fréquentes

## Après la Migration

### Test Immédiat

1. **Allez sur votre app**: https://urbanexplorer.lovable.app

2. **Ouvrez la Console du Navigateur** (F12 > Console)

3. **Démarrez un tracking GPS**:
   - Cliquez sur START
   - Marchez 50-100 mètres
   - Cliquez sur STOP

4. **Vérifiez la Console**:
   ```
   ✅ Track saved to database
   ✅ 5 new streets recorded  <- Ce message doit apparaître!
   ✅ Tracking stopped: { distance: 150, newStreets: 5, duration: 120000 }
   ```

5. **Vérifiez le Dashboard**:
   - Rechargez la page d'accueil
   - Les stats doivent s'afficher:
     - Distance totale: 150m
     - Rues explorées: 5
     - Villes: 1

6. **Vérifiez les Couleurs sur la Carte**:
   - Retournez sur la carte
   - Les rues que vous venez d'explorer doivent être **ORANGE STRAVA** (#FC4C02)
   - Les rues non explorées doivent être gris très clair (presque invisibles)
   - Le fond de carte doit être assombri

### Si Ça Ne Marche Toujours Pas

Vérifiez dans la console s'il y a des erreurs:
```javascript
// Erreur possible 1: Permission denied (RLS)
Error: permission denied for function calculate_explored_streets_v2

// Solution: Désactiver RLS temporairement
ALTER TABLE explored_streets DISABLE ROW LEVEL SECURITY;
ALTER TABLE gps_tracks DISABLE ROW LEVEL SECURITY;
ALTER TABLE city_progress DISABLE ROW LEVEL SECURITY;
```

```javascript
// Erreur possible 2: Table n'existe pas
Error: relation "gps_tracks" does not exist

// Solution: Les tables existent déjà? Vérifier:
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

## Vérifications Post-Migration

### 1. Vérifier les Tables
```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'gps_tracks', 'explored_streets', 'city_progress')
ORDER BY tablename;
```

Résultat attendu: 4 lignes

### 2. Vérifier les Fonctions
```sql
SELECT proname, pronargs
FROM pg_proc
WHERE proname LIKE '%explore%' OR proname LIKE '%stats%' OR proname LIKE '%streak%'
ORDER BY proname;
```

Résultat attendu: 5 fonctions

### 3. Vérifier les Indexes
```sql
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('gps_tracks', 'explored_streets')
ORDER BY indexname;
```

Résultat attendu: ~8-10 indexes

### 4. Test Manuel d'Insertion
```sql
-- Insérer un track de test
INSERT INTO gps_tracks (
  user_id,
  city,
  route_geometry,
  distance_meters,
  duration_seconds,
  started_at,
  ended_at
) VALUES (
  (SELECT id FROM user_profiles LIMIT 1),  -- Votre user_id
  'Paris',
  ST_GeomFromText('LINESTRING(2.3522 48.8566, 2.3532 48.8576)', 4326),
  100,
  120,
  NOW() - INTERVAL '5 minutes',
  NOW()
);

-- Tester la fonction RPC
SELECT calculate_explored_streets_v2(
  (SELECT id FROM gps_tracks ORDER BY created_at DESC LIMIT 1),  -- Dernier track_id
  (SELECT id FROM user_profiles LIMIT 1),  -- Votre user_id
  ARRAY[123456789, 987654321]::BIGINT[],   -- OSM IDs de test
  'Paris'
);
```

Si le SELECT retourne un nombre (ex: `2`), la fonction marche! ✅

## Notes Importantes

### Safe to Run Multiple Times
Ce script utilise `CREATE TABLE IF NOT EXISTS` et `CREATE OR REPLACE FUNCTION`.
Vous pouvez l'exécuter plusieurs fois sans problème.

### Données Existantes Préservées
Si vous avez déjà des tables avec des données, elles seront **préservées**.
Le script ajoute seulement ce qui manque.

### PostGIS Requis
Le script active l'extension PostGIS. Si votre instance Supabase ne l'a pas:
1. Allez dans **Database** > **Extensions**
2. Cherchez **postgis**
3. Cliquez sur **Enable**

## Après Migration: Activer la Strava Integration

Une fois que cette migration fonctionne, exécutez aussi:
```
supabase/migrations/add_strava_integration_fixed.sql
```

Cela ajoutera:
- Table `strava_connections`
- Colonnes `strava_activity_id` et `source` à `gps_tracks`

## Support

En cas de problème:
1. Copiez l'erreur exacte de Supabase SQL Editor
2. Vérifiez que PostGIS est activé
3. Vérifiez que vous êtes connecté avec le bon compte Supabase
4. Vérifiez l'URL: `anujltoavoafclklucdx.supabase.co`

---

**TL;DR**: Copiez le contenu de `001_create_base_schema.sql` → Collez dans Supabase SQL Editor → RUN → Testez l'app → Les données doivent se sauvegarder et les couleurs orange apparaître! 🎉
