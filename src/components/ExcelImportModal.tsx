import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { AttendanceRecord, UserRole } from '../types/attendance';
import { getSemanaDoMes, getMesDoAno, getAnoFromDate, formatDateBR } from '../utils/dateCalculations';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Check, 
  AlertTriangle, 
  X, 
  Download, 
  RefreshCw, 
  Eye, 
  Layers, 
  ArrowRight,
  Database,
  Info
} from 'lucide-react';
import { PagueplayLogo } from './PagueplayLogo';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (newRecords: AttendanceRecord[], mode: 'append' | 'replace') => Promise<void>;
  userRole: UserRole;
  onOpenAdminAuth: () => void;
}

interface ColumnMapping {
  nome: string;
  setor: string;
  qtdeFaltas: string;
  diasAtestado: string;
  faltasInjustificadas: string;
  data: string;
  semana: string;
  mes: string;
  ano: string;
  gestor: string;
  observacoes: string;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  userRole,
  onOpenAdminAuth,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [previewRecords, setPreviewRecords] = useState<AttendanceRecord[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({
    nome: '',
    setor: '',
    qtdeFaltas: '',
    diasAtestado: '',
    faltasInjustificadas: '',
    data: '',
    semana: '',
    mes: '',
    ano: '',
    gestor: '',
    observacoes: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Normalizes header names for intelligent auto-detection
  const normalize = (str: string) =>
    String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  const detectColumn = (cols: string[], patterns: string[]): string => {
    for (const pat of patterns) {
      const found = cols.find((c) => normalize(c).includes(normalize(pat)));
      if (found) return found;
    }
    return '';
  };

  // Convert Excel date value (serial or string) to YYYY-MM-DD
  const parseExcelDate = (val: any): string => {
    if (!val) return '2026-09-20';

    if (val instanceof Date) {
      return val.toISOString().slice(0, 10);
    }

    if (typeof val === 'number') {
      // Excel serial date to JS date
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10);
      }
    }

    const str = String(val).trim();
    // DD/MM/YYYY
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        let y = parts[2];
        if (y.length === 2) y = '20' + y;
        return `${y}-${m}-${d}`;
      }
    }

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.slice(0, 10);
    }

    return '2026-09-20';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setError(null);
    setFile(uploadedFile);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);

        if (wb.SheetNames.length > 0) {
          const firstSheet = wb.SheetNames[0];
          setSelectedSheet(firstSheet);
          processSheet(wb, firstSheet);
        }
      } catch (err: any) {
        console.error('Erro ao ler arquivo Excel:', err);
        setError(`Falha ao ler arquivo: ${err.message || 'Formato inválido'}`);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setError('Erro ao carregar o arquivo.');
      setIsProcessing(false);
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const processSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;

    // Convert sheet to array of rows
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
    if (data.length < 2) {
      setError('A planilha selecionada parece estar vazia ou sem linhas de dados.');
      setHeaders([]);
      setRawRows([]);
      setPreviewRecords([]);
      return;
    }

    // First row as headers
    const rawHeaders = (data[0] || []).map((h: any) => String(h || '').trim()).filter(Boolean);
    setHeaders(rawHeaders);

    // Auto-detect columns
    const detected: ColumnMapping = {
      nome: detectColumn(rawHeaders, ['nome', 'colaborador', 'funcionario', 'pessoa', 'name']),
      setor: detectColumn(rawHeaders, ['setor', 'area', 'departamento']),
      qtdeFaltas: detectColumn(rawHeaders, ['qtdedefaltas', 'totaldefaltas', 'qtdefaltas', 'faltas', 'ausencias', 'ausencias', 'total']),
      diasAtestado: detectColumn(rawHeaders, ['diasdeatestado', 'atestado', 'atestados', 'diasatestado']),
      faltasInjustificadas: detectColumn(rawHeaders, ['faltasinjustificadas', 'injustificadas', 'semjustificativa', 'injust']),
      data: detectColumn(rawHeaders, ['data', 'dia', 'date']),
      semana: detectColumn(rawHeaders, ['semanadomes', 'semana', 'semanames', 'week']),
      mes: detectColumn(rawHeaders, ['mes', 'month']),
      ano: detectColumn(rawHeaders, ['ano', 'year']),
      gestor: detectColumn(rawHeaders, ['gestor', 'lider', 'lideranca', 'coordenador', 'supervisor']),
      observacoes: detectColumn(rawHeaders, ['observacoes', 'observacao', 'obs', 'motivo', 'justificativa', 'cid']),
    };
    setMapping(detected);

    // Data rows
    const rows = data.slice(1).filter((r) => r.some((c) => c !== '' && c !== null && c !== undefined));
    setRawRows(rows);

    // Generate preview
    buildPreview(rows, rawHeaders, detected);
  };

  const buildPreview = (rows: any[], cols: string[], map: ColumnMapping) => {
    const getIndex = (fieldCol: string) => cols.indexOf(fieldCol);

    const nomeIdx = getIndex(map.nome);
    const setorIdx = getIndex(map.setor);
    const faltasIdx = getIndex(map.qtdeFaltas);
    const atestadoIdx = getIndex(map.diasAtestado);
    const injustIdx = getIndex(map.faltasInjustificadas);
    const dataIdx = getIndex(map.data);
    const semanaIdx = getIndex(map.semana);
    const mesIdx = getIndex(map.mes);
    const anoIdx = getIndex(map.ano);
    const gestorIdx = getIndex(map.gestor);
    const obsIdx = getIndex(map.observacoes);

    const parsed: AttendanceRecord[] = [];

    rows.forEach((row, idx) => {
      const rawNome = nomeIdx >= 0 ? String(row[nomeIdx] || '').trim() : '';
      if (!rawNome) return; // ignore rows without name

      // Ignore totalizador row if present in spreadsheet (e.g. "TOTAL GERAL")
      if (rawNome.toLowerCase().includes('total') || rawNome.toLowerCase().includes('resumo')) {
        return;
      }

      const rawSetor = setorIdx >= 0 ? String(row[setorIdx] || '').trim() : 'Play 5';
      const cleanDate = dataIdx >= 0 ? parseExcelDate(row[dataIdx]) : '2026-09-20';

      let diasAtestadoNum = atestadoIdx >= 0 ? Math.max(0, parseInt(row[atestadoIdx]) || 0) : 0;
      let totalFaltasNum = faltasIdx >= 0 ? Math.max(0, parseInt(row[faltasIdx]) || 0) : 0;
      let injustNum = injustIdx >= 0 ? Math.max(0, parseInt(row[injustIdx]) || 0) : 0;
      
      // Fórmula da planilha da Pagueplay: Faltas Injustificadas = Qtde Falta - Dias de Atestado
      if (injustIdx < 0 || (injustNum === 0 && totalFaltasNum > diasAtestadoNum)) {
        injustNum = Math.max(0, totalFaltasNum - diasAtestadoNum);
      }
      if (totalFaltasNum === 0 && (diasAtestadoNum > 0 || injustNum > 0)) {
        totalFaltasNum = diasAtestadoNum + injustNum;
      }
      if (totalFaltasNum === 0) totalFaltasNum = 1;

      const cleanSemana = semanaIdx >= 0 && row[semanaIdx] ? String(row[semanaIdx]).trim() : getSemanaDoMes(cleanDate);
      const cleanMes = mesIdx >= 0 && row[mesIdx] ? String(row[mesIdx]).trim() : getMesDoAno(cleanDate);
      const cleanAno = anoIdx >= 0 && row[anoIdx] ? parseInt(row[anoIdx]) || 2026 : getAnoFromDate(cleanDate);
      const cleanGestor = gestorIdx >= 0 && row[gestorIdx] ? String(row[gestorIdx]).trim() : undefined;
      const cleanObs = obsIdx >= 0 && row[obsIdx] ? String(row[obsIdx]).trim() : undefined;

      parsed.push({
        id: `imp-${Date.now()}-${idx}`,
        nome: rawNome.toUpperCase(),
        setor: cleanSetor(rawSetor),
        data: cleanDate,
        qtdeFaltas: totalFaltasNum,
        diasAtestado: diasAtestadoNum,
        faltasInjustificadas: injustNum,
        semana: cleanSemana,
        mes: cleanMes,
        ano: cleanAno,
        gestor: cleanGestor,
        observacoes: cleanObs,
      });
    });

    setPreviewRecords(parsed);
  };

  const cleanSetor = (val: string): string => {
    const raw = String(val || '').trim();
    if (!raw) return 'Play 5';
    const s = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (s.includes('5')) return 'Play 5';
    if (s.includes('4')) return 'Play 4';
    if (s.includes('cofen')) return 'Cofen';
    if (s.includes('mix')) return 'Play Mix';
    return raw;
  };

  const handleSheetChange = (sheet: string) => {
    setSelectedSheet(sheet);
    if (workbook) {
      processSheet(workbook, sheet);
    }
  };

  const handleMappingChange = (field: keyof ColumnMapping, selectedCol: string) => {
    const newMapping = { ...mapping, [field]: selectedCol };
    setMapping(newMapping);
    buildPreview(rawRows, headers, newMapping);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Data': '20/09/2026',
        'Nome': 'AMANDA FERREIRA DOS SANTOS',
        'Setor': 'Play 5',
        'Qtde de Ausências': 2,
        'Dias de Atestado': 2,
        'Ausências Injustificadas': 0,
        'Semana do mês': '3ª semana',
        'Mês': 'setembro',
        'Ano': 2026,
        'Gestor Responsável': 'Bruno Dalbello',
        'Observações': 'Atestado médico odontológico',
      },
      {
        'Data': '21/09/2026',
        'Nome': 'CARLOS EDUARDO SILVA',
        'Setor': 'Play 4',
        'Qtde de Ausências': 1,
        'Dias de Atestado': 0,
        'Ausências Injustificadas': 1,
        'Semana do mês': '3ª semana',
        'Mês': 'setembro',
        'Ano': 2026,
        'Gestor Responsável': 'Maria',
        'Observações': 'Falta injustificada',
      },
      {
        'Data': '22/09/2026',
        'Nome': 'JULIANA MENEZES',
        'Setor': 'Cofen',
        'Qtde de Ausências': 5,
        'Dias de Atestado': 5,
        'Ausências Injustificadas': 0,
        'Semana do mês': '3ª semana',
        'Mês': 'setembro',
        'Ano': 2026,
        'Gestor Responsável': 'Isabela',
        'Observações': 'Atestado cirúrgico 5 dias',
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    // set column widths
    ws['!cols'] = [
      { wch: 12 },
      { wch: 32 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 16 },
      { wch: 12 },
      { wch: 8 },
      { wch: 20 },
      { wch: 35 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ausências Pagueplay');
    XLSX.writeFile(wb, 'modelo_importacao_ausencias_pagueplay.xlsx');
  };

  const handleConfirmImport = async () => {
    if (userRole !== 'admin') {
      onOpenAdminAuth();
      return;
    }

    if (previewRecords.length === 0) {
      setError('Nenhum registro válido detectado para importação.');
      return;
    }

    try {
      setIsProcessing(true);
      await onImportSuccess(previewRecords, importMode);
      onClose();
    } catch (err: any) {
      console.error('Erro na importação:', err);
      setError(`Erro ao importar para o banco: ${err.message || 'Falha de comunicação'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Pagueplay Brand */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-800 via-teal-800 to-sky-900 text-white">
          <div className="flex items-center gap-3">
            <PagueplayLogo variant="icon" size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Importar Planilha Excel (.xlsx / .csv)</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 uppercase tracking-wider">
                  Carga em Lote
                </span>
              </div>
              <p className="text-xs text-emerald-100/80">
                Carregue seus registros de ausências, atestados, setores e gestores diretamente no banco.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* User Role Warning if visitor */}
          {userRole !== 'admin' && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Você está navegando como <strong>Visitante</strong>. Para salvar os dados importados no banco, será solicitado o PIN de Administrador.
                </span>
              </div>
              <button
                onClick={onOpenAdminAuth}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] whitespace-nowrap cursor-pointer"
              >
                Ativar ADM
              </button>
            </div>
          )}

          {/* File Upload Zone */}
          {!file ? (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-8 sm:p-10 text-center bg-slate-50/70 hover:bg-emerald-50/30 transition-all cursor-pointer group space-y-3"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform shadow-xs">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="font-extrabold text-sm text-slate-800 group-hover:text-emerald-800">
                    Clique para selecionar ou arraste sua planilha Excel aqui
                  </p>
                  <p className="text-slate-400 text-xs">
                    Suporta formatos <strong>.xlsx</strong>, <strong>.xls</strong> e <strong>.csv</strong>
                  </p>
                </div>
              </div>

              {/* Template download suggestion */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="font-bold text-slate-900 block">Precisa de um modelo pronto?</span>
                    <span className="text-slate-500 text-[11px]">Baixe a planilha modelo oficial com os nomes corretos de colunas.</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Planilha Modelo (.xlsx)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* File Info & Sheet Switcher */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm block truncate max-w-xs sm:max-w-md">
                      {file.name}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {(file.size / 1024).toFixed(1)} KB • {rawRows.length} linhas de dados encontradas
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {sheetNames.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-500">Aba:</span>
                      <select
                        value={selectedSheet}
                        onChange={(e) => handleSheetChange(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                      >
                        {sheetNames.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setFile(null);
                      setWorkbook(null);
                      setHeaders([]);
                      setRawRows([]);
                      setPreviewRecords([]);
                    }}
                    className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    Trocar Arquivo
                  </button>
                </div>
              </div>

              {/* Column Mapping Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    Correspondência de Colunas (Mapeamento Inteligente)
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Identificação automática realizada
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200">
                  {/* Nome */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Nome do Colaborador *
                    </label>
                    <select
                      value={mapping.nome}
                      onChange={(e) => handleMappingChange('nome', e.target.value)}
                      className={`w-full text-xs px-2 py-1.5 rounded-lg border bg-white ${
                        mapping.nome ? 'border-emerald-400 text-slate-900' : 'border-rose-400 text-rose-700'
                      }`}
                    >
                      <option value="">Selecione a coluna...</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Setor */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Setor / Área
                    </label>
                    <select
                      value={mapping.setor}
                      onChange={(e) => handleMappingChange('setor', e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="">Selecione ou padrão (Play 5)...</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Faltas / Ausências */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Total de Ausências (Dias)
                    </label>
                    <select
                      value={mapping.qtdeFaltas}
                      onChange={(e) => handleMappingChange('qtdeFaltas', e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="">Auto (Soma Atestado + Injust.)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Atestados */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Dias de Atestado
                    </label>
                    <select
                      value={mapping.diasAtestado}
                      onChange={(e) => handleMappingChange('diasAtestado', e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="">Não mapeado (0)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Injustificadas */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Ausências Injustificadas
                    </label>
                    <select
                      value={mapping.faltasInjustificadas}
                      onChange={(e) => handleMappingChange('faltasInjustificadas', e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="">Não mapeado (0)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Data */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Data da Ocorrência
                    </label>
                    <select
                      value={mapping.data}
                      onChange={(e) => handleMappingChange('data', e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="">Data atual / Padrão</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Gestor */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Gestor / Liderança
                    </label>
                    <select
                      value={mapping.gestor}
                      onChange={(e) => handleMappingChange('gestor', e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="">Não mapeado</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Observações */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Observações / Justificativa
                    </label>
                    <select
                      value={mapping.observacoes}
                      onChange={(e) => handleMappingChange('observacoes', e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="">Não mapeado</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-sky-600" />
                    Pré-visualização dos Registros Prontos ({previewRecords.length} válidos)
                  </span>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span>
                      Total Ausências:{' '}
                      <strong className="text-slate-900 font-bold">
                        {previewRecords.reduce((s, r) => s + r.qtdeFaltas, 0)}
                      </strong>
                    </span>
                    <span className="text-sky-700">
                      Atestados:{' '}
                      <strong>{previewRecords.reduce((s, r) => s + r.diasAtestado, 0)}d</strong>
                    </span>
                    <span className="text-rose-600">
                      Injustificadas:{' '}
                      <strong>{previewRecords.reduce((s, r) => s + r.faltasInjustificadas, 0)}d</strong>
                    </span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Colaborador</th>
                        <th className="py-2 px-3">Setor</th>
                        <th className="py-2 px-3">Gestor</th>
                        <th className="py-2 px-3">Data / Semana</th>
                        <th className="py-2 px-3 text-center">Ausências</th>
                        <th className="py-2 px-3 text-center">Atestado</th>
                        <th className="py-2 px-3 text-center">Injust.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewRecords.slice(0, 8).map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 font-bold text-slate-900 max-w-[180px] truncate">
                            {r.nome}
                          </td>
                          <td className="py-2 px-3 text-slate-700">{r.setor}</td>
                          <td className="py-2 px-3 text-slate-600">{r.gestor || '-'}</td>
                          <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                            {formatDateBR(r.data)} • {r.semana}
                          </td>
                          <td className="py-2 px-3 text-center font-extrabold text-slate-900">
                            {r.qtdeFaltas}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-sky-700">
                            {r.diasAtestado > 0 ? `${r.diasAtestado}d` : '-'}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-rose-600">
                            {r.faltasInjustificadas > 0 ? `${r.faltasInjustificadas}d` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewRecords.length > 8 && (
                  <p className="text-[10px] text-slate-400 text-center">
                    + {previewRecords.length - 8} outros colaboradores serão processados e salvos.
                  </p>
                )}
              </div>

              {/* Import Mode Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                <span className="font-bold text-slate-900 text-xs block">
                  Como deseja gravar os dados no banco?
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    importMode === 'append' ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200' : 'bg-white border-slate-200 hover:bg-slate-100'
                  }`}>
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">
                        Adicionar aos dados existentes
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Preserva os registros já cadastrados e acrescenta os novos da planilha.
                      </span>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    importMode === 'replace' ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200' : 'bg-white border-slate-200 hover:bg-slate-100'
                  }`}>
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-900 block text-rose-800">
                        Substituir toda a base atual
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Sobrescreve a base do banco com os registros desta nova planilha.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          {file && (
            <button
              onClick={handleConfirmImport}
              disabled={isProcessing || previewRecords.length === 0}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-md cursor-pointer ${
                isProcessing || previewRecords.length === 0
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 hover:scale-102'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processando e Gravando...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>
                    Confirmar e Gravar {previewRecords.length} Ocorrência(s)
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
