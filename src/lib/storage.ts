import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export async function uploadItemImage(
  storeSlug: string,
  itemId: string,
  file: File
): Promise<string> {
  const filename = `${Date.now()}-${file.name}`;
  const storageRef = ref(storage, `stores/${storeSlug}/items/${itemId}/${filename}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
