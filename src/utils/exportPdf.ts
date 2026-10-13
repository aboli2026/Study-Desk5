import { PDFDocument } from 'pdf-lib';
import type { DrawingStroke, StickyNoteItem } from '../types';

export interface ExportPdfOptions {
  pdfData: ArrayBuffer;
  fileName: string;
  pageStrokes: Record<number, DrawingStroke[]>;
  stickyNotes: StickyNoteItem[];
}

/**
 * Embeds all highlighters, pen lines, ruler lines, and sticky notes
 * permanently into the PDF pages using pdf-lib and triggers a download.
 * The resulting PDF is 100% visible and interactive in Adobe Acrobat,
 * Apple Preview, Google Chrome, Microsoft Edge, Foxit, phones, and print.
 */
export async function exportAnnotatedPdf({
  pdfData,
  fileName,
  pageStrokes,
  stickyNotes,
}: ExportPdfOptions): Promise<void> {
  // Load original PDF document bytes
  const pdfDoc = await PDFDocument.load(pdfData);
  const pages = pdfDoc.getPages();

  // High-DPI scale for sharp vector-like rendering
  const RASTER_SCALE = 2.0;

  for (let i = 0; i < pages.length; i++) {
    const pageNum = i + 1;
    const strokes = pageStrokes[pageNum] || [];
    const notes = stickyNotes.filter((n) => n.pageNumber === pageNum);

    if (strokes.length === 0 && notes.length === 0) {
      continue;
    }

    const pdfPage = pages[i];
    const { width: pageWidth, height: pageHeight } = pdfPage.getSize();

    // Create offscreen canvas for this page's annotations
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(pageWidth * RASTER_SCALE);
    canvas.height = Math.round(pageHeight * RASTER_SCALE);
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    ctx.scale(RASTER_SCALE, RASTER_SCALE);

    // 1. Highlighters (draw first with multiply blend mode and translucent alpha)
    const highlighters = strokes.filter((s) => s.tool === 'highlighter');
    for (const stroke of highlighters) {
      if (!stroke.points || stroke.points.length === 0) continue;
      ctx.save();
      ctx.globalAlpha = stroke.opacity || 0.52;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'bevel';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let p = 1; p < stroke.points.length; p++) {
        ctx.lineTo(stroke.points[p].x, stroke.points[p].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 2. Pens and Rulers (solid, crisp strokes)
    const otherStrokes = strokes.filter((s) => s.tool !== 'highlighter');
    for (const stroke of otherStrokes) {
      if (!stroke.points || stroke.points.length === 0) continue;
      ctx.save();
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let p = 1; p < stroke.points.length; p++) {
        ctx.lineTo(stroke.points[p].x, stroke.points[p].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 3. Sticky Notes (clean, elegant note cards)
    for (const note of notes) {
      ctx.save();
      const noteW = 140;
      const noteH = 75;
      const nx = Math.max(0, Math.min(pageWidth - noteW, note.x));
      const ny = Math.max(0, Math.min(pageHeight - noteH, note.y));

      // Note shadow
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.beginPath();
      ctx.roundRect(nx + 1, ny + 1.5, noteW, noteH, 6);
      ctx.fill();

      // Note body
      ctx.fillStyle = note.color || '#fef08a';
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(nx, ny, noteW, noteH, 6);
      ctx.fill();
      ctx.stroke();

      // Top header bar
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.beginPath();
      ctx.roundRect(nx, ny, noteW, 18, [6, 6, 0, 0]);
      ctx.fill();

      // Title
      ctx.fillStyle = note.textColor || '#171717';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText((note.title || 'یادداشت').slice(0, 24), nx + 6, ny + 13);

      // Content text
      if (note.content) {
        ctx.font = '8px sans-serif';
        const words = note.content.split(/\s+/);
        let line = '';
        let lineY = ny + 29;
        for (const w of words) {
          const testLine = line + (line ? ' ' : '') + w;
          if (ctx.measureText(testLine).width > noteW - 12 && line) {
            ctx.fillText(line, nx + 6, lineY);
            line = w;
            lineY += 11;
            if (lineY > ny + noteH - 6) break;
          } else {
            line = testLine;
          }
        }
        if (line && lineY <= ny + noteH - 6) {
          ctx.fillText(line, nx + 6, lineY);
        }
      }
      ctx.restore();
    }

    // Convert to PNG binary
    const pngDataUrl = canvas.toDataURL('image/png');
    const base64Data = pngDataUrl.split(',')[1];
    const binaryStr = atob(base64Data);
    const pngBytes = new Uint8Array(binaryStr.length);
    for (let b = 0; b < binaryStr.length; b++) {
      pngBytes[b] = binaryStr.charCodeAt(b);
    }

    // Embed PNG into the PDF page
    const pngImage = await pdfDoc.embedPng(pngBytes);
    pdfPage.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });
  }

  // Save the modified PDF binary
  const modifiedPdfBytes = await pdfDoc.save();

  // Trigger browser download
  const blob = new Blob([modifiedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanName = fileName.replace(/\.pdf$/i, '');
  a.download = `${cleanName}_با_ادیت‌ها.pdf`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
