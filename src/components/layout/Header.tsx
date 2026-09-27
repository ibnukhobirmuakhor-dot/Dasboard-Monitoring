import React, { useState, useMemo } from 'react';
import {
  Menu,
  Search,
  SlidersHorizontal,
  FileSpreadsheet,
  RefreshCw,
  Bell,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenImportModal: () => void;
  onOpenWorkspaceModal?: () => void;
  onOpenFilterModal?: () => void;
  onNavigateToSCurve?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenImportModal,
  onOpenWorkspaceModal,
  onNavigateToSCurve
}) => {
  const {
    project,
    searchQuery,
    setSearchQuery,
    projectKPIs,
    filters,
    resetFilters,
    activities,
    currentRole,
    setCurrentRole
  } = useProject();

  const [showBellDropdown, setShowBellDropdown] = useState(false);

  // Compute activities breaching progress threshold
  const breachedAlerts = useMemo(() => {
    return (activities || [])
      .map(a => {
        const plan = a.progressPlan ?? 0;
        const act = a.progressActual ?? 0;
        const variance = Math.round((act - plan) * 10) / 10;
        return { ...a, variance };
      })
      .filter(a => a.variance <= -5)
      .sort((a, b) => a.variance - b.variance);
  }, [activities]);

  const criticalCount = breachedAlerts.filter(a => a.variance <= -10 || a.isCritical).length;

  const isFilterActive =
    filters.contractorId !== 'ALL' ||
    filters.zoneId !== 'ALL' ||
    filters.pierId !== 'ALL' ||
    filters.status !== 'ALL';

  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 px-4 py-2.5 flex items-center justify-between gap-3 shadow-xs"
    >
      {/* Left: Mobile toggle + Breadcrumb / Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          id="btn-toggle-sidebar"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-gradient-to-r from-blue-600/30 to-cyan-600/20 border border-blue-400/40 text-blue-300 font-extrabold text-xs uppercase tracking-wider shadow-[0_0_12px_rgba(59,130,246,0.25)]">
              HARBOUR ROAD II
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-xs text-slate-400 hidden sm:inline truncate">
              {project.client}
            </span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
            {project.projectName}
          </h1>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md hidden md:block relative">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder='Cari Pier (mis. "P178N"), Aktivitas, Kontraktor, Issue...'
            className="w-full pl-9 pr-8 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-2">
        {/* Quick KPI Chips (Desktop) */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs font-mono">
          <div>
            <span className="text-slate-400 mr-1 text-[10px]">TOTAL:</span>
            <span className="font-bold text-emerald-400">{projectKPIs.totalActual.toFixed(1)}%</span>
            <span className="text-slate-500 text-[10px] ml-1">/ {projectKPIs.totalPlanned.toFixed(1)}%</span>
          </div>
          <span className="text-slate-600">|</span>
          <div>
            <span className="text-slate-400 mr-1 text-[10px]">SPI:</span>
            <span className={`font-bold ${projectKPIs.spi >= 1.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {projectKPIs.spi.toFixed(3)}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div>
            <span className="text-slate-400 mr-1 text-[10px]">Sisa:</span>
            <span className="font-semibold text-slate-200">{projectKPIs.daysRemainingContract} Hari</span>
          </div>
        </div>

        {/* User Role Switcher Pill (PME & Viewer) */}
        <div className="flex items-center bg-slate-950/90 border border-slate-700/80 rounded-xl p-0.5 text-xs font-semibold shadow-xs">
          <button
            id="header-role-btn-pme"
            onClick={() => setCurrentRole('PME')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              currentRole === 'PME' || currentRole === 'Admin'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Role PME: Akses Penuh untuk Project Control & Editor"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
            <span className="text-xs">PME</span>
          </button>
          <button
            id="header-role-btn-viewer"
            onClick={() => setCurrentRole('Viewer')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              currentRole === 'Viewer'
                ? 'bg-purple-600 text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Role Viewer: Akses Read-Only untuk Stakeholder & Direksi"
          >
            <Eye className="w-3.5 h-3.5 text-purple-300" />
            <span className="text-xs">Viewer</span>
          </button>
        </div>

        {/* PME Progress Alert Bell */}
        <div className="relative">
          <button
            id="btn-header-pme-alerts"
            onClick={() => setShowBellDropdown(!showBellDropdown)}
            className={`relative p-2 rounded-lg border transition-all cursor-pointer ${
              criticalCount > 0
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30'
                : breachedAlerts.length > 0
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
            }`}
            title={`Notifikasi PME: ${breachedAlerts.length} aktivitas di bawah ambang batas`}
          >
            <Bell className="w-4 h-4" />
            {breachedAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 text-[9px] font-black items-center justify-center bg-rose-600 text-white">
                  {breachedAlerts.length}
                </span>
              </span>
            )}
          </button>

          {/* Bell Dropdown Popover */}
          {showBellDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-rose-400" />
                  <span className="font-bold text-xs text-white">Peringatan Deviasi Jadwal (PME)</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300">
                  {breachedAlerts.length} Tertunda
                </span>
              </div>

              <p className="text-[11px] text-slate-400">
                Pekerjaan dengan deviasi melewati ambang toleransi (&le; -5%) pada evaluasi Kurva-S:
              </p>

              <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-1.5">
                {breachedAlerts.slice(0, 5).map(item => (
                  <div
                    key={item.activityId}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                        <span className="text-blue-400 font-bold">{item.activityId}</span>
                        {item.pierId && <span>• {item.pierId}</span>}
                        <span>• {item.contractorId}</span>
                      </div>
                      <div className="text-slate-200 font-medium truncate text-[11px]">
                        {item.activityName}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-rose-400 font-mono font-bold text-xs">
                        {item.variance.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {onNavigateToSCurve && (
                <button
                  onClick={() => {
                    setShowBellDropdown(false);
                    onNavigateToSCurve();
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span>Buka Kurva-S &amp; Notifikasi Lengkap</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Google Sheet 1-File Database Button */}
        {onOpenWorkspaceModal && (
          <button
            id="btn-header-google-workspace"
            onClick={onOpenWorkspaceModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
            title="Database Proyek: Terpusat dalam 1 File Google Sheet"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Database (1 File Sheet)</span>
          </button>
        )}

        {/* Excel Import button */}
        <button
          id="btn-header-import-excel"
          onClick={onOpenImportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
          title="Import Data dari File Excel"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span className="hidden sm:inline">Import Excel</span>
        </button>

        {isFilterActive && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-medium hover:bg-amber-500/30"
            title="Reset Filter Aktif"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset Filter</span>
          </button>
        )}
      </div>
    </header>
  );
};
