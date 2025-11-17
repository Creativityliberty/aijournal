# 🛠️ Script de Configuration Automatique Appwrite

Ce script configure automatiquement toutes les ressources Appwrite nécessaires pour AI Journal.

## 📋 Prérequis

1. Un projet Appwrite créé (✅ vous l'avez déjà : `691a6f970027876be2db`)
2. Une database créée (✅ vous l'avez : `691a7b05002d9a035b39`)
3. Une **clé API** avec les permissions nécessaires

## 🔑 Obtenir votre clé API Appwrite

### Étape 1 : Accéder aux paramètres du projet

1. Allez sur : https://cloud.appwrite.io/console/project-691a6f970027876be2db/settings
2. Cliquez sur l'onglet **API Keys** dans le menu de gauche

### Étape 2 : Créer une nouvelle clé API

1. Cliquez sur **Create API Key**
2. Configurez la clé :
   - **Name** : AI Journal Setup Script
   - **Expiration** : Never (ou une date future)
   - **Scopes** : Cochez les permissions suivantes :
     - ✅ `databases.read`
     - ✅ `databases.write`
     - ✅ `collections.read`
     - ✅ `collections.write`
     - ✅ `attributes.read`
     - ✅ `attributes.write`
     - ✅ `indexes.read`
     - ✅ `indexes.write`
     - ✅ `buckets.read`
     - ✅ `buckets.write`
     - ✅ `files.read`
     - ✅ `files.write`

3. Cliquez sur **Create**
4. **Copiez la clé API** (vous ne pourrez plus la voir après !)

## 🚀 Exécuter le script

### Option 1 : Avec variable d'environnement

```bash
cd /Volumes/Numtema/Vitel/ai-journal

# Remplacez YOUR_API_KEY par votre vraie clé API
APPWRITE_API_KEY=your_actual_api_key_here npx tsx scripts/setup-appwrite.ts
```

### Option 2 : Avec fichier .env.local

```bash
# Créer un fichier .env.local
echo "APPWRITE_API_KEY=your_actual_api_key_here" > .env.local

# Exécuter le script
npx tsx scripts/setup-appwrite.ts
```

## 📊 Ce que le script fait

Le script va automatiquement :

1. **Créer 2 collections** dans votre database :
   - ✅ `journal_pages` avec attributs userId, date, previewImage
   - ✅ `canvas_items` avec attributs pageId, type, content, positions, etc.

2. **Créer des indexes** pour optimiser les requêtes :
   - ✅ Index sur userId et date pour journal_pages
   - ✅ Index sur pageId pour canvas_items

3. **Créer 3 buckets Storage** :
   - ✅ `images` (10 MB max, jpg/png/gif/webp)
   - ✅ `videos` (50 MB max, mp4/webm/mov/avi)
   - ✅ `audio` (10 MB max, mp3/wav/webm/ogg/m4a)

4. **Configurer les permissions** :
   - ✅ Permissions `Role.any()` pour le développement
   - ⚠️ À changer en production pour `Role.users()` et `Document Owner`

5. **Vérifier l'installation** :
   - ✅ Liste toutes les collections créées
   - ✅ Liste tous les buckets créés

## ✅ Vérification

Après l'exécution réussie, vous devriez voir :

```
🚀 AI Journal - Appwrite Setup Script
=====================================

📍 Endpoint: https://fra.cloud.appwrite.io/v1
📁 Project ID: 691a6f970027876be2db
🗄️  Database ID: 691a7b05002d9a035b39

📚 Creating Collections...

Creating collection: journal_pages...
✅ Collection journal_pages created
  Adding attributes...
  ✓ userId
  ✓ date
  ✓ previewImage
  Adding indexes...
  ✓ userId_index
  ✓ date_index

Creating collection: canvas_items...
✅ Collection canvas_items created
  Adding attributes...
  ✓ pageId
  ✓ type
  ✓ content
  ✓ audioContent
  ✓ positionX
  ✓ positionY
  ✓ width
  ✓ height
  ✓ zIndex
  Adding indexes...
  ✓ pageId_index

📦 Creating Storage Buckets...

Creating bucket: Images...
✅ Bucket Images created
Creating bucket: Videos...
✅ Bucket Videos created
Creating bucket: Audio...
✅ Bucket Audio created

🔍 Verifying Setup...

✅ Collections found: 2
  - Journal Pages (journal_pages)
  - Canvas Items (canvas_items)

✅ Buckets found: 3
  - Images (images)
  - Videos (videos)
  - Audio (audio)

✨ Setup completed successfully!

📝 Next steps:
   1. Run: npm run dev
   2. Open: http://localhost:5173
   3. Create a journal page and verify it saves to Appwrite
```

## 🔍 Vérifier dans la console Appwrite

1. **Collections** : https://cloud.appwrite.io/console/project-691a6f970027876be2db/databases/database-691a7b05002d9a035b39
   - Vous devriez voir `journal_pages` et `canvas_items`

2. **Storage** : https://cloud.appwrite.io/console/project-691a6f970027876be2db/storage
   - Vous devriez voir les buckets `images`, `videos`, et `audio`

## ⚠️ Erreurs courantes

### Erreur : API Key required
**Problème** : La variable d'environnement `APPWRITE_API_KEY` n'est pas définie
**Solution** : Vérifiez que vous avez bien passé la clé API en paramètre

### Erreur : Unauthorized (401)
**Problème** : La clé API n'a pas les bonnes permissions
**Solution** : Créez une nouvelle clé API avec TOUTES les permissions listées ci-dessus

### Erreur : Resource already exists (409)
**Problème** : Une collection ou un bucket existe déjà avec le même ID
**Solution** : C'est normal ! Le script affichera juste un warning ⚠️ et continuera

### Erreur : Invalid API endpoint
**Problème** : L'endpoint Appwrite est incorrect
**Solution** : Vérifiez que vous utilisez bien `https://fra.cloud.appwrite.io/v1`

## 🎯 Prochaines étapes

Une fois le script exécuté avec succès :

1. **Activer la version Appwrite** :
   ```bash
   mv App.tsx App-localStorage.tsx
   mv App-appwrite.tsx App.tsx
   ```

2. **Lancer l'application** :
   ```bash
   npm run dev
   ```

3. **Tester** :
   - Créer une nouvelle page
   - Ajouter des images/vidéos/audio
   - Sauvegarder et recharger
   - Vérifier que les données persistent

4. **Vérifier dans Appwrite** :
   - Allez dans la console Appwrite
   - Vérifiez que vos documents apparaissent dans les collections
   - Vérifiez que vos fichiers sont dans les buckets Storage

🎉 Enjoy your AI Journal with Appwrite backend!
