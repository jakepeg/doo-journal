import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useSaveUserProfile } from '../hooks/useQueries';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Camera, Upload, X, User, Sparkles, Image } from 'lucide-react';
import { toast } from 'sonner';
import { compressImage } from '../utils/imageCompression';

interface ProfileSetupModalProps {
  onClose: () => void;
}

export default function ProfileSetupModal({ onClose }: ProfileSetupModalProps) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');
  
  const { mutate: saveProfile, isPending: isSaving } = useSaveUserProfile();

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be smaller than 5MB');
        return;
      }

      setProfilePicture(file);
      
      try {
        // Compress image for better performance (profile pics: 400x400, quality 0.85)
        const compressedDataUrl = await compressImage(file, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.85,
          format: 'image/jpeg'
        });
        setProfilePicturePreview(compressedDataUrl);
      } catch (error) {
        console.error('Image compression failed, using original:', error);
        // Fallback to original method
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfilePicturePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
    setProfilePicturePreview('');
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 10MB for cover images)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Cover image must be smaller than 10MB');
        return;
      }

      setCoverImage(file);
      
      try {
        // Compress cover image (1200x600, quality 0.8)
        const compressedDataUrl = await compressImage(file, {
          maxWidth: 1200,
          maxHeight: 600,
          quality: 0.8,
          format: 'image/jpeg'
        });
        setCoverImagePreview(compressedDataUrl);
      } catch (error) {
        console.error('Image compression failed, using original:', error);
        // Fallback to original method
        const reader = new FileReader();
        reader.onload = (e) => {
          setCoverImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverImagePreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    let profilePictureData: [] | [string] = [];
    let coverImageData: [] | [string] = [];
    
    // Use compressed image data from previews
    if (profilePicture && profilePicturePreview) {
      profilePictureData = [profilePicturePreview];
    }

    if (coverImage && coverImagePreview) {
      coverImageData = [coverImagePreview];
    }

    saveProfile(
      {
        name: name.trim(),
        bio: bio.trim(),
        profilePicture: profilePictureData,
        coverImage: coverImageData,
        weeklyReminderSettings: [], // Default to no reminder settings in setup
      },
      {
        onSuccess: onClose,
      }
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md bg-white  
                   border-0 shadow-2xl max-h-[90vh] overflow-y-auto rounded-xl"
      >
        <DialogHeader>
          <DialogTitle
            className="text-2xl font-bold text-center bg-gradient-to-r 
                       from-purple-600 to-blue-600 bg-clip-text text-transparent 
                       flex items-center justify-center gap-2"
          >
            <Sparkles className="w-6 h-6 text-purple-500" />
            Create Your Profile
            <Sparkles className="w-6 h-6 text-blue-500" />
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Set up your profile to get started with your journal
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Upload */}
          <div className="text-center">
            <div className="relative inline-block">
              <Avatar className="w-24 h-24 border-4 border-purple-200 shadow-lg">
                <AvatarImage 
                  src={profilePicturePreview} 
                  alt="Profile picture"
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 text-purple-600 text-xl font-bold">
                  {name ? name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
                </AvatarFallback>
              </Avatar>
              
              <input
                type="file"
                id="profile-picture"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (profilePicturePreview) {
                    removeProfilePicture();
                  } else {
                    document.getElementById('profile-picture')?.click();
                  }
                }}
                className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0 bg-white hover:bg-gray-50 border-gray-300 shadow-lg"
              >
                <Camera className="w-4 h-4 text-gray-600" />
              </Button>
            </div>
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold text-gray-700">
              Cover Image 🖼️
            </Label>
            
            {/* Cover Image Preview */}
            <div className="relative w-full h-32 bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-200 rounded-lg overflow-hidden">
              {coverImagePreview ? (
                <>
                  <img 
                    src={coverImagePreview} 
                    alt="Cover image preview"
                    className="w-full h-full object-cover"
                  />
                  <input
                    type="file"
                    id="cover-image"
                    accept="image/*"
                    onChange={handleCoverImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (coverImagePreview) {
                        removeCoverImage();
                      } else {
                        document.getElementById('cover-image')?.click();
                      }
                    }}
                    className="absolute top-2 right-2 rounded-full w-8 h-8 p-0 bg-white hover:bg-gray-50 border-gray-300 shadow-lg"
                  >
                    <Camera className="w-4 h-4 text-gray-600" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <Image className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No cover image</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    id="cover-image"
                    accept="image/*"
                    onChange={handleCoverImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('cover-image')?.click()}
                    className="absolute top-2 right-2 rounded-full w-8 h-8 p-0 bg-white hover:bg-gray-50 border-gray-300 shadow-lg"
                  >
                    <Camera className="w-4 h-4 text-gray-600" />
                  </Button>
                </>
              )}
            </div>
            
            <p className="text-xs text-gray-500 text-center">Max 10MB • JPG, PNG, GIF • Recommended: 800x200px</p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
              What's your name? ✨
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your first name or nickname"
              className="border-2 border-purple-200 focus:border-purple-400 rounded-lg"
              maxLength={50}
            />
            <p className="text-xs text-gray-500">{name.length}/50 characters</p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-semibold text-gray-700">
              Tell us about yourself! 🌟
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="I love to write about adventures, dreams, and magical moments..."
              className="border-2 border-purple-200 focus:border-purple-400 rounded-lg min-h-[80px]"
              maxLength={200}
            />
            <p className="text-xs text-gray-500">{bio.length}/200 characters</p>
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
              disabled={isSaving || !name.trim()}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 
                         hover:from-purple-600 hover:to-blue-600 text-white 
                         font-semibold shadow-lg"
            >
              {isSaving ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating your profile...</span>
                </div>
              ) : (
                'Create My Profile! 🚀'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
