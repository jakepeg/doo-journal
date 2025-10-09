/**
 * Performance optimization utilities for journal operations
 */

/**
 * Compress content before sending to backend to reduce network time
 */
export function compressContent(content: string): string {
  // For now, just trim whitespace and normalize line endings
  // Could add LZ compression later if needed
  return content.trim().replace(/\r\n/g, '\n');
}

/**
 * Estimate backend save time based on content characteristics
 */
export function estimateSaveTime(content: string, isPublic: boolean): number {
  const baseTime = 1000; // 1 second base
  const encryptionTime = isPublic ? 0 : 2000; // 2 seconds for encryption
  const sizeTime = Math.min(content.length / 1000, 2000); // Size-based time, max 2s
  
  return baseTime + encryptionTime + sizeTime;
}

/**
 * Show estimated completion time to user
 */
export function showSaveProgress(estimatedTime: number): void {
  const seconds = Math.ceil(estimatedTime / 1000);
  console.log(`💾 Estimated save time: ~${seconds} seconds`);
}

/**
 * Optimize content for faster saving
 */
export function optimizeForSpeed(content: string, title: string): {
  optimizedContent: string;
  title: string;
  estimatedTime: number;
} {
  // Remove excessive whitespace
  const optimizedContent = compressContent(content);
  
  // Estimate time
  const estimatedTime = estimateSaveTime(optimizedContent, true); // Assume public for estimation
  
  return {
    optimizedContent,
    title: title.trim(),
    estimatedTime
  };
}