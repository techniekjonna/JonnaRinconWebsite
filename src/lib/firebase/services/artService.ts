import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  QueryConstraint,
  DocumentSnapshot,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config';
import { Art, PaginatedResponse } from '../types';
import { authService } from './authService';
import { cleanFirestoreData } from '../utils/cleanFirestoreData';

class ArtService {
  private collectionName = 'art';

  async getPublishedArt(): Promise<Art[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const art: Art[] = [];
      querySnapshot.forEach((doc) => {
        art.push({ id: doc.id, ...doc.data() } as Art);
      });
      return art;
    } catch (error) {
      console.error('Get published art error:', error);
      return [];
    }
  }

  async createArt(
    artData: Omit<Art, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'lastUpdatedBy'>
  ): Promise<Art> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can create art');
    }

    try {
      const newArt = cleanFirestoreData({
        ...artData,
        views: 0,
        likes: 0,
        createdBy: user.uid,
        lastUpdatedBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const docRef = await addDoc(collection(db, this.collectionName), newArt);
      const createdArt = await this.getArtById(docRef.id);

      if (!createdArt) {
        throw new Error('Failed to retrieve created art');
      }

      return createdArt;
    } catch (error: any) {
      console.error('Create art error:', error);
      throw new Error(error.message || 'Failed to create art');
    }
  }

  async getArtById(id: string): Promise<Art | null> {
    try {
      const artDoc = await getDoc(doc(db, this.collectionName, id));
      if (artDoc.exists()) {
        return { id: artDoc.id, ...artDoc.data() } as Art;
      }
      return null;
    } catch (error) {
      console.error('Get art by ID error:', error);
      return null;
    }
  }

  async getAllArt(options?: {
    pageSize?: number;
    lastDoc?: DocumentSnapshot;
    status?: Art['status'];
    featured?: boolean;
  }): Promise<PaginatedResponse<Art>> {
    try {
      const constraints: QueryConstraint[] = [];

      if (options?.status) {
        constraints.push(where('status', '==', options.status));
      }

      if (options?.featured !== undefined) {
        constraints.push(where('featured', '==', options.featured));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      const pageSize = options?.pageSize || 20;
      constraints.push(limit(pageSize + 1));

      if (options?.lastDoc) {
        constraints.push(startAfter(options.lastDoc));
      }

      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      const art: Art[] = [];
      querySnapshot.forEach((doc) => {
        if (art.length < pageSize) {
          art.push({ id: doc.id, ...doc.data() } as Art);
        }
      });

      const hasMore = querySnapshot.docs.length > pageSize;

      return {
        data: art,
        total: art.length,
        page: 0,
        pageSize,
        hasMore,
      };
    } catch (error) {
      console.error('Get all art error:', error);
      return {
        data: [],
        total: 0,
        page: 0,
        pageSize: options?.pageSize || 20,
        hasMore: false,
      };
    }
  }

  async updateArt(id: string, updates: Partial<Art>): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    try {
      const updateData = cleanFirestoreData({
        ...updates,
        lastUpdatedBy: user.uid,
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, this.collectionName, id), updateData);
    } catch (error: any) {
      console.error('Update art error:', error);
      throw new Error(error.message || 'Failed to update art');
    }
  }

  async deleteArt(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    try {
      await deleteDoc(doc(db, this.collectionName, id));
    } catch (error: any) {
      console.error('Delete art error:', error);
      throw new Error(error.message || 'Failed to delete art');
    }
  }

  async getFeaturedArt(): Promise<Art[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('featured', '==', true),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(6)
      );
      const querySnapshot = await getDocs(q);

      const art: Art[] = [];
      querySnapshot.forEach((doc) => {
        art.push({ id: doc.id, ...doc.data() } as Art);
      });

      return art;
    } catch (error) {
      console.error('Get featured art error:', error);
      return [];
    }
  }

  subscribeToArt(
    callback: (art: Art[]) => void,
    filters?: {
      status?: Art['status'];
      featured?: boolean;
    }
  ): Unsubscribe {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }

    if (filters?.featured !== undefined) {
      constraints.push(where('featured', '==', filters.featured));
    }

    const q = query(collection(db, this.collectionName), ...constraints);

    return onSnapshot(
      q,
      (querySnapshot) => {
        const art: Art[] = [];
        querySnapshot.forEach((doc) => {
          art.push({ id: doc.id, ...doc.data() } as Art);
        });
        callback(art);
      },
      (error) => {
        console.error('Subscribe to art error:', error);
      }
    );
  }

  async incrementViews(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, id), {
        views: increment(1),
      });
    } catch (error) {
      console.error('Increment views error:', error);
    }
  }

  async incrementLikes(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, id), {
        likes: increment(1),
      });
    } catch (error) {
      console.error('Increment likes error:', error);
    }
  }

  /**
   * Get art pieces purchased by a user
   */
  async getUserPurchasedArt(userId: string): Promise<Art[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('soldToUserId', '==', userId),
        orderBy('soldAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const art: Art[] = [];
      querySnapshot.forEach((doc) => {
        art.push({ id: doc.id, ...doc.data() } as Art);
      });
      return art;
    } catch (error) {
      console.error('Get user purchased art error:', error);
      return [];
    }
  }

  /**
   * Mark art as sold and set buyer
   */
  async markAsSold(id: string, userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, id), {
        sold: true,
        soldAt: serverTimestamp(),
        soldToUserId: userId,
      });
    } catch (error: any) {
      console.error('Mark as sold error:', error);
      throw new Error(error.message || 'Failed to mark art as sold');
    }
  }
}

export const artService = new ArtService();
