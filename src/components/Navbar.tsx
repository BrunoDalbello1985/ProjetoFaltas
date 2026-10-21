import React, { useState } from 'react';
import {
  Plus,
  Download,
  HelpCircle,
  Calendar,
  BarChart3,
  Layers,
  AlertTriangle,
  Printer,
  RefreshCw,
  Database,
  ShieldCheck,
  Eye,
  ChevronDown,
  UserPlus,
  LogOut,
  Sparkles,
  UploadCloud,
  FileSpreadsheet,
  Building2,
} from 'lucide-react';
import { UserRole, AdminUser } from '../types/attendance';
import { PagueplayLogo } from './PagueplayLogo';

interface NavbarProps {
  currentTab: 'geral' | 'tabela' | 'setores' | 'alertas' | 'relatorio';
  setCurrentTab: (tab: 'geral' | 'tabela' | 'setores' | 'alertas' | 'relatorio') => void;
  onOpenNewRecord: () => void;
  onExportCSV: () => void;
  onOpenHelp: () => void;
  onOpenSupabaseModal: () => void;
  onOpenAdminProfiles: () => void;
  currentAdmin: AdminUser | null;
  supabaseStatus: 'connected' | 'table_missing' | 'error' | 'checking';
  totalRecords: number;
  isSyncing: boolean;
  onOpenExcelImport?: () => void;
  onOpenManageSectors?: () => void;
  userRole: UserRole;
  onSwitchToVisitor: () => void;
  onOpenAdminAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenNewRecord,
  onExportCSV,
  onOpenHelp,
  onOpenSupabaseModal,
  onOpenAdminProfiles,
  currentAdmin,
  supabaseStatus,
  totalRecords,
  isSyncing,
  onOpenExcelImport,
  onOpenManageSectors,
  userRole,
  onSwitchToVisitor,
  onOpenAdminAuth,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#dashboard"
              onClick={(e) => {
                e.preventDefault();
                setCurrentTab('geral');
              }}
              className="flex items-center gap-2 group cursor-pointer focus:outline-none"
              title="Pagueplay - Gestão de Ausências & Atestados"
            >
              <PagueplayLogo size="sm" variant="full" subtitle="Controle de Ausências" />
            </a>

