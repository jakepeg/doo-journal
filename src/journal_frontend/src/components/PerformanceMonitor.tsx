import { useEffect, useState } from 'react';

function getElementSelector(element: Element): string {
  if (!element) return 'unknown';
  
  // Try to get a meaningful selector
  if (element.id) return `#${element.id}`;
  
  const classes = Array.from(element.classList)
    .filter(cls => cls && !cls.startsWith('_')) // Filter out CSS modules
    .slice(0, 3) // Take first 3 classes
    .join('.');
  
  const tag = element.tagName.toLowerCase();
  
  if (classes) return `${tag}.${classes}`;
  return tag;
}

interface PerformanceTiming {
  navigationStart: number;
  domContentLoaded: number;
  loadComplete: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  layoutShifts?: Array<{
    value: number;
    sources: string[];
    time: number;
  }>;
}

export function PerformanceMonitor() {
  const [timings, setTimings] = useState<PerformanceTiming | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (import.meta.env.PROD) return;

    const measurePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      let firstContentfulPaint: number | undefined;
      let largestContentfulPaint: number | undefined;

      // Get paint timings if available
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        firstContentfulPaint = fcpEntry.startTime;
      }

      // Get LCP if available
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          if (lastEntry) {
            largestContentfulPaint = lastEntry.startTime;
            setTimings(prev => prev ? { ...prev, largestContentfulPaint } : null);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // LCP not supported
      }

      // Track Layout Shifts in detail
      let cumulativeLayoutShift = 0;
      const layoutShifts: Array<{
        value: number;
        sources: string[];
        time: number;
      }> = [];

      try {
        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              cumulativeLayoutShift += entry.value;
              
              // Get detailed information about the shift
              const sources = entry.sources?.map((source: any) => {
                const element = source.node;
                const selector = element ? getElementSelector(element) : 'unknown';
                return `${selector} (${Math.round(entry.value * 1000) / 1000})`;
              }) || [];

              layoutShifts.push({
                value: entry.value,
                sources,
                time: entry.startTime
              });

              console.log(`[CLS] Layout shift detected:`, {
                value: entry.value,
                cumulativeScore: cumulativeLayoutShift,
                sources,
                time: entry.startTime
              });

              setTimings(prev => prev ? {
                ...prev,
                cumulativeLayoutShift,
                layoutShifts: [...(prev.layoutShifts || []), ...layoutShifts]
              } : null);
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.log('Layout shift tracking not supported');
      }

      const timingData: PerformanceTiming = {
        navigationStart: performance.timeOrigin,
        domContentLoaded: navigation.domContentLoadedEventEnd - performance.timeOrigin,
        loadComplete: navigation.loadEventEnd - performance.timeOrigin,
        firstContentfulPaint,
        largestContentfulPaint,
      };

      setTimings(timingData);
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      setTimeout(measurePerformance, 1000);
    } else {
      window.addEventListener('load', () => {
        setTimeout(measurePerformance, 1000);
      });
    }

    // Toggle visibility with keyboard shortcut
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  if (import.meta.env.PROD || !isVisible || !timings) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Performance Monitor</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>DOM Content Loaded:</span>
          <span className={timings.domContentLoaded > 1000 ? 'text-red-400' : 'text-green-400'}>
            {timings.domContentLoaded.toFixed(0)}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Page Load Complete:</span>
          <span className={timings.loadComplete > 3000 ? 'text-red-400' : 'text-green-400'}>
            {timings.loadComplete.toFixed(0)}ms
          </span>
        </div>
        
        {timings.firstContentfulPaint && (
          <div className="flex justify-between">
            <span>First Contentful Paint:</span>
            <span className={timings.firstContentfulPaint > 1800 ? 'text-red-400' : 'text-green-400'}>
              {timings.firstContentfulPaint.toFixed(0)}ms
            </span>
          </div>
        )}
        
        {timings.largestContentfulPaint && (
          <div className="flex justify-between">
            <span>Largest Contentful Paint:</span>
            <span className={timings.largestContentfulPaint > 2500 ? 'text-red-400' : 'text-green-400'}>
              {timings.largestContentfulPaint.toFixed(0)}ms
            </span>
          </div>
        )}
        
        {timings.cumulativeLayoutShift !== undefined && (
          <div className="flex justify-between">
            <span>Cumulative Layout Shift:</span>
            <span className={timings.cumulativeLayoutShift > 0.1 ? 'text-red-400' : timings.cumulativeLayoutShift > 0.05 ? 'text-yellow-400' : 'text-green-400'}>
              {timings.cumulativeLayoutShift.toFixed(4)}
            </span>
          </div>
        )}
      </div>
      
      {timings.layoutShifts && timings.layoutShifts.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          <h4 className="font-bold text-yellow-400 mb-1">Layout Shifts:</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {timings.layoutShifts.map((shift, i) => (
              <div key={i} className="text-xs">
                <div className="flex justify-between">
                  <span>Shift {i + 1}:</span>
                  <span className="text-red-400">{shift.value.toFixed(4)}</span>
                </div>
                {shift.sources.map((source, j) => (
                  <div key={j} className="text-gray-400 ml-2 truncate">
                    {source}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-2 pt-2 border-t border-gray-600 text-gray-400">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  );
}

// Hook to show performance monitor button in dev
export function usePerformanceMonitor() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (import.meta.env.PROD) return;
    
    const timer = setTimeout(() => setShowButton(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (import.meta.env.PROD || !showButton) return null;

  return (
    <button
      onClick={() => {
        const event = new KeyboardEvent('keydown', {
          ctrlKey: true,
          shiftKey: true,
          key: 'P'
        });
        window.dispatchEvent(event);
      }}
      className="fixed bottom-4 left-4 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg hover:bg-purple-700 transition-colors z-40"
    >
      📊 Performance
    </button>
  );
}