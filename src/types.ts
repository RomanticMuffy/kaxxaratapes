export type AlbumStatus = 'DEMO' | 'ROUGH_MIX' | 'MIXED' | 'MASTERED' | 'RELEASED';

export interface Track {
  id: string;
  albumId: string;
  position: number;
  title: string;
  duration: string;
  durationSeconds: number;
  bpm: number | null;
  key: string | null;
  featuring: string[];
  notes: string;
  createdAt: number;
  audioId: string | null;
}

export interface Album {
  id: string;
  title: string;
  releaseDate: string | null;
  status: AlbumStatus;
  coverArtId: string | null;
  tracks: Track[];
  createdAt: number;
  updatedAt: number;
  archived: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  durationFormat: 'MM:SS' | 'HH:MM:SS';
  showSaveToast: boolean;
  sidebarCollapsed: boolean;
  language?: 'pt' | 'en';
}
