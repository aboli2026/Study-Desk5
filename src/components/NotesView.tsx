import React, { useState } from 'react';
import { Plus, Trash2, Calendar, FileEdit } from 'lucide-react';
import { NoteItem } from '../types';

interface NotesViewProps {
  notes: NoteItem[];
  onAddNote: (note: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateNote: (id: string, title: string, content: string) => void;
  onDeleteNote: (id: string) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    notes.length > 0 ? notes[0].id : null
  );
  const [isCreatingNew, setIsCreatingNew] = useState(notes.length === 0);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const activeNote = notes.find((n) => n.id === selectedNoteId);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() && !newContent.trim()) return;

    onAddNote({
      title: newTitle.trim() || 'یادداشت بدون عنوان',
      content: newContent.trim(),
    });

    setNewTitle('');
    setNewContent('');
    setIsCreatingNew(false);
  };

  const handleStartNew = () => {
    setIsCreatingNew(true);
    setSelectedNoteId(null);
    setNewTitle('');
    setNewContent('');
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-white overflow-hidden">
      {/* Sidebar List of Notes */}
      <div className="w-full md:w-80 border-l border-neutral-200 bg-neutral-50/60 flex flex-col h-1/3 md:h-full shrink-0">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-neutral-900">یادداشت‌ها</h2>
            <span className="text-xs text-neutral-500 font-mono tabular-nums">
              ({notes.length})
            </span>
          </div>
          <button
            onClick={handleStartNew}
            className="px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg flex items-center gap-1.5 cursor-pointer ios-spring-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>یادداشت جدید</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 p-2 space-y-1">
          {notes.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-400">
              هنوز یادداشتی ثبت نشده است. روی «یادداشت جدید» کلیک کنید.
            </div>
          ) : (
            notes.map((note) => {
              const isSelected = !isCreatingNew && note.id === selectedNoteId;
              return (
                <div
                  key={note.id}
                  onClick={() => {
                    setSelectedNoteId(note.id);
                    setIsCreatingNew(false);
                  }}
                  className={`p-3 rounded-lg cursor-pointer text-right relative group ios-spring-card ${
                    isSelected
                      ? 'bg-white shadow-xs border border-neutral-200'
                      : 'hover:bg-neutral-100/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-neutral-900 truncate flex-1">
                      {note.title}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNote(note.id);
                        if (selectedNoteId === note.id) {
                          setSelectedNoteId(null);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-600 p-1 cursor-pointer ios-spring-tool"
                      title="حذف یادداشت"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 line-clamp-2 mt-1">
                    {note.content || 'بدون متن...'}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-neutral-400">
                    <Calendar className="w-3 h-3" />
                    <span className="font-mono tabular-nums">{note.createdAt}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Note Editor Area */}
      <div className="flex-1 flex flex-col h-2/3 md:h-full bg-white">
        {isCreatingNew ? (
          <form onSubmit={handleCreateSubmit} className="flex-1 flex flex-col p-6 max-w-3xl w-full mx-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
              <span className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                <FileEdit className="w-4 h-4" />
                نوشتن یادداشت جدید
              </span>
              <button
                type="submit"
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg cursor-pointer ios-spring-btn"
              >
                ذخیره یادداشت
              </button>
            </div>
            <input
              type="text"
              placeholder="عنوان یادداشت..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full text-lg font-bold text-neutral-900 placeholder:text-neutral-300 border-none outline-none focus:ring-0 mb-4 bg-transparent"
              autoFocus
            />
            <textarea
              placeholder="نکات مطالعه، خلاصه مباحث یا یادداشت‌های درس..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full flex-1 resize-none border-none outline-none focus:ring-0 text-sm text-neutral-700 leading-relaxed placeholder:text-neutral-300 bg-transparent"
            />
          </form>
        ) : activeNote ? (
          <div className="flex-1 flex flex-col p-6 max-w-3xl w-full mx-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
              <div className="text-xs text-neutral-400 flex items-center gap-2">
                <span>آخرین ویرایش:</span>
                <span className="font-mono tabular-nums">{activeNote.updatedAt}</span>
              </div>
              <button
                onClick={() => onDeleteNote(activeNote.id)}
                className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer ios-spring-btn"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف</span>
              </button>
            </div>
            <input
              type="text"
              value={activeNote.title}
              onChange={(e) => onUpdateNote(activeNote.id, e.target.value, activeNote.content)}
              className="w-full text-lg font-bold text-neutral-900 border-none outline-none focus:ring-0 mb-4 bg-transparent"
            />
            <textarea
              value={activeNote.content}
              onChange={(e) => onUpdateNote(activeNote.id, activeNote.title, e.target.value)}
              className="w-full flex-1 resize-none border-none outline-none focus:ring-0 text-sm text-neutral-700 leading-relaxed bg-transparent"
              placeholder="متن یادداشت..."
            />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-neutral-400">
            <p className="text-sm">یک یادداشت را انتخاب کنید یا یادداشت جدید بسازید.</p>
            <button
              onClick={handleStartNew}
              className="mt-3 px-4 py-2 bg-neutral-900 text-white text-xs font-medium rounded-lg cursor-pointer ios-spring-btn"
            >
              ایجاد یادداشت جدید
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
