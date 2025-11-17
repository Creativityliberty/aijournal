# 🚀 Guide de Configuration Appwrite pour AI Journal

Ce guide vous explique comment configurer Appwrite pour votre application AI Journal étape par étape.

## 📋 Prérequis

- Un compte Appwrite Cloud (gratuit sur [cloud.appwrite.io](https://cloud.appwrite.io))
- Node.js 18+ installé
- Le projet ai-journal cloné localement

## 🎯 Étapes de Configuration

### 1️⃣ Créer un Projet Appwrite

Vous avez déjà un projet Appwrite configuré :
- **Project ID** : `691a6f970027876be2db`
- **Endpoint** : `https://fra.cloud.appwrite.io/v1`

✅ Cette partie est déjà faite !

### 2️⃣ Configurer la Plateforme Web

1. Allez dans votre projet Appwrite
2. Cliquez sur **Settings** → **Platforms**
3. Ajoutez une nouvelle **Web App** :
   - **Name** : AI Journal Local
   - **Hostname** : `localhost` (pour le développement)
4. Pour la production, ajoutez également votre domaine de déploiement

### 3️⃣ Créer la Base de Données

Dans la console Appwrite :

1. Allez dans **Databases** → **Create Database**
   - **Database ID** : `ai-journal-db`
   - **Name** : AI Journal Database

### 4️⃣ Créer les Collections

#### Collection 1 : journal_pages

1. Dans votre database, cliquez **Create Collection**
   - **Collection ID** : `journal_pages`
   - **Name** : Journal Pages

2. **Permissions** :
   - Cliquez sur **Settings** → **Permissions**
   - Ajoutez : `Role: Any` avec permissions `Create`, `Read`, `Update`, `Delete`
   - ⚠️ Pour la production, utilisez des permissions plus restrictives basées sur l'utilisateur

3. **Attributs** (Allez dans **Attributes** → **Create Attribute**) :

   | Attribut       | Type     | Size | Required | Default | Array |
   |----------------|----------|------|----------|---------|-------|
   | `userId`       | String   | 255  | ✅       | -       | ❌    |
   | `date`         | DateTime | -    | ✅       | -       | ❌    |
   | `previewImage` | String   | 2048 | ❌       | -       | ❌    |

4. **Indexes** (optionnel mais recommandé) :
   - Créez un index sur `userId` (pour des requêtes plus rapides)
   - Créez un index sur `date` (pour le tri)

#### Collection 2 : canvas_items

1. **Create Collection**
   - **Collection ID** : `canvas_items`
   - **Name** : Canvas Items

2. **Permissions** : Identiques à `journal_pages`

3. **Attributs** :

   | Attribut       | Type    | Size | Required | Default | Array |
   |----------------|---------|------|----------|---------|-------|
   | `pageId`       | String  | 255  | ✅       | -       | ❌    |
   | `type`         | String  | 50   | ✅       | -       | ❌    |
   | `content`      | String  | 4096 | ✅       | -       | ❌    |
   | `audioContent` | String  | 4096 | ❌       | -       | ❌    |
   | `positionX`    | Integer | -    | ✅       | 0       | ❌    |
   | `positionY`    | Integer | -    | ✅       | 0       | ❌    |
   | `width`        | Integer | -    | ✅       | 0       | ❌    |
   | `height`       | Integer | -    | ✅       | 0       | ❌    |
   | `zIndex`       | Integer | -    | ✅       | 0       | ❌    |

4. **Indexes** :
   - Créez un index sur `pageId` (pour récupérer tous les items d'une page rapidement)

### 5️⃣ Créer les Buckets de Storage

1. Allez dans **Storage** → **Create Bucket**

Créez 3 buckets :

#### Bucket 1 : Images
- **Bucket ID** : `images`
- **Name** : Images
- **Permissions** : `Role: Any` avec `Create`, `Read`, `Update`, `Delete`
- **File Size Limit** : 10 MB (10000000 bytes)
- **Allowed File Extensions** : `jpg`, `jpeg`, `png`, `gif`, `webp`
- **Compression** : `gzip` (optionnel)
- **Encryption** : Activé ✅
- **Antivirus** : Activé ✅

#### Bucket 2 : Videos
- **Bucket ID** : `videos`
- **Name** : Videos
- **Permissions** : Identiques
- **File Size Limit** : 50 MB (50000000 bytes)
- **Allowed File Extensions** : `mp4`, `webm`, `mov`, `avi`
- **Compression** : `none`
- **Encryption** : Activé ✅
- **Antivirus** : Activé ✅

#### Bucket 3 : Audio
- **Bucket ID** : `audio`
- **Name** : Audio Recordings
- **Permissions** : Identiques
- **File Size Limit** : 10 MB (10000000 bytes)
- **Allowed File Extensions** : `mp3`, `wav`, `webm`, `ogg`, `m4a`
- **Compression** : `gzip`
- **Encryption** : Activé ✅
- **Antivirus** : Activé ✅

### 6️⃣ Mettre à Jour les Variables d'Environnement

Le fichier [.env](.env) a déjà été mis à jour avec :

```env
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=691a6f970027876be2db
VITE_APPWRITE_DATABASE_ID=ai-journal-db
VITE_APPWRITE_PAGES_COLLECTION_ID=journal_pages
VITE_APPWRITE_ITEMS_COLLECTION_ID=canvas_items
VITE_APPWRITE_IMAGES_BUCKET_ID=images
VITE_APPWRITE_VIDEOS_BUCKET_ID=videos
VITE_APPWRITE_AUDIO_BUCKET_ID=audio
```

✅ Si vous avez utilisé des IDs différents, mettez-les à jour dans [.env](.env)

### 7️⃣ Installer les Dépendances

```bash
npm install appwrite
```

✅ Déjà fait !

### 8️⃣ Utiliser la Nouvelle Version avec Appwrite

Le fichier [App-appwrite.tsx](App-appwrite.tsx) contient la version intégrée avec Appwrite.

**Pour l'activer** :

```bash
# Sauvegarder l'ancienne version
mv App.tsx App-localStorage.tsx

# Utiliser la version Appwrite
mv App-appwrite.tsx App.tsx
```

Ou si vous préférez tester d'abord :

```bash
# Dans index.tsx, changez l'import
# De : import App from './App';
# À : import App from './App-appwrite';
```

### 9️⃣ Tester l'Application

```bash
npm run dev
```

Ouvrez [http://localhost:5173](http://localhost:5173) et testez :

1. ✅ Créer une nouvelle page
2. ✅ Ajouter des images (upload ou génération AI)
3. ✅ Enregistrer de l'audio avec transcription
4. ✅ Enregistrer des vidéos
5. ✅ Sauvegarder et recharger la page
6. ✅ Vérifier que les données persistent dans Appwrite

### 🔟 Vérifier dans la Console Appwrite

1. Allez dans **Databases** → `ai-journal-db` → `journal_pages`
   - Vous devriez voir vos pages créées
2. Vérifiez `canvas_items`
   - Vous devriez voir tous les éléments de vos pages
3. Allez dans **Storage** → vérifiez chaque bucket
   - Vous devriez voir les fichiers uploadés

## 🎨 Fonctionnalités Appwrite Implémentées

### ✅ Authentification
- Session anonyme automatique (pas besoin de compte utilisateur)
- Support pour ajouter l'authentification email/social plus tard

### ✅ Base de Données
- Pages de journal stockées avec métadonnées
- Items de canvas avec relations
- Requêtes optimisées avec indexes

### ✅ Storage
- Upload automatique des images, vidéos et audio
- Conversion base64 → fichier Appwrite
- URLs sécurisées pour l'affichage

### ✅ Synchronisation
- Sauvegarde automatique dans le cloud
- Chargement des données au démarrage
- Gestion des erreurs avec fallback localStorage

## 🔐 Sécurité & Permissions

### Pour le Développement (Current)
- Permissions `Any` : N'importe qui peut créer/lire/modifier/supprimer
- ⚠️ OK pour les tests locaux uniquement !

### Pour la Production (Recommandé)
1. Activez l'authentification Email/Password ou OAuth
2. Changez les permissions des collections :
   ```
   - Create: Role: Users
   - Read: Document Owner
   - Update: Document Owner
   - Delete: Document Owner
   ```
3. Idem pour les buckets Storage

## 📊 Monitoring & Analytics

Dans la console Appwrite, vous pouvez :
- **Usage** → Voir le nombre de documents, fichiers, bande passante
- **Logs** → Déboguer les erreurs
- **Analytics** → Statistiques d'utilisation

## 🚀 Déploiement en Production

### Variables d'Environnement Production

Ajoutez ces variables dans votre plateforme de déploiement (Vercel, Netlify, etc.) :

```env
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=691a6f970027876be2db
VITE_APPWRITE_DATABASE_ID=ai-journal-db
VITE_APPWRITE_PAGES_COLLECTION_ID=journal_pages
VITE_APPWRITE_ITEMS_COLLECTION_ID=canvas_items
VITE_APPWRITE_IMAGES_BUCKET_ID=images
VITE_APPWRITE_VIDEOS_BUCKET_ID=videos
VITE_APPWRITE_AUDIO_BUCKET_ID=audio
```

### Build

```bash
npm run build
```

Le dossier `dist/` contient votre application prête pour la production.

## 🆘 Dépannage

### Erreur CORS
**Problème** : `Access-Control-Allow-Origin` error
**Solution** : Vérifiez que vous avez ajouté `localhost` (dev) ou votre domaine (prod) dans **Settings → Platforms**

### Erreur 401 Unauthorized
**Problème** : `User (role: guests) missing scope (documents.write)`
**Solution** : Vérifiez les permissions de vos collections → ajoutez `Role: Any` avec les permissions nécessaires

### Fichiers trop volumineux
**Problème** : `File size exceeds limit`
**Solution** : Augmentez la limite dans **Storage → Bucket Settings → Maximum File Size**

### Les données ne se sauvegardent pas
**Problème** : Les pages créées disparaissent au refresh
**Solution** :
1. Vérifiez la console du navigateur pour les erreurs
2. Vérifiez que les IDs dans [.env](.env) correspondent à ceux dans Appwrite
3. Vérifiez les permissions des collections

## 🔄 Migration depuis localStorage

Si vous avez déjà des données dans localStorage, vous pouvez créer un script de migration :

```typescript
// migrations/migrateToAppwrite.ts
import { saveJournalPage } from './services/appwriteService';

const migrateLocalStorageToAppwrite = async (userId: string) => {
  const savedPages = localStorage.getItem('ai-journal-pages');
  if (!savedPages) return;

  const pages = JSON.parse(savedPages);

  for (const page of pages) {
    await saveJournalPage(page, userId);
  }

  console.log('Migration completed!');
};
```

## 📚 Ressources

- [Documentation Appwrite](https://appwrite.io/docs)
- [Appwrite React SDK](https://appwrite.io/docs/quick-starts/react)
- [Appwrite Discord](https://appwrite.io/discord) - Support communautaire
- [Appwrite GitHub](https://github.com/appwrite/appwrite)

## ✨ Prochaines Étapes

1. **Authentification Complète** : Implémenter email/password ou OAuth
2. **Partage** : Permettre le partage de pages entre utilisateurs
3. **Collaboration** : Édition collaborative en temps réel
4. **Offline Mode** : Support hors ligne avec synchronisation
5. **Export** : Export vers PDF, Notion, etc.

---

**Besoin d'aide ?** Ouvrez une issue ou contactez le support Appwrite !
