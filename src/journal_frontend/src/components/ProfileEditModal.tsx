import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useGetCallerUserProfile, useSaveUserProfile } from '../hooks/useQueries';
// import { useFileUpload, useFileUrl } from '../blob-storage/FileStorage';
// import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
// import { Camera, Upload, X } from 'lucide-react';
import { User } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileEditModalProps {
  onClose: () => void;
}

export default function ProfileEditModal({ onClose }: ProfileEditModalProps) {
  const { data: currentProfile } = useGetCallerUserProfile();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  // const [profilePicturePath, setProfilePicturePath] = useState<string>('');
  // const [coverImagePath, setCoverImagePath] = useState<string>('');
  
  const { mutate: saveProfile, isPending: isSaving } = useSaveUserProfile();
  // const { uploadFile, isUploading } = useFileUpload();
  
  // const { data: profilePictureUrl } = useFileUrl(profilePicturePath);
  // const { data: coverImageUrl } = useFileUrl(coverImagePath);

  useEffect(() => {
    if (currentProfile) {
      setName(currentProfile.name);
      setBio(currentProfile.bio);
      // setProfilePicturePath(currentProfile.profilePicture || '');
      // setCoverImagePath(currentProfile.coverImage || '');
    }
  }, [currentProfile]);

  // const handleProfilePictureUpload = async (...) => { ... }
  // const handleCoverImageUpload = async (...) => { ... }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

  saveProfile({
    name: name.trim(),
    bio: bio.trim(),
    profilePicture: [],
    coverImage: [],
  }, {
    onSuccess: onClose,
  });
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-50 to-blue-50 border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <User className="w-6 h-6 text-purple-500" />
            Edit Profile
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile picture upload commented out */}
          {/*
          <div className="text-center"> ... avatar + upload button ... </div>
          */}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
              Name ✨
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="border-2 border-purple-200 focus:border-purple-400 rounded-lg"
              maxLength={50}
            />
            <p className="text-xs text-gray-500">{name.length}/50 characters</p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-semibold text-gray-700">
              Bio 🌟
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="border-2 border-purple-200 focus:border-purple-400 rounded-lg min-h-[80px]"
              maxLength={200}
            />
            <p className="text-xs text-gray-500">{bio.length}/200 characters</p>
          </div>

          {/* Cover image upload commented out */}
          {/*
          <div className="space-y-2"> ... cover upload block ... </div>
          */}

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
              disabled={isSaving || !name.trim()}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold shadow-lg"
            >
              {isSaving ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
