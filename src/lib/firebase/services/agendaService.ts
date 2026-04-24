import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config';
import { AgendaDay, AgendaTask, AgendaStatus, AgendaStatusType } from '../types';

const DAYS_COLLECTION = 'agendaDays';
const TASKS_COLLECTION = 'agendaTasks';
const STATUSES_COLLECTION = 'agendaStatuses';

// Built-in statuses (not stored in Firestore)
export const BUILT_IN_STATUSES: AgendaStatus[] = [
  {
    id: 'beschikbaar',
    name: 'Beschikbaar',
    color: '#22c55e',
    bgColor: '#16a34a',
    type: 'beschikbaar',
    isBuiltIn: true,
    createdAt: Timestamp.now(),
  },
  {
    id: 'afwezig',
    name: 'Afwezig',
    color: '#ef4444',
    bgColor: '#dc2626',
    type: 'afwezig',
    isBuiltIn: true,
    createdAt: Timestamp.now(),
  },
  {
    id: 'beschikbaar_studio',
    name: 'Beschikbaar voor Studio',
    color: '#8b5cf6',
    bgColor: '#7c3aed',
    type: 'beschikbaar_studio',
    isBuiltIn: true,
    createdAt: Timestamp.now(),
  },
];

// ── AGENDA DAY ─────────────────────────────────────────────────

export const getAgendaDay = async (date: string): Promise<AgendaDay | null> => {
  const ref = doc(db, DAYS_COLLECTION, date);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as AgendaDay;
};

export const getAgendaDaysByMonth = async (year: number, month: number): Promise<AgendaDay[]> => {
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-31`;
  const q = query(
    collection(db, DAYS_COLLECTION),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AgendaDay));
};

export const setAgendaDayStatus = async (
  date: string,
  statusId: string | null,
  statusNote?: string
): Promise<void> => {
  const ref = doc(db, DAYS_COLLECTION, date);
  const existing = await getDoc(ref);
  const now = serverTimestamp();

  if (existing.exists()) {
    await updateDoc(ref, {
      statusId: statusId ?? null,
      statusNote: statusNote ?? '',
      updatedAt: now,
    });
  } else {
    await setDoc(ref, {
      date,
      statusId: statusId ?? null,
      statusNote: statusNote ?? '',
      createdAt: now,
      updatedAt: now,
    });
  }
};

export const linkStudioSession = async (
  date: string,
  orderId: string,
  sessionInfo: AgendaDay['studioSessionInfo']
): Promise<void> => {
  const ref = doc(db, DAYS_COLLECTION, date);
  const existing = await getDoc(ref);
  const now = serverTimestamp();

  if (existing.exists()) {
    await updateDoc(ref, {
      studioSessionOrderId: orderId,
      studioSessionInfo: sessionInfo,
      updatedAt: now,
    });
  } else {
    await setDoc(ref, {
      date,
      studioSessionOrderId: orderId,
      studioSessionInfo: sessionInfo,
      createdAt: now,
      updatedAt: now,
    });
  }
};

// ── AGENDA TASKS ───────────────────────────────────────────────

export const getAgendaTasksByDate = async (date: string): Promise<AgendaTask[]> => {
  const q = query(
    collection(db, TASKS_COLLECTION),
    where('date', '==', date),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AgendaTask));
};

export const getAgendaTasksByMonth = async (year: number, month: number): Promise<AgendaTask[]> => {
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-31`;
  const q = query(
    collection(db, TASKS_COLLECTION),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc'),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AgendaTask));
};

export const createAgendaTask = async (task: Omit<AgendaTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const now = serverTimestamp();
  const ref = await addDoc(collection(db, TASKS_COLLECTION), {
    ...task,
    isCompleted: false,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
};

export const updateAgendaTask = async (id: string, updates: Partial<AgendaTask>): Promise<void> => {
  const ref = doc(db, TASKS_COLLECTION, id);
  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
};

export const deleteAgendaTask = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, TASKS_COLLECTION, id));
};

export const toggleAgendaTaskComplete = async (id: string, isCompleted: boolean): Promise<void> => {
  await updateDoc(doc(db, TASKS_COLLECTION, id), {
    isCompleted,
    updatedAt: serverTimestamp(),
  });
};

// ── AGENDA STATUSES ────────────────────────────────────────────

export const getAgendaStatuses = async (): Promise<AgendaStatus[]> => {
  const snap = await getDocs(query(collection(db, STATUSES_COLLECTION), orderBy('createdAt', 'asc')));
  const custom = snap.docs.map(d => ({ id: d.id, ...d.data() } as AgendaStatus));
  return [...BUILT_IN_STATUSES, ...custom];
};

export const createAgendaStatus = async (
  name: string,
  color: string,
  bgColor: string
): Promise<string> => {
  const ref = await addDoc(collection(db, STATUSES_COLLECTION), {
    name,
    color,
    bgColor,
    type: 'custom' as AgendaStatusType,
    isBuiltIn: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const deleteAgendaStatus = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, STATUSES_COLLECTION, id));
};
