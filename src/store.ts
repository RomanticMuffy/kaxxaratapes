import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Album, AppSettings, Track } from './types';
import { loadAlbumsFromStorage, saveAlbumsToStorage, loadSettings, saveSettings } from './lib/storage';
import { getTranslations } from './lib/i18n';

interface Toast {
  id: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface AppState {
  albumsMap: Record<string, Album>;
  albumOrder: string[];
  activeAlbumId: string | null;
  settings: AppSettings;
  searchQuery: string;
  searchFilter: string | 'ALL';
  isSettingsOpen: boolean;
  toasts: Toast[];

  init: () => void;
  createAlbum: () => string;
  updateAlbum: (id: string, updates: Partial<Album>) => void;
  deleteAlbum: (id: string) => void;
  duplicateAlbum: (id: string) => string;
  archiveAlbum: (id: string) => void;
  setActiveAlbum: (id: string | null) => void;
  reorderAlbums: (newOrder: string[]) => void;
  
  addTrack: (albumId: string) => void;
  updateTrack: (albumId: string, trackId: string, updates: Partial<Track>) => void;
  deleteTrack: (albumId: string, trackId: string) => void;
  reorderTracks: (albumId: string, oldIndex: number, newIndex: number) => void;
  duplicateTrack: (albumId: string, trackId: string) => void;

  setSearchQuery: (query: string) => void;
  setSearchFilter: (filter: string) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  
  addToast: (message: string, action?: { label: string; onClick: () => void }) => void;
  removeToast: (id: string) => void;
}

let saveTimeout: any;
function scheduleSave(albumsMap: Record<string, Album>) {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveAlbumsToStorage(albumsMap);
  }, 300);
}

