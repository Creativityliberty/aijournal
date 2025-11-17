
import React, { useState, useEffect } from 'react';
import { JournalPage } from './types';
import { CanvasView } from './components/CanvasView';
import { PlusIcon } from './components/Icons';
import { initialJournalPages } from './data/initialData';

const JournalView: React.FC<{
  pages: JournalPage[];
  onSelectPage: (page: JournalPage) => void;
  onNewPage: () => void;
}> = ({ pages, onSelectPage, onNewPage }) => (
  <div className="min-h-screen bg-stone-50 text-gray-800 p-4 sm:p-8">
    <header className="flex justify-between items-center mb-8">
      <h1 className="text-4xl font-bold" style={{fontFamily: "'Times New Roman', serif"}}>AI Journal</h1>
      <button 
        onClick={onNewPage}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-transform transform hover:scale-105 shadow-md">
        <PlusIcon className="w-5 h-5"/>
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
        {pages.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(page => (
          <div key={page.id} onClick={() => onSelectPage(page)} className="cursor-pointer bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group">
            <div className="w-full h-48 bg-stone-200 flex items-center justify-center">
              {page.previewImage ? (
                <img src={page.previewImage} alt="Page preview" className="w-full h-full object-cover"/>
              ) : (
                <span className="text-stone-400">No Image</span>
              )}
            </div>
            <div className="p-4">
              <p className="font-semibold text-gray-700">{new Date(page.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const APP_STORAGE_KEY = 'ai-journal-pages';
const FIRST_RUN_KEY = 'ai-journal-first-run';

const App: React.FC = () => {
  const [pages, setPages] = useState<JournalPage[]>([]);
  const [activePage, setActivePage] = useState<JournalPage | null>(null);

  useEffect(() => {
    const isFirstRun = !localStorage.getItem(FIRST_RUN_KEY);
    if (isFirstRun) {
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(initialJournalPages));
      setPages(initialJournalPages);
      localStorage.setItem(FIRST_RUN_KEY, 'false');
    } else {
      const savedPages = localStorage.getItem(APP_STORAGE_KEY);
      setPages(savedPages ? JSON.parse(savedPages) : []);
    }
  }, []);

  useEffect(() => {
    // Avoid saving during initial load
    if (localStorage.getItem(FIRST_RUN_KEY)) {
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(pages));
    }
  }, [pages]);

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

  const handleSavePage = (updatedPage: JournalPage) => {
    setPages(prevPages => {
      const pageExists = prevPages.some(p => p.id === updatedPage.id);
      if (pageExists) {
        return prevPages.map(p => p.id === updatedPage.id ? updatedPage : p);
      } else {
        return [...prevPages, updatedPage];
      }
    });
    setActivePage(null);
  };
  
  const handleBack = () => {
      setActivePage(null);
  };

  if (activePage) {
    return <CanvasView page={activePage} onSave={handleSavePage} onBack={handleBack}/>;
  }

  return <JournalView pages={pages} onSelectPage={handleSelectPage} onNewPage={handleNewPage} />;
};

export default App;