import { useGetOwnHomepage, useDeleteJournalEntry, type DecryptedJournalEntry } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { useVetKeys } from '../hooks/useVetKeys';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Plus, Lock, Globe, Edit, Trash2, Share2, User } from 'lucide-react';
import { useState, useEffect, useMemo, lazy, Suspense, memo } from 'react';
// TODO: PDF Export feature temporarily disabled due to HTML/base64 parsing complexity
// The feature works but has issues with multiline base64 image data causing PDF content to cut off
// Need to revisit with a different approach (server-side processing or better HTML parser)
// import { PDFExportButton } from './PDFExportButton';

// Memoized entry preview to prevent layout shifts from text processing
const EntryPreview = memo(({ entry, buildPreview }: { 
  entry: DecryptedJournalEntry; 
  buildPreview: (content: string, maxLen?: number) => { text: string; truncated: boolean }; 
}) => {
  const preview = useMemo(() => buildPreview(entry.content), [entry.content, buildPreview]);
  
  return (
    <>
      <p className="text-gray-700 leading-relaxed line-clamp-3 whitespace-pre-wrap break-words min-h-[72px]">
        {preview.text}
      </p>
      <p className="text-purple-600 text-sm mt-2 font-medium">Click to read more...</p>
    </>
  );
});

// Lazy-loaded heavy components to reduce initial bundle size
const JournalEntryModal = lazy(() => import('./JournalEntryModal'));
const ProfileEditModal = lazy(() => import('./ProfileEditModal'));
const WelcomeModal = lazy(() => import('./WelcomeModal'));
const EncryptionDebugPanel = lazy(() => import('./EncryptionDebugPanel'));
import { toast } from 'sonner';
import { LayoutShiftDebugger } from './LayoutShiftDebugger';

