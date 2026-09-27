import React, { useState, useMemo } from 'react';
import { ActivityItem, ActivitySlippageAnalysis, SlippageSeverity, ContractorId } from '../../types';
import {
  calculateScheduleSlippage,
  calculateDurationDays,
  downloadFile
} from '../../utils/msProjectUtils';
import {
  AlertTriangle,
  Flame,
  Clock,
  Calendar,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  Download,
  RotateCcw,
  Camera,
  Layers,
  BarChart3,
  ListFilter,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

interface BaselineSlippageViewProps {
  activities: ActivityItem[];
  onSelectActivity?: (act: ActivityItem) => void;
  onEditRelationships?: (act: ActivityItem) => void;
  onSaveBaselineSnapshot?: () => void;
}

export const BaselineSlippageView: React.FC<BaselineSlippageViewProps> = ({
  activities,
  onSelectActivity,
  onEditRelationships,
  onSaveBaselineSnapshot
}) => {
  // View states
  const [activeTab, setActiveTab] = useState<'table' | 'visual_bars'>('table');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | SlippageSeverity>('ALL');
  const [contractorFilter, setContractorFilter] = useState<'ALL' | ContractorId>('ALL');
  const [onlyCriticalPath, setOnlyCriticalPath] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [showSnapshotSuccess, setShowSnapshotSuccess] = useState<boolean>(false);

  // Compute Slippage Analysis
  const slippageSummary = useMemo(() => {
    return calculateScheduleSlippage(activities);
  }, [activities]);

  // Filtered Activities
  const filteredAnalysis = useMemo(() => {
    return slippageSummary.activities.filter(item => {
      if (severityFilter !== 'ALL' && item.severity !== severityFilter) return false;
      if (contractorFilter !== 'ALL' && item.contractorId !== contractorFilter) return false;
      if (onlyCriticalPath && !item.isCritical) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.activityName.toLowerCase().includes(q);
        const matchesCode = (item.wbsCode || '').toLowerCase().includes(q);
        const matchesPier = item.pierId.toLowerCase().includes(q);
        const matchesId = item.activityId.toLowerCase().includes(q);
        return matchesName || matchesCode || matchesPier || matchesId;
      }
      return true;
    });
  }, [slippageSummary, severityFilter, contractorFilter, onlyCriticalPath, searchQuery]);

  // Selected Activity Analysis
  const selectedItem = useMemo(() => {
    if (!selectedActivityId) return null;
    return slippageSummary.activities.find(a => a.activityId === selectedActivityId) || null;
  }, [selectedActivityId, slippageSummary]);

  // Handle Export Slippage Report
  const handleExportCSV = () => {
    const headers = [
      'Activity ID',
      'WBS Code',
      'Activity Name',
      'Pier ID',
      'Contractor',
      'Status',
      'Critical Path',
      'Baseline Start',
      'Baseline Finish',
      'Baseline Duration (Days)',
      'Current Start',
      'Current Finish',
      'Current Duration (Days)',
      'Start Variance (Days)',
      'Finish Variance / Slippage (Days)',
      'Plan Progress (%)',
      'Actual Progress (%)',
      'Progress Variance (%)',
      'Severity',
      'Slippage Summary'
    ];

    const rows = slippageSummary.activities.map(a => [
      `"${a.activityId}"`,
      `"${a.wbsCode || ''}"`,
      `"${a.activityName.replace(/"/g, '""')}"`,
      `"${a.pierId}"`,
      `"${a.contractorId}"`,
      `"${a.status}"`,
      a.isCritical ? 'YES' : 'NO',
      `"${a.baselineStart}"`,
      `"${a.baselineFinish}"`,
      a.baselineDuration,
      `"${a.currentStart}"`,
      `"${a.currentFinish}"`,
      a.currentDuration,
      a.startVarianceDays,
      a.finishVarianceDays,
      a.progressPlan,
      a.progressActual,
      a.progressVariance,
      `"${a.severity}"`,
      `"${a.slippageSummary}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(csvContent, `HRR2_Schedule_Slippage_Report_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const handleTakeSnapshot = () => {
    if (onSaveBaselineSnapshot) {
      onSaveBaselineSnapshot();
      setShowSnapshotSuccess(true);
      setTimeout(() => setShowSnapshotSuccess(false), 3000);
    }
  };

  // Helper for Severity Color Badge
  const renderSeverityBadge = (severity: SlippageSeverity, slippageDays: number) => {
    switch (severity) {
      case 'critical_slippage':
        return (
          <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1.5 shrink-0">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Kritis (+{slippageDays}d)</span>
          </span>
        );
      case 'minor_slippage':
        return (
          <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1.5 shrink-0">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Ringan (+{slippageDays}d)</span>
          </span>
        );
      case 'ahead':
        return (
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1.5 shrink-0">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Lebih Cepat ({slippageDays}d)</span>
          </span>
        );
      case 'on_track':
      default:
        return (
          <span className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[11px] font-bold flex items-center gap-1.5 shrink-0">
            <CheckCircle2 className="w-3 h-3 text-blue-400" />
            <span>Sesuai Baseline</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* EXECUTIVE KPI HEADER: SLIPPAGE SCORECARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Critical Slippage */}
        <div
          onClick={() => setSeverityFilter(severityFilter === 'critical_slippage' ? 'ALL' : 'critical_slippage')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            severityFilter === 'critical_slippage'
              ? 'bg-rose-950/50 border-rose-500 ring-2 ring-rose-500/40'
              : 'bg-slate-900/90 border-slate-800 hover:border-rose-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-400 font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Slippage Kritis
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300">
              &gt; 7 Hari / Kritis
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-200">
              {slippageSummary.criticalSlippageCount}
            </span>
            <span className="text-xs text-slate-400">Aktivitas</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Mempengaruhi tanggal serah terima proyek
          </p>
        </div>

        {/* Card 2: Minor Slippage */}
        <div
          onClick={() => setSeverityFilter(severityFilter === 'minor_slippage' ? 'ALL' : 'minor_slippage')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            severityFilter === 'minor_slippage'
              ? 'bg-amber-950/50 border-amber-500 ring-2 ring-amber-500/40'
              : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              Slippage Ringan
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300">
              1 - 7 Hari
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-200">
              {slippageSummary.minorSlippageCount}
            </span>
            <span className="text-xs text-slate-400">Aktivitas</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Masih dapat dikompensasi total float
          </p>
        </div>

        {/* Card 3: On Track */}
        <div
          onClick={() => setSeverityFilter(severityFilter === 'on_track' ? 'ALL' : 'on_track')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            severityFilter === 'on_track'
              ? 'bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/40'
              : 'bg-slate-900/90 border-slate-800 hover:border-blue-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-blue-400 font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              Sesuai Baseline
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300">
              Deviasi 0d
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-200">
              {slippageSummary.onTrackCount}
            </span>
            <span className="text-xs text-slate-400">Aktivitas</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Sesuai jadwal rencana awal (Baseline 0)
          </p>
        </div>

        {/* Card 4: Ahead of Schedule */}
        <div
          onClick={() => setSeverityFilter(severityFilter === 'ahead' ? 'ALL' : 'ahead')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            severityFilter === 'ahead'
              ? 'bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/40'
              : 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Lebih Cepat
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300">
              Surplus Waktu
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-200">
              {slippageSummary.aheadCount}
            </span>
            <span className="text-xs text-slate-400">Aktivitas</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Selesai lebih awal dari target baseline
          </p>
        </div>

        {/* Card 5: Critical Path Slippage Max */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-rose-400">
              <Flame className="w-4 h-4" />
              Slippage Lintasan Kritis
            </span>
          </div>
          <div className="my-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-rose-400">
                +{slippageSummary.criticalPathSlippageDays}
              </span>
              <span className="text-xs font-semibold text-slate-400">Hari Maksimal</span>
            </div>
            <p className="text-[10px] text-slate-400 line-clamp-1">
              Rata-rata delay proyek: <strong className="text-white">+{slippageSummary.averageSlippageDays} Hari</strong>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-amber-300 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>Diperlukan tindakan mitigasi & crashing</span>
          </div>
        </div>
      </div>

      {/* TOOLBAR CONTROLS: FILTERS, ACTIONS, BASELINE SNAPSHOT */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        {/* Left Filters */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Task / Pier / WBS..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden w-56"
            />
          </div>

          {/* Severity Dropdown Filter */}
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-hidden"
          >
            <option value="ALL">Semua Tingkat Slippage</option>
            <option value="critical_slippage">🔴 Kritis (&gt; 7 Hari)</option>
            <option value="minor_slippage">🟡 Ringan (1 - 7 Hari)</option>
            <option value="on_track">🔵 Sesuai Baseline (0d)</option>
            <option value="ahead">🟢 Lebih Cepat (&lt; 0d)</option>
          </select>

          {/* Contractor Filter */}
          <select
            value={contractorFilter}
            onChange={e => setContractorFilter(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-hidden"
          >
            <option value="ALL">Semua Kontraktor</option>
            <option value="WIKA">WIKA (PT Wijaya Karya)</option>
            <option value="GI">GI (PT Girder Indonesia)</option>
            <option value="WIKA-GI">Joint (WIKA - GI)</option>
          </select>

          {/* Critical Path Checkbox */}
          <label className="flex items-center gap-1.5 text-slate-300 font-medium cursor-pointer ml-1">
            <input
              type="checkbox"
              checked={onlyCriticalPath}
              onChange={e => setOnlyCriticalPath(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-0"
            />
            <span className="text-[11px] text-slate-300">Hanya Critical Path</span>
          </label>
        </div>

        {/* Right Switch Tabs & Actions */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* View Tab Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-800 border border-slate-700">
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Tabel Varians & Slippage</span>
            </button>
            <button
              onClick={() => setActiveTab('visual_bars')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'visual_bars'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dual-Bar Baseline Gantt</span>
            </button>
          </div>

          {/* Action: Snapshot Baseline */}
          {onSaveBaselineSnapshot && (
            <button
              onClick={handleTakeSnapshot}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Kunci jadwal saat ini sebagai Baseline 0 baru"
            >
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span>Simpan Snapshot Baseline</span>
            </button>
          )}

          {/* Action: Export CSV Report */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-emerald-950"
            title="Unduh Laporan Analisis Slippage (.CSV)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Slippage</span>
          </button>
        </div>
      </div>

      {/* Snapshot Toast Banner */}
      {showSnapshotSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Jadwal saat ini berhasil dikunci sebagai Baseline Baru (Baseline 0). Varians jadwal diperbarui.</span>
        </div>
      )}

      {/* TAB 1: DETAILED VARIANCE DATA GRID */}
      {activeTab === 'table' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">
                Daftar Analisis Perbandingan Baseline vs Jadwal Aktual ({filteredAnalysis.length} Aktivitas)
              </span>
              <span className="text-[11px] text-slate-400">
                (Menghitung Start Variance, Finish Variance, &amp; Deviasi Progres Fisik)
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Klik baris aktivitas untuk melihat analisis mitigasi &amp; dampak CPM
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/90 text-slate-400 text-[11px] border-b border-slate-800 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-3 min-w-[200px]">Aktivitas / Task Name</th>
                  <th className="py-3 px-3 min-w-[90px]">Pier &amp; Kontraktor</th>
                  <th className="py-3 px-3 min-w-[170px] bg-slate-900/60">
                    <span className="text-slate-300 font-bold block">Baseline Rencana (B0)</span>
                    <span className="text-[10px] text-slate-500 font-mono">Start → Finish (Durasi)</span>
                  </th>
                  <th className="py-3 px-3 min-w-[170px] bg-slate-900/40">
                    <span className="text-white font-bold block">Jadwal Realisasi / Revisi</span>
                    <span className="text-[10px] text-slate-400 font-mono">Start → Finish (Durasi)</span>
                  </th>
                  <th className="py-3 px-3 min-w-[110px] text-center">
                    <span className="block">Slippage Jadwal</span>
                    <span className="text-[10px] text-slate-500 font-mono">(Finish Variance)</span>
                  </th>
                  <th className="py-3 px-3 min-w-[120px]">
                    <span className="block">Progres Fisik (%)</span>
                    <span className="text-[10px] text-slate-500 font-mono">Rencana vs Aktual</span>
                  </th>
                  <th className="py-3 px-3 min-w-[140px]">Status Slippage</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredAnalysis.map((item, index) => {
                  const isSelected = selectedActivityId === item.activityId;
                  const isDelayed = item.finishVarianceDays > 0;
                  const progressDelta = item.progressVariance;

                  return (
                    <tr
                      key={item.activityId}
                      onClick={() => setSelectedActivityId(item.activityId)}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-900/30'
                          : isDelayed && item.isCritical
                          ? 'bg-rose-950/20 hover:bg-rose-900/30'
                          : isDelayed
                          ? 'bg-amber-950/15 hover:bg-amber-900/25'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* # Index & Critical Flag */}
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        <div className="flex items-center justify-center gap-1">
                          {item.isCritical && (
                            <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" title="Critical Path Task" />
                          )}
                          <span>{index + 1}</span>
                        </div>
                      </td>

                      {/* Task Name & WBS */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-mono text-[10px] font-bold text-blue-400 bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-800/50">
                            {item.wbsCode || item.activityId}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Bobot: {item.weight}%
                          </span>
                        </div>
                        <div className={`font-semibold text-xs leading-snug ${
                          item.isCritical && isDelayed ? 'text-rose-100 font-bold' : 'text-slate-100'
                        }`}>
                          {item.activityName}
                        </div>
                      </td>

                      {/* Pier & Contractor */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-200">{item.pierId}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{item.contractorId}</div>
                      </td>

                      {/* Baseline Schedule */}
                      <td className="py-3 px-3 bg-slate-900/40 font-mono text-[11px]">
                        <div className="text-slate-300">
                          {item.baselineStart} → {item.baselineFinish}
                        </div>
                        <div className="text-slate-500 text-[10px]">
                          Durasi Rencana: <span className="text-slate-300 font-bold">{item.baselineDuration} Hari</span>
                        </div>
                      </td>

                      {/* Current Schedule */}
                      <td className="py-3 px-3 bg-slate-900/20 font-mono text-[11px]">
                        <div className={`${isDelayed ? 'text-rose-300 font-bold' : 'text-slate-200'}`}>
                          {item.currentStart} → {item.currentFinish}
                        </div>
                        <div className="text-slate-400 text-[10px]">
                          Durasi Revisi: <span className="text-slate-200 font-bold">{item.currentDuration} Hari</span>
                          {item.durationVarianceDays !== 0 && (
                            <span className={`ml-1 text-[10px] ${item.durationVarianceDays > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              ({item.durationVarianceDays > 0 ? `+${item.durationVarianceDays}` : item.durationVarianceDays}d)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Schedule Slippage (Finish Variance) */}
                      <td className="py-3 px-3 text-center">
                        {item.finishVarianceDays > 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className={`px-2 py-0.5 rounded-full font-mono text-xs font-bold ${
                              item.isCritical || item.finishVarianceDays > 7
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                            }`}>
                              +{item.finishVarianceDays} Hari
                            </span>
                            <span className="text-[9px] text-slate-500 mt-0.5">Terlambat</span>
                          </div>
                        ) : item.finishVarianceDays < 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded-full font-mono text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
                              {item.finishVarianceDays} Hari
                            </span>
                            <span className="text-[9px] text-emerald-500 mt-0.5">Lebih Awal</span>
                          </div>
                        ) : (
                          <span className="font-mono text-slate-400 text-xs font-bold">0 Hari</span>
                        )}
                      </td>

                      {/* Physical Progress */}
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                          <span className="text-slate-400">Akt: <strong className="text-white">{item.progressActual}%</strong></span>
                          <span className="text-slate-500">Plan: {item.progressPlan}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              progressDelta < -5 ? 'bg-rose-500' : progressDelta < 0 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, item.progressActual)}%` }}
                          />
                        </div>
                        <div className="text-[9px] font-mono mt-0.5 text-right">
                          <span className={progressDelta < 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                            {progressDelta > 0 ? `+${progressDelta}` : progressDelta}%
                          </span>
                        </div>
                      </td>

                      {/* Severity Badge */}
                      <td className="py-3 px-3">
                        {renderSeverityBadge(item.severity, item.slippageDays)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const act = activities.find(a => a.activityId === item.activityId);
                            if (act && onEditRelationships) onEditRelationships(act);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-[11px] transition-colors cursor-pointer border border-slate-700"
                        >
                          Relasi
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: VISUAL DUAL-BAR GANTT SLIPPAGE WATERFALL */}
      {activeTab === 'visual_bars' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-sm">
                Dual-Bar Visual Gantt: Baseline 0 vs Jadwal Realisasi
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Membandingkan posisi bar jadwal awal dengan jadwal terkini untuk mendeteksi pergeseran (*schedule slippage*).
              </p>
            </div>
            {/* Visual Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-2.5 rounded-xs bg-slate-700 border border-slate-600" />
                <span className="text-slate-400">Original Baseline (B0)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-2.5 rounded-xs bg-rose-600 border border-rose-400" />
                <span className="text-rose-400">Slipped Schedule (Delay)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-2.5 rounded-xs bg-blue-600 border border-blue-400" />
                <span className="text-blue-400">On Track Schedule</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-2.5 rounded-xs bg-emerald-600 border border-emerald-400" />
                <span className="text-emerald-400">Ahead of Schedule</span>
              </span>
            </div>
          </div>

          {/* Dual Bar Waterfall List */}
          <div className="space-y-4 max-h-[640px] overflow-y-auto pr-2">
            {filteredAnalysis.map((item, index) => {
              const isDelayed = item.finishVarianceDays > 0;
              const isAhead = item.finishVarianceDays < 0;

              return (
                <div
                  key={item.activityId}
                  onClick={() => setSelectedActivityId(item.activityId)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedActivityId === item.activityId
                      ? 'bg-slate-800/80 border-blue-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
                    <div className="flex items-center gap-2">
                      {item.isCritical && (
                        <span className="p-0.5 rounded bg-rose-500/20 text-rose-400" title="Critical Path Activity">
                          <Flame className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <span className="font-mono text-[10px] font-bold text-blue-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {item.wbsCode || item.activityId}
                      </span>
                      <h4 className="font-bold text-slate-200 text-xs">
                        {item.activityName}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        ({item.pierId} • {item.contractorId})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDelayed ? (
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-rose-500/20 text-rose-300 border border-rose-500/50">
                          Slippage: +{item.finishVarianceDays} Hari
                        </span>
                      ) : isAhead ? (
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
                          Ahead: {item.finishVarianceDays} Hari
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-500/20 text-blue-300 border border-blue-500/50">
                          On Track
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dual Bar Graphic */}
                  <div className="space-y-1.5 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    {/* Upper Bar: Baseline */}
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="w-20 text-[10px] uppercase font-bold text-slate-400 shrink-0 font-mono">
                        Baseline B0
                      </span>
                      <div className="flex-1 bg-slate-950 h-5 rounded-md relative overflow-hidden flex items-center px-2 border border-slate-800">
                        <div
                          className="h-full bg-slate-700/80 absolute left-0 top-0 rounded-md border border-slate-600/70"
                          style={{ width: '85%' }}
                        />
                        <div className="relative z-10 font-mono text-[10px] font-semibold text-slate-300 flex items-center justify-between w-full">
                          <span>Start: {item.baselineStart}</span>
                          <span className="font-bold text-white">Durasi: {item.baselineDuration}d</span>
                          <span>Finish: {item.baselineFinish}</span>
                        </div>
                      </div>
                    </div>

                    {/* Lower Bar: Current Schedule & Actual Progress */}
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="w-20 text-[10px] uppercase font-bold text-slate-300 shrink-0 font-mono">
                        Realisasi
                      </span>
                      <div className="flex-1 bg-slate-950 h-5 rounded-md relative overflow-hidden flex items-center px-2 border border-slate-800">
                        {/* Planned / Forecast Bar */}
                        <div
                          className={`h-full absolute left-0 top-0 rounded-md ${
                            isDelayed && item.isCritical
                              ? 'bg-rose-950/80 border border-rose-500/80'
                              : isDelayed
                              ? 'bg-amber-950/80 border border-amber-500/80'
                              : 'bg-blue-950/80 border border-blue-500/80'
                          }`}
                          style={{ width: '92%' }}
                        />
                        {/* Actual Progress Fill */}
                        <div
                          className={`h-full absolute left-0 top-0 ${
                            isDelayed ? 'bg-rose-600' : isAhead ? 'bg-emerald-600' : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.min(92, (item.progressActual / 100) * 92)}%` }}
                        />

                        {/* Text Overlay */}
                        <div className="relative z-10 font-mono text-[10px] font-semibold text-white flex items-center justify-between w-full">
                          <span>Start: {item.currentStart}</span>
                          <span className="font-bold">
                            Progress: {item.progressActual}% (Target: {item.progressPlan}%)
                          </span>
                          <span>Finish: {item.currentFinish}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delay Summary & Critical Warning */}
                  {isDelayed && (
                    <div className="mt-2 text-[11px] flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5 text-rose-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        {item.slippageSummary}
                      </span>
                      {item.impactsCriticalPath && (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                          🔥 Berdampak langsung menggeser tanggal akhir proyek
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* INSPECTOR DRAWER FOR SELECTED ACTIVITY */}
      {selectedItem && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {selectedItem.wbsCode || selectedItem.activityId}
              </span>
              <h3 className="font-bold text-white text-sm">
                Analisis Keterlambatan &amp; Mitigasi Jadwal: {selectedItem.activityName}
              </h3>
            </div>
            <button
              onClick={() => setSelectedActivityId(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Tutup Panel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Variance Breakdown */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-200 text-xs">Parameter Varians Waktu</h4>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Start Variance:</span>
                  <span className={selectedItem.startVarianceDays > 0 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                    {selectedItem.startVarianceDays > 0 ? `+${selectedItem.startVarianceDays}d (Mulai terlambat)` : `${selectedItem.startVarianceDays}d`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Finish Variance:</span>
                  <span className={selectedItem.finishVarianceDays > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {selectedItem.finishVarianceDays > 0 ? `+${selectedItem.finishVarianceDays}d (Slippage)` : `${selectedItem.finishVarianceDays}d`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration Variance:</span>
                  <span className="text-slate-200 font-bold">
                    {selectedItem.durationVarianceDays > 0 ? `+${selectedItem.durationVarianceDays}d` : `${selectedItem.durationVarianceDays}d`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Deviasi Progres Fisik:</span>
                  <span className={selectedItem.progressVariance < 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {selectedItem.progressVariance}%
                  </span>
                </div>
              </div>
            </div>

            {/* Critical Path & Schedule Impact */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-200 text-xs">Dampak Pada Jaringan Kerja (CPM)</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {selectedItem.impactsCriticalPath ? (
                  <strong className="text-rose-300">
                    Aktivitas ini berada pada Lintasan Kritis (Critical Path). Keterlambatan {selectedItem.slippageDays} hari secara otomatis memundurkan target Provisional Hand Over (PHO) jalan tol Harbour Road II.
                  </strong>
                ) : selectedItem.finishVarianceDays > 0 ? (
                  <span className="text-amber-300">
                    Aktivitas mengalami keterlambatan {selectedItem.finishVarianceDays} hari, namun masih memiliki kelonggaran float. Disarankan percepatan sebelum menyerap habis total float.
                  </span>
                ) : (
                  <span className="text-emerald-300">
                    Jadwal aktivitas berjalan sesuai atau lebih cepat dari baseline awal. Tidak menimbulkan risiko penundaan proyek.
                  </span>
                )}
              </p>
            </div>

            {/* Recommended Acceleration Actions */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-200 text-xs">Rekomendasi Tindakan Korektif</h4>
              <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                {selectedItem.finishVarianceDays > 0 ? (
                  <>
                    <li>Pemberlakuan kerja lembur 2 shift (Crashing jadwal)</li>
                    <li>Mobilisasi tambahan unit bore pile rig / crane ke pier {selectedItem.pierId}</li>
                    <li>Evaluasi relasi predecessor menjadi relasi overlap (SS + lag diperpendek)</li>
                  </>
                ) : (
                  <>
                    <li>Pertahankan ritme produktivitas harian dan alokasi sumber daya</li>
                    <li>Lanjutkan monitoring harian cuaca dan logistik material</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
