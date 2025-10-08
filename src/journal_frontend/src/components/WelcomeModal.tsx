import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useSaveUserProfile } from '../hooks/useQueries';
import { Sparkles, User } from 'lucide-react';
import { toast } from 'sonner';

interface WelcomeModalProps {
  onClose: () => void;
}

export default function WelcomeModal({ onClose }: WelcomeModalProps) {
  const [name, setName] = useState('');
  
  const { mutate: saveProfile, isPending: isSaving } = useSaveUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    saveProfile(
      {
        name: name.trim(),
        bio: '', // Empty bio for quick onboarding
        profilePicture: [], // No profile picture initially
        coverImage: [], // No cover image initially
        weeklyReminderSettings: [], // Default to no reminder settings
      },
      {
        onSuccess: () => {
          toast.success('Welcome to your journal! 🎉');
          onClose();
        },
        onError: () => {
          toast.error('Failed to create profile. Please try again.');
        }
      }
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md bg-white border-0 shadow-2xl rounded-xl"
      >
        <DialogHeader>
          <DialogTitle
            className="text-3xl font-bold text-center bg-gradient-to-r 
                       from-purple-600 to-blue-600 bg-clip-text text-transparent 
                       flex items-center justify-center gap-2 mb-2"
          >
            <Sparkles className="w-8 h-8 text-purple-500" />
            Welcome!
            <Sparkles className="w-8 h-8 text-blue-500" />
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 text-lg">
            Let's get you started with your journal journey
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Welcome illustration */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-blue-100 
                            rounded-full flex items-center justify-center mb-4 shadow-lg">
              <User className="w-10 h-10 text-purple-600" />
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-3">
            <Label htmlFor="name" className="text-lg font-semibold text-gray-700 block text-center">
              What should we call you? ✨
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name or nickname"
              className="border-2 border-purple-200 focus:border-purple-400 rounded-lg text-lg p-4 text-center"
              maxLength={50}
              autoFocus
            />
            <p className="text-xs text-gray-500 text-center">{name.length}/50 characters</p>
          </div>

          <div className="pt-4 space-y-3">
            <Button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 
                         hover:from-purple-600 hover:to-blue-600 text-white 
                         font-semibold shadow-lg py-4 text-lg rounded-lg"
            >
              {isSaving ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Getting ready...</span>
                </div>
              ) : (
                'Start My Journal! 🚀'
              )}
            </Button>
            
            <p className="text-sm text-gray-500 text-center">
              You can add a profile picture and bio later
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}