            <div className="hidden xl:flex items-center gap-1.5 pl-3 border-l border-slate-200 text-[11px] text-slate-500 whitespace-nowrap">
              {isSyncing ? (
                <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  Sincronizando...
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Nuvem Conectada
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links - Center (Visible on xl+ screens to prevent navbar overflow) */}
          <nav className="hidden xl:flex items-center space-x-1">
            <button
              onClick={() => setCurrentTab('geral')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                currentTab === 'geral'
                  ? 'text-emerald-900 bg-emerald-50/90 border border-emerald-200/70 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dashboard Geral</span>
            </button>

            <button
              onClick={() => setCurrentTab('setores')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                currentTab === 'setores'
                  ? 'text-sky-900 bg-sky-50/90 border border-sky-200/70 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>Dashboards por Setor</span>
            </button>

            <button
              onClick={() => setCurrentTab('tabela')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                currentTab === 'tabela'
                  ? 'text-slate-900 bg-slate-100 border border-slate-300/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Ocorrências ({totalRecords})</span>
            </button>

            <button
              onClick={() => setCurrentTab('alertas')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                currentTab === 'alertas'
                  ? 'text-amber-900 bg-amber-50/90 border border-amber-200/70 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Alertas & Críticos</span>
            </button>

            <button
              onClick={() => setCurrentTab('relatorio')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                currentTab === 'relatorio'
                  ? 'text-teal-900 bg-teal-50/90 border border-teal-200/70 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-teal-600" />
              <span>Relatório</span>
            </button>
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Supabase Button: strictly visible for ADM on wide screens */}
            {userRole === 'admin' && (
              <button
                onClick={onOpenSupabaseModal}
                className={`hidden 2xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  supabaseStatus === 'connected'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 animate-pulse'
                }`}
                title="Configurações do banco Supabase (Apenas ADM)"
              >
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden xl:inline">Supabase:</span>
                <span>{supabaseStatus === 'connected' ? 'Conectado' : 'Configurar'}</span>
              </button>
            )}

            {/* Profile Switcher & Admin Management */}
            <div className="relative">
              {userRole === 'admin' ? (
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs hover:shadow-md transition-all cursor-pointer"
                  title="Perfil Administrador ativo - clique para opções"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                  <span className="max-w-[130px] truncate">
                    ADM: {currentAdmin?.name ? currentAdmin.name.split(' ')[0] : 'Master'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-white/80" />
                </button>
              ) : (
                <button
                  onClick={onOpenAdminAuth}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
                  title="Modo Visitante (Leitura) - clique para acessar como ADM"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Visitante</span>
                </button>
              )}

              {/* Dropdown for role switching & admin management */}
              {showRoleMenu && userRole === 'admin' && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 text-xs animate-in fade-in duration-150"
                  onClick={() => setShowRoleMenu(false)}
                >
                  <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50/60">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {currentAdmin?.name || 'Administrador Master'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {currentAdmin?.cargo || 'Acesso Geral'}
                    </p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRoleMenu(false);
                        onOpenAdminProfiles();
                      }}
                      className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Gerenciar Administradores</span>
                    </button>

                    {onOpenManageSectors && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRoleMenu(false);
                          onOpenManageSectors();
                        }}
                        className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                      >
                        <Building2 className="w-3.5 h-3.5 text-teal-600" />
                        <span>Gerenciar Setores</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRoleMenu(false);
                        onOpenSupabaseModal();
                      }}
                      className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5 text-sky-600" />
                      <span>Painel do Banco Supabase</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        onSwitchToVisitor();
                      }}
                      className="w-full text-left px-3.5 py-2 text-slate-600 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-slate-400" />
                      <span>Sair do Modo Administrador</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Help Button */}
            <button
              onClick={onOpenHelp}
              title="Instruções de preenchimento e regras"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Ajuda"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Import Excel button */}
            {onOpenExcelImport && (
              <button
                onClick={onOpenExcelImport}
                title="Carregar arquivo Excel (.xlsx / .csv)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Importar Excel</span>
                <span className="sm:hidden">Importar</span>
              </button>
            )}

            {/* Export CSV button */}
            <button
              onClick={onExportCSV}
              title="Exportar dados para Excel / CSV"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar</span>
            </button>

            {/* New Occurrence button: strictly visible for ADM */}
            {userRole === 'admin' && (
              <button
                onClick={onOpenNewRecord}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-98"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nova Ausência</span>
                <span className="sm:hidden">Nova</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation bar below header for mobile, tablet and standard laptops */}
        <div className="xl:hidden flex items-center justify-start sm:justify-center overflow-x-auto py-2 border-t border-slate-100 gap-1.5 scrollbar-none w-full">
          <button
            onClick={() => setCurrentTab('geral')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl shrink-0 inline-flex items-center gap-1.5 transition-all ${
              currentTab === 'geral'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 bg-slate-100/80 hover:bg-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Geral</span>
          </button>
          <button
            onClick={() => setCurrentTab('setores')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl shrink-0 inline-flex items-center gap-1.5 transition-all ${
              currentTab === 'setores'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 bg-slate-100/80 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Por Setor</span>
          </button>
          <button
            onClick={() => setCurrentTab('tabela')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl shrink-0 inline-flex items-center gap-1.5 transition-all ${
              currentTab === 'tabela'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 bg-slate-100/80 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Ocorrências ({totalRecords})</span>
          </button>
          <button
            onClick={() => setCurrentTab('alertas')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl shrink-0 inline-flex items-center gap-1.5 transition-all ${
              currentTab === 'alertas'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 bg-slate-100/80 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Alertas</span>
          </button>
          <button
            onClick={() => setCurrentTab('relatorio')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl shrink-0 inline-flex items-center gap-1.5 transition-all ${
              currentTab === 'relatorio'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 bg-slate-100/80 hover:bg-slate-200'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Relatório</span>
          </button>
        </div>
      </div>
    </header>
  );
};
