import React, { useEffect } from 'react';
import { Sparkles, Coffee, Play, X, Bell } from 'lucide-react';
import { PomodoroMode } from '../types';

export interface PomodoroNotificationData {
  isOpen: boolean;
  title: string;
  message: string;
  mode: PomodoroMode;
  nextMode: PomodoroMode;
  nextMinutes: number;
}

interface PomodoroNotificationToastProps {
  data: PomodoroNotificationData | null;
  onClose: () => void;
  onStartNext: () => void;
}

export const PomodoroNotificationToast: React.FC<PomodoroNotificationToastProps> = ({
  data,
  onClose,
  onStartNext,
}) => {
  // Auto-dismiss after 25 seconds if not interacted
  useEffect(() => {
    if (!data?.isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, 25000);
    return () => clearTimeout(timer);
  }, [data?.isOpen, onClose]);

  if (!data || !data.isOpen) return null;

  const isCompletedFocus = data.mode === 'focus';

  return (
    <div
      dir="rtl"
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] w-[92vw] max-w-md select-none animate-ios-jelly pointer-events-auto"
    >
      <div className="bg-neutral-900/95 text-white border border-neutral-700/80 shadow-2xl rounded-2xl p-4.5 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                isCompletedFocus
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isCompletedFocus ? (
                <Sparkles className="w-5 h-5 animate-pulse" />
              ) : (
                <Coffee className="w-5 h-5 animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">{data.title}</h4>
                <span className="text-[10px] font-mono bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded flex items-center gap-1 border border-neutral-700">
                  <Bell className="w-2.5 h-2.5 text-amber-400" />
                  <span>پایان زمان</span>
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">{data.message}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg cursor-pointer shrink-0 ios-spring-tool"
            title="بستن اعلان"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action button row */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800/80">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white rounded-xl cursor-pointer ios-spring-btn"
          >
            متوجه شدم
          </button>

          <button
            onClick={() => {
              onStartNext();
              onClose();
            }}
            className={`px-4 py-1.5 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs ios-spring-btn ${
              isCompletedFocus
                ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950'
                : 'bg-amber-400 hover:bg-amber-300 text-neutral-950'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>
              {isCompletedFocus
                ? `شروع استراحت (${data.nextMinutes} دقیقه)`
                : `شروع مطالعه و تمرکز (${data.nextMinutes} دقیقه)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
