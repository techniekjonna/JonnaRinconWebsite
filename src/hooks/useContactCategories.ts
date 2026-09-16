import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { DEFAULT_CONTACT_CATEGORIES } from '../lib/firebase/services/settingsService';

export const useContactCategories = () => {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CONTACT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'contact'),
      (snap) => {
        const data = snap.data();
        const cats = data?.categories;
        setCategories(Array.isArray(cats) && cats.length > 0 ? cats : DEFAULT_CONTACT_CATEGORIES);
        setLoading(false);
      },
      (error) => {
        console.error('Subscribe to contact categories error:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return { categories, loading };
};
