# Plan d'Intégration Appwrite Complet
## AI Journal - Transformation vers Architecture Cloud

---

## 🎯 Objectif
Transformer AI Journal d'une app avec données locales vers une application cloud complète avec:
- Authentification utilisateurs (Email/Password + OAuth)
- Base de données multi-utilisateurs
- Partage et collaboration
- Synchronisation temps réel multi-device
- Storage optimisé pour médias
- Dashboard admin et analytics

---

## 📊 Architecture Actuelle vs Cible

### Actuel
```
├── localStorage fallback
├── Appwrite anonymous sessions (pas de users)
├── initialData.ts (données exemple statiques)
└── Un seul bucket pour tous les fichiers
```

### Cible
```
├── Authentification complète (Email + Google + Apple)
├── Users avec profils et préférences
├── Collections Appwrite optimisées
├── Permissions granulaires (read/write/share)
├── Storage hiérarchisé par type de média
├── Real-time sync entre devices
└── Admin dashboard + analytics
```

---

## 🗄️ Schéma Database Appwrite

### Collection 1: `users` (via Appwrite Auth + custom attributes)
```javascript
// Attributs custom users (via Account.updatePrefs())
{
  displayName: string,
  avatarUrl: string,
  createdAt: datetime,
  plan: 'free' | 'pro' | 'enterprise',
  storageUsed: number (bytes),
  storageLimit: number (bytes),
  preferences: {
    theme: 'light' | 'dark',
    language: string,
    notifications: boolean
  }
}
```

### Collection 2: `journal_pages`
```javascript
{
  $id: string,
  userId: string (relationship → users),
  title: string,
  date: datetime,
  previewImageId: string (relationship → files),
  tags: string[] (array),
  mood: string (optional),
  weather: string (optional),
  isPublic: boolean,
  sharedWith: string[] (array of userIds),
  collaborators: string[] (array of userIds with edit rights),
  createdAt: datetime,
  updatedAt: datetime,

  // Permissions
  $permissions: [
    Permission.read(Role.user(userId)),
    Permission.write(Role.user(userId)),
    Permission.read(Role.users(sharedWith)),
    Permission.write(Role.users(collaborators))
  ]
}

// Indexes
- userId (key index)
- date (DESC)
- tags (fulltext)
- createdAt (DESC)
```

### Collection 3: `canvas_items`
```javascript
{
  $id: string,
  pageId: string (relationship → journal_pages),
  type: 'IMAGE' | 'TEXT' | 'VIDEO',

  // Content
  content: string (text content OR fileId for media),
  audioContentId: string (optional, fileId for audio),

  // Position et style
  positionX: number,
  positionY: number,
  width: number,
  height: number,
  zIndex: number,
  rotation: number (optional),
  opacity: number (optional, 0-100),

  // Metadata
  createdAt: datetime,
  updatedAt: datetime,
  createdBy: string (userId),

  // AI metadata
  generatedByAI: boolean,
  aiModel: string (optional, ex: 'gemini-imagen-4.0'),
  aiPrompt: string (optional),

  // Permissions (héritées de la page)
  $permissions: [inherit from journal_pages]
}

// Indexes
- pageId (key index)
- type (key index)
- zIndex
- createdAt (DESC)
```

### Collection 4: `shared_pages`
```javascript
{
  $id: string,
  pageId: string (relationship → journal_pages),
  sharedBy: string (userId),
  sharedWith: string (userId OR email),
  permission: 'view' | 'edit',
  expiresAt: datetime (optional),
  accessCount: number,
  lastAccessedAt: datetime,
  createdAt: datetime,

  $permissions: [
    Permission.read(Role.user(sharedBy)),
    Permission.read(Role.user(sharedWith)),
    Permission.write(Role.user(sharedBy))
  ]
}

// Indexes
- pageId
- sharedWith
- sharedBy
- expiresAt
```

### Collection 5: `analytics`
```javascript
{
  $id: string,
  userId: string,
  date: datetime,

  // Métriques
  pagesCreated: number,
  itemsAdded: number,
  imagesGenerated: number,
  audioTranscribed: number,
  videosRecorded: number,

  // Storage
  storageUsedBytes: number,

  // AI usage
  aiTokensUsed: number,
  aiCost: number,

  $permissions: [
    Permission.read(Role.user(userId)),
    Permission.write(Role.user('admin'))
  ]
}

// Indexes
- userId
- date (DESC)
```

---

## 🔐 Système d'Authentification

### 1. Providers
```javascript
// Email/Password
await account.create(ID.unique(), email, password, name);
await account.createEmailSession(email, password);

// OAuth Providers
await account.createOAuth2Session('google', successUrl, failureUrl);
await account.createOAuth2Session('apple', successUrl, failureUrl);
await account.createOAuth2Session('github', successUrl, failureUrl);

// Magic URL (passwordless)
await account.createMagicURLSession(email, magicUrl);
```

