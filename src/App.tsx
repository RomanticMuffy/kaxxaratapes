import React, { useEffect, useState } from 'react';
import { useStore } from './store';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { ToastContainer } from './components/Toast';
import { SettingsModal } from './components/Settings';
import { useIsMobile } from './hooks/useMobile';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { init, settings } = useStore();
  const [hydrated, setHydrated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

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
    const theme = useStore.getState().settings;
    if (theme.theme === 'dark' || (theme.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false);
    }
  }, [isMobile]);


  if (!hydrated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg text-light-primary dark:text-dark-primary font-mono text-[13px] uppercase tracking-widest">
        LOADING...
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-light-bg dark:bg-dark-bg text-light-primary dark:text-dark-primary select-none relative max-md:h-auto max-md:overflow-y-auto">
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 bg-light-surface dark:bg-dark-surface border-b border-light-border dark:border-dark-border z-50">
          <h1 className="text-[13px] font-bold tracking-[0.2em] uppercase">kaxxaratapes</h1>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer text-light-primary dark:text-dark-primary"
          >
            <Menu size={24} />
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {mobileMenuOpen && isMobile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 z-[9998]"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-light-surface dark:bg-dark-surface border-r border-light-border dark:border-dark-border z-[9999] overflow-y-auto"
            >
              <div className="flex items-center justify-between h-14 px-4 border-b border-light-border dark:border-dark-border shrink-0">
                <h1 className="text-[13px] font-bold tracking-[0.2em] uppercase">kaxxaratapes</h1>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer text-light-primary dark:text-dark-primary"
                >
                  <X size={24} />
                </motion.button>
              </div>
              <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {!isMobile && <Sidebar />}
      <MainContent />
      <ToastContainer />
      <SettingsModal />
    </div>
  );
}

