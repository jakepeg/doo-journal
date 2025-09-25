import { useGetJournalEntry, useGetPublicJournalEntryWithProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Calendar, Globe, Lock, Edit, Trash2, Share2, Sparkles } from 'lucide-react';
import { Principal } from '@dfinity/principal';
import { format } from 'date-fns';
import { useState } from 'react';
import JournalEntryModal from './JournalEntryModal';
import TopNavigation from './TopNavigation';
import Footer from './Footer';
import { useDeleteJournalEntry } from '../hooks/useQueries';
import { toast } from 'sonner';
import DooLogo from './DooLogo';

interface EntryDetailPageProps {
  userId: string;
  entryId: string;
}

export default function EntryDetailPage({ userId, entryId }: EntryDetailPageProps) {
  console.log('[DEBUG] EntryDetailPage: Component mounting', { userId, entryId });
  
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const [showEditModal, setShowEditModal] = useState(false);
  const { mutate: deleteEntry } = useDeleteJournalEntry();

  const userPrincipal = Principal.fromText(userId);
  const isOwnEntry = identity && identity.getPrincipal().toString() === userId;
  const isAuthenticated = !!identity;

  console.log('[DEBUG] EntryDetailPage: User context', {
    userPrincipal: userPrincipal.toString(),
    isOwnEntry,
    isAuthenticated,
    currentUser: identity?.getPrincipal().toString()
  });

  // Try to get the entry first (works for both public and private if authenticated)
  const { data: entry, isLoading: entryLoading, error: entryError } = useGetJournalEntry(userPrincipal, entryId);
  
  // If not authenticated or entry is not accessible, try to get public entry with profile
  const { data: publicEntryData, isLoading: publicLoading, error: publicError } = useGetPublicJournalEntryWithProfile(
    userPrincipal, 
    entryId
  );

  const isLoading = entryLoading || publicLoading;
  const finalEntry = entry || publicEntryData?.entry;
  const authorProfile = publicEntryData?.profile;

  const handleEdit = () => {
    console.log('[DEBUG] EntryDetailPage: Edit button clicked');
    setShowEditModal(true);
  };

  const handleDelete = () => {
    console.log('[DEBUG] EntryDetailPage: Delete button clicked');
    if (confirm('Are you sure you want to delete this journal entry?')) {
      deleteEntry(entryId, {
        onSuccess: () => {
          console.log('[DEBUG] EntryDetailPage: Entry deleted, navigating home');
          navigate({ to: '/' });
        },
      });
    }
  };

  const handleShare = () => {
    console.log('[DEBUG] EntryDetailPage: Share button clicked');
    const shareUrl = `${window.location.origin}/entry/${userId}/${entryId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Entry link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const handleStartJournal = () => {
    console.log('[DEBUG] EntryDetailPage: Start journal button clicked');
    // Clear URL parameters and go to landing page
    window.location.href = window.location.origin;
  };

  const handleBackToJournal = () => {
    console.log('[DEBUG] EntryDetailPage: Back to journal clicked');
    navigate({ to: '/' });
  };

  const formatEntryDate = (date: bigint) => {
    return new Date(Number(date) / 1000000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderContent = (content: string) => {
    // Simple markdown-like rendering
    let html = content
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic text
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Images
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4 shadow-md" crossorigin="anonymous" />')
      // Lists
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      // Quotes
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-purple-300 pl-4 italic text-gray-600 my-2">$1</blockquote>')
      // Line breaks
      .replace(/\n/g, '<br />');

    // Wrap list items in ul tags
    html = html.replace(/(<li>.*<\/li>)/s, '<ul class="list-disc list-inside space-y-1 my-4">$1</ul>');

    return html;
  };

  if (isLoading) {
    console.log('[DEBUG] EntryDetailPage: Showing loading state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 flex flex-col">
        {isAuthenticated ? (
          <TopNavigation />
        ) : (
          <header className="bg-white/80 backdrop-blur-sm border-b border-purple-200 sticky top-0 z-40">
            <div className="container mx-auto px-4 py-4 max-w-[1024px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DooLogo width={40} height={40} />
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Public Journal Entry
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
        )}
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading entry...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!finalEntry || (entryError && publicError)) {
    console.log('[DEBUG] EntryDetailPage: Entry not found', {
      finalEntry: !!finalEntry,
      entryError: entryError?.message,
      publicError: publicError?.message
    });
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 flex flex-col">
        {isAuthenticated ? (
          <TopNavigation />
        ) : (
          <header className="bg-white/80 backdrop-blur-sm border-b border-purple-200 sticky top-0 z-40">
            <div className="container mx-auto px-4 py-4 max-w-[1024px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DooLogo width={40} height={40} />
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Public Journal Entry
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
        )}
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] flex-1">
          <Card className="max-w-md mx-auto border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Entry Not Found</h2>
              <p className="text-gray-600 mb-6">
                This journal entry doesn't exist or is not publicly accessible.
              </p>
              <div className="space-y-3">
                {isAuthenticated ? (
                  <Button
                    onClick={handleBackToJournal}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                  </Button>
                ) : (
                  <Button
                    onClick={handleStartJournal}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Your Own Journal
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Check if user can view this entry
  if (!finalEntry.isPublic && !isOwnEntry) {
    console.log('[DEBUG] EntryDetailPage: Entry is private and user is not owner');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 flex flex-col">
        {isAuthenticated ? (
          <TopNavigation />
        ) : (
          <header className="bg-white/80 backdrop-blur-sm border-b border-purple-200 sticky top-0 z-40">
            <div className="container mx-auto px-4 py-4 max-w-[1024px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DooLogo width={40} height={40} />
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Public Journal Entry
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
        )}
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] flex-1">
          <Card className="max-w-md mx-auto border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Private Entry</h2>
              <p className="text-gray-600 mb-6">
                This journal entry is private and can only be viewed by its author.
              </p>
              <div className="space-y-3">
                {isAuthenticated ? (
                  <Button
                    onClick={handleBackToJournal}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                  </Button>
                ) : (
                  <Button
                    onClick={handleStartJournal}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Your Own Journal
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  console.log('[DEBUG] EntryDetailPage: Rendering entry detail', {
    entryTitle: finalEntry.title,
    isPublic: finalEntry.isPublic,
    hasAuthorProfile: !!authorProfile
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 flex flex-col">
      {isAuthenticated ? (
        <>
          <TopNavigation />
          {/* Back to Journal Button and Action Buttons - Below Navigation */}
          <div className="container mx-auto px-4 py-4 max-w-[1024px]">
            <div className="flex items-center justify-between">
              <Button
                onClick={handleBackToJournal}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-purple-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Journal
              </Button>
              
              <div className="flex items-center space-x-2">
                {finalEntry.isPublic && (
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    size="sm"
                    className="border-purple-200 hover:bg-purple-50"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                )}
                
                {isOwnEntry && (
                  <>
                    <Button
                      onClick={handleEdit}
                      variant="outline"
                      size="sm"
                      className="border-purple-200 hover:bg-purple-50"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      onClick={handleDelete}
                      variant="outline"
                      size="sm"
                      className="border-red-200 hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Public header for unauthenticated users */}
          <header className="bg-white/80 backdrop-blur-sm border-b border-purple-200 sticky top-0 z-40">
            <div className="container mx-auto px-4 py-4 max-w-[1024px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DooLogo width={40} height={40} />
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {authorProfile?.name ? `${authorProfile.name}'s Journal` : 'Public Journal Entry'}
                  </h1>
                </div>
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
            </div>
          </header>
        </>
      )}

      <main className={`container mx-auto px-4 pb-8 max-w-[1024px] flex-1 mb-8 ${!isAuthenticated ? 'mt-8' : ''}`}>
        <article>
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="space-y-4">
                {/* Title */}
                <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                  {finalEntry.title}
                </h1>
                
                {/* Metadata */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center space-x-4">
                    <Badge variant={finalEntry.isPublic ? "default" : "secondary"} className="text-sm">
                      {finalEntry.isPublic ? (
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
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{formatEntryDate(finalEntry.date)}</span>
                    </div>

                    {/* Show author info for public entries when not authenticated */}
                    {!isAuthenticated && authorProfile && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span>by {authorProfile.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="prose prose-lg max-w-none">
              <div 
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderContent(finalEntry.content) }}
              />
            </CardContent>
          </Card>
        </article>
      </main>

      {/* Edit Modal - only show for authenticated users */}
      {showEditModal && isAuthenticated && (
        <JournalEntryModal
          entry={finalEntry}
          onClose={() => setShowEditModal(false)}
        />
      )}

      <Footer />
    </div>
  );
}
