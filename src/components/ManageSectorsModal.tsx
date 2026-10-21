import React, { useState, useMemo } from 'react';
import { SectorItem, AttendanceRecord, UserRole } from '../types/attendance';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  AlertTriangle, 
  Users, 
  RotateCcw,
  UserCheck, 
  Search,
  Palette,
  Info,
  Layers,
  ArrowRight,
  UserPlus,
  ShieldAlert
} from 'lucide-react';

interface ManageSectorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectors: SectorItem[];
  records: AttendanceRecord[];
  onSaveSector: (sector: SectorItem) => Promise<void>;
  onDeleteSector: (sectorId: string) => Promise<void>;
  onReassignSector?: (oldSec: string, newSec: string) => Promise<void>;
  onDeleteRecordsBySector?: (sectorName: string) => Promise<void>;
  onRenameEmployee?: (oldName: string, newName: string) => Promise<void>;
  onDeleteEmployee?: (empName: string) => Promise<void>;
  onRenameGestor?: (oldGestor: string, newGestor: string) => Promise<void>;
  onAddEmployee?: (empName: string, sector: string, gestor?: string) => Promise<void>;
  onRestoreDefaultSectors?: () => Promise<void>;
  userRole: UserRole;
  onOpenAdminAuth: () => void;
}

const COLOR_OPTIONS = [
  { id: 'emerald', label: 'Verde', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'blue', label: 'Azul', bg: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'indigo', label: 'Índigo', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { id: 'teal', label: 'Teal', bg: 'bg-teal-100 text-teal-800 border-teal-300' },
  { id: 'sky', label: 'Céu', bg: 'bg-sky-100 text-sky-800 border-sky-300' },
  { id: 'violet', label: 'Violeta', bg: 'bg-violet-100 text-violet-800 border-violet-300' },
  { id: 'amber', label: 'Âmbar', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'rose', label: 'Rosa', bg: 'bg-rose-100 text-rose-800 border-rose-300' },
];

export const ManageSectorsModal: React.FC<ManageSectorsModalProps> = ({
  isOpen,
  onClose,
  sectors,
  records,
  onSaveSector,
  onDeleteSector,
  onReassignSector,
  onDeleteRecordsBySector,
  onRenameEmployee,
  onDeleteEmployee,
  onRenameGestor,
  onAddEmployee,
  onRestoreDefaultSectors,
  userRole,
  onOpenAdminAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'setores' | 'gestores' | 'colaboradores'>('setores');

  // Sector Form State
  const [newSectorName, setNewSectorName] = useState('');
  const [newSectorGestor, setNewSectorGestor] = useState('');
  const [newSectorColor, setNewSectorColor] = useState('emerald');
  const [newSectorDesc, setNewSectorDesc] = useState('');
  
  const [editingSectorId, setEditingSectorId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editGestor, setEditGestor] = useState('');
  const [editColor, setEditColor] = useState('');

  // Delete Sector Dialog State (replaces window.confirm completely)
  const [sectorToDelete, setSectorToDelete] = useState<SectorItem | null>(null);
  const [reassignTargetSector, setReassignTargetSector] = useState<string>('');

  // Gestor Form State
  const [newGestorName, setNewGestorName] = useState('');
  const [newGestorSector, setNewGestorSector] = useState('');
  const [editingGestorOldName, setEditingGestorOldName] = useState<string | null>(null);
  const [editingGestorNewName, setEditingGestorNewName] = useState('');

  // Employee Form State
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpSector, setNewEmpSector] = useState('');
  const [newEmpGestor, setNewEmpGestor] = useState('');
  const [editingEmployeeOldName, setEditingEmployeeOldName] = useState<string | null>(null);
  const [editingEmployeeNewName, setEditingEmployeeNewName] = useState('');
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);

  // Search filter & UI feedback
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Compute occurrences and unique employees per sector
  const sectorStats = sectors.reduce((acc, sec) => {
    const secRecords = records.filter(
      (r) => r.setor.toLowerCase().trim() === sec.name.toLowerCase().trim()
    );
    const uniqueEmployees = new Set(secRecords.map((r) => r.nome)).size;
    acc[sec.id] = {
      occurrences: secRecords.length,
      employees: uniqueEmployees,
    };
    return acc;
  }, {} as Record<string, { occurrences: number; employees: number }>);

  // Compute Manager list dynamically from sectors and records
  const managersList = useMemo(() => {
    const gestorMap = new Map<string, { name: string; sectors: Set<string>; occurrences: number; employees: Set<string> }>();
    
    // Add from sectors
    sectors.forEach((s) => {
      if (s.gestor && s.gestor.trim()) {
        const name = s.gestor.trim();
        if (!gestorMap.has(name)) {
          gestorMap.set(name, { name, sectors: new Set([s.name]), occurrences: 0, employees: new Set() });
        } else {
          gestorMap.get(name)!.sectors.add(s.name);
        }
      }
    });

    // Add and tally from records
    records.forEach((r) => {
      if (r.gestor && r.gestor.trim()) {
        const name = r.gestor.trim();
        if (!gestorMap.has(name)) {
          gestorMap.set(name, { name, sectors: new Set([r.setor]), occurrences: 1, employees: new Set([r.nome]) });
        } else {
          const entry = gestorMap.get(name)!;
          entry.sectors.add(r.setor);
          entry.occurrences += 1;
          entry.employees.add(r.nome);
        }
      }
    });

    return Array.from(gestorMap.values()).map((g) => ({
      name: g.name,
      sectors: Array.from(g.sectors).join(', ') || 'Geral',
      occurrences: g.occurrences,
      employees: g.employees.size,
    })).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [sectors, records]);

  // Compute Employees list dynamically from records
  const employeesList = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.nome))).map((empName) => {
      const empRecords = records.filter((r) => r.nome === empName);
      const empSectors = Array.from(new Set(empRecords.map((r) => r.setor))).join(', ');
      const empGestor = Array.from(new Set(empRecords.map((r) => r.gestor).filter(Boolean))).join(', ');
      const totalAusencias = empRecords.reduce((acc, r) => acc + r.qtdeFaltas, 0);
      const totalAtestados = empRecords.reduce((acc, r) => acc + r.diasAtestado, 0);
      const totalInjustificadas = empRecords.reduce((acc, r) => acc + r.faltasInjustificadas, 0);
      return {
        name: empName,
        sector: empSectors || 'Não definido',
        gestor: empGestor || 'Sem Gestor',
        totalAusencias,
        totalAtestados,
        totalInjustificadas,
        count: empRecords.length,
      };
    }).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [records]);

  // Filter lists based on search
  const filteredSectors = sectors.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.gestor && s.gestor.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredManagers = managersList.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.sectors.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEmployees = employeesList.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.sector.toLowerCase().includes(search.toLowerCase()) ||
    e.gestor.toLowerCase().includes(search.toLowerCase())
  );

  // --- SECTOR HANDLERS ---
  const handleCreateSector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'admin') {
      onOpenAdminAuth();
      return;
    }

    const trimmed = newSectorName.trim();
    if (!trimmed) {
      setError('Por favor, informe o nome do novo setor.');
      return;
    }

    const duplicate = sectors.find(
      (s) => s.name.toLowerCase().trim() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setError(`O setor "${trimmed}" já está cadastrado.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      // Ensure zero undefined fields:
      const sectorPayload: SectorItem = {
        id: `sec-${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`,
        name: trimmed,
        gestor: newSectorGestor.trim() || '',
        color: newSectorColor || 'emerald',
        description: newSectorDesc.trim() || '',
        isDefault: false,
        createdAt: new Date().toISOString(),
      };

      await onSaveSector(sectorPayload);

      setNewSectorName('');
      setNewSectorGestor('');
      setNewSectorDesc('');
      setSuccessMsg(`Setor "${trimmed}" cadastrado com sucesso!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(`Falha ao salvar setor: ${err.message || 'Erro inesperado'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (sector: SectorItem) => {
    if (userRole !== 'admin') {
      onOpenAdminAuth();
      return;
    }
    setEditingSectorId(sector.id);
    setEditName(sector.name);
    setEditGestor(sector.gestor || '');
    setEditColor(sector.color || 'emerald');
  };

  const handleSaveEdit = async (sector: SectorItem) => {
    if (!editName.trim()) {
      setError('O nome do setor não pode ficar vazio.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSaveSector({
        ...sector,
        name: editName.trim(),
        gestor: editGestor.trim() || '',
        color: editColor || 'emerald',
        description: sector.description || '',
      });
      setEditingSectorId(null);
      setSuccessMsg('Setor atualizado com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(`Erro ao atualizar: ${err.message || 'Falha no banco'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const promptDeleteSector = (sector: SectorItem) => {
    if (userRole !== 'admin') {
      onOpenAdminAuth();
      return;
    }
    // Always open in-app dialog (avoids window.confirm blocked by browser/iframe)
    setSectorToDelete(sector);
    const remainingSectors = sectors.filter((s) => s.id !== sector.id);
    setReassignTargetSector(remainingSectors[0]?.name || '');
  };

  const handleConfirmReassignAndDelete = async () => {
    if (!sectorToDelete) return;
    try {
      setIsSubmitting(true);
      setError(null);
      if (reassignTargetSector && onReassignSector) {
        await onReassignSector(sectorToDelete.name, reassignTargetSector);
      }
      await onDeleteSector(sectorToDelete.id);
      setSuccessMsg(`Setor "${sectorToDelete.name}" excluído e dados transferidos para "${reassignTargetSector}".`);
      setSectorToDelete(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(`Erro ao transferir e excluir: ${err.message || 'Falha de comunicação'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectDeleteSector = async () => {
    if (!sectorToDelete) return;
    try {
      setIsSubmitting(true);
      setError(null);
      if (onDeleteRecordsBySector) {
        await onDeleteRecordsBySector(sectorToDelete.name);
      }
      await onDeleteSector(sectorToDelete.id);
      setSuccessMsg(`Setor "${sectorToDelete.name}" e seus registros foram removidos.`);
      setSectorToDelete(null);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(`Erro ao excluir: ${err.message || 'Falha no banco'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- GESTOR HANDLERS ---
  const handleCreateGestor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'admin') {
      onOpenAdminAuth();
      return;
    }
    const cleanName = newGestorName.trim();
    if (!cleanName) {
      setError('Por favor, informe o nome do gestor.');
      return;
    }
    if (!newGestorSector) {
      setError('Selecione o setor de atuação para este gestor.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const targetSec = sectors.find((s) => s.name === newGestorSector);
      if (targetSec) {
        await onSaveSector({
          ...targetSec,
          gestor: cleanName,
        });
      }
      setNewGestorName('');
      setNewGestorSector('');
      setSuccessMsg(`Gestor "${cleanName}" vinculado ao setor "${newGestorSector}" com sucesso!`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(`Erro ao cadastrar gestor: ${err.message || 'Erro inesperado'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenameGestorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGestorOldName || !editingGestorNewName.trim()) return;
    try {
      setIsSubmitting(true);
      setError(null);
      if (onRenameGestor) {
        await onRenameGestor(editingGestorOldName, editingGestorNewName.trim());
      }
      setEditingGestorOldName(null);
      setEditingGestorNewName('');
      setSuccessMsg(`Liderança renomeada com sucesso!`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(`Erro ao renomear gestor: ${err.message || 'Falha no banco'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- EMPLOYEE HANDLERS ---
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'admin') {
      onOpenAdminAuth();
      return;
    }
    const cleanName = newEmpName.trim().toUpperCase();
    if (!cleanName) {
      setError('Informe o nome do colaborador.');
      return;
    }
    const targetSector = newEmpSector || sectors[0]?.name || 'Play 5';

    try {
      setIsSubmitting(true);
      setError(null);
      if (onAddEmployee) {
        await onAddEmployee(cleanName, targetSector, newEmpGestor.trim() || undefined);
      }
      setNewEmpName('');
      setNewEmpGestor('');
      setSuccessMsg(`Colaborador "${cleanName}" cadastrado com sucesso!`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(`Erro ao cadastrar colaborador: ${err.message || 'Falha'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenameEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployeeOldName || !editingEmployeeNewName.trim()) return;
    try {
      setIsSubmitting(true);
      setError(null);
      if (onRenameEmployee) {
        await onRenameEmployee(editingEmployeeOldName, editingEmployeeNewName.trim().toUpperCase());
      }
      setEditingEmployeeOldName(null);
      setEditingEmployeeNewName('');
      setSuccessMsg('Nome do colaborador atualizado com sucesso em todas as ausências!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(`Erro ao renomear: ${err.message || 'Falha de comunicação'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    try {
      setIsSubmitting(true);
      setError(null);
      if (onDeleteEmployee) {
        await onDeleteEmployee(employeeToDelete);
      }
      setSuccessMsg(`Colaborador "${employeeToDelete}" e seu histórico foram removidos.`);
      setEmployeeToDelete(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(`Erro ao excluir colaborador: ${err.message || 'Falha no banco'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-800 via-teal-800 to-sky-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
              <Building2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                  Cadastros Gerais da Empresa
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                  CRUD Completo
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 hidden sm:block">
                Gerencie Setores, Gestores e Colaboradores com sincronização em tempo real
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 sm:px-6 bg-slate-50/80 shrink-0">
          <div className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => { setActiveTab('setores'); setSearch(''); }}
              className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'setores'
                  ? 'border-emerald-600 text-emerald-800 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Setores ({sectors.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('gestores'); setSearch(''); }}
              className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'gestores'
                  ? 'border-sky-600 text-sky-800 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Gestores ({managersList.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('colaboradores'); setSearch(''); }}
              className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'colaboradores'
                  ? 'border-teal-600 text-teal-800 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-teal-600" />
              <span>Colaboradores ({employeesList.length})</span>
            </button>
          </div>

          {activeTab === 'setores' && onRestoreDefaultSectors && userRole === 'admin' && (
            <button
              type="button"
              onClick={async () => {
                try {
                  setIsSubmitting(true);
                  await onRestoreDefaultSectors();
                  setSuccessMsg('Setores padrão restaurados!');
                  setTimeout(() => setSuccessMsg(null), 3000);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-white transition-colors cursor-pointer"
              title="Restaurar lista de setores padrão da empresa"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Restaurar Padrão</span>
            </button>
          )}
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* =========================================
              TAB 1: SETORES (CRUD COMPLETO)
             ========================================= */}
          {activeTab === 'setores' && (
            <>
              {/* Add New Sector Form */}
              <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  Cadastrar Novo Setor
                </h4>

                <form onSubmit={handleCreateSector} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nome do Setor / Área *
                      </label>
                      <input
                        type="text"
                        required
                        value={newSectorName}
                        onChange={(e) => setNewSectorName(e.target.value)}
                        placeholder="Ex: Play 6, Comercial, Financeiro, TI..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Gestor / Liderança Responsável
                      </label>
                      <input
                        type="text"
                        value={newSectorGestor}
                        onChange={(e) => setNewSectorGestor(e.target.value)}
                        placeholder="Ex: Bruno Dalbello, Maria, Isabela..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Color Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                      <Palette className="w-3.5 h-3.5 text-slate-500" />
                      Cor de Identificação
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {COLOR_OPTIONS.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setNewSectorColor(col.id)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            newSectorColor === col.id
                              ? `${col.bg} ring-2 ring-emerald-500 scale-105`
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {col.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting || !newSectorName.trim()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:bg-slate-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Setor</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Sectors List with Search */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    Setores Cadastrados ({sectors.length})
                  </h4>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filtrar setores..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-48"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {filteredSectors.map((sector) => {
                    const stats = sectorStats[sector.id] || { occurrences: 0, employees: 0 };
                    const isEditing = editingSectorId === sector.id;

                    return (
                      <div
                        key={sector.id}
                        className="p-3.5 bg-white hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        {isEditing ? (
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Nome do setor"
                              className="px-2.5 py-1.5 text-xs font-bold border border-emerald-400 rounded-lg bg-white"
                            />
                            <input
                              type="text"
                              value={editGestor}
                              onChange={(e) => setEditGestor(e.target.value)}
                              placeholder="Gestor responsável"
                              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-sm text-slate-900">
                                {sector.name}
                              </span>
                              {sector.isDefault && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                  Padrão
                                </span>
                              )}
                              <span className="text-[10px] font-semibold text-slate-500">
                                • {stats.occurrences} ausência(s)
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500">
                                • {stats.employees} colaborador(es)
                              </span>
                            </div>
                            {sector.gestor && (
                              <p className="text-[11px] text-slate-500">
                                Gestor: <strong className="text-slate-700">{sector.gestor}</strong>
                              </p>
                            )}
                          </div>
                        )}

                        {/* Actions available for ALL sectors without exception */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(sector)}
                                disabled={isSubmitting}
                                className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Salvar alterações"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingSectorId(null)}
                                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              {userRole === 'admin' && (
                                <button
                                  onClick={() => startEdit(sector)}
                                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title={`Editar setor ${sector.name}`}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {/* EXCLUIR SETOR: Habilitado para TODOS os setores (padrão ou novo) */}
                              {userRole === 'admin' && (
                                <button
                                  onClick={() => promptDeleteSector(sector)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title={`Excluir setor ${sector.name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {filteredSectors.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      Nenhum setor encontrado com o filtro "{search}".
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* =========================================
              TAB 2: GESTORES / LIDERANÇAS (CRUD COMPLETO)
             ========================================= */}
          {activeTab === 'gestores' && (
            <div className="space-y-6">
              {/* Add New Gestor Form */}
              <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-sky-600" />
                  Cadastrar Nova Liderança / Gestor
                </h4>

                <form onSubmit={handleCreateGestor} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nome do Gestor *
                    </label>
                    <input
                      type="text"
                      required
                      value={newGestorName}
                      onChange={(e) => setNewGestorName(e.target.value)}
                      placeholder="Ex: Carlos Eduardo, Renata Lima..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Setor de Atuação *
                    </label>
                    <select
                      value={newGestorSector}
                      onChange={(e) => setNewGestorSector(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                    >
                      <option value="">Selecione um setor...</option>
                      {sectors.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={isSubmitting || !newGestorName.trim() || !newGestorSector}
                      className="w-full px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Vincular Gestor</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Editing Gestor Inline Form */}
              {editingGestorOldName && (
                <form
                  onSubmit={handleRenameGestorSubmit}
                  className="p-3.5 bg-sky-50 border border-sky-300 rounded-2xl flex flex-col sm:flex-row items-center gap-2.5 animate-in fade-in"
                >
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold text-sky-900 mb-1">
                      Renomear "{editingGestorOldName}" em todos os setores e ausências:
                    </label>
                    <input
                      type="text"
                      required
                      value={editingGestorNewName}
                      onChange={(e) => setEditingGestorNewName(e.target.value)}
                      placeholder="Novo nome do gestor..."
                      className="w-full px-3 py-1.5 bg-white border border-sky-400 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto pt-2 sm:pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting || !editingGestorNewName.trim()}
                      className="px-3.5 py-1.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Salvar em Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingGestorOldName(null)}
                      className="px-2.5 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {/* Managers List */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                    Lideranças e Gestores Registrados ({managersList.length})
                  </h4>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filtrar gestores..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 w-full sm:w-48"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {filteredManagers.map((m) => (
                    <div key={m.name} className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-extrabold text-sm text-slate-900">{m.name}</p>
                        <p className="text-[11px] text-slate-500">
                          Setor(es): <strong className="text-slate-700">{m.sectors}</strong> • {m.employees} liderado(s) • {m.occurrences} ausência(s) registrada(s)
                        </p>
                      </div>

                      {userRole === 'admin' && (
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            onClick={() => {
                              setEditingGestorOldName(m.name);
                              setEditingGestorNewName(m.name);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="Renomear gestor"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Renomear</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {filteredManagers.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      Nenhum gestor encontrado.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================
              TAB 3: COLABORADORES (CRUD COMPLETO)
             ========================================= */}
          {activeTab === 'colaboradores' && (
            <div className="space-y-6">
              {/* Add New Employee Form */}
              <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-teal-600" />
                  Cadastrar Novo Colaborador
                </h4>

                <form onSubmit={handleCreateEmployee} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nome Completo do Colaborador *
                    </label>
                    <input
                      type="text"
                      required
                      value={newEmpName}
                      onChange={(e) => setNewEmpName(e.target.value)}
                      placeholder="Ex: RAISSA PALOMA ALVES DA SILVA"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Setor *
                    </label>
                    <select
                      value={newEmpSector}
                      onChange={(e) => setNewEmpSector(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    >
                      {sectors.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={isSubmitting || !newEmpName.trim()}
                      className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Cadastrar</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Editing Employee Name Inline Form */}
              {editingEmployeeOldName && (
                <form
                  onSubmit={handleRenameEmployeeSubmit}
                  className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-center gap-2.5 animate-in fade-in"
                >
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold text-emerald-900 mb-1">
                      Renomear "{editingEmployeeOldName}" em todas as ausências:
                    </label>
                    <input
                      type="text"
                      required
                      value={editingEmployeeNewName}
                      onChange={(e) => setEditingEmployeeNewName(e.target.value)}
                      placeholder="Novo nome completo..."
                      className="w-full px-3 py-1.5 bg-white border border-emerald-400 rounded-xl text-xs font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto pt-2 sm:pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting || !editingEmployeeNewName.trim()}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Salvar em Todas
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingEmployeeOldName(null)}
                      className="px-2.5 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {/* Employees List */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-teal-600" />
                    Colaboradores com Registros ({employeesList.length})
                  </h4>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filtrar colaboradores..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 w-full sm:w-48"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => (
                    <div key={emp.name} className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-extrabold text-sm text-slate-900">{emp.name}</p>
                        <p className="text-[11px] text-slate-500">
                          Setor: <strong className="text-slate-700">{emp.sector}</strong> • Gestor: <strong className="text-slate-700">{emp.gestor}</strong>
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Total de Faltas: <strong className="text-slate-900">{emp.totalAusencias}</strong> • Atestados: <strong className="text-sky-700">{emp.totalAtestados}d</strong> • Injustificadas: <strong className="text-rose-700">{emp.totalInjustificadas}d</strong> ({emp.count} lançamento{emp.count > 1 ? 's' : ''})
                        </p>
                      </div>

                      {userRole === 'admin' && (
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            onClick={() => {
                              setEditingEmployeeOldName(emp.name);
                              setEditingEmployeeNewName(emp.name);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="Renomear colaborador em todas as ocorrências"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Renomear</span>
                          </button>
                          <button
                            onClick={() => setEmployeeToDelete(emp.name)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir colaborador e seu histórico"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {filteredEmployees.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      Nenhum colaborador encontrado com o filtro "{search}".
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-emerald-600" />
            CRUD completo com sincronização e persistência em tempo real.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* =========================================
          IN-APP CONFIRMATION: DELETE SECTOR
         ========================================= */}
      {sectorToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Excluir Setor "{sectorToDelete.name}"
                </h4>
                <p className="text-[11px] text-slate-500">
                  {sectorStats[sectorToDelete.id]?.occurrences || 0} ausência(s) registrada(s) neste setor
                </p>
              </div>
            </div>

            {(sectorStats[sectorToDelete.id]?.occurrences || 0) > 0 ? (
              <>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Para onde deseja reatribuir as ausências e colaboradores vinculados ao setor <strong>{sectorToDelete.name}</strong> antes de excluí-lo?
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Novo Setor de Destino:
                  </label>
                  <select
                    value={reassignTargetSector}
                    onChange={(e) => setReassignTargetSector(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {sectors
                      .filter((s) => s.id !== sectorToDelete.id)
                      .map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSectorToDelete(null)}
                    className="w-full sm:w-auto px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDirectDeleteSector}
                    className="w-full sm:w-auto px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl cursor-pointer"
                  >
                    Excluir com Ocorrências
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting || !reassignTargetSector}
                    onClick={handleConfirmReassignAndDelete}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-xl cursor-pointer shadow-xs"
                  >
                    Reatribuir e Excluir
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tem certeza que deseja excluir o setor <strong>"{sectorToDelete.name}"</strong>? Esta ação removerá o setor do banco de dados em nuvem.
                </p>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSectorToDelete(null)}
                    className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDirectDeleteSector}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer shadow-xs"
                  >
                    Confirmar Exclusão
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* =========================================
          IN-APP CONFIRMATION: DELETE EMPLOYEE
         ========================================= */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Excluir Colaborador
                </h4>
                <p className="text-[11px] text-slate-500">
                  {employeeToDelete}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja realmente excluir <strong>"{employeeToDelete}"</strong> e todas as suas ocorrências de ausências e atestados? Esta ação é irreversível.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDeleteEmployee}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer shadow-xs"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
