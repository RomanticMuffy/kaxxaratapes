import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseDuration(str: string): number {
  if (!str) return 0;
  const parts = str.split(':').reverse();
  let seconds = 0;
  if (parts[0]) seconds += parseInt(parts[0], 10) || 0;
  if (parts[1]) seconds += (parseInt(parts[1], 10) || 0) * 60;
  if (parts[2]) seconds += (parseInt(parts[2], 10) || 0) * 3600;
  return seconds;
}

export function formatDuration(seconds: number, format: 'MM:SS' | 'HH:MM:SS' = 'MM:SS'): string {
  if (isNaN(seconds) || seconds < 0) return format === 'HH:MM:SS' ? '00:00:00' : '00:00';
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (format === 'HH:MM:SS' || h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function sumDurations(tracks: { durationSeconds: number }[], format: 'MM:SS' | 'HH:MM:SS' = 'MM:SS'): string {
  const sum = tracks.reduce((acc, t) => acc + (t.durationSeconds || 0), 0);
  return formatDuration(sum, format);
}
