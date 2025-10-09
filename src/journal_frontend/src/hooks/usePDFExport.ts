import { useCallback } from 'react';
import type { JournalEntry } from '../../../declarations/journal_backend/journal_backend.did';

export function usePDFExport() {
  const exportEntryAsPDF = useCallback(async (entry: JournalEntry) => {
    try {
      // Dynamically import jsPDF only when needed
      const { default: jsPDF } = await import('jspdf');
      // Simple text conversion
      let text = entry.content;
      
      // Replace entire img tags containing data:image with placeholders
      text = text.replace(/<img[^>]*data:image[^>]*>/gi, '[Image]');
      
      // Replace any remaining img tags
      text = text.replace(/<img[^>]*>/gi, '[Image]');
      
      // Remove any orphaned base64 data that might be left
      text = text.replace(/data:image\/[^"'\s>]*[A-Za-z0-9+/=]*/gi, '[Image]');
      
      // Clean up any incomplete img tags
      text = text.replace(/<img[^>]*$/gi, '[Image]');
      text = text.replace(/<img\s+src="[^"]*$/gi, '[Image]');
      
      // Handle paragraphs and line breaks
      text = text.replace(/<\/p>/gi, '\n\n');
      text = text.replace(/<p[^>]*>/gi, '');
      text = text.replace(/<br\s*\/?>/gi, '\n');
      
      // Remove all HTML tags
      text = text.replace(/<[^>]*>/g, '');
      
      // Handle entities
      text = text.replace(/&nbsp;/g, ' ');
      text = text.replace(/&amp;/g, '&');
      text = text.replace(/&quot;/g, '"');
      
      // Clean up whitespace
      text = text.replace(/\s+/g, ' ');
      text = text.replace(/\n{3,}/g, '\n\n');
      text = text.trim();

      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxLineWidth = pageWidth - 2 * margin;

      // Add title
      doc.setFontSize(16);
      doc.text(entry.title || 'Journal Entry', margin, margin);
      
      // Add date
      doc.setFontSize(10);
      const date = new Date(Number(entry.timestamp) / 1000000).toLocaleDateString();
      doc.text(date, margin, margin + 15);

      // Add content
      doc.setFontSize(12);
      const lines = doc.splitTextToSize(text, maxLineWidth);
      doc.text(lines, margin, margin + 30);

      // Save
      doc.save(`${entry.title || 'journal-entry'}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF export failed. Please try again.');
    }
  }, []);

  return { exportEntryAsPDF };
}