export default function Homepage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: homepage, isLoading, error } = useGetOwnHomepage();
  const { actor } = useActor();
  const { decryptContent } = useVetKeys();
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DecryptedJournalEntry | null>(null);
  const { mutate: deleteEntry } = useDeleteJournalEntry();

  // Text-only preview generator for list (images stripped intentionally)
  const buildPreview = useMemo(() => {
    const IMG_MD = /!\[[^\]]*\]\([^)]*\)/g; // markdown images
    const IMG_HTML_FULL = /<img\b[^>]*>/gi; // complete img tags
    const IMG_HTML_PARTIAL = /<img\b[^<>{]{0,200}$/gi; // truncated img at string end
    const BASE64_SNIPPET = /data:image\/(?:png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=]+/gi;
    const SCRIPT_STYLE = /<\/(?:script|style)>|<(?:script|style)[^>]*>.*?<\/(?:script|style)>/gis;
    const BLOCK_BREAK = /<(?:\/p|br\s*\/|br|\/div|\/li|\/h[1-6]|\/blockquote)>/gi;
    const HTML_TAGS = /<[^>]+>/g;
    const ENTITIES: Record<string,string> = { '&nbsp;':' ', '&amp;':'&', '&lt;':'<', '&gt;':'>', '&quot;':'"', '&#39;':'\'' };
    const entityRegex = /&(nbsp|amp|lt|gt|quot|#39);/gi;
    return (raw: string, maxLen = 220) : { text: string; truncated: boolean } => {
      if (!raw) return { text: '', truncated: false };
      const largeMarker = raw.startsWith('LARGE_CONTENT:');
      if (largeMarker) {
        return { text: '[Large entry – open to view full content]', truncated: true };
      }

      // NEW: If content is percent-encoded (e.g. "%3Cp%3E") but not yet decoded, attempt a safe decode once
      if (/%[0-9A-Fa-f]{2}/.test(raw)) {
        try {
          const decodedOnce = decodeURIComponent(raw);
          // Only use decoded version if it's different and seems to contain HTML
          if (decodedOnce !== raw && (decodedOnce.includes('<') || decodedOnce.includes('&'))) {
            raw = decodedOnce;
          }
        } catch {/* ignore decode errors */}
      }

      const originalLength = raw.length;
      let working = originalLength > 30_000 ? raw.slice(0, 30_000) : raw;
      const hadLargeToken = /LARGE_CONTENT:[A-Za-z0-9+/=\-%]+/.test(working);
      working = working.replace(/LARGE_CONTENT:[A-Za-z0-9+/=\-%]+/g, ' ');
      const hadImages = IMG_MD.test(working) || IMG_HTML_FULL.test(working) || BASE64_SNIPPET.test(working);
      // Reset lastIndex for global regex re-use side-effects
      IMG_MD.lastIndex = 0; IMG_HTML_FULL.lastIndex = 0; BASE64_SNIPPET.lastIndex = 0;
      // Normalize structural breaks
      working = working.replace(BLOCK_BREAK, '\n');
      // Strip images
      working = working.replace(IMG_MD, ' ')
                       .replace(IMG_HTML_FULL, ' ')
                       .replace(IMG_HTML_PARTIAL, ' ')
                       .replace(BASE64_SNIPPET, ' ');
      // Remove scripts/styles
      working = working.replace(SCRIPT_STYLE, ' ');
      // Entities
      working = working.replace(entityRegex, (m) => ENTITIES[m.toLowerCase()] || ' ');
      // Markdown emphasis
      working = working.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
      // Tags
      working = working.replace(HTML_TAGS, ' ');
      working = working.replace(/<img\s+src="?/gi, ' ').replace(/!\s+/g, ' ');
      working = working.replace(/\r/g, '');
      working = working.split('\n').map(seg => seg.replace(/\s+/g, ' ').trim()).join('\n').trim();
      working = working.replace(/\n{3,}/g, '\n\n');
      const wasCutByLength = working.length > maxLen;
      if (wasCutByLength) {
        working = working.slice(0, maxLen).trimEnd() + '…';
      }
      const truncated = wasCutByLength || originalLength > maxLen || hadImages || hadLargeToken;
      return { text: working, truncated };
    };
  }, []);

  useEffect(() => {
    // Check if user needs profile setup after homepage data is loaded
    if (!isLoading && homepage && !homepage.profile) {
      setShowWelcomeModal(true);
    } else if (!isLoading && homepage && homepage.profile) {
      setShowWelcomeModal(false);
    }
  }, [homepage, isLoading, error, identity]);

  const handleEditEntry = async (entry: DecryptedJournalEntry) => {
    // Always refetch the single entry to avoid editing a truncated/sanitized homepage version
    try {
      if (!identity || !actor) {
        setEditingEntry(entry); // fallback
        setShowEntryModal(true);
        return;
      }
      const userId = identity.getPrincipal();
      const result = await actor.getJournalEntryById(userId, entry.id);
      const fresh = (result as any)[0]; // unwrapOpt manual (since did file may encode optional as variant)
      if (!fresh) {
        setEditingEntry(entry);
        setShowEntryModal(true);
        return;
      }
      let decrypted = '';
      try {
        decrypted = await decryptContent(fresh.content);
      } catch {
        decrypted = entry.content; // fallback
      }
      const fullEntry: DecryptedJournalEntry = {
        ...entry,
        content: decrypted,

      };
      setEditingEntry(fullEntry);
    } catch (e) {
      console.error('[Homepage] Failed to load full entry before edit:', e);
      setEditingEntry(entry);
    } finally {
      setShowEntryModal(true);
    }
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
        <div className="container mx-auto px-4 max-w-[1024px] flex-1 pb-8 min-h-[600px]">
          {/* Profile Section Skeleton */}
          <Card className="pt-0 mt-8 mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <div className="relative">
              <div className="h-48 bg-gradient-to-r from-purple-400 to-blue-400 relative overflow-hidden">
                <div className="absolute left-6 -bottom-12">
                  <div className="w-24 h-24 border-4 border-white shadow-lg rounded-full bg-gray-200 animate-pulse"></div>
                </div>
              </div>
            </div>
            <CardContent className="px-6 pt-6">
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2 w-48"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-4 w-64"></div>
              <div className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
              </div>
            </CardContent>
          </Card>

          {/* Entries Section Skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-48"></div>
            <div className="flex space-x-2">
              <div className="h-9 bg-gray-200 rounded animate-pulse w-20"></div>
              <div className="h-9 bg-gray-200 rounded animate-pulse min-w-[80px]"></div>
            </div>
          </div>

          <div className="space-y-6 mb-8 min-h-[200px]">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-1">
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                </CardHeader>
                <CardContent className="pt-1 min-h-[120px]">
                  <div className="min-h-[72px] space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mt-2"></div>
                </CardContent>
              </Card>
            ))}
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
      <div className="container mx-auto px-4 max-w-[1024px] flex-1 pb-8 min-h-[600px]">
        {/* Profile Section */}
        <Card className="pt-0 mt-8 mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
          <div className="relative">
            <div className="h-48 bg-gradient-to-r from-purple-400 to-blue-400 relative overflow-hidden">
              {profile?.coverImage && profile.coverImage.length > 0 ? (
                <img 
                  src={profile.coverImage[0]} 
                  alt="Cover image"
                  className="w-full h-full object-cover"
                  width="1024"
                  height="192"
                  loading="lazy"
                  decoding="async"
                  style={{ contentVisibility: 'auto' }}
                />
              ) : null}
              <Button
                onClick={() => setShowProfileModal(true)}
                variant="outline"
                size="sm"
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm border-white/50 hover:bg-white text-gray-700 shadow-lg"
              >
                <Edit className="w-4 h-4" />
                {profile && (!profile.bio || !profile.profilePicture || profile.profilePicture.length === 0) && (
                  <span className="ml-2">Complete Your Profile</span>
                )}
              </Button>
            </div>
            <div className="absolute left-6 -bottom-12">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarImage 
                  src={profile?.profilePicture && profile.profilePicture.length > 0 ? profile.profilePicture[0] : undefined}
                  alt={`${profile?.name || 'User'}'s profile picture`}
                  className="object-cover"
                  width="96"
                  height="96"
                  loading="lazy"
                  decoding="async"
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white text-3xl font-bold">
                  {profile?.name?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>



          
          <CardContent className="px-6 pt-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-3xl text-gray-900 mt-1 mb-1">
                  {profile?.name || 'Anonymous Writer'}
                </h2>
                {profile?.bio && <p className="text-gray-600 mb-2">{profile.bio}</p>}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{entries.length} journal entries</span>
                  <span>{entries.filter(e => e.isPublic).length} public</span>
                  <span>{entries.filter(e => !e.isPublic).length} private</span>
                </div>
              </div>

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
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg min-w-[80px] h-9"
            >
              {/* <Plus className="w-4 h-4 mr-2" /> */}
              New
            </Button>
          </div>
        </div>

        {entries.length === 0 ? (
          <Card className="border-2 border-dashed border-purple-200 bg-purple-50/50 mb-8 min-h-[300px]">
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
            <div className="space-y-6 mb-8 min-h-[200px]">
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
                        <CardTitle className="text-3xl text-gray-900 mt-1 mb-1 font-normal group-hover:text-purple-600 transition-colors">
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
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                        {/* PDF Export temporarily disabled - see comment at top of file */}
                        {/* <div onClick={(e) => e.stopPropagation()}>
                          <PDFExportButton
                            entry={entry}
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-blue-600"
                          />
                        </div> */}
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
                <CardContent className="pt-1 min-h-[120px]">
                  <div className="flex gap-4">
                    <div className="flex-1 min-w-0">
                      <EntryPreview entry={entry} buildPreview={buildPreview} />
                    </div>
                  </div>
                </CardContent>                </Card>
              ))}
            </div>
            
            {/* Add debug panel in development */}
            {import.meta.env.DEV && (
              <Suspense fallback={null}>
                <EncryptionDebugPanel />
              </Suspense>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showEntryModal && (
        <Suspense fallback={null}>
          <JournalEntryModal
            entry={editingEntry}
            onClose={() => {
              setShowEntryModal(false);
              setEditingEntry(null);
            }}
          />
        </Suspense>
      )}

      {showProfileModal && (
        <Suspense fallback={null}>
          <ProfileEditModal
            onClose={() => setShowProfileModal(false)}
          />
        </Suspense>
      )}

      {showWelcomeModal && (
        <Suspense fallback={null}>
          <WelcomeModal
            onClose={() => setShowWelcomeModal(false)}
          />
        </Suspense>
      )}
      
      {/* Debug layout shifts in development - disabled during onboarding work */}
      {false && import.meta.env.DEV && <LayoutShiftDebugger />}
    </div>
  );
}