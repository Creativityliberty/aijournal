import { Client, Databases, Storage, Account, ID, Query } from 'appwrite';
import { JournalPage, CanvasItem, ItemType } from '../types';

// Configuration Appwrite
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '691a6f970027876be2db');

export const databases = new Databases(client);
export const storage = new Storage(client);
export const account = new Account(client);

// IDs des ressources Appwrite (à définir dans votre console Appwrite)
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'ai-journal-db';
export const PAGES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PAGES_COLLECTION_ID || 'journal_pages';
export const ITEMS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_ITEMS_COLLECTION_ID || 'canvas_items';
// Note: Plan gratuit Appwrite = 1 seul bucket, on utilise 'images' pour tous les fichiers
export const FILES_BUCKET_ID = import.meta.env.VITE_APPWRITE_FILES_BUCKET_ID || 'images';

// Types Appwrite pour TypeScript
interface AppwriteJournalPage {
  $id: string;
  userId: string;
  date: string;
  previewImage?: string;
  $createdAt: string;
  $updatedAt: string;
}

interface AppwriteCanvasItem {
  $id: string;
  pageId: string;
  type: ItemType;
  content: string;
  audioContent?: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  zIndex: number;
}

/**
 * Convertit un fichier base64 en Blob
 */
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
};

/**
 * Upload un fichier vers Appwrite Storage
 */
