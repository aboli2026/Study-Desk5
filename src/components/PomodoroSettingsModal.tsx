import React, { useState } from 'react';
import {
  X,
  Clock,
  Volume2,
  Bell,
  Sparkles,
  Coffee,
  RotateCcw,
  Check,
  Play,
  Sliders,
} from 'lucide-react';
import { PomodoroSettings, PomodoroSound } from '../types';
import {
  playMinimalPomodoroSound,
  requestBrowserNotificationPermission,
  sendBrowserNotification,
} from '../utils/pomodoroAudio';

interface PomodoroSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PomodoroSettings;
  onSave: (newSettings: PomodoroSettings) => void;
}

const SOUND_OPTIONS: { id: PomodoroSound; label: string; desc: string }[] = [
  { id: 'crystal', label: 'کریستالی مینیمال', desc: 'صدای هارمونیک شفاف، آرام و بسیار سبک' },
  { id: 'zen', label: 'ناقوس ذن (۴۳۲ هرتز)', desc: 'آوای عمیق و آرامش‌بخش کاسه تبتی' },
  { id: 'marimba', label: 'ماریمبا چوبی', desc: 'دو نت چوبی گرم و کوتاه و بدون خشونت' },
  { id: 'bell', label: 'زنگ ملایم', desc: 'صدای زنگ کلاسیک لطیف با افت تدریجی' },
];

