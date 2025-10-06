import { useGetUserHomepage } from '../hooks/useQueries';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Globe, Sparkles, Share2 } from 'lucide-react';
import { Principal } from '@dfinity/principal';
import { useState, useMemo, useCallback } from 'react';
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

  // Decode large content for public entries (no encryption, just base64 + percent encoding)
  const decodeLargeContent = useCallback((encoded: string): string => {
    try {
      let base = encoded.trim();
      if (!base) return '';
      
      // If percent-encoded (contains %XX sequences), decode once to restore raw base64
      if (/%[0-9A-Fa-f]{2}/.test(base)) {
        try { base = decodeURIComponent(base); } catch {}
      }
      
      // Convert URL-safe variants
      base = base.replace(/-/g, '+').replace(/_/g, '/');
      // Strip anything not base64 set
      base = base.replace(/[^A-Za-z0-9+/=]/g, '');
      // Fix padding (length must be multiple of 4)
      if (base.length % 4 !== 0) {
        base = base.padEnd(base.length + (4 - (base.length % 4)), '=');
      }
      
      const bin = atob(base);
      // Try URI component decode (content was encoded with encodeURIComponent)
      try {
        return decodeURIComponent(bin);
      } catch {
        return bin; // return raw if not URI encoded
      }
    } catch (e) {
      console.error('Failed to decode large content:', e);
      return '[Content could not be decoded]';
    }
  }, []);

  // Text-only preview generator for list (images stripped intentionally)
  // Same logic as private Homepage for consistency
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
        // Decode the large content instead of showing placeholder
        const encoded = raw.replace('LARGE_CONTENT:', '');
        const decoded = decodeLargeContent(encoded);
        raw = decoded;
      }

      // If content is percent-encoded (e.g. "%3Cp%3E") but not yet decoded, attempt a safe decode once
      if (!raw.includes('<') && /%3C/i.test(raw)) {
        try {
          const decodedOnce = decodeURIComponent(raw);
          if (decodedOnce.includes('<')) {
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
      const truncated = wasCutByLength || originalLength > maxLen || hadImages || largeMarker;
      return { text: working, truncated };
    };
  }, [decodeLargeContent]);

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
                <div className="absolute inset-0 bg-black/20"></div>
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
                {profile.name}
              </h2>
              {profile.bio && (
                <p className="text-gray-600 mb-4">{profile.bio}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{entries.length} shared entries</span>
                <Badge variant="outline" className="text-xs">
                  <Globe className="w-3 h-3 mr-1" />
                  Shared Profile
                </Badge>
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
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl text-gray-900">Shared Journal Entries</h3>
        </div>

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
                  className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all cursor-pointer group gap-0"
                  onClick={() => handleEntryClick(entry.id)}
                >
                  <CardHeader className="pb-1">
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
                  <CardContent className="pt-1">
                    <div className="flex gap-4">
                      <div className="flex-1 min-w-0">
                        {(() => {
                          const preview = buildPreview(entry.content);
                          return (
                            <>
                              <p className="text-gray-700 leading-relaxed line-clamp-3 whitespace-pre-wrap break-words">
                                {preview.text}
                              </p>
                              <p className="text-purple-600 text-sm mt-2 font-medium">Click to read more...</p>
                            </>
                          );
                        })()}
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
