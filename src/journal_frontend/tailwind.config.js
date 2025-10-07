/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          // Modern rounded system font stack (similar to Fredoka's rounded feel)
          'ui-rounded',           // iOS rounded
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Rounded',       // macOS rounded
          'Segoe UI',            // Windows
          'Roboto',              // Android
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        // Keep fredoka alias for any explicit font-fredoka usage, maps to system stack
        'fredoka': [
          'ui-rounded',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Rounded',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
