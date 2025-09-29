import { useGetOwnHomepage, useDeleteJournalEntry } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Plus, Lock, Globe, Edit, Trash2, Share2 } from 'lucide-react';
import JournalEntryModal from './JournalEntryModal';
import ProfileEditModal from './ProfileEditModal';
import { useState, useEffect } from 'react';
import type { JournalEntry } from '../../../declarations/journal_backend/journal_backend.did';
import { toast } from 'sonner';

export default function Homepage() {
  console.log('[DEBUG] Homepage: Component mounting');
  
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: homepage, isLoading, error } = useGetOwnHomepage();
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const { mutate: deleteEntry } = useDeleteJournalEntry();

  const renderContent = (content: string) => {
  let html = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4 shadow-md" crossorigin="anonymous" />')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-purple-300 pl-4 italic text-gray-600 my-2">$1</blockquote>')
    .replace(/\n/g, '<br />');

  // Wrap list items in ul
  html = html.replace(/(<li>.*<\/li>)/s, '<ul class="list-disc list-inside space-y-1 my-4">$1</ul>');

  return html;
};

  useEffect(() => {
    console.log('[DEBUG] Homepage: State changed', {
      isLoading,
      hasHomepage: !!homepage,
      hasProfile: !!homepage?.profile,
      entriesCount: homepage?.entries?.length || 0,
      error: error?.message,
      identity: identity?.getPrincipal().toString()
    });
  }, [homepage, isLoading, error, identity]);

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setShowEntryModal(true);
  };

  const handleDeleteEntry = (entryId: string) => {
    if (confirm('Are you sure you want to delete this journal entry?')) {
      deleteEntry(entryId);
    }
  };

  const handleEntryClick = (entry: JournalEntry) => {
    if (!identity) return;
    const userId = identity.getPrincipal().toString();
    navigate({ to: '/entry/$userId/$entryId', params: { userId, entryId: entry.id } });
  };

  const handleNewEntry = () => {
    navigate({ to: '/add-entry' });
  };

  const handleShare = () => {
    if (!identity) return;
    const shareUrl = `${window.location.origin}?user=${identity.getPrincipal().toString()}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => toast.success('Profile link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link'));
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
            <div className="h-48 bg-gradient-to-r from-purple-400 to-blue-400 relative">
              <div className="absolute inset-0 bg-black/20"></div>
              <Button
                onClick={() => setShowProfileModal(true)}
                variant="outline"
                size="sm"
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm border-white/50 hover:bg-white text-gray-700 shadow-lg"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
            <div className="absolute left-6 -bottom-10">
              <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                <AvatarImage 
                  src={profile?.profilePicture && profile.profilePicture.length > 0 ? profile.profilePicture[0] : undefined}
                  alt={`${profile?.name || 'User'}'s profile picture`}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white text-2xl font-bold">
                  {profile?.name?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <CardContent className="px-6 pt-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {profile?.name || 'Anonymous Writer'}
            </h2>
            {profile?.bio && <p className="text-gray-600 text-lg mb-4">{profile.bio}</p>}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{entries.length} journal entries</span>
              <span>{entries.filter(e => e.isPublic).length} public</span>
              <span>{entries.filter(e => !e.isPublic).length} private</span>
            </div>
          </CardContent>
        </Card>

        {/* Journal Entries Section */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">My Journal Entries</h3>
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
          <div className="space-y-6 mb-8">
            {entries
              .sort((a, b) => Number(b.date) - Number(a.date))
              .map((entry) => (
                <Card 
                  key={entry.id}
                  className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all cursor-pointer group"
                  onClick={() => handleEntryClick(entry)}
                >
                  <CardHeader className="pb-3">
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
    </div>
  );
}
