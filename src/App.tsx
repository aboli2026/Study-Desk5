import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ActiveTab,
  NoteItem,
  PomodoroSession,
  StudyFile,
  PomodoroMode,
  PomodoroSettings,
  EyeComfortSettings,
  ToolShortcuts,
  PerformanceSettings,
  DEFAULT_PERFORMANCE_SETTINGS,
} from './types';
import { Navigation } from './components/Navigation';
import { OpenFileView } from './components/OpenFileView';
import { LibraryView } from './components/LibraryView';
import { NotesView } from './components/NotesView';
import { PomodoroView } from './components/PomodoroView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import {
  PomodoroNotificationToast,
  PomodoroNotificationData,
} from './components/PomodoroNotificationToast';
import {
  getAllStudyFiles,
  saveStudyFileToStorage,
  deleteStudyFileFromStorage,
} from './utils/fileStorage';
import {
  playMinimalPomodoroSound,
  sendBrowserNotification,
} from './utils/pomodoroAudio';

const STORAGE_KEYS = {
  NOTES: 'study_workspace_notes',
  SESSIONS: 'study_workspace_sessions',
  POMODORO_SETTINGS: 'pomodoro_settings',
};

const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
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

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('open-file');
  const [currentFile, setCurrentFile] = useState<StudyFile | null>(null);
  const [studyFiles, setStudyFiles] = useState<StudyFile[]>([]);

  // Eye Comfort Settings state for whole app
  const [eyeComfortSettings, setEyeComfortSettings] = useState<EyeComfortSettings>(() => {
    try {
      const saved = localStorage.getItem('study_eye_comfort_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      brightness: 100,
      colorMode: 'normal',
      warmth: 50,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('study_eye_comfort_settings', JSON.stringify(eyeComfortSettings));
    } catch {}
  }, [eyeComfortSettings]);

  // Tool Shortcuts state
  const [shortcuts, setShortcuts] = useState<ToolShortcuts>(() => {
    try {
      const saved = localStorage.getItem('study_capsule_shortcuts');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      hand: '1',
      select: '2',
      pen: '3',
      highlighter: '4',
      ruler: '5',
      eraser: '6',
      stickyNote: '7',
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('study_capsule_shortcuts', JSON.stringify(shortcuts));
    } catch {}
  }, [shortcuts]);

  // Performance Settings for Budget / Economic Systems
  const [performanceSettings, setPerformanceSettings] = useState<PerformanceSettings>(() => {
    try {
      const saved = localStorage.getItem('study_performance_settings');
      if (saved) return { ...DEFAULT_PERFORMANCE_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_PERFORMANCE_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('study_performance_settings', JSON.stringify(performanceSettings));
    } catch {}
    if (typeof document !== 'undefined') {
      if (performanceSettings.ecoMode) {
        document.documentElement.setAttribute('data-eco-mode', 'true');
        document.documentElement.classList.add('eco-mode');
      } else {
        document.documentElement.removeAttribute('data-eco-mode');
        document.documentElement.classList.remove('eco-mode');
      }
    }
  }, [performanceSettings]);

  // Refresh study files from IndexedDB
  const refreshStudyFiles = useCallback(() => {
    getAllStudyFiles().then((files) => {
      setStudyFiles(files);
    });
  }, []);

  // Load study files on mount and when tab switches or file closes
  useEffect(() => {
    refreshStudyFiles();
  }, [activeTab, currentFile, refreshStudyFiles]);

  // Load notes from localStorage
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [
      {
        id: '1',
        title: 'نکات فصل اول - مقدمه',
        content: 'تعاریف پایه و مفاهیم اصلی بررسی شد. برای جلسه بعدی مثال‌های صفحه ۱۲ مرور شود.',
        createdAt: '۱۴۰۳/۰۷/۱۵',
        updatedAt: '۱۴۰۳/۰۷/۱۵',
      },
    ];
  });

  // Load sessions from localStorage
  const [sessions, setSessions] = useState<PomodoroSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  // Save notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    } catch {
      // Storage error
    }
  }, [notes]);

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch {
      // Storage error
    }
  }, [sessions]);

  // Notes handlers
  const handleAddNote = (newNoteData: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toLocaleDateString('fa-IR');
    const newNote: NoteItem = {
      id: Date.now().toString(),
      title: newNoteData.title,
      content: newNoteData.content,
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  const handleUpdateNote = (id: string, title: string, content: string) => {
    const now = new Date().toLocaleDateString('fa-IR');
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, title, content, updatedAt: now } : note))
    );
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  // Pomodoro Global State & Settings
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POMODORO_SETTINGS);
      if (saved) return { ...DEFAULT_POMODORO_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_POMODORO_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.POMODORO_SETTINGS, JSON.stringify(pomodoroSettings));
    } catch {}
  }, [pomodoroSettings]);

  const [pomodoroMode, setPomodoroMode] = useState<PomodoroMode>('focus');
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState<number>(
    () => pomodoroSettings.focusDuration * 60
  );
  const [pomodoroIsRunning, setPomodoroIsRunning] = useState<boolean>(false);
  const [pomodoroCompletedCount, setPomodoroCompletedCount] = useState<number>(0);
  const [pomodoroNotification, setPomodoroNotification] = useState<PomodoroNotificationData | null>(
    null
  );

  // Pomodoro session completion logger
  const handleSessionComplete = useCallback(
    (sessionData: Omit<PomodoroSession, 'id' | 'timestamp'>) => {
      const now = new Date();
      const newSession: PomodoroSession = {
        id: Date.now().toString(),
        type: sessionData.type,
        durationMinutes: sessionData.durationMinutes,
        timestamp: now.toISOString(),
        date: now.toLocaleDateString('fa-IR'),
        createdAt: now.getTime(),
      };
      setSessions((prev) => [newSession, ...prev]);
    },
    []
  );

  // Global Pomodoro Ticker Effect: Runs continuously even when reading PDF in fullscreen!
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (pomodoroIsRunning && pomodoroTimeLeft > 0) {
      interval = setInterval(() => {
        setPomodoroTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroIsRunning && pomodoroTimeLeft <= 0) {
      setPomodoroIsRunning(false);

      // 1. Play minimal soothing crystal chime sound
      playMinimalPomodoroSound(pomodoroSettings.soundType, pomodoroSettings.soundVolume);

      // 2. Compute next mode and message
      let nextMode: PomodoroMode = 'short-break';
      let nextMinutes = pomodoroSettings.shortBreakDuration;
      let notifTitle = '';
      let notifMessage = '';

      if (pomodoroMode === 'focus') {
        const nextCompleted = pomodoroCompletedCount + 1;
        setPomodoroCompletedCount(nextCompleted);

        const isLongBreak = nextCompleted % pomodoroSettings.roundsBeforeLongBreak === 0;
        nextMode = isLongBreak ? 'long-break' : 'short-break';
        nextMinutes = isLongBreak ? pomodoroSettings.longBreakDuration : pomodoroSettings.shortBreakDuration;

        notifTitle = 'جلسه تمرکز و مطالعه به پایان رسید! 🎉';
        notifMessage = isLongBreak
          ? `فوق‌العاده بود! شما ${pomodoroSettings.roundsBeforeLongBreak} دور متوالی مطالعه کردید. اکنون زمان ${pomodoroSettings.longBreakDuration} دقیقه استراحت عمیق است.`
          : `خسته نباشید! وقت ${pomodoroSettings.shortBreakDuration} دقیقه استراحت کوتاه، تنفس عمیق و نوشیدن آب است.`;

        handleSessionComplete({
          type: 'focus',
          durationMinutes: pomodoroSettings.focusDuration,
        });

        if (pomodoroSettings.browserNotifications) {
          sendBrowserNotification(notifTitle, notifMessage);
        }
      } else {
        nextMode = 'focus';
        nextMinutes = pomodoroSettings.focusDuration;
        notifTitle = 'زمان استراحت پایان یافت ☕';
        notifMessage = `انرژی‌ها بازیابی شد! آماده‌ای برای شروع جلسه مطالعه و تمرکز جدید (${pomodoroSettings.focusDuration} دقیقه)؟`;

        handleSessionComplete({
          type: pomodoroMode,
          durationMinutes:
            pomodoroMode === 'long-break'
              ? pomodoroSettings.longBreakDuration
              : pomodoroSettings.shortBreakDuration,
        });

        if (pomodoroSettings.browserNotifications) {
          sendBrowserNotification(notifTitle, notifMessage);
        }
      }

      // 3. Trigger fullscreen top-level in-app toast notification
      setPomodoroNotification({
        isOpen: true,
        title: notifTitle,
        message: notifMessage,
        mode: pomodoroMode,
        nextMode,
        nextMinutes,
      });

      // 4. Automatic transition
      const shouldAutoStart =
        (pomodoroMode === 'focus' && pomodoroSettings.autoStartBreaks) ||
        (pomodoroMode !== 'focus' && pomodoroSettings.autoStartFocus);

      setPomodoroMode(nextMode);
      setPomodoroTimeLeft(nextMinutes * 60);
      if (shouldAutoStart) {
        setPomodoroIsRunning(true);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    pomodoroIsRunning,
    pomodoroTimeLeft,
    pomodoroMode,
    pomodoroSettings,
    pomodoroCompletedCount,
    handleSessionComplete,
  ]);

  const handleTogglePomodoroPlay = useCallback(() => {
    setPomodoroIsRunning((prev) => !prev);
  }, []);

  const handleResetPomodoro = useCallback(() => {
    setPomodoroIsRunning(false);
    const duration =
      pomodoroMode === 'focus'
        ? pomodoroSettings.focusDuration
        : pomodoroMode === 'short-break'
        ? pomodoroSettings.shortBreakDuration
        : pomodoroSettings.longBreakDuration;
    setPomodoroTimeLeft(duration * 60);
  }, [pomodoroMode, pomodoroSettings]);

  const handleSwitchPomodoroMode = useCallback(
    (newMode: PomodoroMode) => {
      setPomodoroIsRunning(false);
      setPomodoroMode(newMode);
      const duration =
        newMode === 'focus'
          ? pomodoroSettings.focusDuration
          : newMode === 'short-break'
          ? pomodoroSettings.shortBreakDuration
          : pomodoroSettings.longBreakDuration;
      setPomodoroTimeLeft(duration * 60);
    },
    [pomodoroSettings]
  );

  const handleAddPomodoroTime = useCallback((mins: number) => {
    setPomodoroTimeLeft((prev) => prev + mins * 60);
  }, []);

  const handleUpdatePomodoroSettings = useCallback(
    (newSettings: PomodoroSettings) => {
      setPomodoroSettings(newSettings);
      if (!pomodoroIsRunning) {
        const duration =
          pomodoroMode === 'focus'
            ? newSettings.focusDuration
            : pomodoroMode === 'short-break'
            ? newSettings.shortBreakDuration
            : newSettings.longBreakDuration;
        setPomodoroTimeLeft(duration * 60);
      }
    },
    [pomodoroIsRunning, pomodoroMode]
  );

  const handleStartNextFromNotification = useCallback(() => {
    setPomodoroIsRunning(true);
  }, []);

  const handleClearSessions = () => {
    setSessions([]);
  };

  const handleLoadSampleSessions = () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sampleData: PomodoroSession[] = [
      // Today (hours spread out)
      { id: 's-1', type: 'focus', durationMinutes: 25, timestamp: new Date(now - 30 * 60 * 1000).toISOString(), createdAt: now - 30 * 60 * 1000 },
      { id: 's-2', type: 'short-break', durationMinutes: 5, timestamp: new Date(now - 60 * 60 * 1000).toISOString(), createdAt: now - 60 * 60 * 1000 },
      { id: 's-3', type: 'focus', durationMinutes: 50, timestamp: new Date(now - 120 * 60 * 1000).toISOString(), createdAt: now - 120 * 60 * 1000 },
      { id: 's-4', type: 'focus', durationMinutes: 25, timestamp: new Date(now - 220 * 60 * 1000).toISOString(), createdAt: now - 220 * 60 * 1000 },
      // 1 day ago
      { id: 's-5', type: 'focus', durationMinutes: 50, timestamp: new Date(now - oneDay - 40 * 60 * 1000).toISOString(), createdAt: now - oneDay - 40 * 60 * 1000 },
      { id: 's-6', type: 'focus', durationMinutes: 25, timestamp: new Date(now - oneDay - 180 * 60 * 1000).toISOString(), createdAt: now - oneDay - 180 * 60 * 1000 },
      { id: 's-7', type: 'short-break', durationMinutes: 5, timestamp: new Date(now - oneDay - 120 * 60 * 1000).toISOString(), createdAt: now - oneDay - 120 * 60 * 1000 },
      // 2 days ago
      { id: 's-8', type: 'focus', durationMinutes: 75, timestamp: new Date(now - 2 * oneDay).toISOString(), createdAt: now - 2 * oneDay },
      { id: 's-9', type: 'focus', durationMinutes: 25, timestamp: new Date(now - 2 * oneDay - 120 * 60 * 1000).toISOString(), createdAt: now - 2 * oneDay - 120 * 60 * 1000 },
      // 3 days ago
      { id: 's-10', type: 'focus', durationMinutes: 50, timestamp: new Date(now - 3 * oneDay).toISOString(), createdAt: now - 3 * oneDay },
      { id: 's-11', type: 'short-break', durationMinutes: 5, timestamp: new Date(now - 3 * oneDay - 60 * 60 * 1000).toISOString(), createdAt: now - 3 * oneDay - 60 * 60 * 1000 },
      // 4 days ago
      { id: 's-12', type: 'focus', durationMinutes: 100, timestamp: new Date(now - 4 * oneDay).toISOString(), createdAt: now - 4 * oneDay },
      { id: 's-13', type: 'long-break', durationMinutes: 15, timestamp: new Date(now - 4 * oneDay - 60 * 60 * 1000).toISOString(), createdAt: now - 4 * oneDay - 60 * 60 * 1000 },
      // 5 days ago
      { id: 's-14', type: 'focus', durationMinutes: 50, timestamp: new Date(now - 5 * oneDay).toISOString(), createdAt: now - 5 * oneDay },
      // 6 days ago
      { id: 's-15', type: 'focus', durationMinutes: 25, timestamp: new Date(now - 6 * oneDay).toISOString(), createdAt: now - 6 * oneDay },
    ];
    setSessions(sampleData);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('لطفاً یک فایل با پسوند PDF انتخاب کنید.');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const targetName = (file.name || '').trim().toLowerCase();

      // Check if file already exists in library
      const existing = studyFiles.find(
        (f) => (f.name || '').trim().toLowerCase() === targetName
      );

      let targetFile: StudyFile;
      if (existing) {
        // Reuse existing file entry and ID to maintain bookmarks, page position, and notes
        targetFile = {
          ...existing,
          size: file.size,
          data: buffer,
        };
      } else {
        targetFile = {
          id: `${Date.now()}`,
          name: file.name,
          size: file.size,
          data: buffer,
          uploadDate: new Date().toLocaleDateString('fa-IR'),
        };
      }

      await saveStudyFileToStorage(targetFile);
      const allFiles = await getAllStudyFiles();
      setStudyFiles(allFiles);
      setCurrentFile(targetFile);
      setActiveTab('open-file');
    } catch {
      alert('خطا در خواندن فایل.');
    } finally {
      e.target.value = '';
    }
  };

  const handleDeleteStudyFile = async (id: string, fileName?: string) => {
    await deleteStudyFileFromStorage(id, fileName);
    const allFiles = await getAllStudyFiles();
    setStudyFiles(allFiles);
    if (currentFile?.id === id || (fileName && currentFile?.name === fileName)) {
      setCurrentFile(null);
    }
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const isStudyingFile = Boolean(currentFile);

  return (
    <div
      className={`flex flex-row h-screen w-screen select-none overflow-hidden relative ${
        isStudyingFile
          ? 'p-0 gap-0 bg-neutral-900'
          : 'p-3 sm:p-4 gap-3 sm:gap-4 bg-neutral-100/80 text-neutral-900'
      }`}
    >
      {/* Global Prominent Full-Screen Notification Toast */}
      <PomodoroNotificationToast
        data={pomodoroNotification}
        onClose={() => setPomodoroNotification(null)}
        onStartNext={handleStartNextFromNotification}
      />

      {/* Hidden Global File Picker Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,application/pdf"
        className="hidden"
      />

      {/* Right Side Options Frame: Shown only when not in full-screen file reading */}
      {!isStudyingFile && (
        <Navigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentFile={currentFile}
          onOpenFilePicker={handleOpenFilePicker}
        />
      )}

      {/* Main Workspace Frame: Full-screen when studying a file */}
      <main
        className={`flex-1 h-full overflow-hidden relative flex flex-col ${
          isStudyingFile
            ? 'w-full h-full rounded-none border-none shadow-none bg-neutral-200'
            : 'bg-white rounded-2xl border border-neutral-200 shadow-xs'
        }`}
      >
        {activeTab === 'open-file' && (
          <OpenFileView
            currentFile={currentFile}
            onFileSelect={setCurrentFile}
            onTriggerPicker={handleOpenFilePicker}
            pomodoroState={{
              isRunning: pomodoroIsRunning,
              timeLeft: pomodoroTimeLeft,
              mode: pomodoroMode,
              onTogglePlay: handleTogglePomodoroPlay,
            }}
            pomodoroSettings={pomodoroSettings}
            onUpdatePomodoroSettings={handleUpdatePomodoroSettings}
          />
        )}

        {activeTab === 'library' && (
          <LibraryView
            files={studyFiles}
            onOpenFile={(file) => {
              setCurrentFile(file);
              setActiveTab('open-file');
            }}
            onDeleteFile={handleDeleteStudyFile}
            onTriggerNewFile={handleOpenFilePicker}
          />
        )}

        {activeTab === 'notes' && (
          <NotesView
            notes={notes}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
          />
        )}

        {activeTab === 'pomodoro' && (
          <PomodoroView
            mode={pomodoroMode}
            timeLeft={pomodoroTimeLeft}
            isRunning={pomodoroIsRunning}
            completedCount={pomodoroCompletedCount}
            settings={pomodoroSettings}
            onSwitchMode={handleSwitchPomodoroMode}
            onTogglePlay={handleTogglePomodoroPlay}
            onReset={handleResetPomodoro}
            onAddTime={handleAddPomodoroTime}
            onUpdateSettings={handleUpdatePomodoroSettings}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            sessions={sessions}
            notes={notes}
            onClearHistory={handleClearSessions}
            onLoadSampleData={handleLoadSampleSessions}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            eyeComfortSettings={eyeComfortSettings}
            onUpdateEyeComfortSettings={setEyeComfortSettings}
            pomodoroSettings={pomodoroSettings}
            onUpdatePomodoroSettings={handleUpdatePomodoroSettings}
            studyFilesCount={studyFiles.length}
            notesCount={notes.length}
            sessionsCount={sessions.length}
            shortcuts={shortcuts}
            onUpdateShortcuts={setShortcuts}
            onResetShortcuts={() => setShortcuts({
              hand: '1',
              select: '2',
              pen: '3',
              highlighter: '4',
              ruler: '5',
              eraser: '6',
              stickyNote: '7',
            })}
            onClearSessions={handleClearSessions}
            onClose={() => setActiveTab(currentFile ? 'open-file' : 'library')}
            fileName={currentFile?.name}
          />
        )}
      </main>
    </div>
  );
}
