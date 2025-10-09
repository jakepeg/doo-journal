// Utility for uploading images as files instead of base64
// This provides better performance than embedding base64 in content

const CANISTER_ID = import.meta.env.VITE_JOURNAL_FRONTEND_CANISTER_ID;
const IC_HOST = import.meta.env.VITE_IC_HOST || 'https://icp0.io';

export interface UploadedImage {
  path: string;
  url: string;
  size: number;
}

/**
 * Upload an image file to the assets canister
 * Returns a path that can be stored in the profile instead of base64
 */
export async function uploadImageFile(
  file: File, 
  category: 'profile' | 'cover' | 'content' = 'content'
): Promise<UploadedImage> {
  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Size limits based on category
  const maxSizes = {
    profile: 2 * 1024 * 1024,   // 2MB for profile pics
    cover: 10 * 1024 * 1024,    // 10MB for cover images
    content: 5 * 1024 * 1024    // 5MB for content images
  };

  if (file.size > maxSizes[category]) {
    throw new Error(`Image must be smaller than ${Math.round(maxSizes[category] / 1024 / 1024)}MB`);
  }

  // Generate unique filename
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2);
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${category}-${timestamp}-${randomId}.${extension}`;
  const path = `images/${filename}`;

  try {
    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', file);

    // Upload to assets canister using HTTP API
    const uploadUrl = `${IC_HOST}/${CANISTER_ID}/${path}`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const url = `${IC_HOST}/${CANISTER_ID}/${path}`;
    
    return {
      path,
      url,
      size: file.size
    };
  } catch (error) {
    console.error('Image upload failed:', error);
    throw new Error('Failed to upload image. Please try again.');
  }
}

/**
 * Get the full URL for an image path
 */
export function getImageUrl(path: string): string {
  if (path.startsWith('data:')) {
    // Legacy base64 image
    return path;
  }
  
  if (path.startsWith('http')) {
    // Already a full URL
    return path;
  }
  
  // Convert path to full URL
  return `${IC_HOST}/${CANISTER_ID}/${path}`;
}

/**
 * Convert a File to an optimized format for web display
 */
export async function optimizeImage(
  file: File, 
  maxWidth: number = 1200, 
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress image
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to optimize image'));
            return;
          }
          
          // Create new File with optimized blob
          const optimizedFile = new File([blob], file.name, {
            type: 'image/jpeg', // Always use JPEG for better compression
            lastModified: Date.now(),
          });
          
          resolve(optimizedFile);
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}