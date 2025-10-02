import { useGetOwnHomepage, useDeleteJournalEntry, type DecryptedJournalEntry } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Plus, Lock, Globe, Edit, Trash2, Share2 } from 'lucide-react';
import JournalEntryModal from './JournalEntryModal';
import ProfileEditModal from './ProfileEditModal';
import ProfileSetupModal from './ProfileSetupModal';
import EncryptionDebugPanel from './EncryptionDebugPanel';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function Homepage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: homepage, isLoading, error } = useGetOwnHomepage();
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfileSetupModal, setShowProfileSetupModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DecryptedJournalEntry | null>(null);
  const { mutate: deleteEntry } = useDeleteJournalEntry();

  const renderContent = (content: string) => {
  let html = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4 shadow-md max-h-[150px] object-contain" crossorigin="anonymous" />')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-purple-300 pl-4 italic text-gray-600 my-2">$1</blockquote>')
    .replace(/\n/g, '<br />');

  // Also handle direct HTML img tags from Quill editor - limit their height on homepage
  html = html.replace(/<img([^>]*?)style="([^"]*?)"([^>]*?)>/g, (match, beforeStyle, styleContent, afterStyle) => {
    // Add max-height to existing style, preserving original styling
    const newStyle = styleContent + '; max-height: 150px; object-fit: contain;';
    return `<img${beforeStyle}style="${newStyle}"${afterStyle} class="rounded-lg my-4 shadow-md">`;
  });

  // Handle HTML img tags without style attribute
  html = html.replace(/<img(?![^>]*style=)([^>]*?)>/g, '<img$1 style="max-height: 150px; object-fit: contain;" class="max-w-full h-auto rounded-lg my-4 shadow-md">');

  // Wrap list items in ul
  html = html.replace(/(<li>.*<\/li>)/s, '<ul class="list-disc list-inside space-y-1 my-4">$1</ul>');

  return html;
};

  useEffect(() => {
    // Check if user needs profile setup after homepage data is loaded
    if (!isLoading && homepage && !homepage.profile) {
      setShowProfileSetupModal(true);
    } else if (!isLoading && homepage && homepage.profile) {
      setShowProfileSetupModal(false);
    }
  }, [homepage, isLoading, error, identity]);

  const handleEditEntry = (entry: DecryptedJournalEntry) => {
    setEditingEntry(entry);
    setShowEntryModal(true);
  };

  const handleDeleteEntry = (entryId: string) => {
    if (confirm('Are you sure you want to delete this journal entry?')) {
      deleteEntry(entryId);
    }
  };

  const handleEntryClick = (entry: DecryptedJournalEntry) => {
    if (!identity) return;
    const userId = identity.getPrincipal().toString();
    navigate({ to: '/entry/$userId/$entryId', params: { userId, entryId: entry.id } });
  };

  const handleNewEntry = () => {
    navigate({ to: '/add-entry' });
  };

  const handleShare = async () => {
    if (!identity) return;
    
    const shareUrl = `${window.location.origin}?user=${identity.getPrincipal().toString()}`;
    
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

  const formatEntryDate = (date: bigint) =>
    new Date(Number(date) / 1_000_000).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

  const truncateContent = (content: string, maxLength = 200) =>
    content.length <= maxLength ? content : content.substring(0, maxLength) + '...';

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your journal...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading your journal: {error.message}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  const profile = homepage?.profile;
  const entries = homepage?.entries || [];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 max-w-[1024px] flex-1 pb-8">
        {/* Profile Section */}
        <Card className="pt-0 mt-8 mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
          <div className="relative">
            <div className="h-48 bg-gradient-to-r from-purple-400 to-blue-400 relative overflow-hidden">
              {profile?.coverImage && profile.coverImage.length > 0 ? (
                <img 
                  src={profile.coverImage[0]} 
                  alt="Cover image"
                  className="w-full h-full object-cover"
                />
              ) : null}
              <Button
                onClick={() => setShowProfileModal(true)}
                variant="outline"
                size="sm"
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm border-white/50 hover:bg-white text-gray-700 shadow-lg"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
            <div className="absolute left-6 -bottom-12">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarImage 
                  src={profile?.profilePicture && profile.profilePicture.length > 0 ? profile.profilePicture[0] : undefined}
                  alt={`${profile?.name || 'User'}'s profile picture`}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white text-3xl font-bold">
                  {profile?.name?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <CardContent className="px-6 pt-6">
            <h2 className="text-3xl text-gray-900 mt-1 mb-1">
              {profile?.name || 'Anonymous Writer'}
            </h2>
            {profile?.bio && <p className="text-gray-600 text-lg mb-2">{profile.bio}</p>}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{entries.length} journal entries</span>
              <span>{entries.filter(e => e.isPublic).length} public</span>
              <span>{entries.filter(e => !e.isPublic).length} private</span>
            </div>
          </CardContent>
        </Card>

        {/* Journal Entries Section */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl text-gray-900">My Journal Entries</h3>
          <div className="flex space-x-2">
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
              onClick={handleNewEntry}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg"
            >
              {/* <Plus className="w-4 h-4 mr-2" /> */}
              New
            </Button>
          </div>
        </div>

        {entries.length === 0 ? (
          <Card className="border-2 border-dashed border-purple-200 bg-purple-50/50 mb-8">
            <CardContent className="p-12 text-center">
              <h4 className="text-xl font-semibold text-gray-700 mb-2">Start Your Journey!</h4>
              <p className="text-gray-600 mb-6">
                Your journal is empty. Write your first entry and begin capturing your amazing adventures!
              </p>
              <Button 
                onClick={handleNewEntry}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-7 text-xl rounded-full shadow-md transition transform hover:scale-105 active:scale-95 mx-auto flex items-center gap-2"
              >
                💖  Write First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-6 mb-8">
              {entries
                .sort((a, b) => Number(b.date) - Number(a.date))
                .map((entry) => (
                <Card 
                  key={entry.id}
                  className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all cursor-pointer group gap-0"
                  onClick={() => handleEntryClick(entry)}
                >
                  <CardHeader className="pb-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors mb-2">
                          {entry.title}
                        </CardTitle>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500">
                            {formatEntryDate(entry.date)}
                          </span>
                          <Badge variant={entry.isPublic ? "default" : "secondary"} className="text-xs">
                            {entry.isPublic ? (
                              <>
                                <Globe className="w-3 h-3 mr-1" />
                                Public
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 mr-1" />
                                Private
                                {entry.content === '[Decryption failed]' && (
                                  <span className="ml-1 text-red-500" title="Decryption failed">⚠️</span>
                                )}
                                {entry.content !== '[Decryption failed]' && entry._originalContent && (
                                  <span className="ml-1 text-green-500" title="Successfully decrypted">🔓</span>
                                )}
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEntry(entry);
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-purple-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEntry(entry.id);
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
<CardContent className="pt-1">
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
            
            {/* Add debug panel in development */}
            {import.meta.env.DEV && <EncryptionDebugPanel />}
          </>
        )}
      </div>

      {/* Modals */}
      {showEntryModal && (
        <JournalEntryModal
          entry={editingEntry}
          onClose={() => {
            setShowEntryModal(false);
            setEditingEntry(null);
          }}
        />
      )}

      {showProfileModal && (
        <ProfileEditModal
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {showProfileSetupModal && (
        <ProfileSetupModal
          onClose={() => setShowProfileSetupModal(false)}
        />
      )}
    </div>
  );
}