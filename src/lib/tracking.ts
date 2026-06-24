import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export interface TrackingData {
  mediaId: number;
  type: 'ANIME' | 'MANGA';
  status: 'PLANNING' | 'CURRENT' | 'COMPLETED' | 'DROPPED';
  adaptationScores?: {
    storyAdaptation: number;
    pacing: number;
  };
  updatedAt: number;
}

export async function saveTrackingData(userId: string, data: TrackingData) {
  const docRef = doc(db, `users/${userId}/trackedMedia`, data.mediaId.toString());
  await setDoc(docRef, {
    ...data,
    updatedAt: Date.now(),
  }, { merge: true });
}

export async function getTrackingData(userId: string, mediaId: number): Promise<TrackingData | null> {
  const docRef = doc(db, `users/${userId}/trackedMedia`, mediaId.toString());
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as TrackingData;
  }
  return null;
}
