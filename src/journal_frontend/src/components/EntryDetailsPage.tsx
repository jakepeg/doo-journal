import { useGetJournalEntry, useGetPublicJournalEntryWithProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Calendar, Globe, Lock, Edit, Trash2, Share2, Sparkles } from 'lucide-react';
import { Principal } from '@dfinity/principal';
import { useState } from 'react';
import JournalEntryModal from './JournalEntryModal';
import { useDeleteJournalEntry } from '../hooks/useQueries';
import { toast } from 'sonner';

interface EntryDetailPageProps {
  userId: string;
  entryId: string;
}

export default function EntryDetailPage({ userId, entryId }: EntryDetailPageProps) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const [showEditModal, setShowEditModal] = useState(false);
  const { mutate: deleteEntry } = useDeleteJournalEntry();

  const userPrincipal = Principal.fromText(userId);
  const isOwnEntry = identity && identity.getPrincipal().toString() === userId;
  const isAuthenticated = !!identity;

  const { data: entry, isLoading: entryLoading, error: entryError } =
    useGetJournalEntry(userPrincipal, entryId);

  const { data: publicEntryData, isLoading: publicLoading, error: publicError } =
    useGetPublicJournalEntryWithProfile(userPrincipal, entryId);

  const isLoading = entryLoading || publicLoading;
  const finalEntry = entry || publicEntryData?.entry;
  const authorProfile = publicEntryData?.profile;

  const handleEdit = () => setShowEditModal(true);

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this journal entry?')) {
      deleteEntry(entryId, {
        onSuccess: () => navigate({ to: '/' }),
      });
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/entry/${userId}/${entryId}`;
    
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
        toast.success('Entry link copied to clipboard!');
        return;
      }
      
      // If fallback fails, try modern API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Entry link copied to clipboard!');
      } else {
        throw new Error('Clipboard not supported');
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Show the URL in a prompt for manual copying
      prompt('Copy this link:', shareUrl);
    }
  };

  const handleStartJournal = () => {
    window.location.href = window.location.origin;
  };

  const handleBackToJournal = () => {
    navigate({ to: '/' });
  };

  const formatEntryDate = (date: bigint) =>
    new Date(Number(date) / 1_000_000).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading entry...</p>
        </div>
      </div>
    );
  }

  if (!finalEntry || (entryError && publicError)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    );
  }

  if (!finalEntry.isPublic && !isOwnEntry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    );
  }

  return (
    <>
      {/* Back to Journal Button - Only for authenticated users */}
      {isAuthenticated && (
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
      )}

      <main className="container mx-auto px-4 pb-8 max-w-[1024px] flex-1 mb-8 mt-8">
        {/* Header for public viewers */}
        {!isAuthenticated && (
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-2xl font-bold text-gray-900 cursor-pointer hover:underline"
            onClick={() =>
              navigate({ to: '/?user=' + userId })
            }
          >
            {authorProfile?.name ? `${authorProfile.name}'s Shared Journal` : "Journal"}
          </h2>
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
            <Button
              onClick={handleStartJournal}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Start Your Own Journal
            </Button>
          </div>
        </div>
      )}

      <article>
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <h1 className="text-4xl font-bold text-gray-900 flex-1">{finalEntry.title}</h1>
                {isOwnEntry && (
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      onClick={handleEdit}
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-purple-600"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={handleDelete}
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                  <Badge variant={finalEntry.isPublic ? 'default' : 'secondary'} className="text-sm">
                    {finalEntry.isPublic ? (
                      <>
                        <Globe className="w-3 h-3 mr-1" /> Public
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 mr-1" /> Private
                      </>
                    )}
                  </Badge>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{formatEntryDate(finalEntry.date)}</span>
                  </div>
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
                  {!isAuthenticated && authorProfile && (
                    <div className="text-sm text-gray-600">by {authorProfile.name}</div>
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

      {showEditModal && isAuthenticated && (
        <JournalEntryModal entry={finalEntry} onClose={() => setShowEditModal(false)} />
      )}
    </main>
    </>
  );
}
