import React from 'react';
import { X, CheckCircle, Calculator, Calendar, Filter, FileSpreadsheet, RotateCcw, ShieldCheck, Users } from 'lucide-react';
import { PagueplayLogo } from './PagueplayLogo';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetToDefaultData: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  onResetToDefaultData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200/90 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-800 via-teal-800 to-sky-900 text-white">
          <div className="flex items-center gap-3">
            <PagueplayLogo variant="icon" size="sm" />
            <div>
              <h2 className="text-base font-bold">
                Instruções & Regras de Controle de Ausências
              </h2>
              <p className="text-xs text-emerald-100/80">
                Padrões operacionais Pagueplay
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

        <div className="p-6 space-y-4 text-xs text-slate-700">
          <div className="space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-slate-900 block font-bold">
                  Data da Ausência & Cálculo Automático
                </strong>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Ao selecionar a data da ausência ou do atestado, a <em>Semana do Mês</em> (ex: 3ª semana) e o <em>Mês</em> são calculados automaticamente conforme a regra do calendário corporativo.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-700 shrink-0">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-slate-900 block font-bold">
                  Total de Ausências (Dias)
                </strong>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  O sistema soma automaticamente <code>Dias de Atestado + Ausências Injustificadas = Total de Ausências</code>, garantindo coerência matemática em todos os relatórios e no banco de dados.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-slate-900 block font-bold">
                  Perfis de Acesso (ADM & Visitante)
                </strong>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Apenas usuários com perfil <strong>Administrador (ADM)</strong> podem cadastrar novas ausências, editar, excluir registros e gerenciar configurações do banco de dados. Novos administradores podem ser cadastrados diretamente pelo menu superior.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-700 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-slate-900 block font-bold">
                  Filtro por Gestor & Dashboards por Setor
                </strong>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Utilize os seletores de liderança para visualizar o índice de absenteísmo sob responsabilidade de cada gestor e analise métricas isoladas em cada setor (Play 5, Play 4, Cofen e Play Mix).
                </p>
              </div>
            </div>
          </div>

          {/* Reset Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Deseja recarregar a planilha original?</span>
            <button
              onClick={() => {
                if (window.confirm('Deseja restaurar todos os 26 registros originais da planilha? Registros recém-criados localmente serão redefinidos.')) {
                  onResetToDefaultData();
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Planilha Inicial</span>
            </button>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
