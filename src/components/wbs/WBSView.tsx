import React, { useState, useMemo, useRef } from 'react';
import {
  GitFork,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Calendar,
  Layers,
  Plus,
  Building2,
  Link2,
  Clock,
  Flame,
  Download,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  SlidersHorizontal,
  Share2,
  FileCode,
  Network
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { WBSNode, ActivityItem, ContractorId } from '../../types';
import {
  formatPredecessors,
  calculateDurationDays,
  calculateScheduleNetwork,
  generateConnectorPath,
  generateMSProjectXML,
  downloadFile,
  getDaysDiff,
  setBaselineSnapshot,
  calculateScheduleSlippage
} from '../../utils/msProjectUtils';
import { RelationshipModal } from './RelationshipModal';
import { TaskModal } from './TaskModal';
import { NetworkDiagramView } from './NetworkDiagramView';
import { PrecedenceDiagramView } from './PrecedenceDiagramView';
import { BaselineSlippageView } from './BaselineSlippageView';

type ViewMode = 'gantt' | 'slippage' | 'pdm' | 'tree' | 'network';
type TimeScale = 'day' | 'week' | 'month';

export const WBSView: React.FC = () => {
  const {
    wbs,
    activities,
    piers,
    project,
    canEdit,
    addActivity,
    updateActivity,
    deleteActivity,
    exportToExcel
  } = useProject();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('gantt');
  const [timeScale, setTimeScale] = useState<TimeScale>('week');
  const [showDependencyArrows, setShowDependencyArrows] = useState(true);
  const [highlightCriticalPath, setHighlightCriticalPath] = useState(true);
  const [showDualBaselineBars, setShowDualBaselineBars] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContractor, setSelectedContractor] = useState<'ALL' | ContractorId>('ALL');
  const [selectedSection, setSelectedSection] = useState<'ALL' | string>('ALL');
  const [selectedPier, setSelectedPier] = useState<'ALL' | string>('ALL');

  // Modals state
  const [selectedActForRelationship, setSelectedActForRelationship] = useState<ActivityItem | null>(null);
  const [actModalOpen, setActModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);

  // Expand state for WBS Tree View
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'WBS-1': true,
    'WBS-2-MA': true,
    'WBS-2-Z1S': true,
    'WBS-2-Z2S': true
  });

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Run CPM calculation on activities
  const scheduledActivities = useMemo(() => {
    return calculateScheduleNetwork(activities);
  }, [activities]);

  // Compute successors map for quick reference
  const successorsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    activities.forEach(a => map.set(a.activityId, []));

    activities.forEach((act, actIndex) => {
      if (act.predecessors) {
        act.predecessors.forEach(p => {
          if (map.has(p.predecessorId)) {
            const predIndex = activities.findIndex(a => a.activityId === p.predecessorId);
            const succLabel = `${actIndex + 1}${p.type !== 'FS' || (p.lagDays && p.lagDays !== 0) ? p.type : ''}${
              p.lagDays ? (p.lagDays > 0 ? `+${p.lagDays}d` : `${p.lagDays}d`) : ''
            }`;
            map.get(p.predecessorId)!.push(succLabel);
          }
        });
      }
    });
    return map;
  }, [activities]);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return scheduledActivities.filter(act => {
      if (selectedContractor !== 'ALL' && act.contractorId !== selectedContractor) return false;
      if (selectedPier !== 'ALL' && act.pierId !== selectedPier) return false;
      if (selectedSection !== 'ALL') {
        const matchingNode = wbs.find(w => w.wbsId === act.wbsId);
        if (matchingNode?.section && matchingNode.section !== selectedSection) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = act.activityName.toLowerCase().includes(q);
        const matchesCode = (act.wbsCode || '').toLowerCase().includes(q);
        const matchesPier = act.pierId.toLowerCase().includes(q);
        const matchesId = act.activityId.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesPier && !matchesId) return false;
      }
      return true;
    });
  }, [scheduledActivities, selectedContractor, selectedPier, selectedSection, searchQuery, wbs]);

  // Gantt Timeline Dates
  const timelineDates = useMemo(() => {
    let minDate = '2025-01-01';
    let maxDate = '2026-07-31';

    scheduledActivities.forEach(a => {
      if (a.startPlan && a.startPlan < minDate) minDate = a.startPlan;
      if (a.finishPlan && a.finishPlan > maxDate) maxDate = a.finishPlan;
    });

    const start = new Date(minDate);
    // Align start to first day of month
    start.setDate(1);

    const end = new Date(maxDate);
    // Align end to last day of month
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    return {
      startDate: start,
      endDate: end,
      totalDays
    };
  }, [scheduledActivities]);

  // Pixels per day based on timeScale
  const pxPerDay = timeScale === 'day' ? 32 : timeScale === 'week' ? 8 : 2.5;
  const ganttWidth = Math.max(800, timelineDates.totalDays * pxPerDay);

  // Helper: X offset in px from timeline start
  const getXForDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const diffDays = (d.getTime() - timelineDates.startDate.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, diffDays * pxPerDay);
  };

  // Generate Month Columns for Gantt Header
  const monthHeaders = useMemo(() => {
    const months: Array<{ name: string; year: number; widthPx: number; leftPx: number }> = [];
    const curr = new Date(timelineDates.startDate);

    while (curr <= timelineDates.endDate) {
      const year = curr.getFullYear();
      const month = curr.getMonth();
      const firstDay = new Date(year, month, 1);
      const nextMonth = new Date(year, month + 1, 1);
      const daysInMonth = Math.round((nextMonth.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24));
      
      const left = getXForDate(firstDay.toISOString().split('T')[0]);
      const width = daysInMonth * pxPerDay;

      const monthName = firstDay.toLocaleDateString('id-ID', { month: 'short' });
      months.push({
        name: `${monthName} ${year}`,
        year,
        widthPx: width,
        leftPx: left
      });

      curr.setMonth(curr.getMonth() + 1);
    }
    return months;
  }, [timelineDates, pxPerDay]);

  // Today marker X position
  const todayStr = '2025-09-15'; // Cutoff date matching project progress
  const todayX = getXForDate(todayStr);

  // SVG Relationship Connectors
  const relationshipLinks = useMemo(() => {
    if (!showDependencyArrows) return [];

    const links: Array<{
      id: string;
      path: string;
      isCritical: boolean;
      predName: string;
      succName: string;
      type: string;
      lag: number;
    }> = [];

    const rowHeight = 44; // px per activity row

    filteredActivities.forEach((succAct, succIndex) => {
      if (!succAct.predecessors) return;

      const succY = succIndex * rowHeight + 22;
      const succStartX = getXForDate(succAct.startPlan);
      const succDuration = succAct.duration || calculateDurationDays(succAct.startPlan, succAct.finishPlan);
      const succEndX = succStartX + Math.max(8, succDuration * pxPerDay);

      succAct.predecessors.forEach(pred => {
        const predIndex = filteredActivities.findIndex(a => a.activityId === pred.predecessorId);
        if (predIndex === -1) return;

        const predAct = filteredActivities[predIndex];
        const predY = predIndex * rowHeight + 22;
        const predStartX = getXForDate(predAct.startPlan);
        const predDuration = predAct.duration || calculateDurationDays(predAct.startPlan, predAct.finishPlan);
        const predEndX = predStartX + Math.max(8, predDuration * pxPerDay);

        let fromX = predEndX;
        let toX = succStartX;

        if (pred.type === 'SS') {
          fromX = predStartX;
          toX = succStartX;
        } else if (pred.type === 'FF') {
          fromX = predEndX;
          toX = succEndX;
        }

        const path = generateConnectorPath(fromX, predY, toX, succY, pred.type);
        const isCritLink = highlightCriticalPath && !!succAct.isCritical && !!predAct.isCritical;

        links.push({
          id: `${pred.predecessorId}->${succAct.activityId}`,
          path,
          isCritical: isCritLink,
          predName: predAct.activityName,
          succName: succAct.activityName,
          type: pred.type,
          lag: pred.lagDays || 0
        });
      });
    });

    return links;
  }, [filteredActivities, showDependencyArrows, highlightCriticalPath, pxPerDay]);

  // Export handlers
  const handleExportMSProjectExcel = () => {
    const exportData = scheduledActivities.map((a, idx) => ({
      'ID': idx + 1,
      'WBS': a.wbsCode || `1.${idx + 1}`,
      'Task Name': a.activityName,
      'Duration (Days)': a.duration || calculateDurationDays(a.startPlan, a.finishPlan),
      'Start Plan': a.startPlan,
      'Finish Plan': a.finishPlan,
      'Predecessors': formatPredecessors(a.predecessors, scheduledActivities),
      'Successors': (successorsMap.get(a.activityId) || []).join(', ') || '-',
      'Resource Names': a.contractorId,
      'Pier ID': a.pierId,
      '% Plan': a.progressPlan,
      '% Complete': a.progressActual,
      'Weight (%)': a.weight,
      'Total Slack (Days)': a.totalFloat ?? 0,
      'Critical': a.isCritical ? 'Yes' : 'No',
      'Status': a.status
    }));

    exportToExcel('MS_Project_HBR2_Schedule', 'Tasks_Schedule', exportData);
  };

  const handleExportMSProjectXML = () => {
    const xmlContent = generateMSProjectXML(scheduledActivities, project.projectName);
    downloadFile(xmlContent, 'HBR2_MS_Project_Schedule.xml', 'application/xml');
  };

  // Slippage & Baseline calculation
  const slippageStats = useMemo(() => {
    return calculateScheduleSlippage(scheduledActivities);
  }, [scheduledActivities]);

  const handleSaveBaselineSnapshot = () => {
    const snapshotted = setBaselineSnapshot(activities);
    snapshotted.forEach(act => {
      updateActivity(act);
    });
  };

  // Critical path stats
  const criticalCount = scheduledActivities.filter(a => a.isCritical).length;
  const totalWeight = scheduledActivities.reduce((acc, a) => acc + (a.weight || 0), 0);

  return (
    <div id="wbs-ms-project-view" className="space-y-6 pb-16">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <GitFork className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                Work Breakdown Structure & MS Project Engine
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-500/40">
                Network Precedence & CPM
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Hubungan ketergantungan antar-task (FS, SS, FF, SF), kalkulasi Critical Path Method (CPM), dan durasi terintegrasi
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* View Mode Buttons */}
          <div className="flex items-center p-1 rounded-xl bg-slate-800/90 border border-slate-700">
            <button
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'gantt'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>MS Project Gantt</span>
            </button>
            <button
              onClick={() => setViewMode('slippage')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'slippage'
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Slippage &amp; Baseline</span>
              {slippageStats.criticalSlippageCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-950 text-rose-300 font-mono font-bold border border-rose-500/50">
                  {slippageStats.criticalSlippageCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setViewMode('pdm')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'pdm'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Network Diagram (PDM)</span>
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'tree'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Hierarki 6-Level</span>
            </button>
            <button
              onClick={() => setViewMode('network')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'network'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Matriks Node (PERT)</span>
            </button>
          </div>

          {/* Export MS Project XML / Excel */}
          <button
            onClick={handleExportMSProjectXML}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export ke format MS Project XML (.xml)"
          >
            <FileCode className="w-4 h-4" />
            <span>Export MS Project (.xml)</span>
          </button>

          <button
            onClick={handleExportMSProjectExcel}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export data schedule ke Excel"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          {canEdit && (
            <button
              onClick={() => {
                setEditingActivity(null);
                setActModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Task</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Status Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Aktivitas WBS</span>
            <span className="text-xl font-black text-white font-mono">{activities.length} Task</span>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-rose-400 block">Lintasan Kritis (Critical Path)</span>
            <span className="text-xl font-black text-rose-400 font-mono">{criticalCount} Task</span>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-400">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Bobot Pekerjaan</span>
            <span className="text-xl font-black text-emerald-400 font-mono">{totalWeight.toFixed(2)}%</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Selesai Proyek</span>
            <span className="text-sm font-black text-white font-mono">{project.contractFinish}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER & GANTT VIEW CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Task / WBS / Pier..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden w-52"
            />
          </div>

          {/* Section Filter */}
          <select
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-hidden"
          >
            <option value="ALL">Semua Trase</option>
            <option value="Main Road Awal">Main Road Awal</option>
            <option value="Sisi Selatan">Sisi Selatan</option>
            <option value="Sisi Utara">Sisi Utara</option>
            <option value="Main Road Akhir">Main Road Akhir</option>
            <option value="Ramp">Ramp On/Off</option>
            <option value="Frontage">Frontage</option>
          </select>

          {/* Contractor Filter */}
          <select
            value={selectedContractor}
            onChange={e => setSelectedContractor(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-hidden"
          >
            <option value="ALL">Semua Kontraktor</option>
            <option value="WIKA">WIKA (PT Wijaya Karya)</option>
            <option value="GI">GI (PT Girder Indonesia)</option>
            <option value="WIKA-GI">Joint (WIKA - GI)</option>
          </select>

          {/* Pier Filter */}
          <select
            value={selectedPier}
            onChange={e => setSelectedPier(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-hidden max-w-[140px] font-mono"
          >
            <option value="ALL">Semua Pier</option>
            <option value="ALL">Pier: Project-Wide</option>
            {piers.slice(0, 50).map(p => (
              <option key={p.pierId} value={p.pierNumber}>
                Pier {p.pierNumber}
              </option>
            ))}
          </select>
        </div>

        {/* Gantt Display Options */}
        {viewMode === 'gantt' && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Dependency arrows toggle */}
            <label className="flex items-center gap-1.5 text-slate-300 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={showDependencyArrows}
                onChange={e => setShowDependencyArrows(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
              />
              <span className="text-[11px] flex items-center gap-1">
                <Link2 className="w-3 h-3 text-blue-400" />
                Tampilkan Hubungan Predecessor
              </span>
            </label>

            {/* Critical path toggle */}
            <label className="flex items-center gap-1.5 text-slate-300 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={highlightCriticalPath}
                onChange={e => setHighlightCriticalPath(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-rose-600 focus:ring-0"
              />
              <span className="text-[11px] flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-400" />
                Sorot Lintasan Kritis (CPM)
              </span>
            </label>

            {/* Timescale Zoom */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-800 border border-slate-700">
              <button
                onClick={() => setTimeScale('day')}
                className={`px-2 py-1 rounded text-[11px] font-bold ${
                  timeScale === 'day' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hari
              </button>
              <button
                onClick={() => setTimeScale('week')}
                className={`px-2 py-1 rounded text-[11px] font-bold ${
                  timeScale === 'week' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Minggu
              </button>
              <button
                onClick={() => setTimeScale('month')}
                className={`px-2 py-1 rounded text-[11px] font-bold ${
                  timeScale === 'month' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Bulan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VIEW MODE 1: MS PROJECT SHEET & INTERACTIVE GANTT TIMELINE */}
      {viewMode === 'gantt' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
          {/* Subheader info */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/70 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-200">
                Menampilkan {filteredActivities.length} dari {scheduledActivities.length} Aktivitas
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">
                Kolom Predecessor: klik badge untuk membuka <strong className="text-blue-300">Relationship Editor</strong> (FS/SS/FF/SF + Lag)
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <label className="flex items-center gap-1.5 text-slate-300 font-bold cursor-pointer bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 hover:border-blue-500/50 shadow-xs">
                <input
                  type="checkbox"
                  checked={showDualBaselineBars}
                  onChange={e => setShowDualBaselineBars(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-amber-300 text-[11px]">Overlay Baseline B0 (Dual Bars)</span>
              </label>

              {showDualBaselineBars && (
                <span className="flex items-center gap-1 text-[10px] text-slate-300">
                  <span className="w-2.5 h-1.5 bg-slate-600 rounded-xs border border-slate-500 inline-block" />
                  Baseline B0
                </span>
              )}
              {showDualBaselineBars && (
                <span className="flex items-center gap-1 text-[10px] text-rose-300">
                  <span className="w-2.5 h-0.5 border-t-2 border-dashed border-rose-500 inline-block" />
                  Slippage
                </span>
              )}

              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-xs bg-rose-500" />
                Critical Bar (Float ≤ 1d)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-xs bg-blue-500" />
                Plan / Actual Bar
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rotate-45 bg-amber-400" />
                Milestone
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-b border-dashed border-red-400" />
                Cutoff Date ({todayStr})
              </span>
            </div>
          </div>

          {/* Dual-Pane Layout: Left Table + Right Gantt Timeline */}
          <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-800 max-h-[750px] overflow-hidden">
            {/* Left Data Grid (MS Project Table) */}
            <div className="w-full lg:w-[58%] overflow-x-auto overflow-y-auto border-r border-slate-800">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead className="bg-slate-950/80 sticky top-0 z-20 text-[10px] text-slate-400 uppercase font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-2 text-center w-8">#</th>
                    <th className="py-2.5 px-1.5 text-center w-6">i</th>
                    <th className="py-2.5 px-3 min-w-[220px]">Task Name / Aktivitas</th>
                    <th className="py-2.5 px-2 text-center w-16">Durasi</th>
                    <th className="py-2.5 px-2 text-center w-20">Start Plan</th>
                    <th className="py-2.5 px-2 text-center w-20">Finish Plan</th>
                    {showDualBaselineBars && (
                      <th className="py-2.5 px-2 text-center min-w-[78px] bg-slate-900/90 text-amber-300">
                        Base Fin
                      </th>
                    )}
                    {showDualBaselineBars && (
                      <th className="py-2.5 px-2 text-center min-w-[78px] bg-slate-900/90 text-rose-300">
                        Slippage
                      </th>
                    )}
                    <th className="py-2.5 px-2 text-center min-w-[90px]">Predecessors</th>
                    <th className="py-2.5 px-2 text-center min-w-[80px]">Successors</th>
                    <th className="py-2.5 px-2 text-right w-14">Bobot</th>
                    <th className="py-2.5 px-2 text-center w-20">% Act</th>
                    <th className="py-2.5 px-2 text-center w-14">Resource</th>
                    <th className="py-2.5 px-2 text-center w-14">Pier</th>
                    <th className="py-2.5 px-2 text-center w-12">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredActivities.map((act, idx) => {
                    const isCrit = highlightCriticalPath && act.isCritical;
                    const predText = formatPredecessors(act.predecessors, scheduledActivities);
                    const succs = successorsMap.get(act.activityId) || [];

                    return (
                      <tr
                        key={act.activityId}
                        className={`h-11 transition-colors hover:bg-slate-800/60 ${
                          isCrit ? 'bg-rose-950/10' : idx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/10'
                        }`}
                      >
                        {/* Row # */}
                        <td className="py-2 px-2 text-center font-mono text-[11px] text-slate-500 font-bold">
                          {idx + 1}
                        </td>

                        {/* Indicator */}
                        <td className="py-2 px-1.5 text-center">
                          {isCrit ? (
                            <span title="Critical Path Task (Float ≤ 1d)">
                              <Flame className="w-3.5 h-3.5 text-rose-500 inline-block" />
                            </span>
                          ) : act.isMilestone ? (
                            <span title="Milestone Task">
                              <span className="w-2.5 h-2.5 rotate-45 bg-amber-400 inline-block" />
                            </span>
                          ) : act.status === 'Completed' ? (
                            <span title="Completed">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline-block" />
                            </span>
                          ) : (
                            <span title="In Progress">
                              <Clock className="w-3.5 h-3.5 text-blue-400 inline-block" />
                            </span>
                          )}
                        </td>

                        {/* Task Name */}
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            {act.wbsCode && (
                              <span className="text-[10px] font-mono font-bold text-blue-400 shrink-0">
                                {act.wbsCode}
                              </span>
                            )}
                            <span
                              className={`font-semibold truncate max-w-[260px] text-xs ${
                                isCrit ? 'text-rose-200' : 'text-slate-200'
                              }`}
                              title={act.activityName}
                            >
                              {act.activityName}
                            </span>
                          </div>
                        </td>

                        {/* Duration */}
                        <td className="py-2 px-2 text-center font-mono text-[11px] text-slate-300">
                          {act.duration || calculateDurationDays(act.startPlan, act.finishPlan)}d
                        </td>

                        {/* Start Plan */}
                        <td className="py-2 px-2 text-center font-mono text-[11px] text-slate-300">
                          {act.startPlan}
                        </td>

                        {/* Finish Plan */}
                        <td className="py-2 px-2 text-center font-mono text-[11px] text-slate-300">
                          {act.finishPlan}
                        </td>

                        {/* Dual Baseline Table Columns */}
                        {showDualBaselineBars && (
                          <td className="py-2 px-2 text-center font-mono text-[10px] text-amber-300/90 bg-slate-900/40">
                            {act.baselineFinish || act.finishPlan}
                          </td>
                        )}
                        {showDualBaselineBars && (
                          <td className="py-2 px-2 text-center font-mono text-[10px] bg-slate-900/40">
                            {(() => {
                              const baseFin = act.baselineFinish || act.finishPlan;
                              const diff = getDaysDiff(act.finishPlan, baseFin);
                              if (diff > 0) {
                                return (
                                  <span className="px-1.5 py-0.5 rounded font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40 text-[10px]">
                                    +{diff}d
                                  </span>
                                );
                              } else if (diff < 0) {
                                return (
                                  <span className="px-1.5 py-0.5 rounded font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 text-[10px]">
                                    {diff}d
                                  </span>
                                );
                              }
                              return <span className="text-slate-500 text-[10px]">0d</span>;
                            })()}
                          </td>
                        )}

                        {/* Predecessors (Clickable Pill) */}
                        <td className="py-2 px-2 text-center">
                          <button
                            onClick={() => setSelectedActForRelationship(act)}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                              predText !== '-'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30'
                                : 'bg-slate-800/80 text-slate-500 border-slate-700 hover:text-slate-300'
                            }`}
                            title="Klik untuk Kelola Predecessor (FS, SS, FF, Lag)"
                          >
                            {predText}
                          </button>
                        </td>

                        {/* Successors */}
                        <td className="py-2 px-2 text-center font-mono text-[11px] text-slate-400">
                          {succs.length > 0 ? (
                            <span className="text-cyan-300 font-semibold">{succs.join(', ')}</span>
                          ) : (
                            '-'
                          )}
                        </td>

                        {/* Weight */}
                        <td className="py-2 px-2 text-right font-mono text-[11px] text-slate-300">
                          {act.weight ? `${act.weight.toFixed(2)}%` : '-'}
                        </td>

                        {/* % Actual Progress */}
                        <td className="py-2 px-2 text-center">
                          <div className="w-16 mx-auto space-y-0.5">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-emerald-400 font-bold">{Math.round(act.progressActual)}%</span>
                              <span className="text-slate-500">{Math.round(act.progressPlan)}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, act.progressActual)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Resource */}
                        <td className="py-2 px-2 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              act.contractorId === 'WIKA'
                                ? 'bg-blue-500/20 text-blue-300'
                                : act.contractorId === 'GI'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-purple-500/20 text-purple-300'
                            }`}
                          >
                            {act.contractorId}
                          </span>
                        </td>

                        {/* Pier ID */}
                        <td className="py-2 px-2 text-center font-mono text-[10px] text-slate-300">
                          {act.pierId}
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingActivity(act);
                                setActModalOpen(true);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                              title="Edit Task"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Right Gantt Chart Interactive Timeline */}
            <div className="w-full lg:w-[42%] overflow-x-auto overflow-y-auto relative bg-slate-950/60">
              <div style={{ width: `${ganttWidth}px` }} className="relative select-none min-h-full">
                {/* Timeline Header (Months) */}
                <div className="sticky top-0 z-10 bg-slate-950 border-b border-slate-800 flex h-10">
                  {monthHeaders.map((m, mIdx) => (
                    <div
                      key={mIdx}
                      style={{ width: `${m.widthPx}px` }}
                      className="shrink-0 border-r border-slate-800 px-2 flex items-center text-[10px] font-bold text-slate-300 uppercase tracking-wider bg-slate-900/60"
                    >
                      {m.name}
                    </div>
                  ))}
                </div>

                {/* Today Cutoff Marker Vertical Line */}
                {todayX > 0 && (
                  <div
                    style={{ left: `${todayX}px` }}
                    className="absolute top-0 bottom-0 w-0.5 border-r-2 border-dashed border-red-500 z-10 pointer-events-none"
                  >
                    <span className="absolute -top-1 -left-6 bg-red-600 text-white text-[9px] font-mono px-1 rounded font-bold shadow-sm">
                      Cutoff
                    </span>
                  </div>
                )}

                {/* SVG Relationship Connecting Arrows */}
                {showDependencyArrows && (
                  <svg
                    className="absolute inset-0 pointer-events-none z-0"
                    style={{ width: `${ganttWidth}px`, height: `${filteredActivities.length * 44 + 40}px` }}
                  >
                    <defs>
                      {/* Standard Blue Arrow Marker */}
                      <marker
                        id="arrow-std"
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                      </marker>

                      {/* Critical Red Arrow Marker */}
                      <marker
                        id="arrow-crit"
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
                      </marker>
                    </defs>

                    {relationshipLinks.map(link => (
                      <path
                        key={link.id}
                        d={link.path}
                        fill="none"
                        stroke={link.isCritical ? '#f43f5e' : '#38bdf8'}
                        strokeWidth={link.isCritical ? '2' : '1.5'}
                        strokeDasharray={link.type === 'SS' ? '4,3' : 'none'}
                        markerEnd={link.isCritical ? 'url(#arrow-crit)' : 'url(#arrow-std)'}
                        opacity={0.8}
                      />
                    ))}
                  </svg>
                )}

                {/* Activity Bars */}
                <div className="relative">
                  {filteredActivities.map((act, index) => {
                    const startX = getXForDate(act.startPlan);
                    const dur = act.duration || calculateDurationDays(act.startPlan, act.finishPlan);
                    const barWidth = Math.max(14, dur * pxPerDay);
                    const isCrit = highlightCriticalPath && act.isCritical;

                    // Baseline geometry
                    const baseStart = act.baselineStart || act.startPlan;
                    const baseFinish = act.baselineFinish || act.finishPlan;
                    const baseStartX = getXForDate(baseStart);
                    const baseDur = act.baselineDuration || calculateDurationDays(baseStart, baseFinish);
                    const baseBarWidth = Math.max(12, baseDur * pxPerDay);
                    const finishSlippageDays = getDaysDiff(act.finishPlan, baseFinish);

                    return (
                      <div
                        key={act.activityId}
                        style={{ height: '44px' }}
                        className="flex items-center px-1 border-b border-slate-800/40 relative hover:bg-slate-800/30 transition-colors"
                      >
                        {act.isMilestone ? (
                          /* Milestone Diamond */
                          <div
                            style={{ left: `${startX}px` }}
                            className="absolute -translate-x-1/2 flex items-center justify-center cursor-pointer group"
                            title={`Milestone: ${act.activityName} (${act.finishPlan})`}
                          >
                            <div className="w-4 h-4 rotate-45 bg-amber-400 shadow-md shadow-amber-500/50 border border-white" />
                            <span className="ml-5 text-[10px] font-mono text-amber-300 font-bold whitespace-nowrap opacity-90">
                              {act.activityName}
                            </span>
                          </div>
                        ) : showDualBaselineBars ? (
                          /* Dual Bars: Upper Baseline B0 + Lower Current Schedule + Slippage Extension */
                          <div className="relative w-full h-full">
                            {/* Baseline B0 Bar (Upper) */}
                            <div
                              style={{
                                left: `${baseStartX}px`,
                                width: `${baseBarWidth}px`,
                                top: '5px'
                              }}
                              className="absolute h-3 rounded-xs bg-slate-700/90 border border-slate-500/80 z-1 pointer-events-none shadow-xs"
                              title={`Baseline B0: ${baseStart} s/d ${baseFinish} (${baseDur} Hari)`}
                            >
                              <div className="absolute inset-0 flex items-center px-1 text-[8px] font-mono font-bold text-slate-300 truncate">
                                B0: {baseDur}d
                              </div>
                            </div>

                            {/* Slippage Extension Dash Connector (If delayed past baseline finish) */}
                            {finishSlippageDays > 0 && (
                              <div
                                style={{
                                  left: `${Math.min(baseStartX + baseBarWidth, startX + barWidth)}px`,
                                  width: `${Math.abs((startX + barWidth) - (baseStartX + baseBarWidth))}px`,
                                  top: '10px'
                                }}
                                className="absolute h-0.5 border-t-2 border-dashed border-rose-500 pointer-events-none flex items-center z-0"
                              >
                                <span
                                  style={{ left: `${Math.abs((startX + barWidth) - (baseStartX + baseBarWidth))}px` }}
                                  className="absolute -top-3.5 -translate-y-0.5 px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-rose-950 text-rose-200 border border-rose-500/80 shadow-xs whitespace-nowrap"
                                >
                                  +{finishSlippageDays}d
                                </span>
                              </div>
                            )}

                            {/* Current Plan / Realization Bar (Lower) */}
                            <div
                              style={{
                                left: `${startX}px`,
                                width: `${barWidth}px`,
                                top: '20px'
                              }}
                              onClick={() => setSelectedActForRelationship(act)}
                              className={`absolute h-4.5 rounded-sm overflow-hidden cursor-pointer shadow-sm transition-all group border z-2 ${
                                isCrit
                                  ? 'bg-rose-950/80 border-rose-500 hover:border-rose-400'
                                  : 'bg-slate-800 border-blue-500/60 hover:border-blue-400'
                              }`}
                              title={`Jadwal Terkini: ${act.activityName} (${act.startPlan} s/d ${act.finishPlan}) - Progres: ${act.progressActual}%`}
                            >
                              <div
                                style={{ width: `${Math.min(100, act.progressActual)}%` }}
                                className={`h-full transition-all ${
                                  isCrit ? 'bg-rose-500' : 'bg-blue-500'
                                }`}
                              />
                              <div className="absolute inset-0 px-1.5 flex items-center justify-between text-[9px] font-semibold text-white pointer-events-none truncate">
                                <span className="truncate drop-shadow-xs font-mono">
                                  {act.activityName}
                                </span>
                                <span className="shrink-0 font-mono text-[8px] ml-1">
                                  {Math.round(act.progressActual)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Standard Single Gantt Bar */
                          <div
                            style={{
                              left: `${startX}px`,
                              width: `${barWidth}px`
                            }}
                            onClick={() => setSelectedActForRelationship(act)}
                            className={`absolute h-6 rounded-md overflow-hidden cursor-pointer shadow-sm transition-all group border ${
                              isCrit
                                ? 'bg-rose-950/80 border-rose-500 hover:border-rose-400 hover:shadow-rose-900/50'
                                : 'bg-slate-800 border-blue-500/60 hover:border-blue-400'
                            }`}
                            title={`${act.activityName} (${act.startPlan} s/d ${act.finishPlan}) - ${act.duration}d`}
                          >
                            {/* Progress Actual Fill */}
                            <div
                              style={{ width: `${Math.min(100, act.progressActual)}%` }}
                              className={`h-full transition-all ${
                                isCrit ? 'bg-rose-500' : 'bg-blue-500'
                              }`}
                            />

                            {/* Label inside bar */}
                            <div className="absolute inset-0 px-2 flex items-center justify-between text-[10px] font-semibold text-white pointer-events-none truncate">
                              <span className="truncate drop-shadow-xs font-mono">
                                {act.activityName}
                              </span>
                              <span className="shrink-0 font-mono text-[9px] drop-shadow-xs ml-1">
                                {Math.round(act.progressActual)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE: BASELINE SLIPPAGE & DEVIATION ANALYSIS */}
      {viewMode === 'slippage' && (
        <BaselineSlippageView
          activities={scheduledActivities}
          onSelectActivity={act => setSelectedActForRelationship(act)}
          onEditRelationships={act => setSelectedActForRelationship(act)}
          onSaveBaselineSnapshot={handleSaveBaselineSnapshot}
        />
      )}

      {/* VIEW MODE 2: PRECEDENCE DIAGRAM METHOD (PDM NETWORK DIAGRAM) */}
      {viewMode === 'pdm' && (
        <PrecedenceDiagramView
          activities={scheduledActivities}
          onSelectActivity={act => setSelectedActForRelationship(act)}
          onEditRelationships={act => setSelectedActForRelationship(act)}
        />
      )}

      {/* VIEW MODE 3: HIERARCHICAL WBS 6-LEVEL TREE */}
      {viewMode === 'tree' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-base">Hierarki WBS Standar Rekayasa Konstruksi</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Struktur pohon hirarkis 6 level: Level 1 (Project) → L2 (Zona Trase) → L3 (Paket Pekerjaan) → L4 (Kategori) → L5 (Aktivitas) → L6 (Detail)
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => {
                  const all: Record<string, boolean> = {};
                  wbs.forEach(w => (all[w.wbsId] = true));
                  setExpandedNodes(all);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 cursor-pointer"
              >
                Expand Semua
              </button>
              <button
                onClick={() => setExpandedNodes({ 'WBS-1': true })}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 cursor-pointer"
              >
                Collapse Semua
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {wbs.map(node => {
              const isExpanded = expandedNodes[node.wbsId] ?? false;
              const indentStyle = { paddingLeft: `${(node.level - 1) * 24}px` };
              const attachedActs = scheduledActivities.filter(a => a.wbsId === node.wbsId);

              return (
                <div key={node.wbsId} className="space-y-1">
                  <div
                    style={indentStyle}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={() => toggleExpand(node.wbsId)}
                        className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        node.level === 1 ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                        node.level === 2 ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                        node.level === 3 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                        node.level === 4 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                        'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        L{node.level}
                      </span>

                      <span className="font-mono text-xs font-bold text-blue-400">{node.wbsCode}</span>
                      <span className="font-semibold text-xs text-slate-200 truncate">{node.wbsName}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      {attachedActs.length > 0 && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[11px]">
                          {attachedActs.length} Task Terjadwal
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-500">{node.wbsId}</span>
                    </div>
                  </div>

                  {/* Nested Attached Activities */}
                  {isExpanded && attachedActs.length > 0 && (
                    <div style={{ paddingLeft: `${node.level * 24 + 18}px` }} className="space-y-1.5 pt-1 pb-2">
                      {attachedActs.map(act => (
                        <div
                          key={act.activityId}
                          onClick={() => setSelectedActForRelationship(act)}
                          className="p-3 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 flex items-center justify-between text-xs cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                            <span className="font-mono font-bold text-blue-300 text-[11px]">{act.activityId}</span>
                            <span className="font-medium text-slate-200 truncate">{act.activityName}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300 font-bold">
                              {act.contractorId}
                            </span>
                            <span className="text-[11px] font-mono text-emerald-400">Pier: {act.pierId}</span>
                          </div>

                          <div className="flex items-center gap-4 font-mono text-[11px] shrink-0">
                            <span className="text-slate-400">Durasi: {act.duration}d</span>
                            <span>Bobot: {act.weight}%</span>
                            <span className="text-slate-400">Plan: {act.progressPlan}%</span>
                            <span className="text-emerald-400 font-bold">Act: {act.progressActual}%</span>
                            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                              Pred: {formatPredecessors(act.predecessors, scheduledActivities)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: NETWORK DIAGRAM (PERT CHART) */}
      {viewMode === 'network' && (
        <NetworkDiagramView
          activities={scheduledActivities}
          onSelectActivity={act => setSelectedActForRelationship(act)}
        />
      )}

      {/* RELATIONSHIP MANAGER MODAL */}
      {selectedActForRelationship && (
        <RelationshipModal
          activity={selectedActForRelationship}
          allActivities={scheduledActivities}
          isOpen={true}
          onClose={() => setSelectedActForRelationship(null)}
          onSave={updated => {
            updateActivity(updated);
            setSelectedActForRelationship(null);
          }}
        />
      )}

      {/* ADD / EDIT TASK MODAL */}
      {actModalOpen && (
        <TaskModal
          activity={editingActivity}
          allActivities={scheduledActivities}
          wbsNodes={wbs}
          piers={piers}
          isOpen={actModalOpen}
          onClose={() => {
            setActModalOpen(false);
            setEditingActivity(null);
          }}
          onSave={act => {
            if (editingActivity) {
              updateActivity(act);
            } else {
              addActivity(act);
            }
            setActModalOpen(false);
            setEditingActivity(null);
          }}
        />
      )}
    </div>
  );
};
