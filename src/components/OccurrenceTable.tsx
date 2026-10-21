import React, { useState, useMemo } from 'react';
import { AttendanceRecord, UserRole } from '../types/attendance';
import { formatDateBR } from '../utils/dateCalculations';
import { 
  Search, 
  Plus, 
  Download, 
  Trash2, 
  Edit3, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  SlidersHorizontal,
  XCircle,
  FileSpreadsheet,
  Calendar,
  AlertTriangle,
  RotateCcw,
  UserCheck
} from 'lucide-react';

interface OccurrenceTableProps {
  records: AttendanceRecord[];
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: string) => void;
  onNewRecord: () => void;
  onExportCSV: () => void;
  selectedSectorFilter?: string;
  onSetSectorFilter?: (sector: string) => void;
  initialSearch?: string;
  onClearInitialSearch?: () => void;
  onOpenExcelImport?: () => void;
  userRole?: UserRole;
}

export const OccurrenceTable: React.FC<OccurrenceTableProps> = ({
  records,
  onEditRecord,
  onDeleteRecord,
  onNewRecord,
  onExportCSV,
  selectedSectorFilter = '',
  onSetSectorFilter,
  initialSearch = '',
  onClearInitialSearch,
  onOpenExcelImport,
  userRole = 'admin',
}) => {
  const [search, setSearch] = useState(initialSearch);
  const [filterSetor, setFilterSetor] = useState(selectedSectorFilter);
  const [filterGestor, setFilterGestor] = useState('');
  const [filterSemana, setFilterSemana] = useState('');
  const [filterMes, setFilterMes] = useState('');
  const [filterTipo, setFilterTipo] = useState<'todos' | 'com_atestado' | 'injustificadas' | 'criticas'>('todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<keyof AttendanceRecord>('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isCompact, setIsCompact] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Sync internal sector filter if prop changes
  React.useEffect(() => {
    setFilterSetor(selectedSectorFilter);
  }, [selectedSectorFilter]);

  // Sync initialSearch if prop changes
  React.useEffect(() => {
    if (initialSearch !== undefined) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  const handleSectorChange = (sector: string) => {
    setFilterSetor(sector);
    if (onSetSectorFilter) onSetSectorFilter(sector);
  };

  const handleSort = (column: keyof AttendanceRecord) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder(column === 'qtdeFaltas' || column === 'diasAtestado' || column === 'faltasInjustificadas' ? 'desc' : 'asc');
    }
  };

  // Extract unique sectors, managers, months and weeks dynamically
  const uniqueSectors = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => { if (r.setor) set.add(r.setor); });
    return Array.from(set).sort();
  }, [records]);

  const uniqueGestores = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => { if (r.gestor) set.add(r.gestor); });
    return Array.from(set).sort();
  }, [records]);

  const uniqueWeeks = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => { if (r.semana) set.add(r.semana); });
    return Array.from(set).sort();
  }, [records]);

  const uniqueMonths = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => { if (r.mes) set.add(r.mes); });
    return Array.from(set).sort();
  }, [records]);

  // Filtered & Sorted records
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        // Search filter (name, sector, manager, notes, month, week)
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchSearch =
            r.nome.toLowerCase().includes(q) ||
            r.setor.toLowerCase().includes(q) ||
            (r.gestor && r.gestor.toLowerCase().includes(q)) ||
            (r.observacoes && r.observacoes.toLowerCase().includes(q)) ||
            r.semana.toLowerCase().includes(q) ||
            r.mes.toLowerCase().includes(q);

          if (!matchSearch) return false;
        }

        // Sector filter
        if (filterSetor && r.setor !== filterSetor) return false;

        // Gestor filter
        if (filterGestor && r.gestor !== filterGestor) return false;

        // Week filter
        if (filterSemana && r.semana !== filterSemana) return false;

        // Month filter
        if (filterMes && r.mes.toLowerCase() !== filterMes.toLowerCase()) return false;

        // Date range filter
        if (startDate && r.data < startDate) return false;
        if (endDate && r.data > endDate) return false;

        // Type filter
        if (filterTipo === 'com_atestado' && r.diasAtestado === 0) return false;
        if (filterTipo === 'injustificadas' && r.faltasInjustificadas === 0) return false;
        if (filterTipo === 'criticas' && r.faltasInjustificadas < 3) return false;

        return true;
      })
      .sort((a, b) => {
        const valA = a[sortBy] ?? '';
        const valB = b[sortBy] ?? '';

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
        if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [records, search, filterSetor, filterGestor, filterSemana, filterMes, filterTipo, startDate, endDate, sortBy, sortOrder]);

  // Totals for filtered records
  const totalAusenciasFiltered = filteredRecords.reduce((s, r) => s + r.qtdeFaltas, 0);
  const totalAtestadosFiltered = filteredRecords.reduce((s, r) => s + r.diasAtestado, 0);
  const totalInjustificadasFiltered = filteredRecords.reduce((s, r) => s + r.faltasInjustificadas, 0);

  const resetFilters = () => {
    setSearch('');
    handleSectorChange('');
    setFilterGestor('');
    setFilterSemana('');
    setFilterMes('');
    setFilterTipo('todos');
    setStartDate('');
    setEndDate('');
    if (onClearInitialSearch) onClearInitialSearch();
  };

  const activeFiltersCount = [
    Boolean(search),
    Boolean(filterSetor),
    Boolean(filterGestor),
    Boolean(filterSemana),
    Boolean(filterMes),
    filterTipo !== 'todos',
    Boolean(startDate),
    Boolean(endDate)
  ].filter(Boolean).length;

  const renderSortIcon = (column: keyof AttendanceRecord) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 inline ml-1" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-emerald-700 inline ml-1 font-bold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-emerald-700 inline ml-1 font-bold" />
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Filter and Controls Bar */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Search box with clear icon and counter */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por colaborador, gestor, setor ou observações..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-50/80 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Limpar busca"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                showAdvancedFilters || activeFiltersCount > 0
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {onOpenExcelImport && (
              <button
                onClick={onOpenExcelImport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-xs cursor-pointer"
                title="Carregar arquivo Excel com ocorrências"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Importar Excel</span>
                <span className="sm:hidden">Importar</span>
              </button>
            )}

            <button
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
              title="Exportar dados filtrados para CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            {userRole === 'admin' && (
              <button
                onClick={onNewRecord}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Ausência</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {/* Setor */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Setor
            </label>
            <select
              value={filterSetor}
              onChange={(e) => handleSectorChange(e.target.value)}
              className="w-full text-xs px-2.5 py-2 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            >
              <option value="">Todos os Setores</option>
              {uniqueSectors.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Gestor */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Gestor
            </label>
            <select
              value={filterGestor}
              onChange={(e) => setFilterGestor(e.target.value)}
              className="w-full text-xs px-2.5 py-2 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            >
              <option value="">Todos os Gestores ({uniqueGestores.length})</option>
              {uniqueGestores.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Semana */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Semana
            </label>
            <select
              value={filterSemana}
              onChange={(e) => setFilterSemana(e.target.value)}
              className="w-full text-xs px-2.5 py-2 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            >
              <option value="">Todas as Semanas</option>
              {uniqueWeeks.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          {/* Mês */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Mês
            </label>
            <select
              value={filterMes}
              onChange={(e) => setFilterMes(e.target.value)}
              className="w-full text-xs px-2.5 py-2 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            >
              <option value="">Todos os Meses</option>
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Ausência */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Classificação
            </label>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value as any)}
              className="w-full text-xs px-2.5 py-2 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            >
              <option value="todos">Todas as Ocorrências</option>
              <option value="com_atestado">Com Atestado Médico</option>
              <option value="injustificadas">Ausências Injustificadas</option>
              <option value="criticas">Críticos (≥ 3 dias)</option>
            </select>
          </div>

          {/* Modo Compacto / Limpar */}
          <div className="flex items-end gap-1.5">
            <button
              onClick={() => setIsCompact(!isCompact)}
              className="w-1/2 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              title="Alternar densidade da tabela"
            >
              {isCompact ? 'Expandir' : 'Compacto'}
            </button>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="w-1/2 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                title="Limpar todos os filtros"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters: Date Range */}
        {showAdvancedFilters && (
          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/90 flex flex-wrap items-center gap-4 text-xs animate-in slide-in-from-top-1 duration-150">
            <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              Intervalo de Datas:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px]">De:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px]">Até:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Dynamic Summary Strip of filtered items */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Exibindo <strong className="text-slate-900 font-bold">{filteredRecords.length}</strong> de {records.length} ocorrência(s)
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Total Ausências: <strong className="text-slate-900 font-bold">{totalAusenciasFiltered}</strong></span>
            <span className="text-sky-700">Atestados: <strong>{totalAtestadosFiltered}d</strong></span>
            <span className="text-rose-600">Injustificadas: <strong>{totalInjustificadasFiltered}d</strong></span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 select-none">
              <tr>
                <th
                  onClick={() => handleSort('nome')}
                  className="py-3 px-4 font-bold cursor-pointer hover:text-emerald-700 transition-colors"
                >
                  Colaborador {renderSortIcon('nome')}
                </th>
                <th
                  onClick={() => handleSort('gestor')}
                  className="py-3 px-4 font-bold cursor-pointer hover:text-emerald-700 transition-colors"
                >
                  Gestor {renderSortIcon('gestor')}
                </th>
                <th
                  onClick={() => handleSort('setor')}
                  className="py-3 px-4 font-bold cursor-pointer hover:text-emerald-700 transition-colors"
                >
                  Setor {renderSortIcon('setor')}
                </th>
                <th
                  onClick={() => handleSort('data')}
                  className="py-3 px-4 font-bold cursor-pointer hover:text-emerald-700 transition-colors"
                >
                  Data {renderSortIcon('data')}
                </th>
                <th
                  onClick={() => handleSort('semana')}
                  className="py-3 px-4 font-bold cursor-pointer hover:text-emerald-700 transition-colors"
                >
                  Semana {renderSortIcon('semana')}
                </th>
                <th
                  onClick={() => handleSort('qtdeFaltas')}
                  className="py-3 px-4 font-bold text-center cursor-pointer hover:text-emerald-700 transition-colors"
                  title="Total de ausências registradas"
                >
                  Ausências {renderSortIcon('qtdeFaltas')}
                </th>
                <th
                  onClick={() => handleSort('diasAtestado')}
                  className="py-3 px-4 font-bold text-center cursor-pointer hover:text-emerald-700 transition-colors text-sky-700"
                >
                  Atestado {renderSortIcon('diasAtestado')}
                </th>
                <th
                  onClick={() => handleSort('faltasInjustificadas')}
                  className="py-3 px-4 font-bold text-center cursor-pointer hover:text-emerald-700 transition-colors text-rose-600"
                >
                  Injustificadas {renderSortIcon('faltasInjustificadas')}
                </th>
                <th className="py-3 px-4 font-bold">Observações</th>
                {userRole === 'admin' && (
                  <th className="py-3 px-4 font-bold text-right">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={userRole === 'admin' ? 10 : 9}
                    className="py-16 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileSpreadsheet className="w-10 h-10 text-slate-300 stroke-1" />
                      <p className="text-sm font-semibold text-slate-600">Nenhuma ausência encontrada</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Nenhum registro coincide com os filtros aplicados. Tente limpar os filtros ou buscar por outro termo.
                      </p>
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={resetFilters}
                          className="mt-2 text-xs font-bold text-emerald-700 hover:underline"
                        >
                          Limpar todos os filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const isCritical = record.faltasInjustificadas >= 3;
                  const isLongMedicalLeave = record.diasAtestado >= 5;

                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        isCritical ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Name */}
                      <td className={`py-3 px-4 font-bold text-slate-900 ${isCompact ? 'py-2' : 'py-3'}`}>
                        <div className="flex items-center gap-2">
                          {isCritical && (
                            <span title="Caso crítico: 3 ou mais ausências injustificadas">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            </span>
                          )}
                          <span>{record.nome}</span>
                        </div>
                      </td>

                      {/* Gestor */}
                      <td className={`py-3 px-4 text-slate-600 ${isCompact ? 'py-2' : 'py-3'}`}>
                        {record.gestor ? (
                          <span className="font-medium text-slate-700">{record.gestor}</span>
                        ) : (
                          <span className="text-slate-300 italic">Não informado</span>
                        )}
                      </td>

                      {/* Sector */}
                      <td className={`py-3 px-4 ${isCompact ? 'py-2' : 'py-3'}`}>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {record.setor}
                        </span>
                      </td>

                      {/* Data */}
                      <td className={`py-3 px-4 text-slate-600 font-mono text-[11px] ${isCompact ? 'py-2' : 'py-3'}`}>
                        {formatDateBR(record.data)}
                      </td>

                      {/* Semana */}
                      <td className={`py-3 px-4 text-slate-600 ${isCompact ? 'py-2' : 'py-3'}`}>
                        <span className="font-medium">{record.semana}</span>
                        <span className="text-slate-400 block text-[10px]">{record.mes}/{record.ano}</span>
                      </td>

                      {/* Qtde Ausências */}
                      <td className={`py-3 px-4 text-center font-extrabold text-slate-900 ${isCompact ? 'py-2' : 'py-3'}`}>
                        {record.qtdeFaltas}
                      </td>

                      {/* Dias Atestado */}
                      <td className={`py-3 px-4 text-center font-bold text-sky-700 ${isCompact ? 'py-2' : 'py-3'}`}>
                        {record.diasAtestado > 0 ? (
                          <span className={`px-2 py-0.5 rounded-md ${isLongMedicalLeave ? 'bg-amber-100 text-amber-800' : 'bg-sky-50'}`}>
                            {record.diasAtestado}d
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Ausências Injustificadas */}
                      <td className={`py-3 px-4 text-center font-bold text-rose-600 ${isCompact ? 'py-2' : 'py-3'}`}>
                        {record.faltasInjustificadas > 0 ? (
                          <span className={`px-2 py-0.5 rounded-md ${isCritical ? 'bg-rose-100 text-rose-800 font-extrabold' : 'bg-rose-50'}`}>
                            {record.faltasInjustificadas}d
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Observações */}
                      <td className={`py-3 px-4 text-slate-500 max-w-xs truncate ${isCompact ? 'py-2' : 'py-3'}`} title={record.observacoes}>
                        {record.observacoes || <span className="text-slate-300 italic">Sem observações</span>}
                      </td>

                      {/* Actions: strictly for Admin */}
                      {userRole === 'admin' && (
                        <td className={`py-3 px-4 text-right whitespace-nowrap ${isCompact ? 'py-2' : 'py-3'}`}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onEditRecord(record)}
                              title="Editar registro"
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteRecord(record.id)}
                              title="Excluir registro"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredRecords.length > 0 && (
              <tfoot className="bg-slate-50/80 font-bold text-slate-800 border-t border-slate-200">
                <tr>
                  <td colSpan={5} className="py-3 px-4 text-right">
                    Totais Filtrados:
                  </td>
                  <td className="py-3 px-4 text-center font-extrabold text-slate-900">
                    {totalAusenciasFiltered}
                  </td>
                  <td className="py-3 px-4 text-center text-sky-700">
                    {totalAtestadosFiltered}d
                  </td>
                  <td className="py-3 px-4 text-center text-rose-600">
                    {totalInjustificadasFiltered}d
                  </td>
                  <td colSpan={userRole === 'admin' ? 2 : 1}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
