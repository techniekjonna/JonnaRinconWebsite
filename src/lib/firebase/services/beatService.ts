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
import { Beat, PaginatedResponse } from '../types';
import { authService } from './authService';

// Whether a beat should appear in public listings/search (shop grids, carousels,
// trending/featured rails, related-content widgets). Beats with no `visibility`
// field, or `visibility: 'public'`, are shown — this is the pre-existing default
// behavior and is unchanged. `'private-link'` and `'private-user'` beats are
// excluded from every public listing (a `'private-link'` beat's own detail page
// still renders for anyone with the direct URL; see BeatDetailPage).
export function isBeatPubliclyVisible(beat: Pick<Beat, 'visibility'>): boolean {
  return !beat.visibility || beat.visibility === 'public';
}

class BeatService {
  private collectionName = 'beats';

  // ✅ NIEUWE FUNCTIE - getPublishedBeats()
  async getPublishedBeats(): Promise<Beat[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const beats: Beat[] = [];
      querySnapshot.forEach((doc) => {
        beats.push({ id: doc.id, ...doc.data() } as Beat);
      });
      return beats.filter(isBeatPubliclyVisible);
    } catch (error) {
      console.error('Get published beats error:', error);
      return [];
    }
  }

  async createBeat(beatData: Omit<Beat, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'lastUpdatedBy'>): Promise<Beat> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can create beats');
    }

    try {
      const newBeat = {
        ...beatData,
        plays: 0,
        downloads: 0,
        likes: 0,
        createdBy: user.uid,
        lastUpdatedBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, this.collectionName), newBeat);
      const createdBeat = await this.getBeatById(docRef.id);

      if (!createdBeat) {
        throw new Error('Failed to retrieve created beat');
      }

      return createdBeat;
    } catch (error: any) {
      console.error('Create beat error:', error);
      throw new Error(error.message || 'Failed to create beat');
    }
  }

  async getBeatById(id: string): Promise<Beat | null> {
    try {
      const beatDoc = await getDoc(doc(db, this.collectionName, id));
      if (beatDoc.exists()) {
        return { id: beatDoc.id, ...beatDoc.data() } as Beat;
      }
      return null;
    } catch (error) {
      console.error('Get beat by ID error:', error);
      return null;
    }
  }

  async getAllBeats(options?: {
    pageSize?: number;
    lastDoc?: DocumentSnapshot;
    status?: Beat['status'];
    genre?: string;
    featured?: boolean;
  }): Promise<PaginatedResponse<Beat>> {
    try {
      const constraints: QueryConstraint[] = [];

      if (options?.status) {
        constraints.push(where('status', '==', options.status));
      }

      if (options?.genre) {
        constraints.push(where('genre', '==', options.genre));
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

      const beats: Beat[] = [];
      querySnapshot.forEach((doc) => {
        if (beats.length < pageSize) {
          beats.push({ id: doc.id, ...doc.data() } as Beat);
        }
      });

      const hasMore = querySnapshot.docs.length > pageSize;

      return {
        data: beats,
        total: beats.length,
        page: 0,
        pageSize,
        hasMore,
      };
    } catch (error) {
      console.error('Get all beats error:', error);
      return {
        data: [],
        total: 0,
        page: 0,
        pageSize: options?.pageSize || 20,
        hasMore: false,
      };
    }
  }

  async updateBeat(id: string, updates: Partial<Beat>): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    try {
      await updateDoc(doc(db, this.collectionName, id), {
        ...updates,
        lastUpdatedBy: user.uid,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Update beat error:', error);
      throw new Error(error.message || 'Failed to update beat');
    }
  }

  async deleteBeat(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    try {
      await deleteDoc(doc(db, this.collectionName, id));
    } catch (error: any) {
      console.error('Delete beat error:', error);
      throw new Error(error.message || 'Failed to delete beat');
    }
  }

  async getFeaturedBeats(): Promise<Beat[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('featured', '==', true),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(6)
      );
      const querySnapshot = await getDocs(q);

      const beats: Beat[] = [];
      querySnapshot.forEach((doc) => {
        beats.push({ id: doc.id, ...doc.data() } as Beat);
      });

      return beats.filter(isBeatPubliclyVisible);
    } catch (error) {
      console.error('Get featured beats error:', error);
      return [];
    }
  }

  async getTrendingBeats(): Promise<Beat[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('trending', '==', true),
        where('status', '==', 'published'),
        orderBy('plays', 'desc'),
        limit(10)
      );
      const querySnapshot = await getDocs(q);

      const beats: Beat[] = [];
      querySnapshot.forEach((doc) => {
        beats.push({ id: doc.id, ...doc.data() } as Beat);
      });

      return beats.filter(isBeatPubliclyVisible);
    } catch (error) {
      console.error('Get trending beats error:', error);
      return [];
    }
  }

  async getGenres(): Promise<string[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      const genres = new Set<string>();

      querySnapshot.forEach((doc) => {
        const beat = doc.data() as Beat;
        if (beat.genre) {
          genres.add(beat.genre);
        }
      });

      return Array.from(genres).sort();
    } catch (error) {
      console.error('Get genres error:', error);
      return [];
    }
  }

  subscribeToBeats(
    callback: (beats: Beat[]) => void,
    filters?: {
      status?: Beat['status'];
      featured?: boolean;
      genre?: string;
    }
  ): Unsubscribe {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }

    if (filters?.featured !== undefined) {
      constraints.push(where('featured', '==', filters.featured));
    }

    if (filters?.genre) {
      constraints.push(where('genre', '==', filters.genre));
    }

    const q = query(collection(db, this.collectionName), ...constraints);

    return onSnapshot(
      q,
      (querySnapshot) => {
        let beats: Beat[] = [];
        querySnapshot.forEach((doc) => {
          beats.push({ id: doc.id, ...doc.data() } as Beat);
        });
        // A `status: 'published'` filter is this codebase's convention for a
        // public-facing listing (shop pages, previews, related content), so
        // beats with 'private-link'/'private-user' visibility are excluded
        // here too. Admin/manager subscribe with no status filter and
        // continue to see every beat, including private ones.
        if (filters?.status === 'published') {
          beats = beats.filter(isBeatPubliclyVisible);
        }
        callback(beats);
      },
      (error) => {
        console.error('Subscribe to beats error:', error);
      }
    );
  }

  async incrementPlays(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, id), {
        plays: increment(1),
      });
    } catch (error) {
      console.error('Increment plays error:', error);
    }
  }

  async incrementDownloads(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, id), {
        downloads: increment(1),
      });
    } catch (error) {
      console.error('Increment downloads error:', error);
    }
  }
}

export const beatService = new BeatService();