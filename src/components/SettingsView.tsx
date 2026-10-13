import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Eye,
  Sliders,
  BookOpen,
  Timer,
  Volume2,
  Bell,
  Keyboard,
  HardDrive,
  Info,
  Check,
  RotateCcw,
  X,
  ChevronLeft,
  MousePointer,
  PenTool,
  Highlighter,
  Ruler,
  Eraser,
  StickyNote,
  Download,
  Trash2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  EyeComfortSettings,
  EyeComfortMode,
  PomodoroSettings,
  PomodoroSound,
  ToolShortcuts,
} from '../types';
import { AppleCapsuleSlider } from './AppleCapsuleSlider';
import { FlatHandIcon } from './FlatHandIcon';
import { playMinimalPomodoroSound } from '../utils/pomodoroAudio';

type SettingsTab = 'display' | 'tools' | 'pomodoro' | 'shortcuts' | 'storage' | 'about';

interface SettingsViewProps {
  eyeComfortSettings: EyeComfortSettings;
  onUpdateEyeComfortSettings: (newSettings: EyeComfortSettings) => void;
  pomodoroSettings?: PomodoroSettings;
  onUpdatePomodoroSettings?: (newSettings: PomodoroSettings) => void;
  shortcuts?: ToolShortcuts;
  onUpdateShortcuts?: (newShortcuts: ToolShortcuts) => void;
  onResetShortcuts?: () => void;
  studyFilesCount?: number;
  notesCount?: number;
  sessionsCount?: number;
  onClearSessions?: () => void;
  isModal?: boolean;
  onClose?: () => void;
  fileName?: string;
}

const DEFAULT_POMODORO: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  roundsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundType: 'crystal',
  soundVolume: 0.65,
  browserNotifications: true,
};

const DEFAULT_SHORTCUTS: ToolShortcuts = {
  hand: '1',
  select: '2',
  pen: '3',
  highlighter: '4',
  ruler: '5',
  eraser: '6',
  stickyNote: '7',
};

const SHORTCUT_STORAGE_KEY = 'study_capsule_shortcuts';

