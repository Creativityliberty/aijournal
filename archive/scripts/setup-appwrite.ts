/**
 * Script de configuration automatique Appwrite pour AI Journal
 *
 * Ce script crée automatiquement :
 * - Les collections (journal_pages, canvas_items)
 * - Les attributs pour chaque collection
 * - Les buckets Storage (images, videos, audio)
 * - Les permissions appropriées
 *
 * Usage: npx tsx scripts/setup-appwrite.ts
 */

import { Client, Databases, Storage, Permission, Role } from 'node-appwrite';

// Configuration
const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '691a6f970027876be2db';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';

const DATABASE_ID = '691a7b05002d9a035b39';
const PAGES_COLLECTION_ID = 'journal_pages';
const ITEMS_COLLECTION_ID = 'canvas_items';
const IMAGES_BUCKET_ID = 'images';
const VIDEOS_BUCKET_ID = 'videos';
const AUDIO_BUCKET_ID = 'audio';

if (!APPWRITE_API_KEY) {
  console.error('❌ APPWRITE_API_KEY environment variable is required');
  console.log('📝 Get your API key from: https://cloud.appwrite.io/console/project-691a6f970027876be2db/settings');
  console.log('   Then run: APPWRITE_API_KEY=your_key npx tsx scripts/setup-appwrite.ts');
  process.exit(1);
}

// Initialize Appwrite Client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

async function createCollections() {
  console.log('\n📚 Creating Collections...\n');

  // 1. Collection: journal_pages
  try {
    console.log('Creating collection: journal_pages...');
    await databases.createCollection(
      DATABASE_ID,
      PAGES_COLLECTION_ID,
      'Journal Pages',
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ]
    );
    console.log('✅ Collection journal_pages created');

    // Attributs pour journal_pages
    console.log('  Adding attributes...');

    await databases.createStringAttribute(
      DATABASE_ID,
      PAGES_COLLECTION_ID,
      'userId',
      255,
      true // required
    );
    console.log('  ✓ userId');

    await databases.createDatetimeAttribute(
      DATABASE_ID,
      PAGES_COLLECTION_ID,
      'date',
      true // required
    );
    console.log('  ✓ date');

    await databases.createStringAttribute(
      DATABASE_ID,
      PAGES_COLLECTION_ID,
      'previewImage',
      2048,
      false // optional
    );
    console.log('  ✓ previewImage');

    // Créer des indexes
    console.log('  Adding indexes...');
    await databases.createIndex(
      DATABASE_ID,
      PAGES_COLLECTION_ID,
      'userId_index',
      'key',
      ['userId']
    );
    console.log('  ✓ userId_index');

    await databases.createIndex(
      DATABASE_ID,
      PAGES_COLLECTION_ID,
      'date_index',
      'key',
      ['date'],
      ['DESC']
    );
    console.log('  ✓ date_index');

  } catch (error: any) {
    if (error.code === 409) {
      console.log('⚠️  Collection journal_pages already exists');
    } else {
      console.error('❌ Error creating journal_pages:', error.message);
    }
  }

  // 2. Collection: canvas_items
  try {
    console.log('\nCreating collection: canvas_items...');
    await databases.createCollection(
      DATABASE_ID,
      ITEMS_COLLECTION_ID,
      'Canvas Items',
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ]
    );
    console.log('✅ Collection canvas_items created');

    // Attributs pour canvas_items
    console.log('  Adding attributes...');

    await databases.createStringAttribute(
      DATABASE_ID,
      ITEMS_COLLECTION_ID,
      'pageId',
      255,
      true
    );
    console.log('  ✓ pageId');

    await databases.createStringAttribute(
      DATABASE_ID,
      ITEMS_COLLECTION_ID,
      'type',
      50,
      true
    );
    console.log('  ✓ type');

    await databases.createStringAttribute(
      DATABASE_ID,
      ITEMS_COLLECTION_ID,
      'content',
      4096,
      true
    );
    console.log('  ✓ content');

    await databases.createStringAttribute(
      DATABASE_ID,
      ITEMS_COLLECTION_ID,
      'audioContent',
      4096,
      false
    );
    console.log('  ✓ audioContent');

    await databases.createIntegerAttribute(
      DATABASE_ID,
      ITEMS_COLLECTION_ID,
      'positionX',
      true,
      0,
      10000,
      0
    );
    console.log('  ✓ positionX');

    await databases.createIntegerAttribute(
      DATABASE_ID,
      ITEMS_COLLECTION_ID,
      'positionY',
      true,
      0,
      10000,
      0
    );
    console.log('  ✓ positionY');

    await databases.createIntegerAttribute(
      DATABASE_ID,
      ITEMS_COLLECTION_ID,
      'width',
      true,
      0,
      5000,
      0
    );
    console.log('  ✓ width');

    await databases.createIntegerAttribute(
      DATABASE_ID,
      ITEMS_COLLECTION_ID,
      'height',
      true,
      0,
      5000,
      0
    );
    console.log('  ✓ height');

    await databases.createIntegerAttribute(
      DATABASE_ID,
      ITEMS_COLLECTION_ID,
      'zIndex',
      true,
      0,
      10000,
      0
    );
    console.log('  ✓ zIndex');

    // Index
    console.log('  Adding indexes...');
    await databases.createIndex(
      DATABASE_ID,
      ITEMS_COLLECTION_ID,
      'pageId_index',
      'key',
      ['pageId']
    );
    console.log('  ✓ pageId_index');

  } catch (error: any) {
    if (error.code === 409) {
      console.log('⚠️  Collection canvas_items already exists');
    } else {
      console.error('❌ Error creating canvas_items:', error.message);
    }
  }
}

