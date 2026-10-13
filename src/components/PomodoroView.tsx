import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Coffee,
  Settings,
  Plus,
  Volume2,
} from 'lucide-react';
import { PomodoroMode, PomodoroSettings } from '../types';
import { PomodoroSettingsModal } from './PomodoroSettingsModal';
import { playMinimalPomodoroSound } from '../utils/pomodoroAudio';

interface PomodoroViewProps {
  mode: PomodoroMode;
  timeLeft: number;
  isRunning: boolean;
  completedCount: number;
  settings: PomodoroSettings;
  onSwitchMode: (newMode: PomodoroMode) => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onAddTime: (minutes: number) => void;
  onUpdateSettings: (newSettings: PomodoroSettings) => void;
}

export const PomodoroView: React.FC<PomodoroViewProps> = ({
  mode,
  timeLeft,
  isRunning,
  completedCount,
  settings,
  onSwitchMode,
  onTogglePlay,
  onReset,
  onAddTime,
  onUpdateSettings,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const getModeTotalSeconds = (currentMode: PomodoroMode): number => {
    switch (currentMode) {
      case 'focus':
        return settings.focusDuration * 60;
      case 'short-break':
        return settings.shortBreakDuration * 60;
      case 'long-break':
        return settings.longBreakDuration * 60;
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalSeconds = getModeTotalSeconds(mode);
  const progressPercent = Math.min(100, Math.max(0, ((totalSeconds - timeLeft) / totalSeconds) * 100));

  const soundNameMap: Record<string, string> = {
    crystal: 'کریستالی مینیمال',
    zen: 'ناقوس ذن',
    marimba: 'ماریمبا چوبی',
    bell: 'زنگ ملایم',
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-neutral-50/50 select-none overflow-y-auto">
      {/* Settings Modal */}
      <PomodoroSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={onUpdateSettings}
      />

      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col items-center relative animate-ios-jelly">
        {/* Top Header Row with Settings Trigger */}
        <div className="w-full flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-800">تایمر تمرکز پومودورو</span>
            {isRunning && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            )}
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl cursor-pointer shadow-2xs ios-spring-btn"
            title="تنظیمات زمان‌های دلخواه و صدا"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>تنظیمات</span>
          </button>
        </div>

        {/* Mode Selector Tabs with Customized Times */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-2xl mb-8 w-full">
          <button
            onClick={() => onSwitchMode('focus')}
            className={`flex-1 py-2 text-xs font-medium rounded-xl cursor-pointer text-center flex flex-col sm:flex-row items-center justify-center gap-1 ios-spring-btn ${
              mode === 'focus'
                ? 'bg-white text-neutral-900 shadow-xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>مطالعه</span>
            <span className="text-[10px] font-mono text-neutral-400 font-normal">
              ({settings.focusDuration}m)
            </span>
          </button>
          <button
            onClick={() => onSwitchMode('short-break')}
            className={`flex-1 py-2 text-xs font-medium rounded-xl cursor-pointer text-center flex flex-col sm:flex-row items-center justify-center gap-1 ios-spring-btn ${
              mode === 'short-break'
                ? 'bg-white text-neutral-900 shadow-xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>استراحت کوتاه</span>
            <span className="text-[10px] font-mono text-neutral-400 font-normal">
              ({settings.shortBreakDuration}m)
            </span>
          </button>
          <button
            onClick={() => onSwitchMode('long-break')}
            className={`flex-1 py-2 text-xs font-medium rounded-xl cursor-pointer text-center flex flex-col sm:flex-row items-center justify-center gap-1 ios-spring-btn ${
              mode === 'long-break'
                ? 'bg-white text-neutral-900 shadow-xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>استراحت طولانی</span>
            <span className="text-[10px] font-mono text-neutral-400 font-normal">
              ({settings.longBreakDuration}m)
            </span>
          </button>
        </div>

        {/* Big Tabular Timer */}
        <div className="text-center mb-6">
          <div className="text-7xl sm:text-8xl font-mono font-bold tracking-tight text-neutral-900 tabular-nums">
            {formattedTime}
          </div>
          <p className="text-xs text-neutral-400 mt-3 flex items-center justify-center gap-1.5">
            {mode === 'focus' ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>جلسه تمرکز روی جزوه و کتاب ({settings.focusDuration} دقیقه)</span>
              </>
            ) : mode === 'short-break' ? (
              <>
                <Coffee className="w-3.5 h-3.5 text-emerald-600" />
                <span>تنفس کوتاه، نوشیدن آب و بازیابی انرژی ({settings.shortBreakDuration} دقیقه)</span>
              </>
            ) : (
              <>
                <Coffee className="w-3.5 h-3.5 text-indigo-600" />
                <span>استراحت طولانی و عمیق ({settings.longBreakDuration} دقیقه)</span>
              </>
            )}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden mb-6">
          <div
            className={`h-full transition-all duration-300 ${
              mode === 'focus'
                ? 'bg-neutral-900'
                : mode === 'short-break'
                ? 'bg-emerald-600'
                : 'bg-indigo-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Quick Add Time Chips */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => onAddTime(1)}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer ios-spring-btn"
            title="افزودن ۱ دقیقه"
          >
            <Plus className="w-3 h-3" />
            <span>1+ دقیقه</span>
          </button>
          <button
            onClick={() => onAddTime(5)}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer ios-spring-btn"
            title="افزودن ۵ دقیقه"
          >
            <Plus className="w-3 h-3" />
            <span>5+ دقیقه</span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onTogglePlay}
            className={`px-8 py-3.5 font-bold text-sm rounded-2xl cursor-pointer flex items-center gap-2.5 shadow-sm ios-spring-btn ${
              isRunning
                ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300'
                : 'bg-neutral-900 hover:bg-neutral-800 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>توقف تایمر</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{mode === 'focus' ? 'شروع مطالعه' : 'شروع استراحت'}</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="p-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-900 rounded-2xl cursor-pointer ios-spring-tool"
            title="بازنشانی تایمر به مقدار اولیه"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Info Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 font-mono tabular-nums pt-4 border-t border-neutral-100 w-full">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>تکمیل‌شده امروز: {completedCount} دوره</span>
          </div>

          <div
            onClick={() => playMinimalPomodoroSound(settings.soundType, settings.soundVolume)}
            className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-700 cursor-pointer text-[11px]"
            title="کلیک برای تست صدای آلارم"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>صدای آلارم: {soundNameMap[settings.soundType] || 'کریستالی'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
