# 🚀 Configuration Lovable - Variables d'Environnement

## ⚠️ Problème

Les modifications ne sont pas visibles sur Lovable car le fichier `.env` n'est **jamais commité** dans git (pour la sécurité).

Lovable doit être configuré manuellement avec les variables d'environnement.

## ✅ Solution: Configurer les Variables sur Lovable

### Étape 1: Trouver les Settings Lovable

**Option A - Via l'Interface:**
1. Ouvrez votre projet sur Lovable: https://lovable.dev
2. Cherchez dans le menu:
   - ⚙️ **"Settings"**
   - 🔐 **"Environment Variables"**
   - 🔑 **"Secrets"**
   - 🌍 **"Deployment Settings"**

**Option B - Via le Chat Lovable:**
1. Ouvrez le chat Lovable (en bas à droite)
2. Tapez: **"How do I configure environment variables?"**
3. Suivez les instructions

### Étape 2: Ajouter les Variables

Copiez-collez ces 5 variables **EXACTEMENT** comme ci-dessous:

```env
VITE_SUPABASE_PROJECT_ID=anujltoavoafclklucdx
VITE_SUPABASE_URL=https://anujltoavoafclklucdx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFudWpsdG9hdm9hZmNsa2x1Y2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMzIyNTQsImV4cCI6MjA4MzcwODI1NH0.eRjOECx2G5_MrL2KvXWw4vRDnP-JEOYm_70VXkPf5AU
VITE_STRAVA_CLIENT_ID=195798
VITE_STRAVA_CLIENT_SECRET=5a38980fa7899bd4075c58945e401d56e960e397
```

**Format selon l'interface:**
- Si c'est un formulaire:
  - **Name:** `VITE_SUPABASE_PROJECT_ID`
  - **Value:** `anujltoavoafclklucdx`
- Si c'est un éditeur texte:
  - Collez tout d'un coup

### Étape 3: Redéployer

**Option A - Bouton Deploy:**
- Cliquez sur "Deploy", "Redeploy" ou "Rebuild"

**Option B - Automatique:**
- Attendez 1-2 minutes, Lovable détecte automatiquement le nouveau commit

**Option C - Forcer avec un Push:**
- J'ai déjà poussé un petit changement (commit 95f0b1a)
- Lovable devrait redéployer automatiquement

### Étape 4: Vérifier

**Dans Lovable, ouvrez la console:**
1. Cliquez sur Preview de votre app
2. Ouvrez les DevTools (F12)
3. Console → Tapez:
   ```javascript
   console.log(import.meta.env.VITE_SUPABASE_URL)
   ```
4. **✅ Devrait afficher:** `https://anujltoavoafclklucdx.supabase.co`
5. **❌ Si ça affiche:** `https://qycsyvjnynvkuluiyzyx.supabase.co` → Variables pas à jour, recommencez

## 🔍 Diagnostic si Ça Ne Marche Pas

### Test 1: Variables Bien Configurées?

```javascript
// Dans la console Lovable
console.log('PROJECT_ID:', import.meta.env.VITE_SUPABASE_PROJECT_ID);
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('KEY:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.slice(0, 20) + '...');
console.log('STRAVA ID:', import.meta.env.VITE_STRAVA_CLIENT_ID);
```

**Résultat attendu:**
```
PROJECT_ID: anujltoavoafclklucdx
URL: https://anujltoavoafclklucdx.supabase.co
KEY: eyJhbGciOiJIUzI1NiIs...
STRAVA ID: 195798
```

### Test 2: Signup Fonctionne?

1. Allez sur `/signup` dans Lovable preview
2. Créez un compte
3. **✅ Devrait fonctionner** et vous rediriger vers `/home`
4. **❌ Si erreur "Auth config not found":**
   - Vérifiez que l'auth est activée sur Supabase externe
   - Allez sur: https://supabase.com/dashboard/project/anujltoavoafclklucdx/auth/providers

### Test 3: Tracking GPS?

1. Allez sur `/map`
2. Cliquez START
3. **✅ Devrait démarrer sans erreur "foreign key"**
4. **❌ Si erreur:**
   - Ouvrez `/gps-diagnostic`
   - Suivez les solutions proposées

## 📋 Checklist Complète

- [ ] Variables ajoutées dans Lovable Settings
- [ ] Redéploiement déclenché
- [ ] `import.meta.env.VITE_SUPABASE_URL` affiche la bonne URL
- [ ] Signup/Login fonctionne
- [ ] GPS tracking fonctionne sans erreur "foreign key"
- [ ] Strava OAuth fonctionne (si configuré)

## 🆘 Si Lovable N'a Pas d'Interface pour Variables

Certaines versions de Lovable ne permettent pas de configurer les variables manuellement.

**Solution Alternative:**

### Option 1: Utiliser les Variables Lovable par Défaut

Si Lovable gère automatiquement Supabase:
1. Lovable peut avoir une intégration Supabase automatique
2. Cherchez "Connect Supabase" dans les settings
3. Connectez votre instance externe: `anujltoavoafclklucdx`

### Option 2: Hardcoder Temporairement (PAS RECOMMANDÉ)

**⚠️ Uniquement pour tester, pas pour production!**

Modifiez temporairement `src/integrations/supabase/client.ts`:

```typescript
// TEMPORAIRE - À ENLEVER APRÈS TESTS!
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://anujltoavoafclklucdx.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Problèmes de cette approche:**
- ❌ Les secrets sont exposés dans le code
- ❌ Ça casse le local dev si .env existe
- ❌ Pas sécurisé

**Utilisez cette option SEULEMENT pour tester** si Lovable ne permet vraiment pas de configurer les variables.

### Option 3: Contacter le Support Lovable

1. Chat Lovable (en bas à droite)
2. Dites: "Je dois configurer des variables d'environnement personnalisées pour Supabase. Comment faire?"
3. Ils vous guideront vers la bonne interface

## 📚 Documentation Lovable

**Ressources utiles:**
- Docs Lovable: https://docs.lovable.dev
- Guide Environment Variables: Cherchez "env" dans la doc
- Support: Chat dans l'app Lovable

## 🎯 Résumé

**Le problème:** `.env` n'est pas commité → Lovable ne voit pas les nouvelles variables

**La solution:** Configurer manuellement dans Lovable Settings → Variables d'Environnement

**Le test:** `console.log(import.meta.env.VITE_SUPABASE_URL)` doit afficher `https://anujltoavoafclklucdx.supabase.co`

---

**Temps estimé:** 5-10 minutes
**Difficulté:** Facile (si vous trouvez les settings)
**Statut:** Étape critique pour que la migration fonctionne sur Lovable
