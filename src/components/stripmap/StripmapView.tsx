import React, { useState, useMemo } from 'react';
import {
  Columns3,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  X,
  Filter,
  ArrowRight,
  MapPin,
  Calendar,
  Building2,
  Activity,
  AlertTriangle,
  Flame,
  ChevronRight,
  Coins,
  FileSpreadsheet,
  FileCheck2,
  FileText,
  Download,
  Info,
  Layers,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { PierMaster, PierStatus, PierBOQItem } from '../../types';
import { getPierBOQItems, computePierBOQMetrics } from '../../data/pierBOQData';

// Helper for short IDR currency
const formatShortIDR = (val: number): string => {
  if (Math.abs(val) >= 1_000_000_000) {
    return `Rp ${(val / 1_000_000_000).toFixed(2)} M`;
  }
  if (Math.abs(val) >= 1_000_000) {
    return `Rp ${(val / 1_000_000).toFixed(1)} Jt`;
  }
  return `Rp ${val.toLocaleString('id-ID')}`;
};

interface StripmapViewProps {
  selectedPierNumber?: string | null;
  onClearSelectedPier?: () => void;
}

export const StripmapView: React.FC<StripmapViewProps> = ({
  selectedPierNumber,
  onClearSelectedPier
}) => {
  const { piers, zones, constraints, issues, activities, exportToExcel } = useProject();

  const [activePier, setActivePier] = useState<PierMaster | null>(() => {
    if (selectedPierNumber) {
      return piers.find(p => p.pierNumber === selectedPierNumber) || null;
    }
    return null;
  });

  const [selectedDirection, setSelectedDirection] = useState<'ALL' | 'Selatan' | 'Utara'>('ALL');
  const [selectedSection, setSelectedSection] = useState<'ALL' | string>('ALL');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [stripmapDisplayMode, setStripmapDisplayMode] = useState<'BOQ_VOLUMES' | 'STANDARD'>('BOQ_VOLUMES');
  const [activeModalTab, setActiveModalTab] = useState<'BOQ_DATA' | 'TECH_ISSUES'>('BOQ_DATA');

  // Filtered piers
  const displayedPiers = useMemo(() => {
    return piers.filter(p => {
      const zoneObj = zones.find(z => z.zoneId === p.zoneId);
      if (selectedDirection !== 'ALL' && zoneObj?.direction !== selectedDirection) return false;
      if (selectedSection !== 'ALL' && p.section !== selectedSection) return false;
      if (selectedZone !== 'ALL' && p.zoneId !== selectedZone) return false;
      return true;
    });
  }, [piers, zones, selectedDirection, selectedSection, selectedZone]);

  // Pier status color mappings
  const getStatusConfig = (status: PierStatus) => {
    switch (status) {
      case 'Closed':
        return {
          bg: 'bg-emerald-950/40 hover:bg-emerald-900/60',
          border: 'border-emerald-500/80',
          text: 'text-emerald-300',
          badge: 'bg-emerald-500 text-white',
          label: 'Complete / Closed',
          indicator: 'bg-emerald-500'
        };
      case 'On Progress':
        return {
          bg: 'bg-amber-950/40 hover:bg-amber-900/60',
          border: 'border-amber-500/80',
          text: 'text-amber-300',
          badge: 'bg-amber-500 text-slate-950',
          label: 'On Progress',
          indicator: 'bg-amber-500'
        };
      case 'Open':
        return {
          bg: 'bg-rose-950/40 hover:bg-rose-900/60',
          border: 'border-rose-500/80',
          text: 'text-rose-300',
          badge: 'bg-rose-500 text-white',
          label: 'Open / Critical',
          indicator: 'bg-rose-500'
        };
      case 'N/A':
      default:
        return {
          bg: 'bg-slate-800/40 hover:bg-slate-800/80',
          border: 'border-slate-700',
          text: 'text-slate-400',
          badge: 'bg-slate-700 text-slate-300',
          label: 'N/A (Not Started)',
          indicator: 'bg-slate-600'
        };
    }
  };

  // Connected data for active pier modal
  const activePierConstraints = useMemo(() => {
    if (!activePier) return [];
    return constraints.filter(c => c.pierNumber === activePier.pierNumber);
  }, [activePier, constraints]);

  const activePierIssues = useMemo(() => {
    if (!activePier) return [];
    return issues.filter(i => i.pierNumber === activePier.pierNumber);
  }, [activePier, issues]);

  // Active pier BOQ calculations
  const activePierBOQMetrics = useMemo(() => {
    if (!activePier) return null;
    return computePierBOQMetrics(activePier);
  }, [activePier]);

  // Export single pier BOQ to Excel
  const handleExportSinglePierBOQ = () => {
    if (!activePier || !activePierBOQMetrics) return;

    const rows = activePierBOQMetrics.items.map(item => ({
      'Pier Number': activePier.pierNumber,
      'No. Mata Pembayaran BOQ': item.itemNumber,
      'Uraian Pekerjaan Sesuai BOQ': item.itemDescription,
      'Divisi BOQ': item.divisionId,
      Satuan: item.unit,
      'Harga Satuan (Rp)': item.unitPrice,
      'Volume Rencana (Kontrak Add. 4)': item.volumePlan,
      'Nilai Rencana (Rp)': item.volumePlan * item.unitPrice,
      'Volume Shop Drawing Disetujui': item.volumeShopDrawing,
      'Nilai Shop Drawing (Rp)': item.volumeShopDrawing * item.unitPrice,
      'Volume Actual Tertagih (MC)': item.volumeActualBilled,
      'Nilai Actual Tertagih (Rp)': item.volumeActualBilled * item.unitPrice,
      'Sisa Volume Belum Tertagih': Math.max(0, item.volumeShopDrawing - item.volumeActualBilled),
      'Sisa Nilai Belum Tertagih (Rp)': Math.max(0, (item.volumeShopDrawing - item.volumeActualBilled) * item.unitPrice),
      '% Realisasi Tertagih': item.volumeShopDrawing > 0 ? ((item.volumeActualBilled / item.volumeShopDrawing) * 100).toFixed(2) : '0.00',
      'Status Verifikasi': item.verificationStatus,
      'No. Shop Drawing': item.shopDrawingNo || '-',
      'Batch Monthly Certificate (MC)': item.mcBatchNo || '-'
    }));

    exportToExcel(
      `BOQ_Volume_Pier_${activePier.pierNumber}_HBR2`,
      `BOQ Pier ${activePier.pierNumber}`,
      rows
    );
  };

  return (
    <div id="stripmap-monitoring-view" className="space-y-6 pb-12">
      {/* Top Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
              <Columns3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Stripmap Pier Monitoring</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Item BOQ &amp; Volume Rencana / SD / Tertagih
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Visualisasi terpadu setiap elevated pier dengan informasi volume rencana (kontrak), volume shop drawing (disetujui), dan volume actual tertagih (MC).
              </p>
            </div>
          </div>
        </div>

        {/* Filters & Display Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Display Mode Toggle */}
          <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => setStripmapDisplayMode('BOQ_VOLUMES')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                stripmapDisplayMode === 'BOQ_VOLUMES'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Volume &amp; BOQ</span>
            </button>
            <button
              onClick={() => setStripmapDisplayMode('STANDARD')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                stripmapDisplayMode === 'STANDARD'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Status &amp; Trase</span>
            </button>
          </div>

          {/* Direction Filter */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <span className="text-slate-400 px-1 text-[11px]">Jalur:</span>
            {(['ALL', 'Selatan', 'Utara'] as const).map(dir => (
              <button
                key={dir}
                onClick={() => setSelectedDirection(dir)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedDirection === dir
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {dir === 'ALL' ? 'Semua' : dir}
              </button>
            ))}
          </div>

          <select
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 focus:outline-hidden text-xs"
          >
            <option value="ALL">Semua Sheet Trase</option>
            <option value="Main Road Awal">Main Road Awal</option>
            <option value="Sisi Selatan">Sisi Selatan</option>
            <option value="Sisi Utara">Sisi Utara</option>
            <option value="Main Road Akhir">Main Road Akhir</option>
            <option value="Ramp">Ramp</option>
            <option value="Frontage">Frontage</option>
          </select>

          <select
            value={selectedZone}
            onChange={e => setSelectedZone(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 focus:outline-hidden text-xs max-w-[200px]"
          >
            <option value="ALL">Semua Zona</option>
            {zones.map(z => (
              <option key={z.zoneId} value={z.zoneId}>
                {z.zoneName} ({z.direction})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend & BOQ Explanatory Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
            Legenda Status:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Closed (100% Tertagih MC)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span>On Progress (Opname / BAP)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span>Open (Kendala / Kritis)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-600" />
            <span>Belum Dimulai</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-blue-400 font-mono flex items-center gap-1">
            <Coins className="w-3.5 h-3.5" />
            <span>Format: Rencana &rarr; Shop Drawing &rarr; Actual Tertagih</span>
          </span>
          <span className="text-slate-400">
            Total: <strong className="text-white">{displayedPiers.length}</strong> Pier
          </span>
        </div>
      </div>

      {/* Sequential Stripmap Grid / Track View */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md overflow-x-auto custom-scrollbar">
        <div className="min-w-[900px] space-y-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Rangkaian Trase Pier &amp; Evaluasi BOQ Lapangan</span>
              <ArrowRight className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-[11px] text-slate-400 normal-case">
              Klik sembarang kartu pier untuk membuka lembar detail komparasi volume rencana vs shop drawing vs actual tertagih
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
            {displayedPiers.map(pier => {
              const cfg = getStatusConfig(pier.status);
              const hasConstraint = constraints.some(c => c.pierNumber === pier.pierNumber && c.status !== 'Closed');
              const hasIssue = issues.some(i => i.pierNumber === pier.pierNumber && i.status !== 'Closed');
              const metrics = computePierBOQMetrics(pier);

              return (
                <button
                  key={pier.pierId}
                  id={`stripmap-pier-${pier.pierNumber}`}
                  onClick={() => {
                    setActivePier(pier);
                    setActiveModalTab('BOQ_DATA');
                  }}
                  className={`relative p-3.5 rounded-2xl border-2 text-left transition-all duration-150 transform hover:-translate-y-1 hover:shadow-xl focus:outline-hidden cursor-pointer flex flex-col justify-between ${cfg.bg} ${cfg.border} ${
                    activePier?.pierId === pier.pierId ? 'ring-2 ring-blue-400 scale-102 shadow-blue-500/20' : ''
                  }`}
                >
                  <div>
                    {/* Top indicator & contractor */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-900/90 text-slate-200 border border-slate-700/80">
                        {pier.contractorId}
                      </span>
                      <div className="flex items-center gap-1">
                        {hasConstraint && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" title="Ada kendala aktif" />
                        )}
                        {hasIssue && <Flame className="w-3.5 h-3.5 text-rose-400" title="Ada masalah aktif" />}
                        <span className={`w-2.5 h-2.5 rounded-full ${cfg.indicator}`} />
                      </div>
                    </div>

                    {/* Pier Number */}
                    <div className="flex items-baseline justify-between gap-1">
                      <div className="text-base font-black text-white tracking-tight font-mono">
                        {pier.pierNumber}
                      </div>
                      {pier.tipeSuperstruktur && (
                        <span className="text-[9px] font-semibold text-slate-300 bg-slate-800/90 px-1 py-0.5 rounded truncate max-w-[85px]" title={pier.tipeSuperstruktur}>
                          {pier.tipeSuperstruktur}
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="my-2">
                      <div className="flex justify-between text-[10px] text-slate-300 font-mono mb-1">
                        <span>Fisik:</span>
                        <span className="font-bold">{pier.overallProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pier.status === 'Closed'
                              ? 'bg-emerald-400'
                              : pier.status === 'Open'
                              ? 'bg-rose-500'
                              : 'bg-amber-400'
                          }`}
                          style={{ width: `${pier.overallProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* BOQ Metrics Box (Always visible or in BOQ Mode) */}
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1 font-mono text-[10px] my-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Rencana:</span>
                        <strong className="text-slate-300">{formatShortIDR(metrics.totalPlanValue)}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Shop Dwg:</span>
                        <strong className="text-blue-300">{formatShortIDR(metrics.totalSDValue)}</strong>
                      </div>
                      <div className="flex items-center justify-between text-emerald-400 border-t border-slate-800/80 pt-1 font-bold">
                        <span>Tertagih (MC):</span>
                        <span>{formatShortIDR(metrics.totalBilledValue)}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 text-right">
                        ({metrics.billedPercentage.toFixed(1)}% bersertifikat)
                      </div>
                    </div>

                    {/* BOQ Item Pills */}
                    <div className="flex flex-wrap gap-1 mt-1 text-[9px] font-mono">
                      <span className="px-1 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">
                        7.1 BP
                      </span>
                      <span className="px-1 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">
                        7.2 PC
                      </span>
                      <span className="px-1 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">
                        7.3 BAR
                      </span>
                      {pier.pierNumber.includes('56') && (
                        <span className="px-1 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 font-bold">
                          7.4 SBG
                        </span>
                      )}
                      {(pier.pierNumber === 'P.20.S' || pier.pierNumber === 'P20S') && (
                        <span className="px-1 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40 font-bold">
                          9.1 PGN
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow connector between piers */}
                  <div className="mt-2.5 pt-1.5 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Zona {pier.zoneId}</span>
                    <span className="text-blue-400 font-bold flex items-center gap-0.5">
                      <span>Rincian BOQ</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* DETAILED PIER MODAL WITH FULL BOQ VOLUME RECAPITULATION */}
      {activePier && activePierBOQMetrics && (
        <div
          id="pier-detail-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white font-mono">
                      Pier {activePier.pierNumber}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        getStatusConfig(activePier.status).badge
                      }`}
                    >
                      {activePier.status} ({activePier.overallProgress}%)
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-800 text-blue-400 border border-slate-700">
                      {activePier.contractorId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activePier.ruas ? `${activePier.ruas} • ` : ''}Zona: {activePier.zoneId} • {activePier.tipePier || 'Single Pier'} • Superstruktur: {activePier.tipeSuperstruktur || 'Box Girder'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportSinglePierBOQ}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  title="Unduh Lembar Rekapitulasi BOQ Pier ke Excel"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Ekspor Excel</span>
                </button>

                <button
                  onClick={() => {
                    setActivePier(null);
                    if (onClearSelectedPier) onClearSelectedPier();
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="px-5 pt-3 pb-0 bg-slate-950/40 border-b border-slate-800 flex gap-4 text-xs font-bold">
              <button
                onClick={() => setActiveModalTab('BOQ_DATA')}
                className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                  activeModalTab === 'BOQ_DATA'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>Informasi Volume Rencana, Shop Drawing &amp; Actual Tertagih (BOQ)</span>
              </button>

              <button
                onClick={() => setActiveModalTab('TECH_ISSUES')}
                className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                  activeModalTab === 'TECH_ISSUES'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Teknis, Constraint &amp; Issue Lapangan</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs custom-scrollbar">
              {activeModalTab === 'BOQ_DATA' && (
                <div className="space-y-4">
                  {/* Financial Scorecards for this Pier */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Volume Rencana */}
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-semibold">Nilai Rencana (B0/Add)</span>
                        <Coins className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div className="text-lg font-black text-white font-mono">
                        {formatShortIDR(activePierBOQMetrics.totalPlanValue)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Sesuai Master BOQ Addendum 4
                      </div>
                    </div>

                    {/* Volume Shop Drawing */}
                    <div className="p-3.5 rounded-2xl bg-blue-950/25 border border-blue-500/30">
                      <div className="flex items-center justify-between text-[11px] text-blue-300 mb-1">
                        <span className="font-bold">Nilai Shop Drawing</span>
                        <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <div className="text-lg font-black text-blue-400 font-mono">
                        {formatShortIDR(activePierBOQMetrics.totalSDValue)}
                      </div>
                      <div className="text-[10px] text-blue-300/80 mt-1">
                        Disetujui Konsultan Supervisi
                      </div>
                    </div>

                    {/* Actual Tertagih */}
                    <div className="p-3.5 rounded-2xl bg-emerald-950/25 border border-emerald-500/30">
                      <div className="flex items-center justify-between text-[11px] text-emerald-300 mb-1">
                        <span className="font-bold">Actual Tertagih (MC)</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="text-lg font-black text-emerald-400 font-mono">
                        {formatShortIDR(activePierBOQMetrics.totalBilledValue)}
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-1 font-bold">
                        {activePierBOQMetrics.billedPercentage.toFixed(1)}% telah disertifikasi
                      </div>
                    </div>

                    {/* Sisa Tertagih */}
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-semibold">Sisa Nilai Pekerjaan</span>
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div className="text-lg font-black text-slate-200 font-mono">
                        {formatShortIDR(activePierBOQMetrics.remainingValue)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {(100 - activePierBOQMetrics.billedPercentage).toFixed(1)}% belum ditagihkan
                      </div>
                    </div>
                  </div>

                  {/* Complete BOQ Items Table for this Pier */}
                  <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
                    <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                      <div className="flex items-center gap-2 font-bold text-white text-xs">
                        <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                        <span>Rincian Item BOQ, Volume Rencana, Shop Drawing &amp; Actual Tertagih</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {activePierBOQMetrics.itemCount} Item Pekerjaan
                      </span>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                            <th className="py-2.5 px-3 min-w-[70px]">No. BOQ</th>
                            <th className="py-2.5 px-3 min-w-[200px]">Uraian Item Pekerjaan Sesuai BOQ</th>
                            <th className="py-2.5 px-2 text-center">Sat.</th>
                            <th className="py-2.5 px-3 text-right">Harga Satuan (Rp)</th>
                            <th className="py-2.5 px-2.5 text-right bg-slate-800/40 text-slate-300">Vol. Rencana</th>
                            <th className="py-2.5 px-2.5 text-right bg-blue-950/40 text-blue-300 font-bold">Vol. Shop Dwg</th>
                            <th className="py-2.5 px-2.5 text-right bg-emerald-950/40 text-emerald-300 font-bold">Vol. Tertagih</th>
                            <th className="py-2.5 px-3 text-right bg-emerald-950/40 text-emerald-400 font-bold">Nilai Tertagih (Rp)</th>
                            <th className="py-2.5 px-2 text-center min-w-[60px]">%</th>
                            <th className="py-2.5 px-3 text-center">Status Verifikasi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 font-mono text-slate-300">
                          {activePierBOQMetrics.items.map(item => {
                            const pct = item.volumeShopDrawing > 0 ? (item.volumeActualBilled / item.volumeShopDrawing) * 100 : 0;
                            const billedAmount = item.volumeActualBilled * item.unitPrice;

                            return (
                              <tr key={item.itemNumber} className="hover:bg-slate-800/50 transition-colors">
                                <td className="py-2.5 px-3 font-bold text-blue-400 whitespace-nowrap">
                                  {item.itemNumber}
                                </td>
                                <td className="py-2.5 px-3 font-sans">
                                  <div className="font-semibold text-white leading-tight">
                                    {item.itemDescription}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    {item.shopDrawingNo} • {item.mcBatchNo}
                                  </div>
                                </td>
                                <td className="py-2.5 px-2 text-center text-slate-400 font-sans">
                                  {item.unit}
                                </td>
                                <td className="py-2.5 px-3 text-right text-slate-300">
                                  {item.unitPrice.toLocaleString('id-ID')}
                                </td>
                                <td className="py-2.5 px-2.5 text-right bg-slate-800/20 text-slate-400 font-bold">
                                  {item.volumePlan.toLocaleString('id-ID')}
                                </td>
                                <td className="py-2.5 px-2.5 text-right bg-blue-950/20 text-blue-300 font-bold">
                                  {item.volumeShopDrawing.toLocaleString('id-ID')}
                                </td>
                                <td className="py-2.5 px-2.5 text-right bg-emerald-950/20 text-emerald-300 font-bold">
                                  {item.volumeActualBilled.toLocaleString('id-ID')}
                                </td>
                                <td className="py-2.5 px-3 text-right bg-emerald-950/20 text-emerald-400 font-black">
                                  {formatShortIDR(billedAmount)}
                                </td>
                                <td className="py-2.5 px-2 text-center">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      pct >= 100
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : pct > 0
                                        ? 'bg-amber-500/20 text-amber-300'
                                        : 'bg-slate-800 text-slate-500'
                                    }`}
                                  >
                                    {pct.toFixed(0)}%
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-sans ${
                                      item.verificationStatus === 'Terverifikasi MC'
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : item.verificationStatus === 'Pengajuan BAP'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        : item.verificationStatus === 'Dalam Pengerjaan'
                                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {item.verificationStatus}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-900 border-t-2 border-slate-700 font-mono font-bold text-xs">
                            <td colSpan={3} className="py-3 px-3 text-white font-sans uppercase">
                              TOTAL BOQ PIER {activePier.pierNumber}:
                            </td>
                            <td className="py-3 px-3 text-right text-slate-400">-</td>
                            <td className="py-3 px-2.5 text-right text-slate-300">
                              {formatShortIDR(activePierBOQMetrics.totalPlanValue)}
                            </td>
                            <td className="py-3 px-2.5 text-right text-blue-300 font-black">
                              {formatShortIDR(activePierBOQMetrics.totalSDValue)}
                            </td>
                            <td className="py-3 px-2.5 text-right text-emerald-300 font-black">-</td>
                            <td className="py-3 px-3 text-right text-emerald-400 font-black">
                              {formatShortIDR(activePierBOQMetrics.totalBilledValue)}
                            </td>
                            <td className="py-3 px-2 text-center text-emerald-400">
                              {activePierBOQMetrics.billedPercentage.toFixed(1)}%
                            </td>
                            <td className="py-3 px-3 text-center text-slate-400 font-sans text-[10px]">
                              {activePierBOQMetrics.billedPercentage >= 100 ? 'LUNAS (100% MC)' : 'PROSES PENAGIHAN'}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === 'TECH_ISSUES' && (
                <div className="space-y-4">
                  {/* Register Metadata Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">Ruas Jalan</span>
                      <p className="font-semibold text-white truncate mt-0.5">{activePier.ruas || '-'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">Kode Area Trase</span>
                      <p className="font-semibold font-mono text-blue-300 truncate mt-0.5">{activePier.kodeArea || '-'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">Tipe Pier</span>
                      <p className="font-semibold text-amber-300 truncate mt-0.5">{activePier.tipePier || 'Single Pier'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">Tipe Superstruktur</span>
                      <p className="font-semibold text-emerald-300 truncate mt-0.5">{activePier.tipeSuperstruktur || 'Box Girder'}</p>
                    </div>
                  </div>

                  {/* Main Activity */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                      Aktivitas Utama Saat Ini:
                    </span>
                    <p className="text-sm font-semibold text-white mt-1">
                      {activePier.mainActivity || 'Pekerjaan struktur kolom dan pier head'}
                    </p>
                  </div>

                  {/* Coordinates & Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px]">Target Selesai Rencana:</span>
                      <div className="font-bold text-slate-200 mt-0.5">{activePier.plannedFinish}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">Realisasi Selesai Lapangan:</span>
                      <div className="font-bold text-emerald-400 mt-0.5">{activePier.actualFinish || 'Dalam Pelaksanaan'}</div>
                    </div>
                  </div>

                  {/* Constraints at this Pier */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Constraint Terkait ({activePierConstraints.length})</span>
                    </h4>
                    {activePierConstraints.length === 0 ? (
                      <p className="text-slate-400 italic p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        Tidak ada kendala aktif pada Pier {activePier.pierNumber}.
                      </p>
                    ) : (
                      activePierConstraints.map(c => (
                        <div key={c.constraintId} className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-1">
                          <div className="flex items-center justify-between font-bold text-amber-300">
                            <span>[{c.category}] {c.constraintId}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40">
                              {c.status}
                            </span>
                          </div>
                          <p className="text-slate-300">{c.description}</p>
                          <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-amber-900/30 font-mono">
                            <span>PIC: {c.pic}</span>
                            <span>Target Resolusi: {c.targetResolution}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Issues at this Pier */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-rose-400" />
                      <span>Issue Teknis Terkait ({activePierIssues.length})</span>
                    </h4>
                    {activePierIssues.length === 0 ? (
                      <p className="text-slate-400 italic p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        Tidak ada issue teknis kritis tercatat pada Pier {activePier.pierNumber}.
                      </p>
                    ) : (
                      activePierIssues.map(iss => (
                        <div key={iss.issueId} className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-800/40 space-y-1">
                          <div className="flex items-center justify-between font-bold text-rose-300">
                            <span>{iss.issueId}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/40">
                              {iss.status}
                            </span>
                          </div>
                          <p className="text-slate-300">{iss.issue}</p>
                          <div className="text-[10px] text-slate-400 pt-1 border-t border-rose-900/30">
                            Tindakan: <strong className="text-slate-200">{iss.action}</strong>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="text-[11px] text-slate-400 font-mono">
                Terverifikasi oleh Tim Project Control &amp; Supervisi CMNP
              </div>
              <button
                onClick={() => {
                  setActivePier(null);
                  if (onClearSelectedPier) onClearSelectedPier();
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
