export interface AttendanceRecord {
  id: string;
  data: string; // YYYY-MM-DD
  nome: string;
  setor: 'Play 5' | 'Play 4' | 'Cofen' | 'Play Mix' | string;
  qtdeFaltas: number; // mantido para compatibilidade de dados do banco
  diasAtestado: number;
  faltasInjustificadas: number;
  semana: string; // e.g. "3ª semana"
  mes: string; // e.g. "setembro"
  ano: number; // e.g. 2026
  gestor?: string;
  observacoes?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface SectorSummary {
  setor: string;
  totalFaltas: number; // total de ausências
  diasAtestado: number;
  faltasInjustificadas: number;
  totalColaboradores: number;
  taxaJustificadas: number; // percentage
}

export interface FilterState {
  searchQuery: string;
  setor: string;
  gestor: string;
  semana: string;
  mes: string;
  ano: string;
  tipoOcorrencia: 'todos' | 'com_atestado' | 'injustificadas' | 'criticas' | 'ambos';
  sortBy: 'nome' | 'setor' | 'qtdeFaltas' | 'diasAtestado' | 'faltasInjustificadas' | 'data' | 'gestor';
  sortOrder: 'asc' | 'desc';
}

export type UserRole = 'admin' | 'visitor';

export interface AdminUser {
  id: string;
  name: string;
  email?: string;
  pin: string;
  cargo: string;
  setor?: string;
  createdAt: string;
  isMaster?: boolean;
}

export interface SectorItem {
  id: string;
  name: string;
  gestor?: string;
  color?: string;
  description?: string;
  isDefault?: boolean;
  createdAt?: string;
}
