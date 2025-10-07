/**
 * Homepage CLS Fixes - Apply these changes after reverting Homepage.tsx
 */

// 1. Fix Avatar Loading Shift
// Replace your Avatar component with this:
/*
<div className="absolute left-6 -bottom-12" data-avatar-container>
  <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
    <AvatarImage 
      src={profile?.profilePicture && profile.profilePicture.length > 0 ? profile.profilePicture[0] : undefined}
      alt={`${profile?.name || 'User'}'s profile picture`}
      className="object-cover w-full h-full"
      width="96"
      height="96"
      loading="eager"
      decoding="sync"
      style={{ aspectRatio: '1' }}
    />
    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white text-3xl font-bold w-full h-full flex items-center justify-center">
      {profile?.name?.charAt(0).toUpperCase() || '?'}
    </AvatarFallback>
  </Avatar>
</div>
*/

// 2. Fix Cover Image Loading Shift
// Replace your cover image with this:
/*
<div className="h-48 bg-gradient-to-r from-purple-400 to-blue-400 relative overflow-hidden">
  {profile?.coverImage && profile.coverImage.length > 0 ? (
    <img 
      src={profile.coverImage[0]} 
      alt="Cover image"
      className="w-full h-48 object-cover"
      width="1024"
      height="192"
      loading="eager"
      decoding="sync"
      style={{ aspectRatio: '16/3' }}
    />
  ) : null}
  // ... rest of your cover image content
</div>
*/

// 3. Fix Profile Content Area Layout Shifts
// Wrap your profile content with reserved space:
/*
<CardContent className="px-6 pt-6">
  <div className="min-h-[120px]">
    <h2 className="text-3xl text-gray-900 mt-1 mb-1 min-h-[42px] flex items-end">
      {profile?.name || 'Anonymous Writer'}
    </h2>
    <div className="min-h-[24px] mb-2">
      {profile?.bio && <p className="text-gray-600">{profile.bio}</p>}
    </div>
    <div className="flex items-center space-x-4 text-sm text-gray-500 min-h-[20px]">
      <span>{entries.length} journal entries</span>
      <span>{entries.filter(e => e.isPublic).length} public</span>
      <span>{entries.filter(e => !e.isPublic).length} private</span>
    </div>
  </div>
</CardContent>
*/

// 4. Fix Entry Cards Layout Shifts
// Add min-height to entry cards:
/*
<Card 
  key={entry.id}
  className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all cursor-pointer group gap-0 min-h-[180px]"
  onClick={() => handleEntryClick(entry)}
>
*/

// 5. Fix Loading States
// Replace loading state with consistent height:
/*
{isLoading ? (
  <div className="min-h-[400px] mb-8 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading your journal...</p>
    </div>
  </div>
) : (
  // ... your content
)}
*/

export const clsFixes = {
  avatar: {
    width: 96,
    height: 96,
    loading: "eager" as const,
    decoding: "sync" as const,
    aspectRatio: "1"
  },
  coverImage: {
    width: 1024,
    height: 192,
    loading: "eager" as const,
    decoding: "sync" as const,
    aspectRatio: "16/3"
  },
  minHeights: {
    profileContent: "120px",
    profileTitle: "42px",
    profileBio: "24px",
    profileStats: "20px",
    entryCard: "180px",
    loadingArea: "400px"
  }
};