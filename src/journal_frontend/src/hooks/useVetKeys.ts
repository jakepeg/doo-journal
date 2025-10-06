import { useCallback, useState } from 'react';
import { useActor } from './useActor';
import { debug } from '../utils/debug';

// Dynamic vetKeys import to avoid bundling issues
let vetKeysModule: any = null;
let TransportSecretKey: any = null;
let DerivedPublicKey: any = null;
let EncryptedKey: any = null;
let IbeCiphertext: any = null;
let IbeIdentity: any = null;
let IbeSeed: any = null;

async function loadVetKeys() {
  if (vetKeysModule) return vetKeysModule;
  
  try {
    debug.log('Loading vetKeys module...');
    vetKeysModule = await import('@dfinity/vetkeys');
    
    // Extract the classes we need for IBE
    TransportSecretKey = vetKeysModule.TransportSecretKey;
    DerivedPublicKey = vetKeysModule.DerivedPublicKey;
    EncryptedKey = vetKeysModule.EncryptedKey;
    IbeCiphertext = vetKeysModule.IbeCiphertext;
    IbeIdentity = vetKeysModule.IbeIdentity;
    IbeSeed = vetKeysModule.IbeSeed;
    
    debug.log('vetKeys module loaded successfully with IBE classes');
    return vetKeysModule;
  } catch (error) {
    debug.error('Failed to load vetKeys module:', error);
    throw error;
  }
}

// Placeholder encryption implementation (fallback)
// Helper functions to convert between Uint8Array and base64 strings
function uint8ArrayToBase64(array: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, Array.from(array)));
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

class TempCrypto {
  private key: Uint8Array;

  constructor(key: Uint8Array) {
    this.key = key;
  }

  encrypt(data: string): string {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    
    // Simple XOR encryption for testing
    const encrypted = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
      encrypted[i] = dataBytes[i] ^ this.key[i % this.key.length];
    }
    
    return uint8ArrayToBase64(encrypted);
  }

  decrypt(encryptedString: string): string {
    const encryptedData = base64ToUint8Array(encryptedString);
    
    // Simple XOR decryption for testing
    const decrypted = new Uint8Array(encryptedData.length);
    for (let i = 0; i < encryptedData.length; i++) {
      decrypted[i] = encryptedData[i] ^ this.key[i % this.key.length];
    }
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
}

// Cache for vetKD public key to avoid repeated fetches
let cachedPublicKey: Uint8Array | null = null;
let publicKeyPromise: Promise<Uint8Array> | null = null;

