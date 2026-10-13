export type ActiveTab = 'open-file' | 'library' | 'notes' | 'pomodoro' | 'analytics' | 'settings';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type PomodoroMode = 'focus' | 'short-break' | 'long-break';

export type PomodoroSound = 'crystal' | 'zen' | 'marimba' | 'bell';

export interface PomodoroSettings {
  focusDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  roundsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundType: PomodoroSound;
  soundVolume: number; // 0 to 1
  browserNotifications: boolean;
}

export interface PomodoroSession {
  id: string;
  type: PomodoroMode;
  durationMinutes: number;
  timestamp: string;
  createdAt?: number;
  date?: string;
}

export interface StudyFile {
  id: string;
  name: string;
  size: number;
  data: ArrayBuffer;
  uploadDate: string;
  pageCount?: number;
  currentPage?: number;
  pageStrokes?: Record<number, DrawingStroke[]>;
  stickyNotes?: StickyNoteItem[];
  scale?: number;
  lastModified?: string;
}

export interface FileEdits {
  fileId: string;
  pageStrokes: Record<number, DrawingStroke[]>;
  stickyNotes: StickyNoteItem[];
  currentPage?: number;
  pageCount?: number;
  scale?: number;
  updatedAt: string;
}

export interface DrawingStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  tool?: 'pen' | 'highlighter' | 'ruler';
  opacity?: number;
}

export interface StickyNoteItem {
  id: string;
  pageNumber: number;
  x: number; // scaled to 1.0 base
  y: number;
  title: string;
  content: string;
  color: string;
  textColor: string;
  isBold: boolean;
  createdAt: string;
}

export type EyeComfortMode = 'normal' | 'yellow' | 'dark-gray' | 'soft-gray';

export interface EyeComfortSettings {
  brightness: number; // 35 to 120 (default 100)
  colorMode: EyeComfortMode;
  warmth: number; // 20 to 80 (default 50)
}

export interface ToolShortcuts {
  hand: string;
  select: string;
  pen: string;
  highlighter: string;
  ruler: string;
  eraser: string;
  stickyNote: string;
}

export type RenderQuality = 'eco' | 'balanced' | 'high';

export interface PerformanceSettings {
  ecoMode: boolean; // Economic / Low-spec hardware mode
  renderQuality: RenderQuality; // 'eco' = 1x DPR, 'balanced' = 1.3x DPR, 'high' = 2x DPR
  virtualization: boolean; // Release offscreen canvas memory for multi-page documents
  simplifyStrokes: boolean; // Optimize high-frequency drawing points
  hardwareAcceleration: boolean; // GPU compositing layers
  reduceAnimations: boolean; // Disable heavy blur and complex physics
}

export const detectEconomicHardware = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 4;
  return cores <= 4 || mem <= 4;
};

export const DEFAULT_PERFORMANCE_SETTINGS: PerformanceSettings = {
  ecoMode: typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 4) <= 4 : false,
  renderQuality: typeof navigator !== 'undefined' && (navigator.hardwareConcurrency || 4) <= 4 ? 'eco' : 'balanced',
  virtualization: true,
  simplifyStrokes: true,
  hardwareAcceleration: true,
  reduceAnimations: false,
};

