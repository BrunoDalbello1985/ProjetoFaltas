import React, { useState, useMemo } from 'react';
import { AttendanceRecord, SectorSummary } from '../types/attendance';
import { formatDateBR } from '../utils/dateCalculations';
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  Search, 
  Filter, 
  XCircle, 
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { PagueplayLogo } from './PagueplayLogo';

interface ReportPrintViewProps {
  records: AttendanceRecord[];
  sectorSummaries: SectorSummary[];
  onBack: () => void;
  onExportCSV: () => void;
}

export const ReportPrintView: React.FC<ReportPrintViewProps> = ({
  records,
  sectorSummaries,
  onBack,
  onExportCSV,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSetor, setFilterSetor] = useState('');
  const [filterGestor, setFilterGestor] = useState('');
  const [filterSemana, setFilterSemana] = useState('');
  const [filterTipo, setFilterTipo] = useState<'todos' | 'atestado' | 'injustificada' | 'criticas'>('todos');
  const [sortBy, setSortBy] = useState<'nome' | 'setor' | 'ausencias' | 'data' | 'gestor'>('nome');

  // Extract unique sectors & managers
  const uniqueSectors = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.setor).filter(Boolean))).sort();
  }, [records]);

  const uniqueGestores = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.gestor).filter(Boolean))) as string[];
  }, [records]);

  const uniqueSemanas = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.semana).filter(Boolean))).sort();
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        const matchSearch =
          !searchTerm ||
          r.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.setor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (r.gestor && r.gestor.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchSector = !filterSetor || r.setor === filterSetor;
        const matchGestor = !filterGestor || r.gestor === filterGestor;
        const matchSemana = !filterSemana || r.semana === filterSemana;

        let matchTipo = true;
        if (filterTipo === 'atestado') matchTipo = r.diasAtestado > 0;
        if (filterTipo === 'injustificada') matchTipo = r.faltasInjustificadas > 0;
        if (filterTipo === 'criticas') matchTipo = r.faltasInjustificadas >= 3;

        return matchSearch && matchSector && matchGestor && matchSemana && matchTipo;
      })
      .sort((a, b) => {
        if (sortBy === 'ausencias') return b.qtdeFaltas - a.qtdeFaltas;
        if (sortBy === 'setor') return a.setor.localeCompare(b.setor);
        if (sortBy === 'gestor') return (a.gestor || '').localeCompare(b.gestor || '');
        if (sortBy === 'data') return b.data.localeCompare(a.data);
        return a.nome.localeCompare(b.nome);
      });
  }, [records, searchTerm, filterSetor, filterGestor, filterSemana, filterTipo, sortBy]);

  const totalAusencias = filteredRecords.reduce((s, r) => s + r.qtdeFaltas, 0);
  const totalAtestados = filteredRecords.reduce((s, r) => s + r.diasAtestado, 0);
  const totalInjustificadas = filteredRecords.reduce((s, r) => s + r.faltasInjustificadas, 0);
  const totalColaboradores = new Set(filteredRecords.map((r) => r.nome)).size;
  const percAtestados = totalAusencias > 0 ? ((totalAtestados / totalAusencias) * 100).toFixed(1) : '0';

  const handlePrint = () => {
    window.print();
  };

  const hasActiveFilters = Boolean(searchTerm || filterSetor || filterGestor || filterSemana || filterTipo !== 'todos');

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterSetor('');
    setFilterGestor('');
    setFilterSemana('');
    setFilterTipo('todos');
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar (Hidden during Print) */}
      <div className="print:hidden bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Dashboard</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Gerar PDF</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Buscar Colaborador
            </label>
            <input
              type="text"
              placeholder="Nome ou termo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Filtrar por Gestor
            </label>
            <select
              value={filterGestor}
              onChange={(e) => setFilterGestor(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos os Gestores</option>
              {uniqueGestores.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Filtrar por Setor
            </label>
            <select
              value={filterSetor}
              onChange={(e) => setFilterSetor(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos os Setores</option>
              {uniqueSectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Filtrar por Semana
            </label>
            <select
              value={filterSemana}
              onChange={(e) => setFilterSemana(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todas as Semanas</option>
              {uniqueSemanas.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Classificação
            </label>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value as any)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todos">Todas as Ausências</option>
              <option value="atestado">Com Atestado Médico</option>
              <option value="injustificada">Ausências Injustificadas</option>
              <option value="criticas">Críticos (≥ 3 dias)</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Filtros ativos no relatório de impressão.</span>
            <button
              onClick={handleClearFilters}
              className="text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Limpar Todos os Filtros
            </button>
          </div>
        )}
      </div>

      {/* Printable Report Document */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xs print:shadow-none print:border-none print:p-0 space-y-6">
        {/* Printable Header with Pagueplay Brand */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
          <div className="flex items-center gap-3">
            <PagueplayLogo size="md" variant="full" subtitle="Relatório de Ausências" />
          </div>
          <div className="text-right text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-900">Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
            <p className="text-[11px] text-slate-500">Documento Oficial para RH & Gestão</p>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Ausências</span>
            <span className="text-xl font-extrabold text-slate-900">{totalAusencias} dias</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Atestados Médicos</span>
            <span className="text-xl font-extrabold text-sky-700">{totalAtestados} dias</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Injustificadas</span>
            <span className="text-xl font-extrabold text-rose-700">{totalInjustificadas} dias</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Colaboradores</span>
            <span className="text-xl font-extrabold text-slate-900">{totalColaboradores} pessoas</span>
          </div>
        </div>

        {/* Table of Records */}
        <div className="space-y-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Detalhamento de Ocorrências ({filteredRecords.length})
          </h4>
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Colaborador</th>
                <th className="py-2.5 px-3">Gestor</th>
                <th className="py-2.5 px-3">Setor</th>
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Semana</th>
                <th className="py-2.5 px-3 text-center">Ausências</th>
                <th className="py-2.5 px-3 text-center">Atestado</th>
                <th className="py-2.5 px-3 text-center">Injust.</th>
                <th className="py-2.5 px-3">Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-bold text-slate-900">{r.nome}</td>
                  <td className="py-2 px-3 text-slate-600">{r.gestor || '-'}</td>
                  <td className="py-2 px-3 text-slate-700">{r.setor}</td>
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{formatDateBR(r.data)}</td>
                  <td className="py-2 px-3 text-slate-600">{r.semana}</td>
                  <td className="py-2 px-3 text-center font-bold text-slate-900">{r.qtdeFaltas}</td>
                  <td className="py-2 px-3 text-center text-sky-700">{r.diasAtestado > 0 ? `${r.diasAtestado}d` : '-'}</td>
                  <td className="py-2 px-3 text-center text-rose-600 font-semibold">{r.faltasInjustificadas > 0 ? `${r.faltasInjustificadas}d` : '-'}</td>
                  <td className="py-2 px-3 text-slate-500 text-[11px]">{r.observacoes || '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
              <tr>
                <td colSpan={5} className="py-2.5 px-3 text-right">Totais:</td>
                <td className="py-2.5 px-3 text-center font-extrabold">{totalAusencias}</td>
                <td className="py-2.5 px-3 text-center text-sky-700">{totalAtestados}d</td>
                <td className="py-2.5 px-3 text-center text-rose-600">{totalInjustificadas}d</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer for Signatures in Print */}
        <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs text-slate-600 border-t border-slate-200">
          <div className="space-y-1">
            <div className="border-t border-slate-400 w-48 mx-auto mb-2"></div>
            <p className="font-bold text-slate-800">Coordenação de Recursos Humanos</p>
            <p className="text-[10px] text-slate-400">Pagueplay Serviços Financeiros</p>
          </div>
          <div className="space-y-1">
            <div className="border-t border-slate-400 w-48 mx-auto mb-2"></div>
            <p className="font-bold text-slate-800">Gestão Operacional / Setor</p>
            <p className="text-[10px] text-slate-400">Visto de Conferência</p>
          </div>
        </div>
      </div>
    </div>
  );
};
