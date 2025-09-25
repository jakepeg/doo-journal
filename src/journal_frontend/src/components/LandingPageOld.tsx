import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useEffect, useState } from 'react';
import { Principal } from '@dfinity/principal';
import LoginScreen from './LoginScreen';
import Homepage from './Homepage';
import PublicHomepage from './PublicHomepage';
import ProfileSetupModal from './ProfileSetupModal';

export default function LandingPage() {
  console.log('[DEBUG] LandingPage: Component mounting');
  
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const [viewingUser, setViewingUser] = useState<Principal | null>(null);
  const [appInitialized, setAppInitialized] = useState(false);

  const isAuthenticated = !!identity;

  // Initialize app and check URL parameters
  useEffect(() => {
    console.log('[DEBUG] LandingPage: Initializing and checking URL parameters');
    
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const userParam = urlParams.get('user');
      
      console.log('[DEBUG] LandingPage: URL analysis', {
        userParam,
        search: window.location.search,
        fullUrl: window.location.href
      });
      
      if (userParam) {
        console.log('[DEBUG] LandingPage: Processing user parameter', userParam);
        try {
          const principal = Principal.fromText(userParam);
          console.log('[DEBUG] LandingPage: Valid principal parsed', principal.toString());
          setViewingUser(principal);
        } catch (error) {
          console.error('[DEBUG] LandingPage: Invalid user principal in URL:', error);
          // Clear invalid parameter
          window.history.replaceState({}, document.title, window.location.pathname);
          setViewingUser(null);
        }
      } else {
        console.log('[DEBUG] LandingPage: No user parameter, normal mode');
        setViewingUser(null);
      }
      
      setAppInitialized(true);
      console.log('[DEBUG] LandingPage: App initialization complete');
    } catch (error) {
      console.error('[DEBUG] LandingPage: Error during app initialization:', error);
      setAppInitialized(true); // Still set to true to prevent infinite loading
    }
  }, []);

  // Show loading screen during initialization
  if (isInitializing || !appInitialized) {
    console.log('[DEBUG] LandingPage: Showing initialization loading screen');
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your journal...</p>
        </div>
      </div>
    );
  }

  // Show public homepage if viewing another user
  if (viewingUser) {
    console.log('[DEBUG] LandingPage: Rendering public homepage for user', viewingUser.toString());
    return (
      <PublicHomepage 
        user={viewingUser} 
        onBackToLogin={() => {
          console.log('[DEBUG] LandingPage: Back to login from public homepage');
          setViewingUser(null);
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        }} 
      />
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    console.log('[DEBUG] LandingPage: Rendering login screen');
    return <LoginScreen />;
  }

  // For authenticated users, determine if we need profile setup
  const needsProfileSetup = isAuthenticated && profileFetched && userProfile === null;
  const showProfileLoading = isAuthenticated && profileLoading && !profileFetched;

  console.log('[DEBUG] LandingPage: Authenticated user state', {
    needsProfileSetup,
    showProfileLoading,
    isAuthenticated,
    profileFetched,
    userProfile: userProfile ? 'exists' : 'null',
    profileLoading
  });

  // Show profile loading
  if (showProfileLoading) {
    console.log('[DEBUG] LandingPage: Showing profile loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  // Show main authenticated homepage
  console.log('[DEBUG] LandingPage: Rendering main authenticated homepage');
  return (
    <>
      <Homepage />
      {needsProfileSetup && (
        <ProfileSetupModal onClose={() => {
          console.log('[DEBUG] LandingPage: Profile setup modal closed');
        }} />
      )}
    </>
  );
}
