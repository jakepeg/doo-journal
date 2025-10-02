import { useState, useCallback } from 'react';
import { useActor } from './useActor';

// Temporary crypto utilities (replace with actual vetKeys SDK when available)
class TempCrypto {
  static async encrypt(content: string, key: Uint8Array): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    
    // Simple XOR encryption for demo (NOT secure for production)
    // This will be replaced with actual vetKeys encryption
    const encrypted = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      encrypted[i] = data[i] ^ key[i % key.length];
    }
    return encrypted;
  }
  
  static async decrypt(encryptedData: Uint8Array, key: Uint8Array): Promise<string> {
    // Simple XOR decryption (same as encryption for XOR)
    const decrypted = new Uint8Array(encryptedData.length);
    for (let i = 0; i < encryptedData.length; i++) {
      decrypted[i] = encryptedData[i] ^ key[i % key.length];
    }
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
}

export function useVetKeys() {
  const { actor } = useActor();
  const [encryptionKey, setEncryptionKey] = useState<Uint8Array | null>(null);

  const getEncryptionKey = useCallback(async (): Promise<Uint8Array> => {
    if (encryptionKey) return encryptionKey;
    
    if (!actor) throw new Error('Actor not available');
    
    // Get user's encryption key from backend
    const keyBlob = await actor.getUserEncryptionKey();
    const key = keyBlob instanceof Uint8Array ? keyBlob : new Uint8Array(keyBlob);
    setEncryptionKey(key);
    return key;
  }, [actor, encryptionKey]);

  const encryptContent = useCallback(async (content: string): Promise<Uint8Array> => {
    const key = await getEncryptionKey();
    return await TempCrypto.encrypt(content, key);
  }, [getEncryptionKey]);

  const decryptContent = useCallback(async (encryptedData: Uint8Array): Promise<string> => {
    const key = await getEncryptionKey();
    return await TempCrypto.decrypt(encryptedData, key);
  }, [getEncryptionKey]);

  return {
    encryptContent,
    decryptContent,
    getEncryptionKey
  };
}