import React, { useState, useEffect } from 'react';
import { AttendanceRecord } from '../types/attendance';
import { getSemanaDoMes, getMesDoAno, getAnoFromDate } from '../utils/dateCalculations';
import { X, Save, AlertCircle, Calendar, User, Building2, UserCheck } from 'lucide-react';
import { SETORES_DISPONIVEIS } from '../data/initialData';
import { PagueplayLogo } from './PagueplayLogo';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: AttendanceRecord) => void;
  initialData?: AttendanceRecord | null;
  defaultSector?: string;
  availableSectors?: string[];
  onQuickCreateSector?: (name: string) => Promise<void>;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultSector = 'Play 5',
  availableSectors = ['Play 5', 'Play 4', 'Cofen', 'Play Mix'],
  onQuickCreateSector,
}) => {
  const [nome, setNome] = useState('');
  const [setor, setSetor] = useState(defaultSector);
  const [isQuickAddingSector, setIsQuickAddingSector] = useState(false);
  const [quickSectorName, setQuickSectorName] = useState('');
  const [data, setData] = useState('2026-09-20');
  const [diasAtestado, setDiasAtestado] = useState(0);
  const [faltasInjustificadas, setFaltasInjustificadas] = useState(0);
  const [qtdeFaltas, setQtdeFaltas] = useState(0);
  const [semana, setSemana] = useState('3ª semana');
  const [mes, setMes] = useState('setembro');
  const [ano, setAno] = useState(2026);
  const [gestor, setGestor] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [error, setError] = useState('');

  const handleQuickAddSector = async (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    const clean = quickSectorName.trim();
    if (!clean) return;
    if (onQuickCreateSector) {
      await onQuickCreateSector(clean);
    }
    setSetor(clean);
    setQuickSectorName('');
    setIsQuickAddingSector(false);
  };

  // Populate or reset form
  useEffect(() => {
    if (initialData) {
      setNome(initialData.nome);
      setSetor(initialData.setor);
      setData(initialData.data);
      setDiasAtestado(initialData.diasAtestado);
      setFaltasInjustificadas(initialData.faltasInjustificadas);
      setQtdeFaltas(initialData.qtdeFaltas);
      setSemana(initialData.semana);
      setMes(initialData.mes);
      setAno(initialData.ano);
      setGestor(initialData.gestor || '');
      setObservacoes(initialData.observacoes || '');
    } else {
      setNome('');
      setSetor(defaultSector);
      const defaultDate = '2026-09-20';
      setData(defaultDate);
      setDiasAtestado(0);
      setFaltasInjustificadas(1);
      setQtdeFaltas(1);
      setSemana(getSemanaDoMes(defaultDate));
      setMes(getMesDoAno(defaultDate));
      setAno(getAnoFromDate(defaultDate));
      setGestor('');
      setObservacoes('');
    }
    setError('');
  }, [initialData, defaultSector, isOpen]);

  // Handle date change
  const handleDateChange = (newDate: string) => {
    setData(newDate);
    if (newDate) {
      setSemana(getSemanaDoMes(newDate));
      setMes(getMesDoAno(newDate));
      setAno(getAnoFromDate(newDate));
    }
  };

  // Handle Total Ausencias / Qtde Falta change (Column D in spreadsheet)
  const handleTotalFaltasChange = (val: number) => {
    const total = Math.max(0, val || 0);
    setQtdeFaltas(total);
    // Fórmula da planilha: Faltas Injustificada = Qtde Falta - Dias de Atestado (=D3 - E3)
    if (total >= diasAtestado) {
      setFaltasInjustificadas(total - diasAtestado);
    } else {
      setDiasAtestado(total);
      setFaltasInjustificadas(0);
    }
  };

  // Handle Dias de Atestado change (Column E in spreadsheet)
  const handleAtestadoChange = (val: number) => {
    const atestado = Math.max(0, val || 0);
    setDiasAtestado(atestado);
    // Fórmula da planilha: Faltas Injustificada = Qtde Falta - Dias de Atestado (=D3 - E3)
    if (qtdeFaltas >= atestado) {
      setFaltasInjustificadas(qtdeFaltas - atestado);
    } else {
      // Se o atestado for maior que o total, o total de faltas expande para cobrir
      setQtdeFaltas(atestado + faltasInjustificadas);
    }
  };

  // Handle Faltas Injustificadas change (Column F in spreadsheet)
  const handleInjustificadasChange = (val: number) => {
    const injust = Math.max(0, val || 0);
    setFaltasInjustificadas(injust);
    setQtdeFaltas(diasAtestado + injust);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('Por favor informe o nome do colaborador.');
      return;
    }

    if (qtdeFaltas <= 0) {
      setError('A quantidade de ausências deve ser maior que zero.');
      return;
    }

    const recordToSave: AttendanceRecord = {
      id: initialData?.id || `rec-${Date.now()}`,
      nome: nome.trim().toUpperCase(),
      setor,
      data,
      diasAtestado: Number(diasAtestado),
      faltasInjustificadas: Number(faltasInjustificadas),
      qtdeFaltas: Number(qtdeFaltas),
      semana,
      mes,
      ano: Number(ano),
      gestor: gestor.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
    };

    onSave(recordToSave);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200/90 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-800 via-teal-800 to-sky-900 text-white">
          <div className="flex items-center gap-3">
            <PagueplayLogo variant="icon" size="sm" />
            <div>
              <h2 className="text-base font-bold">
                {initialData ? 'Editar Ausência' : 'Cadastrar Nova Ausência'}
              </h2>
              <p className="text-xs text-emerald-100/80">
                Lançamento no controle de ausências e atestados da Pagueplay
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Nome Completo do Colaborador *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: AMANDA FERREIRA DOS SANTOS"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-semibold"
            />
          </div>

          {/* Setor & Gestor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-bold">
                  Setor / Área *
                </label>
                <button
                  type="button"
                  onClick={() => setIsQuickAddingSector(!isQuickAddingSector)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  {isQuickAddingSector ? 'Cancelar' : '+ Novo Setor'}
                </button>
              </div>

              {isQuickAddingSector ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={quickSectorName}
                    onChange={(e) => setQuickSectorName(e.target.value)}
                    placeholder="Nome do novo setor..."
                    className="flex-1 px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleQuickAddSector(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddSector}
                    disabled={!quickSectorName.trim()}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:bg-slate-300"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <select
                  value={setor}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setIsQuickAddingSector(true);
                    } else {
                      setSetor(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {Array.from(new Set([...availableSectors, setor])).filter(Boolean).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="__add_new__" className="font-bold text-emerald-700">
                    + Cadastrar Novo Setor...
                  </option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Liderança / Gestor Imediato
              </label>
              <input
                type="text"
                list="gestores-sugestoes"
                value={gestor}
                onChange={(e) => setGestor(e.target.value)}
                placeholder="Ex: Bruno Dalbello, Maria..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <datalist id="gestores-sugestoes">
                <option value="Bruno Dalbello" />
                <option value="Maria" />
                <option value="Isabela" />
                <option value="Marcos Silva" />
              </datalist>
            </div>
          </div>

          {/* Data da Ausência */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Data do Registro *
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Semana Calculada
              </label>
              <input
                type="text"
                readOnly
                value={semana}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Mês / Ano
              </label>
              <input
                type="text"
                readOnly
                value={`${mes} / ${ano}`}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium cursor-not-allowed"
              />
            </div>
          </div>

          {/* Quantitativo de Ausências - idêntico à planilha da Pagueplay */}
          <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] block">
                Quantitativo de Ausências (Dias)
              </span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                Fórmula: Injustificada = Qtde Falta − Atestado
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Qtde Falta (Total de Ausências) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Qtde Falta (Total) *</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">Coluna D</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={qtdeFaltas}
                  onChange={(e) => handleTotalFaltasChange(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border-2 border-slate-400 focus:border-slate-800 rounded-xl text-slate-900 font-extrabold text-center focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm shadow-xs"
                />
              </div>

              {/* 2. Dias de Atestado */}
              <div>
                <label className="block text-[11px] font-bold text-sky-800 mb-1 flex items-center justify-between">
                  <span>Dias de Atestado</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-700">Coluna E</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={diasAtestado}
                  onChange={(e) => handleAtestadoChange(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border-2 border-sky-300 focus:border-sky-600 rounded-xl text-slate-900 font-bold text-center focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
                />
              </div>

              {/* 3. Faltas Injustificada (Resultado da fórmula = D - E) */}
              <div>
                <label className="block text-[11px] font-bold text-rose-800 mb-1 flex items-center justify-between">
                  <span>Faltas Injustificada</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">= D - E</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={faltasInjustificadas}
                  onChange={(e) => handleInjustificadasChange(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border-2 border-rose-300 focus:border-rose-600 rounded-xl text-slate-900 font-bold text-center focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
                />
              </div>
            </div>

            {/* Live calculation banner */}
            <div className="bg-white rounded-xl p-2.5 border border-slate-200/90 flex flex-wrap items-center justify-between text-xs gap-2">
              <span className="text-slate-600 font-medium">
                Cálculo: <strong className="text-slate-900">{qtdeFaltas} falta(s) total</strong> − <strong className="text-sky-700">{diasAtestado} atestado(s)</strong> = <strong className="text-rose-700">{faltasInjustificadas} injustificada(s)</strong>
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                faltasInjustificadas === 0 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {faltasInjustificadas === 0 ? '100% Justificada por Atestado' : `${faltasInjustificadas} dia(s) sem justificativa`}
              </span>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Observações / Justificativas Médicas
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: CID médico, atestado de consulta odontológica, retorno programado..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-bold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Registro de Ausência</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
