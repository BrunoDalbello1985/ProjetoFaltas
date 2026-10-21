import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { AttendanceRecord } from '../types/attendance';
import { INITIAL_ATTENDANCE_DATA } from '../data/initialData';
import { 
  supabase, 
  fetchSupabaseAttendanceRecords, 
  saveRecordToSupabase, 
  deleteRecordFromSupabase, 
  seedSupabaseInitialData,
  mapRowToAttendanceRecord 
} from '../supabase';

const COLLECTION_NAME = 'attendance_records';

/**
 * Sanitize attendance record to ensure strict compliance with schema and exact spreadsheet formula:
 * Faltas Injustificadas = Total de Faltas - Dias de Atestado (= D - E)
 */
export function sanitizeRecord(record: AttendanceRecord, userIdentifier?: string | null): AttendanceRecord {
  const atestado = Math.max(0, Number(record.diasAtestado) || 0);
  const total = Math.max(0, Number(record.qtdeFaltas) || 0);
  // Regra fundamental: Total de ausências menos o total de dias de atestado
  const injustificadas = Math.max(0, total - atestado);

  const result: AttendanceRecord = {
    id: String(record.id || `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`).trim(),
    data: String(record.data || new Date().toISOString().slice(0, 10)).trim(),
    nome: String(record.nome || 'Sem Nome').trim().slice(0, 100).toUpperCase(),
    setor: String(record.setor || 'Play 5').trim().slice(0, 80),
    qtdeFaltas: total,
    diasAtestado: atestado,
    faltasInjustificadas: injustificadas,
    semana: String(record.semana || '3ª semana').trim().slice(0, 50),
    mes: String(record.mes || 'setembro').trim().toLowerCase().slice(0, 50),
    ano: Number(record.ano) || new Date().getFullYear(),
    updatedAt: new Date().toISOString(),
    updatedBy: userIdentifier ? userIdentifier.slice(0, 100) : 'Colaborador Online',
  };

  if (record.gestor && String(record.gestor).trim()) {
    result.gestor = String(record.gestor).trim().slice(0, 100);
  }
  if (record.observacoes && String(record.observacoes).trim()) {
    result.observacoes = String(record.observacoes).trim().slice(0, 500);
  }

  // Ensure absolutely no undefined values
  const cleaned: any = {};
  for (const [key, value] of Object.entries(result)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }

  return cleaned as AttendanceRecord;
}

/**
 * Tests whether Supabase table attendance_records exists and is operational
 */
export async function checkSupabaseHealth(): Promise<'connected' | 'table_missing' | 'error'> {
  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01' || error.message.toLowerCase().includes('relation') || error.message.toLowerCase().includes('does not exist')) {
        return 'table_missing';
      }
      return 'error';
    }
    return 'connected';
  } catch {
    return 'error';
  }
}

/**
 * Seeds initial spreadsheet data to Firestore if the collection is empty.
 */
export async function seedInitialSpreadsheetData(userIdentifier?: string | null): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const item of INITIAL_ATTENDANCE_DATA) {
      const docRef = doc(db, COLLECTION_NAME, item.id);
      const cleanItem = sanitizeRecord(item, userIdentifier);
      batch.set(docRef, cleanItem);
    }
    await batch.commit();
    console.info("Planilha inicial gravada com sucesso no Firestore online!");
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
  }
}

/**
 * Subscribes in real-time to the online attendance records.
 * Listens to Firestore, and syncs with Supabase when available.
 */
export function subscribeToAttendanceRecords(
  onData: (records: AttendanceRecord[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, COLLECTION_NAME);

  // Firestore real-time listener
  const unsubscribeFirestore = onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        // Initial online database provisioning: populate default spreadsheet records
        seedInitialSpreadsheetData().catch((err) => {
          console.error("Falha ao inicializar dados padrão na nuvem:", err);
        });
        onData(INITIAL_ATTENDANCE_DATA);
        return;
      }

      const records: AttendanceRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as AttendanceRecord;
        records.push({
          ...data,
          id: docSnap.id,
        });
      });

      // Default sort by employee name
      records.sort((a, b) => a.nome.localeCompare(b.nome));
      onData(records);
    },
    (error) => {
      // Must use handleFirestoreError callback per Firebase Skill guideline
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      if (onError) {
        onError(error);
      }
    }
  );

  // Supabase real-time channel
  let supabaseChannel: any = null;
  try {
    supabaseChannel = supabase
      .channel('public:attendance_records')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_records' },
        async () => {
          // When Supabase gets an update, refresh from Supabase if connected
          try {
            const records = await fetchSupabaseAttendanceRecords();
            if (records.length > 0) {
              onData(records);
            }
          } catch {
            // Ignore if table not created
          }
        }
      )
      .subscribe();
  } catch (e) {
    console.warn("Supabase realtime subscription deferred:", e);
  }

  return () => {
    unsubscribeFirestore();
    if (supabaseChannel) {
      supabase.removeChannel(supabaseChannel);
    }
  };
}

/**
 * Saves or updates an attendance record online in Firestore AND Supabase.
 */
export async function saveAttendanceRecordOnline(
  record: AttendanceRecord,
  userIdentifier?: string | null
): Promise<void> {
  const clean = sanitizeRecord(record, userIdentifier);
  const docRef = doc(db, COLLECTION_NAME, clean.id);

  // 1. Save to Firestore
  try {
    await setDoc(docRef, clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${clean.id}`);
  }

  // 2. Also save to Supabase (best-effort dual-write)
  try {
    await saveRecordToSupabase(clean, userIdentifier);
  } catch (err) {
    console.warn("Supabase sync pending (run SQL setup if table is missing):", err);
  }
}

/**
 * Deletes an attendance record from both online databases.
 */
export async function deleteAttendanceRecordOnline(recordId: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, recordId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${recordId}`);
  }

  try {
    await deleteRecordFromSupabase(recordId);
  } catch (err) {
    console.warn("Supabase delete pending:", err);
  }
}

