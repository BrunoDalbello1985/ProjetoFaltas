import React, { useState, useMemo } from 'react';
import { AttendanceRecord, UserRole } from '../types/attendance';
import { 
  AlertTriangle, 
  ShieldAlert, 
  HeartPulse, 
  FileText, 
  CheckCircle, 
  ArrowRight, 
  Search, 
  Filter, 
  XCircle, 
  Building2,
  Trophy,
  UserCheck
} from 'lucide-react';
import { formatDateBR } from '../utils/dateCalculations';

interface AlertsAndRankingProps {
  records: AttendanceRecord[];
  onEditRecord: (record: AttendanceRecord) => void;
  onFilterTableByEmployee: (name: string) => void;
  userRole?: UserRole;
}

export const AlertsAndRanking: React.FC<AlertsAndRankingProps> = ({
  records,
  onEditRecord,
  onFilterTableByEmployee,
  userRole = 'admin',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [gestorFilter, setGestorFilter] = useState('');
  const [viewFilter, setViewFilter] = useState<'todos' | 'criticas' | 'atestados' | 'ranking'>('todos');

  // Extract unique sectors & managers
  const uniqueSectors = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.setor).filter(Boolean))).sort();
  }, [records]);

  const uniqueGestores = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.gestor).filter(Boolean))) as string[];
  }, [records]);

  // Filtered dataset based on search, sector & manager
  const baseFiltered = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        !searchTerm ||
        r.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.setor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.gestor && r.gestor.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchSector = !sectorFilter || r.setor === sectorFilter;
      const matchGestor = !gestorFilter || r.gestor === gestorFilter;
      return matchSearch && matchSector && matchGestor;
    });
  }, [records, searchTerm, sectorFilter, gestorFilter]);

  // 1. Critical Unjustified (>= 3 unjustified absences)
  const criticalUnjustified = useMemo(() => {
    return baseFiltered
      .filter((r) => r.faltasInjustificadas >= 3)
      .sort((a, b) => b.faltasInjustificadas - a.faltasInjustificadas);
  }, [baseFiltered]);

  // 2. Prolonged medical leave (>= 5 medical certificate days)
  const prolongedMedical = useMemo(() => {
    return baseFiltered
      .filter((r) => r.diasAtestado >= 5)
      .sort((a, b) => b.diasAtestado - a.diasAtestado);
  }, [baseFiltered]);

  // 3. Overall Ranking by Total Absences
  const rankedEmployees = useMemo(() => {
    return [...baseFiltered].sort((a, b) => b.qtdeFaltas - a.qtdeFaltas);
  }, [baseFiltered]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title & Description */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700 mb-1">
          <ShieldAlert className="w-4 h-4" />
          <span>Gestão de Risco & Monitoramento de Ausências • Pagueplay</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Painel de Alertas & Ausências Críticas
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
          Identifique proativamente colaboradores com alto volume de ausências injustificadas (reincidentes) e afastamentos médicos prolongados para intervenção de RH e alinhamento com a liderança.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Buscar Colaborador
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ex: Amanda, Bruno..."
                className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Gestor */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Filtrar por Gestor
            </label>
            <select
              value={gestorFilter}
              onChange={(e) => setGestorFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="">Todos os Gestores ({uniqueGestores.length})</option>
              {uniqueGestores.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Sector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Filtrar por Setor
            </label>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="">Todos os Setores (4)</option>
              {uniqueSectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* View Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Foco do Alerta
            </label>
            <select
              value={viewFilter}
              onChange={(e) => setViewFilter(e.target.value as any)}
              className="w-full text-xs px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="todos">Todos os Alertas</option>
              <option value="criticas">Ausências Injustificadas (≥ 3 dias)</option>
              <option value="atestados">Atestados Prolongados (≥ 5 dias)</option>
              <option value="ranking">Ranking Completo de Ausências</option>
            </select>
          </div>
        </div>

        {(searchTerm || sectorFilter || gestorFilter || viewFilter !== 'todos') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>Filtros aplicados para análise de risco.</span>
            <button
              onClick={() => {
                setSearchTerm('');
                setSectorFilter('');
                setGestorFilter('');
                setViewFilter('todos');
              }}
              className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {/* 1. Critical Unjustified Section */}
      {(viewFilter === 'todos' || viewFilter === 'criticas') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Ausências Injustificadas Críticas (≥ 3 dias)
                </h3>
                <p className="text-xs text-slate-500">
                  Casos de alto impacto sem justificativa médica, demandando alinhamento do gestor imediato.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-rose-100 text-rose-800 rounded-full">
              {criticalUnjustified.length} colaboradores
            </span>
          </div>

          {criticalUnjustified.length === 0 ? (
            <div className="p-8 bg-white/95 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Nenhum caso crítico de ausência injustificada</p>
              <p className="text-xs">Excelente conformidade das equipes no período analisado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {criticalUnjustified.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white/95 backdrop-blur-md rounded-3xl border border-rose-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
                          Setor: {rec.setor}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900">
                          {rec.nome}
                        </h4>
                      </div>
                      <span className="text-xs font-extrabold px-2.5 py-1 rounded-xl bg-rose-600 text-white shrink-0">
                        {rec.faltasInjustificadas}d injust.
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Liderança / Gestor:</span>
                        <span className="font-bold text-slate-800">{rec.gestor || 'Não informado'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Total de Ausências:</span>
                        <span className="font-bold text-slate-800">{rec.qtdeFaltas} dias</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Semana / Mês:</span>
                        <span className="font-medium text-slate-700">{rec.semana} • {rec.mes}/{rec.ano}</span>
                      </div>
                    </div>

                    {rec.observacoes && (
                      <p className="text-[11px] text-slate-600 italic bg-rose-50/50 p-2.5 rounded-xl border border-rose-100">
                        "{rec.observacoes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onFilterTableByEmployee(rec.nome)}
                      className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver Histórico</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    {userRole === 'admin' && (
                      <button
                        onClick={() => onEditRecord(rec)}
                        className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Prolonged Medical Leave Section */}
      {(viewFilter === 'todos' || viewFilter === 'atestados') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Atestados Médicos Prolongados (≥ 5 dias)
                </h3>
                <p className="text-xs text-slate-500">
                  Acompanhamento de saúde ocupacional, suporte ao colaborador e dimensionamento de escala.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-sky-100 text-sky-800 rounded-full">
              {prolongedMedical.length} colaboradores
            </span>
          </div>

          {prolongedMedical.length === 0 ? (
            <div className="p-8 bg-white/95 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-2">
              <CheckCircle className="w-8 h-8 text-sky-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Nenhum afastamento prolongado registrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prolongedMedical.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white/95 backdrop-blur-md rounded-3xl border border-sky-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 block">
                          Setor: {rec.setor}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900">
                          {rec.nome}
                        </h4>
                      </div>
                      <span className="text-xs font-extrabold px-2.5 py-1 rounded-xl bg-sky-600 text-white shrink-0">
                        {rec.diasAtestado}d Atestado
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Liderança / Gestor:</span>
                        <span className="font-bold text-slate-800">{rec.gestor || 'Não informado'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Data de Início:</span>
                        <span className="font-medium text-slate-800">{formatDateBR(rec.data)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Semana:</span>
                        <span className="font-medium text-slate-700">{rec.semana} • {rec.mes}/{rec.ano}</span>
                      </div>
                    </div>

                    {rec.observacoes && (
                      <p className="text-[11px] text-slate-600 italic bg-sky-50/50 p-2.5 rounded-xl border border-sky-100">
                        "{rec.observacoes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onFilterTableByEmployee(rec.nome)}
                      className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver Histórico</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    {userRole === 'admin' && (
                      <button
                        onClick={() => onEditRecord(rec)}
                        className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Overall Ranking Section */}
      {(viewFilter === 'todos' || viewFilter === 'ranking') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Ranking Geral de Ausências Registradas
                </h3>
                <p className="text-xs text-slate-500">
                  Ordenado pelo maior volume acumulado de dias de ausência.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">Posição</th>
                  <th className="py-3 px-4 font-bold">Colaborador</th>
                  <th className="py-3 px-4 font-bold">Gestor</th>
                  <th className="py-3 px-4 font-bold">Setor</th>
                  <th className="py-3 px-4 font-bold text-center">Total Ausências</th>
                  <th className="py-3 px-4 font-bold text-center">Atestados</th>
                  <th className="py-3 px-4 font-bold text-center">Injustificadas</th>
                  <th className="py-3 px-4 font-bold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rankedEmployees.slice(0, 15).map((emp, index) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-extrabold text-slate-400">
                      #{index + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {emp.nome}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {emp.gestor || <span className="text-slate-300 italic">-</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {emp.setor}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-extrabold text-slate-900">
                      {emp.qtdeFaltas}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-sky-700">
                      {emp.diasAtestado > 0 ? `${emp.diasAtestado}d` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-rose-600">
                      {emp.faltasInjustificadas > 0 ? `${emp.faltasInjustificadas}d` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onFilterTableByEmployee(emp.nome)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
                      >
                        Filtrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