export const SettingsView: React.FC<SettingsViewProps> = ({
  eyeComfortSettings,
  onUpdateEyeComfortSettings,
  pomodoroSettings,
  onUpdatePomodoroSettings,
  shortcuts,
  onUpdateShortcuts,
  onResetShortcuts,
  studyFilesCount = 0,
  notesCount = 0,
  sessionsCount = 0,
  onClearSessions,
  isModal = false,
  onClose,
  fileName,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('display');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<keyof ToolShortcuts | null>(null);

  // Self-sufficient Shortcuts state: always populated, active and persisted
  const [localShortcuts, setLocalShortcuts] = useState<ToolShortcuts>(() => {
    if (shortcuts) return shortcuts;
    try {
      const saved = localStorage.getItem(SHORTCUT_STORAGE_KEY);
      if (saved) return { ...DEFAULT_SHORTCUTS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SHORTCUTS;
  });

  useEffect(() => {
    if (shortcuts) {
      setLocalShortcuts(shortcuts);
    }
  }, [shortcuts]);

  const activeShortcuts = shortcuts || localShortcuts;

  const handleSaveShortcuts = (newShortcuts: ToolShortcuts) => {
    setLocalShortcuts(newShortcuts);
    try {
      localStorage.setItem(SHORTCUT_STORAGE_KEY, JSON.stringify(newShortcuts));
    } catch {}
    if (onUpdateShortcuts) {
      onUpdateShortcuts(newShortcuts);
    }
  };

  const handleResetShortcutsInternal = () => {
    handleSaveShortcuts(DEFAULT_SHORTCUTS);
    if (onResetShortcuts) {
      onResetShortcuts();
    }
  };

  // Self-sufficient Pomodoro state: always populated and active
  const [localPomodoro, setLocalPomodoro] = useState<PomodoroSettings>(() => {
    if (pomodoroSettings) return pomodoroSettings;
    try {
      const saved = localStorage.getItem('pomodoro_settings');
      if (saved) return { ...DEFAULT_POMODORO, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_POMODORO;
  });

  useEffect(() => {
    if (pomodoroSettings) {
      setLocalPomodoro(pomodoroSettings);
    }
  }, [pomodoroSettings]);

  const handleSavePomodoro = (newSettings: PomodoroSettings) => {
    setLocalPomodoro(newSettings);
    try {
      localStorage.setItem('pomodoro_settings', JSON.stringify(newSettings));
    } catch {}
    if (onUpdatePomodoroSettings) {
      onUpdatePomodoroSettings(newSettings);
    }
  };

  // Tool preferences (persisted in localStorage)
  const [autoStraighten, setAutoStraighten] = useState<boolean>(() => {
    return localStorage.getItem('study_pref_straighten') !== 'false';
  });
  const [rulerLock90, setRulerLock90] = useState<boolean>(() => {
    return localStorage.getItem('study_pref_ruler90') !== 'false';
  });
  const [autoSaveOnExit, setAutoSaveOnExit] = useState<boolean>(() => {
    return localStorage.getItem('study_pref_autosave') !== 'false';
  });

  const handleToggleAutoStraighten = (val: boolean) => {
    setAutoStraighten(val);
    localStorage.setItem('study_pref_straighten', String(val));
  };

  const handleToggleRulerLock90 = (val: boolean) => {
    setRulerLock90(val);
    localStorage.setItem('study_pref_ruler90', String(val));
  };

  const handleToggleAutoSave = (val: boolean) => {
    setAutoSaveOnExit(val);
    localStorage.setItem('study_pref_autosave', String(val));
  };

  // Factory reset
  const handleFactoryReset = () => {
    onUpdateEyeComfortSettings({
      brightness: 100,
      colorMode: 'normal',
      warmth: 50,
    });
    handleSavePomodoro(DEFAULT_POMODORO);
    handleResetShortcutsInternal();
    setAutoStraighten(true);
    setRulerLock90(true);
    setAutoSaveOnExit(true);
    localStorage.removeItem('study_pref_straighten');
    localStorage.removeItem('study_pref_ruler90');
    localStorage.removeItem('study_pref_autosave');
    setShowResetConfirm(false);
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        eyeComfortSettings,
        pomodoroSettings: localPomodoro,
        shortcuts,
        preferences: {
          autoStraighten,
          rulerLock90,
          autoSaveOnExit,
        },
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study_space_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export backup', e);
    }
  };

  // Shortcut key assignment
  const handleKeyDownCapture = (e: React.KeyboardEvent) => {
    if (!editingShortcut) return;
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      setEditingShortcut(null);
      return;
    }

    const key = e.key.toLowerCase();
    if (key.length === 1 || ['f1', 'f2', 'f3', 'f4', 'f5'].includes(key)) {
      handleSaveShortcuts({
        ...activeShortcuts,
        [editingShortcut]: key,
      });
      setEditingShortcut(null);
    }
  };

  // Category definitions with Apple squircle badge colors
  const categories: {
    id: SettingsTab;
    title: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    color: string;
  }[] = [
    {
      id: 'display',
      title: 'نمایشگر و راحتی چشم',
      description: 'نور، رنگ کاغذ و فیلترهای ضد خستگی',
      icon: Sun,
      color: 'bg-neutral-800 text-white',
    },
    {
      id: 'tools',
      title: 'ابزارها و نشانه‌گذاری',
      description: 'تنظیمات قلم، هایلایتر و خط‌کش',
      icon: PenTool,
      color: 'bg-blue-600 text-white',
    },
    {
      id: 'pomodoro',
      title: 'پومودورو و تمرکز',
      description: 'زمان‌بندی، هشدارها و صدای اعلان',
      icon: Timer,
      color: 'bg-rose-500 text-white',
    },
    {
      id: 'shortcuts',
      title: 'کلیدهای میانبر',
      description: 'شخصی‌سازی دکمه‌های سریع کیبورد',
      icon: Keyboard,
      color: 'bg-slate-700 text-white',
    },
    {
      id: 'storage',
      title: 'حافظه و داده‌ها',
      description: 'مدیریت فضای ذخیره و پشتیبان‌گیری',
      icon: HardDrive,
      color: 'bg-emerald-600 text-white',
    },
    {
      id: 'about',
      title: 'درباره برنامه',
      description: 'اطلاعات نسخه و فلسفه طراحی',
      icon: Info,
      color: 'bg-indigo-600 text-white',
    },
  ];

  // Apple UISwitch Toggle
  const AppleToggle = ({
    checked,
    onChange,
    disabled = false,
  }: {
    checked: boolean;
    onChange: (val: boolean) => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-250 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 ${
        checked ? 'bg-[#34C759]' : 'bg-neutral-200'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-md transform transition-transform duration-250 ease-in-out ${
          checked ? '-translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );

  // Live preview calculations for display tab
  let previewBg = 'bg-white text-neutral-900 border-neutral-200';
  let previewHighlight = 'bg-neutral-100 text-neutral-900 border border-neutral-200';
  let previewMuted = 'text-neutral-500';

  if (eyeComfortSettings.colorMode === 'yellow') {
    previewBg = 'bg-[#faf2df] text-amber-950 border-amber-300/80';
    previewHighlight = 'bg-amber-200/80 text-amber-950 border border-amber-300';
    previewMuted = 'text-amber-900/80';
  } else if (eyeComfortSettings.colorMode === 'dark-gray') {
    previewBg = 'bg-[#18181b] text-neutral-100 border-neutral-700/80';
    previewHighlight = 'bg-neutral-800 text-neutral-200 border border-neutral-600';
    previewMuted = 'text-neutral-400';
  } else if (eyeComfortSettings.colorMode === 'soft-gray') {
    previewBg = 'bg-[#f0f0f4] text-neutral-800 border-neutral-300/80';
    previewHighlight = 'bg-neutral-300/80 text-neutral-900 border border-neutral-300';
    previewMuted = 'text-neutral-500';
  }

  // Active Tab Content
  const renderCategoryContent = () => {
    switch (activeTab) {
      case 'display':
        return (
          <div className="space-y-8 max-w-4xl">
            {/* 1. Appearance / Paper Modes: Spacious, roomy cards */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900">حالت رنگ و پس‌زمینه صفحات</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  رنگ بهینه کاغذ مانع از انقباض و خستگی چشم در جلسات طولانی مطالعه می‌شود.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Mode 1: Normal White */}
                <button
                  type="button"
                  onClick={() =>
                    onUpdateEyeComfortSettings({
                      ...eyeComfortSettings,
                      colorMode: 'normal',
                    })
                  }
                  className={`p-4 rounded-2xl border-2 text-center cursor-pointer flex flex-col items-center justify-between h-36 transition-all ${
                    eyeComfortSettings.colorMode === 'normal'
                      ? 'border-neutral-900 bg-neutral-50 shadow-xs'
                      : 'border-neutral-200/90 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <div className="w-18 h-12 rounded-xl bg-white border border-neutral-200 shadow-2xs flex flex-col justify-center items-center gap-1.5 p-2">
                    <div className="w-12 h-1.5 bg-neutral-300 rounded-full" />
                    <div className="w-8 h-1 bg-neutral-200 rounded-full" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-900 block">سفید روز</span>
                    <span className="text-[11px] text-neutral-400 block mt-0.5">استاندارد</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      eyeComfortSettings.colorMode === 'normal'
                        ? 'bg-neutral-900 text-white'
                        : 'border border-neutral-300'
                    }`}
                  >
                    {eyeComfortSettings.colorMode === 'normal' && (
                      <Check className="w-2.5 h-2.5" />
                    )}
                  </div>
                </button>

                {/* Mode 2: Yellow Paper */}
                <button
                  type="button"
                  onClick={() =>
                    onUpdateEyeComfortSettings({
                      ...eyeComfortSettings,
                      colorMode: 'yellow',
                    })
                  }
                  className={`p-4 rounded-2xl border-2 text-center cursor-pointer flex flex-col items-center justify-between h-36 transition-all ${
                    eyeComfortSettings.colorMode === 'yellow'
                      ? 'border-neutral-900 bg-[#fbf5e6] shadow-xs'
                      : 'border-neutral-200/90 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <div className="w-18 h-12 rounded-xl bg-[#fcf4de] border border-amber-300/80 shadow-2xs flex flex-col justify-center items-center gap-1.5 p-2">
                    <div className="w-12 h-1.5 bg-amber-800/40 rounded-full" />
                    <div className="w-8 h-1 bg-amber-700/30 rounded-full" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-950 block">کاغذ کتاب</span>
                    <span className="text-[11px] text-amber-800/80 block mt-0.5">ضد خستگی</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      eyeComfortSettings.colorMode === 'yellow'
                        ? 'bg-neutral-900 text-white'
                        : 'border border-neutral-300'
                    }`}
                  >
                    {eyeComfortSettings.colorMode === 'yellow' && (
                      <Check className="w-2.5 h-2.5" />
                    )}
                  </div>
                </button>

                {/* Mode 3: Dark Gray */}
                <button
                  type="button"
                  onClick={() =>
                    onUpdateEyeComfortSettings({
                      ...eyeComfortSettings,
                      colorMode: 'dark-gray',
                    })
                  }
                  className={`p-4 rounded-2xl border-2 text-center cursor-pointer flex flex-col items-center justify-between h-36 transition-all ${
                    eyeComfortSettings.colorMode === 'dark-gray'
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                      : 'border-neutral-200/90 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <div className="w-18 h-12 rounded-xl bg-[#222225] border border-neutral-700 shadow-2xs flex flex-col justify-center items-center gap-1.5 p-2">
                    <div className="w-12 h-1.5 bg-neutral-500 rounded-full" />
                    <div className="w-8 h-1 bg-neutral-600 rounded-full" />
                  </div>
                  <div>
                    <span
                      className={`text-xs font-bold block ${
                        eyeComfortSettings.colorMode === 'dark-gray'
                          ? 'text-white'
                          : 'text-neutral-900'
                      }`}
                    >
                      طوسی شب
                    </span>
                    <span className="text-[11px] text-neutral-400 block mt-0.5">تاریک ملایم</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      eyeComfortSettings.colorMode === 'dark-gray'
                        ? 'bg-white text-neutral-900'
                        : 'border border-neutral-300'
                    }`}
                  >
                    {eyeComfortSettings.colorMode === 'dark-gray' && (
                      <Check className="w-2.5 h-2.5" />
                    )}
                  </div>
                </button>

                {/* Mode 4: Soft Gray */}
                <button
                  type="button"
                  onClick={() =>
                    onUpdateEyeComfortSettings({
                      ...eyeComfortSettings,
                      colorMode: 'soft-gray',
                    })
                  }
                  className={`p-4 rounded-2xl border-2 text-center cursor-pointer flex flex-col items-center justify-between h-36 transition-all ${
                    eyeComfortSettings.colorMode === 'soft-gray'
                      ? 'border-neutral-900 bg-neutral-100 shadow-xs'
                      : 'border-neutral-200/90 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <div className="w-18 h-12 rounded-xl bg-[#eaebee] border border-neutral-300 shadow-2xs flex flex-col justify-center items-center gap-1.5 p-2">
                    <div className="w-12 h-1.5 bg-neutral-400 rounded-full" />
                    <div className="w-8 h-1 bg-neutral-300 rounded-full" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-900 block">طوسی ملایم</span>
                    <span className="text-[11px] text-neutral-400 block mt-0.5">نور خنثی</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      eyeComfortSettings.colorMode === 'soft-gray'
                        ? 'bg-neutral-900 text-white'
                        : 'border border-neutral-300'
                    }`}
                  >
                    {eyeComfortSettings.colorMode === 'soft-gray' && (
                      <Check className="w-2.5 h-2.5" />
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Apple Minimalist Brightness Control (NO loud orange, pure clean Apple monochrome) */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden divide-y divide-neutral-100">
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-neutral-700" />
                    <div>
                      <span className="text-sm font-bold text-neutral-900 block">
                        روشنایی نمایشگر و جزوه
                      </span>
                      <span className="text-xs text-neutral-500 block mt-0.5">
                        تنظیم شدت نور متناسب با روشنایی محیط اتاق
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-neutral-900 tabular-nums bg-neutral-100 border border-neutral-200 px-3 py-1 rounded-lg">
                    {eyeComfortSettings.brightness}٪
                  </span>
                </div>

                {/* Pure Minimalist Apple Slider */}
                <AppleCapsuleSlider
                  value={eyeComfortSettings.brightness}
                  min={40}
                  max={120}
                  step={5}
                  onChange={(val) =>
                    onUpdateEyeComfortSettings({
                      ...eyeComfortSettings,
                      brightness: val,
                    })
                  }
                  color="neutral"
                  unit="٪"
                  leftIcon={<Sun className="w-4 h-4 text-neutral-400" />}
                  rightIcon={<Sun className="w-5 h-5 text-neutral-400" />}
                />
              </div>

              {/* Warmth Slider (Active when Book Paper is chosen) */}
              {eyeComfortSettings.colorMode === 'yellow' && (
                <div className="p-5 sm:p-6 space-y-4 bg-neutral-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-neutral-900 block">
                        گرمای رنگ زرد کاغذ
                      </span>
                      <span className="text-xs text-neutral-500 block mt-0.5">
                        کاهش نور آبی برای حفظ شادابی چشم و تمرکز پایدار
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-neutral-800 tabular-nums bg-white border border-neutral-200 px-3 py-1 rounded-lg">
                      {eyeComfortSettings.warmth}٪
                    </span>
                  </div>

                  <AppleCapsuleSlider
                    value={eyeComfortSettings.warmth}
                    min={25}
                    max={75}
                    step={5}
                    onChange={(val) =>
                      onUpdateEyeComfortSettings({
                        ...eyeComfortSettings,
                        warmth: val,
                      })
                    }
                    color="neutral"
                    unit="٪"
                  />
                </div>
              )}
            </div>

            {/* 3. Live Apple Reading Mode Preview: Generous and spacious */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-500 block">
                پیش‌نمایش بلادرنگ نمونه متن مطالعه
              </span>
              <div
                className={`relative p-5 sm:p-6 rounded-2xl border shadow-xs transition-all overflow-hidden ${previewBg}`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span>فصل اول: ساختار یادگیری و تمرکز عمیق</span>
                  <span className={`text-[11px] ${previewMuted}`}>صفحه ۱ از ۲۴</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed mb-3">
                  تحقیقات نشان می‌دهد تنظیم بهینه نور صفحه متناسب با روشنایی محیط، خستگی عضله‌های
                  چشم را تا ۶۵ درصد کاهش داده و بازدهی جلسات مطالعه را به حداکثر می‌رساند.
                </p>
                <div className={`p-3 rounded-xl text-xs font-medium ${previewHighlight}`}>
                  نکته کلیدی: هر ۴۵ دقیقه به مدت ۲۰ ثانیه به فاصله‌ای دور نگاه کنید تا چشم استراحت
                  کند.
                </div>

                {/* Ambient Dimmer Overlay */}
                {eyeComfortSettings.brightness < 100 && (
                  <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-150"
                    style={{
                      backgroundColor: '#000000',
                      opacity: Math.max(0, Math.min(0.72, ((100 - eyeComfortSettings.brightness) / 100) * 0.72)),
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        );

      case 'tools':
        return (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h3 className="text-base font-bold text-neutral-900">تنظیمات ابزارها و بوم کار</h3>
              <p className="text-xs text-neutral-500 mt-1">
                شخصی‌سازی نحوه کارکرد نشانه‌گذاری، خط‌کش هوشمند و ذخیره‌سازی جزوه‌ها
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden divide-y divide-neutral-100">
              <div className="p-5 flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-semibold text-neutral-900 block">
                    صاف کردن خودکار خطوط هایلایتر
                  </span>
                  <span className="text-xs text-neutral-500 block mt-0.5">
                    خطوط هایلایت کشیده شده به طور هوشمند روی خط صاف تراز می‌شوند
                  </span>
                </div>
                <AppleToggle
                  checked={autoStraighten}
                  onChange={handleToggleAutoStraighten}
                />
              </div>

              <div className="p-5 flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-semibold text-neutral-900 block">
                    قفل زاویه خط‌کش روی ۹۰ درجه
                  </span>
                  <span className="text-xs text-neutral-500 block mt-0.5">
                    خطوط رسم شده با خط‌کش به صورت افقی یا عمودی دقیق ثبت می‌شوند
                  </span>
                </div>
                <AppleToggle
                  checked={rulerLock90}
                  onChange={handleToggleRulerLock90}
                />
              </div>

              <div className="p-5 flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-semibold text-neutral-900 block">
                    ذخیره خودکار تغییرات در هنگام خروج
                  </span>
                  <span className="text-xs text-neutral-500 block mt-0.5">
                    یادداشت‌ها و خطوط رسم‌شده بدون نیاز به تایید دستی روی جزوه ذخیره می‌شوند
                  </span>
                </div>
                <AppleToggle
                  checked={autoSaveOnExit}
                  onChange={handleToggleAutoSave}
                />
              </div>
            </div>

            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-neutral-600 shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-600 leading-relaxed">
                برای تغییر رنگ یا ضخامت هر ابزار (قلم، هایلایتر، خط‌کش، پاک‌کن)، در نوار پایین صفحه روی
                آیکون آن ابزار <strong className="text-neutral-900 font-bold">دوبار کلیک</strong> کنید
                یا از کلیدهای میانبر کیبورد بهره بگیرید.
              </div>
            </div>
          </div>
        );

      case 'pomodoro':
        return (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h3 className="text-base font-bold text-neutral-900">تنظیمات پومودورو و تمرکز</h3>
              <p className="text-xs text-neutral-500 mt-1">
                تنظیم چرخه‌های مطالعه، زنگ اعلان‌ها و ترنزیشن‌های خودکار
              </p>
            </div>

            <div className="space-y-6">
              {/* Durations Group */}
              <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden divide-y divide-neutral-100">
                {/* Focus duration */}
                <div className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-semibold text-neutral-900 block">
                      مدت زمان تمرکز (دقیقه)
                    </span>
                    <span className="text-xs text-neutral-500 block mt-0.5">
                      مدت زمان هر دور مطالعه بدون حواس‌پرتی
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-neutral-100 p-1.5 rounded-xl">
                    {[15, 20, 25, 30, 45, 50].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() =>
                          handleSavePomodoro({
                            ...localPomodoro,
                            focusDuration: mins,
                          })
                        }
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          localPomodoro.focusDuration === mins
                            ? 'bg-white text-neutral-900 shadow-xs'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        {mins}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Short break duration */}
                <div className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-semibold text-neutral-900 block">
                      استراحت کوتاه (دقیقه)
                    </span>
                    <span className="text-xs text-neutral-500 block mt-0.5">
                      فاصله میان هر دور مطالعه
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-neutral-100 p-1.5 rounded-xl">
                    {[3, 5, 8, 10].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() =>
                          handleSavePomodoro({
                            ...localPomodoro,
                            shortBreakDuration: mins,
                          })
                        }
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          localPomodoro.shortBreakDuration === mins
                            ? 'bg-white text-neutral-900 shadow-xs'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        {mins}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Long break duration */}
                <div className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-semibold text-neutral-900 block">
                      استراحت طولانی (دقیقه)
                    </span>
                    <span className="text-xs text-neutral-500 block mt-0.5">
                      استراحت عمیق پس از تکمیل چندین دور متوالی
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-neutral-100 p-1.5 rounded-xl">
                    {[15, 20, 30].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() =>
                          handleSavePomodoro({
                            ...localPomodoro,
                            longBreakDuration: mins,
                          })
                        }
                        className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          localPomodoro.longBreakDuration === mins
                            ? 'bg-white text-neutral-900 shadow-xs'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        {mins}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Automation & Sound Group */}
              <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden divide-y divide-neutral-100">
                {/* Auto-start breaks */}
                <div className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-semibold text-neutral-900 block">
                      شروع خودکار زمان استراحت
                    </span>
                    <span className="text-xs text-neutral-500 block mt-0.5">
                      پس از پایان زمان تمرکز، تایمر استراحت بلافاصله فعال شود
                    </span>
                  </div>
                  <AppleToggle
                    checked={localPomodoro.autoStartBreaks}
                    onChange={(val) =>
                      handleSavePomodoro({
                        ...localPomodoro,
                        autoStartBreaks: val,
                      })
                    }
                  />
                </div>

                {/* Sound Type */}
                <div className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-semibold text-neutral-900 block">
                      صدای زنگ پایان زمان
                    </span>
                    <span className="text-xs text-neutral-500 block mt-0.5">
                      تن ملایم و آرامش‌بخش اعلان (همراه با تست صدا)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-neutral-100 p-1.5 rounded-xl">
                    {(
                      [
                        { id: 'crystal', label: 'کریستال' },
                        { id: 'zen', label: 'ذن' },
                        { id: 'marimba', label: 'ماریمبا' },
                        { id: 'bell', label: 'زنگوله' },
                      ] as { id: PomodoroSound; label: string }[]
                    ).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          handleSavePomodoro({
                            ...localPomodoro,
                            soundType: s.id,
                          });
                          playMinimalPomodoroSound(s.id, localPomodoro.soundVolume);
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          localPomodoro.soundType === s.id
                            ? 'bg-white text-neutral-900 shadow-xs'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Browser Notifications */}
                <div className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-semibold text-neutral-900 block">
                      اعلان‌های مرورگر
                    </span>
                    <span className="text-xs text-neutral-500 block mt-0.5">
                      نمایش اعلان سیستم هنگام کار در تب‌های دیگر
                    </span>
                  </div>
                  <AppleToggle
                    checked={localPomodoro.browserNotifications}
                    onChange={(val) => {
                      if (val && 'Notification' in window) {
                        Notification.requestPermission();
                      }
                      handleSavePomodoro({
                        ...localPomodoro,
                        browserNotifications: val,
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'shortcuts':
        return (
          <div className="space-y-6 max-w-4xl" onKeyDown={handleKeyDownCapture}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900">کلیدهای میانبر سریع کیبورد</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  برای تغییر هر کلید روی آن کلیک کنید و سپس کلید جدید را روی کیبورد فشار دهید.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetShortcutsInternal}
                className="px-3.5 py-2 text-xs text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>بازنشانی پیش‌فرض</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden divide-y divide-neutral-100">
              {[
                { id: 'hand' as const, label: 'ابزار دست (جابجایی)', icon: FlatHandIcon },
                { id: 'select' as const, label: 'ابزار انتخاب و حرکت دادن', icon: MousePointer },
                { id: 'pen' as const, label: 'قلم یادداشت‌برداری', icon: PenTool },
                { id: 'highlighter' as const, label: 'هایلایتر متن', icon: Highlighter },
                { id: 'ruler' as const, label: 'خط‌کش و آندرلاین', icon: Ruler },
                { id: 'eraser' as const, label: 'پاک‌کن خطوط', icon: Eraser },
                { id: 'stickyNote' as const, label: 'یادداشت چسبان', icon: StickyNote },
              ].map((item) => {
                const Icon = item.icon;
                const currentKey = activeShortcuts[item.id] || '';
                const isEditing = editingShortcut === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">{item.label}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingShortcut(isEditing ? null : item.id)}
                      className={`min-w-20 px-3.5 py-2 rounded-xl border font-mono font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center justify-center ${
                        isEditing
                          ? 'bg-neutral-900 text-white border-neutral-900 animate-pulse'
                          : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200'
                      }`}
                    >
                      {isEditing ? 'فشار دهید...' : currentKey.toUpperCase()}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'storage':
        return (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h3 className="text-base font-bold text-neutral-900">حافظه و مدیریت داده‌ها</h3>
              <p className="text-xs text-neutral-500 mt-1">
                تمام فایل‌ها و یادداشت‌های شما به صورت امن و آفلاین روی مرورگر نگهداری می‌شوند.
              </p>
            </div>

            {/* Storage Metric Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-5 bg-white rounded-2xl border border-neutral-200/90 shadow-2xs">
                <span className="text-xs text-neutral-500 block">فایل‌های جزوه</span>
                <span className="text-xl font-bold text-neutral-900 mt-1.5 block">
                  {studyFilesCount} فایل
                </span>
              </div>
              <div className="p-5 bg-white rounded-2xl border border-neutral-200/90 shadow-2xs">
                <span className="text-xs text-neutral-500 block">یادداشت‌های متنی</span>
                <span className="text-xl font-bold text-neutral-900 mt-1.5 block">
                  {notesCount} یادداشت
                </span>
              </div>
              <div className="p-5 bg-white rounded-2xl border border-neutral-200/90 shadow-2xs">
                <span className="text-xs text-neutral-500 block">جلسات پومودورو</span>
                <span className="text-xl font-bold text-neutral-900 mt-1.5 block">
                  {sessionsCount} جلسه
                </span>
              </div>
            </div>

            {/* Actions Inset Card */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden divide-y divide-neutral-100">
              <div className="p-5 flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-semibold text-neutral-900 block">
                    پشتیبان‌گیری از تنظیمات (Export)
                  </span>
                  <span className="text-xs text-neutral-500 block mt-0.5">
                    دریافت فایل JSON از کلیه تنظیمات، شورتکات‌ها و اولویت‌های شخصی‌سازی
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود فایل</span>
                </button>
              </div>

              {onClearSessions && (
                <div className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-semibold text-neutral-900 block">
                      پاک‌سازی تاریخچه جلسات پومودورو
                    </span>
                    <span className="text-xs text-neutral-500 block mt-0.5">
                      حذف آمارهای قدیمی مطالعه بدون آسیب به فایل‌ها یا یادداشت‌ها
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('آیا از پاک‌سازی تاریخچه پومودورو اطمینان دارید؟')) {
                        onClearSessions();
                      }
                    }}
                    className="px-4 py-2 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl cursor-pointer border border-rose-200"
                  >
                    پاک‌سازی آمار
                  </button>
                </div>
              )}

              <div className="p-5 flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-semibold text-rose-600 block">
                    بازنشانی کامل تنظیمات به حالت اولیه
                  </span>
                  <span className="text-xs text-neutral-500 block mt-0.5">
                    برگرداندن روشنایی، رنگ‌ها، پومودورو و کلیدهای میانبر به حالت پیش‌فرض کارخانه
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-2xs"
                >
                  بازنشانی همه
                </button>
              </div>
            </div>

            {showResetConfirm && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                <span className="text-xs font-bold text-rose-900 block">
                  آیا مطمئن هستید که می‌خواهید تمام تنظیمات را به مقادیر اولیه برگردانید؟
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFactoryReset}
                    className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-rose-700"
                  >
                    بله، بازنشانی شود
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-4 py-1.5 bg-white text-neutral-700 text-xs font-bold rounded-xl border border-neutral-300 cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h3 className="text-base font-bold text-neutral-900">درباره برنامه میز مطالعه</h3>
              <p className="text-xs text-neutral-500 mt-1">
                طراحی شده برای تمرکز عمیق، راحتی چشم و حداکثر بهره‌وری در یادگیری
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden divide-y divide-neutral-100">
              <div className="p-5 flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-900">نام نرم‌افزار</span>
                <span className="text-xs text-neutral-600 font-medium">
                  میز مطالعه (Study Space)
                </span>
              </div>
              <div className="p-5 flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-900">نسخه</span>
                <span className="text-xs font-mono font-bold text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded-lg">
                  v2.5.0 Stable
                </span>
              </div>
              <div className="p-5 flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-900">زبان و سبک طراحی</span>
                <span className="text-xs text-neutral-600">
                  مینیمال، الهام‌گرفته از سیستم‌عامل macOS و iPadOS
                </span>
              </div>
              <div className="p-5 flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-900">امنیت اطلاعات</span>
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  ۱۰۰٪ محلی و آفلاین روی مرورگر شما
                </span>
              </div>
            </div>

            <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-xs text-neutral-600 leading-relaxed">
              این پلتفرم به شما امکان می‌دهد کتاب‌ها و جزوه‌های درسی PDF خود را مستقیماً باز کنید،
              نشانه‌گذاری و هایلایت انجام دهید، از تایمر پومودورو برای ریتم مطالعه استفاده نمایید و بدون
              هیچ حواس‌پرتی روی پیشرفت تحصیلی خود متمرکز بمانید.
            </div>
          </div>
        );
    }
  };

  // Main Card: Full, spacious, expansive window
  const content = (
    <div
      className={`bg-white border border-neutral-200/90 shadow-xs flex flex-col select-none overflow-hidden ${
        isModal
          ? 'w-[96vw] max-w-7xl h-[94vh] max-h-[960px] rounded-3xl shadow-2xl my-auto'
          : 'w-full h-full rounded-3xl'
      }`}
      dir="rtl"
    >
      {/* Top Header */}
      <div className="px-6 sm:px-8 py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-neutral-900">تنظیمات</h2>
              <span className="text-xs text-neutral-400 font-medium">·</span>
              <span className="text-xs sm:text-sm text-neutral-600 font-medium">
                {categories.find((c) => c.id === activeTab)?.title}
              </span>
            </div>
            {fileName && (
              <p className="text-xs text-neutral-400 truncate max-w-xs sm:max-w-md mt-0.5">
                سند فعال: {fileName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 flex items-center justify-center cursor-pointer transition-colors"
              title="بستن تنظیمات"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Split View: Apple Sidebar on right (RTL), Main Content on left */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Apple Sidebar Navigation: Comfortable, spacious */}
        <div className="w-full md:w-68 lg:w-72 border-b md:border-b-0 md:border-l border-neutral-100 p-3 sm:p-4 space-y-1.5 bg-neutral-50/40 shrink-0 overflow-y-auto">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`w-full p-3 rounded-xl flex items-center justify-between transition-colors cursor-pointer text-right group ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'hover:bg-neutral-100/90 text-neutral-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${
                      isActive ? 'bg-neutral-800 text-white' : cat.color
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`text-xs sm:text-sm font-semibold block truncate ${
                        isActive ? 'text-white' : 'text-neutral-900'
                      }`}
                    >
                      {cat.title}
                    </span>
                  </div>
                </div>

                <ChevronLeft
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive
                      ? 'text-neutral-400 -translate-x-0.5'
                      : 'text-neutral-300 group-hover:text-neutral-500'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Content Pane: Generous padding, maximum space */}
        <div className="flex-1 p-6 sm:p-8 md:p-10 overflow-y-auto min-h-0 bg-neutral-50/20">
          {renderCategoryContent()}
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-200">
        {content}
      </div>
    );
  }

  return <div className="w-full h-full p-2 sm:p-4">{content}</div>;
};
