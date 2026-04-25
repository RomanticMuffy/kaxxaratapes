import React, { useEffect, useState } from 'react';
import { useStore } from './store';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { ToastContainer } from './components/Toast';
import { SettingsModal } from './components/Settings';

export default function App() {
  const { init, settings } = useStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    init();
    setHydrated(true);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        useStore.getState().createAlbum();
      }
      if (e.key === 'Escape') {
        useStore.getState().setActiveAlbum(null);
      }
      
      if (
        e.key === 'F12' || 
        ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J')) || 
        ((e.metaKey || e.ctrlKey) && e.key === 'u')
      ) {
        e.preventDefault();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [init]);

  useEffect(() => {
    const theme = useStore.getState().settings.theme;
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);


  if (!hydrated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg text-light-primary dark:text-dark-primary font-mono text-[13px] uppercase tracking-widest">
        LOADING...
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-light-bg dark:bg-dark-bg text-light-primary dark:text-dark-primary select-none">
      <Sidebar />
      <MainContent />
      <ToastContainer />
      <SettingsModal />
    </div>
  );
}

