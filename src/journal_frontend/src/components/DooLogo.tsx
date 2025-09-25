import React from 'react';

interface DooLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function DooLogo({ 
  className = "", 
  width = 50, 
  height = 40
}: DooLogoProps) {
  return (
    <div 
      className="relative inline-block" 
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 960 560"
        fill="currentColor"
        width={width}
        height={height}
        className={`text-purple-600 relative z-10 ${className}`}
        style={{ 
          display: 'block',
          flexShrink: 0,
          width: `${width}px`,
          height: `${height}px`,
          minWidth: `${width}px`,
          minHeight: `${height}px`,
          maxWidth: `${width}px`,
          maxHeight: `${height}px`
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        <path d="M291 282.5c0-58.5-47.4-105.9-105.9-105.9-15.7 0-30.6 3.4-44 9.6-11.7 29.8-18.2 62.4-18.2 96.4s6.4 66.5 18.2 96.4c13.4 6.1 28.3 9.6 44 9.6 58.5 0 105.9-47.4 105.9-105.9z"/>
        <path d="M560.8 19C449.3 19 354 88.3 315.5 186.1c13.4-6.1 28.3-9.6 44-9.6 47 0 86.8 30.6 100.7 72.9 13.9-42.3 53.7-72.9 100.7-72.9 58.5 0 105.9 47.4 105.9 105.9S619.4 388.4 560.8 388.4c-47 0-86.8-30.6-100.7-72.9-13.9 42.3-53.7 72.9-100.7 72.9-15.7 0-30.6-3.4-44-9.6C354 476.7 449.3 546 560.8 546c145.5 0 263.5-118 263.5-263.5C824.3 137 706.3 19 560.8 19z"/>
      </svg>
    </div>
  );
}
