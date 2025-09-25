// // src/blob-storage/FileStorage.ts

// import { createActorWithConfig } from '../config';

// // Upload a file (Uint8Array) to the backend canister
// export async function uploadFile(path: string, content: Uint8Array): Promise<void> {
//   const actor = await createActorWithConfig();
//   // candid Blob = vec nat8, so convert Uint8Array -> number[]
//   await actor.uploadFile(path, Array.from(content));
// }

// // Download a file from the backend canister
// export async function getFile(path: string): Promise<Uint8Array | null> {
//   const actor = await createActorWithConfig();
//   const result = await actor.getFile(path);
//   if (!result) return null;
//   return new Uint8Array(result);
// }

// // Remove a file
// export async function deleteFile(path: string): Promise<void> {
//   const actor = await createActorWithConfig();
//   await actor.deleteFile(path);
// }

// // List all file paths (optional utility, if your backend exposes it)
// export async function listFiles(): Promise<string[]> {
//   const actor = await createActorWithConfig();
//   return actor.listFiles();
// }


// src/blob-storage/FileStorage.ts
export async function uploadFile(path: string, content: Blob | ArrayBuffer) {
  console.warn("uploadFile is disabled (backend method missing)");
  return { path };
}

export async function getFile(path: string) {
  console.warn("getFile is disabled (backend method missing)");
  return null;
}

export async function deleteFile(path: string) {
  console.warn("deleteFile is disabled (backend method missing)");
}

export async function listFiles() {
  console.warn("listFiles is disabled (backend method missing)");
  return [];
}
