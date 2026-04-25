import React from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';

export function ToastContainer() {
  const { toasts, removeToast } = useStore();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <motion.div 
            layout
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-full font-mono text-[11px] tracking-wider uppercase flex items-center gap-4 shadow-lg pointer-events-auto"
          >
            <span>{toast.message}</span>
            {toast.action && (
              <button 
                onClick={() => {
                  toast.action!.onClick();
                  removeToast(toast.id);
                }}
                className="text-white/70 hover:text-white dark:text-black/70 dark:hover:text-black font-bold cursor-pointer transition-colors"
              >
                {toast.action.label}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
