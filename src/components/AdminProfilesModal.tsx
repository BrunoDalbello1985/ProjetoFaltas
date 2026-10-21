import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  KeyRound, 
  ShieldCheck, 
  X, 
  Briefcase, 
  Mail, 
  Building2, 
  Check, 
  Eye, 
  EyeOff,
  AlertTriangle 
} from 'lucide-react';
import { AdminUser } from '../types/attendance';
import { getAdminUsers, saveAdminUser, deleteAdminUser } from '../services/adminService';

interface AdminProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminsUpdated?: () => void;
}

export const AdminProfilesModal: React.FC<AdminProfilesModalProps> = ({
  isOpen,
  onClose,
  onAdminsUpdated,
}) => {
  const [admins, setAdmins] = useState<AdminUser[]>(() => getAdminUsers());
  const [isAdding, setIsAdding] = useState(false);
  const [showPins, setShowPins] = useState<{ [id: string]: boolean }>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  // New Admin Form State
  const [formData, setFormData] = useState({
    name: '',
    cargo: '',
    email: '',
    pin: '',
    setor: 'Todos os Setores',
  });
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const refreshList = () => {
    const list = getAdminUsers();
    setAdmins(list);
    if (onAdminsUpdated) onAdminsUpdated();
  };

  const handleTogglePin = (id: string) => {
    setShowPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja remover o acesso administrativo de "${name}"?`)) {
      const ok = deleteAdminUser(id);
      if (ok) {
        setFeedback(`Administrador "${name}" removido com sucesso.`);
        refreshList();
        setTimeout(() => setFeedback(null), 3000);
      } else {
        alert('Não é possível remover o Administrador Master.');
      }
    }
  };

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Por favor informe o nome completo do administrador.');
      return;
    }
    if (!formData.pin.trim() || formData.pin.trim().length < 4) {
      setFormError('O PIN de acesso deve conter no mínimo 4 dígitos.');
      return;
    }

    // Check if PIN already used
    const existing = admins.find((a) => a.pin === formData.pin.trim());
    if (existing) {
      setFormError(`Este PIN já está cadastrado para o administrador ${existing.name}. Escolha outro PIN.`);
      return;
    }

    saveAdminUser({
      name: formData.name,
      cargo: formData.cargo || 'Gestor Administrativo',
      email: formData.email,
      pin: formData.pin,
      setor: formData.setor,
    });

    setFeedback(`Perfil de Administrador criado com sucesso para ${formData.name}!`);
    setFormData({
      name: '',
      cargo: '',
      email: '',
      pin: '',
      setor: 'Todos os Setores',
    });
    setIsAdding(false);
    refreshList();
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-800 via-teal-800 to-sky-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 shadow-xs">
              <Users className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Gestão de Perfis de Administrador</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 uppercase tracking-wider">
                  Controle de Acessos
                </span>
              </div>
              <p className="text-xs text-emerald-100/80">
                Cadastre e gerencie coordenadores e gestores com permissão total no sistema.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {feedback && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-150">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Top action: New Admin button */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 text-sm block">
                Administradores Ativos ({admins.length})
              </span>
              <span className="text-slate-500 text-xs">
                Usuários com autorização para registrar ocorrências, editar dados e gerenciar configurações.
              </span>
            </div>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Novo Administrador</span>
              </button>
            )}
          </div>

          {/* Form to Add New Admin */}
          {isAdding && (
            <form onSubmit={handleSubmitNew} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                  Cadastrar Novo Administrador
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-medium"
                >
                  Cancelar
                </button>
              </div>

              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Amanda Ferreira"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Cargo / Função
                  </label>
                  <input
                    type="text"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    placeholder="Ex: Coordenadora de Operações"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    E-mail Institucional (opcional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="amanda@pagueplay.com.br"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Setor de Atuação
                  </label>
                  <select
                    value={formData.setor}
                    onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Todos os Setores">Todos os Setores</option>
                    <option value="Play 5">Play 5</option>
                    <option value="Play 4">Play 4</option>
                    <option value="Cofen">Cofen</option>
                    <option value="Play Mix">Play Mix</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    PIN de Acesso (Senha numérica de 4 a 6 dígitos) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={formData.pin}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                      placeholder="Ex: 8899"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono tracking-widest text-slate-900"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Este PIN será digitado quando a pessoa clicar no botão de perfil para ativar o modo Administrador.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs"
                >
                  Salvar Administrador
                </button>
              </div>
            </form>
          )}

          {/* Admins List Cards */}
          <div className="space-y-3">
            {admins.map((admin) => {
              const isShowingPin = showPins[admin.id];
              return (
                <div
                  key={admin.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                      admin.isMaster
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-sky-50 border-sky-200 text-sky-700'
                    }`}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{admin.name}</span>
                        {admin.isMaster && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Master
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          {admin.cargo}
                        </span>
                        {admin.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {admin.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {admin.setor || 'Todos os Setores'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* PIN reveal */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {isShowingPin ? admin.pin : '••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTogglePin(admin.id)}
                        title={isShowingPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                        className="text-slate-400 hover:text-slate-600 ml-1 p-0.5"
                      >
                        {isShowingPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {!admin.isMaster && (
                      <button
                        onClick={() => handleDelete(admin.id, admin.name)}
                        title="Remover acesso"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 text-sky-900 text-xs space-y-1">
            <span className="font-bold block">💡 Dica de Segurança:</span>
            <p className="text-[11px] leading-relaxed text-sky-800">
              Cada administrador cadastrado pode desbloquear o modo de edição em qualquer computador inserindo seu respectivo PIN. Ao salvar qualquer registro ou exclusão, o sistema registrará quem efetuou a alteração.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
