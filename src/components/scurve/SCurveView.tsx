import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  Layers,
  Building2,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  BarChart2,
  Sliders,
  Info,
  ChevronRight,
  ShieldCheck,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Plus,
  Edit2,
  Check,
  X,
  RotateCcw,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
  Bar
} from 'recharts';
import { useProject } from '../../context/ProjectContext';
import { SCurveGranularity, SCurveBaselineVersion, ContractorId, SCurveDataPoint } from '../../types';
import {
  addendumMilestones,
  rawMonthlySCurve,
  rawWeeklySCurve,
  rawDailySCurve,
  filterSCurveData
} from '../../data/sCurveData';
import { PMESCurveAlertSystem } from './PMESCurveAlertSystem';
import { SCurveExcelImportModal } from './SCurveExcelImportModal';

interface SCurveViewProps {
  onNavigateToBOQ?: () => void;
}

export const SCurveView: React.FC<SCurveViewProps> = ({ onNavigateToBOQ }) => {
  const { zones, exportToExcel } = useProject();

  // Controls State
  const [granularity, setGranularity] = useState<SCurveGranularity>('monthly');
  const [baselineVersion, setBaselineVersion] = useState<SCurveBaselineVersion>('ALL');
  const [contractorFilter, setContractorFilter] = useState<ContractorId | 'ALL'>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [chartType, setChartType] = useState<'line' | 'area' | 'composed'>('line');
  const [showIncrementalBars, setShowIncrementalBars] = useState<boolean>(true);
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);

  // Datasets with localStorage persistence
  const [monthlyData, setMonthlyData] = useState<SCurveDataPoint[]>(() => {
    const saved = localStorage.getItem('hbr2_scurve_monthly');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return rawMonthlySCurve;
  });

  const [weeklyData, setWeeklyData] = useState<SCurveDataPoint[]>(() => {
    const saved = localStorage.getItem('hbr2_scurve_weekly');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return rawWeeklySCurve;
  });

  const [dailyData, setDailyData] = useState<SCurveDataPoint[]>(() => {
    const saved = localStorage.getItem('hbr2_scurve_daily');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return rawDailySCurve;
  });

  // Notification feedback
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Inline edit state for table rows
  interface EditRowState {
    index: number;
    period: string;
    plannedAddendum4: string;
    actual: string;
    forecast: string;
  }
  const [editingPoint, setEditingPoint] = useState<EditRowState | null>(null);

  // Update Modal state
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [updateForm, setUpdateForm] = useState({
    targetGranularity: 'monthly' as SCurveGranularity,
    period: '',
    date: '',
    actual: '',
    plannedAddendum4: '',
    forecast: '',
    isNew: false
  });

  // Helper update & persist
  const updateSCurveData = (gran: SCurveGranularity, updated: SCurveDataPoint[]) => {
    if (gran === 'monthly') {
      setMonthlyData(updated);
      try {
        localStorage.setItem('hbr2_scurve_monthly', JSON.stringify(updated));
      } catch {}
    } else if (gran === 'weekly') {
      setWeeklyData(updated);
      try {
        localStorage.setItem('hbr2_scurve_weekly', JSON.stringify(updated));
      } catch {}
    } else {
      setDailyData(updated);
      try {
        localStorage.setItem('hbr2_scurve_daily', JSON.stringify(updated));
      } catch {}
    }
  };

  const handleResetSCurve = () => {
    if (confirm('Kembalikan data Kurva S ke data master standar (Bulanan, Mingguan, Harian)?')) {
      setMonthlyData(rawMonthlySCurve);
      setWeeklyData(rawWeeklySCurve);
      setDailyData(rawDailySCurve);
      localStorage.removeItem('hbr2_scurve_monthly');
      localStorage.removeItem('hbr2_scurve_weekly');
      localStorage.removeItem('hbr2_scurve_daily');
      setSaveFeedback('Data Kurva S berhasil direset ke standar master.');
      setTimeout(() => setSaveFeedback(null), 3000);
    }
  };

  const handleStartInlineEdit = (idx: number, row: SCurveDataPoint) => {
    setEditingPoint({
      index: idx,
      period: row.period,
      plannedAddendum4: row.plannedAddendum4 !== undefined ? String(row.plannedAddendum4) : '',
      actual: row.actual !== undefined ? String(row.actual) : '',
      forecast: row.forecast !== undefined ? String(row.forecast) : ''
    });
  };

  const handleCancelInlineEdit = () => {
    setEditingPoint(null);
  };

  const handleSaveInlineEdit = () => {
    if (!editingPoint) return;
    const targetDataset = granularity === 'monthly' ? monthlyData : granularity === 'weekly' ? weeklyData : dailyData;
    const updated = targetDataset.map((item, i) => {
      if (i === editingPoint.index) {
        const actNum = editingPoint.actual.trim() !== '' ? Number(editingPoint.actual) : undefined;
        const planNum = editingPoint.plannedAddendum4.trim() !== '' ? Number(editingPoint.plannedAddendum4) : item.plannedAddendum4;
        const fcNum = editingPoint.forecast.trim() !== '' ? Number(editingPoint.forecast) : undefined;
        return {
          ...item,
          actual: actNum !== undefined && !isNaN(actNum) ? actNum : undefined,
          plannedAddendum4: planNum !== undefined && !isNaN(planNum) ? planNum : item.plannedAddendum4,
          planned: planNum !== undefined && !isNaN(planNum) ? planNum : item.planned,
          forecast: fcNum !== undefined && !isNaN(fcNum) ? fcNum : undefined
        };
      }
      return item;
    });

    updateSCurveData(granularity, updated);
    setEditingPoint(null);
    setSaveFeedback(`Titik ${editingPoint.period} Kurva S (${granularity}) berhasil disimpan.`);
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  const handleSaveModalForm = () => {
    const gran = updateForm.targetGranularity;
    const targetDataset = gran === 'monthly' ? monthlyData : gran === 'weekly' ? weeklyData : dailyData;

    if (!updateForm.period.trim()) {
      alert('Mohon isi nama periode (contoh: Sep 25, Mgg 38, dsb).');
      return;
    }

    const actNum = updateForm.actual.trim() !== '' ? Number(updateForm.actual) : undefined;
    const planNum = updateForm.plannedAddendum4.trim() !== '' ? Number(updateForm.plannedAddendum4) : undefined;
    const fcNum = updateForm.forecast.trim() !== '' ? Number(updateForm.forecast) : undefined;

    const existingIndex = targetDataset.findIndex(
      d => d.period.toLowerCase() === updateForm.period.trim().toLowerCase()
    );

    let updated: SCurveDataPoint[];
    if (existingIndex >= 0) {
      updated = targetDataset.map((item, i) => {
        if (i === existingIndex) {
          return {
            ...item,
            date: updateForm.date || item.date,
            actual: actNum !== undefined && !isNaN(actNum) ? actNum : item.actual,
            plannedAddendum4: planNum !== undefined && !isNaN(planNum) ? planNum : item.plannedAddendum4,
            planned: planNum !== undefined && !isNaN(planNum) ? planNum : item.planned,
            forecast: fcNum !== undefined && !isNaN(fcNum) ? fcNum : item.forecast
          };
        }
        return item;
      });
    } else {
      const newPt: SCurveDataPoint = {
        period: updateForm.period.trim(),
        date: updateForm.date || new Date().toISOString().split('T')[0],
        planned: planNum ?? 90,
        plannedAddendum4: planNum ?? 90,
        actual: actNum,
        forecast: fcNum
      };
      updated = [...targetDataset, newPt];
    }

    updateSCurveData(gran, updated);
    setShowUpdateModal(false);
    setSaveFeedback(`Progres Kurva S periode ${updateForm.period} berhasil diperbarui.`);
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  const handleApplyImportedData = (points: SCurveDataPoint[], gran: SCurveGranularity) => {
    updateSCurveData(gran, points);
    setSaveFeedback(`Berhasil mengimpor ${points.length} titik Kurva S (${gran}). Kurva S telah diperbarui dengan data proyek.`);
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  // Raw dataset based on granularity
  const rawDataset = useMemo(() => {
    switch (granularity) {
      case 'daily':
        return dailyData;
      case 'weekly':
        return weeklyData;
      case 'monthly':
      default:
        return monthlyData;
    }
  }, [granularity, dailyData, weeklyData, monthlyData]);

  // Processed and filtered data
  const processedData = useMemo(() => {
    return filterSCurveData(rawDataset, contractorFilter, zoneFilter);
  }, [rawDataset, contractorFilter, zoneFilter]);

  // Current status values (latest point with actual progress)
  const latestEvaluation = useMemo(() => {
    const evaluatedPoints = processedData.filter(d => d.actual !== undefined);
    if (evaluatedPoints.length === 0) return processedData[0];
    return evaluatedPoints[evaluatedPoints.length - 1];
  }, [processedData]);

  // Current stats
  const stats = useMemo(() => {
    const act = latestEvaluation.actual ?? 0;
    const planB0 = latestEvaluation.plannedOriginal ?? latestEvaluation.planned;
    const planAdd4 = latestEvaluation.plannedAddendum4 ?? latestEvaluation.planned;
    const varB0 = Math.round((act - planB0) * 10) / 10;
    const varAdd4 = Math.round((act - planAdd4) * 10) / 10;
    const spiB0 = planB0 > 0 ? (act / planB0).toFixed(3) : '1.000';
    const spiAdd4 = planAdd4 > 0 ? (act / planAdd4).toFixed(3) : '1.000';

    return {
      cutoffDate: latestEvaluation.date,
      period: latestEvaluation.period,
      actual: act,
      planB0,
      planAdd4,
      varB0,
      varAdd4,
      spiB0,
      spiAdd4
    };
  }, [latestEvaluation]);

  // Export to Excel / CSV
  const handleExport = () => {
    const exportRows = processedData.map(d => ({
      Periode: d.period,
      'Tanggal Cutoff': d.date,
      'Kontrak Awal (%)': d.plannedOriginal ?? d.planned,
      'Addendum 1 (%)': d.plannedAddendum1 ?? '-',
      'Addendum 2 (%)': d.plannedAddendum2 ?? '-',
      'Addendum 3 (%)': d.plannedAddendum3 ?? '-',
      'Addendum 4 Terkini (%)': d.plannedAddendum4 ?? d.planned,
      'Realisasi Aktual (%)': d.actual ?? '-',
      'Forecast Selesai (%)': d.forecast ?? '-',
      'Varians thd Addendum 4 (%)': d.variance ?? '-',
      'SPI': d.spi ?? '-',
      'Bobot Rencana Periodik (%)': d.incrementalPlan ?? '-',
      'Bobot Aktual Periodik (%)': d.incrementalActual ?? '-'
    }));

    exportToExcel(
      `Kurva_S_HBR2_${granularity}_${baselineVersion}`,
      `Kurva S ${granularity.toUpperCase()}`,
      exportRows
    );
  };

  return (
    <div id="scurve-analysis-view" className="space-y-6 pb-16">
      {/* Top Header & Overview */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Kurva-S Proyek &amp; Riwayat Baseline Addendum Kontrak
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  HBR II Elevated Tollway
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Visualisasi terpadu progres fisik kumulatif: Rencana Kontrak Awal (B0), Addendum 1 s/d 4, Realisasi Aktual, dan Proyeksi Penyelesaian (Forecast).
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => {
              setUpdateForm({
                targetGranularity: granularity,
                period: latestEvaluation?.period || '',
                date: latestEvaluation?.date || new Date().toISOString().split('T')[0],
                actual: latestEvaluation?.actual !== undefined ? String(latestEvaluation.actual) : '',
                plannedAddendum4: latestEvaluation?.plannedAddendum4 !== undefined ? String(latestEvaluation.plannedAddendum4) : '',
                forecast: latestEvaluation?.forecast !== undefined ? String(latestEvaluation.forecast) : '',
                isNew: false
              });
              setShowUpdateModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer"
            title="Update atau Tambah Titik Progres Kurva S (Realisasi Aktual, Rencana, Forecast)"
          >
            <Plus className="w-4 h-4" />
            <span>Update Kurva-S</span>
          </button>

          {/* Import / Paste Excel Table Modal */}
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 rounded-xl font-bold transition-all shadow-sm cursor-pointer"
            title="Import atau Paste data tabel dari Microsoft Excel / Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Import Tabel Excel</span>
          </button>

          {onNavigateToBOQ && (
            <button
              onClick={onNavigateToBOQ}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl font-semibold transition-all shadow-xs cursor-pointer"
              title="Lihat Detail Nilai & Volume BOQ Kontrak Awal s/d Addendum 4"
            >
              <Coins className="w-4 h-4 text-blue-400" />
              <span>BOQ &amp; Nilai Kontrak</span>
            </button>
          )}

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Ekspor Tabel Kurva-S</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={handleResetSCurve}
            className="flex items-center gap-1 px-2.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded-xl font-medium transition-all cursor-pointer"
            title="Kembalikan data Kurva S ke master standar"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Save / Feedback Toast */}
      {saveFeedback && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* Automated PME Notification & Alert System */}
      <PMESCurveAlertSystem />

      {/* Control Strip: Granularity & Baseline Selector & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        {/* Left: Granularity Selector (Harian, Mingguan, Bulanan) */}
        <div className="lg:col-span-4 flex flex-col justify-center space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Resolusi Waktu (Granularitas):
          </span>
          <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setGranularity('daily')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                granularity === 'daily'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Harian (Daily)</span>
            </button>
            <button
              onClick={() => setGranularity('weekly')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                granularity === 'weekly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Mingguan (Weekly)</span>
            </button>
            <button
              onClick={() => setGranularity('monthly')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                granularity === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Bulanan (Monthly)</span>
            </button>
          </div>
        </div>

        {/* Center: Baseline Filter (Kontrak Awal, Addendum 1, 2, 3, 4, ALL) */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Versi Baseline Target:</span>
            {baselineVersion === 'ALL' && (
              <span className="text-amber-400 text-[10px] lowercase font-normal">
                ★ multi-baseline overlay aktif
              </span>
            )}
          </span>
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setBaselineVersion('ALL')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                baselineVersion === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tampilkan perbandingan seluruh kurva Kontrak Awal & Addendum 1, 2, 3, 4 sekaligus"
            >
              Semua (Overlay)
            </button>
            <button
              onClick={() => setBaselineVersion('ORIGINAL')}
              className={`px-2 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                baselineVersion === 'ORIGINAL'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Rencana Kontrak Awal (Baseline 0 - Target 31 Des 2026)"
            >
              Kontrak Awal
            </button>
            <button
              onClick={() => setBaselineVersion('ADD_1')}
              className={`px-2 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                baselineVersion === 'ADD_1'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Addendum 1 (Penyesuaian Akses Lahan Ancol Timur)"
            >
              Add. 1
            </button>
            <button
              onClick={() => setBaselineVersion('ADD_2')}
              className={`px-2 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                baselineVersion === 'ADD_2'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Addendum 2 (Redesain Struktur Portal P.56A & Window Time KAI)"
            >
              Add. 2
            </button>
            <button
              onClick={() => setBaselineVersion('ADD_3')}
              className={`px-2 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                baselineVersion === 'ADD_3'
                  ? 'bg-orange-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Addendum 3 (Kendala Relokasi Pipa Gas PGN P.20.S & PAM Jaya)"
            >
              Add. 3
            </button>
            <button
              onClick={() => setBaselineVersion('ADD_4')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                baselineVersion === 'ADD_4'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Addendum 4 (Working Baseline Resmi Terkini - Target 31 Mar 2027)"
            >
              Add. 4 (Terkini)
            </button>
          </div>
        </div>

        {/* Right: Contractor & Zone Filter */}
        <div className="lg:col-span-3 flex flex-col justify-center space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Lingkup Kontraktor:
          </span>
          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs w-full">
              {(['ALL', 'WIKA', 'GI'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => setContractorFilter(c)}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer text-center ${
                    contractorFilter === c
                      ? c === 'WIKA'
                        ? 'bg-blue-600 text-white'
                        : c === 'GI'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c === 'ALL' ? 'Total' : c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Executive S-Curve Scorecard KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Actual Progress */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Realisasi Aktual</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {stats.actual.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            Cutoff: <span className="text-slate-300 font-mono">{stats.cutoffDate}</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* Target Kontrak Awal (B0) */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Kontrak Awal (B0)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-400 font-mono">
            {stats.planB0.toFixed(1)}%
          </div>
          <div className="flex items-center gap-1 text-[10px] text-rose-400 mt-1 font-mono font-semibold">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Deviasi: {stats.varB0 > 0 ? `+${stats.varB0}` : stats.varB0}%</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-400" />
        </div>

        {/* Target Addendum 4 (Working Baseline) */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Addendum 4 (Terkini)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">
            {stats.planAdd4.toFixed(1)}%
          </div>
          <div className="flex items-center gap-1 text-[10px] text-rose-400 mt-1 font-mono font-semibold">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Deviasi: {stats.varAdd4 > 0 ? `+${stats.varAdd4}` : stats.varAdd4}%</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
        </div>

        {/* Schedule Performance Index (SPI) */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Kinerja Jadwal (SPI)</span>
            <Sliders className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {stats.spiAdd4}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {parseFloat(stats.spiAdd4) < 1 ? (
              <span className="text-amber-400 font-bold">Behind Schedule (SPI &lt; 1)</span>
            ) : (
              <span className="text-emerald-400 font-bold">On Schedule</span>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-400" />
        </div>

        {/* Total Extension Days */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Perpanjangan Waktu</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono">
            +90 <span className="text-sm font-sans font-normal text-slate-400">Hari</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            Addendum 1 s/d 4 (Total)
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
        </div>

        {/* Final Target PHO */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Target Akhir PHO</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-black text-white font-mono mt-1">
            31 Mar 2027
          </div>
          <div className="text-[10px] text-cyan-400 mt-1 font-semibold">
            Semula: 31 Des 2026
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-400" />
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
        {/* Chart Subheader & Legends */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                Grafik Kurva-S Kumulatif {granularity === 'daily' ? 'Harian' : granularity === 'weekly' ? 'Mingguan' : 'Bulanan'}
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-blue-300 border border-slate-700">
                {contractorFilter === 'ALL' ? 'Seluruh Proyek (WIKA & GI)' : `Kontraktor ${contractorFilter}`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sumbu X merepresentasikan periode cut-off; Sumbu Y menunjukkan % kumulatif bobot prestasi pekerjaan (0 s/d 100%)
            </p>
          </div>

          {/* Chart Display Options */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Toggle Incremental Histogram */}
            <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-semibold cursor-pointer hover:border-blue-500/50">
              <input
                type="checkbox"
                checked={showIncrementalBars}
                onChange={e => setShowIncrementalBars(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px]">Histogram Bobot Periodik</span>
            </label>

            {/* Chart Type Selector */}
            <div className="flex items-center p-1 rounded-lg bg-slate-800 border border-slate-700">
              <button
                onClick={() => setChartType('line')}
                className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                  chartType === 'line' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Garis (Line)
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                  chartType === 'area' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Area Shaded
              </button>
            </div>
          </div>
        </div>

        {/* Legend Explanations */}
        <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          {(baselineVersion === 'ALL' || baselineVersion === 'ORIGINAL') && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-sky-400 rounded-full inline-block border-t-2 border-dashed border-sky-400" />
              <span className="text-slate-300 font-medium">Kontrak Awal (B0)</span>
            </div>
          )}
          {(baselineVersion === 'ALL' || baselineVersion === 'ADD_1') && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-purple-400 rounded-full inline-block" />
              <span className="text-slate-300 font-medium">Addendum 1</span>
            </div>
          )}
          {(baselineVersion === 'ALL' || baselineVersion === 'ADD_2') && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-cyan-400 rounded-full inline-block" />
              <span className="text-slate-300 font-medium">Addendum 2</span>
            </div>
          )}
          {(baselineVersion === 'ALL' || baselineVersion === 'ADD_3') && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-orange-400 rounded-full inline-block" />
              <span className="text-slate-300 font-medium">Addendum 3</span>
            </div>
          )}
          {(baselineVersion === 'ALL' || baselineVersion === 'ADD_4') && (
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-1.5 bg-blue-500 rounded-full inline-block" />
              <span className="text-blue-300 font-bold">Addendum 4 (Working Baseline)</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-2 bg-emerald-400 rounded-full inline-block shadow-sm shadow-emerald-400/50" />
            <span className="text-emerald-300 font-bold">Realisasi Aktual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-amber-400 rounded-full inline-block border-t-2 border-dashed border-amber-400" />
            <span className="text-amber-300 font-medium">Forecast (Proyeksi)</span>
          </div>
          {showIncrementalBars && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 bg-blue-500/40 border border-blue-400 rounded-xs inline-block" />
              <span>Batang Bobot Periodik</span>
            </div>
          )}
        </div>

        {/* Recharts Chart Rendering */}
        <div className="h-[430px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={processedData} margin={{ top: 15, right: 30, left: 0, bottom: 15 }}>
              <defs>
                <linearGradient id="colorActualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorAdd4Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="period"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                interval={granularity === 'daily' ? 2 : 0}
              />
              <YAxis
                stroke="#64748b"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.7)'
                }}
                formatter={(val: any, name: any) => [`${Number(val).toFixed(2)}%`, name]}
                labelStyle={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px' }}
              />

              {/* Incremental Bars (Optional) */}
              {showIncrementalBars && (
                <Bar
                  dataKey="incrementalActual"
                  name="Bobot Aktual Periodik"
                  fill="#10b981"
                  opacity={0.3}
                  barSize={12}
                />
              )}

              {/* BASELINES: Kontrak Awal (B0) */}
              {(baselineVersion === 'ALL' || baselineVersion === 'ORIGINAL') && (
                <Line
                  type="monotone"
                  dataKey="plannedOriginal"
                  name="Kontrak Awal (B0)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              )}

              {/* BASELINES: Addendum 1 */}
              {(baselineVersion === 'ALL' || baselineVersion === 'ADD_1') && (
                <Line
                  type="monotone"
                  dataKey="plannedAddendum1"
                  name="Addendum 1"
                  stroke="#a855f7"
                  strokeWidth={1.8}
                  strokeDasharray="5 3"
                  dot={false}
                />
              )}

              {/* BASELINES: Addendum 2 */}
              {(baselineVersion === 'ALL' || baselineVersion === 'ADD_2') && (
                <Line
                  type="monotone"
                  dataKey="plannedAddendum2"
                  name="Addendum 2"
                  stroke="#06b6d4"
                  strokeWidth={1.8}
                  strokeDasharray="6 3"
                  dot={false}
                />
              )}

              {/* BASELINES: Addendum 3 */}
              {(baselineVersion === 'ALL' || baselineVersion === 'ADD_3') && (
                <Line
                  type="monotone"
                  dataKey="plannedAddendum3"
                  name="Addendum 3"
                  stroke="#f97316"
                  strokeWidth={1.8}
                  strokeDasharray="4 2"
                  dot={false}
                />
              )}

              {/* BASELINES: Addendum 4 (Working Baseline) */}
              {(baselineVersion === 'ALL' || baselineVersion === 'ADD_4') && (
                chartType === 'area' ? (
                  <Area
                    type="monotone"
                    dataKey="plannedAddendum4"
                    name="Addendum 4 (Terkini)"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#colorAdd4Grad)"
                  />
                ) : (
                  <Line
                    type="monotone"
                    dataKey="plannedAddendum4"
                    name="Addendum 4 (Terkini)"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                )
              )}

              {/* REALISASI AKTUAL */}
              {chartType === 'area' ? (
                <Area
                  type="monotone"
                  dataKey="actual"
                  name="Realisasi Aktual"
                  stroke="#10b981"
                  strokeWidth={3.5}
                  fill="url(#colorActualGrad)"
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 7 }}
                />
              ) : (
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Realisasi Aktual"
                  stroke="#10b981"
                  strokeWidth={3.5}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 7 }}
                />
              )}

              {/* FORECAST TARGET */}
              <Line
                type="monotone"
                dataKey="forecast"
                name="Forecast Selesai"
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#f59e0b' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Contract Addendum Milestone Cards Comparison */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <span>Riwayat Komparasi Kontrak Awal &amp; Addendum 1, 2, 3, 4</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Rincian justifikasi teknis perpanjangan waktu kontrak (Time Extension) dan pergeseran milestone PHO
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Total Perpanjangan: <strong className="text-amber-300">+90 Hari Kalender</strong>
          </span>
        </div>

        {/* Milestone Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {addendumMilestones.map((m, idx) => {
            const isSelected = baselineVersion === m.version || (baselineVersion === 'ALL' && idx === 4);
            return (
              <div
                key={m.version}
                onClick={() => setBaselineVersion(m.version)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-blue-500 shadow-md shadow-blue-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: m.color }}
                  />
                  <span className="text-[10px] font-mono text-slate-400">
                    {m.approvalDate}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white mb-1 line-clamp-1">
                  {m.title}
                </h4>
                <div className="text-[10px] font-mono text-slate-400 mb-2 truncate">
                  No: {m.addendumNumber}
                </div>

                <div className="space-y-1 py-2 border-t border-slate-800 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target PHO:</span>
                    <span className="font-mono font-bold text-slate-200">{m.targetFinishDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Durasi:</span>
                    <span className="font-mono text-slate-300">{m.durationDays} hari</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kompensasi:</span>
                    <span className="font-mono font-bold text-purple-400">
                      {m.extensionDays === 0 ? '0 hari' : `+${m.extensionDays} hari`}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 mt-2 line-clamp-2 italic">
                  "{m.reason}"
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* S-Curve Evaluation Data Points Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-400" />
              <span>
                Tabel Titik Evaluasi Progres Kumulatif Kurva-S ({granularity.toUpperCase()})
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Data sheet numerik komprehensif membandingkan seluruh versi baseline terhadap realisasi aktual
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Menampilkan {processedData.length} baris titik potong</span>
          </div>
        </div>

        {/* Data Grid with sticky headers */}
        <div className="overflow-x-auto max-h-96 custom-scrollbar rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs border-collapse min-w-[950px]">
            <thead className="bg-slate-950 sticky top-0 z-10 text-[10px] text-slate-400 uppercase font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Periode</th>
                <th className="p-3">Tgl Cutoff</th>
                <th className="p-3 text-right text-sky-400">Kontrak Awal (%)</th>
                <th className="p-3 text-right text-purple-400">Addendum 1 (%)</th>
                <th className="p-3 text-right text-cyan-400">Addendum 2 (%)</th>
                <th className="p-3 text-right text-orange-400">Addendum 3 (%)</th>
                <th className="p-3 text-right text-blue-400">Addendum 4 (%)</th>
                <th className="p-3 text-right text-emerald-400">Realisasi Aktual (%)</th>
                <th className="p-3 text-right text-amber-400">Forecast (%)</th>
                <th className="p-3 text-right">Varians thd Add 4</th>
                <th className="p-3 text-right">SPI</th>
                <th className="p-3 text-center min-w-[75px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {processedData.map((row, idx) => {
                const isPast = row.actual !== undefined;
                const isEditing = editingPoint?.index === idx;

                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isEditing
                        ? 'bg-blue-950/40 ring-1 ring-blue-500/50'
                        : isPast
                        ? 'hover:bg-slate-800/40'
                        : 'bg-slate-950/30 hover:bg-slate-800/20'
                    }`}
                  >
                    <td className="p-3 font-bold text-white font-mono">{row.period}</td>
                    <td className="p-3 text-slate-400 font-mono text-[11px]">{row.date}</td>
                    <td className="p-3 text-right font-mono text-sky-300">
                      {row.plannedOriginal !== undefined ? `${row.plannedOriginal.toFixed(1)}%` : '-'}
                    </td>
                    <td className="p-3 text-right font-mono text-purple-300">
                      {row.plannedAddendum1 !== undefined ? `${row.plannedAddendum1.toFixed(1)}%` : '-'}
                    </td>
                    <td className="p-3 text-right font-mono text-cyan-300">
                      {row.plannedAddendum2 !== undefined ? `${row.plannedAddendum2.toFixed(1)}%` : '-'}
                    </td>
                    <td className="p-3 text-right font-mono text-orange-300">
                      {row.plannedAddendum3 !== undefined ? `${row.plannedAddendum3.toFixed(1)}%` : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-blue-300">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.1"
                          value={editingPoint.plannedAddendum4}
                          onChange={e =>
                            setEditingPoint(prev => (prev ? { ...prev, plannedAddendum4: e.target.value } : null))
                          }
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveInlineEdit();
                            if (e.key === 'Escape') handleCancelInlineEdit();
                          }}
                          className="w-20 text-right bg-slate-950 border border-blue-500 rounded px-1.5 py-1 text-blue-200 font-mono text-xs focus:ring-1 focus:ring-blue-400 focus:outline-none"
                        />
                      ) : row.plannedAddendum4 !== undefined ? (
                        `${row.plannedAddendum4.toFixed(1)}%`
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400 bg-emerald-950/10">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.1"
                          value={editingPoint.actual}
                          onChange={e =>
                            setEditingPoint(prev => (prev ? { ...prev, actual: e.target.value } : null))
                          }
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveInlineEdit();
                            if (e.key === 'Escape') handleCancelInlineEdit();
                          }}
                          className="w-20 text-right bg-slate-950 border border-emerald-500 rounded px-1.5 py-1 text-emerald-300 font-mono text-xs font-bold focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                          placeholder="Aktual"
                          autoFocus
                        />
                      ) : row.actual !== undefined ? (
                        `${row.actual.toFixed(1)}%`
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-amber-300">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.1"
                          value={editingPoint.forecast}
                          onChange={e =>
                            setEditingPoint(prev => (prev ? { ...prev, forecast: e.target.value } : null))
                          }
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveInlineEdit();
                            if (e.key === 'Escape') handleCancelInlineEdit();
                          }}
                          className="w-20 text-right bg-slate-950 border border-amber-500 rounded px-1.5 py-1 text-amber-300 font-mono text-xs focus:ring-1 focus:ring-amber-400 focus:outline-none"
                          placeholder="-"
                        />
                      ) : row.forecast !== undefined ? (
                        `${row.forecast.toFixed(1)}%`
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {row.variance !== undefined ? (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            row.variance >= 0
                              ? 'text-emerald-300 bg-emerald-500/20'
                              : 'text-rose-300 bg-rose-500/20'
                          }`}
                        >
                          {row.variance > 0 ? `+${row.variance.toFixed(1)}` : row.variance.toFixed(1)}%
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-[11px]">
                      {row.spi !== undefined ? (
                        <span
                          className={`font-bold ${
                            row.spi >= 1.0 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {row.spi.toFixed(3)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Action Column */}
                    <td className="p-3 text-center whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={handleSaveInlineEdit}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer transition-colors"
                            title="Simpan Perubahan Titik Kurva-S (Enter)"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelInlineEdit}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors"
                            title="Batal (Esc)"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartInlineEdit(idx, row)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Titik Evaluasi Ini Langsung di Tabel"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Progres Kurva S Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Update Progres Kurva-S
                  </h3>
                  <p className="text-xs text-slate-400">
                    Perbarui realisasi aktual atau tambahkan titik periode evaluasi baru
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Granularity Picker */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Granularitas Waktu
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['monthly', 'weekly', 'daily'] as const).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        const targetList = g === 'monthly' ? monthlyData : g === 'weekly' ? weeklyData : dailyData;
                        const lastPt = targetList.filter(p => p.actual !== undefined).pop() || targetList[0];
                        setUpdateForm(prev => ({
                          ...prev,
                          targetGranularity: g,
                          period: lastPt?.period || '',
                          date: lastPt?.date || '',
                          actual: lastPt?.actual !== undefined ? String(lastPt.actual) : '',
                          plannedAddendum4: lastPt?.plannedAddendum4 !== undefined ? String(lastPt.plannedAddendum4) : '',
                          forecast: lastPt?.forecast !== undefined ? String(lastPt.forecast) : ''
                        }));
                      }}
                      className={`py-2 px-3 rounded-xl font-bold capitalize transition-all cursor-pointer ${
                        updateForm.targetGranularity === g
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {g === 'monthly' ? 'Bulanan' : g === 'weekly' ? 'Mingguan' : 'Harian'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode: Existing Period vs New Period */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300 font-medium">Mode Input:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUpdateForm(prev => ({ ...prev, isNew: false }))}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !updateForm.isNew ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Pilih Periode Ada
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setUpdateForm(prev => ({
                        ...prev,
                        isNew: true,
                        period: '',
                        actual: '',
                        plannedAddendum4: '',
                        forecast: ''
                      }))
                    }
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      updateForm.isNew ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    + Periode Baru
                  </button>
                </div>
              </div>

              {/* If existing, select period dropdown */}
              {!updateForm.isNew ? (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Pilih Titik Periode Evaluasi
                  </label>
                  <select
                    value={updateForm.period}
                    onChange={e => {
                      const selPeriod = e.target.value;
                      const targetList =
                        updateForm.targetGranularity === 'monthly'
                          ? monthlyData
                          : updateForm.targetGranularity === 'weekly'
                          ? weeklyData
                          : dailyData;
                      const found = targetList.find(p => p.period === selPeriod);
                      if (found) {
                        setUpdateForm(prev => ({
                          ...prev,
                          period: found.period,
                          date: found.date,
                          actual: found.actual !== undefined ? String(found.actual) : '',
                          plannedAddendum4: found.plannedAddendum4 !== undefined ? String(found.plannedAddendum4) : '',
                          forecast: found.forecast !== undefined ? String(found.forecast) : ''
                        }));
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                  >
                    {(updateForm.targetGranularity === 'monthly'
                      ? monthlyData
                      : updateForm.targetGranularity === 'weekly'
                      ? weeklyData
                      : dailyData
                    ).map(p => (
                      <option key={p.period} value={p.period}>
                        {p.period} ({p.date}) — Rencana: {p.plannedAddendum4 ?? p.planned}% | Aktual:{' '}
                        {p.actual !== undefined ? `${p.actual}%` : 'Belum Ada'}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Nama Periode Baru
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Okt 25 / Mgg 46"
                      value={updateForm.period}
                      onChange={e => setUpdateForm(prev => ({ ...prev, period: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Tanggal Cutoff
                    </label>
                    <input
                      type="date"
                      value={updateForm.date}
                      onChange={e => setUpdateForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Numerical Progress Inputs */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                    <span>Realisasi Aktual (%)</span>
                    <span className="text-[10px] text-emerald-400 font-normal">Fisik Lapangan</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="e.g. 82.80"
                    value={updateForm.actual}
                    onChange={e => setUpdateForm(prev => ({ ...prev, actual: e.target.value }))}
                    className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-emerald-300 font-mono text-sm font-bold focus:border-emerald-400 focus:outline-none shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                    <span>Rencana Addendum 4 (%)</span>
                    <span className="text-[10px] text-blue-400 font-normal">Baseline Kerja</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="e.g. 91.50"
                    value={updateForm.plannedAddendum4}
                    onChange={e => setUpdateForm(prev => ({ ...prev, plannedAddendum4: e.target.value }))}
                    className="w-full bg-slate-950 border border-blue-500/50 rounded-xl px-3 py-2 text-blue-200 font-mono text-sm font-bold focus:border-blue-400 focus:outline-none shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                  <span>Proyeksi Forecast (%) (Opsional)</span>
                  <span className="text-[10px] text-amber-400 font-normal">Jika periode masa depan</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="e.g. 85.50"
                  value={updateForm.forecast}
                  onChange={e => setUpdateForm(prev => ({ ...prev, forecast: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono text-sm focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 text-blue-300 text-[11px] leading-relaxed">
                Perubahan nilai akan langsung tersimpan di penyimpanan lokal browser (localStorage), dan grafik Kurva S, varians kumulatif, serta SPI akan dihitung ulang secara real-time.
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 p-4 border-t border-slate-800 bg-slate-950/60">
              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveModalForm}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Simpan &amp; Terapkan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel / TSV Table Import Modal */}
      <SCurveExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onApplyData={handleApplyImportedData}
        currentGranularity={granularity}
      />
    </div>
  );
};
