/**
 * Compress images before converting to base64 for better performance
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export async function compressImage(
  file: File, 
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    format = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      // Set canvas size
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert to data URL with compression
      const dataUrl = canvas.toDataURL(format, quality);
      resolve(dataUrl);
      
      // Clean up
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

export function getImageSizeReduction(originalSize: number, compressedDataUrl: string): number {
  // Estimate compressed size (base64 is ~33% larger than binary)
  const base64Size = compressedDataUrl.length * 0.75;
  const reduction = ((originalSize - base64Size) / originalSize) * 100;
  return Math.max(0, Math.round(reduction));
}