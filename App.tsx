import React, { useState, useEffect } from 'react';
import { JournalPage } from './types';
import { CanvasView } from './components/CanvasView';
import { PlusIcon } from './components/Icons';
import { initialData as initialJournalPages } from './data/initialData';
import {
  getCurrentUser,
  loginAnonymously,
  getUserPages,
  saveJournalPage,
  deletePage,
} from './services/appwriteService';

const JournalView: React.FC<{
  pages: JournalPage[];
  onSelectPage: (page: JournalPage) => void;
  onNewPage: () => void;
  onDeletePage: (pageId: string) => void;
}> = ({ pages, onSelectPage, onNewPage, onDeletePage }) => (
  <div className="min-h-screen bg-stone-50 text-gray-800 p-4 sm:p-8">
    <header className="flex justify-between items-center mb-8">
      <h1 className="text-4xl font-bold" style={{ fontFamily: "'Times New Roman', serif" }}>
        AI Journal
      </h1>
      <button
        onClick={onNewPage}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-transform transform hover:scale-105 shadow-md"
      >
        <PlusIcon className="w-5 h-5" />
        New Page
      </button>
    </header>

    {pages.length === 0 ? (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold text-gray-600">Your journal is empty.</h2>
        <p className="text-gray-500 mt-2">Click "New Page" to capture your first memory.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {pages
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map(page => (
            <div
              key={page.id}
              className="cursor-pointer bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group relative"
            >
              <div onClick={() => onSelectPage(page)} className="w-full h-48 bg-stone-200 flex items-center justify-center">
                {page.previewImage ? (
                  <img src={page.previewImage} alt="Page preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-stone-400">No Image</span>
                )}
              </div>
              <div className="p-4 flex justify-between items-center">
                <p className="font-semibold text-gray-700">
                  {new Date(page.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this page?')) {
                      onDeletePage(page.id);
                    }
                  }}
                  className="text-red-500 hover:text-red-700 text-sm font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>
    )}
  </div>
);

const App: React.FC = () => {
  const [pages, setPages] = useState<JournalPage[]>([]);
  const [activePage, setActivePage] = useState<JournalPage | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialisation : authentification et chargement des pages
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);

        // 1. Vérifier si l'utilisateur est déjà connecté
        let user = await getCurrentUser();

        if (!user) {
          // 2. Si pas connecté, créer une session anonyme
          const anonymousUserId = await loginAnonymously();
          setUserId(anonymousUserId);

          // 3. Pour la première utilisation, charger les données initiales
          const isFirstRun = !localStorage.getItem('appwrite-migrated');
          if (isFirstRun) {
            // Charger les données d'exemple
            setPages(initialJournalPages);
            localStorage.setItem('appwrite-migrated', 'true');
          } else {
            // Charger les pages depuis Appwrite
            const userPages = await getUserPages(anonymousUserId);
            setPages(userPages);
          }
        } else {
          setUserId(user.$id);

          // Charger les pages depuis Appwrite
          const userPages = await getUserPages(user.$id);
          setPages(userPages);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        // En cas d'erreur, utiliser localStorage comme fallback
        const savedPages = localStorage.getItem('ai-journal-pages');
        setPages(savedPages ? JSON.parse(savedPages) : initialJournalPages);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleNewPage = () => {
    const newPage: JournalPage = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: [],
    };
    setActivePage(newPage);
  };

  const handleSelectPage = (page: JournalPage) => {
    setActivePage(page);
  };

  const handleSavePage = async (updatedPage: JournalPage) => {
    if (!userId) {
      console.error('No user ID available');
      return;
    }

    try {
      // Sauvegarder dans Appwrite
      await saveJournalPage(updatedPage, userId);

      // Mettre à jour l'état local
      setPages(prevPages => {
        const pageExists = prevPages.some(p => p.id === updatedPage.id);
        if (pageExists) {
          return prevPages.map(p => (p.id === updatedPage.id ? updatedPage : p));
        } else {
          return [...prevPages, updatedPage];
        }
      });

      setActivePage(null);
    } catch (error) {
      console.error('Error saving page:', error);
      alert('Failed to save page. Please try again.');
    }
  };

  const handleDeletePage = async (pageId: string) => {
    try {
      // Supprimer depuis Appwrite
      await deletePage(pageId);

      // Mettre à jour l'état local
      setPages(prevPages => prevPages.filter(p => p.id !== pageId));
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('Failed to delete page. Please try again.');
    }
  };

  const handleBack = () => {
    setActivePage(null);
  };

  // Écran de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-xl font-semibold text-gray-700">Loading your journal...</p>
        </div>
      </div>
    );
  }

  if (activePage) {
    return <CanvasView page={activePage} onSave={handleSavePage} onBack={handleBack} />;
  }

  return (
    <JournalView
      pages={pages}
      onSelectPage={handleSelectPage}
      onNewPage={handleNewPage}
      onDeletePage={handleDeletePage}
    />
  );
};

export default App;