export const useStore = create<AppState>((set, get) => ({
  albumsMap: {},
  albumOrder: [],
  activeAlbumId: null,
  settings: loadSettings(),
  searchQuery: '',
  searchFilter: 'ALL',
  isSettingsOpen: false,
  toasts: [],

  init: () => {
    const albumsMap = loadAlbumsFromStorage();
    const order = Object.values(albumsMap)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(a => a.id);
    
    set({ albumsMap, albumOrder: order });
  },

  createAlbum: () => {
    const id = uuidv4();
    const t = getTranslations(get().settings.language);
    const newAlbum: Album = {
      id,
      title: t.untitledProject,
      releaseDate: null,
      status: 'DEMO',
      coverArtId: null,
      tracks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      archived: false,
    };
    
    set(state => {
      const newMap = { ...state.albumsMap, [id]: newAlbum };
      const newOrder = [id, ...state.albumOrder];
      scheduleSave(newMap);
      return { albumsMap: newMap, albumOrder: newOrder, activeAlbumId: id };
    });
    return id;
  },

  updateAlbum: (id, updates) => {
    set(state => {
      const album = state.albumsMap[id];
      if (!album) return state;
      const newMap = {
        ...state.albumsMap,
        [id]: { ...album, ...updates, updatedAt: Date.now() }
      };
      scheduleSave(newMap);
      if (get().settings.showSaveToast) {
        get().addToast(getTranslations(get().settings.language).saved);
      }
      return { albumsMap: newMap };
    });
  },

  deleteAlbum: (id) => {
    const album = get().albumsMap[id];
    if (!album) return;
    const deletedIndex = get().albumOrder.indexOf(id);

    set(state => {
      const newMap = { ...state.albumsMap };
      delete newMap[id];
      const newOrder = state.albumOrder.filter(aid => aid !== id);
      scheduleSave(newMap);
      return { 
        albumsMap: newMap, 
        albumOrder: newOrder, 
        activeAlbumId: state.activeAlbumId === id ? null : state.activeAlbumId 
      };
    });

    get().addToast(getTranslations(get().settings.language).projectDeleted, {
      label: getTranslations(get().settings.language).undo,
      onClick: () => {
        set(state => {
          const newMap = { ...state.albumsMap, [id]: album };
          const newOrder = [...state.albumOrder];
          if (deletedIndex >= 0) {
             newOrder.splice(deletedIndex, 0, id);
          } else {
             newOrder.unshift(id);
          }
          scheduleSave(newMap);
          return { albumsMap: newMap, albumOrder: newOrder };
        });
      }
    });
  },

  duplicateAlbum: (id) => {
    const state = get();
    const source = state.albumsMap[id];
    if (!source) return id;
    
    const newId = uuidv4();
    const newAlbum: Album = {
      ...source,
      id: newId,
      title: `${source.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tracks: source.tracks.map(t => ({ ...t, id: uuidv4() }))
    };

    set(state => {
      const newMap = { ...state.albumsMap, [newId]: newAlbum };
      const newOrder = [newId, ...state.albumOrder];
      scheduleSave(newMap);
      return { albumsMap: newMap, albumOrder: newOrder };
    });
    get().addToast(getTranslations(get().settings.language).albumDuplicated);
    return newId;
  },

  archiveAlbum: (id) => {
    get().updateAlbum(id, { archived: true });
    get().addToast(getTranslations(get().settings.language).albumArchived);
  },

  setActiveAlbum: (id) => set({ activeAlbumId: id }),

  reorderAlbums: (newOrder) => set({ albumOrder: newOrder }),

  addTrack: (albumId) => {
    const id = uuidv4();
    set(state => {
      const album = state.albumsMap[albumId];
      if (!album) return state;
      
      const t = getTranslations(get().settings.language);
      const newTrack: Track = {
        id,
        albumId,
        position: album.tracks.length + 1,
        title: t.trackTitle,
        duration: '00:00',
        durationSeconds: 0,
        bpm: null,
        key: null,
        featuring: [],
        notes: '',
        createdAt: Date.now(),
        audioId: null,
      };

      const newMap = {
        ...state.albumsMap,
        [albumId]: { 
          ...album, 
          tracks: [...album.tracks, newTrack],
          updatedAt: Date.now()
        }
      };
      scheduleSave(newMap);
      return { albumsMap: newMap };
    });
  },

  updateTrack: (albumId, trackId, updates) => {
    set(state => {
      const album = state.albumsMap[albumId];
      if (!album) return state;
      
      const tracks = album.tracks.map(t => t.id === trackId ? { ...t, ...updates } : t);
      
      const newMap = {
        ...state.albumsMap,
        [albumId]: { ...album, tracks, updatedAt: Date.now() }
      };
      scheduleSave(newMap);
      return { albumsMap: newMap };
    });
  },

  deleteTrack: (albumId, trackId) => {
    const album = get().albumsMap[albumId];
    if (!album) return;
    
    const deletedTrack = album.tracks.find(t => t.id === trackId);
    const deletedIndex = album.tracks.findIndex(t => t.id === trackId);
    
    if (!deletedTrack) return;

    set(state => {
      const album = state.albumsMap[albumId];
      const newTracks = album.tracks
        .filter(t => t.id !== trackId)
        .map((t, idx) => ({ ...t, position: idx + 1 }));

      const newMap = {
        ...state.albumsMap,
        [albumId]: { ...album, tracks: newTracks, updatedAt: Date.now() }
      };
      scheduleSave(newMap);
      return { albumsMap: newMap };
    });

    get().addToast(getTranslations(get().settings.language).trackDeleted, {
      label: getTranslations(get().settings.language).undo,
      onClick: () => {
        set(state => {
          const album = state.albumsMap[albumId];
          const newTracks = [...album.tracks];
          newTracks.splice(deletedIndex, 0, deletedTrack);
          const repositioned = newTracks.map((t, idx) => ({ ...t, position: idx + 1 }));
          
          const newMap = {
            ...state.albumsMap,
            [albumId]: { ...album, tracks: repositioned, updatedAt: Date.now() }
          };
          scheduleSave(newMap);
          return { albumsMap: newMap };
        });
      }
    });
  },

  reorderTracks: (albumId, oldIndex, newIndex) => {
    set(state => {
      const album = state.albumsMap[albumId];
      if (!album) return state;

      const tracks = Array.from(album.tracks);
      const [moved] = tracks.splice(oldIndex, 1);
      tracks.splice(newIndex, 0, moved);

      const repositioned = tracks.map((t, idx) => ({ ...t, position: idx + 1 }));

      const newMap = {
        ...state.albumsMap,
        [albumId]: { ...album, tracks: repositioned, updatedAt: Date.now() }
      };
      scheduleSave(newMap);
      return { albumsMap: newMap };
    });
  },

  duplicateTrack: (albumId, trackId) => {
    set(state => {
      const album = state.albumsMap[albumId];
      const sourceIndex = album?.tracks.findIndex(t => t.id === trackId);
      if (!album || sourceIndex === undefined || sourceIndex === -1) return state;

      const sourceTrack = album.tracks[sourceIndex];
      const newTrack: Track = {
        ...sourceTrack,
        id: uuidv4(),
        title: `${sourceTrack.title} (Copy)`,
        createdAt: Date.now()
      };

      const tracks = [...album.tracks, newTrack].map((t, idx) => ({ ...t, position: idx + 1 }));

      const newMap = {
        ...state.albumsMap,
        [albumId]: { ...album, tracks, updatedAt: Date.now() }
      };
      scheduleSave(newMap);
      return { albumsMap: newMap };
    });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchFilter: (filter) => set({ searchFilter: filter }),

  updateSettings: (updates) => {
    set(state => {
      const newSettings = { ...state.settings, ...updates };
      saveSettings(newSettings);
      return { settings: newSettings };
    });
  },

  addToast: (message, action) => {
    const id = uuidv4();
    set(state => ({
      toasts: [...state.toasts, { id, message, action }]
    }));
    setTimeout(() => {
      get().removeToast(id);
    }, 5000);
  },

  removeToast: (id) => {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }));
  }
}));