async function createBuckets() {
  console.log('\n📦 Creating Storage Buckets...\n');

  const buckets = [
    {
      id: IMAGES_BUCKET_ID,
      name: 'Images',
      maxFileSize: 10 * 1024 * 1024, // 10 MB
      allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    },
    {
      id: VIDEOS_BUCKET_ID,
      name: 'Videos',
      maxFileSize: 50 * 1024 * 1024, // 50 MB
      allowedExtensions: ['mp4', 'webm', 'mov', 'avi'],
    },
    {
      id: AUDIO_BUCKET_ID,
      name: 'Audio',
      maxFileSize: 10 * 1024 * 1024, // 10 MB
      allowedExtensions: ['mp3', 'wav', 'webm', 'ogg', 'm4a'],
    },
  ];

  for (const bucket of buckets) {
    try {
      console.log(`Creating bucket: ${bucket.name}...`);
      await storage.createBucket(
        bucket.id,
        bucket.name,
        [
          Permission.read(Role.any()),
          Permission.create(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
        ],
        false, // fileSecurity
        true, // enabled
        bucket.maxFileSize,
        bucket.allowedExtensions,
        'none', // compression (use 'gzip' for audio/images if needed)
        true, // encryption
        true // antivirus
      );
      console.log(`✅ Bucket ${bucket.name} created`);
    } catch (error: any) {
      if (error.code === 409) {
        console.log(`⚠️  Bucket ${bucket.name} already exists`);
      } else {
        console.error(`❌ Error creating bucket ${bucket.name}:`, error.message);
      }
    }
  }
}

async function verifySetup() {
  console.log('\n🔍 Verifying Setup...\n');

  try {
    // Vérifier les collections
    const collections = await databases.listCollections(DATABASE_ID);
    console.log('✅ Collections found:', collections.total);
    collections.collections.forEach(col => {
      console.log(`  - ${col.name} (${col.$id})`);
    });

    // Vérifier les buckets
    const buckets = await storage.listBuckets();
    console.log('\n✅ Buckets found:', buckets.total);
    buckets.buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.$id})`);
    });

    console.log('\n✨ Setup completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Open: http://localhost:5173');
    console.log('   3. Create a journal page and verify it saves to Appwrite\n');
  } catch (error: any) {
    console.error('❌ Error verifying setup:', error.message);
  }
}

async function main() {
  console.log('🚀 AI Journal - Appwrite Setup Script');
  console.log('=====================================\n');
  console.log(`📍 Endpoint: ${APPWRITE_ENDPOINT}`);
  console.log(`📁 Project ID: ${APPWRITE_PROJECT_ID}`);
  console.log(`🗄️  Database ID: ${DATABASE_ID}\n`);

  try {
    await createCollections();
    await createBuckets();
    await verifySetup();
  } catch (error: any) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