### 2. User Profile Management
```javascript
// services/authService.ts
export const createUserProfile = async (userId: string, data: UserProfile) => {
  await account.updatePrefs({
    displayName: data.displayName,
    avatarUrl: data.avatarUrl,
    plan: 'free',
    storageUsed: 0,
    storageLimit: 2 * 1024 * 1024 * 1024, // 2GB free plan
  });
};

export const updateUserAvatar = async (file: File) => {
  const uploaded = await storage.createFile(
    'avatars',
    ID.unique(),
    file
  );
  await account.updatePrefs({ avatarUrl: uploaded.$id });
};
```

### 3. Session Management
```javascript
// Gestion multi-device
export const getUserSessions = async () => {
  return await account.listSessions();
};

export const deleteSession = async (sessionId: string) => {
  await account.deleteSession(sessionId);
};
```

---

## 📁 Organisation Storage

### Buckets
```javascript
// Bucket 1: user-images (photos uploadées)
{
  $id: 'user-images',
  permissions: [Permission.read(Role.any())],
  fileSecurity: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  compression: 'gzip',
  encryption: true
}

// Bucket 2: ai-generated-images
{
  $id: 'ai-generated',
  permissions: [Permission.read(Role.any())],
  fileSecurity: true,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFileExtensions: ['jpg', 'jpeg', 'png'],
  compression: 'gzip'
}

// Bucket 3: videos
{
  $id: 'videos',
  permissions: [Permission.read(Role.any())],
  fileSecurity: true,
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedFileExtensions: ['mp4', 'webm', 'mov', 'avi'],
  compression: 'gzip'
}

// Bucket 4: audio
{
  $id: 'audio',
  permissions: [Permission.read(Role.any())],
  fileSecurity: true,
  maxFileSize: 25 * 1024 * 1024, // 25MB
  allowedFileExtensions: ['mp3', 'wav', 'ogg', 'm4a', 'webm'],
  compression: 'gzip'
}

// Bucket 5: avatars
{
  $id: 'avatars',
  permissions: [Permission.read(Role.any())],
  fileSecurity: true,
  maxFileSize: 2 * 1024 * 1024, // 2MB
  allowedFileExtensions: ['jpg', 'jpeg', 'png'],
  compression: 'gzip'
}
```

### Upload Optimisé avec Compression Client-Side
```javascript
// services/storageService.ts
export const uploadImage = async (
  file: File,
  bucketId: string,
  userId: string
) => {
  // 1. Compress image client-side
  const compressed = await compressImage(file, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8
  });

  // 2. Upload to Appwrite
  const uploaded = await storage.createFile(
    bucketId,
    ID.unique(),
    compressed,
    [
      Permission.read(Role.user(userId)),
      Permission.write(Role.user(userId)),
      Permission.delete(Role.user(userId))
    ]
  );

  // 3. Update user storage usage
  await updateStorageUsage(userId, compressed.size);

  return uploaded;
};
```

---

## 🔄 Real-Time Synchronisation

### 1. Subscribe to Page Updates
```javascript
// hooks/useRealtimePages.ts
export const useRealtimePages = (userId: string) => {
  const [pages, setPages] = useState<JournalPage[]>([]);

  useEffect(() => {
    // Subscribe to journal_pages collection
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${PAGES_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload;

        if (payload.userId !== userId) return; // Filter by user

        if (response.events.includes('create')) {
          setPages(prev => [...prev, payload]);
        } else if (response.events.includes('update')) {
          setPages(prev =>
            prev.map(p => p.$id === payload.$id ? payload : p)
          );
        } else if (response.events.includes('delete')) {
          setPages(prev => prev.filter(p => p.$id !== payload.$id));
        }
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return pages;
};
```

### 2. Real-Time Collaboration
```javascript
// Multiple users editing same page
export const useRealtimeCollaboration = (pageId: string) => {
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [items, setItems] = useState<CanvasItem[]>([]);

  useEffect(() => {
    // Subscribe to canvas_items for this page
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${ITEMS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload;

        if (payload.pageId !== pageId) return;

        // Update items in real-time
        if (response.events.includes('create')) {
          setItems(prev => [...prev, payload]);
          showNotification(`${payload.createdBy} added an item`);
        }
        // ... handle update/delete
      }
    );

    return () => unsubscribe();
  }, [pageId]);

  return { activeUsers, items };
};
```

---

## 🚀 Migration Strategy

### Phase 1: Setup Database
```javascript
// scripts/setup-appwrite-complete.ts
import { Client, Databases, Storage, Users } from 'node-appwrite';

const setupDatabase = async () => {
  // 1. Create collections
  await createJournalPagesCollection();
  await createCanvasItemsCollection();
  await createSharedPagesCollection();
  await createAnalyticsCollection();

  // 2. Create indexes
  await createIndexes();

  // 3. Setup storage buckets
  await setupStorageBuckets();

  console.log('✅ Database setup complete');
};
```

