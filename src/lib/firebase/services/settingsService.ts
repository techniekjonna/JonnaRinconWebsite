import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config';
import { authService } from './authService';
import type { SiteBackground } from '../types';
import { cleanFirestoreData } from '../utils/cleanFirestoreData';

export interface ShopSettings {
  storeName: string;
  storeDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  featuredEnabled: boolean;
  trendingEnabled: boolean;
  genres: string[];
  currency: string;
  taxRate: number;
  enableDownloads: boolean;
  watermarkPreviews: boolean;
  enabledCustomTabs?: {
    custom1: boolean;
    custom2: boolean;
  };
  updatedAt?: any;
  updatedBy?: string;
}

export interface GeneralSettings {
  platformName: string;
  supportEmail: string;
  websiteUrl: string;
  timezone: string;
  language: string;
  updatedAt?: any;
  updatedBy?: string;
}

export interface NotificationSettings {
  emailOrderNotifications: boolean;
  emailCollaborationNotifications: boolean;
  emailAnalyticsReports: boolean;
  emailSecurityAlerts: boolean;
  emailNewFeatures: boolean;
  pushNotifications: boolean;
  updatedAt?: any;
  updatedBy?: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  passwordMinLength: number;
  sessionTimeout: number;
  enableAutoBackup: boolean;
  backupFrequency: string;
  updatedAt?: any;
  updatedBy?: string;
}

export interface CustomButton {
  label: string;
  url: string;
  color: string;
}

export interface TrackSettings {
  customTab1Enabled: boolean;
  customTab1Label: string;
  customTab2Enabled: boolean;
  customTab2Label: string;
  customButton1?: CustomButton;
  customButton2?: CustomButton;
  updatedAt?: any;
  updatedBy?: string;
}

class SettingsService {
  private collectionName = 'settings';

