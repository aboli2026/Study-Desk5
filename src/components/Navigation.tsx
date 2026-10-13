import React from 'react';
import { FileUp, Edit3, Timer, BarChart2, BookOpen, ChevronLeft, FileText, SlidersHorizontal, Activity } from 'lucide-react';
import { ActiveTab, StudyFile } from '../types';
import { useDisplayRefreshRate } from '../utils/performanceEngine';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentFile: StudyFile | null;
  onOpenFilePicker?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  currentFile,
  onOpenFilePicker,
}) => {
  const perfStats = useDisplayRefreshRate();
  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    {
      id: 'open-file',
      label: 'باز کردن فایل',
      icon: FileUp,
    },
    {
      id: 'library',
      label: 'کتابخانه',
      icon: BookOpen,
    },
    {
      id: 'notes',
      label: 'یادداشت',
      icon: Edit3,
    },
    {
      id: 'pomodoro',
      label: 'پومودورو',
      icon: Timer,
    },
    {
      id: 'analytics',
      label: 'تجزیه تحلیل عملکرد',
      icon: BarChart2,
    },
    {
      id: 'settings',
      label: 'تنظیمات',
      icon: SlidersHorizontal,
    },
  ];

  return (
    <div className="w-64 sm:w-72 h-full bg-white rounded-2xl border border-neutral-200 shadow-xs flex flex-col shrink-0 select-none overflow-hidden">
      {/* Brand Header */}
      <div className="p-4 border-b border-neutral-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-neutral-900">میز مطالعه</h1>
        </div>
      </div>

      {/* Cards Stacked Underneath Each Other Inside the Frame */}
      <div className="flex-1 p-3.5 space-y-2.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <div
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                if (item.id === 'open-file' && onOpenFilePicker) {
                  onOpenFilePicker();
                }
              }}
              className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between group ios-spring-card ${
                isActive
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                  : 'bg-white text-neutral-700 border-neutral-200/90 hover:border-neutral-300 hover:bg-neutral-50/80 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-neutral-800 text-white'
                      : 'bg-neutral-100 text-neutral-700 group-hover:bg-neutral-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-xs md:text-sm font-bold truncate ${
                      isActive ? 'text-white' : 'text-neutral-900'
                    }`}
                  >
                    {item.label}
                  </div>
                </div>
              </div>

              <ChevronLeft
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isActive
                    ? 'text-neutral-300 -translate-x-0.5'
                    : 'text-neutral-300 group-hover:text-neutral-500'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Current File Card Indicator (if open) */}
      {currentFile && (
        <div className="p-3 border-t border-neutral-100 bg-neutral-50/50">
          <div className="p-2.5 rounded-xl border border-neutral-200 bg-white ios-spring-card">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="text-[11px] font-semibold text-neutral-500">فایل در حال مطالعه:</span>
            </div>
            <div className="text-xs font-bold text-neutral-800 truncate" title={currentFile.name}>
              {currentFile.name}
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Display Refresh Rate & VSync Status Bar */}
      <div className="p-2.5 sm:p-3 border-t border-neutral-100 bg-neutral-50/80 text-[11px] select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                perfStats.isSynced ? 'bg-emerald-500 ring-2 ring-emerald-200 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="text-neutral-600 font-medium truncate text-[10px] sm:text-[11px]">
              {perfStats.refreshRate >= 120
                ? 'نمایشگر ۱۲۰ هرتز (ProMotion)'
                : `نمایشگر ${perfStats.refreshRate} هرتز`}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="font-mono font-bold text-[10px] sm:text-[11px] text-neutral-800 bg-white border border-neutral-200 px-1.5 py-0.5 rounded-md shadow-2xs">
              {perfStats.fps} FPS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
