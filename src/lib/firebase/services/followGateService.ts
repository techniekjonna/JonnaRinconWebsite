import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config';
import { FollowGateCompletion } from '../types';
import { authService } from './authService';

class FollowGateService {
  private collectionName = 'followGateCompletions';

  async createCompletion(data: {
    productId: string;
    productType: 'remix' | 'track' | 'edit' | 'beat';
    productTitle: string;
    artworkUrl?: string;
    audioUrl?: string;
    downloadUrl?: string;
  }): Promise<FollowGateCompletion> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('You must be logged in to access downloads');
    }

    try {
      // Check if user already has an active completion for this product
      const existing = await this.getUserCompletion(user.uid, data.productId);
      if (existing && !this.isExpired(existing.expiresAt)) {
        return existing;
      }

      // Create 30-day expiry
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const completionData = {
        userId: user.uid,
        productId: data.productId,
        productType: data.productType,
        productTitle: data.productTitle,
        artworkUrl: data.artworkUrl || '',
        audioUrl: data.audioUrl || '',
        downloadUrl: data.downloadUrl || data.audioUrl || '',
        followedInstagram: true,
        followedSpotify: true,
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, this.collectionName), completionData);
      const created = await this.getCompletionById(docRef.id);
      if (!created) throw new Error('Failed to create follow gate completion');
      return created;
    } catch (error: any) {
      console.error('Create follow gate completion error:', error);
      throw new Error(error.message || 'Failed to complete follow gate');
    }
  }

  async getCompletionById(id: string): Promise<FollowGateCompletion | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as FollowGateCompletion;
      }
      return null;
    } catch (error: any) {
      console.error('Get completion error:', error);
      return null;
    }
  }

  async getUserCompletion(userId: string, productId: string): Promise<FollowGateCompletion | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('productId', '==', productId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as FollowGateCompletion;
      }
      return null;
    } catch (error: any) {
      console.error('Get user completion error:', error);
      return null;
    }
  }

  async getUserCompletions(userId: string): Promise<FollowGateCompletion[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FollowGateCompletion));
    } catch (error: any) {
      console.error('Get user completions error:', error);
      return [];
    }
  }

  async getActiveCompletions(userId: string): Promise<FollowGateCompletion[]> {
    const all = await this.getUserCompletions(userId);
    return all.filter(c => !this.isExpired(c.expiresAt));
  }

  async deleteCompletion(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, id));
    } catch (error: any) {
      console.error('Delete completion error:', error);
      throw new Error(error.message || 'Failed to delete completion');
    }
  }

  subscribeToUserCompletions(userId: string, callback: (completions: FollowGateCompletion[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId)
    );
    return onSnapshot(q, (snapshot) => {
      const completions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FollowGateCompletion));
      // Sort client-side instead
      completions.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      callback(completions);
    });
  }

  isExpired(expiresAt: Timestamp): boolean {
    return (expiresAt?.toMillis?.() || 0) < Date.now();
  }

  getDaysUntilExpiry(expiresAt: Timestamp): number {
    const diff = (expiresAt?.toMillis?.() || 0) - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}

export const followGateService = new FollowGateService();
