import React, { useState, useMemo } from 'react';
import { AttendanceRecord, SectorSummary, UserRole } from '../types/attendance';
import { 
  Building2, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Plus, 
  Search, 
  SlidersHorizontal,
  XCircle,
  FileSpreadsheet,
  UserCheck,
  Calendar,
  Layers,
  BarChart3,
  RotateCcw
} from 'lucide-react';
import { formatDateBR } from '../utils/dateCalculations';
import { PagueplayLogo } from './PagueplayLogo';

interface SectorAnalysisProps {
  records: AttendanceRecord[];
  sectorSummaries: SectorSummary[];
  selectedSector: string;
  onSelectSector: (sector: string) => void;
  onNewRecordForSector: (sector: string) => void;
  onEditRecord: (record: AttendanceRecord) => void;
  availableSectors?: string[];
  onOpenManageSectors?: () => void;
  userRole?: UserRole;
}

export const SectorAnalysis: React.FC<SectorAnalysisProps> = ({
  records,
  sectorSummaries,
  selectedSector,
  onSelectSector,
  onNewRecordForSector,
  onEditRecord,
  availableSectors = ['Play 5', 'Play 4', 'Cofen', 'Play Mix'],
  onOpenManageSectors,
  userRole = 'admin',
}) => {
  const currentSector = selectedSector || (sectorSummaries[0]?.setor ?? 'Play 5');
  const [activeTabSector, setActiveTabSector] = useState(currentSector);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [gestorFilter, setGestorFilter] = useState('');
  const [semanaFilter, setSemanaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'atestados' | 'injustificadas' | 'criticas'>('todos');
  const [sortBy, setSortBy] = useState<'ausencias' | 'nome' | 'atestados' | 'injustificadas'>('ausencias');

  // Sync if prop changes
  React.useEffect(() => {
    if (selectedSector) {
      setActiveTabSector(selectedSector);
    }
  }, [selectedSector]);

  // Dynamic Sector list combining availableSectors and sectors found in records
  const sectorsList = useMemo(() => {
    const fromProps = availableSectors && availableSectors.length > 0 ? availableSectors : [];
    const fromRecords = records.map((r) => r.setor).filter(Boolean);
    const defaults = ['Play 5', 'Play 4', 'Cofen', 'Play Mix'];
    return Array.from(new Set([...defaults, ...fromProps, ...fromRecords]));
  }, [availableSectors, records]);

  // All records for this specific sector
  const sectorAllRecords = useMemo(() => {
    return records.filter((r) => r.setor === activeTabSector);
  }, [records, activeTabSector]);

  // Managers present in this sector
  const sectorGestores = useMemo(() => {
    const list = sectorAllRecords.map((r) => r.gestor).filter(Boolean) as string[];
    return Array.from(new Set(list)).sort();
  }, [sectorAllRecords]);

  // Weeks present in this sector
  const sectorSemanas = useMemo(() => {
    const list = sectorAllRecords.map((r) => r.semana).filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [sectorAllRecords]);

  // Filtered records for this sector based on filters
  const filteredSectorRecords = useMemo(() => {
    return sectorAllRecords.filter((record) => {
      // Gestor filter
      if (gestorFilter && record.gestor !== gestorFilter) return false;

      // Semana filter
      if (semanaFilter && record.semana !== semanaFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = record.nome.toLowerCase().includes(term);
        const matchesGestor = record.gestor?.toLowerCase().includes(term);
        const matchesSemana = record.semana.toLowerCase().includes(term);
        if (!matchesName && !matchesGestor && !matchesSemana) return false;
      }

      // Status filter
      if (statusFilter === 'atestados' && record.diasAtestado === 0) return false;
      if (statusFilter === 'injustificadas' && record.faltasInjustificadas === 0) return false;
      if (statusFilter === 'criticas' && record.faltasInjustificadas < 3) return false;

      return true;
    });
  }, [sectorAllRecords, gestorFilter, semanaFilter, searchTerm, statusFilter]);

  // Sorted records
  const sortedRecords = useMemo(() => {
    return [...filteredSectorRecords].sort((a, b) => {
      if (sortBy === 'ausencias') {
        return b.qtdeFaltas - a.qtdeFaltas;
      }
      if (sortBy === 'atestados') {
        return b.diasAtestado - a.diasAtestado;
      }
      if (sortBy === 'injustificadas') {
        return b.faltasInjustificadas - a.faltasInjustificadas;
      }
      return a.nome.localeCompare(b.nome);
    });
  }, [filteredSectorRecords, sortBy]);

  // Summary KPIs for current sector (based on sectorAllRecords or filtered)
  const totalAusenciasSetor = sectorAllRecords.reduce((acc, r) => acc + r.qtdeFaltas, 0);
  const totalAtestadosSetor = sectorAllRecords.reduce((acc, r) => acc + r.diasAtestado, 0);
  const totalInjustSetor = sectorAllRecords.reduce((acc, r) => acc + r.faltasInjustificadas, 0);
  const totalColabsSetor = new Set(sectorAllRecords.map((r) => r.nome)).size;
  const taxaJustificadaSetor = totalAusenciasSetor > 0 
    ? Math.round((totalAtestadosSetor / totalAusenciasSetor) * 100) 
    : 100;

  // Breakdown by manager inside this sector
  const gestorBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; atestados: number; injust: number; colabs: number }>();
    sectorAllRecords.forEach((r) => {
      const g = r.gestor || 'Não especificado';
      if (!map.has(g)) {
        map.set(g, { total: 0, atestados: 0, injust: 0, colabs: 0 });
      }
      const item = map.get(g)!;
      item.total += r.qtdeFaltas;
      item.atestados += r.diasAtestado;
      item.injust += r.faltasInjustificadas;
      item.colabs += 1;
    });
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [sectorAllRecords]);

  const handleTabChange = (sec: string) => {
    setActiveTabSector(sec);
    onSelectSector(sec);
    setGestorFilter('');
    setSemanaFilter('');
    setSearchTerm('');
  };

  const hasActiveFilters = Boolean(searchTerm || gestorFilter || semanaFilter || statusFilter !== 'todos');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Sector Header with Pagueplay Navigation Pills */}
      <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-600 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Dashboard do Setor: {activeTabSector}
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {totalColabsSetor} colaboradores
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Métricas setoriais aprofundadas, liderança e histórico individual de ausências na Pagueplay.
              </p>
            </div>
          </div>

          {userRole === 'admin' && (
            <button
              onClick={() => onNewRecordForSector(activeTabSector)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-2xl transition-all shadow-xs hover:shadow-md cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Ausência em {activeTabSector}</span>
            </button>
          )}
        </div>

        {/* Sector Tabs Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100">
          {sectorsList.map((sec) => {
            const count = records.filter((r) => r.setor === sec).length;
            const isCurrent = activeTabSector === sec;
            return (
              <button
                key={sec}
                onClick={() => handleTabChange(sec)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  isCurrent
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Layers className={`w-3.5 h-3.5 ${isCurrent ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>Setor {sec}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isCurrent ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {onOpenManageSectors && (
            <button
              onClick={onOpenManageSectors}
              className="px-3.5 py-2 rounded-2xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ml-auto shadow-xs"
              title="Gerenciar e adicionar novos setores"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Gerenciar / Novo Setor</span>
            </button>
          )}
        </div>
      </div>

      {/* Sector KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Ausências */}
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Ausências no Setor
          </span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-slate-900">{totalAusenciasSetor}</span>
            <span className="text-xs text-slate-400 font-semibold ml-1">dias</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1">
            {sectorAllRecords.length} ocorrência(s)
          </span>
        </div>

        {/* Atestados */}
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Atestados Médicos
          </span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-sky-700">{totalAtestadosSetor}</span>
            <span className="text-xs text-sky-400 font-semibold ml-1">dias</span>
          </div>
          <span className="text-[11px] text-sky-700 font-medium mt-1">
            {taxaJustificadaSetor}% justificadas
          </span>
        </div>

        {/* Injustificadas */}
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Injustificadas
          </span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-rose-700">{totalInjustSetor}</span>
            <span className="text-xs text-rose-400 font-semibold ml-1">dias</span>
          </div>
          <span className="text-[11px] text-rose-600 font-medium mt-1">
            {totalInjustSetor > 0 ? 'Demanda atenção' : 'Nenhuma pendência'}
          </span>
        </div>

        {/* Colaboradores afetados */}
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Colaboradores
          </span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-indigo-900">{totalColabsSetor}</span>
            <span className="text-xs text-indigo-400 font-semibold ml-1">pessoas</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1">
            com registros no setor
          </span>
        </div>

        {/* Gestores no Setor */}
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Gestores Atuantes
          </span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-emerald-800">{sectorGestores.length}</span>
            <span className="text-xs text-emerald-600 font-semibold ml-1">lideranças</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-medium mt-1">
            {sectorGestores.join(', ') || 'Nenhum informado'}
          </span>
        </div>
      </div>

      {/* Gestores do Setor Cards */}
      {gestorBreakdown.length > 0 && (
        <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-sky-600" />
              Gestores com Equipe em {activeTabSector}
            </span>
            <span className="text-slate-400 text-xs">
              Clique para filtrar os colaboradores abaixo
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {gestorBreakdown.map(([gestorName, data]) => {
              const isSelected = gestorFilter === gestorName;
              return (
                <div
                  key={gestorName}
                  onClick={() => setGestorFilter(isSelected ? '' : gestorName)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-200 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{gestorName}</span>
                    <span className="text-xs font-extrabold text-slate-800">{data.total} ausência(s)</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>{data.colabs} ocorrência(s)</span>
                    <span className="text-sky-700">{data.atestados} atest.</span>
                    <span className="text-rose-600">{data.injust} injust.</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Roster for Sector */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-900 text-sm">
                Colaboradores com Registro em {activeTabSector}
              </span>
              <span className="text-xs text-slate-400">
                ({sortedRecords.length} de {sectorAllRecords.length})
              </span>
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setGestorFilter('');
                  setSemanaFilter('');
                  setStatusFilter('todos');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar Filtros</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por colaborador..."
                className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Gestor */}
            <select
              value={gestorFilter}
              onChange={(e) => setGestorFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="">Todos os Gestores do Setor ({sectorGestores.length})</option>
              {sectorGestores.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            {/* Semana */}
            <select
              value={semanaFilter}
              onChange={(e) => setSemanaFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="">Todas as Semanas</option>
              {sectorSemanas.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full text-xs px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="todos">Todos os Tipos de Ausência</option>
              <option value="atestados">Com Atestado Médico</option>
              <option value="injustificadas">Ausências Injustificadas</option>
              <option value="criticas">Críticos (≥ 3 dias)</option>
            </select>
          </div>
        </div>

        {/* Table of employees */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-bold">Colaborador</th>
                <th className="py-3 px-4 font-bold">Gestor</th>
                <th className="py-3 px-4 font-bold">Semana / Mês</th>
                <th className="py-3 px-4 font-bold text-center">Qtde Ausências</th>
                <th className="py-3 px-4 font-bold text-center">Atestados</th>
                <th className="py-3 px-4 font-bold text-center">Injustificadas</th>
                <th className="py-3 px-4 font-bold">Diagnóstico</th>
                {userRole === 'admin' && (
                  <th className="py-3 px-4 font-bold text-right">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={userRole === 'admin' ? 8 : 7}
                    className="py-12 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FileSpreadsheet className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-semibold">Nenhum registro de ausência encontrado</p>
                      <p className="text-xs">Tente ajustar os filtros ou a busca nominal.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedRecords.map((r) => {
                  const isCritica = r.faltasInjustificadas >= 3;
                  const isAtestadoLongo = r.diasAtestado >= 5;

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {r.nome}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {r.gestor || <span className="text-slate-300 italic">Não informado</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="font-medium">{r.semana}</span>
                        <span className="text-slate-400 block text-[10px]">{r.mes}/{r.ano}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-extrabold text-slate-900">
                        {r.qtdeFaltas}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-sky-700">
                        {r.diasAtestado > 0 ? `${r.diasAtestado}d` : '-'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-rose-600">
                        {r.faltasInjustificadas > 0 ? `${r.faltasInjustificadas}d` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {isCritica ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Crítico (Injustificado)
                          </span>
                        ) : isAtestadoLongo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            Atestado Prolongado
                          </span>
                        ) : r.faltasInjustificadas > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-semibold">
                            Ausência Injustificada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                            Atestado Regular
                          </span>
                        )}
                      </td>
                      {userRole === 'admin' && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onEditRecord(r)}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            Editar
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