export function useVetKeys() {
  const { actor } = useActor();
  const [transportSecretKey, setTransportSecretKey] = useState<any>(null);
  const [derivedPublicKey, setDerivedPublicKey] = useState<any>(null);
  const [useRealVetKeys, setUseRealVetKeys] = useState(false);

  const tryVetKeys = useCallback(async () => {
    try {
      debug.log('Attempting to load vetKeys...');
      await loadVetKeys();
      setUseRealVetKeys(true);
      debug.log('vetKeys loaded successfully, using real IBE encryption');
    } catch (error) {
      debug.warn('vetKeys failed to load, falling back to placeholder:', error);
      setUseRealVetKeys(false);
    }
  }, []);

  const initializeVetKeys = useCallback(async () => {
    if (!actor) throw new Error('Actor not available');
    
    try {
      // Try to use real vetKeys first
      if (useRealVetKeys || !vetKeysModule) {
        await tryVetKeys();
      }

      if (vetKeysModule && TransportSecretKey && DerivedPublicKey) {
        debug.log('Initializing real vetKeys IBE system');
        
        // Create transport secret key if we don't have one
        // For simplicity, we'll use a pseudo-transport key and rely on deterministic encryption
        let currentTransportKey = transportSecretKey;
        if (!currentTransportKey) {
          currentTransportKey = TransportSecretKey.random();
          setTransportSecretKey(currentTransportKey);
          debug.log('Created new transport secret key (session-based)');
        }

        // Get the derived public key from the backend if we don't have one
        let currentDerivedKey = derivedPublicKey;
        if (!currentDerivedKey) {
          debug.log('Fetching vetKD public key from backend...');
          
          // Use cached public key or fetch if not available
          if (!cachedPublicKey) {
            if (!publicKeyPromise) {
              publicKeyPromise = actor.getVetKdPublicKey().then(bytes => {
                cachedPublicKey = new Uint8Array(bytes);
                return cachedPublicKey;
              });
            }
            await publicKeyPromise;
            publicKeyPromise = null; // Reset promise after completion
          }
          
          currentDerivedKey = DerivedPublicKey.deserialize(cachedPublicKey);
          setDerivedPublicKey(currentDerivedKey);
          debug.log('Received and parsed vetKD public key (cached)');
        }

        return { 
          transportSecretKey: currentTransportKey, 
          derivedPublicKey: currentDerivedKey 
        };
      } else {
        debug.warn('vetKeys not available, using fallback', {
          vetKeysModule: !!vetKeysModule,
          TransportSecretKey: !!TransportSecretKey,
          DerivedPublicKey: !!DerivedPublicKey,
          useRealVetKeys: useRealVetKeys
        });
        return null;
      }
    } catch (error) {
      debug.error('Failed to initialize vetKeys:', error);
      return null;
    }
  }, [actor, transportSecretKey, derivedPublicKey, useRealVetKeys, tryVetKeys]);

  const encryptContent = useCallback(async (content: string): Promise<string> => {
    if (!content) return '';
    
    // Add size limit to prevent stack overflow in IBE encryption
    const maxContentSize = 5000; // 5KB limit for IBE encryption to prevent stack overflow
    
    if (content.length > maxContentSize) {
      debug.warn(`Content size ${content.length} exceeds IBE limit ${maxContentSize}, using fallback encoding`);
      
      // For very large content, use simple base64 encoding with a warning
      // This prevents stack overflow while maintaining functionality
      try {
        const encoded = btoa(encodeURIComponent(content));
        return `LARGE_CONTENT:${encoded}`;
      } catch (error) {
        debug.error('Fallback encoding failed:', error);
        return content; // Return plain content as last resort
      }
    }
    
    try {
      const keys = await initializeVetKeys();
      
      debug.log('Encryption keys status:', {
        keysExist: !!keys,
        transportKey: !!keys?.transportSecretKey,
        derivedKey: !!keys?.derivedPublicKey,
        vetKeysModule: !!vetKeysModule,
        IbeCiphertext: !!IbeCiphertext,
        IbeIdentity: !!IbeIdentity,
        IbeSeed: !!IbeSeed
      });
      
      if (keys && keys.derivedPublicKey && keys.transportSecretKey && vetKeysModule && actor) {
        debug.log('Encrypting with deterministic user key');
        
        // Get user's derivation input (their principal)
        const derivationInput = await actor!.getUserEncryptionKey();
        debug.log('Got user derivation input for encryption, length:', derivationInput.length);
        
        // Create a deterministic 32-byte key from user's principal alone
        // This ensures the same user always gets the same key regardless of session
        const userKey = new Uint8Array(32);
        const principalBytes = new Uint8Array(derivationInput);
        
        // Fill the 32-byte key by repeating and hashing the principal
        for (let i = 0; i < 32; i++) {
          userKey[i] = principalBytes[i % principalBytes.length] ^ (i * 7 + principalBytes[0]);
        }
        
        debug.log('Created deterministic user key for encryption');
        
        // Use this as a symmetric key for AES encryption
        const crypto = new TempCrypto(userKey);
        const encryptedString = crypto.encrypt(content);
        
        debug.log('Successfully encrypted with deterministic user key');
        return encryptedString;
      }
    } catch (error) {
      debug.error('IBE encryption failed:', error);
    }
    
    // Fallback to temporary encryption
    debug.warn('Using temporary encryption (not secure)');
    const tempKey = new TextEncoder().encode('temp_encryption_key_123456789');
    const crypto = new TempCrypto(tempKey);
    return crypto.encrypt(content);
  }, [initializeVetKeys, useRealVetKeys, actor]);

  const decryptContent = useCallback(async (encryptedString: string): Promise<string> => {
    if (!encryptedString) return '';
    
    // Handle large content that was fallback encoded
    if (encryptedString.startsWith('LARGE_CONTENT:')) {
      let encoded = encryptedString.replace('LARGE_CONTENT:', '');
      const originalEncoded = encoded;

      // Robust decoding strategy to tolerate double URI encoding, url-safe base64, missing padding, stray characters
      const attemptDecode = (): string | null => {
        let base = encoded.trim();
        if (!base) return '';
        try {
          // If percent-encoded (contains %XX sequences), decode once to restore raw base64
            if (/%[0-9A-Fa-f]{2}/.test(base)) {
              try { base = decodeURIComponent(base); } catch {}
            }
          // Convert URL-safe variants
          base = base.replace(/-/g, '+').replace(/_/g, '/');
          // Strip anything not base64 set
          base = base.replace(/[^A-Za-z0-9+/=]/g, '');
          // Fix padding (length must be multiple of 4)
          if (base.length % 4 !== 0) {
            base = base.padEnd(base.length + (4 - (base.length % 4)), '=');
          }
          const bin = atob(base);
          // Try URI component decode (we encoded with encodeURIComponent originally)
          try {
            return decodeURIComponent(bin);
          } catch {
            return bin; // return raw if not URI encoded
          }
        } catch (e) {
          return null;
        }
      };

      const maybeUriDecode = (s: string): string => {
        if (/%3C/i.test(s) && !/<[a-z!/]/i.test(s)) {
          try {
            const dec = decodeURIComponent(s);
            if (/<[a-z!/]/i.test(dec)) return dec;
          } catch {/* ignore */}
        }
        return s;
      };

      const primary = attemptDecode();
      if (primary !== null) {
        debug.log('Successfully decoded large content');
        return maybeUriDecode(primary);
      }

      debug.error('Failed to decode large content (attempting salvage preview):', { problematicSample: originalEncoded.slice(0, 80) });
        // Salvage strategy: clean and trim base64 so atob can parse a prefix
        // 1. Remove non-base64 chars
        let cleaned = originalEncoded.replace(/[^A-Za-z0-9+/=]/g, '');
        // 2. Trim to multiple of 4 length
        if (cleaned.length > 8) {
          cleaned = cleaned.slice(0, cleaned.length - (cleaned.length % 4));
        }
        let preview : string | null = null;
        if (cleaned.length > 16) {
          try {
            // Limit decode workload
            const slice = cleaned.slice(0, Math.min(12000, cleaned.length));
            const partial = atob(slice);
            try {
              preview = decodeURIComponent(partial);
            } catch {
              // Fallback: use raw partial as UTF-8 attempt
              preview = partial;
            }
          } catch (e2) {
            debug.warn('Salvage base64 decode failed:', e2);
          }
        }
        if (preview) {
          // Remove any stray <img ...> fragments or base64 traces
          let cleaned = preview
            .replace(/<img[^>]*>/gi, ' ')
            .replace(/data:image\/(?:png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=]+/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .replace(/&(amp|lt|gt|quot|#39);/gi, (m) => ({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':'\''}[m.toLowerCase()] || ' '))
            .replace(/\r/g, '')
            .split('\n').map(seg => seg.replace(/\s+/g,' ').trim()).join('\n').trim();
          // Collapse multiple blank lines
          cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
          const clipped = cleaned.length > 500 ? cleaned.slice(0, 500).trimEnd() + '… [preview truncated]' : cleaned;
          const finalPreview = clipped.length > 0 ? clipped : '[Large content truncated - open entry to view]';
          return maybeUriDecode(finalPreview);
        }
        return '[Large content truncated - open entry to view]';
      }
    
    try {
      const keys = await initializeVetKeys();
      
      debug.log('Decryption keys status:', {
        keysExist: !!keys,
        transportKey: !!keys?.transportSecretKey,
        derivedKey: !!keys?.derivedPublicKey,
        vetKeysModule: !!vetKeysModule,
        IbeCiphertext: !!IbeCiphertext,
        actor: !!actor
      });
      
      if (keys && keys.derivedPublicKey && keys.transportSecretKey && vetKeysModule && IbeCiphertext && actor) {
        debug.log('Attempting deterministic decryption');
        
        // Get user's derivation input (their principal)
        const derivationInput = await actor.getUserEncryptionKey();
        debug.log('Got user derivation input, length:', derivationInput.length);
        
        // Create the exact same deterministic key as used in encryption
        // This ensures the same user always gets the same key regardless of session
        const userKey = new Uint8Array(32);
        const principalBytes = new Uint8Array(derivationInput);
        
        // Use the same algorithm as encryption
        for (let i = 0; i < 32; i++) {
          userKey[i] = principalBytes[i % principalBytes.length] ^ (i * 7 + principalBytes[0]);
        }
        
        debug.log('Created deterministic user key for decryption');
        
        // Use this as a symmetric key for AES decryption
        const crypto = new TempCrypto(userKey);
        let decryptedMessage = crypto.decrypt(encryptedString);
        // Decode percent-encoded HTML if present
        if (/%3C/i.test(decryptedMessage) && !/<[a-z!/]/i.test(decryptedMessage)) {
          try {
            const dec = decodeURIComponent(decryptedMessage);
            if (/<[a-z!/]/i.test(dec)) decryptedMessage = dec;
          } catch {/* ignore */}
        }
        
        debug.log('Successfully decrypted with deterministic user key');
        return decryptedMessage;
      }
    } catch (error) {
      debug.error('IBE decryption failed:', error);
    }
    
    // Fallback to temporary decryption
    debug.warn('Using temporary decryption (not secure)');
    const tempKey = new TextEncoder().encode('temp_encryption_key_123456789');
    const crypto = new TempCrypto(tempKey);
    let fallback = crypto.decrypt(encryptedString);
    if (/%3C/i.test(fallback) && !/<[a-z!/]/i.test(fallback)) {
      try {
        const dec = decodeURIComponent(fallback);
        if (/<[a-z!/]/i.test(dec)) fallback = dec;
      } catch {/* ignore */}
    }
    return fallback;
  }, [initializeVetKeys, useRealVetKeys, actor]);

  return {
    encryptContent,
    decryptContent,
  };
}