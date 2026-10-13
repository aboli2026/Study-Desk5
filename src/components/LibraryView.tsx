import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  FileText,
  Trash2,
  Search,
  Play,
  Calendar,
  HardDrive,
  StickyNote,
  Edit3,
  Bookmark,
  AlertTriangle,
  Plus,
  Download,
  Loader2,
} from 'lucide-react';
import { StudyFile } from '../types';
import { getFileEditsFromStorage } from '../utils/fileStorage';
import { exportAnnotatedPdf } from '../utils/exportPdf';

interface LibraryViewProps {
  files: StudyFile[];
  onOpenFile: (file: StudyFile) => void;
  onDeleteFile: (id: string, fileName?: string) => void;
  onTriggerNewFile?: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  files,
  onOpenFile,
  onDeleteFile,
  onTriggerNewFile,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fileToDelete, setFileToDelete] = useState<StudyFile | null>(null);

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} بایت`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Deduplicate files by name to ensure no duplicates in library
  const uniqueFiles = useMemo(() => {
    const seen = new Set<string>();
    return files.filter((f) => {
      const key = (f.name || '').trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [files]);

  const filteredFiles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return uniqueFiles;
    return uniqueFiles.filter((f) => (f.name || '').toLowerCase().includes(q));
  }, [uniqueFiles, searchQuery]);

  const [exportingId, setExportingId] = useState<string | null>(null);

  const handleConfirmDelete = () => {
    if (fileToDelete) {
      onDeleteFile(fileToDelete.id, fileToDelete.name);
      setFileToDelete(null);
    }
  };

  const handleExport = async (file: StudyFile, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!file.data) return;
    setExportingId(file.id);
    try {
      const edits = await getFileEditsFromStorage(file.id);
      await exportAnnotatedPdf({
        pdfData: file.data,
        fileName: file.name,
        pageStrokes: edits?.pageStrokes || file.pageStrokes || {},
        stickyNotes: edits?.stickyNotes || file.stickyNotes || [],
      });
    } catch (err) {
      console.error('Failed to export file from library:', err);
      alert('خطا در دانلود فایل ادیت‌شده.');
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div
      className="h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto bg-neutral-50/60 select-none"
      dir="rtl"
    >
      <div className="max-w-3xl w-full mx-auto space-y-5">
        {/* Apple-style In-App Delete Confirmation Dialog */}
        {fileToDelete && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setFileToDelete(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200/80 space-y-5 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                  حذف فایل از کتابخانه
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  آیا از حذف فایل{' '}
                  <span className="font-bold text-neutral-800">«{fileToDelete.name}»</span> از
                  کتابخانه اطمینان دارید؟
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFileToDelete(null)}
                  className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl cursor-pointer transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>بله، حذف شود</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Minimal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="p-1.5 rounded-xl bg-neutral-900 text-white">
                <BookOpen className="w-4 h-4" />
              </span>
              <h1 className="text-base sm:text-xl font-bold text-neutral-900">
                کتابخانه فایل‌های مطالعه‌شده
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-500">
              لیست فایل‌ها و جزوات شما با امکان ادامه سریع مطالعه
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <span className="text-xs font-mono font-semibold text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-xl border border-neutral-200/60">
              {uniqueFiles.length} فایل
            </span>
            {onTriggerNewFile && (
              <button
                type="button"
                onClick={onTriggerNewFile}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl cursor-pointer ios-spring-btn shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>فایل جدید</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar (if files exist) */}
        {uniqueFiles.length > 0 && (
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="جستجوی عنوان فایل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-neutral-200/80 rounded-2xl text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white shadow-xs transition-all"
            />
          </div>
        )}

        {/* Empty State */}
        {uniqueFiles.length === 0 ? (
          <div className="p-10 sm:p-14 bg-white border border-neutral-200/80 rounded-3xl text-center flex flex-col items-center justify-center shadow-xs space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-700">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-sm sm:text-base font-bold text-neutral-900">
                کتابخانه هنوز خالی است
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                با انتخاب هر فایل PDF، فایل به صورت خودکار با تمام یادداشت‌ها و صفحه جاری در این
                لیست قرار می‌گیرد.
              </p>
            </div>
            {onTriggerNewFile && (
              <button
                type="button"
                onClick={onTriggerNewFile}
                className="mt-2 px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl cursor-pointer ios-spring-btn shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>انتخاب اولین فایل</span>
              </button>
            )}
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-8 bg-white border border-neutral-200/80 rounded-2xl text-center text-xs text-neutral-400">
            فایلی با عنوان «{searchQuery}» پیدا نشد.
          </div>
        ) : (
          /* ========================================================
             NARROW MINIMAL LIST STACKED UNDER EACH OTHER (لیست باریک زیر هم)
             ======================================================== */
          <div className="flex flex-col space-y-2.5">
            {filteredFiles.map((file) => {
              const sizeText = formatFileSize(file.size);
              const hasNotes = file.stickyNotes && file.stickyNotes.length > 0;
              const hasDrawings =
                file.pageStrokes && Object.values(file.pageStrokes).some((s) => s.length > 0);

              const currentPage = file.currentPage && file.currentPage > 0 ? file.currentPage : 1;
              const pageCount = file.pageCount && file.pageCount > 0 ? file.pageCount : 0;
              const percent = pageCount > 0 ? Math.min(100, Math.round((currentPage / pageCount) * 100)) : 0;
              const isCompleted = pageCount > 0 && currentPage >= pageCount;

              return (
                <div
                  key={file.id}
                  onClick={() => onOpenFile(file)}
                  className="bg-white rounded-2xl border border-neutral-200/90 hover:border-neutral-300 hover:bg-neutral-50/50 py-3.5 px-3.5 sm:px-4 shadow-2xs hover:shadow-xs transition-colors transition-shadow flex flex-col gap-2.5 group cursor-pointer"
                >
                  {/* Top Row: File Icon + Title + Metadata + Actions */}
                  <div className="flex items-center justify-between gap-3 w-full">
                    {/* Right Side: Icon + Name + Tags */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Compact Document Icon */}
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>

                      {/* Prominent Name & Inline Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3
                            className="text-xs sm:text-sm font-bold text-neutral-900 truncate group-hover:text-black select-text"
                            title={file.name}
                          >
                            {file.name}
                          </h3>

                          {file.currentPage && file.currentPage > 1 && (
                            <span className="shrink-0 text-[10px] font-bold text-neutral-700 bg-neutral-100 border border-neutral-200/70 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                              <Bookmark className="w-2.5 h-2.5 text-neutral-500" />
                              <span>صفحه {file.currentPage}</span>
                            </span>
                          )}
                        </div>

                        {/* Tiny Metadata Row */}
                        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-neutral-400 mt-1 font-mono">
                          {sizeText && (
                            <span className="flex items-center gap-1">
                              <HardDrive className="w-2.5 h-2.5" />
                              <span>{sizeText}</span>
                            </span>
                          )}

                          {file.uploadDate && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" />
                                <span>{file.uploadDate}</span>
                              </span>
                            </>
                          )}

                          {hasNotes && (
                            <>
                              <span>·</span>
                              <span className="text-amber-700 flex items-center gap-0.5">
                                <StickyNote className="w-2.5 h-2.5" />
                                <span>{file.stickyNotes?.length} یادداشت</span>
                              </span>
                            </>
                          )}

                          {hasDrawings && (
                            <>
                              <span>·</span>
                              <span className="text-sky-700 flex items-center gap-0.5">
                                <Edit3 className="w-2.5 h-2.5" />
                                <span>نشانه‌دار</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Left Side: Dedicated "ادامه مطالعه" Button + Delete Button */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenFile(file);
                        }}
                        className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white text-[11px] sm:text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all ios-spring-btn shrink-0"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>ادامه مطالعه</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleExport(file, e)}
                        disabled={exportingId === file.id}
                        className="p-1.5 sm:p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-40"
                        title="دانلود نسخه PDF با تمام ادیت‌ها و هایلایت‌ها"
                      >
                        {exportingId === file.id ? (
                          <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-neutral-700" />
                        ) : (
                          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileToDelete(file);
                        }}
                        className="p-1.5 sm:p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
                        title="حذف از کتابخانه"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Minimal Reading Progress Bar (نوار پیشرفت مطالعه مینیمال) */}
                  <div className="pt-2 border-t border-neutral-100/90 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                      <span className="flex items-center gap-1 text-neutral-600 font-sans">
                        <span className="text-neutral-400">پیشرفت:</span>
                        {pageCount > 0 ? (
                          <span className="font-bold text-neutral-800 font-mono">
                            صفحه {currentPage} از {pageCount}
                          </span>
                        ) : (
                          <span className="font-medium text-neutral-700 font-mono">
                            صفحه {currentPage}
                          </span>
                        )}
                      </span>

                      <span
                        className={`font-bold tabular-nums flex items-center gap-1 ${
                          isCompleted
                            ? 'text-emerald-600'
                            : percent > 0
                            ? 'text-neutral-800'
                            : 'text-neutral-400'
                        }`}
                      >
                        {isCompleted ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-1.5 py-0.5 rounded font-sans text-[10px]">
                            تکمیل شد ۱۰۰٪ ✓
                          </span>
                        ) : pageCount > 0 ? (
                          `${percent}٪`
                        ) : (
                          'آماده مطالعه'
                        )}
                      </span>
                    </div>

                    {/* Slender Minimal Track & Fill */}
                    <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/60">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${
                          isCompleted
                            ? 'bg-emerald-500'
                            : percent > 0
                            ? 'bg-neutral-800 group-hover:bg-neutral-900'
                            : 'bg-neutral-200'
                        }`}
                        style={{
                          width: pageCount > 0 ? `${percent}%` : '4%',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
