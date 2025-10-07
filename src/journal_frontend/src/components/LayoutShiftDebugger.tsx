import { useEffect } from 'react';

export function LayoutShiftDebugger() {
  useEffect(() => {
    if (import.meta.env.PROD) return;

    // Track all layout shifts with detailed information
    let clsValue = 0;
    const shifts: Array<{
      value: number;
      element: string;
      time: number;
      rect?: DOMRect;
    }> = [];

    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          
          // Log detailed shift information
          const sources = entry.sources || [];
          sources.forEach((source: any) => {
            const element = source.node as Element;
            const selector = getElementPath(element);
            const rect = element?.getBoundingClientRect();
            
            console.warn(`🔄 LAYOUT SHIFT (${entry.value.toFixed(4)})`, {
              selector: selector,
              cumulativeScore: clsValue,
              shiftValue: entry.value,
              time: entry.startTime,
              elementRect: rect ? {
                width: rect.width,
                height: rect.height,
                top: rect.top,
                left: rect.left
              } : null,
              domElement: element
            });

            // Highlight the shifting element temporarily
            if (element && element instanceof HTMLElement) {
              const originalOutline = element.style.outline;
              element.style.outline = '3px solid red';
              element.style.outlineOffset = '2px';
              
              setTimeout(() => {
                element.style.outline = originalOutline;
                element.style.outlineOffset = '';
              }, 2000);
            }

            shifts.push({
              value: entry.value,
              element: selector,
              time: entry.startTime,
              rect: rect || undefined
            });
          });
        }
      }
    });

    clsObserver.observe({ entryTypes: ['layout-shift'] });

    // Also observe DOM mutations that might cause shifts
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof Element) {
              console.log('🆕 DOM node added:', getElementPath(node));
            }
          });
        }
        
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'class' || 
             mutation.attributeName === 'style')) {
          console.log('🎨 Style/class changed:', getElementPath(mutation.target as Element));
        }
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    // Log summary after 5 seconds
    setTimeout(() => {
      console.log('📊 CLS Summary:', {
        totalScore: clsValue,
        numberOfShifts: shifts.length,
        shifts: shifts
      });
    }, 5000);

    return () => {
      clsObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return null; // This is a debug-only component
}

function getElementPath(element: Element): string {
  if (!element) return 'unknown';
  
  const path: string[] = [];
  let current: Element | null = element;
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    
    if (current.id) {
      selector += `#${current.id}`;
    } else if (current.classList.length > 0) {
      const classes = Array.from(current.classList)
        .filter(cls => cls && !cls.startsWith('_'))
        .slice(0, 2)
        .join('.');
      if (classes) selector += `.${classes}`;
    }
    
    path.unshift(selector);
    current = current.parentElement;
    
    // Limit depth to avoid very long selectors
    if (path.length >= 4) break;
  }
  
  return path.join(' > ');
}