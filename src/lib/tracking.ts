import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export interface TrackingData {
  mediaId: number;
  title: string;
  coverImage: string;
  type: 'ANIME' | 'MANGA';
  status: 'PLANNING' | 'CURRENT' | 'COMPLETED' | 'DROPPED';
  adaptationScores?: {
    story: number;
    pacing: number;
  };
  classification?: {
    genres?: string[];
    tags?: string[];
    length?: string;
    romanceLevel?: string;
    confessionTiming?: string;
    intimacyLevel?: string;
    relationshipDynamics?: string;
    wholesomeLewdScale?: number;
    comedySeriousScale?: number;
    actionDialogScale?: number;
    pacingScale?: number;
    summary?: string;
  };
  evaluation?: {
    story?: number;
    characters?: number;
    setting?: number;
    animation?: number;
    artstyle?: number;
    romance?: number;
    ending?: number;
    supportingCast?: number;
    antagonist?: number;
    rewatchValue?: number;
    immersion?: number;
    emotionalImpact?: string;
    overallScore?: number;
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

import { collection, getDocs } from 'firebase/firestore';

export async function getAllTrackingData(userId: string): Promise<TrackingData[]> {
  const collRef = collection(db, `users/${userId}/trackedMedia`);
  const snapshot = await getDocs(collRef);
  const data: TrackingData[] = [];
  snapshot.forEach(doc => {
    data.push(doc.data() as TrackingData);
  });
  return data;
}
