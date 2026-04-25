import { openDB } from 'idb';
import { Album, AppSettings } from '../types';

const DB_NAME = 'album-prototype-studio';
const DB_VERSION = 2;
const STORE_NAME = 'covers';
const AUDIO_STORE_NAME = 'audio';

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
        if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
          db.createObjectStore(AUDIO_STORE_NAME);
        }
      }
    },
  });
}

export async function saveAudioTrack(id: string, file: Blob): Promise<void> {
  const db = await initDB();
  await db.put(AUDIO_STORE_NAME, file, id);
}

export async function getAudioTrack(id: string): Promise<string | null> {
  try {
    const db = await initDB();
    const data = await db.get(AUDIO_STORE_NAME, id);
    if (data instanceof Blob) {
      return URL.createObjectURL(data);
    }
    return null;
  } catch (error) {
    console.error('Failed to get audio', error);
    return null;
  }
}

export async function deleteAudioTrack(id: string): Promise<void> {
  const db = await initDB();
  await db.delete(AUDIO_STORE_NAME, id);
}

export async function saveCoverArt(id: string, file: Blob): Promise<void> {
  const db = await initDB();
  await db.put(STORE_NAME, file, id);
}

export async function getCoverArt(id: string): Promise<string | null> {
  try {
    const db = await initDB();
    const data = await db.get(STORE_NAME, id);
    if (data instanceof Blob) {
      return URL.createObjectURL(data);
    }
    return null;
  } catch (error) {
    console.error('Failed to get cover art', error);
    return null;
  }
}

export async function deleteCoverArt(id: string): Promise<void> {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
}

export async function clearAllIndexedDBData(): Promise<void> {
  const db = await initDB();
  await db.clear(STORE_NAME);
  await db.clear(AUDIO_STORE_NAME);
}

export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function dataURLToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function exportAllFiles() {
  const db = await initDB();
  const covers: Record<string, string> = {};
  const audio: Record<string, string> = {};

  const coverKeys = await db.getAllKeys(STORE_NAME);
  for (const key of coverKeys) {
    const blob = await db.get(STORE_NAME, key);
    if (blob instanceof Blob) {
      covers[key.toString()] = await blobToDataURL(blob);
    }
  }

  const audioKeys = await db.getAllKeys(AUDIO_STORE_NAME);
  for (const key of audioKeys) {
    const blob = await db.get(AUDIO_STORE_NAME, key);
    if (blob instanceof Blob) {
      audio[key.toString()] = await blobToDataURL(blob);
    }
  }

  return { covers, audio };
}

export async function importAllFiles(files: { covers?: Record<string, string>, audio?: Record<string, string> }) {
  const db = await initDB();
  if (files.covers) {
    for (const [key, dataUrl] of Object.entries(files.covers)) {
      const blob = await dataURLToBlob(dataUrl);
      await db.put(STORE_NAME, blob, key);
    }
  }
  if (files.audio) {
    for (const [key, dataUrl] of Object.entries(files.audio)) {
      const blob = await dataURLToBlob(dataUrl);
      await db.put(AUDIO_STORE_NAME, blob, key);
    }
  }
}

const ALBUMS_KEY = 'albums_storage';

export function loadAlbumsFromStorage(): Record<string, Album> {
  try {
    const str = localStorage.getItem(ALBUMS_KEY);
    if (!str) return {};
    return JSON.parse(str);
  } catch (e) {
    console.error('Failed to load albums', e);
    return {};
  }
}

export function saveAlbumsToStorage(albumsMap: Record<string, Album>) {
  try {
    localStorage.setItem(ALBUMS_KEY, JSON.stringify(albumsMap));
  } catch (e) {
    console.error('Failed to save albums', e);
  }
}

const SETTINGS_KEY = 'app_settings';
export const defaultSettings: AppSettings = {
  theme: 'system',
  durationFormat: 'MM:SS',
  showSaveToast: true,
  sidebarCollapsed: false,
  language: 'en',
};

export function loadSettings(): AppSettings {
  try {
    const str = localStorage.getItem(SETTINGS_KEY);
    if (!str) return defaultSettings;
    const settings = { ...defaultSettings, ...JSON.parse(str) };
    if (!localStorage.getItem('lang_migrated')) {
      settings.language = 'en';
      localStorage.setItem('lang_migrated', 'true');
      saveSettings(settings);
    }
    return settings;
  } catch (e) {
    console.error('Failed to load settings', e);
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}
