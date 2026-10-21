import React, { useState, useEffect, useMemo } from 'react';
import { AttendanceRecord, SectorSummary, UserRole, AdminUser, SectorItem } from './types/attendance';
import { INITIAL_ATTENDANCE_DATA, SETORES_DISPONIVEIS } from './data/initialData';
import { exportToCSV } from './utils/dateCalculations';
import { testConnection } from './firebase';
import {
  subscribeToAttendanceRecords,
  saveAttendanceRecordOnline,
  deleteAttendanceRecordOnline,
  restoreDefaultOnlineData,
  checkSupabaseHealth,
  syncAllRecordsToSupabase,
  batchImportAttendanceRecordsOnline,
  reassignSectorForRecords,
  renameEmployeeInRecords,
  deleteEmployeeAndRecords,
  deleteRecordsBySector,
  renameGestorInRecords,
} from './services/attendanceService';
import { getCurrentAdmin, setCurrentAdmin } from './services/adminService';
import {
  subscribeToSectors,
  saveSectorOnline,
  deleteSectorOnline,
  restoreDefaultSectors,
  DEFAULT_SECTORS,
} from './services/sectorService';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { OccurrenceTable } from './components/OccurrenceTable';
import { SectorAnalysis } from './components/SectorAnalysis';
import { AlertsAndRanking } from './components/AlertsAndRanking';
import { ReportPrintView } from './components/ReportPrintView';
import { RecordModal } from './components/RecordModal';
import { HelpModal } from './components/HelpModal';
import { SupabaseModal } from './components/SupabaseModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { AdminProfilesModal } from './components/AdminProfilesModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { ManageSectorsModal } from './components/ManageSectorsModal';
import { FilterToolbar } from './components/FilterToolbar';
import { PagueplayLogo } from './components/PagueplayLogo';
import { CheckCircle2, Cloud, AlertCircle, RefreshCw, Database } from 'lucide-react';

