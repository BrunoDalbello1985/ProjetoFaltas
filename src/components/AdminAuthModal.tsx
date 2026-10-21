import React, { useState } from 'react';
import { ShieldCheck, Lock, X, CheckCircle2, AlertCircle, KeyRound, UserCheck } from 'lucide-react';
import { AdminUser } from '../types/attendance';
import { getAdminUsers, verifyAdminPin, setCurrentAdmin } from '../services/adminService';
import { PagueplayLogo } from './PagueplayLogo';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (admin: AdminUser) => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  const [error, setError] = useState(false);
  const admins = getAdminUsers();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = verifyAdminPin(pin, selectedAdminId || undefined);

    if (matched) {
      setError(false);
      setPin('');
      setCurrentAdmin(matched);
      onSuccess(matched);
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-sm w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-800 via-teal-800 to-sky-900 text-white">
          <div className="flex items-center gap-3">
            <PagueplayLogo variant="icon" size="sm" />
            <div>
              <h3 className="text-sm font-bold">Identificação de Administrador</h3>
              <p className="text-[11px] text-emerald-200/80">Acesso Total ao Sistema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Selecione seu perfil ou digite seu <strong>PIN de Administrador</strong> para liberar inclusão, edição e relatórios gerais.
          </p>

          {/* Quick Select Profile (optional) */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-700">
              Perfil (opcional):
            </label>
            <select
              value={selectedAdminId}
              onChange={(e) => setSelectedAdminId(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Qualquer Administrador Cadastrado</option>
              {admins.map((adm) => (
                <option key={adm.id} value={adm.id}>
                  {adm.name} {adm.cargo ? `— ${adm.cargo}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Digite o PIN de Segurança:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="PIN numérico (Ex: 1234)"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ''));
                  setError(false);
                }}
                className={`w-full text-sm pl-9 pr-3 py-2 bg-slate-50 border rounded-xl focus:outline-none transition-all font-mono tracking-widest ${
                  error
                    ? 'border-rose-400 ring-2 ring-rose-100 bg-rose-50/20'
                    : 'border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
                }`}
              />
            </div>
            {error && (
              <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                PIN incorreto para este perfil. Verifique com seu gestor.
              </p>
            )}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-500 flex items-start gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                PINs padrão cadastrados: <strong className="text-slate-700">1234</strong> (Master) ou <strong className="text-slate-700">5678</strong> (Bruno Dalbello).
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Entrar como Administrador</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
