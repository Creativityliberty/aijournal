/**
 * Script pour mettre à jour le bucket 'images' pour accepter tous types de fichiers
 */

import { Client, Storage } from 'node-appwrite';

const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '691a6f970027876be2db';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';
const BUCKET_ID = 'images';

if (!APPWRITE_API_KEY) {
  console.error('❌ APPWRITE_API_KEY environment variable is required');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const storage = new Storage(client);

async function updateBucket() {
  console.log('🔧 Updating bucket to accept all file types...\n');

  try {
    // D'abord, récupérer les infos actuelles du bucket
    const bucket = await storage.getBucket(BUCKET_ID);
    console.log('📦 Bucket actuel:', bucket.name);
    console.log('📏 Taille max actuelle:', bucket.maximumFileSize, 'bytes');

    await storage.updateBucket(
      BUCKET_ID,
      'Files', // Nouveau nom plus générique
      undefined, // permissions (garder les existantes)
      undefined, // fileSecurity
      true, // enabled
      bucket.maximumFileSize, // Garder la taille maximale existante
      ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov', 'avi', 'mp3', 'wav', 'ogg', 'm4a'], // Tous types
      'none', // compression
      true, // encryption
      true // antivirus
    );

    console.log('✅ Bucket mis à jour avec succès !');
    console.log('\nTypes de fichiers acceptés :');
    console.log('  📷 Images: jpg, jpeg, png, gif, webp');
    console.log('  🎥 Vidéos: mp4, webm, mov, avi');
    console.log('  🎵 Audio: mp3, wav, ogg, m4a');
    console.log('  📦 Taille max: 50 MB\n');
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
  }
}

updateBucket();
