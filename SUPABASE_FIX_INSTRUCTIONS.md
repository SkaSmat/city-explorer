# 🔧 Instructions pour Corriger l'Erreur de Colonne

## ❌ Erreur Actuelle

```
Error: column city_progress.total_distance_meters does not exist
```

**Cause:** La table `city_progress` dans votre base de données Supabase n'a pas la colonne `total_distance_meters`.

---

## ✅ Solution en 3 Étapes

### Étape 1: Ouvrir l'Éditeur SQL de Supabase

1. Allez sur: https://supabase.com/dashboard
2. Sélectionnez votre projet: **anujltoavoafclklucdx**
3. Dans le menu de gauche, cliquez sur **"SQL Editor"** (icône </> ou "SQL")

### Étape 2: Créer une Nouvelle Requête

1. Cliquez sur **"New query"** ou **"+"**
2. Copiez-collez le script SQL ci-dessous

### Étape 3: Exécuter le Script

Copiez ce script complet et exécutez-le:

```sql
-- =============================================
-- Migration: Add total_distance_meters to city_progress
-- =============================================

-- Add total_distance_meters column to city_progress table
DO $$
BEGIN
  -- Check if column exists, if not, add it
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'city_progress'
      AND column_name = 'total_distance_meters'
  ) THEN
    ALTER TABLE city_progress
    ADD COLUMN total_distance_meters INTEGER DEFAULT 0;

    RAISE NOTICE 'Column total_distance_meters added to city_progress';
  ELSE
    RAISE NOTICE 'Column total_distance_meters already exists in city_progress';
  END IF;
END $$;

-- Populate existing rows with calculated distances
UPDATE city_progress cp
SET total_distance_meters = (
  SELECT COALESCE(SUM(distance_meters), 0)
  FROM gps_tracks gt
  WHERE gt.user_id = cp.user_id
    AND gt.city = cp.city
)
WHERE total_distance_meters IS NULL OR total_distance_meters = 0;
```

Cliquez sur **"Run"** ou appuyez sur **Ctrl+Enter** (Cmd+Enter sur Mac).

---

## 🧪 Vérification

Après avoir exécuté le script, vous pouvez vérifier que la colonne existe en exécutant cette requête:

```sql
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'city_progress'
ORDER BY ordinal_position;
```

Vous devriez voir `total_distance_meters` dans la liste des colonnes.

---

## 📱 Tester l'Application

1. Retournez sur votre application Lovable
2. Rafraîchissez la page (F5)
3. Ouvrez la console (F12)
4. L'erreur `column city_progress.total_distance_meters does not exist` devrait avoir disparu

---

## ⚠️ Autres Erreurs Possibles

Si vous voyez d'autres erreurs de colonnes manquantes, vous pouvez exécuter le schéma complet:

1. Ouvrez le fichier `supabase/schema.sql` dans votre repo
2. Copiez TOUT le contenu
3. Collez-le dans l'éditeur SQL de Supabase
4. Exécutez

Le schéma utilise `IF NOT EXISTS` donc il ne va pas casser les tables existantes.

---

## 🆘 Besoin d'Aide?

Si vous avez toujours des erreurs après ces étapes:

1. Prenez une capture d'écran de l'erreur dans la console
2. Partagez le message d'erreur exact
3. Je pourrai vous aider à résoudre le problème spécifique

---

**Date:** 12 Janvier 2026
**Status:** Connexion Supabase ✅ | Colonnes manquantes ⚠️
