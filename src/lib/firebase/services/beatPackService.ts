import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config';
import { BeatPack } from '../types';
import { authService } from './authService';

class BeatPackService {
  private col = 'beatPacks';

  subscribeToPacks(callback: (packs: BeatPack[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.col),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BeatPack)));
    });
  }

  async getAllPacks(): Promise<BeatPack[]> {
    const q = query(collection(db, this.col), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BeatPack));
  }

  async createPack(data: Omit<BeatPack, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> {
    const user = authService.getCurrentUser();
    const ref = await addDoc(collection(db, this.col), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user?.uid || 'admin',
    });
    return ref.id;
  }

  async updatePack(id: string, data: Partial<BeatPack>): Promise<void> {
    await updateDoc(doc(db, this.col, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  async deletePack(id: string): Promise<void> {
    await deleteDoc(doc(db, this.col, id));
  }
}

export const beatPackService = new BeatPackService();
