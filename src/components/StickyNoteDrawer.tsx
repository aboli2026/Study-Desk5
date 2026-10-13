import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Check,
  Bold,
  Palette,
  Clock,
  FileText,
  Bookmark,
} from 'lucide-react';
import { StickyNoteItem } from '../types';

interface StickyNoteDrawerProps {
  note: StickyNoteItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (note: StickyNoteItem) => void;
  onDelete: (id: string) => void;
}

const PRESET_COLORS = [
  { bg: '#fef08a', text: '#713f12', name: 'زرد کلاسیک' },
  { bg: '#bbf7d0', text: '#14532d', name: 'سبز نعنایی' },
  { bg: '#fed7aa', text: '#7c2d12', name: 'هلویی' },
  { bg: '#bae6fd', text: '#0c4a6e', name: 'آبی آسمانی' },
  { bg: '#e9d5ff', text: '#581c87', name: 'بنفش اسطوخودوس' },
  { bg: '#fecdd3', text: '#881337', name: 'صورتی ملایم' },
  { bg: '#f3f4f6', text: '#1f2937', name: 'خاکستری مینیمال' },
];

export const StickyNoteDrawer: React.FC<StickyNoteDrawerProps> = ({
  note,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('#fef08a');
  const [textColor, setTextColor] = useState('#713f12');
  const [isBold, setIsBold] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setColor(note.color || '#fef08a');
      setTextColor(note.textColor || '#713f12');
      setIsBold(Boolean(note.isBold));
    }
  }, [note]);

  if (!isOpen || !note) return null;

  const handleSave = () => {
    onUpdate({
      ...note,
      title: title.trim() || 'یادداشت چسبان',
      content: content.trim(),
      color,
      textColor,
      isBold,
    });
    onClose();
  };

  const handleDelete = () => {
    onDelete(note.id);
    onClose();
  };

  const handleSelectColor = (bg: string, txt: string) => {
    setColor(bg);
    setTextColor(txt);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden select-none bg-black/30 backdrop-blur-xs flex justify-end"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="w-full sm:w-[600px] md:w-[680px] lg:w-[740px] max-w-full h-full bg-white shadow-2xl flex flex-col justify-between border-r border-neutral-200 animate-in slide-in-from-left duration-300 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-2">
            <div
              className="w-3.5 h-3.5 rounded-full border border-neutral-300 shadow-xs"
              style={{ backgroundColor: color }}
            />
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 flex items-center gap-1.5">
              <Bookmark className="w-4 h-4 text-neutral-600" />
              <span>یادداشت صفحه {note.pageNumber}</span>
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 cursor-pointer ios-spring-btn"
              title="حذف یادداشت"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 cursor-pointer ios-spring-btn"
              title="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body Form */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 flex flex-col">
          {/* Note Title */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
              عنوان یادداشت
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="یک عنوان خلاصه..."
              className="w-full px-3.5 py-2.5 text-sm sm:text-base bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all font-semibold text-neutral-900"
            />
          </div>

          {/* Color Palettes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-2 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5" />
              <span>رنگ برگه چسبان</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((preset) => {
                const isSelected = color === preset.bg;
                return (
                  <button
                    key={preset.bg}
                    onClick={() => handleSelectColor(preset.bg, preset.text)}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer ios-spring-tool transition-transform ${
                      isSelected
                        ? 'border-neutral-900 scale-110 shadow-sm ring-2 ring-neutral-400'
                        : 'border-neutral-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: preset.bg }}
                    title={preset.name}
                  >
                    {isSelected && (
                      <Check
                        className="w-3.5 h-3.5"
                        style={{ color: preset.text }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text Styling Toggles */}
          <div className="flex items-center gap-2 pt-1 border-t border-neutral-100">
            <button
              onClick={() => setIsBold(!isBold)}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ios-spring-btn transition-colors ${
                isBold
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200'
              }`}
            >
              <Bold className="w-3.5 h-3.5" />
              <span>متن بولد (ضخیم)</span>
            </button>
          </div>

          {/* Elongated Note Content Textarea (تکست‌باکس کشیده، مرتفع و جادار) */}
          <div className="space-y-1.5 flex-1 flex flex-col min-h-[360px]">
            <label className="block text-xs font-semibold text-neutral-600 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span>متن یادداشت</span>
            </label>
            <div
              className="rounded-2xl p-4 sm:p-5 border border-neutral-200/90 shadow-inner flex-1 flex flex-col min-h-[360px] sm:min-h-[440px] transition-colors"
              style={{ backgroundColor: color }}
            >
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="متن نکته یا خلاصه این بخش از کتاب یا جزوه را بنویسید..."
                className="w-full flex-1 bg-transparent resize-y border-none focus:outline-none text-sm sm:text-base leading-relaxed font-sans placeholder:text-neutral-400"
                style={{
                  color: textColor,
                  fontWeight: isBold ? 700 : 400,
                  minHeight: '320px',
                }}
                rows={18}
              />
            </div>
          </div>

          {/* Creation date info */}
          {note.createdAt && (
            <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono pt-1">
              <Clock className="w-3 h-3" />
              <span>ایجاد شده در: {new Date(note.createdAt).toLocaleDateString('fa-IR')}</span>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50/80 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 rounded-xl cursor-pointer ios-spring-btn"
          >
            انصراف
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ios-spring-btn"
          >
            <Check className="w-4 h-4" />
            <span>ذخیره تغییرات</span>
          </button>
        </div>
      </div>
    </div>
  );
};
