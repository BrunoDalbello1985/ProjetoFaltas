import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { SectorItem } from '../types/attendance';

const SECTORS_COLLECTION = 'sectors';
const LOCAL_STORAGE_KEY = 'pagueplay_sectors';

export const DEFAULT_SECTORS: SectorItem[] = [
  {
    id: 'sec-play-5',
    name: 'Play 5',
    gestor: 'Bruno Dalbello',
    color: 'emerald',
    description: 'Equipe de operações Play 5',
    isDefault: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'sec-play-4',
    name: 'Play 4',
    gestor: 'Maria',
    color: 'blue',
    description: 'Equipe de operações Play 4',
    isDefault: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'sec-cofen',
    name: 'Cofen',
    gestor: 'Isabela',
    color: 'indigo',
    description: 'Atendimento e suporte Cofen',
    isDefault: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'sec-play-mix',
    name: 'Play Mix',
    gestor: 'Maria',
    color: 'teal',
    description: 'Equipe integrada Play Mix',
    isDefault: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
];

// Load local fallback
export function getLocalSectors(): SectorItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar setores locais:', e);
  }
  return DEFAULT_SECTORS;
}

export function saveLocalSectors(sectors: SectorItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sectors));
  } catch (e) {
    console.warn('Erro ao salvar setores no storage local:', e);
  }
}

/**
 * Real-time subscription to the sectors collection in Firestore.
 */
export function subscribeToSectors(
  onData: (sectors: SectorItem[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const colRef = collection(db, SECTORS_COLLECTION);

  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      // If collection in Firestore is empty AND local storage has never been initialized
      if (snapshot.empty) {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored === null) {
          // Provision initial default sectors on first run
          seedInitialSectors().catch((err) => {
            console.warn('Falha ao inicializar setores padrão:', err);
          });
          onData(DEFAULT_SECTORS);
          saveLocalSectors(DEFAULT_SECTORS);
          return;
        } else {
          // User might have explicitly deleted all sectors
          const parsed = JSON.parse(stored || '[]');
          onData(Array.isArray(parsed) ? parsed : []);
          return;
        }
      }

      const list: SectorItem[] = [];
      snapshot.forEach((snap) => {
        const data = snap.data() as SectorItem;
        list.push({
          ...data,
          id: snap.id,
        });
      });

      // Sort alphabetically by name
      list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

      saveLocalSectors(list);
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, SECTORS_COLLECTION);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Seeds initial sectors in Firestore if empty.
 */
export async function seedInitialSectors(): Promise<void> {
  try {
    for (const item of DEFAULT_SECTORS) {
      const docRef = doc(db, SECTORS_COLLECTION, item.id);
      await setDoc(docRef, cleanFirestoreObject(item), { merge: true });
    }
  } catch (e) {
    console.warn('Seed de setores adiado:', e);
  }
}

/**
 * Strips keys with undefined values so Firestore never rejects documents.
 */
export function cleanFirestoreObject<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Adds or updates a sector in Firestore with rigorous sanitization.
 */
export async function saveSectorOnline(sector: SectorItem): Promise<SectorItem> {
  const cleanId = (
    sector.id ||
    `sec-${sector.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`
  ).slice(0, 128);

  const cleanData: SectorItem = {
    id: cleanId,
    name: String(sector.name || '').trim().slice(0, 80),
    color: sector.color ? String(sector.color).trim().slice(0, 30) : 'emerald',
    isDefault: !!sector.isDefault,
    createdAt: sector.createdAt || new Date().toISOString(),
  };

  if (sector.gestor && String(sector.gestor).trim()) {
    cleanData.gestor = String(sector.gestor).trim().slice(0, 100);
  }
  if (sector.description && String(sector.description).trim()) {
    cleanData.description = String(sector.description).trim().slice(0, 200);
  }

  const firestorePayload = cleanFirestoreObject(cleanData);
  const docRef = doc(db, SECTORS_COLLECTION, cleanData.id);
  try {
    await setDoc(docRef, firestorePayload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SECTORS_COLLECTION}/${cleanData.id}`);
  }

  // Update local
  const current = getLocalSectors();
  const exists = current.find((s) => s.id === cleanData.id || s.name.toLowerCase() === cleanData.name.toLowerCase());
  if (exists) {
    const updated = current.map((s) => (s.id === exists.id ? cleanData : s));
    saveLocalSectors(updated);
  } else {
    saveLocalSectors([...current, cleanData]);
  }

  return cleanData;
}

/**
 * Deletes a sector from Firestore.
 */
export async function deleteSectorOnline(sectorId: string): Promise<void> {
  const docRef = doc(db, SECTORS_COLLECTION, sectorId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${SECTORS_COLLECTION}/${sectorId}`);
  }

  // Update local
  const current = getLocalSectors();
  saveLocalSectors(current.filter((s) => s.id !== sectorId));
}

/**
 * Ensures a list of sector names exist in the database (used e.g. when importing spreadsheets).
 */
export async function ensureSectorsExist(sectorNames: string[]): Promise<void> {
  const current = getLocalSectors();
  const existingNames = new Set(current.map((s) => s.name.toLowerCase().trim()));

  for (const rawName of sectorNames) {
    const trimmed = (rawName || '').trim();
    if (!trimmed) continue;
    if (!existingNames.has(trimmed.toLowerCase())) {
      const newSec: SectorItem = {
        id: `sec-${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`,
        name: trimmed,
        color: 'sky',
        description: 'Setor adicionado automaticamente via lançamento',
        createdAt: new Date().toISOString(),
      };
      existingNames.add(trimmed.toLowerCase());
      try {
        await saveSectorOnline(newSec);
      } catch (err) {
        console.warn('Erro ao auto-cadastrar setor:', trimmed, err);
      }
    }
  }
}

/**
 * Restores the default system sectors in Firestore.
 */
export async function restoreDefaultSectors(): Promise<SectorItem[]> {
  for (const item of DEFAULT_SECTORS) {
    await saveSectorOnline(item);
  }
  return DEFAULT_SECTORS;
}
