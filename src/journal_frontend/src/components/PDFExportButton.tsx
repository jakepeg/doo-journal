import { Button } from './ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { usePDFExport } from '../hooks/usePDFExport';
import type { JournalEntry } from '../../../declarations/journal_backend/journal_backend.did';

interface PDFExportButtonProps {
  entry: JournalEntry;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showText?: boolean;
}

export function PDFExportButton({ 
  entry, 
  variant = 'outline', 
  size = 'sm',
  className,
  showText = false
}: PDFExportButtonProps) {
  const { exportEntryAsPDF } = usePDFExport();

  const handleExport = async () => {
    try {
      await exportEntryAsPDF(entry);
    } catch (error) {
      console.error('PDF export failed:', error);
      // You might want to show a toast notification here
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      className={className}
      title="Export as PDF"
    >
      <FileDown className="h-4 w-4" />
      {showText && (
        <span className="ml-2">Export PDF</span>
      )}
    </Button>
  );
}