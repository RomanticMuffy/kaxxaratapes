import React from 'react';
import { useStore } from '../store';
import { AlbumDetail } from './AlbumDetail';
import { getTranslations } from '../lib/i18n';
import { motion, AnimatePresence } from 'motion/react';

export function MainContent() {
  const { activeAlbumId, albumsMap, createAlbum, settings } = useStore();
  const t = getTranslations(settings.language);

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-light-bg dark:bg-dark-bg text-center">
      <AnimatePresence mode="wait">
        {activeAlbumId && albumsMap[activeAlbumId] ? (
          <motion.div 
            key="album-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full h-full"
          >
            <AlbumDetail albumId={activeAlbumId} />
          </motion.div>
        ) : (
          <motion.div 
            key="empty-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex-1 flex flex-col items-center justify-center p-8 h-full relative overflow-hidden"
          >
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover opacity-[0.15] mix-blend-screen pointer-events-none"
              src="/videoplayback.webm"
            />
            <div className="relative z-10 flex flex-col items-center w-full">
              {Object.keys(albumsMap).length === 0 ? (
                <div className="space-y-6 max-w-sm">
                  <h2 className="text-[24px] font-medium tracking-tight">{t.noAlbumsYet}</h2>
                  <p className="text-[15px] text-light-secondary dark:text-dark-secondary">
                    {t.createFirstAlbum}
                  </p>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => createAlbum()}
                    className="w-full flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-widest py-4 bg-light-primary text-light-bg dark:bg-dark-primary dark:text-dark-bg hover:opacity-90 transition-opacity cursor-pointer rounded-full"
                  >
                    {t.newProject}
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-6 max-w-sm">
                  <h2 className="text-[24px] font-medium tracking-tight">{t.selectAnAlbum}</h2>
                  <p className="text-[15px] text-light-secondary dark:text-dark-secondary">
                    {t.chooseAnAlbum}
                  </p>
                </div>
              )}
              <div className="mt-12 text-[10px] text-light-muted dark:text-dark-muted font-mono tracking-widest uppercase opacity-80">
                (am project kaxxaraboy)
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