### Phase 2: Migrate Existing Data
```javascript
// scripts/migrate-data.ts
export const migrateInitialData = async (userId: string) => {
  const { initialData } = await import('./data/initialData');

  for (const page of initialData) {
    // Create page document
    const pageDoc = await databases.createDocument(
      DATABASE_ID,
      PAGES_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        title: `Migrated Page ${page.id}`,
        date: page.date,
        tags: [],
        isPublic: false,
        sharedWith: [],
        collaborators: []
      }
    );

    // Migrate items
    for (const item of page.items) {
      // Upload media if needed
      let contentRef = item.content;
      if (item.type === 'IMAGE' || item.type === 'VIDEO') {
        const file = await uploadBase64ToStorage(item.content, item.type);
        contentRef = file.$id;
      }

      // Create item document
      await databases.createDocument(
        DATABASE_ID,
        ITEMS_COLLECTION_ID,
        ID.unique(),
        {
          pageId: pageDoc.$id,
          type: item.type,
          content: contentRef,
          positionX: item.position.x,
          positionY: item.position.y,
          width: item.size.width,
          height: item.size.height,
          zIndex: item.zIndex,
          createdBy: userId
        }
      );
    }
  }

  console.log('✅ Data migration complete');
};
```

### Phase 3: User Migration
```javascript
// Convert anonymous sessions to real users
export const convertAnonymousUser = async (email: string, password: string) => {
  // Get current anonymous session
  const user = await account.get();

  if (!user.emailVerification) {
    // Update to email account
    await account.updateEmail(email, password);
    await account.createVerification('http://localhost:3000/verify');
  }
};
```

---

## 🎨 Nouvelles Features

### 1. Partage de Pages
```javascript
// components/SharePageModal.tsx
export const SharePageModal = ({ page }: { page: JournalPage }) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');

  const handleShare = async () => {
    await databases.createDocument(
      DATABASE_ID,
      'shared_pages',
      ID.unique(),
      {
        pageId: page.$id,
        sharedBy: currentUser.$id,
        sharedWith: email,
        permission,
        accessCount: 0
      }
    );

    // Send email notification
    await sendShareNotification(email, page.title, currentUser.name);
  };

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email to share with"
      />
      <select value={permission} onChange={(e) => setPermission(e.target.value)}>
        <option value="view">View only</option>
        <option value="edit">Can edit</option>
      </select>
      <button onClick={handleShare}>Share</button>
    </div>
  );
};
```

### 2. Tags et Recherche
```javascript
// services/searchService.ts
export const searchPages = async (
  userId: string,
  query: string,
  filters: {
    tags?: string[],
    dateFrom?: string,
    dateTo?: string,
    mood?: string
  }
) => {
  const queries = [
    Query.equal('userId', userId),
    Query.search('title', query)
  ];

  if (filters.tags?.length) {
    queries.push(Query.equal('tags', filters.tags));
  }

  if (filters.dateFrom) {
    queries.push(Query.greaterThanEqual('date', filters.dateFrom));
  }

  if (filters.dateTo) {
    queries.push(Query.lessThanEqual('date', filters.dateTo));
  }

  return await databases.listDocuments(
    DATABASE_ID,
    PAGES_COLLECTION_ID,
    queries
  );
};
```

### 3. Analytics Dashboard
```javascript
// components/Dashboard.tsx
export const AnalyticsDashboard = () => {
  const { data: analytics } = useAnalytics();

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        title="Total Pages"
        value={analytics.totalPages}
        icon={<DocumentIcon />}
      />
      <StatCard
        title="AI Images Generated"
        value={analytics.aiImagesGenerated}
        icon={<SparklesIcon />}
      />
      <StatCard
        title="Storage Used"
        value={formatBytes(analytics.storageUsed)}
        icon={<CloudIcon />}
      />
      <StatCard
        title="Shared Pages"
        value={analytics.sharedPages}
        icon={<ShareIcon />}
      />

      <div className="col-span-4">
        <ActivityChart data={analytics.dailyActivity} />
      </div>
    </div>
  );
};
```

### 4. Export Complet
```javascript
// services/exportService.ts
export const exportAllData = async (userId: string) => {
  // Get all user data
  const pages = await getUserPages(userId);
  const analytics = await getAnalytics(userId);
  const profile = await account.getPrefs();

  // Download files
  const files = await downloadAllFiles(pages);

  // Create ZIP
  const zip = new JSZip();
  zip.file('data.json', JSON.stringify({ pages, analytics, profile }));

  files.forEach(file => {
    zip.file(`media/${file.name}`, file.blob);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `ai-journal-export-${Date.now()}.zip`);
};
```

---

## 📝 Prochaines Étapes

1. **Créer script setup complet** (`scripts/setup-appwrite-complete.ts`)
2. **Implémenter AuthService** avec tous les providers
3. **Créer composants UI** (Login, Register, Profile, Share)
4. **Migrer appwriteService.ts** vers nouvelle architecture
5. **Ajouter Real-time hooks**
6. **Implémenter Dashboard Analytics**
7. **Tests end-to-end**
8. **Documentation utilisateur**

---

## 🎯 Résultat Final

Une application AI Journal complète avec:
- ✅ Multi-utilisateurs avec auth sécurisée
- ✅ Synchronisation temps réel entre devices
- ✅ Partage et collaboration
- ✅ Storage optimisé et sécurisé
- ✅ Analytics et insights
- ✅ Export/Import complet des données
- ✅ Interface moderne et responsive
- ✅ Performance optimale
