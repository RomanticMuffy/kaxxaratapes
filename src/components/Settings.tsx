import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { defaultSettings, clearAllIndexedDBData, exportAllFiles, importAllFiles } from '../lib/storage';
import { getTranslations } from '../lib/i18n';
import { stringify, parse } from 'uuid';
import { motion, AnimatePresence } from 'motion/react';

export function SettingsModal() {
  const { isSettingsOpen, settings, updateSettings, albumsMap, albumOrder, addToast } = useStore();
  const t = getTranslations(settings.language);
  const [size, setSize] = useState('0 KB');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (isSettingsOpen) {
      let ls = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          ls += localStorage.getItem(key)?.length || 0;
        }
      }
      setSize((ls / 1024).toFixed(2) + ' KB');
    }
  }, [isSettingsOpen]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const files = await exportAllFiles();
      const data = {
        albumsMap,
        albumOrder,
        settings,
        files
      };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kaxxaratapes-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast(t.dataExportedSuccessfully);
    } catch (e) {
      console.error(e);
      addToast('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.albumsMap && data.albumOrder) {
          
          if (data.files) {
            await importAllFiles(data.files);
          }

          useStore.setState({ albumsMap: data.albumsMap, albumOrder: data.albumOrder });
          if (data.settings) updateSettings(data.settings);
          localStorage.setItem('albums_storage', JSON.stringify(data.albumsMap));
          addToast(t.dataImportedSuccessfully);
          setTimeout(() => location.reload(), 500);
        } else {
          throw new Error('Invalid format');
        }
      } catch (err) {
        addToast(t.failedToImportData);
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleClear = async () => {
    const conf = window.prompt(t.typeConfirmToDelete);
    if (conf === 'CONFIRM') {
      localStorage.clear();
      await clearAllIndexedDBData();
      
      useStore.setState({
        albumsMap: {},
        albumOrder: [],
        activeAlbumId: null,
        settings: defaultSettings,
        searchQuery: '',
        searchFilter: 'ALL'
      });
      
      location.reload();
    }
  };

  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
          onClick={() => useStore.setState({ isSettingsOpen: false })}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-light-bg dark:bg-[#141414] border border-light-border dark:border-[#2A2A2A] w-full max-w-md p-8 flex flex-col gap-6 rounded-3xl shadow-2xl" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h2 className="font-mono text-[18px] uppercase tracking-widest">{t.settings}</h2>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => useStore.setState({ isSettingsOpen: false })} 
                className="font-mono text-[11px] hover:opacity-70 transition-opacity"
              >
                {t.close}
              </motion.button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[13px] uppercase tracking-widest text-light-secondary dark:text-dark-secondary">{t.saveToasts}</span>
                <input 
                  type="checkbox" 
                  checked={settings.showSaveToast}
                  onChange={(e) => updateSettings({ showSaveToast: e.target.checked })}
                  className="accent-light-primary dark:accent-dark-primary h-4 w-4 cursor-pointer"
                />
              </div>

              <div className="border-t border-light-border dark:border-[#2A2A2A] pt-6 space-y-3">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-mono text-[11px] uppercase text-light-muted dark:text-dark-muted">{t.storageUsed}</span>
                  <span className="font-mono text-[11px] text-light-secondary dark:text-dark-secondary bg-black/5 dark:bg-[#1A1A1A] px-2 py-1 rounded-full">{size} / 5000 KB</span>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExport} 
                  disabled={isExporting} 
                  className="w-full bg-black/5 dark:bg-[#1A1A1A] border border-transparent dark:border-[#2A2A2A] py-3 font-mono text-[11px] font-bold tracking-widest uppercase hover:bg-black/10 dark:hover:bg-[#202020] cursor-pointer rounded-2xl transition-colors disabled:opacity-50"
                >
                  {isExporting ? 'EXPORTING...' : t.exportJson}
                </motion.button>
                <motion.label 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-black/5 dark:bg-[#1A1A1A] border border-transparent dark:border-[#2A2A2A] py-3 font-mono text-[11px] font-bold tracking-widest uppercase hover:bg-black/10 dark:hover:bg-[#202020] cursor-pointer text-center block rounded-2xl transition-colors disabled:opacity-50"
                >
                  {isImporting ? 'IMPORTING...' : t.importJson}
                  <input type="file" accept=".json" className="hidden" onChange={handleImport} disabled={isImporting} />
                </motion.label>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClear} 
                  className="w-full bg-red-500/10 border border-transparent text-red-500 py-3 font-mono text-[11px] font-bold tracking-widest uppercase hover:bg-red-500/20 cursor-pointer mt-6 rounded-2xl transition-colors"
                >
                  {t.clearAllData}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
