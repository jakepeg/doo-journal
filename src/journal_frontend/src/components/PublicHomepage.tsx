import { useGetUserHomepage } from '../hooks/useQueries';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Globe, Sparkles, Share2 } from 'lucide-react';
import { Principal } from '@dfinity/principal';
import { useState } from 'react';
import { useActor } from '../hooks/useActor';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

interface PublicHomepageProps {
  user: Principal;
  onBackToLogin: () => void;
}

export default function PublicHomepage({ user, onBackToLogin }: PublicHomepageProps) {
  const { data: homepage, isLoading } = useGetUserHomepage(user);
  const [coverImageError, setCoverImageError] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const { actor } = useActor();
  const navigate = useNavigate();

  const renderContent = (content: string) => {
    let html = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4 shadow-md" crossorigin="anonymous" />')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-purple-300 pl-4 italic text-gray-600 my-2">$1</blockquote>')
      .replace(/\n/g, '<br />');

    html = html.replace(/(<li>.*<\/li>)/s, '<ul class="list-disc list-inside space-y-1 my-4">$1</ul>');
    return html;
  };

  const handleStartJournal = () => {
    window.location.href = window.location.origin;
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}?user=${user.toString()}`;
    
    try {
      // Try fallback method first (more reliable on IC)
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        toast.success('Profile link copied to clipboard!');
        return;
      }
      
      // If fallback fails, try modern API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Profile link copied to clipboard!');
      } else {
        throw new Error('Clipboard not supported');
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Show the URL in a prompt for manual copying
      prompt('Copy this link:', shareUrl);
    }
  };

  const handleEntryClick = (entryId: string) => {
    const userId = user.toString();
    navigate({ to: '/entry/$userId/$entryId', params: { userId, entryId } });
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1">
        <div className="container mx-auto px-4 py-4 max-w-[1024px] flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Shared Journal</h2>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="border-purple-200 hover:bg-purple-50"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              onClick={handleStartJournal}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Start Your Own Journal
            </Button>
          </div>
        </div>
        
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

      <div className="container mx-auto px-4 py-4 max-w-[1024px] flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {profile?.name ? `${profile.name}'s Shared Journal` : "Shared Journal"}
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleShare}
            variant="outline"
            size="sm"
            className="border-purple-200 hover:bg-purple-50"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button
            onClick={handleStartJournal}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Start Your Own Journal
          </Button>
        </div>
      </div>

      <main className="container mx-auto px-4 max-w-[1024px] flex-1 mb-8">
        {/* Profile Section */}
        {profile ? (
          <Card className="mt-8 mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="px-6 pt-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {profile.name}
                </h2>
                {profile.bio && (
                  <p className="text-gray-600 text-lg mb-4">{profile.bio}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{entries.length} shared entries</span>
                  <Badge variant="outline" className="text-xs">
                    <Globe className="w-3 h-3 mr-1" />
                    Shared Profile
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-8 mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-bold text-gray-700 mb-2">Anonymous Writer</h2>
              <p className="text-gray-600">This user hasn't set up their profile yet.</p>
            </CardContent>
          </Card>
        )}

        {/* Shared Journal Entries Section */}


        {entries.length === 0 ? (
          <Card className="border-2 border-dashed border-purple-200 bg-purple-50/50 mb-8">
            <CardContent className="p-12 text-center">
              <Globe className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-700 mb-2">No Shared Entries Yet</h4>
              <p className="text-gray-600 mb-6">
                This writer hasn't shared any journal entries yet. Check back later!
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
                <Card
                  key={entry.id}
                  className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all cursor-pointer group"
                  onClick={() => handleEntryClick(entry.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors mb-2">
                          {entry.title}
                        </CardTitle>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500">
                            {formatDate(entry.timestamp)}
                          </span>
                          <Badge variant="default" className="text-xs">
                            <Globe className="w-3 h-3 mr-1" />
                            Shared
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex gap-4">
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-gray-700 leading-relaxed line-clamp-3"
                          dangerouslySetInnerHTML={{ __html: renderContent(entry.content) }}
                        />
                        {entry.content.length > 200 && (
                          <p className="text-purple-600 text-sm mt-2 font-medium">
                            Click to read more...
                          </p>
                        )}
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
