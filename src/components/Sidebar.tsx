import React from 'react';
import { Search, Settings, Github, X } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { getCoverArt } from '../lib/storage';
import { getTranslations } from '../lib/i18n';
import { motion, AnimatePresence } from 'motion/react';

export function Sidebar() {
  const { 
    albumsMap, albumOrder, activeAlbumId, 
    settings, searchQuery, 
    createAlbum, setActiveAlbum, setSearchQuery, updateSettings, deleteAlbum
  } = useStore();

  const t = getTranslations(settings.language);

  const [covers, setCovers] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const loadCovers = async () => {
      const newCovers: Record<string, string> = {};
      for (const id of albumOrder) {
        const coverId = albumsMap[id]?.coverArtId;
        if (coverId) {
          const url = await getCoverArt(coverId);
          if (url) newCovers[id] = url;
        }
      }
      setCovers(newCovers);
    };
    loadCovers();

    return () => {
      Object.values(covers).forEach((url) => URL.revokeObjectURL(url as string));
    };
  }, [albumsMap, albumOrder]);

  const handleDeleteAlbum = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteAlbum(id);
  };

  const filteredOrder = albumOrder.filter(id => {
    const album = albumsMap[id];
    if (album.archived) return false;
    
    let match = true;
    if (searchQuery) {
      match = album.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    const { searchFilter } = useStore.getState();
    if (match && searchFilter !== 'ALL' && album.status !== searchFilter) {
      match = false;
    }
    
    return match;
  });

  const { searchFilter, setSearchFilter } = useStore();

  return (
    <div className={cn(
      "flex flex-col h-full bg-light-surface dark:bg-dark-surface border-r border-light-border dark:border-dark-border transition-all duration-300 relative ease-in-out",
      settings.sidebarCollapsed ? "w-0 overflow-hidden border-none shrink-0" : "w-[260px] shrink-0"
    )}>
      <div className="p-4 flex items-center justify-between h-16 border-b border-light-border dark:border-dark-border shrink-0">
        <h1 className="text-[13px] font-bold tracking-[0.2em] uppercase">kaxxaratapes</h1>
        <div className="flex items-center gap-1">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => updateSettings({ language: settings.language === 'pt' ? 'en' : 'pt' })} 
            className="p-1 px-2 font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-black/5 dark:hover:bg-white/10 rounded-full cursor-pointer text-light-secondary dark:text-dark-secondary"
          >
            {settings.language === 'en' ? 'EN' : 'PT'}
          </motion.button>
        </div>
      </div>

      <div className="p-3 border-b border-light-border dark:border-dark-border flex flex-col gap-3 relative shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-4 top-2.5 text-light-muted dark:text-dark-muted" />
          <input 
            type="text" 
            placeholder={t.searchProjects} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border border-light-border dark:border-dark-border py-2 text-[11px] tracking-wider placeholder:text-light-muted dark:placeholder:text-dark-muted focus:outline-none focus:border-light-primary dark:focus:border-dark-primary uppercase pl-10 rounded-full transition-colors duration-200"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full p-2 space-y-1">
        <AnimatePresence mode="popLayout">
          {filteredOrder.map((id, index) => {
            const album = albumsMap[id];
            const isActive = activeAlbumId === id;
            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                key={id}
                onClick={() => setActiveAlbum(id)}
                className={cn(
                  "group w-full text-left flex items-center gap-3 p-2 rounded-2xl transition-colors duration-200 cursor-pointer relative",
                  isActive 
                    ? "bg-light-primary text-light-bg dark:bg-dark-primary dark:text-dark-bg shadow-sm" 
                    : "hover:bg-black/5 dark:hover:bg-white/5 text-light-secondary dark:text-dark-secondary"
                )}
              >
                <div className="w-10 h-10 flex-shrink-0 bg-black/10 dark:bg-white/10 overflow-hidden rounded-xl relative">
                  {covers[id] ? (
                    <motion.img 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      src={covers[id]} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-mono text-[10px] opacity-50">+</div>
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={cn("text-[13px] font-medium truncate transition-colors duration-200", isActive ? "text-inherit" : "text-light-primary dark:text-dark-primary")}>
                    {album.title}
                  </span>
                  <span className="text-[11px] font-mono opacity-70 truncate uppercase">
                    {album.tracks.length} {t.trk}
                  </span>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => handleDeleteAlbum(e, id)}
                  className="opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full mr-1 flex-shrink-0"
                  title={t.delete}
                >
                  <X size={14} className={isActive ? "text-light-bg dark:text-dark-bg" : "text-light-primary dark:text-dark-primary"} />
                </motion.button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t border-light-border dark:border-dark-border space-y-2 shrink-0">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => createAlbum()}
          className="w-full py-3 bg-light-primary text-light-bg dark:bg-dark-primary dark:text-dark-bg text-[11px] font-bold tracking-[0.1em] uppercase hover:opacity-90 transition-colors duration-200 cursor-pointer rounded-2xl shadow-sm"
        >
          {t.newProject}
        </motion.button>
        <div className="flex gap-2 w-full pt-2">
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: "var(--color-bg-hover)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => useStore.setState({ isSettingsOpen: true })}
            className="flex-1 flex items-center justify-center gap-2 font-mono text-[11px] uppercase py-2 cursor-pointer text-light-secondary dark:text-dark-secondary rounded-xl transition-colors duration-200"
            style={{ "--color-bg-hover": "rgba(0,0,0,0.05)" } as React.CSSProperties}
          >
            <Settings size={14} /> {t.settings}
          </motion.button>
        </div>
        <div className="flex gap-4 items-center justify-center pt-2 pb-1 text-light-muted dark:text-dark-muted">
          <motion.a whileHover={{ scale: 1.1, color: "var(--light-primary)" }} whileTap={{ scale: 0.9 }} href="https://open.spotify.com/intl-pt/artist/5IU6bQHwiTJM7RK6r962gI" target="_blank" rel="noopener noreferrer" className="transition-colors duration-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.84.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.54-1.02.72-1.56.3z"/>
            </svg>
          </motion.a>
          <motion.a whileHover={{ scale: 1.1, color: "var(--light-primary)" }} whileTap={{ scale: 0.9 }} href="https://soundcloud.com/romantic-muffy" target="_blank" rel="noopener noreferrer" className="transition-colors duration-200">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.999 14.165c-.052 1.796-1.612 3.169-3.4 3.169h-8.18a.68.68 0 0 1-.675-.683V7.862a.747.747 0 0 1 .452-.724s.75-.513 2.333-.513a5.364 5.364 0 0 1 2.763.755 5.433 5.433 0 0 1 2.57 3.54c.282-.08.574-.121.868-.12.884 0 1.73.358 2.347.992s.948 1.49.922 2.373ZM10.721 8.421c.247 2.98.427 5.697 0 8.672a.264.264 0 0 1-.53 0c-.395-2.946-.22-5.718 0-8.672a.264.264 0 0 1 .53 0ZM9.072 9.448c.285 2.659.37 4.986-.006 7.655a.277.277 0 0 1-.55 0c-.331-2.63-.256-5.02 0-7.655a.277.277 0 0 1 .556 0Zm-1.663-.257c.27 2.726.39 5.171 0 7.904a.266.266 0 0 1-.532 0c-.38-2.69-.257-5.21 0-7.904a.266.266 0 0 1 .532 0Zm-1.647.77a26.108 26.108 0 0 1-.008 7.147.272.272 0 0 1-.542 0 27.955 27.955 0 0 1 0-7.147.275.275 0 0 1 .55 0Zm-1.67 1.769c.421 1.865.228 3.5-.029 5.388a.257.257 0 0 1-.514 0c-.21-1.858-.398-3.549 0-5.389a.272.272 0 0 1 .543 0Zm-1.655-.273c.388 1.897.26 3.508-.01 5.412-.026.28-.514.283-.54 0-.244-1.878-.347-3.54-.01-5.412a.283.283 0 0 1 .56 0Zm-1.668.911c.4 1.268.257 2.292-.026 3.572a.257.257 0 0 1-.514 0c-.241-1.262-.354-2.312-.023-3.572a.283.283 0 0 1 .563 0Z" />
            </svg>
          </motion.a>
          <motion.a whileHover={{ scale: 1.1, color: "var(--light-primary)" }} whileTap={{ scale: 0.9 }} href="https://github.com/romanticmuffy" target="_blank" rel="noopener noreferrer" className="transition-colors duration-200">
            <Github size={18} />
          </motion.a>
        </div>
      </div>
    </div>
  );
}
