import React, { useState, useMemo } from 'react';
import { AttendanceRecord, SectorSummary } from '../types/attendance';
import { 
  Users, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight, 
  Building2, 
  Filter,
  Search,
  XCircle,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  Briefcase,
  PieChart,
  Calendar,
  Layers
} from 'lucide-react';
import { PagueplayLogo } from './PagueplayLogo';

interface DashboardOverviewProps {
  records: AttendanceRecord[];
  sectorSummaries: SectorSummary[];
  onSelectSector: (sector: string) => void;
  onSelectTab: (tab: 'geral' | 'tabela' | 'setores' | 'alertas' | 'relatorio') => void;
  activeSectorFilter: string;
  onFilterChange: (sector: string) => void;
  activeSemanaFilter: string;
  onSemanaFilterChange: (semana: string) => void;
  activeGestorFilter?: string;
  onGestorFilterChange?: (gestor: string) => void;
  onFilterTableByEmployee?: (name: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  records,
  onSelectSector,
  onSelectTab,
  activeSectorFilter,
  onFilterChange,
  activeSemanaFilter,
  onSemanaFilterChange,
  activeGestorFilter = '',
  onGestorFilterChange,
  onFilterTableByEmployee,
}) => {
  const [quickSearch, setQuickSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState<'todos' | 'com_atestado' | 'injustificadas' | 'criticas'>('todos');
  const [localGestor, setLocalGestor] = useState(activeGestorFilter);

  // Extract unique managers
  const availableGestores = useMemo(() => {
    const list = records.map((r) => r.gestor).filter(Boolean) as string[];
    return Array.from(new Set(list)).sort();
  }, [records]);

  // Extract unique weeks
  const availableSemanas = useMemo(() => {
    const list = records.map((r) => r.semana).filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [records]);

  // Extract unique sectors
  const availableSectores = useMemo(() => {
    const list = records.map((r) => r.setor).filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [records]);

  // Filtered dataset for dynamic KPI, sector breakdown and manager breakdown
  const currentGestorFilter = onGestorFilterChange ? activeGestorFilter : localGestor;

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (activeSectorFilter && r.setor !== activeSectorFilter) return false;
      if (activeSemanaFilter && r.semana !== activeSemanaFilter) return false;
      if (currentGestorFilter && r.gestor !== currentGestorFilter) return false;
      if (filterTipo === 'com_atestado' && r.diasAtestado === 0) return false;
      if (filterTipo === 'injustificadas' && r.faltasInjustificadas === 0) return false;
      if (filterTipo === 'criticas' && r.faltasInjustificadas < 3) return false;

      if (quickSearch.trim()) {
        const q = quickSearch.toLowerCase();
        const match =
          r.nome.toLowerCase().includes(q) ||
          r.setor.toLowerCase().includes(q) ||
          (r.gestor && r.gestor.toLowerCase().includes(q)) ||
          r.semana.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [records, activeSectorFilter, activeSemanaFilter, currentGestorFilter, filterTipo, quickSearch]);

  // Aggregate KPI stats calculated over filtered records
  const totalAusencias = filteredRecords.reduce((sum, r) => sum + r.qtdeFaltas, 0);
  const totalAtestados = filteredRecords.reduce((sum, r) => sum + r.diasAtestado, 0);
  const totalInjustificadas = filteredRecords.reduce((sum, r) => sum + r.faltasInjustificadas, 0);
  const totalColaboradores = new Set(filteredRecords.map((r) => r.nome)).size;
  
  const percAtestados = totalAusencias > 0 ? ((totalAtestados / totalAusencias) * 100).toFixed(1) : '0';
  const percInjustificadas = totalAusencias > 0 ? ((totalInjustificadas / totalAusencias) * 100).toFixed(1) : '0';
  const mediaPorColaborador = totalColaboradores > 0 ? (totalAusencias / totalColaboradores).toFixed(1) : '0';

  // Dynamic sector summaries from filtered records
  const dynamicSectorSummaries = useMemo(() => {
    const sectors = ['Play 5', 'Play 4', 'Cofen', 'Play Mix'];
    return sectors.map((setor) => {
      const sectorRecords = filteredRecords.filter((r) => r.setor === setor);
      const faltas = sectorRecords.reduce((acc, r) => acc + r.qtdeFaltas, 0);
      const atestado = sectorRecords.reduce((acc, r) => acc + r.diasAtestado, 0);
      const injust = sectorRecords.reduce((acc, r) => acc + r.faltasInjustificadas, 0);
      const colabs = new Set(sectorRecords.map((r) => r.nome)).size;
      const taxa = faltas > 0 ? Math.round((atestado / faltas) * 100) : 100;
      return {
        setor,
        totalFaltas: faltas,
        diasAtestado: atestado,
        faltasInjustificadas: injust,
        totalColaboradores: colabs,
        taxaJustificadas: taxa,
      };
    });
  }, [filteredRecords]);

  // Manager stats breakdown
  const managerStats = useMemo(() => {
    const map = new Map<string, { total: number; atestado: number; injust: number; colabs: Set<string> }>();
    filteredRecords.forEach((r) => {
      const g = r.gestor || 'Não especificado';
      if (!map.has(g)) {
        map.set(g, { total: 0, atestado: 0, injust: 0, colabs: new Set() });
      }
      const entry = map.get(g)!;
      entry.total += r.qtdeFaltas;
      entry.atestado += r.diasAtestado;
      entry.injust += r.faltasInjustificadas;
      entry.colabs.add(r.nome);
    });

    return Array.from(map.entries())
      .map(([gestor, data]) => ({
        gestor,
        total: data.total,
        atestado: data.atestado,
        injust: data.injust,
        colaboradoresCount: data.colabs.size,
        taxaJustificada: data.total > 0 ? Math.round((data.atestado / data.total) * 100) : 100,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredRecords]);

  const handleGestorSelect = (g: string) => {
    if (onGestorFilterChange) {
      onGestorFilterChange(g);
    } else {
      setLocalGestor(g);
    }
  };

  const handleClearFilters = () => {
    onFilterChange('');
    onSemanaFilterChange('');
    handleGestorSelect('');
    setFilterTipo('todos');
    setQuickSearch('');
  };

  const hasActiveFilters = Boolean(
    activeSectorFilter || activeSemanaFilter || currentGestorFilter || filterTipo !== 'todos' || quickSearch
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Welcome with Pagueplay Gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-sky-900 text-white p-6 sm:p-8 shadow-lg border border-emerald-700/50">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-200">
              <PagueplayLogo variant="icon" size="sm" />
              <span>Painel Executivo Geral • Pagueplay</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dashboard Geral de Ausências & Atestados
            </h1>
            <p className="text-emerald-100/85 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Monitore indicadores de absenteísmo, atestados médicos e ausências injustificadas de todos os setores e equipes da Pagueplay em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onSelectTab('setores')}
              className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold transition-all flex items-center gap-2 backdrop-blur-md cursor-pointer hover:shadow-md"
            >
              <Layers className="w-4 h-4 text-sky-200" />
              <span>Ver Dashboards por Setor</span>
            </button>
            <button
              onClick={() => onSelectTab('tabela')}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all flex items-center gap-2 shadow-md cursor-pointer hover:scale-102"
            >
              <span>Ver Todas Ocorrências</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modern Filter Card (Sector, Manager, Week, Type, Search) */}
      <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                Filtros Dinâmicos de Ausências
              </span>
              <span className="text-slate-500 text-[11px]">
                {filteredRecords.length} ocorrência(s) encontrada(s) • Total de {totalAusencias} ausência(s)
              </span>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer self-start lg:self-center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Todos os Filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Quick Search */}
          <div className="relative">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Buscar Colaborador / Termo
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Ex: Amanda, Bruno..."
                className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Gestor Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Filtrar por Gestor
            </label>
            <select
              value={currentGestorFilter}
              onChange={(e) => handleGestorSelect(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="">Todos os Gestores ({availableGestores.length})</option>
              {availableGestores.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Sector Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Filtrar por Setor
            </label>
            <select
              value={activeSectorFilter}
              onChange={(e) => onFilterChange(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="">Todos os Setores (4)</option>
              {availableSectores.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Semana Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Semana de Referência
            </label>
            <select
              value={activeSemanaFilter}
              onChange={(e) => onSemanaFilterChange(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="">Todas as Semanas</option>
              {availableSemanas.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Ausência */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Classificação da Ausência
            </label>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value as any)}
              className="w-full text-xs px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="todos">Todas as Ausências</option>
              <option value="com_atestado">Com Atestado Médico</option>
              <option value="injustificadas">Ausências Injustificadas</option>
              <option value="criticas">Casos Críticos (≥ 3 dias)</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards (4 Main Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ausências */}
        <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total de Ausências
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="text-3xl font-extrabold tracking-tight text-slate-900">
              {totalAusencias} <span className="text-xs font-semibold text-slate-400">dias</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Média por colaborador:</span>
              <span className="font-bold text-slate-700">{mediaPorColaborador} dias</span>
            </div>
          </div>
        </div>

        {/* Atestados Médicos */}
        <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Atestados Médicos
            </span>
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="text-3xl font-extrabold tracking-tight text-sky-700">
              {totalAtestados} <span className="text-xs font-semibold text-slate-400">dias</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Proporção justificada:</span>
              <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
                {percAtestados}%
              </span>
            </div>
          </div>
        </div>

        {/* Ausências Injustificadas */}
        <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Ausências Injustificadas
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="text-3xl font-extrabold tracking-tight text-rose-700">
              {totalInjustificadas} <span className="text-xs font-semibold text-slate-400">dias</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Impacto no absenteísmo:</span>
              <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                {percInjustificadas}%
              </span>
            </div>
          </div>
        </div>

        {/* Colaboradores Afetados */}
        <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Colaboradores com Registro
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="text-3xl font-extrabold tracking-tight text-indigo-900">
              {totalColaboradores} <span className="text-xs font-semibold text-slate-400">pessoas</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Ocorrências filtradas:</span>
              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                {filteredRecords.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Sector Distribution & Manager Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sectors Overview (7 cols) */}
        <div className="lg:col-span-7 bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Distribuição de Ausências por Setor
              </h3>
              <p className="text-slate-500 text-xs">
                Clique em qualquer setor para abrir o dashboard analítico específico.
              </p>
            </div>
            <button
              onClick={() => onSelectTab('setores')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Setores</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {dynamicSectorSummaries.map((sec) => {
              const share = totalAusencias > 0 ? Math.round((sec.totalFaltas / totalAusencias) * 100) : 0;
              return (
                <div
                  key={sec.setor}
                  onClick={() => {
                    onSelectSector(sec.setor);
                    onSelectTab('setores');
                  }}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {sec.setor}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        ({sec.totalColaboradores} colaboradores)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-extrabold text-slate-900">
                        {sec.totalFaltas} ausência(s)
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {share}% do total
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-sky-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, share))}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span className="text-sky-700 font-medium">
                      ✓ {sec.diasAtestado} dias atestado
                    </span>
                    <span className="text-rose-600 font-medium">
                      ⚠ {sec.faltasInjustificadas} injustificadas
                    </span>
                    <span className="font-semibold text-slate-700">
                      Taxa de Justificativa: {sec.taxaJustificadas}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Manager Ranking Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-sky-600" />
                Ausências por Gestor
              </h3>
              <span className="text-[11px] text-slate-500">
                {managerStats.length} gestores
              </span>
            </div>
            <p className="text-slate-500 text-xs">
              Mapeamento de liderança e controle de justificativas das equipes.
            </p>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
            {managerStats.map((mgr) => {
              const isSelected = currentGestorFilter === mgr.gestor;
              return (
                <div
                  key={mgr.gestor}
                  onClick={() => handleGestorSelect(isSelected ? '' : mgr.gestor)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-sky-50 border-sky-300 shadow-xs ring-2 ring-sky-200'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                  title="Clique para filtrar por este gestor"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {mgr.gestor}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-sky-200 text-sky-800 rounded-md">
                          Filtro Ativo
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {mgr.colaboradoresCount} colaboradores • {mgr.atestado} atestados • {mgr.injust} injust.
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-sm text-slate-900 block">
                      {mgr.total}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold block">
                      {mgr.taxaJustificada}% justif.
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-[11px] text-emerald-900 flex items-center justify-between">
            <span>Dica: Clique no gestor para filtrar todo o painel.</span>
            {currentGestorFilter && (
              <button
                onClick={() => handleGestorSelect('')}
                className="font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                Remover
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Insights Bar */}
      <div className="p-4 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="space-y-0.5">
            <span className="font-bold text-xs uppercase tracking-wider text-emerald-300 block">
              Painel de Alertas Operacionais
            </span>
            <p className="text-xs text-slate-300">
              Existem colaboradores com acúmulo de ausências injustificadas ou atestados prolongados demandando acompanhamento pelo RH.
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectTab('alertas')}
          className="px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-emerald-50 text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
        >
          Acessar Painel de Alertas
        </button>
      </div>
    </div>
  );
};
