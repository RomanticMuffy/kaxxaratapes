import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { getTranslations } from '../lib/i18n';
import { useStore } from '../store';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export function ImageCropperModal({ isOpen, imageSrc, onClose, onCropComplete }: ImageCropperModalProps) {
  const { settings } = useStore();
  const t = getTranslations(settings.language);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImg = async () => {
    try {
      const image = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return null;
      }

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((file) => {
          if (file) {
            resolve(file);
          } else {
            reject(new Error('Canvas is empty'));
          }
        }, 'image/jpeg', 0.9);
      });
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleSave = async () => {
    const croppedBlob = await getCroppedImg();
    if (croppedBlob) {
      onCropComplete(croppedBlob);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="bg-light-surface dark:bg-dark-surface w-full max-w-xl rounded-3xl overflow-hidden border border-light-border dark:border-dark-border shadow-2xl flex flex-col"
        >
          <div className="flex items-center justify-between p-6 border-b border-light-border dark:border-dark-border text-light-primary dark:text-dark-primary">
            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase">Adjust Cover (1:1)</h2>
            <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer">
              <X size={16} />
            </button>
          </div>
          
          <div className="relative w-full h-[50vh] min-h-[300px] bg-black">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropCompleteHandler}
              onZoomChange={setZoom}
            />
          </div>

          <div className="p-6 bg-light-surface dark:bg-dark-surface border-t border-light-border dark:border-dark-border text-light-primary dark:text-dark-primary flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <ZoomOut size={16} className="text-light-muted dark:text-dark-muted" />
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-light-primary dark:accent-dark-primary"
              />
              <ZoomIn size={16} className="text-light-muted dark:text-dark-muted" />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-[11px] font-bold tracking-[0.15em] uppercase text-light-secondary dark:text-dark-secondary hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 text-[11px] font-bold tracking-[0.15em] uppercase bg-light-primary text-light-surface dark:bg-dark-primary dark:text-dark-surface hover:opacity-90 rounded-full transition-opacity cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
