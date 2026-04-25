import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Copy, MoreHorizontal, Play, Pause, Upload } from 'lucide-react';
import { cn, parseDuration, formatDuration, sumDurations } from '../lib/utils';
import { Track } from '../types';
import { saveAudioTrack, getAudioTrack } from '../lib/storage';
import { v4 as uuidv4 } from 'uuid';
import { getTranslations } from '../lib/i18n';
import { motion, AnimatePresence } from 'motion/react';

function SortableTrackItem({ track, albumId }: { track: Track; albumId: string; key?: React.Key }) {
  const { updateTrack, deleteTrack, duplicateTrack, addToast, settings } = useStore();
  const t = getTranslations(settings.language);
  const [expanded, setExpanded] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const uploadRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (track.audioId) {
      getAudioTrack(track.audioId).then(url => setAudioUrl(url));
    } else {
      setAudioUrl(null);
    }
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [track.audioId]);

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const newAudioId = uuidv4();
    try {
      await saveAudioTrack(newAudioId, file);
      
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        const seconds = Math.floor(audio.duration);
        const format = useStore.getState().settings.durationFormat;
        const formatted = formatDuration(seconds, format);
        updateTrack(albumId, track.id, { audioId: newAudioId, duration: formatted, durationSeconds: seconds });
      };
      addToast(t.audioAttached);
    } catch (e) {
      addToast(t.failedToSaveAudio);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { zIndex: 50, position: 'relative' as const } : {})
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9:]/g, '');
    updateTrack(albumId, track.id, { duration: val });
  };

  const handleDurationBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val && !val.includes(':')) {
      if (val.length <= 2) val = `00:${val.padStart(2, '0')}`;
      else val = `${val.slice(0, -2)}:${val.slice(-2)}`;
    }
    const seconds = parseDuration(val);
    const format = useStore.getState().settings.durationFormat;
    const formatted = formatDuration(seconds, format);
    updateTrack(albumId, track.id, { duration: formatted, durationSeconds: seconds });
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "group flex flex-col border border-transparent hover:border-light-border dark:hover:border-[#2A2A2A] bg-light-surface dark:bg-[#141414] rounded-2xl mb-2 transition-all px-0 mx-0",
        isDragging && "opacity-50 ring-1 ring-light-border dark:ring-[#2A2A2A] z-50 shadow-lg"
      )}
    >
      <div className="flex items-center py-3 px-2 transition-colors">
        <div 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing text-light-muted dark:text-dark-muted hover:text-light-primary dark:hover:text-dark-primary p-2 pl-4 transition-colors"
        >
          <GripVertical size={14} />
        </div>
        
        <div className="flex items-center justify-center w-8 h-8 mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-light-muted dark:text-dark-muted hover:text-light-primary dark:hover:text-[#F5F5F5]" onClick={track.audioId ? togglePlay : () => uploadRef.current?.click()}>
          {track.audioId ? (
            isPlaying ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current ml-0.5" />
          ) : (
            <Upload size={14} />
          )}
        </div>
        <input 
          type="file" 
          accept="audio/*" 
          className="hidden" 
          ref={uploadRef}
          onChange={handleAudioUpload}
        />
        {audioUrl && (
           <audio 
             ref={audioRef} 
             src={audioUrl} 
             onPlay={() => setIsPlaying(true)} 
             onPause={() => setIsPlaying(false)}
             onEnded={() => {
               setIsPlaying(false);
               setCurrentTime(0);
               if (audioRef.current) audioRef.current.currentTime = 0;
             }}
             onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
             onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
             className="hidden"
           />
        )}

        <input
          type="text"
          value={track.title}
          onChange={(e) => updateTrack(albumId, track.id, { title: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          className="flex-1 bg-transparent text-[13px] tracking-wide min-w-0 transition-colors"
          placeholder={t.trackTitle}
        />

        <input
          type="text"
          value={track.duration}
          onChange={handleDurationChange}
          onBlur={handleDurationBlur}
          className="w-16 text-right font-mono text-[11px] text-light-secondary dark:text-dark-secondary bg-transparent transition-colors"
          placeholder="00:00"
        />

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-light-muted dark:text-dark-muted hover:text-light-primary dark:hover:text-dark-primary rounded cursor-pointer transition-colors"
          >
            <MoreHorizontal size={14} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => duplicateTrack(albumId, track.id)}
            className="p-1.5 text-light-muted dark:text-dark-muted hover:text-light-primary dark:hover:text-dark-primary rounded cursor-pointer transition-colors"
          >
            <Copy size={14} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => deleteTrack(albumId, track.id)}
            className="p-1.5 text-light-muted dark:text-dark-muted hover:text-red-500 rounded cursor-pointer transition-colors"
          >
            <Trash2 size={14} />
          </motion.button>
        </div>
      </div>

      {audioUrl && (
        <div className="flex items-center px-12 pl-14 pb-3 gap-3 transition-opacity">
          <span className="font-mono text-[10px] text-light-muted dark:text-dark-muted w-10 text-right">
            {formatDuration(Math.floor(currentTime), useStore.getState().settings.durationFormat)}
          </span>
          <div className="relative flex-1 h-1.5 bg-black/10 dark:bg-[#2A2A2A] rounded-full cursor-pointer overflow-hidden group/scrubber">
            <div 
              className="absolute top-0 left-0 h-full bg-light-primary dark:bg-dark-primary pointer-events-none rounded-full" 
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} 
            />
            <input 
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => {
                if (audioRef.current) {
                  audioRef.current.currentTime = Number(e.target.value);
                  setCurrentTime(Number(e.target.value));
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer m-0 p-0"
            />
          </div>
          <span className="font-mono text-[10px] text-light-muted dark:text-dark-muted w-10">
            {formatDuration(Math.floor(duration || track.durationSeconds || 0), useStore.getState().settings.durationFormat)}
          </span>
        </div>
      )}

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 px-12 py-4 bg-black/5 dark:bg-[#0A0A0A] rounded-b-2xl border-t border-light-border dark:border-[#2A2A2A]">
              <span className="font-mono text-[10px] tracking-widest text-light-muted dark:text-dark-muted uppercase">{t.lyrics}</span>
              <textarea 
                value={track.notes || ''} 
                onChange={(e) => updateTrack(albumId, track.id, { notes: e.target.value })}
                className="text-[13px] bg-transparent w-full min-h-[150px] resize-y outline-none leading-relaxed mt-1"
                placeholder={t.writeLyricsHere}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TrackList({ albumId }: { albumId: string }) {
  const { albumsMap, addTrack, reorderTracks, settings } = useStore();
  const album = albumsMap[albumId];
  const t = getTranslations(settings.language);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!album) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = album.tracks.findIndex(t => t.id === active.id);
      const newIndex = album.tracks.findIndex(t => t.id === over.id);
      reorderTracks(albumId, oldIndex, newIndex);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="w-full max-w-3xl"
    >
      <div className="flex justify-between items-end pb-4 border-b border-light-border dark:border-dark-border mb-4">
        <h3 className="text-[15px] font-bold tracking-[0.15em] uppercase">{t.tracklist}</h3>
        <div className="font-mono text-[11px] text-light-muted dark:text-dark-muted uppercase tracking-widest transition-colors">
          {t.total}: {sumDurations(album.tracks, useStore.getState().settings.durationFormat)}
        </div>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="mb-4 relative">
          <SortableContext 
            items={album.tracks.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {album.tracks.map((track) => (
              <SortableTrackItem key={track.id} track={track} albumId={albumId} />
            ))}
          </SortableContext>
        </div>
      </DndContext>

      {album.tracks.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-12 text-center text-light-muted dark:text-dark-muted font-mono text-[11px] tracking-widest border border-dashed border-light-border dark:border-[#2A2A2A] mb-4 rounded-3xl"
        >
          {t.noTracksAdded}
        </motion.div>
      )}

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => addTrack(albumId)}
        className="mt-8 px-6 py-3 w-full border border-dashed border-light-border dark:border-[#2A2A2A] rounded-full text-center group flex items-center justify-center gap-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <span className="text-[18px] leading-none text-light-muted dark:text-dark-muted group-hover:text-light-primary dark:group-hover:text-dark-primary transition-colors">+</span>
        <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-light-muted dark:text-dark-muted group-hover:text-light-primary dark:group-hover:text-dark-primary transition-colors">{t.addTrack}</span>
      </motion.button>
    </motion.div>
  );
}