export const PomodoroSettingsModal: React.FC<PomodoroSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [form, setForm] = useState<PomodoroSettings>(settings);
  const [activeTab, setActiveTab] = useState<'times' | 'sound' | 'automation'>('times');
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission | 'unsupported'>(
    'Notification' in window ? Notification.permission : 'unsupported'
  );

  if (!isOpen) return null;

  const handleTestSound = (soundType?: PomodoroSound) => {
    playMinimalPomodoroSound(soundType || form.soundType, form.soundVolume);
  };

  const handleRequestNotification = async () => {
    const granted = await requestBrowserNotificationPermission();
    setNotificationStatus(granted ? 'granted' : 'denied');
    if (granted) {
      sendBrowserNotification('نوتیفیکیشن پومودورو فعال شد! 🔔', 'هنگام اتمام تایمر تمرکز و استراحت مطلع خواهید شد.');
    }
  };

  const handleResetDefaults = () => {
    setForm({
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      roundsBeforeLongBreak: 4,
      autoStartBreaks: false,
      autoStartFocus: false,
      soundType: 'crystal',
      soundVolume: 0.65,
      browserNotifications: true,
    });
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-ios-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">تنظیمات پیشرفته پومودورو</h3>
              <p className="text-[11px] text-neutral-500">سفارشی‌سازی زمان‌ها، صداهای مینیمال و اعلان‌ها</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg cursor-pointer ios-spring-tool"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-neutral-100 bg-white">
          <button
            onClick={() => setActiveTab('times')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'times'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>زمان‌های دلخواه</span>
          </button>
          <button
            onClick={() => setActiveTab('sound')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'sound'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>صدا و نوتیفیکیشن</span>
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'automation'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>شروع خودکار</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'times' && (
            <div className="space-y-4">
              {/* Focus Duration */}
              <div className="p-3.5 bg-neutral-50 border border-neutral-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-neutral-900" />
                    <span>مدت جلسه تمرکز و مطالعه (دقیقه):</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={form.focusDuration}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          focusDuration: Math.max(1, Math.min(180, parseInt(e.target.value) || 1)),
                        })
                      }
                      className="w-16 px-2 py-1 text-center font-mono font-bold text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                    <span className="text-[11px] text-neutral-500">دقیقه</span>
                  </div>
                </div>
                {/* Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {[15, 25, 30, 45, 50, 60].map((m) => (
                    <button
                      key={m}
                      onClick={() => setForm({ ...form, focusDuration: m })}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${
                        form.focusDuration === m
                          ? 'bg-neutral-900 text-white shadow-2xs'
                          : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {m} دقیقه
                    </button>
                  ))}
                </div>
              </div>

              {/* Short Break Duration */}
              <div className="p-3.5 bg-neutral-50 border border-neutral-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5 text-emerald-600" />
                    <span>مدت استراحت کوتاه (دقیقه):</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={form.shortBreakDuration}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          shortBreakDuration: Math.max(1, Math.min(60, parseInt(e.target.value) || 1)),
                        })
                      }
                      className="w-16 px-2 py-1 text-center font-mono font-bold text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                    <span className="text-[11px] text-neutral-500">دقیقه</span>
                  </div>
                </div>
                {/* Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {[3, 5, 8, 10].map((m) => (
                    <button
                      key={m}
                      onClick={() => setForm({ ...form, shortBreakDuration: m })}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${
                        form.shortBreakDuration === m
                          ? 'bg-neutral-900 text-white shadow-2xs'
                          : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {m} دقیقه
                    </button>
                  ))}
                </div>
              </div>

              {/* Long Break Duration */}
              <div className="p-3.5 bg-neutral-50 border border-neutral-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5 text-indigo-600" />
                    <span>مدت استراحت طولانی (دقیقه):</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="5"
                      max="90"
                      value={form.longBreakDuration}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          longBreakDuration: Math.max(5, Math.min(90, parseInt(e.target.value) || 5)),
                        })
                      }
                      className="w-16 px-2 py-1 text-center font-mono font-bold text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                    <span className="text-[11px] text-neutral-500">دقیقه</span>
                  </div>
                </div>
                {/* Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {[15, 20, 25, 30].map((m) => (
                    <button
                      key={m}
                      onClick={() => setForm({ ...form, longBreakDuration: m })}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${
                        form.longBreakDuration === m
                          ? 'bg-neutral-900 text-white shadow-2xs'
                          : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {m} دقیقه
                    </button>
                  ))}
                </div>
              </div>

              {/* Rounds before Long Break */}
              <div className="p-3.5 bg-neutral-50 border border-neutral-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-neutral-800">تعداد دور تا استراحت طولانی</label>
                  <p className="text-[11px] text-neutral-500">پس از چند پومودورو، استراحت طولانی آغاز شود</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={form.roundsBeforeLongBreak}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        roundsBeforeLongBreak: Math.max(1, Math.min(10, parseInt(e.target.value) || 4)),
                      })
                    }
                    className="w-14 px-2 py-1 text-center font-mono font-bold text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                  <span className="text-[11px] text-neutral-500">دور</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sound' && (
            <div className="space-y-4">
              {/* Sound Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-800 flex items-center justify-between">
                  <span>نوع صدای نوتیفیکیشن مینیمال:</span>
                  <button
                    onClick={() => handleTestSound()}
                    className="text-[11px] font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>تست صدای انتخابی</span>
                  </button>
                </label>

                <div className="grid grid-cols-1 gap-2">
                  {SOUND_OPTIONS.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => {
                        setForm({ ...form, soundType: opt.id });
                        handleTestSound(opt.id);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        form.soundType === opt.id
                          ? 'border-neutral-900 bg-neutral-900/5'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-neutral-900 flex items-center gap-2">
                          <span>{opt.label}</span>
                          {form.soundType === opt.id && (
                            <span className="w-2 h-2 rounded-full bg-neutral-900" />
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">{opt.desc}</p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestSound(opt.id);
                        }}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-white rounded-lg transition-colors cursor-pointer shrink-0"
                        title="پخش این صدا"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Volume Slider */}
              <div className="p-3.5 bg-neutral-50 border border-neutral-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-800">بلندی صدای آلارم (ولوم):</span>
                  <span className="font-mono font-semibold tabular-nums text-neutral-900">
                    {Math.round(form.soundVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={form.soundVolume}
                  onChange={(e) => setForm({ ...form, soundVolume: parseFloat(e.target.value) })}
                  className="w-full accent-neutral-900 cursor-pointer"
                />
              </div>

              {/* Native Browser Notification */}
              <div className="p-3.5 bg-neutral-50 border border-neutral-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-neutral-700" />
                    <div>
                      <span className="text-xs font-bold text-neutral-800">اعلان دسکتاپ و سیستم مرورگر</span>
                      <p className="text-[11px] text-neutral-500">
                        نمایش نوتیفیکیشن حتی اگر در تب دیگری باشید یا برنامه کوچک باشد
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.browserNotifications}
                      onChange={(e) => setForm({ ...form, browserNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900"></div>
                  </label>
                </div>

                {notificationStatus !== 'granted' && form.browserNotifications && (
                  <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-amber-700">
                      {notificationStatus === 'denied'
                        ? 'دسترسی در مرورگر مسدود است (از تنظیمات مرورگر فعال کنید)'
                        : 'برای دریافت اعلان، دسترسی مرورگر را تایید کنید'}
                    </span>
                    {notificationStatus !== 'denied' && (
                      <button
                        onClick={handleRequestNotification}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        درخواست دسترسی
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'automation' && (
            <div className="space-y-3">
              {/* Auto start breaks */}
              <div className="p-3.5 bg-neutral-50 border border-neutral-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-neutral-800">شروع خودکار استراحت</span>
                  <p className="text-[11px] text-neutral-500">
                    با پایان جلسه تمرکز، تایمر استراحت به طور خودکار شروع شود
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.autoStartBreaks}
                    onChange={(e) => setForm({ ...form, autoStartBreaks: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900"></div>
                </label>
              </div>

              {/* Auto start focus */}
              <div className="p-3.5 bg-neutral-50 border border-neutral-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-neutral-800">شروع خودکار تمرکز بعدی</span>
                  <p className="text-[11px] text-neutral-500">
                    با اتمام زمان استراحت، جلسه جدید مطالعه بدون نیاز به کلیک آغاز شود
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.autoStartFocus}
                    onChange={(e) => setForm({ ...form, autoStartFocus: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900"></div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 bg-neutral-50/60">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 py-1.5 px-2.5 rounded-lg hover:bg-neutral-100 cursor-pointer ios-spring-btn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازنشانی به پیش‌فرض</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 cursor-pointer ios-spring-btn"
            >
              انصراف
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs ios-spring-btn"
            >
              <Check className="w-3.5 h-3.5" />
              <span>ذخیره و اعمال تنظیمات</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
