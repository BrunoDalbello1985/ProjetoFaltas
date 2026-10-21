import React, { useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  X, 
  ArrowRight,
  ShieldCheck,
  Server
} from 'lucide-react';
import { 
  SUPABASE_URL, 
  SUPABASE_ANON_KEY, 
  SUPABASE_SETUP_SQL, 
  fetchSupabaseAttendanceRecords, 
  seedSupabaseInitialData 
} from '../supabase';
import { AttendanceRecord } from '../types/attendance';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  supabaseStatus: 'connected' | 'table_missing' | 'error' | 'checking';
  onRefreshStatus: () => Promise<void>;
  currentRecords: AttendanceRecord[];
  onSyncAllToSupabase: () => Promise<void>;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  supabaseStatus,
  onRefreshStatus,
  currentRecords,
  onSyncAllToSupabase,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopySQL = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleManualCheck = async () => {
    setIsChecking(true);
    setFeedbackMsg(null);
    try {
      await onRefreshStatus();
      setFeedbackMsg('Status do Supabase verificado com sucesso.');
    } catch (err: any) {
      setFeedbackMsg(`Erro ao conectar: ${err.message || 'Falha na resposta'}`);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    setFeedbackMsg(null);
    try {
      await onSyncAllToSupabase();
      setFeedbackMsg(`Sucesso! ${currentRecords.length} registros foram sincronizados no Supabase.`);
      await onRefreshStatus();
    } catch (err: any) {
      setFeedbackMsg(`Erro ao sincronizar dados: ${err.message || 'Verifique se a tabela foi criada no SQL Editor'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-900 to-teal-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
              <Database className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Banco de Dados Supabase</h3>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  PostgreSQL
                </span>
              </div>
              <p className="text-xs text-emerald-100/80">
                Projeto: <span className="font-mono text-white">marcioffwsbftmtbvrxs</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Status Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            supabaseStatus === 'connected'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : supabaseStatus === 'table_missing'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            {supabaseStatus === 'connected' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : supabaseStatus === 'table_missing' ? (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <Server className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-bold text-sm">
                {supabaseStatus === 'connected' && 'Supabase Conectado e Operacional!'}
                {supabaseStatus === 'table_missing' && 'Conexão Estabelecida — Criação de Tabela Necessária'}
                {supabaseStatus === 'checking' && 'Verificando status do banco de dados...'}
                {supabaseStatus === 'error' && 'Aguardando configuração de tabela no Supabase'}
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                {supabaseStatus === 'connected'
                  ? 'A tabela attendance_records está ativa. Alterações e consultas podem ser lidas e gravadas diretamente na nuvem do Supabase.'
                  : 'O aplicativo já está configurado com a URL e chave do seu projeto. Para que as gravações funcionem no PostgreSQL, execute o comando SQL abaixo no painel do Supabase.'}
              </p>
            </div>
          </div>

          {feedbackMsg && (
            <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium">
              {feedbackMsg}
            </div>
          )}

          {/* Connection Details Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wider block">
              Parâmetros Ativos do Supabase
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">URL DO PROJETO</span>
                <span className="font-mono text-slate-800 break-all select-all font-medium">
                  {SUPABASE_URL}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">CHAVE PUBLICÁVEL / ANON</span>
                <span className="font-mono text-slate-800 break-all select-all font-medium">
                  {SUPABASE_ANON_KEY.slice(0, 15)}...{SUPABASE_ANON_KEY.slice(-8)}
                </span>
              </div>
            </div>
          </div>

          {/* Step by Step Guide to create table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-sm block">
                  Script SQL de Inicialização
                </span>
                <span className="text-slate-500 text-[11px]">
                  Cria a tabela de faltas/atestados, regras de segurança RLS e habilita o tempo real.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySQL}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>{copied ? 'Copiado!' : 'Copiar SQL'}</span>
                </button>
                <a
                  href="https://supabase.com/dashboard/project/marcioffwsbftmtbvrxs/sql"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                >
                  <span>Abrir SQL Editor</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="relative">
              <pre className="p-3.5 bg-slate-900 text-emerald-300 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800 select-all">
                {SUPABASE_SETUP_SQL}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleManualCheck}
              disabled={isChecking}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors w-full sm:w-auto justify-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Checando...' : 'Testar Conexão Novamente'}</span>
            </button>

            <button
              onClick={handleSyncData}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-xs w-full sm:w-auto justify-center disabled:opacity-50"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isSyncing ? 'Sincronizando...' : `Salvar ${currentRecords.length} Registros no Supabase`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
