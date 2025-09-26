import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  maxLength,
}: RichTextEditorProps) {
  const handleChange = (content: string) => {
    if (maxLength && content.replace(/<[^>]+>/g, '').length > maxLength) {
      return; // stop typing if maxLength exceeded
    }
    onChange(content);
  };

  return (
    <div className="border border-purple-200 rounded-lg overflow-hidden">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={handleChange}
        placeholder={placeholder || 'Start writing your journal...'}
        modules={{
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote'],
            ['clean'],
          ],
        }}
      />
      {maxLength && (
        <div className="text-xs text-gray-500 text-right px-3 py-1">
          {value.replace(/<[^>]+>/g, '').length}/{maxLength} characters
        </div>
      )}
    </div>
  );
}
