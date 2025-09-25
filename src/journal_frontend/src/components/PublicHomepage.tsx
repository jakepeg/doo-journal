import { useGetUserHomepage } from '../hooks/useQueries';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback /*, AvatarImage */ } from './ui/avatar';
import { Badge } from './ui/badge';
import { Globe, Sparkles /*, Image as ImageIcon */ } from 'lucide-react';
// import { useFileUrl } from '../blob-storage/FileStorage';
import { Principal } from '@dfinity/principal';
import { useState } from 'react';
import { useActor } from '../hooks/useActor';
import DooLogo from './DooLogo';

interface PublicHomepageProps {
  user: Principal;
  onBackToLogin: () => void;
}

export default function PublicHomepage({ user, onBackToLogin }: PublicHomepageProps) {
  const { data: homepage, isLoading } = useGetUserHomepage(user);
  const [coverImageError, setCoverImageError] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const { actor } = useActor();
  
  // Commented for now
  // const { data: profilePictureUrl } = useFileUrl(homepage?.profile?.profilePicture || '');
  // const { data: coverImageUrl } = useFileUrl(homepage?.profile?.coverImage || '');

  const handleStartJournal = () => {
    window.location.href = window.location.origin;
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    const withoutImages = content.replace(/!\[.*?\]\(.*?\)/g, '');
    if (withoutImages.length <= maxLength) return withoutImages;
    return withoutImages.substring(0, maxLength) + '...';
  };

  // Commented for now
  // const extractFirstImageUrl = (content: string): string | null => {
  //   const imageMatch = content.match(/!\[.*?\]\((.*?)\)/);
  //   return imageMatch ? imageMatch[1] : null;
  // };

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1">
        <header className="bg-white/80 backdrop-blur-sm border-b border-purple-200 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4 max-w-[1024px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DooLogo width={40} height={40} />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Public Journal
                </h1>
              </div>
              <Button
                onClick={handleStartJournal}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start Your Own Journal
              </Button>
            </div>
          </div>
        </header>
        
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading journal...</p>
          </div>
        </div>
      </div>
    );
  }

  const profile = homepage?.profile;
  const entries = homepage?.publicEntries || [];

  return (
    <div className="flex flex-col flex-1">
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 max-w-[1024px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DooLogo width={40} height={40} />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {profile?.name ? `${profile.name}'s Journal` : 'Public Journal'}
              </h1>
            </div>
            <Button
              onClick={handleStartJournal}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Start Your Own Journal
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-[1024px] flex-1 mb-8">
        {/* Profile Section */}
        {profile ? (
          <Card className="mt-8 mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
            {/* Cover image block commented for now */}
            {/* <div className="relative"> ... cover img ... </div> */}
            
            <CardContent className="px-6 pt-12">
              <div className="ml-0">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {profile.name}
                </h2>
                {profile.bio && (
                  <p className="text-gray-600 text-lg mb-4">{profile.bio}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{entries.length} public entries</span>
                  <Badge variant="outline" className="text-xs">
                    <Globe className="w-3 h-3 mr-1" />
                    Public Profile
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-8 mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <DooLogo width={64} height={64} className="mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-700 mb-2">Anonymous Writer</h2>
              <p className="text-gray-600">This user hasn't set up their profile yet.</p>
            </CardContent>
          </Card>
        )}

        {/* Public Journal Entries Section */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Public Journal Entries</h3>
          <p className="text-gray-600">Sharing thoughts and adventures with the world ✨</p>
        </div>

        {entries.length === 0 ? (
          <Card className="border-2 border-dashed border-purple-200 bg-purple-50/50 mb-8">
            <CardContent className="p-12 text-center">
              <Globe className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-700 mb-2">No Public Entries Yet</h4>
              <p className="text-gray-600 mb-6">
                This writer hasn't shared any public journal entries yet. Check back later!
              </p>
              <Button
                onClick={handleStartJournal}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start Your Own Journal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 mb-8">
            {entries
              .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
              .map((entry) => (
                <Card key={entry.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                          {entry.title}
                        </CardTitle>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500">
                            {formatDate(entry.timestamp)}
                          </span>
                          <Badge variant="default" className="text-xs">
                            <Globe className="w-3 h-3 mr-1" />
                            Public
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex gap-4">
                      {/* Thumbnail commented out */}
                      {/* {firstImageUrl && <img src={firstImageUrl} ... />} */}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {truncateContent(entry.content)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </main>
    </div>
  );
}
