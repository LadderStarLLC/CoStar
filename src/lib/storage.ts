import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app from './firebase';

export const storage = app ? getStorage(app) : null;

export async function uploadProfileImage(uid: string, file: File): Promise<string> {
  if (!storage) throw new Error('Firebase Storage not initialized');
  if (file.size > 10 * 1024 * 1024) throw new Error('Profile images must be under 10MB.');
  if (!file.type.startsWith('image/')) throw new Error('Upload an image file.');
  
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `profiles/${uid}/avatar_${Date.now()}.${ext}`;
  const storageRef = ref(storage, fileName);
  
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

export async function uploadResume(uid: string, file: File): Promise<{ url: string; path: string }> {
  if (!storage) throw new Error('Firebase Storage not initialized');
  if (file.size > 5 * 1024 * 1024) throw new Error('Resumes must be under 5MB.');
  if (file.type !== 'application/pdf') throw new Error('Upload a PDF resume.');

  const fileName = `profiles/${uid}/resume_${Date.now()}.pdf`;
  const storageRef = ref(storage, fileName);

  await uploadBytes(storageRef, file);
  return {
    url: await getDownloadURL(storageRef),
    path: fileName,
  };
}
