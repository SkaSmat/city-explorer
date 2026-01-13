# 🔑 Comment Obtenir les Bonnes Clés Supabase

## ❌ Problème Actuel

Vous avez l'erreur: `Invalid API key`

**Cause:** Les variables d'environnement sur Lovable contiennent les clés internes de Lovable (`sb_publishable_...`) au lieu des clés de votre projet Supabase externe.

---

## ✅ Solution: Obtenir les Clés JWT de Supabase

### Étape 1: Aller sur le Dashboard Supabase

1. Ouvrez votre navigateur
2. Allez sur: https://supabase.com/dashboard
3. Connectez-vous à votre compte
4. Sélectionnez votre projet: **anujltoavoafclklucdx**

### Étape 2: Naviguer vers les Paramètres API

1. Dans le menu de gauche, cliquez sur **"Settings"** (icône d'engrenage)
2. Puis cliquez sur **"API"**
3. Vous verrez la section **"Project API keys"**

### Étape 3: Copier les Bonnes Clés

Vous verrez deux types de clés:

#### 📋 URL du Projet
```
https://anujltoavoafclklucdx.supabase.co
```
➡️ **C'est votre `VITE_SUPABASE_URL_GEO`**

#### 🔓 Anon Key (Public)
Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFudWpsdG9hdm9hZmNsa2x1Y2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1MjQxNTcsImV4cCI6MjA1MjEwMDE1N30....`

**Caractéristiques:**
- Commence par `eyJhbGc...`
- C'est un token JWT très long (plusieurs centaines de caractères)
- C'est la clé PUBLIQUE (safe pour le client)

➡️ **C'est votre `VITE_SUPABASE_ANON_KEY_GEO`**

#### 🔐 Service Role Key (Secrète)
Format similaire mais avec `"role":"service_role"` dedans

**⚠️ ATTENTION:**
- TRÈS sensible - bypass tous les RLS
- À utiliser UNIQUEMENT côté serveur
- NE JAMAIS exposer au client

➡️ **C'est votre `VITE_EXTERNAL_SUPABASE_SERVICE_KEY`**

---

## 📝 Étape 4: Configurer sur Lovable

### Où Configurer

1. Allez sur votre projet Lovable
2. Cliquez sur **"Settings"** ou **"Project Settings"**
3. Cherchez la section **"Environment Variables"**

### Quoi Mettre

Configurez ces 3 variables avec les valeurs que vous avez copiées:

| Variable | Valeur |
|----------|--------|
| `VITE_SUPABASE_URL_GEO` | `https://anujltoavoafclklucdx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY_GEO` | Le token JWT anon (commence par `eyJhbGc...`) |
| `VITE_EXTERNAL_SUPABASE_SERVICE_KEY` | Le token JWT service_role (commence par `eyJhbGc...`) |

### Format des Clés JWT

**✅ BON FORMAT (Supabase JWT):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFudWpsdG9hdm9hZmNsa2x1Y2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1MjQxNTcsImV4cCI6MjA1MjEwMDE1N30.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**❌ MAUVAIS FORMAT (Clés Lovable - ne pas utiliser):**
```
sb_publishable_...
sb_secret_...
```

---

## 🔄 Étape 5: Redéployer

1. Sauvegardez les variables d'environnement sur Lovable
2. Lovable va automatiquement redéployer l'application
3. Attendez 1-2 minutes
4. Rafraîchissez votre app
5. Ouvrez la console (F12)
6. Vous devriez voir: `✅ Badges query successful`

---

## 🧪 Vérification

Si tout est bien configuré, dans la console vous verrez:

```
🧪 Testing Supabase external connection...
✅ Badges query successful: [array of badges]
✅ Cache query successful: [...]
🎉 Connection to external Supabase OK!
```

Au lieu de:
```
❌ Badges query failed: {message: 'Invalid API key'}
```

---

## ❓ FAQ

### Q: Mes clés commencent par "sb_publishable_", c'est normal?
**R:** NON. Ce sont les clés internes de Lovable. Vous devez utiliser les clés JWT de votre projet Supabase externe.

### Q: Où trouver mes clés Supabase JWT?
**R:** Dashboard Supabase → Settings → API → Section "Project API keys"

### Q: Est-ce que je dois réinitialiser (reset) mes clés?
**R:** Seulement si vos clés actuelles ont été compromises (commitées dans Git, etc.). Sinon, utilisez les clés existantes.

### Q: Comment savoir si c'est un token JWT valide?
**R:** Un JWT Supabase:
- Commence par `eyJhbGc`
- Contient 3 parties séparées par des points: `xxxxx.yyyyy.zzzzz`
- Fait plusieurs centaines de caractères de long

---

## 📚 Ressources

- [Supabase API Settings](https://supabase.com/dashboard/project/_/settings/api)
- [Documentation Supabase Keys](https://supabase.com/docs/guides/api#api-url-and-keys)

---

**Fait par:** Claude AI
**Date:** 12 Janvier 2026
