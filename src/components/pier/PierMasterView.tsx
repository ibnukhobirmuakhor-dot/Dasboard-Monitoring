import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Download,
  Layers,
  Building2,
  RefreshCw,
  Calendar,
  Coins,
  Check,
  Minus,
  Eye,
  BarChart3,
  Hammer,
  Clock,
  ChevronRight,
  FileSpreadsheet,
  AlertTriangle,
  Boxes,
  HelpCircle,
  X
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { PierMaster, PierStatus, ContractorId, PierSection, MajorItemStatus } from '../../types';
import {
  getPierMajorItems,
  getPierWBSDetails,
  getPierFinancialProgress,
  computeMajorItemsSummary,
  MajorItemSummaryItem
} from '../../data/pierMajorItems';

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

type TableViewMode = 'FULL' | 'MAJOR_ITEMS' | 'WBS_SCHEDULE' | 'PROGRESS_BILLED' | 'COMPACT';

export const PierMasterView: React.FC = () => {
  const { piers, zones, addPier, updatePier, deletePier, canEdit, exportToExcel, resetDatabase } = useProject();

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterSection, setFilterSection] = useState<'ALL' | PierSection>('ALL');
  const [filterZone, setFilterZone] = useState('ALL');
  const [filterContractor, setFilterContractor] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterMajorItem, setFilterMajorItem] = useState<'ALL' | string>('ALL');

  // View Mode Preset
  const [viewMode, setViewMode] = useState<TableViewMode>('FULL');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingPier, setEditingPier] = useState<PierMaster | null>(null);
  const [selectedPierDetail, setSelectedPierDetail] = useState<PierMaster | null>(null);

  // Form Data for Add/Edit
  const [formData, setFormData] = useState<PierMaster>({
    pierId: '',
    pierNumber: '',
    ruas: 'Main Road Selatan',
    zoneId: 'Zona 1S',
    section: 'Sisi Selatan',
    kodeArea: '',
    tipePier: 'Single Pier',
    tipeSuperstruktur: 'Single Box Girder',
    lingkupKontraktor: 'PT Wijaya Karya',
    contractorId: 'WIKA',
    latitude: -6.1265,
    longitude: 106.8724,
    status: 'On Progress',
    overallProgress: 0,
    plannedFinish: '2026-06-30',
    planStart: '2025-01-10',
    actualStart: '2025-01-15',
    actualFinish: '',
    wbsCode: '1.2.2',
    mainActivity: 'Pekerjaan Struktur Pier'
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Section counts
  const sectionCounts = useMemo(() => ({
    ALL: piers.length,
    'Main Road Awal': piers.filter(p => p.section === 'Main Road Awal').length,
    'Sisi Selatan': piers.filter(p => p.section === 'Sisi Selatan').length,
    'Sisi Utara': piers.filter(p => p.section === 'Sisi Utara').length,
    'Main Road Akhir': piers.filter(p => p.section === 'Main Road Akhir').length,
    Ramp: piers.filter(p => p.section === 'Ramp').length,
    Frontage: piers.filter(p => p.section === 'Frontage').length,
  }), [piers]);

  // Major Items Summary across all points (titik)
  const majorItemsSummary = useMemo(() => {
    return computeMajorItemsSummary(piers);
  }, [piers]);

  // Filtered piers
  const filteredPiers = useMemo(() => {
    return piers.filter(p => {
      if (filterSection !== 'ALL' && p.section !== filterSection) return false;
      if (filterZone !== 'ALL' && p.zoneId !== filterZone) return false;
      if (filterContractor !== 'ALL' && p.contractorId !== filterContractor) return false;
      if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;

      // Filter by Major Item condition
      if (filterMajorItem !== 'ALL') {
        const major = getPierMajorItems(p);
        const item = (major as any)[filterMajorItem];
        if (!item || item.status === 'N/A' || item.status === 'Selesai') {
          return false; // only show those that are still in progress or not started
        }
      }

      if (search) {
        const q = search.toLowerCase();
        const matchPier = p.pierNumber.toLowerCase().includes(q);
        const matchKode = (p.kodeArea || '').toLowerCase().includes(q);
        const matchRuas = (p.ruas || '').toLowerCase().includes(q);
        const matchLingkup = (p.lingkupKontraktor || '').toLowerCase().includes(q);
        const matchTipe =
          (p.tipeSuperstruktur || '').toLowerCase().includes(q) ||
          (p.tipePier || '').toLowerCase().includes(q);
        if (!matchPier && !matchKode && !matchRuas && !matchLingkup && !matchTipe) return false;
      }
      return true;
    });
  }, [piers, filterSection, filterZone, filterContractor, filterStatus, filterMajorItem, search]);

  // Global Financial & Volume aggregates for filtered piers
  const financialTotals = useMemo(() => {
    let planVal = 0;
    let sdVal = 0;
    let progVal = 0;
    let billVal = 0;

    filteredPiers.forEach(p => {
      const fin = getPierFinancialProgress(p);
      planVal += fin.totalPlanValue;
      sdVal += fin.totalSDValue;
      progVal += fin.totalProgressValue;
      billVal += fin.totalBilledValue;
    });

    const unbilledVal = Math.max(0, progVal - billVal);
    const billPct = sdVal > 0 ? (billVal / sdVal) * 100 : 0;
    const progPct = sdVal > 0 ? (progVal / sdVal) * 100 : 0;

    return {
      planVal,
      sdVal,
      progVal,
      billVal,
      unbilledVal,
      billPct,
      progPct
    };
  }, [filteredPiers]);

  // Handle Add/Edit modal
  const openAddModal = () => {
    setEditingPier(null);
    setFormData({
      pierId: `P_${Date.now().toString().slice(-4)}`,
      pierNumber: '',
      ruas: 'Main Road Selatan',
      zoneId: 'Zona 1S',
      section: 'Sisi Selatan',
      kodeArea: '',
      tipePier: 'Single Pier',
      tipeSuperstruktur: 'Single Box Girder',
      lingkupKontraktor: 'PT Wijaya Karya',
      contractorId: 'WIKA',
      latitude: -6.1275,
      longitude: 106.8745,
      status: 'On Progress',
      overallProgress: 0,
      plannedFinish: '2026-06-30',
      planStart: '2025-01-10',
      actualStart: '',
      actualFinish: '',
      wbsCode: '1.2.2',
      mainActivity: 'Pekerjaan Struktur Pier'
    });
    setErrorMessage(null);
    setShowModal(true);
  };

  const openEditModal = (p: PierMaster) => {
    setEditingPier(p);
    const wbs = getPierWBSDetails(p);
    setFormData({
      ...p,
      planStart: p.planStart || wbs.planStart,
      actualStart: p.actualStart || (wbs.actualStart !== '-' ? wbs.actualStart : ''),
      wbsCode: p.wbsCode || wbs.wbsCode
    });
    setErrorMessage(null);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.pierNumber.trim()) {
      setErrorMessage('Nomor Pier (misal: P.1, P.16.S, P.21.N, RAO.1) wajib diisi.');
      return;
    }

    if (editingPier) {
      const res = updatePier(formData);
      if (!res.success) {
        setErrorMessage(res.error || 'Gagal memperbarui Pier.');
        return;
      }
    } else {
      const res = addPier(formData);
      if (!res.success) {
        setErrorMessage(res.error || 'Gagal menambahkan Pier.');
        return;
      }
    }

    setShowModal(false);
  };

  // Full Export to Excel matching the exact comprehensive Master Pier Table format
  const handleExportFull = () => {
    const data = filteredPiers.map(p => {
      const major = getPierMajorItems(p);
      const wbs = getPierWBSDetails(p);
      const fin = getPierFinancialProgress(p);

      return {
        'No. Pier (Titik)': p.pierNumber,
        'Ruas Jalan': p.ruas || '-',
        'Zona Konstruksi': p.zoneId,
        'STA / Kode Area': p.kodeArea || '-',
        'Tipe Pier': p.tipePier || '-',
        'Tipe Superstruktur': p.tipeSuperstruktur || '-',
        'Lingkup Kontraktor': p.lingkupKontraktor || p.contractorId,
        'Section Trase': p.section || '-',

        // Major Items (Dihitung per Titik)
        'Borepile (Titik)': `${major.borepile.status} (${major.borepile.note || major.borepile.percent + '%'})`,
        'Pilecap (Titik)': `${major.pilecap.status} (${major.pilecap.percent}%)`,
        'Pier Kolom (Titik)': `${major.pierKolom.status} (${major.pierKolom.note || major.pierKolom.percent + '%'})`,
        'Pierhead (Titik)': `${major.pierhead.status} (${major.pierhead.percent}%)`,
        'LRB Bearing (Titik)': `${major.lrb.status} (${major.lrb.note || major.lrb.percent + '%'})`,
        'Produksi Box Girder': `${major.prodBoxGirder.status} (${major.prodBoxGirder.percent}%)`,
        'Erection Box Girder': `${major.erectionBoxGirder.status} (${major.erectionBoxGirder.percent}%)`,
        'Steel Box Girder': `${major.steelBoxGirder.status} (${major.steelBoxGirder.percent}%)`,
        'PCU/PCI Girder': `${major.pcuPci.status} (${major.pcuPci.percent}%)`,

        // Jadwal Teknis WBS
        'WBS Code': wbs.wbsCode,
        'Rencana Mulai (Plan)': wbs.planStart,
        'Rencana Selesai (Plan)': wbs.planFinish,
        'Aktual Mulai (Actual)': wbs.actualStart,
        'Aktual Selesai (Actual)': wbs.actualFinish,
        'Status Deviasi Jadwal': wbs.scheduleStatus,

        // Terprogress dan Tertagih (BOQ & Finansial)
        'Nilai Kontrak Rencana (Rp)': fin.totalPlanValue,
        'Nilai Shop Drawing (Rp)': fin.totalSDValue,
        'Nilai Terprogress Fisik (Rp)': fin.totalProgressValue,
        'Nilai Tertagih MC (Rp)': fin.totalBilledValue,
        'Sisa Belum Tertagih / BAP (Rp)': fin.unbilledValue,
        '% Terprogress Fisik': `${fin.progressPercentage}%`,
        '% Realisasi Tertagih': `${fin.billedPercentage.toFixed(2)}%`,

        // Status Umum
        'Overall Progress (%)': p.overallProgress,
        Status: p.status,
        'Aktivitas Utama': p.mainActivity || '-'
      };
    });

    exportToExcel(`Master_Pier_Format_Lengkap_HBR2`, 'Master Register Pier', data);
  };

  // Major Item Badge Component
  const renderMajorBadge = (item: { status: MajorItemStatus; percent: number; note?: string }) => {
    if (item.status === 'N/A') {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">
          <Minus className="w-2.5 h-2.5" />
          <span>N/A</span>
        </span>
      );
    }
    if (item.status === 'Selesai') {
      return (
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
          title={item.note || 'Selesai 100%'}
        >
          <Check className="w-2.5 h-2.5 text-emerald-400" />
          <span>100%</span>
        </span>
      );
    }
    if (item.status === 'Progress') {
      return (
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono"
          title={item.note || `${item.percent}%`}
        >
          <Clock className="w-2.5 h-2.5 text-amber-400" />
          <span>{item.percent}%</span>
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-800/80 text-slate-400 border border-slate-700 font-mono"
        title="Belum Mulai (0%)"
      >
        0%
      </span>
    );
  };

  return (
    <div id="master-pier-table-container" className="space-y-5 pb-16">
      {/* 1. MAIN HEADER & ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Database Format Master Pier Tol Harbour Road II</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {piers.length} Titik Pier
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Format tabel master lengkap: Identitas Trase, Progress 9 Major Items dihitung per titik, Jadwal Teknis WBS, serta Volume Terprogress dan Tertagih.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (window.confirm('Reset ulang database master pier ke format awal spreadsheet HBR II?')) {
                resetDatabase();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            title="Reset ulang ke data register spreadsheet"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Register</span>
          </button>

          <button
            onClick={handleExportFull}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm transition-colors"
            title="Export seluruh tabel master dengan format lengkap ke Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel Format Lengkap ({filteredPiers.length})</span>
          </button>

          {canEdit && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pier</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. REKAPITULASI MAJOR ITEM BERDASARKAN TITIK (PROGRESS MAJOR ITEM PER TITIK) */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Rekapitulasi Capaian Major Item (Dihitung Berdasarkan Titik Pier)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Total Basis: <strong className="text-white font-mono">{piers.length}</strong> Titik elevated
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-2.5">
          {majorItemsSummary.map(item => {
            const isFilterActive = filterMajorItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setFilterMajorItem(isFilterActive ? 'ALL' : item.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isFilterActive
                    ? 'bg-blue-600/30 border-blue-400 text-white shadow-md'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/70 text-slate-300'
                }`}
                title={`Klik untuk filter titik pier yang ${item.name} belum selesai`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-mono font-bold text-blue-300">{item.code}</span>
                  <span className="text-[10px] font-bold font-mono text-emerald-400">
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="text-[11px] font-bold text-white truncate" title={item.name}>
                  {item.name}
                </div>
                <div className="flex items-baseline justify-between mt-1 text-[10px] text-slate-400 font-mono">
                  <span>
                    <strong className="text-emerald-300">{item.completedPoints}</strong>/{item.totalPoints} titik
                  </span>
                  {item.inProgressPoints > 0 && (
                    <span className="text-amber-400">+{item.inProgressPoints} prog</span>
                  )}
                </div>
                <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {filterMajorItem !== 'ALL' && (
          <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-blue-950/40 border border-blue-800/50 text-blue-300">
            <span>
              Sedang memfilter: Menampilkan titik pier yang <strong>Major Item {filterMajorItem.toUpperCase()}</strong> masih Dalam Pengerjaan atau Belum Selesai.
            </span>
            <button
              onClick={() => setFilterMajorItem('ALL')}
              className="font-bold underline hover:text-white cursor-pointer ml-3"
            >
              Hapus Filter Major Item
            </button>
          </div>
        )}
      </div>

      {/* 3. REKAPITULASI TERPROGRESS VS TERTAGIH (BOQ & FINANSIAL) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Total Pier Selesai */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 mb-0.5">Status Fisik Titik</div>
          <div className="text-lg font-black text-white font-mono">
            {filteredPiers.filter(p => p.status === 'Closed').length}{' '}
            <span className="text-xs font-normal text-slate-400">/ {filteredPiers.length} Selesai</span>
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>
              {((filteredPiers.filter(p => p.status === 'Closed').length / Math.max(1, filteredPiers.length)) * 100).toFixed(1)}% Titik Closed
            </span>
          </div>
        </div>

        {/* Nilai Rencana (BOQ Kontrak) */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 mb-0.5">Nilai Rencana (BOQ Add. 4)</div>
          <div className="text-lg font-black text-slate-200 font-mono">
            {formatShortIDR(financialTotals.planVal)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Shop Dwg: {formatShortIDR(financialTotals.sdVal)}</div>
        </div>

        {/* Nilai Terprogress Fisik */}
        <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30">
          <div className="text-[11px] font-bold text-amber-300 mb-0.5">Nilai Terprogress (Fisik)</div>
          <div className="text-lg font-black text-amber-400 font-mono">
            {formatShortIDR(financialTotals.progVal)}
          </div>
          <div className="text-[10px] text-amber-300 mt-1 font-semibold">
            {financialTotals.progPct.toFixed(1)}% Realisasi Fisik Lapangan
          </div>
        </div>

        {/* Nilai Tertagih (Certified MC) */}
        <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
          <div className="text-[11px] font-bold text-emerald-300 mb-0.5">Nilai Tertagih (Sertifikat MC)</div>
          <div className="text-lg font-black text-emerald-400 font-mono">
            {formatShortIDR(financialTotals.billVal)}
          </div>
          <div className="text-[10px] text-emerald-300 mt-1 font-semibold">
            {financialTotals.billPct.toFixed(1)}% Bersertifikat Pembayaran
          </div>
        </div>

        {/* Sisa Belum Tertagih (Unbilled) */}
        <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-500/30 col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-blue-300 mb-0.5">Progres Belum Tertagih</div>
          <div className="text-lg font-black text-blue-400 font-mono">
            {formatShortIDR(financialTotals.unbilledVal)}
          </div>
          <div className="text-[10px] text-blue-300 mt-1">Outstanding sertifikasi BAP</div>
        </div>
      </div>

      {/* 4. SHEET / SECTION TABS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            Kategori Sheet Trase:
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Menampilkan {filteredPiers.length} dari {piers.length} Titik Pier
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { id: 'ALL', label: 'Semua Sheet', count: sectionCounts.ALL },
            { id: 'Main Road Awal', label: 'Main Road Awal', count: sectionCounts['Main Road Awal'] },
            { id: 'Sisi Selatan', label: 'Sisi Selatan', count: sectionCounts['Sisi Selatan'] },
            { id: 'Sisi Utara', label: 'Sisi Utara', count: sectionCounts['Sisi Utara'] },
            { id: 'Main Road Akhir', label: 'Main Road Akhir', count: sectionCounts['Main Road Akhir'] },
            { id: 'Ramp', label: 'Ramp On/Off', count: sectionCounts['Ramp'] },
            { id: 'Frontage', label: 'Frontage', count: sectionCounts['Frontage'] },
          ].map(tab => {
            const isSelected = filterSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterSection(tab.id as any)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                    : 'bg-slate-800/70 border-slate-700/70 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="text-[11px] font-bold truncate">{tab.label}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[10px] font-semibold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    {tab.count} Pier
                  </span>
                  {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. CONTROLS: VIEW PRESETS & ADVANCED FILTERS */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: View Mode Preset */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
          {[
            { id: 'FULL', label: 'Format Lengkap', icon: BarChart3 },
            { id: 'MAJOR_ITEMS', label: 'Major Items (Titik)', icon: Boxes },
            { id: 'WBS_SCHEDULE', label: 'Jadwal Teknis WBS', icon: Calendar },
            { id: 'PROGRESS_BILLED', label: 'Terprogress & Tertagih', icon: Coins },
            { id: 'COMPACT', label: 'Ringkas', icon: Layers },
          ].map(m => {
            const Icon = m.icon;
            const isActive = viewMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id as TableViewMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Quick Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Pier, STA, Ruas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 text-xs focus:ring-1 focus:ring-blue-500 w-48"
            />
          </div>

          {/* Zona */}
          <select
            value={filterZone}
            onChange={e => setFilterZone(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
          >
            <option value="ALL">Semua Zona</option>
            {zones.map(z => (
              <option key={z.zoneId} value={z.zoneId}>
                {z.zoneName}
              </option>
            ))}
          </select>

          {/* Kontraktor */}
          <select
            value={filterContractor}
            onChange={e => setFilterContractor(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
          >
            <option value="ALL">Semua Kontraktor</option>
            <option value="WIKA">WIKA</option>
            <option value="GI">Girder Indonesia</option>
            <option value="WIKA-GI">Joint WIKA-GI</option>
          </select>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
          >
            <option value="ALL">Semua Status</option>
            <option value="Closed">Closed (Selesai)</option>
            <option value="On Progress">On Progress</option>
            <option value="Open">Open (Critical)</option>
            <option value="N/A">N/A (Belum Mulai)</option>
          </select>
        </div>
      </div>

      {/* 6. FORMAT MASTER PIER TABLE */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            {/* HIERARCHICAL MULTI-LEVEL THEAD */}
            <thead>
              {/* LEVEL 1: SUPER HEADERS (GROUP HEADERS) */}
              <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                <th colSpan={viewMode === 'COMPACT' ? 5 : 6} className="py-2.5 px-3 border-r border-slate-800 text-blue-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>1. IDENTITAS &amp; TRASE PIER</span>
                  </div>
                </th>

                {(viewMode === 'FULL' || viewMode === 'MAJOR_ITEMS') && (
                  <th colSpan={9} className="py-2.5 px-3 border-r border-slate-800 text-amber-400 text-center bg-amber-950/20">
                    <div className="flex items-center justify-center gap-1.5">
                      <Boxes className="w-3.5 h-3.5" />
                      <span>2. PROGRESS MAJOR ITEM (DIHITUNG PER TITIK PIER)</span>
                    </div>
                  </th>
                )}

                {(viewMode === 'FULL' || viewMode === 'WBS_SCHEDULE') && (
                  <th colSpan={5} className="py-2.5 px-3 border-r border-slate-800 text-indigo-400 text-center bg-indigo-950/20">
                    <div className="flex items-center justify-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>3. JADWAL TEKNIS SESUAI WBS</span>
                    </div>
                  </th>
                )}

                {(viewMode === 'FULL' || viewMode === 'PROGRESS_BILLED') && (
                  <th colSpan={6} className="py-2.5 px-3 border-r border-slate-800 text-emerald-400 text-center bg-emerald-950/20">
                    <div className="flex items-center justify-center gap-1.5">
                      <Coins className="w-3.5 h-3.5" />
                      <span>4. VOLUME &amp; KEUANGAN (TERPROGRESS &amp; TERTAGIH)</span>
                    </div>
                  </th>
                )}

                <th colSpan={canEdit ? 3 : 2} className="py-2.5 px-3 text-center text-slate-300">
                  <span>5. STATUS &amp; AKSI</span>
                </th>
              </tr>

              {/* LEVEL 2: DETAILED COLUMN HEADERS */}
              <tr className="bg-slate-800/90 text-slate-300 text-[11px] font-semibold border-b border-slate-700 divide-x divide-slate-700/60 whitespace-nowrap">
                {/* 1. Identitas Pier */}
                <th className="py-2.5 px-3 sticky left-0 z-20 bg-slate-800 text-white font-bold">No. Pier</th>
                <th className="py-2.5 px-3">Ruas Jalan</th>
                <th className="py-2.5 px-3">Zona</th>
                <th className="py-2.5 px-3">STA / Kode Area</th>
                <th className="py-2.5 px-3">Tipe Struktur</th>
                {viewMode !== 'COMPACT' && <th className="py-2.5 px-3">Kontraktor</th>}

                {/* 2. Progress Major Item */}
                {(viewMode === 'FULL' || viewMode === 'MAJOR_ITEMS') && (
                  <>
                    <th className="py-2.5 px-2 text-center bg-amber-950/10" title="Bored Pile D1200 / D1500mm">Borepile</th>
                    <th className="py-2.5 px-2 text-center bg-amber-950/10" title="Pile Cap Beton Masif fc 35 MPa">Pilecap</th>
                    <th className="py-2.5 px-2 text-center bg-amber-950/10" title="Kolom Pier Elevated">Kolom</th>
                    <th className="py-2.5 px-2 text-center bg-amber-950/10" title="Pier Head Cantilever / Portal">Pierhead</th>
                    <th className="py-2.5 px-2 text-center bg-amber-950/10" title="Lead Rubber Bearing">LRB</th>
                    <th className="py-2.5 px-2 text-center bg-amber-950/10" title="Produksi Precast Box Girder di Casting Yard">Prod. Box</th>
                    <th className="py-2.5 px-2 text-center bg-amber-950/10" title="Erection Box Girder via Launcher Gantry">Erec. Box</th>
                    <th className="py-2.5 px-2 text-center bg-amber-950/10" title="Steel Box Girder Crossing Bentang Khusus">Steel Box</th>
                    <th className="py-2.5 px-2 text-center bg-amber-950/10" title="PCI / PCU I-Girder">PCU/PCI</th>
                  </>
                )}

                {/* 3. Jadwal Teknis WBS */}
                {(viewMode === 'FULL' || viewMode === 'WBS_SCHEDULE') && (
                  <>
                    <th className="py-2.5 px-2.5 text-center bg-indigo-950/10">WBS Code</th>
                    <th className="py-2.5 px-2.5 text-center bg-indigo-950/10 text-slate-300">Rencana Mulai</th>
                    <th className="py-2.5 px-2.5 text-center bg-indigo-950/10 text-slate-300">Rencana Selesai</th>
                    <th className="py-2.5 px-2.5 text-center bg-indigo-950/10 text-emerald-300">Aktual Mulai</th>
                    <th className="py-2.5 px-2.5 text-center bg-indigo-950/10 text-emerald-300">Aktual Selesai</th>
                  </>
                )}

                {/* 4. Terprogress & Tertagih */}
                {(viewMode === 'FULL' || viewMode === 'PROGRESS_BILLED') && (
                  <>
                    <th className="py-2.5 px-2.5 text-right bg-emerald-950/10">Nilai Rencana (Rp)</th>
                    <th className="py-2.5 px-2.5 text-right bg-emerald-950/10 text-amber-300">Nilai Terprogress</th>
                    <th className="py-2.5 px-2.5 text-right bg-emerald-950/10 text-emerald-300">Nilai Tertagih (MC)</th>
                    <th className="py-2.5 px-2 text-center bg-emerald-950/10">% Tertagih</th>
                    <th className="py-2.5 px-2.5 text-right bg-emerald-950/10 text-blue-300">Belum Tertagih</th>
                    <th className="py-2.5 px-2 text-center bg-emerald-950/10">Status MC</th>
                  </>
                )}

                {/* 5. Status & Aksi */}
                <th className="py-2.5 px-3 text-right">Progress</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-2 text-center">Aksi</th>
              </tr>
            </thead>

            {/* TBODY */}
            <tbody className="divide-y divide-slate-800">
              {filteredPiers.length === 0 ? (
                <tr>
                  <td colSpan={25} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold">Tidak ada data pier yang sesuai kriteria filter.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Coba ubah kata kunci pencarian atau reset filter sheet / zona.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPiers.map(p => {
                  const major = getPierMajorItems(p);
                  const wbs = getPierWBSDetails(p);
                  const fin = getPierFinancialProgress(p);

                  return (
                    <tr
                      key={p.pierId}
                      className="hover:bg-slate-800/40 transition-colors divide-x divide-slate-800/60"
                    >
                      {/* Pier Number */}
                      <td className="py-2.5 px-3 font-mono font-bold text-white whitespace-nowrap sticky left-0 z-10 bg-slate-900">
                        <button
                          onClick={() => setSelectedPierDetail(p)}
                          className="flex items-center gap-1.5 hover:text-blue-400 transition-colors cursor-pointer text-left"
                          title="Klik untuk membuka kartu detail teknis pier"
                        >
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              p.status === 'Closed'
                                ? 'bg-emerald-400'
                                : p.status === 'Open'
                                ? 'bg-rose-400'
                                : 'bg-amber-400'
                            }`}
                          />
                          <span className="underline decoration-slate-700 hover:decoration-blue-400">
                            {p.pierNumber}
                          </span>
                        </button>
                      </td>

                      {/* Ruas Jalan */}
                      <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                        <span className="truncate max-w-[130px] block" title={p.ruas}>
                          {p.ruas || '-'}
                        </span>
                      </td>

                      {/* Zona */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold text-blue-300">
                          {p.zoneId}
                        </span>
                      </td>

                      {/* STA / Kode Area */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                        {p.kodeArea || '-'}
                      </td>

                      {/* Tipe Pier & Superstruktur */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-semibold text-white leading-tight">
                          {p.tipePier || 'Single Pier'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {p.tipeSuperstruktur || 'Box Girder'}
                        </div>
                      </td>

                      {/* Kontraktor */}
                      {viewMode !== 'COMPACT' && (
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.contractorId === 'WIKA'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : p.contractorId === 'GI'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {p.contractorId}
                          </span>
                        </td>
                      )}

                      {/* 2. PROGRESS 9 MAJOR ITEMS (PER TITIK) */}
                      {(viewMode === 'FULL' || viewMode === 'MAJOR_ITEMS') && (
                        <>
                          <td className="py-2 px-2 text-center bg-amber-950/5">
                            {renderMajorBadge(major.borepile)}
                          </td>
                          <td className="py-2 px-2 text-center bg-amber-950/5">
                            {renderMajorBadge(major.pilecap)}
                          </td>
                          <td className="py-2 px-2 text-center bg-amber-950/5">
                            {renderMajorBadge(major.pierKolom)}
                          </td>
                          <td className="py-2 px-2 text-center bg-amber-950/5">
                            {renderMajorBadge(major.pierhead)}
                          </td>
                          <td className="py-2 px-2 text-center bg-amber-950/5">
                            {renderMajorBadge(major.lrb)}
                          </td>
                          <td className="py-2 px-2 text-center bg-amber-950/5">
                            {renderMajorBadge(major.prodBoxGirder)}
                          </td>
                          <td className="py-2 px-2 text-center bg-amber-950/5">
                            {renderMajorBadge(major.erectionBoxGirder)}
                          </td>
                          <td className="py-2 px-2 text-center bg-amber-950/5">
                            {renderMajorBadge(major.steelBoxGirder)}
                          </td>
                          <td className="py-2 px-2 text-center bg-amber-950/5">
                            {renderMajorBadge(major.pcuPci)}
                          </td>
                        </>
                      )}

                      {/* 3. JADWAL TEKNIS WBS */}
                      {(viewMode === 'FULL' || viewMode === 'WBS_SCHEDULE') && (
                        <>
                          <td className="py-2.5 px-2.5 text-center font-mono text-[10px] text-indigo-300 whitespace-nowrap bg-indigo-950/5">
                            {wbs.wbsCode}
                          </td>
                          <td className="py-2.5 px-2.5 text-center font-mono text-[10px] text-slate-300 whitespace-nowrap bg-indigo-950/5">
                            {wbs.planStart}
                          </td>
                          <td className="py-2.5 px-2.5 text-center font-mono text-[10px] text-slate-300 whitespace-nowrap bg-indigo-950/5">
                            {wbs.planFinish}
                          </td>
                          <td className="py-2.5 px-2.5 text-center font-mono text-[10px] text-emerald-300 whitespace-nowrap bg-indigo-950/5">
                            {wbs.actualStart}
                          </td>
                          <td className="py-2.5 px-2.5 text-center font-mono text-[10px] text-emerald-300 whitespace-nowrap bg-indigo-950/5">
                            {wbs.actualFinish}
                          </td>
                        </>
                      )}

                      {/* 4. TERPROGRESS & TERTAGIH (BOQ & FINANSIAL) */}
                      {(viewMode === 'FULL' || viewMode === 'PROGRESS_BILLED') && (
                        <>
                          <td className="py-2.5 px-2.5 text-right font-mono text-slate-300 whitespace-nowrap bg-emerald-950/5">
                            {formatShortIDR(fin.totalPlanValue)}
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-mono font-bold text-amber-300 whitespace-nowrap bg-emerald-950/5">
                            {formatShortIDR(fin.totalProgressValue)}
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-mono font-bold text-emerald-400 whitespace-nowrap bg-emerald-950/5">
                            {formatShortIDR(fin.totalBilledValue)}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-[11px] text-emerald-300 whitespace-nowrap bg-emerald-950/5">
                            {fin.billedPercentage.toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-mono text-[11px] text-blue-300 whitespace-nowrap bg-emerald-950/5">
                            {formatShortIDR(fin.unbilledValue)}
                          </td>
                          <td className="py-2.5 px-2 text-center whitespace-nowrap bg-emerald-950/5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                fin.billedPercentage >= 100
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : fin.billedPercentage > 0
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              {fin.billedPercentage >= 100 ? 'MC Selesai' : fin.billedPercentage > 0 ? 'BAP MC' : 'Belum MC'}
                            </span>
                          </td>
                        </>
                      )}

                      {/* 5. STATUS & AKSI */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                        {p.overallProgress}%
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'Closed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : p.status === 'On Progress'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : p.status === 'Open'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedPierDetail(p)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                            title="Lihat Detail Kartu Pier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1 rounded hover:bg-slate-700 text-blue-400 hover:text-blue-300 cursor-pointer"
                                title="Edit Pier & Jadwal WBS"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Hapus pier ${p.pierNumber} dari register?`)) {
                                    deletePier(p.pierId);
                                  }
                                }}
                                className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-rose-400 cursor-pointer"
                                title="Hapus Pier"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Summary Counts */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>
              Total Baris Tabel:{' '}
              <strong className="text-white font-mono">{filteredPiers.length}</strong> Titik
            </span>
            <span className="hidden sm:inline">
              Fisik Rata-rata:{' '}
              <strong className="text-emerald-400 font-mono">
                {(
                  filteredPiers.reduce((acc, curr) => acc + (curr.overallProgress || 0), 0) /
                  Math.max(1, filteredPiers.length)
                ).toFixed(1)}
                %
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px]">
              Total Tertagih MC:{' '}
              <strong className="text-emerald-400 font-bold">
                {formatShortIDR(financialTotals.billVal)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* 7. MODAL DETAIL PIER (KARTU KONTROL TEKNIS LENGKAP) */}
      {selectedPierDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white font-mono">
                      Kartu Teknis Master Pier {selectedPierDetail.pierNumber}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        selectedPierDetail.status === 'Closed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : selectedPierDetail.status === 'Open'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {selectedPierDetail.status} ({selectedPierDetail.overallProgress}%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedPierDetail.ruas} • Zona: {selectedPierDetail.zoneId} • {selectedPierDetail.lingkupKontraktor || selectedPierDetail.contractorId}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPierDetail(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs custom-scrollbar">
              {/* Parameter Desain & Trase */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  Parameter Desain &amp; Lokasi Trase
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
                  <div>
                    <span className="text-slate-500 text-[10px]">Tipe Pier:</span>
                    <div className="font-semibold text-white mt-0.5">{selectedPierDetail.tipePier || 'Single Pier'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">Tipe Superstruktur:</span>
                    <div className="font-semibold text-white mt-0.5">{selectedPierDetail.tipeSuperstruktur || 'Box Girder'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">Kode Area:</span>
                    <div className="font-mono font-semibold text-blue-300 mt-0.5">{selectedPierDetail.kodeArea || '-'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">Section Trase:</span>
                    <div className="font-semibold text-white mt-0.5">{selectedPierDetail.section || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Progress 9 Major Items untuk Titik Ini */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Status 9 Major Items pada Titik Ini</span>
                </h4>
                {(() => {
                  const major = getPierMajorItems(selectedPierDetail);
                  const itemsList = [
                    { name: 'Bored Pile Pondasi', data: major.borepile },
                    { name: 'Pile Cap Masif', data: major.pilecap },
                    { name: 'Pier Kolom', data: major.pierKolom },
                    { name: 'Pier Head', data: major.pierhead },
                    { name: 'Lead Rubber Bearing (LRB)', data: major.lrb },
                    { name: 'Produksi Box Girder', data: major.prodBoxGirder },
                    { name: 'Erection Box Girder', data: major.erectionBoxGirder },
                    { name: 'Steel Box Girder', data: major.steelBoxGirder },
                    { name: 'PCU / PCI Girder', data: major.pcuPci },
                  ];

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {itemsList.map(it => (
                        <div
                          key={it.name}
                          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-white text-[11px]">{it.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                              {it.data.note || `${it.data.percent}%`}
                            </div>
                          </div>
                          <div>{renderMajorBadge(it.data)}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Jadwal Teknis WBS */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Jadwal Teknis Sesuai WBS</span>
                </h4>
                {(() => {
                  const wbs = getPierWBSDetails(selectedPierDetail);
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 text-[10px]">Rencana Mulai:</span>
                        <div className="text-slate-200 font-bold mt-0.5">{wbs.planStart}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 text-[10px]">Rencana Selesai:</span>
                        <div className="text-slate-200 font-bold mt-0.5">{wbs.planFinish}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 text-[10px]">Aktual Mulai:</span>
                        <div className="text-emerald-300 font-bold mt-0.5">{wbs.actualStart}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 text-[10px]">Aktual Selesai:</span>
                        <div className="text-emerald-300 font-bold mt-0.5">{wbs.actualFinish}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Volume & Finansial Terprogress dan Tertagih */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" />
                  <span>Status Volume &amp; Finansial BOQ (Terprogress &amp; Tertagih)</span>
                </h4>
                {(() => {
                  const fin = getPierFinancialProgress(selectedPierDetail);
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 text-[10px]">Nilai Rencana (Plan):</span>
                        <div className="text-slate-200 font-bold mt-0.5">{formatShortIDR(fin.totalPlanValue)}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 text-[10px]">Nilai Shop Dwg:</span>
                        <div className="text-blue-300 font-bold mt-0.5">{formatShortIDR(fin.totalSDValue)}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 text-[10px]">Terprogress Fisik:</span>
                        <div className="text-amber-300 font-bold mt-0.5">{formatShortIDR(fin.totalProgressValue)}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 text-[10px]">Tertagih (MC):</span>
                        <div className="text-emerald-400 font-bold mt-0.5">{formatShortIDR(fin.totalBilledValue)}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">ID: {selectedPierDetail.pierId}</span>
              <button
                onClick={() => setSelectedPierDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL ADD / EDIT PIER DENGAN PARAMETER WBS & TEKNIS */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              <span>{editingPier ? `Edit Master Pier ${editingPier.pierNumber}` : 'Tambah Titik Master Pier Baru'}</span>
            </h3>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Row 1: Pier No & Ruas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pier Number (PIER)*</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: P.1, P.16.S, P.21.N, RAO.1"
                    value={formData.pierNumber}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        pierNumber: e.target.value.trim(),
                        pierId: editingPier ? formData.pierId : e.target.value.replace(/\s+/g, '_').trim()
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ruas Jalan*</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Main Road Selatan"
                    value={formData.ruas || ''}
                    onChange={e => setFormData({ ...formData, ruas: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Row 2: Kode Area & Zona */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">STA / Kode Area</label>
                  <input
                    type="text"
                    placeholder="misal: P.16.S ~ P.17.S"
                    value={formData.kodeArea || ''}
                    onChange={e => setFormData({ ...formData, kodeArea: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Zona Proyek*</label>
                  <select
                    value={formData.zoneId}
                    onChange={e => setFormData({ ...formData, zoneId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    {zones.map(z => (
                      <option key={z.zoneId} value={z.zoneId}>
                        {z.zoneName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Tipe Pier & Tipe Superstruktur */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipe Pier</label>
                  <input
                    type="text"
                    placeholder="misal: Single Pier, Cantilever, Portal"
                    value={formData.tipePier || ''}
                    onChange={e => setFormData({ ...formData, tipePier: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipe Superstruktur</label>
                  <input
                    type="text"
                    placeholder="misal: Single Box Girder, Double Box, SBG, PCU"
                    value={formData.tipeSuperstruktur || ''}
                    onChange={e => setFormData({ ...formData, tipeSuperstruktur: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Row 4: Kontraktor & Section */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Lingkup Kontraktor Pelaksana</label>
                  <select
                    value={formData.contractorId}
                    onChange={e => {
                      const val = e.target.value as ContractorId;
                      const lingkup =
                        val === 'WIKA'
                          ? 'PT Wijaya Karya'
                          : val === 'GI'
                          ? 'PT Girder Indonesia'
                          : val === 'WIKA-GI'
                          ? 'PT Wijaya Karya / PT Girder Indonesia'
                          : 'Unassigned';
                      setFormData({ ...formData, contractorId: val, lingkupKontraktor: lingkup });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="WIKA">PT Wijaya Karya (WIKA)</option>
                    <option value="GI">PT Girder Indonesia (GI)</option>
                    <option value="WIKA-GI">Joint (PT Wijaya Karya / PT Girder Indonesia)</option>
                    <option value="Unassigned">Belum Ditetapkan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kategori Sheet Trase</label>
                  <select
                    value={formData.section || 'Main Road Awal'}
                    onChange={e => setFormData({ ...formData, section: e.target.value as PierSection })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Main Road Awal">Main Road Awal</option>
                    <option value="Sisi Selatan">Sisi Selatan</option>
                    <option value="Sisi Utara">Sisi Utara</option>
                    <option value="Main Road Akhir">Main Road Akhir</option>
                    <option value="Ramp">Ramp</option>
                    <option value="Frontage">Frontage</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Status & Overall Progress */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status Pier</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as PierStatus })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Closed">Closed (Selesai)</option>
                    <option value="On Progress">On Progress (Sedang Dikerjakan)</option>
                    <option value="Open">Open (Ada Kendala / Critical)</option>
                    <option value="N/A">N/A (Belum Mulai)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Overall Progress Fisik (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.overallProgress}
                    onChange={e => setFormData({ ...formData, overallProgress: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Row 6: Jadwal Teknis WBS (Rencana Mulai, Rencana Selesai) */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div>
                  <label className="block text-indigo-300 font-semibold mb-1">Rencana Mulai (WBS)</label>
                  <input
                    type="date"
                    value={formData.planStart || '2025-01-10'}
                    onChange={e => setFormData({ ...formData, planStart: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-indigo-300 font-semibold mb-1">Rencana Selesai (WBS)*</label>
                  <input
                    type="date"
                    required
                    value={formData.plannedFinish}
                    onChange={e => setFormData({ ...formData, plannedFinish: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Row 7: Jadwal Teknis WBS (Aktual Mulai, Aktual Selesai) */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div>
                  <label className="block text-emerald-300 font-semibold mb-1">Aktual Mulai (WBS)</label>
                  <input
                    type="date"
                    value={formData.actualStart || ''}
                    onChange={e => setFormData({ ...formData, actualStart: e.target.value || undefined })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-emerald-300 font-semibold mb-1">Aktual Selesai (WBS)</label>
                  <input
                    type="date"
                    value={formData.actualFinish || ''}
                    onChange={e => setFormData({ ...formData, actualFinish: e.target.value || undefined })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Row 8: Aktivitas Utama */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Aktivitas Utama Saat Ini</label>
                <input
                  type="text"
                  placeholder="Contoh: Bored Pile Drilling / Pier Head Concreting"
                  value={formData.mainActivity || ''}
                  onChange={e => setFormData({ ...formData, mainActivity: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold cursor-pointer shadow-sm"
                >
                  {editingPier ? 'Simpan Perubahan' : 'Tambah Pier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
