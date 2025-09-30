import React, { useMemo, useRef, useCallback } from 'react';
import ReactQuill from 'react-quill';
import { toast } from 'sonner';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  onImageUpload?: (file: File) => void;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  maxLength,
  onImageUpload,
}: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);

  const handleChange = (content: string) => {
    if (maxLength && content.replace(/<[^>]+>/g, '').length > maxLength) {
      return; // stop typing if maxLength exceeded
    }
    onChange(content);
  };

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB for journal images)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    try {
      toast.loading('Uploading image...', { id: 'image-upload' });

      // Convert image to base64
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Insert image directly into Quill editor at current cursor position
      const quill = quillRef.current?.getEditor();
      if (quill) {
        const range = quill.getSelection();
        const index = range ? range.index : quill.getLength();
        
        // Insert the image using Quill's native embed
        quill.insertEmbed(index, 'image', base64String);
        
        // Move cursor to after the image
        quill.setSelection({ index: index + 1, length: 0 });
      }

      toast.success('Image uploaded and inserted!', { id: 'image-upload' });
      
      // Also call the parent callback if provided (for storing image path)
      if (onImageUpload) {
        onImageUpload(file);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image', { id: 'image-upload' });
    }
  }, [onImageUpload]);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote'],
        ['image'],
        ['clean'],
      ],
      handlers: {
        image: () => {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();

          input.onchange = () => {
            const file = input.files?.[0];
            if (file) {
              handleImageUpload(file);
            }
          };
        },
      },
    },
  }), [handleImageUpload]);

  return (
    <div className="border border-purple-200 rounded-lg overflow-hidden">
      <div className="[&_.ql-editor]:min-h-[120px]">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={handleChange}
          placeholder={placeholder || 'Start writing your journal...'}
          modules={modules}
        />
      </div>
      {maxLength && (
        <div className="text-xs text-gray-500 text-right px-3 py-1">
          {value.replace(/<[^>]+>/g, '').length}/{maxLength} characters
        </div>
      )}
    </div>
  );
}