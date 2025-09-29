import { useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  // Redirect to home if user is not authenticated
  useEffect(() => {
    if (!identity) {
      console.log('[DEBUG] PrivacyPolicyPage: No identity found, redirecting to home');
      navigate({ to: '/' });
    }
  }, [identity, navigate]);

  return (
    <>
      {isAuthenticated && (
        // Back to Journal Button (nav already comes from __root)
        <div className="container mx-auto px-4 py-4 max-w-[1024px]">
          <Button
            onClick={() => (window.location.href = '/')}
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-purple-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Journal
          </Button>
        </div>
      )}

      <main className="container mx-auto px-4 pb-8 max-w-[1024px] flex-1">
        <div className={`${!isAuthenticated ? 'mt-8' : ''}`}>
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent text-center">
                Privacy Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <div className="space-y-6 text-gray-700">
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
                  <p>
                    Welcome to Doo Journal, a kids journaling application. We are committed to protecting
                    your privacy and ensuring a safe experience for all our users, especially children.
                    This Privacy Policy explains how we collect, use, and protect your information when
                    you use our service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Personal Information</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Profile information (name, bio, profile picture, cover image)</li>
                    <li>Journal entries and their content</li>
                    <li>Privacy settings for your entries</li>
                    <li>Authentication data through Internet Identity</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Technical Information</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Device information and browser type</li>
                    <li>Usage patterns and app interactions</li>
                    <li>Cached data for offline functionality</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
                  <ul className="list-disc list-inside space-y-2">
                    <li>To provide and maintain the journaling service</li>
                    <li>To enable profile customization and sharing features</li>
                    <li>To respect your privacy settings for journal entries</li>
                    <li>To improve the app&apos;s functionality and user experience</li>
                    <li>To provide offline access to your content</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Storage and Security</h2>
                  <p className="mb-4">
                    Your data is stored securely on The Internet Computer blockchain, which provides:
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Decentralized and tamper-resistant storage</li>
                    <li>End-to-end encryption for your personal data</li>
                    <li>User-controlled access through Internet Identity</li>
                    <li>No central authority with access to your private content</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy Controls</h2>
                  <p className="mb-4">You have full control over your privacy:</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Mark journal entries as private (only you can see them) or public</li>
                    <li>Control who can view your profile information</li>
                    <li>Share your public profile and entries with others if you choose</li>
                    <li>Delete your entries and profile information at any time</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Children&apos;s Privacy</h2>
                  <p className="mb-4">We take children&apos;s privacy seriously:</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>We do not knowingly collect personal information from children under 13 without parental consent</li>
                    <li>Parents can review and request deletion of their child&apos;s information</li>
                    <li>We encourage parental involvement in children&apos;s online activities</li>
                    <li>Default privacy settings prioritize safety and privacy</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Services</h2>
                  <p>
                    We use Internet Identity for authentication, which provides privacy-preserving login
                    without requiring personal information. We do not share your data with other third
                    parties for marketing or advertising purposes.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
                  <p>
                    Your data is retained as long as your account is active. You can delete your entries
                    and profile information at any time through the app interface. Deleted data is
                    permanently removed from our systems.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
                  <p>
                    We may update this Privacy Policy from time to time. We will notify users of any
                    significant changes through the app or by email if contact information is available.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
                  <p>
                    If you have any questions about this Privacy Policy or our privacy practices, please
                    contact us at{" "}
                    <a href="mailto:hello@doo.co" className="text-purple-600 hover:underline">
                      hello@doo.co
                    </a>
                  </p>
                </section>

                <section className="text-sm text-gray-500 border-t pt-4">
                  <p>Last updated: September 2025</p>
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
