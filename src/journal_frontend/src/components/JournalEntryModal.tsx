import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Calendar } from './ui/calendar-basic';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useCreateJournalEntry, useUpdateJournalEntry } from '../hooks/useQueries';
// import { useFileUpload } from '../blob-storage/FileStorage';
import type { JournalEntry } from '../../../declarations/journal_backend/journal_backend.did';
import RichTextEditor from './RichTextEditor-new';
import EmojiPicker from './EmojiPicker';
import { BookOpen, Globe, Lock, Calendar as CalendarIcon, Smile, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface JournalEntryModalProps {
  entry?: JournalEntry | null;
  onClose: () => void;
}

export default function JournalEntryModal({ entry, onClose }: JournalEntryModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [imagePath, setImagePath] = useState<string>('');

  const { mutate: createEntry, isPending: isCreating } = useCreateJournalEntry();
  const { mutate: updateEntry, isPending: isUpdating } = useUpdateJournalEntry();
  const [isUploading, setIsUploading] = useState(false);

  const isEditing = !!entry;
  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setContent(entry.content);
      setIsPublic(entry.isPublic);
      setSelectedDate(new Date(Number(entry.date) / 1000000));
//
    }
  }, [entry]);

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

    setIsUploading(true);
    
    try {
      // Convert image to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64String = await base64Promise;
      
      // Store the base64 string as the image path
      setImagePath(base64String);
      
      // Insert image HTML directly into the content at cursor position
      const imageHtml = `<img src="${base64String}" alt="${file.name}" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
      setContent(prev => prev + imageHtml);
      
      toast.success('Image uploaded and inserted!');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setContent(prev => prev + emoji);
  }, []);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }

    const dateInNanoseconds = BigInt(selectedDate.getTime() * 1000000);

    if (isEditing && entry) {
      updateEntry({
        entryId: entry.id,
        title: title.trim(),
        content: content.trim(),
        isPublic,
        date: dateInNanoseconds,
        imagePath: imagePath || null,
      }, {
        onSuccess: onClose,
      });
    } else {
      createEntry({
        title: title.trim(),
        content: content.trim(),
        isPublic,
        date: dateInNanoseconds,
        imagePath: imagePath || null,
      }, {
        onSuccess: onClose,
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl bg-gradient-to-br from-purple-50 to-blue-50 border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-500" />
            {isEditing ? 'Edit Journal Entry' : 'New Journal Entry'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
                Entry Title ✨
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's your story about today?"
                className="border-2 border-purple-200 focus:border-purple-400 rounded-lg"
                maxLength={100}
              />
              <p className="text-xs text-gray-500">{title.length}/100 characters</p>
            </div>

            {/* Date Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Entry Date 📅
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-2 border-purple-200 hover:border-purple-400"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-4 bg-white">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        console.log('Date selected:', date);
                        setSelectedDate(date);
                      }
                    }}
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Content Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-gray-700">
                Your Story 📝
              </Label>
              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-purple-200 hover:border-purple-400"
                    >
                      <Smile className="w-4 h-4 mr-1" />
                      Emoji
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 bg-white rounded-lg shadow-lg border border-purple-100" align="end">
                    <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                  </PopoverContent>
                </Popover>
                

              </div>
            </div>
            <RichTextEditor
              key="journal-editor-modal" // Stable key to prevent re-mounting
              value={content}
              onChange={handleContentChange}
              placeholder="Write about your day, your dreams, your adventures... Let your imagination flow!"
              maxLength={2000}
              onImageUpload={handleImageUpload}
            />
            <p className="text-xs text-gray-500">{content.length}/2000 characters</p>
          </div>

          {/* Privacy Settings */}
          <div className="flex items-center justify-between p-4 rounded-lg border-2 border-purple-200">
            <div className="flex items-center space-x-3">
              {isPublic ? (
                <Globe className="w-5 h-5 text-green-600" />
              ) : (
                <Lock className="w-5 h-5 text-gray-600" />
              )}
              <div>
                <Label htmlFor="privacy" className="text-sm font-semibold text-gray-700">
                  {isPublic ? 'Public Entry' : 'Private Entry'}
                </Label>
                <p className="text-xs text-gray-500">
                  {isPublic 
                    ? 'Others can see this entry when you share your profile'
                    : 'Only you can see this entry'
                  }
                </p>
              </div>
            </div>
            <Switch
              id="privacy"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              className="bg-red-400 data-[state=checked]:bg-green-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !title.trim() || !content.trim()}
              // disabled={isPending || isUploading || !title.trim() || !content.trim()}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold shadow-lg"
            >
              {isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{isEditing ? 'Updating...' : 'Saving...'}</span>
                </div>
              ) : (
                isEditing ? 'Update Entry' : 'Save Entry'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
