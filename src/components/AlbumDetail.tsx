import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../store';
import { sumDurations } from '../lib/utils';
import { saveCoverArt, getCoverArt } from '../lib/storage';
import { v4 as uuidv4 } from 'uuid';
import { TrackList } from './TrackList';
import { getTranslations } from '../lib/i18n';
import { motion } from 'motion/react';
import { ImageCropperModal } from './ImageCropperModal';

export function AlbumDetail({ albumId }: { albumId: string }) {
  const { albumsMap, updateAlbum, duplicateAlbum, archiveAlbum, deleteAlbum, setActiveAlbum, settings } = useStore();
  const album = albumsMap[albumId];
  const t = getTranslations(settings.language);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (album?.coverArtId) {
      getCoverArt(album.coverArtId).then(url => {
        if (url) setCoverUrl(url);
      });
    } else {
      setCoverUrl(null);
    }
  }, [album?.coverArtId]);

  if (!album) return null;

  const totalDuration = sumDurations(album.tracks, useStore.getState().settings.durationFormat);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateAlbum(albumId, { title: e.target.value });
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageToCrop(reader.result?.toString() || null);
      setCropModalOpen(true);
    });
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const newCoverId = uuidv4();
    const file = new File([croppedBlob], `cover-${newCoverId}.jpg`, { type: 'image/jpeg' });
    
    await saveCoverArt(newCoverId, file);
    updateAlbum(albumId, { coverArtId: newCoverId });
    setCropModalOpen(false);
    setImageToCrop(null);
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteAlbum(albumId);
    } else {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto flex flex-col md:flex-row bg-light-bg dark:bg-dark-bg">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full md:w-1/2 lg:w-2/5 shrink-0 max-w-[500px] p-8 lg:p-12 border-r border-light-border dark:border-dark-border flex flex-col gap-6 sticky top-0 md:h-screen overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-4 mb-4">
          <div className="flex items-center gap-3">
                <span className="text-[11px] text-light-muted dark:text-dark-muted tracking-[0.1em] uppercase">{t.projects} /</span>
                <span className="text-[11px] font-bold tracking-[0.1em] uppercase max-w-[200px] truncate">{album.title || t.untitledProject}</span>
              </div>
              <select 
                value={album.status}
                onChange={(e) => updateAlbum(albumId, { status: e.target.value as any })}
                className="px-3 py-1 border border-light-primary dark:border-dark-primary text-[10px] font-bold tracking-widest uppercase bg-transparent cursor-pointer outline-none appearance-none text-center rounded-full transition-colors"
              >
                <option value="DEMO">{t.demo}</option>
                <option value="ROUGH_MIX">{t.roughMix}</option>
                <option value="MIXED">{t.mixed}</option>
                <option value="MASTERED">{t.mastered}</option>
                <option value="RELEASED">{t.released}</option>
              </select>
            </div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="aspect-square shrink-0 w-full max-w-[400px] mx-auto bg-black/5 dark:bg-[#141414] relative group cursor-pointer border border-light-border dark:border-[#2A2A2A] rounded-3xl overflow-hidden shadow-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              {coverUrl ? (
                <motion.img 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  src={coverUrl} 
                  alt="Cover" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] tracking-[0.2em] uppercase text-light-muted dark:text-dark-muted group-hover:text-light-primary dark:group-hover:text-dark-primary transition-colors">{t.addCoverArt}</span>
                </div>
              )}
              {coverUrl && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-mono text-[11px] tracking-[0.2em] uppercase">
                  {t.changeCoverArt}
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleCoverUpload}
                accept="image/*"
                className="hidden" 
              />
            </motion.div>

            <div className="flex flex-col gap-6 w-full max-w-[400px] mx-auto pt-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <label className="font-mono text-[10px] text-light-muted dark:text-dark-muted uppercase tracking-widest block mb-1">{t.albumTitle}</label>
                <input
                  type="text"
                  value={album.title}
                  onChange={handleTitleChange}
                  className="text-[32px] font-medium leading-none text-light-primary dark:text-dark-primary w-full bg-transparent border-b border-transparent focus:border-light-border dark:focus:border-[#2A2A2A] py-1 transition-colors outline-none"
                  placeholder={t.untitledProject}
                />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <label className="font-mono text-[10px] text-light-muted dark:text-dark-muted uppercase tracking-widest block mb-1">{t.releaseDate}</label>
                <input
                  type="date"
                  value={album.releaseDate || ''}
                  onChange={(e) => updateAlbum(albumId, { releaseDate: e.target.value })}
                  className="text-[15px] font-mono text-light-primary dark:text-dark-primary w-full bg-transparent border-b border-transparent focus:border-light-border dark:focus:border-[#2A2A2A] py-1 custom-date-input outline-none transition-colors"
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-2 mt-8 pt-6 border-t border-light-border dark:border-[#2A2A2A]">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const newId = duplicateAlbum(albumId);
                    setActiveAlbum(newId);
                  }}
                  className="px-4 py-2 bg-black/5 dark:bg-[#1A1A1A] hover:bg-black/10 dark:hover:bg-[#202020] rounded-full transition-colors text-[10px] text-light-secondary dark:text-dark-secondary hover:text-light-primary dark:hover:text-dark-primary tracking-widest uppercase cursor-pointer"
                >
                  {t.duplicate}
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    archiveAlbum(albumId);
                    setActiveAlbum(null);
                  }}
                  className="px-4 py-2 bg-black/5 dark:bg-[#1A1A1A] hover:bg-black/10 dark:hover:bg-[#202020] rounded-full transition-colors text-[10px] text-light-secondary dark:text-dark-secondary hover:text-light-primary dark:hover:text-dark-primary tracking-widest uppercase cursor-pointer"
                >
                  {t.archive}
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDelete}
                  className="ml-auto px-4 py-2 bg-black/5 dark:bg-[#1A1A1A] hover:bg-red-500/10 rounded-full transition-colors text-[10px] text-light-secondary dark:text-dark-secondary hover:text-red-500 tracking-widest uppercase cursor-pointer"
                >
                  {deleteConfirm ? t.confirm : t.delete}
                </motion.button>
              </motion.div>
            </div>
      </motion.div>

      <div className="w-full md:w-1/2 lg:w-3/5 p-8 lg:p-12">
        <TrackList albumId={albumId} />
      </div>

      {imageToCrop && (
        <ImageCropperModal
          isOpen={cropModalOpen}
          imageSrc={imageToCrop}
          onClose={() => {
            setCropModalOpen(false);
            setImageToCrop(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
