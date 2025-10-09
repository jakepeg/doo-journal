"use client"

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar } from './ui/calendar-basic';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useCreateJournalEntry } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
// import { useFileUpload } from '../blob-storage/FileStorage';
import RichTextEditor from './RichTextEditor-new';
import { ArrowLeft, Calendar as CalendarIcon, Lock, Unlock, Save } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AddEntryPage() {
  const navigate = useNavigate();
  const { identity, loginStatus } = useInternetIdentity();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [imagePath, setImagePath] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const isAuthenticatedRef = useRef(false);

  const { mutate: createEntry, isPending } = useCreateJournalEntry();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Simple authentication check
  useEffect(() => {
    if (!identity) {
      console.log('[DEBUG] AddEntryPage: No identity found, redirecting to home');
      navigate({ to: '/' });
    }
  }, [identity, navigate]);
  // const { uploadFile, isUploading } = useFileUpload();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[DEBUG] AddEntryPage: Form submitted', {
      title: title.trim(),
      contentLength: content.trim().length,
      isPublic,
      selectedDate: selectedDate.toISOString(),
      imagePath
    });
    
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }

    // Convert date to nanoseconds (bigint)
    const dateInNanoseconds = BigInt(selectedDate.getTime() * 1000000);

    // Navigate immediately with optimistic update
    console.log('[DEBUG] AddEntryPage: Creating entry and navigating optimistically');
    
    createEntry({
      title: title.trim(),
      content: content.trim(),
      isPublic,
      date: dateInNanoseconds,
      imagePath: imagePath || null,
    });

    // Navigate immediately - the optimistic update will show the entry instantly
    navigate({ to: '/' });
  };

  const handleImageUpload = useCallback(async (file: File) => {
    console.log('[DEBUG] AddEntryPage: Image upload started', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    setIsUploadingImage(true);
    
    try {
      // Convert image to base64 for backend storage
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64String = await base64Promise;
      
      console.log('[DEBUG] AddEntryPage: Image converted to base64');
      
      // Only update state if component is still mounted
      if (isMounted) {
        // Store the base64 string as the image path for backend
        setImagePath(base64String);
        console.log('[DEBUG] AddEntryPage: Image path set for backend storage');
      }
    } catch (error) {
      console.error('[DEBUG] AddEntryPage: Image upload error:', error);
    } finally {
      if (isMounted) {
        setIsUploadingImage(false);
      }
    }
  }, [isMounted]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, [identity, loginStatus]);

  const handleBackToJournal = () => {
    console.log('[DEBUG] AddEntryPage: Back to journal clicked');
    navigate({ to: '/' });
  };

  // (Reverted) Panel-level toggle removed due to runtime error; using Switch only.

  return (
    <>

      
      {/* Back to Journal Button - Below Navigation */}
      <div className="container mx-auto px-4 py-4 max-w-[1024px]">
        <Button
          onClick={handleBackToJournal}
          variant="ghost"
          size="sm"
          className="text-gray-600 hover:text-purple-600"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Journal
        </Button>
      </div>

      <main className="container mx-auto px-4 pb-8 max-w-[1024px] flex-1 mb-8">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✨</span>
              </div>
              Create A New Journal Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="border-2 border-purple-200 focus:border-purple-400 rounded-lg text-lg"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500">{title.length}/100 characters</p>
              </div>

              {/* Date Selector */}
<div className="space-y-2">
  <Label className="text-sm font-semibold text-gray-700">
    Entry Date 📅
  </Label>
  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
    <PopoverTrigger asChild>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start text-left font-normal border-2 border-purple-200 hover:border-purple-400"
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {format(selectedDate, "PPP")}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-[280px] p-2 bg-white rounded-lg shadow-lg border border-purple-100">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => {
          console.log('Date selected:', date);
          if (date) {
            setSelectedDate(date);
            setIsCalendarOpen(false); // Close calendar when date is selected
          }
        }}
        className="rounded-md border"
      />
    </PopoverContent>
  </Popover>
</div>




              {/* Content Editor */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Your Story 📝
                </Label>
                <RichTextEditor
                  key="journal-editor" // Stable key to prevent re-mounting
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Write about your day, your dreams, your adventures... Let your imagination flow!"
                  maxLength={2000}
                  onImageUpload={handleImageUpload}
                />
                <p className="text-xs text-gray-500">{content.length}/2000 characters</p>
              </div>

              {/* Privacy Settings */}
              <div className="flex items-center justify-between p-4 rounded-lg border-2 border-purple-200 select-none">
                <div className="flex items-center space-x-3">
                  {isPublic ? (
                    <Unlock className="w-5 h-5 text-green-600" />
                  ) : (
                    <Lock className="w-5 h-5 text-red-600" />
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
                  className="bg-red-500 data-[state=checked]:bg-green-500"
                />
              </div>

              {/* Submit Button */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={handleBackToJournal}
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
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>Save Entry</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

    </>
  );
}