export default function App() {
  const [records, setRecords] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE_DATA);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Access Profile: 'admin' (full access) or 'visitor' (read-only)
  const [userRole, setUserRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('sgf_user_role');
    return saved === 'visitor' ? 'visitor' : 'admin';
  });
  const [currentAdmin, setCurrentAdminState] = useState<AdminUser | null>(() => getCurrentAdmin());
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [isAdminProfilesModalOpen, setIsAdminProfilesModalOpen] = useState(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [isManageSectorsModalOpen, setIsManageSectorsModalOpen] = useState(false);

  // Dynamic sectors state
  const [sectors, setSectors] = useState<SectorItem[]>(DEFAULT_SECTORS);

  // Supabase states
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'table_missing' | 'error'>('checking');
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  const [currentTab, setCurrentTab] = useState<'geral' | 'tabela' | 'setores' | 'alertas' | 'relatorio'>('geral');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedSemana, setSelectedSemana] = useState<string>('');
  const [selectedMes, setSelectedMes] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedGestor, setSelectedGestor] = useState<string>('');
  const [tableSearchFilter, setTableSearchFilter] = useState<string>('');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [modalDefaultSector, setModalDefaultSector] = useState<string>('Play 5');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check Supabase health on startup automatically
  const verifySupabase = async () => {
    try {
      const status = await checkSupabaseHealth();
      setSupabaseStatus(status);
    } catch {
      setSupabaseStatus('error');
    }
  };

  useEffect(() => {
    verifySupabase();
  }, []);

  // Initialize and subscribe to online database in real-time automatically on all devices
  useEffect(() => {
    testConnection().then((isConnected) => {
      if (!isConnected) {
        setSyncError("Conexão offline. Operando com dados locais em cache.");
      }
    });

    setIsSyncing(true);
    const unsubscribeSnapshot = subscribeToAttendanceRecords(
      (onlineRecords) => {
        setRecords(onlineRecords);
        setIsSyncing(false);
        setSyncError(null);
      },
      (error) => {
        console.error("Erro na sincronização:", error);
        setSyncError("Não foi possível sincronizar em tempo real com a nuvem.");
        setIsSyncing(false);
      }
    );

    return () => unsubscribeSnapshot();
  }, []);

  // Subscribe to dynamic sectors in Firestore
  useEffect(() => {
    const unsubscribeSectors = subscribeToSectors((loadedSectors) => {
      setSectors(loadedSectors);
    });
    return () => unsubscribeSectors();
  }, []);

  // Available sector names strictly reflect the active registered sectors in Firestore
  const availableSectorNames = useMemo(() => {
    if (sectors.length > 0) {
      return sectors.map((s) => s.name);
    }
    return DEFAULT_SECTORS.map((s) => s.name);
  }, [sectors]);

  // Show auto-dismissing toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Role switching handlers
  const handleSwitchToVisitor = () => {
    setUserRole('visitor');
    setCurrentAdmin(null);
    setCurrentAdminState(null);
    localStorage.setItem('sgf_user_role', 'visitor');
    showToast('Perfil alternado para Visitante (Modo Leitura).');
  };

  const handleAdminAuthSuccess = (admin: AdminUser) => {
    setUserRole('admin');
    setCurrentAdmin(admin);
    setCurrentAdminState(admin);
    localStorage.setItem('sgf_user_role', 'admin');
    setIsAdminAuthModalOpen(false);
    showToast(`Bem-vindo, ${admin.name}! Acesso de Administrador liberado.`);
  };

  // Sector management handlers
  const handleSaveSector = async (sector: SectorItem) => {
    if (userRole !== 'admin') {
      showToast('Apenas administradores podem gerenciar setores.');
      return;
    }
    await saveSectorOnline(sector);
    showToast(`Setor "${sector.name}" salvo com sucesso!`);
  };

  const handleDeleteSector = async (sectorId: string) => {
    if (userRole !== 'admin') {
      showToast('Apenas administradores podem gerenciar setores.');
      return;
    }
    await deleteSectorOnline(sectorId);
    showToast('Setor excluído com sucesso.');
  };

  const handleReassignSector = async (oldSec: string, newSec: string) => {
    const author = currentAdmin?.name ? `${currentAdmin.name} (ADM)` : 'Administrador';
    const count = await reassignSectorForRecords(oldSec, newSec, author);
    showToast(`${count} ausência(s) transferida(s) de "${oldSec}" para "${newSec}".`);
  };

  const handleRenameEmployee = async (oldName: string, newName: string) => {
    const author = currentAdmin?.name ? `${currentAdmin.name} (ADM)` : 'Administrador';
    const count = await renameEmployeeInRecords(oldName, newName, author);
    showToast(`${count} registro(s) de "${oldName}" atualizados para "${newName}".`);
  };

  const handleDeleteEmployee = async (empName: string) => {
    const count = await deleteEmployeeAndRecords(empName);
    showToast(`Colaborador "${empName}" e ${count} registro(s) removidos.`);
  };

  const handleDeleteRecordsBySector = async (sectorName: string) => {
    const count = await deleteRecordsBySector(sectorName);
    showToast(`${count} ausência(s) do setor "${sectorName}" removidas.`);
  };

  const handleRenameGestor = async (oldGestor: string, newGestor: string) => {
    const author = currentAdmin?.name ? `${currentAdmin.name} (ADM)` : 'Administrador';
    const count = await renameGestorInRecords(oldGestor, newGestor, author);
    for (const sec of sectors) {
      if (sec.gestor === oldGestor) {
        await saveSectorOnline({ ...sec, gestor: newGestor });
      }
    }
    showToast(`Gestor "${oldGestor}" atualizado para "${newGestor}".`);
  };

  const handleAddNewEmployee = async (empName: string, sector: string, gestor?: string) => {
    const defaultDate = new Date().toISOString().slice(0, 10);
    const author = currentAdmin?.name ? `${currentAdmin.name} (ADM)` : 'Administrador';
    await saveAttendanceRecordOnline({
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      nome: empName.trim().toUpperCase(),
      setor: sector,
      gestor: gestor || '',
      data: defaultDate,
      qtdeFaltas: 1,
      diasAtestado: 0,
      faltasInjustificadas: 1,
      semana: '3ª semana',
      mes: 'setembro',
      ano: 2026,
      observacoes: 'Cadastro de colaborador'
    }, author);
    showToast(`Colaborador "${empName.toUpperCase()}" cadastrado com sucesso!`);
  };

  const handleRestoreDefaultSectors = async () => {
    await restoreDefaultSectors();
    showToast('Setores padrão restaurados com sucesso!');
  };

  const handleQuickCreateSector = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await saveSectorOnline({
      id: `sec-${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`,
      name: trimmed,
      color: 'emerald',
      isDefault: false,
      createdAt: new Date().toISOString(),
    });
    showToast(`Setor "${trimmed}" cadastrado com sucesso!`);
  };

  // Detected months from records plus common corporate months
  const availableMeses = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.mes) set.add(r.mes.toLowerCase().trim());
    });
    ['setembro', 'outubro', 'novembro', 'dezembro'].forEach((m) => set.add(m));
    return Array.from(set).sort();
  }, [records]);

  // Detected weeks from records plus default 5 weeks
  const availableSemanas = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.semana) set.add(r.semana.trim());
    });
    ['1ª semana', '2ª semana', '3ª semana', '4ª semana', '5ª semana'].forEach((s) => set.add(s));
    return Array.from(set).sort();
  }, [records]);

  // Globally filtered records respecting Period, Month, Week, Sector and Manager in all views
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // 1. Setor filter
      if (selectedSector && r.setor.toLowerCase().trim() !== selectedSector.toLowerCase().trim()) {
        return false;
      }
      // 2. Mês filter
      if (selectedMes && r.mes.toLowerCase().trim() !== selectedMes.toLowerCase().trim()) {
        return false;
      }
      // 3. Semana filter
      if (selectedSemana && r.semana.toLowerCase().trim() !== selectedSemana.toLowerCase().trim()) {
        return false;
      }
      // 4. Período / Datas (startDate & endDate)
      if (startDate && r.data < startDate) {
        return false;
      }
      if (endDate && r.data > endDate) {
        return false;
      }
      // 5. Gestor filter
      if (selectedGestor && r.gestor !== selectedGestor) {
        return false;
      }
      return true;
    });
  }, [records, selectedSector, selectedMes, selectedSemana, startDate, endDate, selectedGestor]);

  // Compute sector summaries dynamically based on the filtered records
  const sectorSummaries: SectorSummary[] = useMemo(() => {
    const sectorMap: { [key: string]: { totalFaltas: number; diasAtestado: number; faltasInjustificadas: number; nomes: Set<string> } } = {};

    availableSectorNames.forEach((s) => {
      sectorMap[s] = { totalFaltas: 0, diasAtestado: 0, faltasInjustificadas: 0, nomes: new Set() };
    });

    filteredRecords.forEach((record) => {
      const sec = record.setor || 'Play 5';
      if (!sectorMap[sec]) {
        sectorMap[sec] = { totalFaltas: 0, diasAtestado: 0, faltasInjustificadas: 0, nomes: new Set() };
      }
      sectorMap[sec].totalFaltas += record.qtdeFaltas;
      sectorMap[sec].diasAtestado += record.diasAtestado;
      sectorMap[sec].faltasInjustificadas += record.faltasInjustificadas;
      sectorMap[sec].nomes.add(record.nome);
    });

    return Object.entries(sectorMap).map(([setor, data]) => {
      const taxaJustificadas = data.totalFaltas > 0
        ? Math.round((data.diasAtestado / data.totalFaltas) * 100)
        : 100;

      return {
        setor,
        totalFaltas: data.totalFaltas,
        diasAtestado: data.diasAtestado,
        faltasInjustificadas: data.faltasInjustificadas,
        totalColaboradores: data.nomes.size,
        taxaJustificadas,
      };
    });
  }, [availableSectorNames, filteredRecords]);

  // Save record
  const handleSaveRecord = async (savedRecord: AttendanceRecord) => {
    if (userRole !== 'admin') {
      showToast('Apenas administradores podem gravar ou editar registros.');
      return;
    }

    try {
      setIsSyncing(true);
      const author = currentAdmin?.name ? `${currentAdmin.name} (ADM)` : 'Administrador';
      await saveAttendanceRecordOnline(savedRecord, author);
      showToast(`Registro de "${savedRecord.nome}" salvo com sucesso!`);
      setIsRecordModalOpen(false);
      setEditingRecord(null);
      await verifySupabase();
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      showToast(`Erro ao salvar: ${err.message || 'Falha de gravação'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete record
  const handleDeleteRecord = async (id: string) => {
    if (userRole !== 'admin') {
      showToast('Apenas administradores podem excluir registros.');
      return;
    }

    const item = records.find(r => r.id === id);
    const confirmName = item ? `de "${item.nome}"` : '';

    if (window.confirm(`Tem certeza que deseja excluir esta ocorrência ${confirmName}? A exclusão será refletida no banco de dados.`)) {
      try {
        setIsSyncing(true);
        await deleteAttendanceRecordOnline(id);
        showToast('Registro de ausência excluído com sucesso.');
        await verifySupabase();
      } catch (err: any) {
        console.error("Erro ao deletar:", err);
        showToast(`Erro ao excluir: ${err.message || 'Falha de exclusão'}`);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    exportToCSV(records, `ausencias_pagueplay_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast('Planilha de ausências exportada com sucesso!');
  };

  // Sync All to Supabase
  const handleSyncAllToSupabase = async () => {
    if (userRole !== 'admin') {
      showToast('Ação restrita ao Administrador.');
      return;
    }
    const author = currentAdmin?.name ? `${currentAdmin.name} (ADM)` : 'Administrador';
    await syncAllRecordsToSupabase(records, author);
    await verifySupabase();
  };

  // Open modal for editing
  const handleEditRecord = (record: AttendanceRecord) => {
    if (userRole !== 'admin') {
      showToast('Apenas administradores podem editar registros.');
      return;
    }
    setEditingRecord(record);
    setIsRecordModalOpen(true);
  };

  // Open modal for new record
  const handleOpenNewRecord = (defaultSector?: string) => {
    if (userRole !== 'admin') {
      showToast('Apenas administradores podem cadastrar novas ausências.');
      return;
    }
    setEditingRecord(null);
    if (defaultSector) {
      setModalDefaultSector(defaultSector);
    }
    setIsRecordModalOpen(true);
  };

  // Restore initial standard data
  const handleRestoreData = async () => {
    if (userRole !== 'admin') {
      showToast('Ação restrita ao Administrador.');
      return;
    }

    if (window.confirm("Restaurar os 26 registros oficiais da planilha padrão no banco online?")) {
      try {
        setIsSyncing(true);
        const author = currentAdmin?.name ? `${currentAdmin.name} (ADM)` : 'Administrador';
        await restoreDefaultOnlineData(author);
        showToast('Dados padrão restaurados na nuvem com sucesso!');
        await verifySupabase();
      } catch (error) {
        console.error("Erro ao restaurar:", error);
        showToast('Erro ao restaurar dados online.');
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Batch Import from Excel (.xlsx / .csv)
  const handleImportExcelSuccess = async (newRecords: AttendanceRecord[], mode: 'append' | 'replace') => {
    try {
      setIsSyncing(true);
      const author = currentAdmin?.name ? `${currentAdmin.name} (ADM)` : 'Administrador';
      const result = await batchImportAttendanceRecordsOnline(newRecords, mode === 'replace', author);
      showToast(`Importação concluída com sucesso! ${result.count} registro(s) gravados na nuvem.`);
      await verifySupabase();
    } catch (err: any) {
      console.error("Erro na importação Excel:", err);
      showToast(`Erro ao importar: ${err.message || 'Falha de gravação'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Quick navigation to employee in table
  const handleFilterTableByEmployee = (name: string) => {
    setTableSearchFilter(name);
    setCurrentTab('tabela');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Bar with Profiles, Tabs and Clean Layout */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenNewRecord={() => handleOpenNewRecord()}
        onExportCSV={handleExportCSV}
        onOpenExcelImport={() => setIsExcelImportModalOpen(true)}
        onOpenManageSectors={() => setIsManageSectorsModalOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenAdminProfiles={() => setIsAdminProfilesModalOpen(true)}
        currentAdmin={currentAdmin}
        supabaseStatus={supabaseStatus}
        totalRecords={records.length}
        isSyncing={isSyncing}
        userRole={userRole}
        onSwitchToVisitor={handleSwitchToVisitor}
        onOpenAdminAuth={() => setIsAdminAuthModalOpen(true)}
      />

      {/* Sync Error Banner if any */}
      {syncError && (
        <div className="bg-amber-600 text-white text-xs py-2.5 px-4 flex items-center justify-between print:hidden shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{syncError}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5">
        {/* Unified Filter Toolbar across all views */}
        <FilterToolbar
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          selectedMes={selectedMes}
          onMesChange={setSelectedMes}
          availableMeses={availableMeses}
          selectedSemana={selectedSemana}
          onSemanaChange={setSelectedSemana}
          availableSemanas={availableSemanas}
          selectedSetor={selectedSector}
          onSetorChange={setSelectedSector}
          availableSetores={availableSectorNames}
          totalRecords={records.length}
          filteredCount={filteredRecords.length}
          onResetFilters={() => {
            setSelectedSector('');
            setSelectedMes('');
            setSelectedSemana('');
            setStartDate('');
            setEndDate('');
            setSelectedGestor('');
          }}
        />

        {currentTab === 'geral' && (
          <DashboardOverview
            records={filteredRecords}
            sectorSummaries={sectorSummaries}
            onSelectSector={(s) => setSelectedSector(s)}
            onSelectTab={setCurrentTab}
            activeSectorFilter={selectedSector}
            onFilterChange={setSelectedSector}
            activeSemanaFilter={selectedSemana}
            onSemanaFilterChange={setSelectedSemana}
            activeGestorFilter={selectedGestor}
            onGestorFilterChange={setSelectedGestor}
            onFilterTableByEmployee={handleFilterTableByEmployee}
          />
        )}

        {currentTab === 'tabela' && (
          <OccurrenceTable
            records={filteredRecords}
            onEditRecord={handleEditRecord}
            onDeleteRecord={handleDeleteRecord}
            onNewRecord={() => handleOpenNewRecord(selectedSector || 'Play 5')}
            onExportCSV={handleExportCSV}
            selectedSectorFilter={selectedSector}
            onSetSectorFilter={setSelectedSector}
            initialSearch={tableSearchFilter}
            onClearInitialSearch={() => setTableSearchFilter('')}
            onOpenExcelImport={() => setIsExcelImportModalOpen(true)}
            userRole={userRole}
          />
        )}

        {currentTab === 'setores' && (
          <SectorAnalysis
            records={filteredRecords}
            sectorSummaries={sectorSummaries}
            selectedSector={selectedSector}
            onSelectSector={setSelectedSector}
            onNewRecordForSector={(sec) => handleOpenNewRecord(sec)}
            onEditRecord={handleEditRecord}
            availableSectors={availableSectorNames}
            onOpenManageSectors={() => setIsManageSectorsModalOpen(true)}
            userRole={userRole}
          />
        )}

        {currentTab === 'alertas' && (
          <AlertsAndRanking
            records={filteredRecords}
            onEditRecord={handleEditRecord}
            onFilterTableByEmployee={handleFilterTableByEmployee}
            userRole={userRole}
          />
        )}

        {currentTab === 'relatorio' && (
          <ReportPrintView
            records={filteredRecords}
            sectorSummaries={sectorSummaries}
            onBack={() => setCurrentTab('geral')}
            onExportCSV={handleExportCSV}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="print:hidden border-t border-slate-200/80 bg-white/80 backdrop-blur-md py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2.5">
            <PagueplayLogo variant="icon" size="sm" />
            <span className="font-medium text-slate-600">
              Pagueplay · Sistema Integrado de Gestão de Ausências & Atestados
            </span>
          </div>
          <div className="flex items-center gap-3">
            {userRole === 'admin' && (
              <>
                <button
                  onClick={() => setIsAdminProfilesModalOpen(true)}
                  className="hover:text-emerald-700 font-semibold transition-colors cursor-pointer"
                >
                  Gerenciar ADMs
                </button>
                <span>•</span>
                <button
                  onClick={() => setIsSupabaseModalOpen(true)}
                  className="hover:text-emerald-700 font-semibold transition-colors cursor-pointer"
                >
                  Banco Supabase
                </button>
                <span>•</span>
                <button
                  onClick={handleRestoreData}
                  className="hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Restaurar Padrão
                </button>
                <span>•</span>
              </>
            )}
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="hover:text-slate-800 transition-colors cursor-pointer"
            >
              Regras & Ajuda
            </button>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveRecord}
        initialData={editingRecord}
        defaultSector={modalDefaultSector}
        availableSectors={availableSectorNames}
        onQuickCreateSector={handleQuickCreateSector}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onResetToDefaultData={handleRestoreData}
      />

      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        supabaseStatus={supabaseStatus}
        onRefreshStatus={verifySupabase}
        currentRecords={records}
        onSyncAllToSupabase={handleSyncAllToSupabase}
      />

      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={handleAdminAuthSuccess}
      />

      <AdminProfilesModal
        isOpen={isAdminProfilesModalOpen}
        onClose={() => setIsAdminProfilesModalOpen(false)}
        onAdminsUpdated={() => {
          setCurrentAdminState(getCurrentAdmin());
        }}
      />

      <ExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        onImportSuccess={handleImportExcelSuccess}
        userRole={userRole}
        onOpenAdminAuth={() => {
          setIsExcelImportModalOpen(false);
          setIsAdminAuthModalOpen(true);
        }}
      />

      <ManageSectorsModal
        isOpen={isManageSectorsModalOpen}
        onClose={() => setIsManageSectorsModalOpen(false)}
        sectors={sectors}
        records={records}
        onSaveSector={handleSaveSector}
        onDeleteSector={handleDeleteSector}
        onReassignSector={handleReassignSector}
        onDeleteRecordsBySector={handleDeleteRecordsBySector}
        onRenameEmployee={handleRenameEmployee}
        onDeleteEmployee={handleDeleteEmployee}
        onRenameGestor={handleRenameGestor}
        onAddEmployee={handleAddNewEmployee}
        onRestoreDefaultSectors={handleRestoreDefaultSectors}
        userRole={userRole}
        onOpenAdminAuth={() => {
          setIsManageSectorsModalOpen(false);
          setIsAdminAuthModalOpen(true);
        }}
      />
    </div>
  );
}
