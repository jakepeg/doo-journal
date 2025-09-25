import { useState, useRef } from 'react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Bold, Italic, List, Quote } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export default function RichTextEditor({ value, onChange, placeholder, maxLength }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

  const handleSelectionChange = () => {
    if (textareaRef.current) {
      setSelectionStart(textareaRef.current.selectionStart);
      setSelectionEnd(textareaRef.current.selectionEnd);
    }
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);
    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      if (textarea) {
        const newCursorPos = start + prefix.length + selectedText.length + suffix.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }
    }, 0);
  };

  const formatBold = () => insertFormatting('**', '**');
  const formatItalic = () => insertFormatting('*', '*');
  const formatList = () => {
    const lines = value.split('\n');
    const start = textareaRef.current?.selectionStart || 0;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const currentLine = lines.findIndex((_, index) => {
      const lineEnd = lines.slice(0, index + 1).join('\n').length;
      return lineEnd >= start;
    });
    
    if (currentLine >= 0) {
      const line = lines[currentLine];
      if (line.startsWith('- ')) {
        lines[currentLine] = line.substring(2);
      } else {
        lines[currentLine] = '- ' + line;
      }
      onChange(lines.join('\n'));
    }
  };
  
  const formatQuote = () => {
    const lines = value.split('\n');
    const start = textareaRef.current?.selectionStart || 0;
    const currentLine = lines.findIndex((_, index) => {
      const lineEnd = lines.slice(0, index + 1).join('\n').length;
      return lineEnd >= start;
    });
    
    if (currentLine >= 0) {
      const line = lines[currentLine];
      if (line.startsWith('> ')) {
        lines[currentLine] = line.substring(2);
      } else {
        lines[currentLine] = '> ' + line;
      }
      onChange(lines.join('\n'));
    }
  };

  return (
    <div className="space-y-2">
      {/* Formatting Toolbar */}
      <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-t-lg border border-b-0 border-purple-200">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={formatBold}
          className="h-8 w-8 p-0 hover:bg-purple-100"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={formatItalic}
          className="h-8 w-8 p-0 hover:bg-purple-100"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={formatList}
          className="h-8 w-8 p-0 hover:bg-purple-100"
          title="List"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={formatQuote}
          className="h-8 w-8 p-0 hover:bg-purple-100"
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </Button>
        <div className="flex-1"></div>
        <div className="text-xs text-gray-500 px-2">
          Markdown supported
        </div>
      </div>

      {/* Text Area */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleSelectionChange}
        placeholder={placeholder}
        className="border-2 border-purple-200 focus:border-purple-400 rounded-t-none min-h-[300px] font-mono text-sm"
        maxLength={maxLength}
      />

      {/* Preview hint */}
      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>Formatting tips:</strong></p>
        <p>**bold text** • *italic text* • - list item • &gt; quote {/* • ![alt](url) for images */}</p>
      </div>
    </div>
  );
}
