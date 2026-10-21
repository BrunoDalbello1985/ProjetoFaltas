import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AttendanceRecord } from './types/attendance';
import { INITIAL_ATTENDANCE_DATA } from './data/initialData';

// User Supabase Project Settings
export const DEFAULT_SUPABASE_URL = 'https://marcioffwsbftmtbvrxs.supabase.co';
export const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_jx4n0umb1vGGoIcYD4Ub6g_ORuyi5wO';
export const DEFAULT_SUPABASE_SECRET_KEY =
  'sb_secret_mRVX5194dAiqk7wI9XuLug_zSuG97FI';
export const DEFAULT_SUPABASE_JWKS_URL =
  'https://marcioffwsbftmtbvrxs.supabase.co/auth/v1/.well-known/jwks.json';

/**
 * Validate and safely obtain a clean Supabase URL.
 * Guard against environment variables containing text like app titles.
 */
function resolveSupabaseUrl(): string {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  if (typeof envUrl === 'string') {
    const trimmed = envUrl.trim();
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
      try {
        new URL(trimmed);
        return trimmed;
      } catch {
        // invalid URL format, ignore and use default
      }
    }
  }
  return DEFAULT_SUPABASE_URL;
}

/**
 * Validate and safely obtain a clean Supabase Publishable / Anon Key.
 */
function resolveSupabaseAnonKey(): string {
  const envKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (typeof envKey === 'string') {
    const trimmed = envKey.trim();
    // Valid Supabase anon or publishable keys do not have whitespace and are sufficiently long
    if (trimmed.length > 20 && !trimmed.includes(' ')) {
      return trimmed;
    }
  }
  return DEFAULT_SUPABASE_PUBLISHABLE_KEY;
}

export const SUPABASE_URL = resolveSupabaseUrl();
export const SUPABASE_ANON_KEY = resolveSupabaseAnonKey();

// Create safe Supabase client
function initSupabaseClient(): SupabaseClient {
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.error('Falha ao inicializar o Supabase com parâmetros personalizados, usando padrão seguro:', err);
    return createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_PUBLISHABLE_KEY);
  }
}

export const supabase = initSupabaseClient();

export const SUPABASE_SETUP_SQL = `-- Executar no SQL Editor do Supabase (https://marcioffwsbftmtbvrxs.supabase.co/project/marcioffwsbftmtbvrxs/sql):

CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  nome TEXT NOT NULL,
  setor TEXT NOT NULL,
  qtde_faltas INTEGER NOT NULL DEFAULT 0,
  dias_atestado INTEGER NOT NULL DEFAULT 0,
  faltas_injustificadas INTEGER NOT NULL DEFAULT 0,
  semana TEXT NOT NULL,
  mes TEXT NOT NULL,
  ano INTEGER NOT NULL,
  gestor TEXT,
  observacoes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

-- Habilitar RLS (Row Level Security) e permitir acesso pela chave anônima/publicável
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura publica" ON attendance_records;
CREATE POLICY "Permitir leitura publica" ON attendance_records FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercao publica" ON attendance_records;
CREATE POLICY "Permitir insercao publica" ON attendance_records FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualizacao publica" ON attendance_records;
CREATE POLICY "Permitir atualizacao publica" ON attendance_records FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir exclusao publica" ON attendance_records;
CREATE POLICY "Permitir exclusao publica" ON attendance_records FOR DELETE USING (true);

-- Ativar publicação em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_records;
`;

// Helper: map DB row (snake_case or camelCase) to AttendanceRecord
export function mapRowToAttendanceRecord(row: any): AttendanceRecord {
  return {
    id: String(row.id),
    data: String(row.data || new Date().toISOString().slice(0, 10)),
    nome: String(row.nome || 'Sem Nome'),
    setor: (['Play 5', 'Play 4', 'Cofen', 'Play Mix'].includes(row.setor)
      ? row.setor
      : 'Play 5') as AttendanceRecord['setor'],
    qtdeFaltas: Number(row.qtde_faltas ?? row.qtdeFaltas ?? 0),
    diasAtestado: Number(row.dias_atestado ?? row.diasAtestado ?? 0),
    faltasInjustificadas: Number(row.faltas_injustificadas ?? row.faltasInjustificadas ?? 0),
    semana: String(row.semana || '3ª semana'),
    mes: String(row.mes || 'setembro'),
    ano: Number(row.ano || new Date().getFullYear()),
    gestor: row.gestor ? String(row.gestor) : undefined,
    observacoes: row.observacoes ? String(row.observacoes) : undefined,
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
    updatedBy: row.updated_by || row.updatedBy || 'Supabase User',
  };
}

// Helper: map AttendanceRecord to DB row
export function mapRecordToRow(record: AttendanceRecord, userIdentifier?: string | null) {
  return {
    id: record.id,
    data: record.data,
    nome: record.nome,
    setor: record.setor,
    qtde_faltas: record.qtdeFaltas,
    dias_atestado: record.diasAtestado,
    faltas_injustificadas: record.faltasInjustificadas,
    semana: record.semana,
    mes: record.mes,
    ano: record.ano,
    gestor: record.gestor || null,
    observacoes: record.observacoes || null,
    updated_at: new Date().toISOString(),
    updated_by: userIdentifier || record.updatedBy || 'Usuário Online',
  };
}

/**
 * Fetch all records from Supabase
 */
export async function fetchSupabaseAttendanceRecords(): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map(mapRowToAttendanceRecord);
}

/**
 * Seed initial records to Supabase
 */
export async function seedSupabaseInitialData(userIdentifier?: string | null): Promise<void> {
  const rows = INITIAL_ATTENDANCE_DATA.map((item) => mapRecordToRow(item, userIdentifier));
  const { error } = await supabase.from('attendance_records').upsert(rows, { onConflict: 'id' });

  if (error) {
    throw error;
  }
}

/**
 * Save / Update a record in Supabase
 */
export async function saveRecordToSupabase(
  record: AttendanceRecord,
  userIdentifier?: string | null
): Promise<void> {
  const row = mapRecordToRow(record, userIdentifier);
  const { error } = await supabase.from('attendance_records').upsert(row, { onConflict: 'id' });

  if (error) {
    throw error;
  }
}

/**
 * Delete a record from Supabase
 */
export async function deleteRecordFromSupabase(id: string): Promise<void> {
  const { error } = await supabase.from('attendance_records').delete().eq('id', id);

  if (error) {
    throw error;
  }
}
