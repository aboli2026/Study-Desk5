import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle,
  FileText,
  Flame,
  Trash2,
  TrendingUp,
  Award,
  Zap,
  RotateCcw,
  Calendar,
  BarChart3,
  Sparkles,
  Target,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { PomodoroSession, NoteItem } from '../types';

interface AnalyticsViewProps {
  sessions: PomodoroSession[];
  notes: NoteItem[];
  onClearHistory: () => void;
  onLoadSampleData?: () => void;
}

type AnalysisPeriod = 'daily' | 'weekly';

interface DailyTimeBlock {
  key: string;
  label: string;
  timeRange: string;
  focusMinutes: number;
  breakMinutes: number;
  sessionCount: number;
}

interface WeekDayItem {
  dayIndex: number; // 0 = شنبه, 6 = جمعه
  name: string;
  shortName: string;
  dateStr: string;
  focusMinutes: number;
  breakMinutes: number;
  sessionCount: number;
  isToday: boolean;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  sessions,
  notes,
  onClearHistory,
  onLoadSampleData,
}) => {
  const [period, setPeriod] = useState<AnalysisPeriod>('weekly');
  const [selectedDayOrBlock, setSelectedDayOrBlock] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetSuccessToast, setResetSuccessToast] = useState<boolean>(false);

  // General totals
  const focusSessions = useMemo(() => sessions.filter((s) => s.type === 'focus'), [sessions]);
  const shortBreakSessions = useMemo(() => sessions.filter((s) => s.type === 'short-break'), [sessions]);
  const longBreakSessions = useMemo(() => sessions.filter((s) => s.type === 'long-break'), [sessions]);

  const totalFocusMinutes = useMemo(
    () => focusSessions.reduce((acc, s) => acc + (s.durationMinutes || 25), 0),
    [focusSessions]
  );

  const totalBreakMinutes = useMemo(
    () =>
      shortBreakSessions.reduce((acc, s) => acc + (s.durationMinutes || 5), 0) +
      longBreakSessions.reduce((acc, s) => acc + (s.durationMinutes || 15), 0),
    [shortBreakSessions, longBreakSessions]
  );

  const focusHours = Math.floor(totalFocusMinutes / 60);
  const remainingFocusMins = totalFocusMinutes % 60;

  // Words count in notes
  const totalWordsInNotes = useMemo(
    () =>
      notes.reduce((acc, n) => {
        const words = (n.content || '').trim().split(/\s+/).filter(Boolean);
        return acc + words.length;
      }, 0),
    [notes]
  );

  // Helper to parse session timestamp
  const getSessionDate = (session: PomodoroSession): Date => {
    if (session.createdAt) {
      return new Date(session.createdAt);
    }
    if (session.timestamp) {
      const d = new Date(session.timestamp);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  };

  // --- WEEKLY DATA CALCULATION ---
  // Iranian study week: شنبه (Sat) to جمعه (Fri)
  const persianWeekDays = useMemo(
    () => [
      { dayIndex: 0, name: 'شنبه', shortName: 'ش' },
      { dayIndex: 1, name: 'یکشنبه', shortName: 'ی' },
      { dayIndex: 2, name: 'دوشنبه', shortName: 'د' },
      { dayIndex: 3, name: 'سه‌شنبه', shortName: 'س' },
      { dayIndex: 4, name: 'چهارشنبه', shortName: 'چ' },
      { dayIndex: 5, name: 'پنجشنبه', shortName: 'پ' },
      { dayIndex: 6, name: 'جمعه', shortName: 'ج' },
    ],
    []
  );

  // Map JS getDay() (0=Sun, 1=Mon, ..., 6=Sat) to Iranian index (0=Sat, 1=Sun, ..., 6=Fri)
  const jsDayToPersianIndex = (jsDay: number): number => {
    return (jsDay + 1) % 7;
  };

  const currentJsDay = new Date().getDay();
  const currentPersianDayIndex = jsDayToPersianIndex(currentJsDay);

  const weeklyData: WeekDayItem[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Initial 7 days template
    const days: WeekDayItem[] = persianWeekDays.map((pwd) => ({
      dayIndex: pwd.dayIndex,
      name: pwd.name,
      shortName: pwd.shortName,
      dateStr: '',
      focusMinutes: 0,
      breakMinutes: 0,
      sessionCount: 0,
      isToday: pwd.dayIndex === currentPersianDayIndex,
    }));

    // Aggregate sessions from the last 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    sessions.forEach((session) => {
      const sDate = getSessionDate(session);
      if (sDate.getTime() >= sevenDaysAgo || sessions.length <= 15) {
        const pIndex = jsDayToPersianIndex(sDate.getDay());
        const target = days.find((d) => d.dayIndex === pIndex);
        if (target) {
          if (session.type === 'focus') {
            target.focusMinutes += session.durationMinutes || 25;
            target.sessionCount += 1;
          } else {
            target.breakMinutes += session.durationMinutes || 5;
          }
        }
      }
    });

    return days;
  }, [sessions, persianWeekDays, currentPersianDayIndex]);

  const maxWeeklyMinutes = useMemo(() => {
    const maxVal = Math.max(...weeklyData.map((d) => d.focusMinutes), 0);
    return Math.max(maxVal, 60); // Minimum 60 mins scale baseline
  }, [weeklyData]);

  const totalWeeklyFocusMinutes = useMemo(
    () => weeklyData.reduce((acc, d) => acc + d.focusMinutes, 0),
    [weeklyData]
  );
  const averageDailyFocusMinutes = Math.round(totalWeeklyFocusMinutes / 7);

  const peakDay = useMemo(() => {
    let best = weeklyData[0];
    weeklyData.forEach((d) => {
      if (d.focusMinutes > best.focusMinutes) best = d;
    });
    return best && best.focusMinutes > 0 ? best : null;
  }, [weeklyData]);

  // --- DAILY (HOURLY) DATA CALCULATION ---
  const dailyTimeBlocks: DailyTimeBlock[] = useMemo(() => {
    const blocks: DailyTimeBlock[] = [
      { key: 'b1', label: 'صبح زود', timeRange: '۰۶:۰۰ - ۰۹:۰۰', focusMinutes: 0, breakMinutes: 0, sessionCount: 0 },
      { key: 'b2', label: 'صبح', timeRange: '۰۹:۰۰ - ۱۲:۰۰', focusMinutes: 0, breakMinutes: 0, sessionCount: 0 },
      { key: 'b3', label: 'ظهر', timeRange: '۱۲:۰۰ - ۱۵:۰۰', focusMinutes: 0, breakMinutes: 0, sessionCount: 0 },
      { key: 'b4', label: 'بعدازظهر', timeRange: '۱۵:۰۰ - ۱۸:۰۰', focusMinutes: 0, breakMinutes: 0, sessionCount: 0 },
      { key: 'b5', label: 'غروب و شب', timeRange: '۱۸:۰۰ - ۲۱:۰۰', focusMinutes: 0, breakMinutes: 0, sessionCount: 0 },
      { key: 'b6', label: 'پایان شب', timeRange: '۲۱:۰۰ - ۲۴:۰۰', focusMinutes: 0, breakMinutes: 0, sessionCount: 0 },
    ];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    sessions.forEach((session) => {
      const sDate = getSessionDate(session);
      const isTodaySession = sDate.getTime() >= todayStart.getTime();

      // If session is today, or if very few sessions exist, group by hour of day
      if (isTodaySession || sessions.length <= 15) {
        const hour = sDate.getHours();
        let targetBlockIndex = 0;
        if (hour >= 6 && hour < 9) targetBlockIndex = 0;
        else if (hour >= 9 && hour < 12) targetBlockIndex = 1;
        else if (hour >= 12 && hour < 15) targetBlockIndex = 2;
        else if (hour >= 15 && hour < 18) targetBlockIndex = 3;
        else if (hour >= 18 && hour < 21) targetBlockIndex = 4;
        else targetBlockIndex = 5;

        const target = blocks[targetBlockIndex];
        if (session.type === 'focus') {
          target.focusMinutes += session.durationMinutes || 25;
          target.sessionCount += 1;
        } else {
          target.breakMinutes += session.durationMinutes || 5;
        }
      }
    });

    return blocks;
  }, [sessions]);

  const maxDailyMinutes = useMemo(() => {
    const maxVal = Math.max(...dailyTimeBlocks.map((b) => b.focusMinutes), 0);
    return Math.max(maxVal, 45); // Baseline scale
  }, [dailyTimeBlocks]);

  const totalTodayFocusMinutes = useMemo(
    () => dailyTimeBlocks.reduce((acc, b) => acc + b.focusMinutes, 0),
    [dailyTimeBlocks]
  );

  const peakDailyBlock = useMemo(() => {
    let best = dailyTimeBlocks[0];
    dailyTimeBlocks.forEach((b) => {
      if (b.focusMinutes > best.focusMinutes) best = b;
    });
    return best && best.focusMinutes > 0 ? best : null;
  }, [dailyTimeBlocks]);

  // Daily study goal (e.g., 120 minutes target)
  const DAILY_GOAL_MINUTES = 120;
  const goalCompletionPercent = Math.min(
    Math.round((totalTodayFocusMinutes / DAILY_GOAL_MINUTES) * 100),
    100
  );

  const handleConfirmReset = () => {
    onClearHistory();
    setShowResetModal(false);
    setSelectedDayOrBlock(null);
    setResetSuccessToast(true);
    setTimeout(() => setResetSuccessToast(false), 3000);
  };

  return (
    <div
      className="h-full flex flex-col bg-neutral-50/70 overflow-y-auto select-none p-3.5 sm:p-6 lg:p-8"
      dir="rtl"
    >
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Reset Success Toast */}
        {resetSuccessToast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-300">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>آمار و تاریخچه جلسات با موفقیت ریست شد.</span>
          </div>
        )}

        {/* Apple-style Reset Confirmation Modal */}
        {showResetModal && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setShowResetModal(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200/80 space-y-5 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                  بازنشانی و ریست آمار مطالعه
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  آیا مطمئن هستید که می‌خواهید تاریخچه کلیه نشست‌های پومودورو و نمودارهای تجزیه و تحلیل را پاک کنید؟ این عملیات قابل بازگشت نیست.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl cursor-pointer transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>بله، ریست شود</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Header & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-neutral-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="p-2 rounded-xl bg-neutral-900 text-white shadow-xs">
                <TrendingUp className="w-5 h-5" />
              </span>
              <h1 className="text-lg sm:text-2xl font-bold text-neutral-900">
                تجزیه و تحلیل عملکرد مطالعه
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500">
              نمودار هوشمند تمرکز، الگوی روزانه و هفتگی به همراه آمار دقیق جلسات پومودورو
            </p>
          </div>

          {/* Action buttons: Reset & Sample Data */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {sessions.length === 0 && onLoadSampleData && (
              <button
                type="button"
                onClick={onLoadSampleData}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl cursor-pointer transition-all ios-spring-btn"
                title="بارگذاری داده‌های فرضی برای مشاهده نمودار"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>داده‌های نمونه</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              disabled={sessions.length === 0}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl cursor-pointer transition-all ios-spring-btn ${
                sessions.length > 0
                  ? 'text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100'
                  : 'text-neutral-400 bg-neutral-100 cursor-not-allowed border border-neutral-200 opacity-60'
              }`}
              title="ریست کردن داده‌های تجزیه و تحلیل"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ریست کردن آمار</span>
            </button>
          </div>
        </div>

        {/* 4 Quick Stat Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Focus Time */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200/80 shadow-xs flex flex-col justify-between ios-spring-card">
            <div className="flex items-center justify-between text-neutral-500 mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-semibold">کل زمان تمرکز</span>
              <span className="p-1.5 sm:p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight font-mono">
                {focusHours > 0 ? `${focusHours}h ` : ''}
                {remainingFocusMins}m
              </div>
              <div className="text-[10px] sm:text-[11px] text-neutral-400 mt-1 font-medium">
                {totalFocusMinutes} دقیقه تمرکز خالص
              </div>
            </div>
          </div>

          {/* Completed Focus Sessions */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200/80 shadow-xs flex flex-col justify-between ios-spring-card">
            <div className="flex items-center justify-between text-neutral-500 mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-semibold">نشست‌های تکمیل شده</span>
              <span className="p-1.5 sm:p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight font-mono">
                {focusSessions.length}
              </div>
              <div className="text-[10px] sm:text-[11px] text-neutral-400 mt-1 font-medium">
                دور موفق پومودورو
              </div>
            </div>
          </div>

          {/* Break Time */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200/80 shadow-xs flex flex-col justify-between ios-spring-card">
            <div className="flex items-center justify-between text-neutral-500 mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-semibold">زمان استراحت</span>
              <span className="p-1.5 sm:p-2 bg-sky-50 text-sky-600 rounded-xl">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight font-mono">
                {totalBreakMinutes}m
              </div>
              <div className="text-[10px] sm:text-[11px] text-neutral-400 mt-1 font-medium">
                استراحت کوتاه و طولانی
              </div>
            </div>
          </div>

          {/* Notes & Words */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200/80 shadow-xs flex flex-col justify-between ios-spring-card">
            <div className="flex items-center justify-between text-neutral-500 mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-semibold">یادداشت‌های ثبت‌شده</span>
              <span className="p-1.5 sm:p-2 bg-purple-50 text-purple-600 rounded-xl">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight font-mono">
                {notes.length}
              </div>
              <div className="text-[10px] sm:text-[11px] text-neutral-400 mt-1 font-medium">
                شامل {totalWordsInNotes} کلمه نکته‌برداری
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            MAIN CHART SECTION (نمودار زیبا و مینیمال با قابلیت روزانه و هفتگی)
           ======================================================== */}
        <div className="bg-white p-5 sm:p-7 rounded-3xl border border-neutral-200/80 shadow-xs space-y-6">
          {/* Chart Header with Daily/Weekly Segmented Control */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-100">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-neutral-100 text-neutral-700">
                <BarChart3 className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-neutral-900 flex items-center gap-2">
                  <span>نمودار تمرکز و فعالیت</span>
                  <span className="text-[11px] font-normal text-neutral-400 font-sans">
                    {period === 'weekly' ? 'هفتگی (شنبه تا جمعه)' : 'روزانه (ساعات امروز)'}
                  </span>
                </h2>
                <p className="text-[11px] text-neutral-400">
                  {period === 'weekly'
                    ? `مجموع این هفته: ${Math.floor(totalWeeklyFocusMinutes / 60)}h ${totalWeeklyFocusMinutes % 60}m | میانگین روزانه: ${averageDailyFocusMinutes} دقیقه`
                    : `مجموع مطالعه امروز: ${Math.floor(totalTodayFocusMinutes / 60)}h ${totalTodayFocusMinutes % 60}m`}
                </p>
              </div>
            </div>

            {/* Apple iOS Segmented Capsule Switcher (گزینه تغییر روزانه / هفتگی) */}
            <div className="bg-neutral-100/90 p-1 rounded-2xl flex items-center gap-1 self-start sm:self-center border border-neutral-200/50">
              <button
                type="button"
                onClick={() => {
                  setPeriod('daily');
                  setSelectedDayOrBlock(null);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  period === 'daily'
                    ? 'bg-white text-neutral-900 shadow-xs scale-100'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>تحلیل روزانه</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPeriod('weekly');
                  setSelectedDayOrBlock(null);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  period === 'weekly'
                    ? 'bg-white text-neutral-900 shadow-xs scale-100'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>تحلیل هفتگی</span>
              </button>
            </div>
          </div>

          {/* ========================================================
              WEEKLY VIEW CHART
             ======================================================== */}
          {period === 'weekly' && (
            <div className="space-y-4">
              {/* Highlight summary badge */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-neutral-50 px-4 py-2.5 rounded-2xl border border-neutral-100">
                <div className="flex items-center gap-2 text-neutral-600">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>
                    {peakDay ? (
                      <>
                        پربازده‌ترین روز هفته:{' '}
                        <strong className="text-neutral-900">{peakDay.name}</strong> با{' '}
                        <strong className="text-neutral-900 font-mono">{peakDay.focusMinutes}</strong>{' '}
                        دقیقه مطالعه
                      </>
                    ) : (
                      'در انتظار ثبت فعالیت در طول هفته...'
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
                    <span>زمان تمرکز</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>استراحت</span>
                  </span>
                </div>
              </div>

              {/* Minimal Apple Capsule Bars (7 Days) */}
              <div className="pt-6 pb-2">
                <div className="h-48 sm:h-56 flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-6 relative">
                  {/* Subtle 50% & 100% Horizontal Target Guidelines */}
                  <div className="absolute inset-x-2 sm:inset-x-6 top-0 border-b border-dashed border-neutral-200/60 pointer-events-none flex justify-end">
                    <span className="text-[10px] text-neutral-400 font-mono -mt-4 bg-white px-1">
                      {maxWeeklyMinutes}m
                    </span>
                  </div>
                  <div className="absolute inset-x-2 sm:inset-x-6 top-1/2 border-b border-dashed border-neutral-200/50 pointer-events-none flex justify-end">
                    <span className="text-[10px] text-neutral-400 font-mono -mt-4 bg-white px-1">
                      {Math.round(maxWeeklyMinutes / 2)}m
                    </span>
                  </div>

                  {weeklyData.map((day) => {
                    const focusPercent =
                      maxWeeklyMinutes > 0
                        ? Math.min(Math.round((day.focusMinutes / maxWeeklyMinutes) * 100), 100)
                        : 0;
                    const breakPercent =
                      maxWeeklyMinutes > 0
                        ? Math.min(Math.round((day.breakMinutes / maxWeeklyMinutes) * 100), 100)
                        : 0;
                    const isSelected = selectedDayOrBlock === day.name;

                    return (
                      <div
                        key={day.dayIndex}
                        onClick={() => setSelectedDayOrBlock(isSelected ? null : day.name)}
                        className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                      >
                        {/* Hover / Active Floating Tooltip */}
                        <div
                          className={`absolute -top-12 z-20 bg-neutral-900 text-white text-[11px] font-sans px-2.5 py-1 rounded-xl shadow-lg whitespace-nowrap pointer-events-none transition-all duration-200 flex items-center gap-1.5 ${
                            isSelected
                              ? 'opacity-100 scale-100'
                              : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
                          }`}
                        >
                          <span className="font-bold">{day.name}:</span>
                          <span className="font-mono text-amber-300">{day.focusMinutes}m تمرکز</span>
                          {day.breakMinutes > 0 && (
                            <span className="font-mono text-emerald-300">({day.breakMinutes}m استراحت)</span>
                          )}
                        </div>

                        {/* Capsule Track & Bar */}
                        <div className="w-7 sm:w-10 h-full bg-neutral-100/80 rounded-2xl p-1 flex flex-col justify-end transition-all duration-300 group-hover:bg-neutral-200/70 border border-neutral-200/50">
                          {/* Break portion (if any) */}
                          {breakPercent > 0 && (
                            <div
                              style={{ height: `${breakPercent}%` }}
                              className="w-full bg-emerald-500 rounded-t-xl transition-all duration-500 mb-0.5 opacity-90"
                              title={`${day.breakMinutes} دقیقه استراحت`}
                            />
                          )}

                          {/* Focus portion */}
                          <div
                            style={{ height: `${Math.max(focusPercent, day.focusMinutes > 0 ? 8 : 0)}%` }}
                            className={`w-full rounded-xl transition-all duration-500 ${
                              day.isToday
                                ? 'bg-gradient-to-t from-neutral-900 to-neutral-700 shadow-sm'
                                : 'bg-neutral-800 group-hover:bg-neutral-900'
                            }`}
                          />
                        </div>

                        {/* Day Label with Today badge */}
                        <div className="mt-2 text-center">
                          <span
                            className={`text-xs font-semibold block transition-colors ${
                              day.isToday
                                ? 'text-neutral-900 font-bold'
                                : 'text-neutral-500 group-hover:text-neutral-800'
                            }`}
                          >
                            {day.name}
                          </span>
                          {day.isToday && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mx-auto mt-0.5 block" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              DAILY VIEW CHART
             ======================================================== */}
          {period === 'daily' && (
            <div className="space-y-4">
              {/* Daily Target Progress Capsule */}
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-neutral-800">
                    <Target className="w-4 h-4 text-amber-500" />
                    <span>پیشرفت به سمت هدف مطالعه امروز ({DAILY_GOAL_MINUTES} دقیقه)</span>
                  </div>
                  <span className="font-mono font-bold text-neutral-900">
                    {totalTodayFocusMinutes} / {DAILY_GOAL_MINUTES} دقیقه ({goalCompletionPercent}%)
                  </span>
                </div>

                <div className="w-full h-3 bg-neutral-200/70 rounded-full overflow-hidden p-0.5">
                  <div
                    style={{ width: `${goalCompletionPercent}%` }}
                    className="h-full bg-gradient-to-l from-amber-500 to-neutral-900 rounded-full transition-all duration-700"
                  />
                </div>
              </div>

              {/* Minimal Apple Capsule Bars (Daily Time Blocks) */}
              <div className="pt-6 pb-2">
                <div className="h-48 sm:h-56 flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-6 relative">
                  {/* Guideline */}
                  <div className="absolute inset-x-2 sm:inset-x-6 top-0 border-b border-dashed border-neutral-200/60 pointer-events-none flex justify-end">
                    <span className="text-[10px] text-neutral-400 font-mono -mt-4 bg-white px-1">
                      {maxDailyMinutes}m
                    </span>
                  </div>

                  {dailyTimeBlocks.map((block) => {
                    const focusPercent =
                      maxDailyMinutes > 0
                        ? Math.min(Math.round((block.focusMinutes / maxDailyMinutes) * 100), 100)
                        : 0;
                    const breakPercent =
                      maxDailyMinutes > 0
                        ? Math.min(Math.round((block.breakMinutes / maxDailyMinutes) * 100), 100)
                        : 0;
                    const isSelected = selectedDayOrBlock === block.key;

                    return (
                      <div
                        key={block.key}
                        onClick={() => setSelectedDayOrBlock(isSelected ? null : block.key)}
                        className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                      >
                        {/* Hover Tooltip */}
                        <div
                          className={`absolute -top-12 z-20 bg-neutral-900 text-white text-[11px] font-sans px-2.5 py-1 rounded-xl shadow-lg whitespace-nowrap pointer-events-none transition-all duration-200 flex items-center gap-1.5 ${
                            isSelected
                              ? 'opacity-100 scale-100'
                              : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
                          }`}
                        >
                          <span className="font-bold">{block.label}:</span>
                          <span className="font-mono text-amber-300">{block.focusMinutes}m</span>
                          <span className="text-neutral-400 font-mono text-[10px]">({block.timeRange})</span>
                        </div>

                        {/* Capsule Track */}
                        <div className="w-8 sm:w-12 h-full bg-neutral-100/80 rounded-2xl p-1 flex flex-col justify-end transition-all duration-300 group-hover:bg-neutral-200/70 border border-neutral-200/50">
                          {breakPercent > 0 && (
                            <div
                              style={{ height: `${breakPercent}%` }}
                              className="w-full bg-emerald-500 rounded-t-xl transition-all duration-500 mb-0.5 opacity-90"
                            />
                          )}

                          <div
                            style={{ height: `${Math.max(focusPercent, block.focusMinutes > 0 ? 8 : 0)}%` }}
                            className="w-full bg-neutral-800 group-hover:bg-neutral-900 rounded-xl transition-all duration-500"
                          />
                        </div>

                        {/* Block Label */}
                        <div className="mt-2 text-center">
                          <span className="text-xs font-semibold text-neutral-600 block group-hover:text-neutral-900 transition-colors">
                            {block.label}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono block">
                            {block.timeRange.split(' - ')[0]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {peakDailyBlock && (
                <div className="flex items-center gap-2 text-xs text-neutral-600 bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                  <Flame className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>
                    ساعت اوج تمرکز امروز:{' '}
                    <strong className="text-neutral-900">{peakDailyBlock.label}</strong> ({peakDailyBlock.timeRange}) با{' '}
                    <strong className="text-neutral-900 font-mono">{peakDailyBlock.focusMinutes} دقیقه</strong> مطالعه فعال.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detailed Sections: Ratio Breakdown & Recent Session Log */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ratio Progress Card */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4 ios-spring-card">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-neutral-700" />
              <h2 className="text-sm font-bold text-neutral-900">
                نسبت تمرکز و استراحت
              </h2>
            </div>

            {totalFocusMinutes + totalBreakMinutes > 0 ? (
              <div className="space-y-4">
                <div className="w-full h-3 rounded-full bg-neutral-100 overflow-hidden flex">
                  <div
                    className="bg-neutral-900 h-full transition-all duration-500"
                    style={{
                      width: `${
                        (totalFocusMinutes / (totalFocusMinutes + totalBreakMinutes)) * 100
                      }%`,
                    }}
                    title="تمرکز"
                  />
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{
                      width: `${
                        (totalBreakMinutes / (totalFocusMinutes + totalBreakMinutes)) * 100
                      }%`,
                    }}
                    title="استراحت"
                  />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
                      <span className="text-neutral-600">زمان تمرکز</span>
                    </div>
                    <span className="font-bold text-neutral-900 font-mono">
                      {Math.round(
                        (totalFocusMinutes / (totalFocusMinutes + totalBreakMinutes)) * 100
                      )}
                      %
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-neutral-600">زمان استراحت</span>
                    </div>
                    <span className="font-bold text-neutral-900 font-mono">
                      {Math.round(
                        (totalBreakMinutes / (totalFocusMinutes + totalBreakMinutes)) * 100
                      )}
                      %
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center gap-2 text-xs text-neutral-600">
                  <Flame className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>
                    الگوی مطالعه شما با روش استاندارد پومودورو کاملاً هماهنگ است!
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-neutral-400">
                هنوز نشستی با تایمر پومودورو ثبت نشده است.
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4 ios-spring-card">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center justify-between">
              <span>آخرین نشست‌های مطالعه ثبت‌شده</span>
              <span className="text-xs font-normal text-neutral-400 font-mono">
                {sessions.length} مورد
              </span>
            </h2>

            {sessions.length === 0 ? (
              <div className="p-12 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-3">
                <Clock className="w-8 h-8 text-neutral-300" />
                <span>برای ثبت آمار، تایمر پومودورو را در بخش تایمر شروع کنید.</span>
                {onLoadSampleData && (
                  <button
                    type="button"
                    onClick={onLoadSampleData}
                    className="mt-1 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold cursor-pointer ios-spring-btn"
                  >
                    بارگذاری داده‌های نمونه جهت مشاهده نمودار
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 max-h-80 overflow-y-auto space-y-1">
                {sessions.slice(0, 10).map((session) => {
                  const isFocus = session.type === 'focus';
                  const sDate = getSessionDate(session);
                  const dateStr = sDate.toLocaleTimeString('fa-IR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={session.id}
                      className="py-3 flex items-center justify-between hover:bg-neutral-50 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isFocus
                              ? 'bg-neutral-900 text-white'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isFocus ? (
                            <Clock className="w-4 h-4" />
                          ) : (
                            <Zap className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-neutral-800">
                            {isFocus
                              ? 'نشست تمرکز پومودورو'
                              : session.type === 'short-break'
                              ? 'استراحت کوتاه'
                              : 'استراحت طولانی'}
                          </div>
                          <div className="text-[11px] text-neutral-400 font-mono">
                            مدت: {session.durationMinutes} دقیقه
                          </div>
                        </div>
                      </div>

                      {dateStr && (
                        <span className="text-xs text-neutral-500 font-mono">
                          {dateStr}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
