import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config';
import { authService } from './authService';
import { cleanFirestoreData } from '../utils/cleanFirestoreData';

export interface PromoButton {
  id: string;
  label: string;
  url: string;
  variant: 'primary' | 'secondary';
}

export interface PromoSectionData {
  enabled: boolean;
  upperTitle: string;
  title: string;
  subtitle: string;
  images: string[];
  buttons: PromoButton[];
  trackId?: string;
  trackTitle?: string;
  trackArtist?: string;
  trackAudioUrl?: string;
  trackArtworkUrl?: string;
  updatedAt?: any;
  updatedBy?: string;
}

const DEFAULT: PromoSectionData = {
  enabled: false,
  upperTitle: '',
  title: '',
  subtitle: '',
  images: [],
  buttons: [],
};

class PromoSectionService {
  private ref = () => doc(db, 'settings', 'promoSection');

  async get(): Promise<PromoSectionData> {
    try {
      const snap = await getDoc(this.ref());
      if (snap.exists()) return snap.data() as PromoSectionData;
      return { ...DEFAULT };
    } catch (error: any) {
      console.error('Get promo section error:', error);
      return { ...DEFAULT };
    }
  }

  async save(data: PromoSectionData): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') throw new Error('Unauthorized: Only admins can save promo settings');
    try {
      const cleaned = cleanFirestoreData({
        ...data,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });
      const snap = await getDoc(this.ref());
      if (snap.exists()) {
        await updateDoc(this.ref(), cleaned);
      } else {
        await setDoc(this.ref(), cleaned);
      }
    } catch (error: any) {
      console.error('Save promo section error:', error);
      throw new Error(error.message || 'Failed to save promo section');
    }
  }
}

export const promoSectionService = new PromoSectionService();
