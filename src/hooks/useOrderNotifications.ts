import { useState, useEffect } from 'react';
import { Order } from '../lib/firebase/types';
import { orderService } from '../lib/firebase/services';

const STORAGE_KEY = 'admin-orders-last-seen';

export const useOrderNotifications = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [newSinceLastSeen, setNewSinceLastSeen] = useState(0);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = orderService.subscribeToOrders((orders: Order[]) => {
        const pending = orders.filter(
          (o) => o.status === 'pending' || o.status === 'processing'
        ).length;
        setPendingCount(pending);

        const lastSeen = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
        const newOrders = orders.filter((o) => {
          const createdMs = (o.createdAt as any)?.seconds
            ? (o.createdAt as any).seconds * 1000
            : 0;
          return createdMs > lastSeen;
        }).length;
        setNewSinceLastSeen(newOrders);
      });
    } catch {
      // Not admin or Firebase not ready — silently skip
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const markOrdersSeen = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setNewSinceLastSeen(0);
  };

  return { pendingCount, newSinceLastSeen, markOrdersSeen };
};