/**
 * Sync all current records directly to Supabase
 */
export async function syncAllRecordsToSupabase(records: AttendanceRecord[], userIdentifier?: string | null): Promise<void> {
  const rows = records.map((r) => sanitizeRecord(r, userIdentifier));
  for (const r of rows) {
    await saveRecordToSupabase(r, userIdentifier);
  }
}

/**
 * Restores all standard records to Firestore and Supabase.
 */
export async function restoreDefaultOnlineData(userIdentifier?: string | null): Promise<void> {
  await seedInitialSpreadsheetData(userIdentifier);
  try {
    await seedSupabaseInitialData(userIdentifier);
  } catch (err) {
    console.warn("Supabase seed pending:", err);
  }
}

/**
 * Batch imports an array of records into Firestore and Supabase.
 * If replaceAll is true, deletes existing records first.
 */
export async function batchImportAttendanceRecordsOnline(
  newRecords: AttendanceRecord[],
  replaceAll: boolean,
  userIdentifier?: string | null
): Promise<{ success: boolean; count: number }> {
  try {
    // If replaceAll, fetch existing documents and delete them
    if (replaceAll) {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      if (!snap.empty) {
        // Delete in chunks of 400
        const docs = snap.docs;
        for (let i = 0; i < docs.length; i += 400) {
          const chunk = docs.slice(i, i + 400);
          const delBatch = writeBatch(db);
          chunk.forEach((d) => delBatch.delete(d.ref));
          await delBatch.commit();
        }
      }
    }

    // Write new records in batches of up to 400
    const BATCH_SIZE = 400;
    for (let i = 0; i < newRecords.length; i += BATCH_SIZE) {
      const chunk = newRecords.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      for (const rec of chunk) {
        const clean = sanitizeRecord(rec, userIdentifier);
        const docRef = doc(db, COLLECTION_NAME, clean.id);
        batch.set(docRef, clean);
      }
      await batch.commit();
    }

    // Dual-write best-effort to Supabase
    try {
      await syncAllRecordsToSupabase(newRecords, userIdentifier);
    } catch (e) {
      console.warn("Supabase dual-sync deferred:", e);
    }

    return { success: true, count: newRecords.length };
  } catch (error) {
    console.error("Erro na importação em lote:", error);
    throw error;
  }
}

/**
 * Reassigns all attendance records from one sector to another.
 */
export async function reassignSectorForRecords(
  oldSectorName: string,
  newSectorName: string,
  userIdentifier?: string | null
): Promise<number> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('setor', '==', oldSectorName));
    const snap = await getDocs(q);
    if (snap.empty) return 0;

    const batch = writeBatch(db);
    let count = 0;
    snap.forEach((docSnap) => {
      const data = docSnap.data() as AttendanceRecord;
      const updated = sanitizeRecord({ ...data, setor: newSectorName }, userIdentifier);
      batch.set(docSnap.ref, updated, { merge: true });
      count++;
    });

    await batch.commit();
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/reassign`);
    return 0;
  }
}

/**
 * Renames an employee across all attendance records in Firestore.
 */
export async function renameEmployeeInRecords(
  oldName: string,
  newName: string,
  userIdentifier?: string | null
): Promise<number> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('nome', '==', oldName.trim().toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) return 0;

    const batch = writeBatch(db);
    let count = 0;
    snap.forEach((docSnap) => {
      const data = docSnap.data() as AttendanceRecord;
      const updated = sanitizeRecord({ ...data, nome: newName.trim().toUpperCase() }, userIdentifier);
      batch.set(docSnap.ref, updated, { merge: true });
      count++;
    });

    await batch.commit();
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/rename-colab`);
    return 0;
  }
}

/**
 * Deletes an employee and all their associated attendance records.
 */
export async function deleteEmployeeAndRecords(
  employeeName: string
): Promise<number> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('nome', '==', employeeName.trim().toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) return 0;

    const batch = writeBatch(db);
    let count = 0;
    snap.forEach((docSnap) => {
      batch.delete(docSnap.ref);
      count++;
    });

    await batch.commit();
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/delete-colab`);
    return 0;
  }
}

/**
 * Deletes all attendance records belonging to a sector.
 */
export async function deleteRecordsBySector(
  sectorName: string
): Promise<number> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('setor', '==', sectorName.trim()));
    const snap = await getDocs(q);
    if (snap.empty) return 0;

    const batch = writeBatch(db);
    let count = 0;
    snap.forEach((docSnap) => {
      batch.delete(docSnap.ref);
      count++;
    });

    await batch.commit();
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/delete-sector-records`);
    return 0;
  }
}

/**
 * Renames a manager (gestor) across all records where they are assigned.
 */
export async function renameGestorInRecords(
  oldGestor: string,
  newGestor: string,
  userIdentifier?: string | null
): Promise<number> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('gestor', '==', oldGestor.trim()));
    const snap = await getDocs(q);
    if (snap.empty) return 0;

    const batch = writeBatch(db);
    let count = 0;
    snap.forEach((docSnap) => {
      const data = docSnap.data() as AttendanceRecord;
      const updated = sanitizeRecord({ ...data, gestor: newGestor.trim() }, userIdentifier);
      batch.set(docSnap.ref, updated, { merge: true });
      count++;
    });

    await batch.commit();
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/rename-gestor`);
    return 0;
  }
}
