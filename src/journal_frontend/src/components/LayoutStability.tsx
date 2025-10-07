import React from 'react';

interface LayoutStabilityProps {
  children: React.ReactNode;
  minHeight?: string;
  aspectRatio?: string;
  className?: string;
}

/**
 * LayoutStability component helps prevent Cumulative Layout Shift (CLS)
 * by reserving space for content before it loads
 */
export function LayoutStability({ 
  children, 
  minHeight, 
  aspectRatio, 
  className = '' 
}: LayoutStabilityProps) {
  const style: React.CSSProperties = {};
  
  if (minHeight) {
    style.minHeight = minHeight;
  }
  
  if (aspectRatio) {
    style.aspectRatio = aspectRatio;
  }

  return (
    <div 
      className={`layout-stability ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

interface ImageWithDimensionsProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width: number;
  height: number;
  aspectRatio?: string;
}

/**
 * ImageWithDimensions component prevents CLS by always specifying dimensions
 */
export function ImageWithDimensions({ 
  src, 
  alt, 
  width, 
  height, 
  aspectRatio,
  className = '',
  ...props 
}: ImageWithDimensionsProps) {
  const style: React.CSSProperties = {
    width,
    height,
    aspectRatio: aspectRatio || `${width} / ${height}`,
  };

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`layout-stability-img ${className}`}
      style={style}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
}

interface AvatarStableProps {
  src?: string;
  alt: string;
  size?: number;
  fallback: string;
  className?: string;
}

/**
 * AvatarStable component prevents CLS by always maintaining consistent dimensions
 */
export function AvatarStable({ 
  src, 
  alt, 
  size = 96, 
  fallback, 
  className = '' 
}: AvatarStableProps) {
  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  return (
    <div 
      className={`avatar-stable ${className}`}
      style={containerStyle}
      data-avatar-container
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          style={imageStyle}
          width={size}
          height={size}
          loading="eager"
          decoding="sync"
          onError={(e) => {
            // Hide broken images and show fallback
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <span 
          style={{ 
            fontSize: size * 0.4, 
            fontWeight: 'bold', 
            color: '#6b7280' 
          }}
        >
          {fallback}
        </span>
      )}
    </div>
  );
}

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

/**
 * Skeleton component provides consistent loading placeholders
 */
export function Skeleton({ 
  width = '100%', 
  height = '1rem', 
  className = '', 
  count = 1 
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  if (count === 1) {
    return (
      <div 
        className={`skeleton ${className}`}
        style={style}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="skeleton-group">
      {Array.from({ length: count }, (_, i) => (
        <div 
          key={i}
          className={`skeleton ${className}`}
          style={{ ...style, marginBottom: i < count - 1 ? '0.5rem' : 0 }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

interface ContentPlaceholderProps {
  isLoading: boolean;
  children: React.ReactNode;
  skeleton: React.ReactNode;
  minHeight?: string;
}

/**
 * ContentPlaceholder shows skeleton while loading, then content
 */
export function ContentPlaceholder({ 
  isLoading, 
  children, 
  skeleton, 
  minHeight 
}: ContentPlaceholderProps) {
  return (
    <LayoutStability minHeight={minHeight}>
      {isLoading ? skeleton : children}
    </LayoutStability>
  );
}