import { useEffect, useState } from "react";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "@/hooks/useQueries";
import { Principal } from "@dfinity/principal";
import Homepage from "./Homepage";
import PublicHomepage from "./PublicHomepage";
import ProfileSetupModal from "./ProfileSetupModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Share2, DollarSign, Shield } from "lucide-react";

export default function LandingPage() {
  const { identity, login, isLoggingIn, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } =
    useGetCallerUserProfile();
  const [viewingUser, setViewingUser] = useState<Principal | null>(null);
  const [appInitialized, setAppInitialized] = useState(false);

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  // Handle ?user= param in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get("user");

    if (userParam) {
      try {
        const principal = Principal.fromText(userParam);
        setViewingUser(principal);
      } catch (err) {
        console.error("Invalid user principal:", err);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else {
      setViewingUser(null);
    }
    setAppInitialized(true);
  }, []);

  // Loading during app init
  if (isInitializing || !appInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your journal...</p>
        </div>
      </div>
    );
  }

  // Public homepage
  if (viewingUser) {
    return (
      <PublicHomepage
        user={viewingUser}
        onBackToLogin={() => {
          setViewingUser(null);
          window.history.replaceState({}, document.title, window.location.pathname);
        }}
      />
    );
  }

  // Not logged in → animated landing page
  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto text-center py-16 px-4">
        {/* Subtle headline float */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-logo-color animate-[float_8s_ease-in-out_infinite]">
          Welcome to Doo Journal!
        </h1>

        <div className="mb-12 max-w-4xl mx-auto">
          <p className="text-xl md:text-[1.75rem] text-muted-foreground leading-relaxed">
            Doo Journal is a fun and safe kids journal app where young writers can
            record their thoughts, dreams, and adventures.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {/* Card 1 */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 text-white shadow-2xl transform transition-transform duration-300 hover:scale-105 hover:-translate-y-2">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {/* animate only on hover using arbitrary animation utility */}
                <Sparkles className="w-8 h-8 text-white group-hover:animate-[sparkle_2s_ease-in-out_infinite]" />
              </div>
              <h3 className="text-3xl font-bold mb-3">Create</h3>
              <p className="group-hover:animate-[float_3s_ease-in-out_infinite]">
                Capture your day with words, photos, or videos!
              </p>
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 text-white shadow-2xl transform transition-transform duration-300 hover:scale-105 hover:-translate-y-2">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-8 h-8 text-white group-hover:animate-[sparkle_2s_ease-in-out_infinite]" />
              </div>
              <h3 className="text-3xl font-bold mb-3">Share</h3>
              <p className="group-hover:animate-[float_3s_ease-in-out_infinite]">
                Show off your favorite moments with friends and family.
              </p>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 text-white shadow-2xl transform transition-transform duration-300 hover:scale-105 hover:-translate-y-2">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-white group-hover:animate-[sparkle_2s_ease-in-out_infinite]" />
              </div>
              <h3 className="text-3xl font-bold mb-3">Earn</h3>
              <p className="group-hover:animate-[float_3s_ease-in-out_infinite]">
                Get rewarded with DooCoins for your creativity!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Login CTA */}
        <Button
          onClick={login}
          disabled={isLoggingIn}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-7 text-xl rounded-full shadow-md transition transform hover:scale-105 active:scale-95 mx-auto mb-16 flex items-center gap-2"
        >
          💖 {isLoggingIn ? "Starting..." : "Start Journaling"}
        </Button>

        {/* Parents Info */}
        <Card className="group w-full max-w-6xl mx-auto bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200/50 shadow-xl transition duration-500 hover:shadow-2xl hover:-translate-y-1">
          <CardContent className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Shield className="w-10 h-10 text-white group-hover:animate-[sparkle_2s_ease-in-out_infinite]" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-3xl font-bold text-indigo-900 mb-4">
                  Hey Parents
                </h3>
                <p className="text-lg text-indigo-700 leading-relaxed">
                  Rest assured, Doo Journal is built with safety and privacy at its core. Your
                  child’s journal is secured on the blockchain with privacy
                  controls and safe sharing features.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated → profile check
  const needsProfileSetup = isAuthenticated && profileFetched && userProfile === null;
  const showProfileLoading = isAuthenticated && profileLoading && !profileFetched;

  if (showProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  // Authenticated homepage
  return (
    <>
      <Homepage />
      {needsProfileSetup && <ProfileSetupModal onClose={() => {}} />}
    </>
  );
}