export const uploadFile = async (
  base64Data: string,
  bucketId: string,
  mimeType: string
): Promise<string> => {
  try {
    const blob = base64ToBlob(base64Data, mimeType);
    const file = new File([blob], `${ID.unique()}.${mimeType.split('/')[1]}`, { type: mimeType });

    const response = await storage.createFile(bucketId, ID.unique(), file);

    // Retourne l'URL du fichier
    return storage.getFileView(bucketId, response.$id).toString();
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Sauvegarde une page de journal dans Appwrite
 */
export const saveJournalPage = async (
  page: JournalPage,
  userId: string
): Promise<string> => {
  try {
    // 1. Upload de l'image de prévisualisation si présente
    let previewImageUrl: string | undefined;
    if (page.previewImage && page.previewImage.startsWith('data:')) {
      const mimeType = page.previewImage.split(';')[0].split(':')[1];
      previewImageUrl = await uploadFile(page.previewImage, FILES_BUCKET_ID, mimeType);
    } else {
      previewImageUrl = page.previewImage;
    }

    // 2. Créer ou mettre à jour la page
    const pageData: Omit<AppwriteJournalPage, '$id' | '$createdAt' | '$updatedAt'> = {
      userId,
      date: page.date,
      previewImage: previewImageUrl,
    };

    let savedPage: AppwriteJournalPage;

    // Vérifier si la page existe déjà
    try {
      await databases.getDocument(DATABASE_ID, PAGES_COLLECTION_ID, page.id);
      // La page existe, on la met à jour
      savedPage = await databases.updateDocument(
        DATABASE_ID,
        PAGES_COLLECTION_ID,
        page.id,
        pageData
      );
    } catch {
      // La page n'existe pas, on la crée
      savedPage = await databases.createDocument(
        DATABASE_ID,
        PAGES_COLLECTION_ID,
        page.id,
        pageData
      );
    }

    // 3. Sauvegarder les items
    for (const item of page.items) {
      await saveCanvasItem(item, savedPage.$id);
    }

    return savedPage.$id;
  } catch (error) {
    console.error('Error saving journal page:', error);
    throw error;
  }
};

/**
 * Sauvegarde un item de canvas dans Appwrite
 */
const saveCanvasItem = async (item: CanvasItem, pageId: string): Promise<void> => {
  try {
    let contentUrl = item.content;
    let audioUrl = item.audioContent;

    // Upload du contenu si c'est du base64
    if (item.type === ItemType.IMAGE && item.content.startsWith('data:')) {
      const mimeType = item.content.split(';')[0].split(':')[1];
      contentUrl = await uploadFile(item.content, FILES_BUCKET_ID, mimeType);
    } else if (item.type === ItemType.VIDEO && item.content.startsWith('data:')) {
      const mimeType = item.content.split(';')[0].split(':')[1];
      contentUrl = await uploadFile(item.content, FILES_BUCKET_ID, mimeType);
    }

    // Upload de l'audio si présent
    if (audioUrl && audioUrl.startsWith('data:')) {
      const mimeType = audioUrl.split(';')[0].split(':')[1];
      audioUrl = await uploadFile(audioUrl, FILES_BUCKET_ID, mimeType);
    }

    const itemData: Omit<AppwriteCanvasItem, '$id'> = {
      pageId,
      type: item.type,
      content: contentUrl,
      audioContent: audioUrl,
      positionX: item.position.x,
      positionY: item.position.y,
      width: item.size.width,
      height: item.size.height,
      zIndex: item.zIndex,
    };

    // Vérifier si l'item existe déjà
    try {
      await databases.getDocument(DATABASE_ID, ITEMS_COLLECTION_ID, item.id);
      // L'item existe, on le met à jour
      await databases.updateDocument(DATABASE_ID, ITEMS_COLLECTION_ID, item.id, itemData);
    } catch {
      // L'item n'existe pas, on le crée
      await databases.createDocument(DATABASE_ID, ITEMS_COLLECTION_ID, item.id, itemData);
    }
  } catch (error) {
    console.error('Error saving canvas item:', error);
    throw error;
  }
};

/**
 * Récupère toutes les pages d'un utilisateur
 */
export const getUserPages = async (userId: string): Promise<JournalPage[]> => {
  try {
    const response = await databases.listDocuments<AppwriteJournalPage>(
      DATABASE_ID,
      PAGES_COLLECTION_ID,
      [Query.equal('userId', userId), Query.orderDesc('date')]
    );

    const pages: JournalPage[] = [];

    for (const doc of response.documents) {
      const items = await getPageItems(doc.$id);
      pages.push({
        id: doc.$id,
        date: doc.date,
        items,
        previewImage: doc.previewImage,
      });
    }

    return pages;
  } catch (error) {
    console.error('Error fetching user pages:', error);
    throw error;
  }
};

/**
 * Récupère les items d'une page
 */
const getPageItems = async (pageId: string): Promise<CanvasItem[]> => {
  try {
    const response = await databases.listDocuments<AppwriteCanvasItem>(
      DATABASE_ID,
      ITEMS_COLLECTION_ID,
      [Query.equal('pageId', pageId)]
    );

    return response.documents.map(doc => ({
      id: doc.$id,
      type: doc.type,
      content: doc.content,
      audioContent: doc.audioContent,
      position: { x: doc.positionX, y: doc.positionY },
      size: { width: doc.width, height: doc.height },
      zIndex: doc.zIndex,
    }));
  } catch (error) {
    console.error('Error fetching page items:', error);
    throw error;
  }
};

/**
 * Supprime une page et tous ses items
 */
export const deletePage = async (pageId: string): Promise<void> => {
  try {
    // Supprimer tous les items de la page
    const items = await databases.listDocuments(
      DATABASE_ID,
      ITEMS_COLLECTION_ID,
      [Query.equal('pageId', pageId)]
    );

    for (const item of items.documents) {
      await databases.deleteDocument(DATABASE_ID, ITEMS_COLLECTION_ID, item.$id);
    }

    // Supprimer la page
    await databases.deleteDocument(DATABASE_ID, PAGES_COLLECTION_ID, pageId);
  } catch (error) {
    console.error('Error deleting page:', error);
    throw error;
  }
};

/**
 * Authentification anonyme (pour tester rapidement)
 */
export const loginAnonymously = async (): Promise<string> => {
  try {
    const session = await account.createAnonymousSession();
    return session.userId;
  } catch (error) {
    console.error('Error logging in anonymously:', error);
    throw error;
  }
};

/**
 * Récupère l'utilisateur actuel
 */
export const getCurrentUser = async () => {
  try {
    return await account.get();
  } catch (error) {
    console.error('No active session:', error);
    return null;
  }
};
