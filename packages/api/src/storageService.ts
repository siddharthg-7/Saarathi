import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadUserProfileAvatar(uid: string, fileBlobOrBytes: Blob | Uint8Array | ArrayBuffer): Promise<string> {
  const avatarRef = ref(storage, `avatars/${uid}/profile.jpg`);
  const snapshot = await uploadBytes(avatarRef, fileBlobOrBytes);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
}

export async function getFileDownloadUrl(path: string): Promise<string> {
  const fileRef = ref(storage, path);
  return await getDownloadURL(fileRef);
}

export async function deleteStorageFile(path: string): Promise<void> {
  const fileRef = ref(storage, path);
  await deleteObject(fileRef);
}
