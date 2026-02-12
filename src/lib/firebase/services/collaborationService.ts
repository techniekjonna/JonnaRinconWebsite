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
  serverTimestamp,
  QueryConstraint,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config';
import { Collaboration, CollaborationStatus, CollaborationType } from '../types';
import { authService } from './authService';

class CollaborationService {
  private collectionName = 'collaborations';

  // ✅ NIEUWE FUNCTIE - getAll()
  async getAll(): Promise<Collaboration[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      const collaborations: Collaboration[] = [];
      querySnapshot.forEach((doc) => {
        collaborations.push({ id: doc.id, ...doc.data() } as Collaboration);
      });
      return collaborations;
    } catch (error) {
      console.error('Get all collaborations error:', error);
      return [];
    }
  }

  async createCollaboration(
    collabData: Omit<Collaboration, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'paidAmount'>
  ): Promise<Collaboration> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can create collaborations');
    }

    try {
      const newCollab = {
        ...collabData,
        paidAmount: 0,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, this.collectionName), newCollab);
      const createdCollab = await this.getCollaborationById(docRef.id);

      if (!createdCollab) {
        throw new Error('Failed to retrieve created collaboration');
      }

      return createdCollab;
    } catch (error: any) {
      console.error('Create collaboration error:', error);
      throw new Error(error.message || 'Failed to create collaboration');
    }
  }

  async getCollaborationById(id: string): Promise<Collaboration | null> {
    try {
      const collabDoc = await getDoc(doc(db, this.collectionName, id));
      if (collabDoc.exists()) {
        return { id: collabDoc.id, ...collabDoc.data() } as Collaboration;
      }
      return null;
    } catch (error) {
      console.error('Get collaboration by ID error:', error);
      return null;
    }
  }

  async getAllCollaborations(options?: {
    status?: CollaborationStatus;
    type?: CollaborationType;
    limitCount?: number;
  }): Promise<Collaboration[]> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can view collaborations');
    }

    try {
      const constraints: QueryConstraint[] = [];

      if (options?.status) {
        constraints.push(where('status', '==', options.status));
      }

      if (options?.type) {
        constraints.push(where('type', '==', options.type));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      if (options?.limitCount) {
        constraints.push(limit(options.limitCount));
      }

      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      const collaborations: Collaboration[] = [];
      querySnapshot.forEach((doc) => {
        collaborations.push({ id: doc.id, ...doc.data() } as Collaboration);
      });

      return collaborations;
    } catch (error) {
      console.error('Get all collaborations error:', error);
      throw new Error('Failed to fetch collaborations');
    }
  }

  async updateCollaboration(id: string, updates: Partial<Collaboration>): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    try {
      await updateDoc(doc(db, this.collectionName, id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Update collaboration error:', error);
      throw new Error(error.message || 'Failed to update collaboration');
    }
  }

  async deleteCollaboration(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    try {
      await deleteDoc(doc(db, this.collectionName, id));
    } catch (error: any) {
      console.error('Delete collaboration error:', error);
      throw new Error(error.message || 'Failed to delete collaboration');
    }
  }

  // Real-time subscription to collaborations
  subscribeToCollaborations(
    callback: (collaborations: Collaboration[]) => void,
    filters?: {
      status?: CollaborationStatus;
      type?: CollaborationType;
    }
  ): Unsubscribe {
    try {
      const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }

      if (filters?.type) {
        constraints.push(where('type', '==', filters.type));
      }

      const q = query(collection(db, this.collectionName), ...constraints);

      return onSnapshot(q, (snapshot) => {
        const collaborations: Collaboration[] = [];
        snapshot.forEach((doc) => {
          collaborations.push({ id: doc.id, ...doc.data() } as Collaboration);
        });
        callback(collaborations);
      });
    } catch (error) {
      console.error('Subscribe to collaborations error:', error);
      return () => {};
    }
  }

  // Get collaboration statistics
  async getCollaborationStats(): Promise<{
    total: number;
    active: number;
    completed: number;
    totalRevenue: number;
    pendingRevenue: number;
  }> {
    try {
      const collaborations = await this.getAll();

      const stats = {
        total: collaborations.length,
        active: collaborations.filter((c) =>
          ['agreed', 'contract_sent', 'signed', 'in_progress'].includes(c.status)
        ).length,
        completed: collaborations.filter((c) => c.status === 'completed').length,
        totalRevenue: collaborations.reduce((sum, c) => sum + c.paidAmount, 0),
        pendingRevenue: collaborations.reduce(
          (sum, c) => sum + (c.budget - c.paidAmount),
          0
        ),
      };

      return stats;
    } catch (error) {
      console.error('Get collaboration stats error:', error);
      return {
        total: 0,
        active: 0,
        completed: 0,
        totalRevenue: 0,
        pendingRevenue: 0,
      };
    }
  }
}

export const collaborationService = new CollaborationService();