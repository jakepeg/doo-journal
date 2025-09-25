import { useNavigate } from '@tanstack/react-router';

export default function Footer() {
  const navigate = useNavigate();

  const handlePrivacyClick = () => {
    try {
      navigate({ to: '/privacy' });
    } catch (error) {
      // Fallback to window.location if router navigation fails
      console.warn('[DEBUG] Footer: Router navigation failed, using window.location', error);
      window.location.href = '/privacy';
    }
  };

  return (
    <footer>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-center gap-4 text-gray-600">
          <a 
            href="https://internetcomputer.org" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-purple-600 transition-colors"
          >
            Built on The Internet Computer
          </a>
          <span className="text-gray-400">|</span>
          <a 
            href="mailto:hello@doo.co"
            className="hover:text-purple-600 transition-colors"
          >
            hello@doo.co
          </a>
          <span className="text-gray-400">|</span>
          <a 
            href="https://x.com/DooCoins" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-purple-600 transition-colors"
          >
            X @DooCoins
          </a>
          <span className="text-gray-400">|</span>
          <button 
            onClick={handlePrivacyClick}
            className="hover:text-purple-600 transition-colors"
          >
            Privacy
          </button>
        </div>
      </div>
    </footer>
  );
}
