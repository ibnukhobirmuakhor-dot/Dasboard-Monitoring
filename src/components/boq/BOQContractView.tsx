import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Coins,
  TrendingUp,
  Scale,
  Calendar,
  Layers,
  Search,
  Filter,
  Download,
  Plus,
  Edit2,
  Check,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronRight,
  ShieldCheck,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  X,
  Sparkles,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { useProject } from '../../context/ProjectContext';
import {
  contractAddendumList,
  initialBOQItems,
  computeDivisionSummaries
} from '../../data/boqData';
import {
  BOQItem,
  BOQDivisionId,
  ContractAddendumMeta,
  ContractorId
} from '../../types';

// Format Indonesian Rupiah
const formatIDR = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val);
};

// Format Billions / Trillions short
const formatShortIDR = (val: number): string => {
  if (Math.abs(val) >= 1_000_000_000_000) {
    return `Rp ${(val / 1_000_000_000_000).toFixed(2)} T`;
  }
  if (Math.abs(val) >= 1_000_000_000) {
    return `Rp ${(val / 1_000_000_000).toFixed(1)} M`;
  }
  if (Math.abs(val) >= 1_000_000) {
    return `Rp ${(val / 1_000_000).toFixed(1)} Jt`;
  }
  return formatIDR(val);
};

