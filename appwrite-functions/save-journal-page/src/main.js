import { Client, Databases, Storage, ID } from 'node-appwrite';

/**
 * Appwrite Function pour sauvegarder une page de journal
 *
 * Endpoints:
 * POST /save-page - Sauvegarder une page
 * GET /get-pages - Récupérer toutes les pages
 * DELETE /delete-page/:pageId - Supprimer une page
 */

export default async ({ req, res, log, error }) => {
  // Configuration Appwrite avec le dynamic API key
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key']);

  const databases = new Databases(client);
  const storage = new Storage(client);

  const DATABASE_ID = '691a7b05002d9a035b39';
  const PAGES_COLLECTION = 'journal_pages';
  const ITEMS_COLLECTION = 'canvas_items';
  const FILES_BUCKET = 'images';

  try {
    // Parser le body
    const body = req.bodyJson;

    // Router selon la méthode et le path
    const path = req.path;
    const method = req.method;

    // GET /get-pages - Récupérer toutes les pages d'un utilisateur
    if (method === 'GET' && path === '/get-pages') {
      const userId = req.headers['x-appwrite-user-id'] || 'anonymous';

      const pagesResponse = await databases.listDocuments(
        DATABASE_ID,
        PAGES_COLLECTION,
        [
          Query.equal('userId', userId),
          Query.orderDesc('date'),
        ]
      );

      const pages = [];
      for (const pageDoc of pagesResponse.documents) {
        const itemsResponse = await databases.listDocuments(
          DATABASE_ID,
          ITEMS_COLLECTION,
          [Query.equal('pageId', pageDoc.$id)]
        );

        const items = itemsResponse.documents.map(item => ({
          id: item.$id,
          type: item.type,
          content: item.content,
          audioContent: item.audioContent,
          position: { x: item.positionX, y: item.positionY },
          size: { width: item.width, height: item.height },
          zIndex: item.zIndex,
        }));

        pages.push({
          id: pageDoc.$id,
          date: pageDoc.date,
          items,
          previewImage: pageDoc.previewImage,
        });
      }

      return res.json({ pages });
    }

    // POST /save-page - Sauvegarder une page
    if (method === 'POST' && path === '/save-page') {
      const { page } = body;
      const userId = req.headers['x-appwrite-user-id'] || 'anonymous';

      if (!page) {
        return res.json({ error: 'Page data is required' }, 400);
      }

      // Fonction helper pour upload de fichiers base64
      const uploadBase64File = async (base64Data) => {
        if (!base64Data || !base64Data.startsWith('data:')) {
          return base64Data;
        }

        try {
          const [header, data] = base64Data.split(',');
          const mimeType = header.match(/data:(.*?);/)[1];
          const extension = mimeType.split('/')[1];

          const buffer = Buffer.from(data, 'base64');
          const blob = new Blob([buffer], { type: mimeType });
          const file = new File([blob], `${ID.unique()}.${extension}`, { type: mimeType });

          const fileId = ID.unique();
          const uploadedFile = await storage.createFile(FILES_BUCKET, fileId, file);

          return storage.getFileView(FILES_BUCKET, uploadedFile.$id).toString();
        } catch (err) {
          error('Error uploading file:', err);
          return base64Data;
        }
      };

      // Upload preview image si nécessaire
      let previewImageUrl = page.previewImage;
      if (previewImageUrl && previewImageUrl.startsWith('data:')) {
        previewImageUrl = await uploadBase64File(previewImageUrl);
      }

      // Sauvegarder la page
      const pageData = {
        userId,
        date: page.date,
        previewImage: previewImageUrl,
      };

      let savedPage;
      try {
        // Tenter de mettre à jour
        savedPage = await databases.updateDocument(
          DATABASE_ID,
          PAGES_COLLECTION,
          page.id,
          pageData
        );
      } catch {
        // Créer si n'existe pas
        savedPage = await databases.createDocument(
          DATABASE_ID,
          PAGES_COLLECTION,
          page.id,
          pageData
        );
      }

      // Sauvegarder les items
      for (const item of page.items) {
        let contentUrl = item.content;
        let audioUrl = item.audioContent;

        // Upload content si base64
        if (contentUrl && contentUrl.startsWith('data:')) {
          contentUrl = await uploadBase64File(contentUrl);
        }

        // Upload audio si base64
        if (audioUrl && audioUrl.startsWith('data:')) {
          audioUrl = await uploadBase64File(audioUrl);
        }

        const itemData = {
          pageId: savedPage.$id,
          type: item.type,
          content: contentUrl,
          audioContent: audioUrl,
          positionX: item.position.x,
          positionY: item.position.y,
          width: item.size.width,
          height: item.size.height,
          zIndex: item.zIndex,
        };

        try {
          await databases.updateDocument(
            DATABASE_ID,
            ITEMS_COLLECTION,
            item.id,
            itemData
          );
        } catch {
          await databases.createDocument(
            DATABASE_ID,
            ITEMS_COLLECTION,
            item.id,
            itemData
          );
        }
      }

      return res.json({ success: true, pageId: savedPage.$id });
    }

    // DELETE /delete-page/:pageId - Supprimer une page
    if (method === 'DELETE' && path.startsWith('/delete-page/')) {
      const pageId = path.split('/delete-page/')[1];

      if (!pageId) {
        return res.json({ error: 'Page ID is required' }, 400);
      }

      // Supprimer tous les items
      const itemsResponse = await databases.listDocuments(
        DATABASE_ID,
        ITEMS_COLLECTION,
        [Query.equal('pageId', pageId)]
      );

      for (const item of itemsResponse.documents) {
        await databases.deleteDocument(DATABASE_ID, ITEMS_COLLECTION, item.$id);
      }

      // Supprimer la page
      await databases.deleteDocument(DATABASE_ID, PAGES_COLLECTION, pageId);

      return res.json({ success: true });
    }

    // Route non trouvée
    return res.json({ error: 'Route not found' }, 404);

  } catch (err) {
    error('Function error:', err);
    return res.json({ error: err.message }, 500);
  }
};