  async getShopSettings(): Promise<ShopSettings | null> {
    try {
      const docRef = doc(db, this.collectionName, 'shop');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as ShopSettings;
      }
      return null;
    } catch (error: any) {
      console.error('Get shop settings error:', error);
      throw new Error(error.message || 'Failed to get shop settings');
    }
  }

  async saveShopSettings(settings: ShopSettings): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can save settings');
    }

    try {
      const docRef = doc(db, this.collectionName, 'shop');
      const settingsWithMeta = {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      };

      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, settingsWithMeta);
      } else {
        await setDoc(docRef, settingsWithMeta);
      }
    } catch (error: any) {
      console.error('Save shop settings error:', error);
      throw new Error(error.message || 'Failed to save shop settings');
    }
  }

  async getGeneralSettings(): Promise<GeneralSettings | null> {
    try {
      const docRef = doc(db, this.collectionName, 'general');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as GeneralSettings;
      }
      return null;
    } catch (error: any) {
      console.error('Get general settings error:', error);
      throw new Error(error.message || 'Failed to get general settings');
    }
  }

  async saveGeneralSettings(settings: GeneralSettings): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can save settings');
    }

    try {
      const docRef = doc(db, this.collectionName, 'general');
      const settingsWithMeta = {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      };

      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, settingsWithMeta);
      } else {
        await setDoc(docRef, settingsWithMeta);
      }
    } catch (error: any) {
      console.error('Save general settings error:', error);
      throw new Error(error.message || 'Failed to save general settings');
    }
  }

  async getNotificationSettings(): Promise<NotificationSettings | null> {
    try {
      const docRef = doc(db, this.collectionName, 'notifications');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as NotificationSettings;
      }
      return null;
    } catch (error: any) {
      console.error('Get notification settings error:', error);
      throw new Error(error.message || 'Failed to get notification settings');
    }
  }

  async saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can save settings');
    }

    try {
      const docRef = doc(db, this.collectionName, 'notifications');
      const settingsWithMeta = {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      };

      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, settingsWithMeta);
      } else {
        await setDoc(docRef, settingsWithMeta);
      }
    } catch (error: any) {
      console.error('Save notification settings error:', error);
      throw new Error(error.message || 'Failed to save notification settings');
    }
  }

  async getSecuritySettings(): Promise<SecuritySettings | null> {
    try {
      const docRef = doc(db, this.collectionName, 'security');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as SecuritySettings;
      }
      return null;
    } catch (error: any) {
      console.error('Get security settings error:', error);
      throw new Error(error.message || 'Failed to get security settings');
    }
  }

  async saveSecuritySettings(settings: SecuritySettings): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can save settings');
    }

    try {
      const docRef = doc(db, this.collectionName, 'security');
      const settingsWithMeta = {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      };

      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, settingsWithMeta);
      } else {
        await setDoc(docRef, settingsWithMeta);
      }
    } catch (error: any) {
      console.error('Save security settings error:', error);
      throw new Error(error.message || 'Failed to save security settings');
    }
  }

  async getTrackSettings(): Promise<TrackSettings | null> {
    try {
      const docRef = doc(db, this.collectionName, 'tracks');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as TrackSettings;
      }
      return null;
    } catch (error: any) {
      console.error('Get track settings error:', error);
      throw new Error(error.message || 'Failed to get track settings');
    }
  }

  async saveTrackSettings(settings: TrackSettings): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can save settings');
    }

    try {
      const docRef = doc(db, this.collectionName, 'tracks');

      // Filter out undefined values to avoid Firestore errors
      const cleanedSettings = Object.fromEntries(
        Object.entries(settings).filter(([_, value]) => value !== undefined)
      );

      const settingsWithMeta = {
        ...cleanedSettings,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      };

      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, settingsWithMeta);
      } else {
        await setDoc(docRef, settingsWithMeta);
      }
    } catch (error: any) {
      console.error('Save track settings error:', error);
      throw new Error(error.message || 'Failed to save track settings');
    }
  }

  // ============================================
  // BACKGROUND METHODS
  // ============================================

  private backgroundsCollection = 'backgrounds';

  async getBackgrounds(): Promise<SiteBackground[]> {
    try {
      const q = query(
        collection(db, this.backgroundsCollection),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SiteBackground[];
    } catch (error: any) {
      console.error('Get backgrounds error:', error);
      throw new Error(error.message || 'Failed to get backgrounds');
    }
  }

  async getActiveBackground(): Promise<SiteBackground | null> {
    try {
      const q = query(
        collection(db, this.backgroundsCollection),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as SiteBackground;
    } catch (error: any) {
      console.error('Get active background error:', error);
      throw new Error(error.message || 'Failed to get active background');
    }
  }

  async addBackground(imageUrl: string, name?: string): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can manage backgrounds');
    }

    try {
      // Deactivate all current backgrounds
      const batch = writeBatch(db);
      const activeQuery = query(
        collection(db, this.backgroundsCollection),
        where('isActive', '==', true)
      );
      const activeSnapshot = await getDocs(activeQuery);
      activeSnapshot.docs.forEach((activeDoc) => {
        batch.update(activeDoc.ref, { isActive: false });
      });
      await batch.commit();

      // Add new background as active
      const backgroundData = cleanFirestoreData({
        imageUrl,
        name: name || '',
        isActive: true,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });
      const docRef = await addDoc(collection(db, this.backgroundsCollection), backgroundData);

      return docRef.id;
    } catch (error: any) {
      console.error('Add background error:', error);
      throw new Error(error.message || 'Failed to add background');
    }
  }

  async setActiveBackground(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can manage backgrounds');
    }

    try {
      // Deactivate all current backgrounds
      const batch = writeBatch(db);
      const activeQuery = query(
        collection(db, this.backgroundsCollection),
        where('isActive', '==', true)
      );
      const activeSnapshot = await getDocs(activeQuery);
      activeSnapshot.docs.forEach((activeDoc) => {
        batch.update(activeDoc.ref, { isActive: false });
      });

      // Activate the selected background
      const targetRef = doc(db, this.backgroundsCollection, id);
      batch.update(targetRef, { isActive: true });

      await batch.commit();
    } catch (error: any) {
      console.error('Set active background error:', error);
      throw new Error(error.message || 'Failed to set active background');
    }
  }

  async deleteBackground(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can manage backgrounds');
    }

    try {
      await deleteDoc(doc(db, this.backgroundsCollection, id));
    } catch (error: any) {
      console.error('Delete background error:', error);
      throw new Error(error.message || 'Failed to delete background');
    }
  }

  subscribeToBackgrounds(callback: (backgrounds: SiteBackground[]) => void): () => void {
    const q = query(
      collection(db, this.backgroundsCollection)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const backgrounds = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as SiteBackground[];
        // Sort client-side instead
        backgrounds.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        callback(backgrounds);
      },
      (error) => {
        console.error('Subscribe to backgrounds error:', error);
      }
    );

    return unsubscribe;
  }
}

export const settingsService = new SettingsService();