export const BOQContractView: React.FC = () => {
  const { exportToExcel } = useProject();

  // Local state for BOQ items (allows adding/editing CCO)
  const [boqList, setBoqList] = useState<BOQItem[]>(() => {
    const saved = localStorage.getItem('hbr2_boq_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return initialBOQItems;
  });

  // UI state
  const [selectedAddendumTab, setSelectedAddendumTab] = useState<string>('ADD_4');
  const [divisionFilter, setDivisionFilter] = useState<BOQDivisionId | 'ALL'>('ALL');
  const [contractorFilter, setContractorFilter] = useState<ContractorId | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'ALL_ADDENDUMS' | 'WORKING_VS_ACTUAL' | 'CCO_ANALYSIS'>('ALL_ADDENDUMS');
  const [selectedItemDetail, setSelectedItemDetail] = useState<BOQItem | null>(null);
  const [selectedLegalAddendum, setSelectedLegalAddendum] = useState<ContractAddendumMeta | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Inline editing state for individual BOQ items
  interface EditRowState {
    id: string;
    description: string;
    unit: string;
    unitPrice: number;
    volOriginal: number;
    volAddendum4: number;
    volActual: number;
  }
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editRowData, setEditRowData] = useState<EditRowState | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // New item form state
  const [newItem, setNewItem] = useState<Partial<BOQItem>>({
    itemNumber: '',
    description: '',
    divisionId: 'DIV-7',
    divisionName: 'Divisi 7: Struktur Tol Elevated',
    unit: 'm3',
    contractorId: 'WIKA',
    unitPrice: 0,
    volOriginal: 0,
    volAddendum1: 0,
    volAddendum2: 0,
    volAddendum3: 0,
    volAddendum4: 0,
    volActual: 0,
    changeJustification: ''
  });

  // Division summaries
  const divisionSummaries = useMemo(() => {
    return computeDivisionSummaries(boqList);
  }, [boqList]);

  // Overall Contract Totals
  const totals = useMemo(() => {
    let orig = 0;
    let add1 = 0;
    let add2 = 0;
    let add3 = 0;
    let add4 = 0;
    let act = 0;

    boqList.forEach(item => {
      orig += item.volOriginal * item.unitPrice;
      add1 += item.volAddendum1 * item.unitPrice;
      add2 += item.volAddendum2 * item.unitPrice;
      add3 += item.volAddendum3 * item.unitPrice;
      add4 += item.volAddendum4 * item.unitPrice;
      act += item.volActual * item.unitPrice;
    });

    const deltaFromOriginal = add4 - orig;
    const deltaPercentage = orig > 0 ? (deltaFromOriginal / orig) * 100 : 0;
    const financialProgress = add4 > 0 ? (act / add4) * 100 : 0;
    const remainingBalance = add4 - act;

    return {
      orig,
      add1,
      add2,
      add3,
      add4,
      act,
      deltaFromOriginal,
      deltaPercentage,
      financialProgress,
      remainingBalance
    };
  }, [boqList]);

  // Filtered items for table
  const filteredItems = useMemo(() => {
    return boqList.filter(item => {
      if (divisionFilter !== 'ALL' && item.divisionId !== divisionFilter) return false;
      if (contractorFilter !== 'ALL' && item.contractorId !== contractorFilter && item.contractorId !== 'WIKA-GI') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = item.itemNumber.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchRef = (item.wbsCodeRef || '').toLowerCase().includes(q);
        if (!matchNum && !matchDesc && !matchRef) return false;
      }
      return true;
    });
  }, [boqList, divisionFilter, contractorFilter, searchQuery]);

  // Export to Excel
  const handleExportBOQ = () => {
    const rows = filteredItems.map(item => ({
      'No. Mata Pembayaran': item.itemNumber,
      'Uraian Pekerjaan': item.description,
      Divisi: item.divisionName,
      Satuan: item.unit,
      Kontraktor: item.contractorId,
      'Harga Satuan (Rp)': item.unitPrice,
      'Vol Kontrak Awal': item.volOriginal,
      'Nilai Kontrak Awal (Rp)': item.volOriginal * item.unitPrice,
      'Vol Addendum 1': item.volAddendum1,
      'Vol Addendum 2': item.volAddendum2,
      'Vol Addendum 3': item.volAddendum3,
      'Vol Addendum 4 (Working)': item.volAddendum4,
      'Nilai Addendum 4 (Rp)': item.volAddendum4 * item.unitPrice,
      'Vol Realisasi': item.volActual,
      'Nilai Realisasi (Rp)': item.volActual * item.unitPrice,
      'Progres Finansial (%)': item.volAddendum4 > 0 ? ((item.volActual / item.volAddendum4) * 100).toFixed(2) : '0.00',
      'Selisih Vol CCO': item.volAddendum4 - item.volOriginal,
      'Selisih Nilai CCO (Rp)': (item.volAddendum4 - item.volOriginal) * item.unitPrice,
      'Justifikasi Perubahan': item.changeJustification || '-'
    }));

    exportToExcel(
      `BOQ_Kontrak_Awal_Addendum1_4_HBR2_${new Date().toISOString().split('T')[0]}`,
      'BOQ & Addendum Kontrak',
      rows
    );
  };

  // Persist updated BOQ list to state & localStorage
  const updateBoqListAndPersist = (updated: BOQItem[]) => {
    setBoqList(updated);
    try {
      localStorage.setItem('hbr2_boq_items', JSON.stringify(updated));
    } catch (err) {
      console.error('Gagal menyimpan BOQ ke localStorage:', err);
    }
  };

  // Start inline editing for a specific row
  const handleStartEdit = (item: BOQItem) => {
    setEditingItemId(item.id);
    setEditRowData({
      id: item.id,
      description: item.description,
      unit: item.unit,
      unitPrice: item.unitPrice,
      volOriginal: item.volOriginal,
      volAddendum4: item.volAddendum4,
      volActual: item.volActual
    });
  };

  // Cancel inline editing
  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditRowData(null);
  };

  // Save inline edit to local state and persistence
  const handleSaveEdit = (itemId: string) => {
    if (!editRowData) return;
    const updated = boqList.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          description: editRowData.description.trim() || item.description,
          unit: editRowData.unit.trim() || item.unit,
          unitPrice: Math.max(0, Number(editRowData.unitPrice) || 0),
          volOriginal: Math.max(0, Number(editRowData.volOriginal) || 0),
          volAddendum4: Math.max(0, Number(editRowData.volAddendum4) || 0),
          volActual: Math.max(0, Number(editRowData.volActual) || 0)
        };
      }
      return item;
    });

    updateBoqListAndPersist(updated);
    setEditingItemId(null);
    setEditRowData(null);
    setSaveFeedback(`Item ${itemId} berhasil disimpan.`);
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  // Add new BOQ item
  const handleSaveNewItem = () => {
    if (!newItem.itemNumber || !newItem.description || !newItem.unitPrice) {
      alert('Mohon isi nomor item, uraian, dan harga satuan.');
      return;
    }

    const created: BOQItem = {
      id: `BOQ-CUSTOM-${Date.now()}`,
      itemNumber: newItem.itemNumber || 'Custom',
      description: newItem.description || '',
      divisionId: (newItem.divisionId as BOQDivisionId) || 'DIV-7',
      divisionName: newItem.divisionName || 'Divisi 7: Struktur Tol Elevated',
      unit: newItem.unit || 'm3',
      contractorId: (newItem.contractorId as ContractorId) || 'WIKA',
      unitPrice: Number(newItem.unitPrice) || 0,
      volOriginal: Number(newItem.volOriginal) || 0,
      volAddendum1: Number(newItem.volAddendum1) || 0,
      volAddendum2: Number(newItem.volAddendum2) || 0,
      volAddendum3: Number(newItem.volAddendum3) || 0,
      volAddendum4: Number(newItem.volAddendum4) || 0,
      volActual: Number(newItem.volActual) || 0,
      changeJustification: newItem.changeJustification || 'Usulan CCO pekerjaan tambah di lapangan'
    };

    const updated = [...boqList, created];
    updateBoqListAndPersist(updated);
    setShowAddModal(false);
  };

  // Reset to default BOQ
  const handleResetBOQ = () => {
    if (confirm('Kembalikan data BOQ ke master kontrak awal dan addendum 1-4 standar?')) {
      setBoqList(initialBOQItems);
      localStorage.removeItem('hbr2_boq_items');
    }
  };

  // Chart data comparing Divisions across Original vs Addendum 4
  const chartData = useMemo(() => {
    return divisionSummaries.map(d => ({
      name: d.divisionId,
      fullName: d.divisionName,
      'Kontrak Awal': Math.round(d.valOriginal / 1_000_000_000), // in Miliar
      'Addendum 4': Math.round(d.valAddendum4 / 1_000_000_000),
      'Realisasi (MC)': Math.round(d.valActual / 1_000_000_000)
    }));
  }, [divisionSummaries]);

  return (
    <div id="boq-contract-view" className="space-y-6 pb-20">
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Coins className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Bill of Quantities (BOQ) &amp; Komparasi Addendum Kontrak 1 s/d 4
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Kontrak Awal + Add. 1, 2, 3, 4
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Evaluasi volume dan nilai kontrak: Kontrak Awal (B0), Addendum 1 (Akses Ancol), Addendum 2 (Portal P.56A), Addendum 3 (Pipa PGN P.20.S), dan Addendum 4 (Working Baseline).
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Item / CCO</span>
          </button>

          <button
            onClick={handleExportBOQ}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Ekspor BOQ Excel</span>
          </button>

          <button
            onClick={handleResetBOQ}
            className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded-xl font-medium transition-all cursor-pointer"
            title="Kembalikan data ke master awal"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Contract Executive Scorecards (Financial & Contractual KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Kontrak Awal */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Nilai Kontrak Awal (B0)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">15 Jan 2024</span>
          </div>
          <div className="text-lg font-black text-white font-mono">
            {formatShortIDR(totals.orig)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            1.082 Hari (PHO: 31 Des 2026)
          </div>
        </div>

        {/* Addendum 4 (Working Contract) */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/40 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-blue-300 mb-1">
            <span className="font-bold">Nilai Addendum 4 (Terkini)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">Resmi</span>
          </div>
          <div className="text-lg font-black text-blue-400 font-mono">
            {formatShortIDR(totals.add4)}
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            1.172 Hari (PHO: 31 Mar 2027)
          </div>
        </div>

        {/* Change Order (CCO) Delta */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Perubahan Kontrak (CCO)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">&lt; 10% Aman</span>
          </div>
          <div className="text-lg font-black text-emerald-400 font-mono flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4" />
            <span>+{formatShortIDR(totals.deltaFromOriginal)}</span>
          </div>
          <div className="text-[11px] text-emerald-400/90 font-mono mt-1">
            +{totals.deltaPercentage.toFixed(2)}% dari Kontrak Awal
          </div>
        </div>

        {/* Realisasi Keuangan Terpasang (MC Claim) */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Realisasi Keuangan (MC)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">Terpasang</span>
          </div>
          <div className="text-lg font-black text-emerald-400 font-mono">
            {formatShortIDR(totals.act)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <strong className="text-emerald-400">{totals.financialProgress.toFixed(1)}%</strong> thd Addendum 4
          </div>
        </div>

        {/* Sisa Nilai Kontrak */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Sisa Nilai Pekerjaan</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Balance</span>
          </div>
          <div className="text-lg font-black text-slate-200 font-mono">
            {formatShortIDR(totals.remainingBalance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {(100 - totals.financialProgress).toFixed(1)}% belum disertifikasi
          </div>
        </div>

        {/* Total Time Extension */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Kompensasi Waktu</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">Total</span>
          </div>
          <div className="text-lg font-black text-blue-400 font-mono">
            +90 Hari
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Dari 31 Des 26 &rarr; 31 Mar 27
          </div>
        </div>
      </div>

      {/* Contract Addendum Interactive Timeline Ribbon */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-white tracking-wide">
              Riwayat Legalitas Kontrak Awal &amp; Addendum 1 s/d 4
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Klik kartu addendum untuk melihat surat penetapan &amp; rincian perubahan teknis
          </span>
        </div>

        {/* 5 Addendum Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {contractAddendumList.map(meta => {
            const isSelected = selectedAddendumTab === meta.version;
            return (
              <div
                key={meta.version}
                onClick={() => {
                  setSelectedAddendumTab(meta.version);
                  setSelectedLegalAddendum(meta);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-black font-mono px-2 py-0.5 rounded ${
                        meta.version === 'ORIGINAL'
                          ? 'bg-slate-800 text-slate-300'
                          : meta.version === 'ADD_4'
                          ? 'bg-blue-600 text-white'
                          : 'bg-indigo-950 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {meta.code}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{meta.date}</span>
                  </div>

                  <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                    {meta.title}
                  </h4>

                  <div className="mt-2 space-y-1 text-[11px] font-mono">
                    <div className="text-slate-300 font-bold">
                      {formatShortIDR(meta.totalValue)}
                    </div>
                    <div className="text-slate-400 text-[10px] flex items-center justify-between">
                      <span>Perubahan:</span>
                      <strong className={meta.deltaValue > 0 ? 'text-amber-400' : 'text-slate-400'}>
                        {meta.deltaValue > 0 ? `+${formatShortIDR(meta.deltaValue)}` : 'Rp 0'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">PHO: {meta.targetPHO}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Distribution Chart & Rekapitulasi per Divisi */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Chart: Nilai per Divisi (Kontrak Awal vs Addendum 4) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Komparasi Nilai per Divisi (Miliar Rp)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Pergeseran alokasi anggaran: Kontrak Awal vs Addendum 4 vs Realisasi Terpasang.
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={val => `${val}M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                    formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')} Miliar`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="Kontrak Awal" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Addendum 4" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Realisasi (MC)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 mt-2">
            <strong className="text-blue-300">Catatan Portofolio: </strong>
            Divisi 7 (Struktur Utama) menyumbang porsi terbesar yaitu sebesar{' '}
            <strong className="text-white">77,8%</strong> dari total nilai kontrak Addendum 4, diikuti Divisi 1 (Umum) dan Divisi 8 (Pengembalian Kondisi &amp; Minor).
          </div>
        </div>

        {/* Right Table: Division Summary Cards */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Rekapitulasi Divisi Standar Spesifikasi Umum Bina Marga
            </h3>
            <span className="text-xs text-slate-400 font-mono">6 Divisi Utama</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2 px-2.5">Divisi</th>
                  <th className="py-2 px-2 text-right">Kontrak Awal</th>
                  <th className="py-2 px-2 text-right">Addendum 4</th>
                  <th className="py-2 px-2 text-right">Realisasi (MC)</th>
                  <th className="py-2 px-2 text-center">Bobot</th>
                  <th className="py-2 px-2 text-center">Progres</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {divisionSummaries.map(d => {
                  return (
                    <tr
                      key={d.divisionId}
                      onClick={() => setDivisionFilter(divisionFilter === d.divisionId ? 'ALL' : d.divisionId)}
                      className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        divisionFilter === d.divisionId ? 'bg-blue-600/15' : ''
                      }`}
                    >
                      <td className="py-2.5 px-2.5 font-sans font-medium text-slate-200">
                        <div className="font-bold text-white">{d.divisionId}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]">{d.divisionName}</div>
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-400">
                        {formatShortIDR(d.valOriginal)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-blue-400">
                        {formatShortIDR(d.valAddendum4)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-emerald-400">
                        {formatShortIDR(d.valActual)}
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-300">
                        {d.weightAddendum4.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.financialProgress >= 80
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {d.financialProgress.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters, & View Mode Switcher */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* View Mode Switcher */}
          <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('ALL_ADDENDUMS')}
              className={`py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'ALL_ADDENDUMS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Komparasi Lengkap (Kontrak Awal &amp; Add 1-4)
            </button>
            <button
              onClick={() => setViewMode('WORKING_VS_ACTUAL')}
              className={`py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'WORKING_VS_ACTUAL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Addendum 4 vs Realisasi Fisik
            </button>
            <button
              onClick={() => setViewMode('CCO_ANALYSIS')}
              className={`py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'CCO_ANALYSIS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Analisis Pekerjaan Tambah/Kurang (CCO)
            </button>
          </div>

          {/* Contractor Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold hidden sm:inline">Kontraktor:</span>
            <div className="inline-flex p-0.5 rounded-lg bg-slate-950 border border-slate-800">
              {(['ALL', 'WIKA', 'GI'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => setContractorFilter(c)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    contractorFilter === c
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {c === 'ALL' ? 'Semua' : c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search & Division Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari mata pembayaran, uraian (mis. Bored Pile, PGN, Box Girder, fc 45)..."
              className="w-full pl-9 pr-8 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Division Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setDivisionFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                divisionFilter === 'ALL'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              Semua Divisi ({boqList.length})
            </button>
            {(['DIV-1', 'DIV-2', 'DIV-3', 'DIV-7', 'DIV-8', 'DIV-9'] as const).map(divId => (
              <button
                key={divId}
                onClick={() => setDivisionFilter(divId)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  divisionFilter === divId
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {divId}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main BOQ Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Menampilkan <strong className="text-white">{filteredItems.length}</strong> item pekerjaan dari total{' '}
              <strong className="text-white">{boqList.length}</strong> item BOQ.
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[11px] font-medium">
              <Edit2 className="w-3 h-3 text-blue-400" />
              <span>Edit langsung di tabel via tombol pensil (Enter: simpan, Esc: batal)</span>
            </span>
          </div>

          {saveFeedback ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-semibold shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveFeedback}</span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500">
              * Perubahan tersimpan otomatis di browser (localStorage)
            </div>
          )}
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-3 px-3 min-w-[70px]">Mata Pembayaran</th>
                <th className="py-3 px-3 min-w-[240px]">Uraian Pekerjaan</th>
                <th className="py-3 px-2 min-w-[60px] text-center">Sat.</th>
                <th className="py-3 px-2 min-w-[65px] text-center">Kontraktor</th>
                <th className="py-3 px-3 min-w-[110px] text-right">Harga Satuan (Rp)</th>

                {/* View Mode Dependent Header Columns */}
                {viewMode === 'ALL_ADDENDUMS' && (
                  <>
                    <th className="py-3 px-2 min-w-[90px] text-right bg-slate-900/60 text-slate-300">Vol B0 (Awal)</th>
                    <th className="py-3 px-2 min-w-[85px] text-right bg-slate-900/60">Vol Add. 1</th>
                    <th className="py-3 px-2 min-w-[85px] text-right bg-slate-900/60">Vol Add. 2</th>
                    <th className="py-3 px-2 min-w-[85px] text-right bg-slate-900/60">Vol Add. 3</th>
                    <th className="py-3 px-2 min-w-[105px] text-right bg-blue-950/40 text-blue-300 font-black">Vol Add. 4</th>
                    <th className="py-3 px-3 min-w-[125px] text-right bg-blue-950/40 text-blue-300 font-black">Nilai Add. 4 (Rp)</th>
                    <th className="py-3 px-2 min-w-[90px] text-right bg-emerald-950/40 text-emerald-300 font-bold">Vol Realisasi</th>
                    <th className="py-3 px-3 min-w-[120px] text-right bg-emerald-950/40 text-emerald-300 font-bold">Nilai Realisasi (Rp)</th>
                    <th className="py-3 px-2 min-w-[60px] text-center">Progres</th>
                  </>
                )}

                {viewMode === 'WORKING_VS_ACTUAL' && (
                  <>
                    <th className="py-3 px-3 min-w-[110px] text-right bg-blue-950/40 text-blue-300 font-bold">Vol Add. 4 (Working)</th>
                    <th className="py-3 px-3 min-w-[130px] text-right bg-blue-950/40 text-blue-300 font-bold">Nilai Add. 4 (Rp)</th>
                    <th className="py-3 px-3 min-w-[105px] text-right bg-emerald-950/40 text-emerald-300 font-bold">Vol Terpasang (MC)</th>
                    <th className="py-3 px-3 min-w-[130px] text-right bg-emerald-950/40 text-emerald-300 font-bold">Nilai Terpasang (Rp)</th>
                    <th className="py-3 px-3 min-w-[100px] text-right text-slate-300">Sisa Volume</th>
                    <th className="py-3 px-3 min-w-[120px] text-right text-slate-300">Sisa Nilai (Rp)</th>
                    <th className="py-3 px-2 min-w-[70px] text-center">Fisik %</th>
                  </>
                )}

                {viewMode === 'CCO_ANALYSIS' && (
                  <>
                    <th className="py-3 px-3 min-w-[95px] text-right text-slate-300">Vol Kontrak Awal</th>
                    <th className="py-3 px-3 min-w-[120px] text-right text-slate-300">Nilai Kontrak Awal</th>
                    <th className="py-3 px-3 min-w-[95px] text-right text-blue-300 font-bold">Vol Add. 4</th>
                    <th className="py-3 px-3 min-w-[120px] text-right text-blue-300 font-bold">Nilai Add. 4</th>
                    <th className="py-3 px-3 min-w-[90px] text-right bg-amber-950/30 text-amber-300 font-bold">&Delta; Vol CCO</th>
                    <th className="py-3 px-3 min-w-[130px] text-right bg-amber-950/30 text-amber-300 font-bold">&Delta; Nilai CCO (Rp)</th>
                    <th className="py-3 px-2 min-w-[70px] text-center">&Delta; %</th>
                  </>
                )}

                <th className="py-3 px-2 min-w-[70px] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {filteredItems.map(item => {
                const isEditing = editingItemId === item.id && editRowData !== null;

                const activeUnitPrice = isEditing ? (Number(editRowData.unitPrice) || 0) : item.unitPrice;
                const activeVolOrig = isEditing ? (Number(editRowData.volOriginal) || 0) : item.volOriginal;
                const activeVolAdd4 = isEditing ? (Number(editRowData.volAddendum4) || 0) : item.volAddendum4;
                const activeVolAct = isEditing ? (Number(editRowData.volActual) || 0) : item.volActual;

                const valOrig = activeVolOrig * activeUnitPrice;
                const valAdd4 = activeVolAdd4 * activeUnitPrice;
                const valAct = activeVolAct * activeUnitPrice;
                const pctProgress = activeVolAdd4 > 0 ? (activeVolAct / activeVolAdd4) * 100 : 0;

                const deltaVol = activeVolAdd4 - activeVolOrig;
                const deltaVal = deltaVol * activeUnitPrice;
                const deltaPct = valOrig > 0 ? (deltaVal / valOrig) * 100 : deltaVal > 0 ? 100 : 0;

                const remVol = activeVolAdd4 - activeVolAct;
                const remVal = remVol * activeUnitPrice;

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isEditing
                        ? 'bg-blue-950/30 ring-1 ring-blue-500/40'
                        : 'hover:bg-slate-800/60 group'
                    }`}
                  >
                    {/* Item Number */}
                    <td className="py-2.5 px-3 font-bold text-blue-400 whitespace-nowrap">
                      {item.itemNumber}
                    </td>

                    {/* Description (Editable inline) */}
                    <td className="py-2 px-3 font-sans text-slate-200">
                      {isEditing ? (
                        <div>
                          <input
                            type="text"
                            value={editRowData.description}
                            onChange={e => setEditRowData(prev => prev ? { ...prev, description: e.target.value } : null)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveEdit(item.id);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="w-full min-w-[220px] bg-slate-950 border border-blue-500 rounded-lg px-2.5 py-1.5 text-white font-sans text-xs focus:ring-2 focus:ring-blue-500/50 focus:outline-none shadow-inner"
                            placeholder="Uraian pekerjaan..."
                            autoFocus
                          />
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                            <span>{item.divisionId}</span>
                            <span className="text-blue-400 font-sans text-[10px]">Enter = simpan, Esc = batal</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-semibold text-white leading-tight">
                            {item.description}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                            <span className="text-slate-500">{item.divisionId}</span>
                            {item.wbsCodeRef && <span>• {item.wbsCodeRef}</span>}
                            {item.changeJustification && (
                              <span className="text-amber-400/90 truncate max-w-[280px]" title={item.changeJustification}>
                                • {item.changeJustification}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Unit (Editable inline) */}
                    <td className="py-2 px-2 text-center text-slate-400 font-sans">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editRowData.unit}
                          onChange={e => setEditRowData(prev => prev ? { ...prev, unit: e.target.value } : null)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveEdit(item.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="w-16 text-center bg-slate-950 border border-blue-500 rounded-lg px-1 py-1.5 text-white font-sans text-xs focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                          placeholder="Satuan"
                        />
                      ) : (
                        item.unit
                      )}
                    </td>

                    {/* Contractor */}
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.contractorId === 'WIKA'
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                            : item.contractorId === 'GI'
                            ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                            : 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {item.contractorId}
                      </span>
                    </td>

                    {/* Unit Price (Editable inline) */}
                    <td className="py-2 px-3 text-right text-slate-300">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editRowData.unitPrice}
                          onChange={e => setEditRowData(prev => prev ? { ...prev, unitPrice: Number(e.target.value) } : null)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveEdit(item.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="w-28 text-right bg-slate-950 border border-blue-500 rounded-lg px-2 py-1.5 text-white font-mono text-xs focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                          step="any"
                          min="0"
                          placeholder="0"
                        />
                      ) : (
                        item.unitPrice.toLocaleString('id-ID')
                      )}
                    </td>

                    {/* Columns by ViewMode */}
                    {viewMode === 'ALL_ADDENDUMS' && (
                      <>
                        {/* Vol Original (B0) (Editable inline) */}
                        <td className="py-2 px-2 text-right text-slate-400 bg-slate-900/30">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editRowData.volOriginal}
                              onChange={e => setEditRowData(prev => prev ? { ...prev, volOriginal: Number(e.target.value) } : null)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveEdit(item.id);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              className="w-20 text-right bg-slate-950 border border-slate-600 focus:border-blue-500 rounded-lg px-1.5 py-1 text-slate-200 font-mono text-xs focus:outline-none"
                              title="Volume Kontrak Awal (B0)"
                              step="any"
                            />
                          ) : (
                            item.volOriginal.toLocaleString('id-ID')
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-right text-slate-400 bg-slate-900/30">
                          {item.volAddendum1.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-2 text-right text-slate-400 bg-slate-900/30">
                          {item.volAddendum2.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-2 text-right text-slate-400 bg-slate-900/30">
                          {item.volAddendum3.toLocaleString('id-ID')}
                        </td>

                        {/* Vol Addendum 4 (Working) (Editable inline) */}
                        <td className="py-2 px-2 text-right font-bold text-blue-300 bg-blue-950/20">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editRowData.volAddendum4}
                              onChange={e => setEditRowData(prev => prev ? { ...prev, volAddendum4: Number(e.target.value) } : null)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveEdit(item.id);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              className="w-22 text-right bg-blue-950 border border-blue-400 rounded-lg px-1.5 py-1 text-blue-200 font-mono text-xs font-bold focus:ring-2 focus:ring-blue-400 focus:outline-none"
                              title="Kuantitas Addendum 4 (Working Contract)"
                              step="any"
                            />
                          ) : (
                            item.volAddendum4.toLocaleString('id-ID')
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-blue-400 bg-blue-950/20 whitespace-nowrap">
                          {formatShortIDR(valAdd4)}
                        </td>

                        {/* Vol Realisasi Actual */}
                        <td className="py-2 px-2 text-right font-bold text-emerald-300 bg-emerald-950/20">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editRowData.volActual}
                              onChange={e => setEditRowData(prev => prev ? { ...prev, volActual: Number(e.target.value) } : null)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveEdit(item.id);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              className="w-20 text-right bg-emerald-950 border border-emerald-500 rounded-lg px-1.5 py-1 text-emerald-200 font-mono text-xs font-bold focus:outline-none"
                              title="Kuantitas Realisasi Fisik (MC)"
                              step="any"
                            />
                          ) : (
                            item.volActual.toLocaleString('id-ID')
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-400 bg-emerald-950/20 whitespace-nowrap">
                          {formatShortIDR(valAct)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              pctProgress >= 80
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {pctProgress.toFixed(1)}%
                          </span>
                        </td>
                      </>
                    )}

                    {viewMode === 'WORKING_VS_ACTUAL' && (
                      <>
                        {/* Vol Addendum 4 (Working) */}
                        <td className="py-2 px-3 text-right font-bold text-blue-300 bg-blue-950/20">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editRowData.volAddendum4}
                              onChange={e => setEditRowData(prev => prev ? { ...prev, volAddendum4: Number(e.target.value) } : null)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveEdit(item.id);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              className="w-24 text-right bg-blue-950 border border-blue-400 rounded-lg px-2 py-1.5 text-blue-200 font-mono text-xs font-bold focus:ring-2 focus:ring-blue-400 focus:outline-none"
                              title="Kuantitas Addendum 4 (Working)"
                              step="any"
                            />
                          ) : (
                            item.volAddendum4.toLocaleString('id-ID')
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-blue-400 bg-blue-950/20 whitespace-nowrap">
                          {formatShortIDR(valAdd4)}
                        </td>

                        {/* Vol Realisasi Actual */}
                        <td className="py-2 px-3 text-right font-bold text-emerald-300 bg-emerald-950/20">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editRowData.volActual}
                              onChange={e => setEditRowData(prev => prev ? { ...prev, volActual: Number(e.target.value) } : null)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveEdit(item.id);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              className="w-24 text-right bg-emerald-950 border border-emerald-500 rounded-lg px-2 py-1.5 text-emerald-200 font-mono text-xs font-bold focus:outline-none"
                              title="Kuantitas Terpasang (MC)"
                              step="any"
                            />
                          ) : (
                            item.volActual.toLocaleString('id-ID')
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-400 bg-emerald-950/20 whitespace-nowrap">
                          {formatShortIDR(valAct)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400">
                          {remVol.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400 whitespace-nowrap">
                          {formatShortIDR(remVal)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              pctProgress >= 80
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {pctProgress.toFixed(1)}%
                          </span>
                        </td>
                      </>
                    )}

                    {viewMode === 'CCO_ANALYSIS' && (
                      <>
                        {/* Vol Kontrak Awal */}
                        <td className="py-2 px-3 text-right text-slate-400">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editRowData.volOriginal}
                              onChange={e => setEditRowData(prev => prev ? { ...prev, volOriginal: Number(e.target.value) } : null)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveEdit(item.id);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              className="w-22 text-right bg-slate-950 border border-slate-600 focus:border-blue-500 rounded-lg px-1.5 py-1 text-white font-mono text-xs focus:outline-none"
                              step="any"
                            />
                          ) : (
                            item.volOriginal.toLocaleString('id-ID')
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400 whitespace-nowrap">
                          {formatShortIDR(valOrig)}
                        </td>

                        {/* Vol Addendum 4 */}
                        <td className="py-2 px-3 text-right font-bold text-blue-300">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editRowData.volAddendum4}
                              onChange={e => setEditRowData(prev => prev ? { ...prev, volAddendum4: Number(e.target.value) } : null)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveEdit(item.id);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              className="w-22 text-right bg-blue-950 border border-blue-400 rounded-lg px-1.5 py-1 text-blue-200 font-mono text-xs font-bold focus:outline-none"
                              step="any"
                            />
                          ) : (
                            item.volAddendum4.toLocaleString('id-ID')
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-blue-400 whitespace-nowrap">
                          {formatShortIDR(valAdd4)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold bg-amber-950/20">
                          <span className={deltaVol > 0 ? 'text-emerald-400' : deltaVol < 0 ? 'text-rose-400' : 'text-slate-400'}>
                            {deltaVol > 0 ? `+${deltaVol.toLocaleString('id-ID')}` : deltaVol.toLocaleString('id-ID')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold bg-amber-950/20 whitespace-nowrap">
                          <span className={deltaVal > 0 ? 'text-emerald-400' : deltaVal < 0 ? 'text-rose-400' : 'text-slate-400'}>
                            {deltaVal > 0 ? `+${formatShortIDR(deltaVal)}` : deltaVal < 0 ? `-${formatShortIDR(Math.abs(deltaVal))}` : 'Rp 0'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold">
                          <span className={deltaPct > 0 ? 'text-emerald-400' : deltaPct < 0 ? 'text-rose-400' : 'text-slate-500'}>
                            {deltaPct > 0 ? `+${deltaPct.toFixed(1)}%` : `${deltaPct.toFixed(1)}%`}
                          </span>
                        </td>
                      </>
                    )}

                    {/* Action Column (Edit Inline / Save / Cancel / Detail) */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer transition-colors"
                            title="Simpan Perubahan (Enter)"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors"
                            title="Batal (Esc)"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-blue-600/20 transition-colors cursor-pointer"
                            title="Edit Langsung di Tabel (Uraian, Satuan, Kuantitas, Harga)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedItemDetail(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Lihat Rincian Justifikasi & Rekam Jejak Addendum"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer Totals */}
            <tfoot>
              <tr className="bg-slate-950 border-t-2 border-slate-700 font-mono font-bold text-xs">
                <td colSpan={4} className="py-3 px-3 text-white font-sans uppercase">
                  TOTAL KONTRAK HARBOUR ROAD II:
                </td>
                <td className="py-3 px-3 text-right text-slate-400">-</td>

                {viewMode === 'ALL_ADDENDUMS' && (
                  <>
                    <td className="py-3 px-2 text-right text-slate-400">-</td>
                    <td className="py-3 px-2 text-right text-slate-400">-</td>
                    <td className="py-3 px-2 text-right text-slate-400">-</td>
                    <td className="py-3 px-2 text-right text-slate-400">-</td>
                    <td className="py-3 px-2 text-right text-blue-300">-</td>
                    <td className="py-3 px-3 text-right text-blue-400 font-black">
                      {formatShortIDR(totals.add4)}
                    </td>
                    <td className="py-3 px-2 text-right text-emerald-300">-</td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-black">
                      {formatShortIDR(totals.act)}
                    </td>
                    <td className="py-3 px-2 text-center text-emerald-400">
                      {totals.financialProgress.toFixed(1)}%
                    </td>
                  </>
                )}

                {viewMode === 'WORKING_VS_ACTUAL' && (
                  <>
                    <td className="py-3 px-3 text-right text-blue-300">-</td>
                    <td className="py-3 px-3 text-right text-blue-400 font-black">
                      {formatShortIDR(totals.add4)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-300">-</td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-black">
                      {formatShortIDR(totals.act)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">-</td>
                    <td className="py-3 px-3 text-right text-slate-200 font-black">
                      {formatShortIDR(totals.remainingBalance)}
                    </td>
                    <td className="py-3 px-2 text-center text-emerald-400">
                      {totals.financialProgress.toFixed(1)}%
                    </td>
                  </>
                )}

                {viewMode === 'CCO_ANALYSIS' && (
                  <>
                    <td className="py-3 px-3 text-right text-slate-400">-</td>
                    <td className="py-3 px-3 text-right text-slate-300">
                      {formatShortIDR(totals.orig)}
                    </td>
                    <td className="py-3 px-3 text-right text-blue-300">-</td>
                    <td className="py-3 px-3 text-right text-blue-400 font-black">
                      {formatShortIDR(totals.add4)}
                    </td>
                    <td className="py-3 px-3 text-right text-amber-300">-</td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-black">
                      +{formatShortIDR(totals.deltaFromOriginal)}
                    </td>
                    <td className="py-3 px-2 text-center text-emerald-400">
                      +{totals.deltaPercentage.toFixed(2)}%
                    </td>
                  </>
                )}

                <td className="py-3 px-2 text-center">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* MODAL 1: Detail Item BOQ & Rekam Jejak Addendum */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-mono text-blue-400 font-bold">
                  Mata Pembayaran: {selectedItemDetail.itemNumber}
                </span>
                <h3 className="text-base font-bold text-white leading-snug mt-0.5">
                  {selectedItemDetail.description}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-400 text-[11px]">Divisi:</span>
                  <div className="text-white font-sans font-bold">{selectedItemDetail.divisionName}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Kontraktor Pelaksana:</span>
                  <div className="text-blue-400 font-bold">{selectedItemDetail.contractorId}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Harga Satuan Kontrak:</span>
                  <div className="text-emerald-400 font-bold">
                    Rp {selectedItemDetail.unitPrice.toLocaleString('id-ID')} / {selectedItemDetail.unit}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Realisasi Fisik Terpasang:</span>
                  <div className="text-white font-bold">
                    {selectedItemDetail.volActual.toLocaleString('id-ID')} {selectedItemDetail.unit} (
                    {selectedItemDetail.volAddendum4 > 0
                      ? ((selectedItemDetail.volActual / selectedItemDetail.volAddendum4) * 100).toFixed(1)
                      : 0}
                    %)
                  </div>
                </div>
              </div>

              {/* Volume Comparison Table Across Addendums */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-bold text-white text-xs">Perubahan Volume Antar Addendum:</span>
                <div className="grid grid-cols-5 gap-2 text-center font-mono">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Kontrak Awal</div>
                    <div className="font-bold text-white mt-1">
                      {selectedItemDetail.volOriginal.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Add. 1</div>
                    <div className="font-bold text-white mt-1">
                      {selectedItemDetail.volAddendum1.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Add. 2</div>
                    <div className="font-bold text-white mt-1">
                      {selectedItemDetail.volAddendum2.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Add. 3</div>
                    <div className="font-bold text-white mt-1">
                      {selectedItemDetail.volAddendum3.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-blue-950/60 border border-blue-500/40">
                    <div className="text-[10px] text-blue-300 font-bold">Add. 4 (Akhir)</div>
                    <div className="font-black text-blue-400 mt-1">
                      {selectedItemDetail.volAddendum4.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Justification & CCO Notes */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-bold text-amber-300">Justifikasi Teknis &amp; Rekayasa CCO:</div>
                <p className="text-slate-300 leading-relaxed">
                  {selectedItemDetail.changeJustification || 'Tidak ada perubahan volume dari spesifikasi awal.'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Legal Addendum Meta Viewer */}
      {selectedLegalAddendum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedLegalAddendum.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {selectedLegalAddendum.contractNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLegalAddendum(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-400 text-[11px]">Tanggal Penetapan:</span>
                  <div className="text-white font-bold">{selectedLegalAddendum.date}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Target Akhir PHO:</span>
                  <div className="text-blue-400 font-bold">{selectedLegalAddendum.targetPHO}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Total Nilai Addendum:</span>
                  <div className="text-emerald-400 font-black text-sm">
                    {formatShortIDR(selectedLegalAddendum.totalValue)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Perubahan Nilai (&Delta;):</span>
                  <div className="text-amber-400 font-bold">
                    {selectedLegalAddendum.deltaValue > 0
                      ? `+${formatShortIDR(selectedLegalAddendum.deltaValue)} (+${selectedLegalAddendum.deltaPercentage}%)`
                      : 'Rp 0 (CCO Nol Rupiah)'}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-blue-300">Dasar Hukum &amp; Rekomendasi:</span>
                <p className="text-slate-300 leading-relaxed font-sans">
                  {selectedLegalAddendum.legalBasis}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-white">Pokok-Pokok Perubahan Teknis:</span>
                <ul className="space-y-1 text-slate-300 font-sans list-disc list-inside">
                  {selectedLegalAddendum.mainChanges.map((change, idx) => (
                    <li key={idx}>{change}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLegalAddendum(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Tambah Item BOQ / CCO Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Tambah Mata Pembayaran / CCO Baru</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">No. Mata Pembayaran:</label>
                  <input
                    type="text"
                    value={newItem.itemNumber}
                    onChange={e => setNewItem({ ...newItem, itemNumber: e.target.value })}
                    placeholder="Contoh: 7.2.(4)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Satuan:</label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                    placeholder="m3 / m / ton / Ls"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Uraian Pekerjaan:</label>
                <input
                  type="text"
                  value={newItem.description}
                  onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Deskripsi spesifikasi pekerjaan..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Divisi:</label>
                  <select
                    value={newItem.divisionId}
                    onChange={e => {
                      const divId = e.target.value as BOQDivisionId;
                      const names: Record<string, string> = {
                        'DIV-1': 'Divisi 1: Umum & Fasilitas',
                        'DIV-2': 'Divisi 2: Drainase & Saluran',
                        'DIV-3': 'Divisi 3: Pekerjaan Tanah',
                        'DIV-7': 'Divisi 7: Struktur Tol Elevated',
                        'DIV-8': 'Divisi 8: Pengembalian Kondisi & Minor',
                        'DIV-9': 'Divisi 9: Relokasi Utilitas & CCO'
                      };
                      setNewItem({ ...newItem, divisionId: divId, divisionName: names[divId] });
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="DIV-1">Divisi 1: Umum</option>
                    <option value="DIV-2">Divisi 2: Drainase</option>
                    <option value="DIV-3">Divisi 3: Pekerjaan Tanah</option>
                    <option value="DIV-7">Divisi 7: Struktur Utama</option>
                    <option value="DIV-8">Divisi 8: Minor &amp; Perlengkapan</option>
                    <option value="DIV-9">Divisi 9: Relokasi Utilitas</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Kontraktor:</label>
                  <select
                    value={newItem.contractorId}
                    onChange={e => setNewItem({ ...newItem, contractorId: e.target.value as ContractorId })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="WIKA">WIKA</option>
                    <option value="GI">GI</option>
                    <option value="WIKA-GI">WIKA-GI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Harga Satuan Kontrak (Rp):</label>
                <input
                  type="number"
                  value={newItem.unitPrice || ''}
                  onChange={e => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                  placeholder="Rp..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Volume Addendum 4 (Working):</label>
                  <input
                    type="number"
                    value={newItem.volAddendum4 || ''}
                    onChange={e => setNewItem({ ...newItem, volAddendum4: Number(e.target.value) })}
                    placeholder="Volume..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Volume Realisasi Lapangan:</label>
                  <input
                    type="number"
                    value={newItem.volActual || ''}
                    onChange={e => setNewItem({ ...newItem, volActual: Number(e.target.value) })}
                    placeholder="Volume terpasang..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Justifikasi Pekerjaan Tambah (CCO):</label>
                <textarea
                  value={newItem.changeJustification}
                  onChange={e => setNewItem({ ...newItem, changeJustification: e.target.value })}
                  placeholder="Alasan perubahan spesifikasi atau justifikasi kondisi lapangan..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Batal
              </button>
              <button
                onClick={handleSaveNewItem}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                Simpan Item BOQ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
