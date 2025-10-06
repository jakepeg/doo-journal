/**
 * Development utilities for suppressing known warnings that don't affect functionality
 */

// Suppress findDOMNode warnings from react-quill in development
if (import.meta.env.DEV) {
  const originalConsoleWarn = console.warn;
  
  console.warn = (...args: any[]) => {
    // Suppress known react-quill findDOMNode warnings
    if (
      args[0]?.toString().includes('findDOMNode is deprecated') ||
      args[0]?.toString().includes('ReactQuill')
    ) {
      return;
    }
    
    // Let all other warnings through
    originalConsoleWarn.apply(console, args);
  };
}

export {};