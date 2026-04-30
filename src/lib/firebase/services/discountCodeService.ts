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
  increment,
  onSnapshot,
  Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config';
import { DiscountCode } from '../types';
import { authService } from './authService';
import { cleanFirestoreData } from '../utils/cleanFirestoreData';

class DiscountCodeService {
  private collectionName = 'discountCodes';

  async createDiscountCode(
    data: Omit<DiscountCode, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'usedCount'>
  ): Promise<DiscountCode> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can create discount codes');
    }

    try {
      const newCode = cleanFirestoreData({
        ...data,
        code: data.code.toUpperCase(),
        usedCount: 0,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const docRef = await addDoc(collection(db, this.collectionName), newCode);
      const createdCode = await this.getDiscountCodeById(docRef.id);

      if (!createdCode) {
        throw new Error('Failed to retrieve created discount code');
      }

      return createdCode;
    } catch (error: any) {
      console.error('Create discount code error:', error);
      throw new Error(error.message || 'Failed to create discount code');
    }
  }

  async getDiscountCodeById(id: string): Promise<DiscountCode | null> {
    try {
      const codeDoc = await getDoc(doc(db, this.collectionName, id));
      if (codeDoc.exists()) {
        return { id: codeDoc.id, ...codeDoc.data() } as DiscountCode;
      }
      return null;
    } catch (error) {
      console.error('Get discount code by ID error:', error);
      return null;
    }
  }

  async getDiscountCodeByCode(code: string): Promise<DiscountCode | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('code', '==', code.toUpperCase())
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const docSnap = querySnapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as DiscountCode;
    } catch (error) {
      console.error('Get discount code by code error:', error);
      return null;
    }
  }

  async getAllDiscountCodes(): Promise<DiscountCode[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const codes: DiscountCode[] = [];
      querySnapshot.forEach((doc) => {
        codes.push({ id: doc.id, ...doc.data() } as DiscountCode);
      });
      return codes;
    } catch (error) {
      console.error('Get all discount codes error:', error);
      return [];
    }
  }

  async getActiveDiscountCodes(): Promise<DiscountCode[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const codes: DiscountCode[] = [];
      querySnapshot.forEach((doc) => {
        codes.push({ id: doc.id, ...doc.data() } as DiscountCode);
      });
      return codes;
    } catch (error) {
      console.error('Get active discount codes error:', error);
      return [];
    }
  }

  async updateDiscountCode(id: string, updates: Partial<DiscountCode>): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can update discount codes');
    }

    try {
      const updateData = cleanFirestoreData({
        ...updates,
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, this.collectionName, id), updateData);
    } catch (error: any) {
      console.error('Update discount code error:', error);
      throw new Error(error.message || 'Failed to update discount code');
    }
  }

  async deleteDiscountCode(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can delete discount codes');
    }

    try {
      await deleteDoc(doc(db, this.collectionName, id));
    } catch (error: any) {
      console.error('Delete discount code error:', error);
      throw new Error(error.message || 'Failed to delete discount code');
    }
  }

  async validateDiscountCode(
    code: string,
    orderTotal: number,
    productIds: string[],
    productTypes: string[]
  ): Promise<{ valid: boolean; discount: DiscountCode | null; error?: string }> {
    try {
      const discountCode = await this.getDiscountCodeByCode(code);

      if (!discountCode) {
        return { valid: false, discount: null, error: 'Discount code not found' };
      }

      if (!discountCode.isActive) {
        return { valid: false, discount: null, error: 'This discount code is no longer active' };
      }

      // Check deadline
      if (discountCode.hasDeadline) {
        const now = Timestamp.now();

        if (discountCode.startDate && now.toMillis() < discountCode.startDate.toMillis()) {
          return { valid: false, discount: null, error: 'This discount code is not yet valid' };
        }

        if (discountCode.endDate && now.toMillis() > discountCode.endDate.toMillis()) {
          return { valid: false, discount: null, error: 'This discount code has expired' };
        }
      }

      // Check usage limit
      if (
        discountCode.usageLimit === 'limited' &&
        discountCode.maxUses !== undefined &&
        discountCode.usedCount >= discountCode.maxUses
      ) {
        return { valid: false, discount: null, error: 'This discount code has reached its usage limit' };
      }

      // Check minimum order amount
      if (
        discountCode.minimumOrderAmount !== undefined &&
        discountCode.minimumOrderAmount > 0 &&
        orderTotal < discountCode.minimumOrderAmount
      ) {
        return {
          valid: false,
          discount: null,
          error: `Minimum order amount of \u20AC${discountCode.minimumOrderAmount.toFixed(2)} required`,
        };
      }

      // Check applicable products
      if (discountCode.applicableTo === 'specific') {
        const hasMatchingProduct =
          (discountCode.productIds &&
            discountCode.productIds.length > 0 &&
            discountCode.productIds.some((id) => productIds.includes(id))) ||
          (discountCode.productTypes &&
            discountCode.productTypes.length > 0 &&
            discountCode.productTypes.some((type) => productTypes.includes(type)));

        if (!hasMatchingProduct) {
          return {
            valid: false,
            discount: null,
            error: 'This discount code does not apply to the products in your cart',
          };
        }
      }

      return { valid: true, discount: discountCode };
    } catch (error) {
      console.error('Validate discount code error:', error);
      return { valid: false, discount: null, error: 'Failed to validate discount code' };
    }
  }

  async useDiscountCode(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, id), {
        usedCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Use discount code error:', error);
    }
  }

  subscribeToDiscountCodes(callback: (codes: DiscountCode[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.collectionName)
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const codes: DiscountCode[] = [];
        querySnapshot.forEach((doc) => {
          codes.push({ id: doc.id, ...doc.data() } as DiscountCode);
        });
        // Sort client-side instead
        codes.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        callback(codes);
      },
      (error) => {
        console.error('Subscribe to discount codes error:', error);
      }
    );
  }
}

export const discountCodeService = new DiscountCodeService();
