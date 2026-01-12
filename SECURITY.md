# 🔒 Security Policy

## Vulnerabilities Découvertes (12 Janvier 2026)

**CRITIQUE:** Des credentials Supabase étaient hardcodées dans `src/lib/supabaseGeo.ts` et commitées dans le repository public.

### Actions Correctives Appliquées

✅ **FAIT:**
1. Credentials déplacées vers variables d'environnement (`.env`)
2. `.env` ajouté au `.gitignore`
3. `.env.example` créé avec documentation
4. Validation des variables d'environnement ajoutée dans le code

⚠️ **À FAIRE IMMÉDIATEMENT PAR L'ADMINISTRATEUR:**
1. **Rotation des clés Supabase** (voir procédure ci-dessous)
2. Vérification que les RLS policies sont actives
3. Audit des logs d'accès Supabase pour activité suspecte

---

## 🚨 Procédure de Rotation des Credentials Supabase

### Étape 1: Créer de Nouvelles Clés

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. **Settings → API**
4. Sous "Project API keys":
   - Cliquer sur **"Reset anon key"** → Confirmer
   - Cliquer sur **"Reset service_role key"** → Confirmer
5. **IMPORTANT:** Copier immédiatement les nouvelles clés (elles ne seront plus visibles)

### Étape 2: Mettre à Jour les Variables d'Environnement

1. Ouvrir votre fichier `.env` local
2. Remplacer les anciennes valeurs:
   ```env
   VITE_SUPABASE_URL_GEO=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY_GEO=nouvelle_anon_key_ici
   VITE_EXTERNAL_SUPABASE_SERVICE_KEY=nouvelle_service_role_key_ici
   ```
3. **NE PAS** committer ce fichier dans Git

### Étape 3: Mettre à Jour en Production

**Si déployé sur Vercel/Netlify:**
1. Aller dans les settings du projet
2. Environment Variables
3. Mettre à jour `VITE_SUPABASE_URL_GEO` et `VITE_SUPABASE_ANON_KEY_GEO`
4. Redéployer l'application

**Si déployé sur Lovable:**
1. Aller dans Project Settings → Environment Variables
2. Mettre à jour les clés
3. Lovable redéploiera automatiquement

### Étape 4: Vérification

1. Tester que l'app fonctionne avec les nouvelles clés
2. Vérifier les logs Supabase pour confirmer les nouvelles connexions
3. Confirmer qu'aucune erreur d'authentification n'apparaît

---

## 🔐 Bonnes Pratiques de Sécurité

### Variables d'Environnement

✅ **À FAIRE:**
- Toujours utiliser des variables d'environnement pour les credentials
- Ajouter `.env` dans `.gitignore`
- Créer `.env.example` avec des valeurs d'exemple (sans vraies clés)
- Documenter toutes les variables nécessaires

❌ **À NE JAMAIS FAIRE:**
- Hardcoder des clés API/secrets dans le code
- Committer des fichiers `.env` dans Git
- Partager des credentials via Slack/Email/SMS
- Réutiliser des clés entre environnements (dev/prod)

### Supabase Anon Key vs Service Role Key

| Clé | Exposition | Utilisation | Risque |
|-----|------------|-------------|--------|
| **Anon Key** | ✅ Safe côté client | Requêtes utilisateur avec RLS | **BAS** si RLS configuré |
| **Service Role Key** | ❌ JAMAIS côté client | Admin/migrations backend only | **CRITIQUE** si exposée |

⚠️ **IMPORTANT:**
- La `anon key` est protégée par les RLS policies de Supabase
- La `service_role key` **bypass tous les RLS** - à utiliser UNIQUEMENT côté serveur

### Row Level Security (RLS)

**Vérification Obligatoire:**

```sql
-- Vérifier que RLS est activé sur toutes les tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Toutes les tables doivent avoir rowsecurity = true
```

**Test de Sécurité:**

1. Ouvrir la console Supabase en mode anonyme
2. Essayer de lire les données d'un autre utilisateur
3. La requête doit échouer avec "permission denied"

Exemple de test:
```javascript
// Ceci devrait retourner SEULEMENT les données de l'utilisateur connecté
const { data, error } = await supabase
  .from('user_profiles')
  .select('*');

// Ceci devrait ÉCHOUER (permission denied)
const { data: otherUser } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', 'autre_user_id_pas_le_mien');
```

---

## 🐛 Reporting Security Issues

Si vous découvrez une vulnérabilité de sécurité:

1. **NE PAS** créer de issue publique sur GitHub
2. Envoyer un email à: [security@yourproject.com] (remplacer)
3. Inclure:
   - Description de la vulnérabilité
   - Steps pour reproduire
   - Impact potentiel
   - Suggestion de fix si possible

---

## 📋 Security Checklist

Avant chaque déploiement, vérifier:

- [ ] Aucune credential hardcodée dans le code
- [ ] `.env` dans `.gitignore`
- [ ] Variables d'environnement configurées en production
- [ ] RLS activé sur toutes les tables Supabase
- [ ] Logs d'erreur ne révèlent pas de credentials
- [ ] Dépendances à jour (`npm audit`)
- [ ] HTTPS forcé en production
- [ ] CORS configuré correctement

---

## 🔄 Dernière Mise à Jour

- **Date:** 12 Janvier 2026
- **Action:** Migration des credentials vers .env
- **Status:** ✅ Code sécurisé, ⚠️ Rotation des clés nécessaire
- **Par:** Claude AI Audit

---

## 📚 Ressources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Environment Variables Best Practices](https://12factor.net/config)
