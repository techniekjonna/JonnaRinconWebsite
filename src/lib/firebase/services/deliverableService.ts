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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config';
import { ClientDeliverable } from '../types';

class DeliverableService {
  private collectionName = 'clientDeliverables';

  async getAll(): Promise<ClientDeliverable[]> {
    const q = query(collection(db, this.collectionName), orderBy('completedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ClientDeliverable));
  }

  async getByClientEmail(email: string): Promise<ClientDeliverable[]> {
    const q = query(
      collection(db, this.collectionName),
      where('clientEmail', '==', email.toLowerCase().trim()),
      orderBy('completedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ClientDeliverable));
  }

  async getByUserId(userId: string): Promise<ClientDeliverable[]> {
    const q = query(
      collection(db, this.collectionName),
      where('clientUserId', '==', userId),
      orderBy('completedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ClientDeliverable));
  }

  async getById(id: string): Promise<ClientDeliverable | null> {
    const snap = await getDoc(doc(db, this.collectionName, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as ClientDeliverable;
  }

  async create(data: Omit<ClientDeliverable, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const payload: Record<string, unknown> = {
      ...data,
      // clientEmail is optional in the add-deliverable form (can be linked later),
      // so guard against an empty/undefined value instead of assuming it's set.
      clientEmail: (data.clientEmail || '').toLowerCase().trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    // Firestore rejects `undefined` field values (e.g. omitted `notes`/`clientUserId`).
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });
    const ref = await addDoc(collection(db, this.collectionName), payload);
    return ref.id;
  }

  async update(id: string, data: Partial<Omit<ClientDeliverable, 'id' | 'createdAt'>>): Promise<void> {
    await updateDoc(doc(db, this.collectionName, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  // Links (or unlinks, if userId/email are undefined) a deliverable record to a real account.
  async linkToUser(id: string, userId: string, userEmail: string): Promise<void> {
    await updateDoc(doc(db, this.collectionName, id), {
      clientUserId: userId,
      clientEmail: userEmail.toLowerCase().trim(),
      updatedAt: serverTimestamp(),
    });
  }

  async unlinkFromUser(id: string): Promise<void> {
    await updateDoc(doc(db, this.collectionName, id), {
      clientUserId: null,
      updatedAt: serverTimestamp(),
    });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, this.collectionName, id));
  }
}

export const deliverableService = new DeliverableService();
