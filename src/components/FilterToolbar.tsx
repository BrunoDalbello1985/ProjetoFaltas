import React from 'react';
import { 
  Calendar, 
  Layers, 
  Filter, 
  RotateCcw, 
  Search,
  ChevronDown,
  Clock,
  Sparkles
} from 'lucide-react';

interface FilterToolbarProps {
  // Period (date range)
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;

  // Month
  selectedMes: string;
  onMesChange: (mes: string) => void;
  availableMeses: string[];

  // Week
  selectedSemana: string;
  onSemanaChange: (semana: string) => void;
  availableSemanas: string[];

  // Sector
  selectedSetor: string;
  onSetorChange: (setor: string) => void;
  availableSetores: string[];

  // Stats & Reset
  totalRecords: number;
  filteredCount: number;
  onResetFilters: () => void;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  selectedMes,
  onMesChange,
  availableMeses,
  selectedSemana,
  onSemanaChange,
  availableSemanas,
  selectedSetor,
  onSetorChange,
  availableSetores,
  totalRecords,
  filteredCount,
  onResetFilters,
}) => {
  const hasActiveFilters = Boolean(
    startDate || endDate || selectedMes || selectedSemana || selectedSetor
  );

  return (
    <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs transition-all mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Title & Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-900 tracking-tight uppercase">
                Filtros Globais
              </span>
              {hasActiveFilters && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-in fade-in">
                  Ativo
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Filtre por período, mês ou semana em tempo real em todas as telas
            </p>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:items-center gap-2 flex-1 lg:justify-end">
          {/* Mês */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-600" />
              Mês
            </label>
            <select
              value={selectedMes}
              onChange={(e) => onMesChange(e.target.value)}
              className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold cursor-pointer ${
                selectedMes
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="">Todos os Meses</option>
              {availableMeses.map((m) => (
                <option key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Semana do Mês */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-600" />
              Semana
            </label>
            <select
              value={selectedSemana}
              onChange={(e) => onSemanaChange(e.target.value)}
              className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold cursor-pointer ${
                selectedSemana
                  ? 'bg-sky-50 border-sky-300 text-sky-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="">Todas as Semanas</option>
              {availableSemanas.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Setor */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <Layers className="w-3 h-3 text-teal-600" />
              Setor
            </label>
            <select
              value={selectedSetor}
              onChange={(e) => onSetorChange(e.target.value)}
              className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold cursor-pointer ${
                selectedSetor
                  ? 'bg-teal-50 border-teal-300 text-teal-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="">Todos os Setores</option>
              {availableSetores.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Período (De / Até) */}
          <div className="flex flex-col col-span-2 sm:col-span-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <span>Período (Datas)</span>
            </label>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                title="Data Inicial"
                className={`text-[11px] px-2 py-1.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full font-medium ${
                  startDate
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              />
              <span className="text-slate-400 text-xs">à</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                title="Data Final"
                className={`text-[11px] px-2 py-1.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full font-medium ${
                  endDate
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              />
            </div>
          </div>

          {/* Reset button */}
          {hasActiveFilters && (
            <div className="flex items-end col-span-2 sm:col-span-4 lg:col-span-1">
              <button
                type="button"
                onClick={onResetFilters}
                className="w-full lg:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                title="Limpar todos os filtros"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Counter summary bar */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
        <span>
          Exibindo <strong className="text-slate-900 font-bold">{filteredCount}</strong> de <strong className="text-slate-900 font-bold">{totalRecords}</strong> ausência(s) registradas
          {hasActiveFilters && ' (com filtros aplicados)'}
        </span>
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedMes && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                Mês: {selectedMes}
              </span>
            )}
            {selectedSemana && (
              <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-semibold text-[10px]">
                Semana: {selectedSemana}
              </span>
            )}
            {selectedSetor && (
              <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-semibold text-[10px]">
                Setor: {selectedSetor}
              </span>
            )}
            {(startDate || endDate) && (
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold text-[10px]">
                De {startDate || 'início'} até {endDate || 'hoje'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
