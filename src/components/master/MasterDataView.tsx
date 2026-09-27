import React, { useState, useEffect } from 'react';
import {
  Database,
  Building2,
  Calendar,
  Users,
  Shield,
  Layers,
  MapPin,
  CheckCircle2,
  Settings,
  Plus,
  FileSpreadsheet,
  ExternalLink,
  UploadCloud,
  RefreshCw,
  Sparkles,
  Folder,
  FolderCheck,
  Check,
  Download
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { UserRole } from '../../types';
import { googleWorkspace, DEFAULT_DATABASE_FOLDER } from '../../services/googleWorkspace';
import { syncDatabaseToSingleGoogleSheet, exportSingleDatabaseWorkbook } from '../../services/singleGoogleSheetSync';

interface MasterDataViewProps {
  initialTab?: 'project' | 'zones' | 'contractors' | 'calendar' | 'roles' | 'database';
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({ initialTab = 'project' }) => {
  const {
    project,
    zones,
    piers,
    wbs,
    activities,
    dailyProgress,
    weeklyProgress,
    monthlyProgress,
    constraints,
    issues,
    actions,
    materials,
    equipment,
    manpower,
    contractors,
    currentRole,
    setCurrentRole,
    contractorUser,
    setContractorUser,
    canEdit
  } = useProject();

  const [activeTab, setActiveTab] = useState<'project' | 'zones' | 'contractors' | 'calendar' | 'roles' | 'database'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [driveFolder, setDriveFolder] = useState(() => googleWorkspace.getStoredFolder());
  const [connectedSheet, setConnectedSheet] = useState(googleWorkspace.getStoredSpreadsheet());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    setConnectedSheet(googleWorkspace.getStoredSpreadsheet());
    setDriveFolder(googleWorkspace.getStoredFolder());
  }, [activeTab]);

  const handleCreateAndSyncInFolder = async () => {
    setIsInitializing(true);
    setSyncStatus(null);
    try {
      if (!googleWorkspace.isAuthenticated()) {
        await googleWorkspace.requestLogin();
      }
      const targetFolderId = driveFolder?.id || DEFAULT_DATABASE_FOLDER.id;
      const created = await googleWorkspace.createSingleDatabaseSpreadsheet('DATABASE_MASTER_HBR2_PROYEK', targetFolderId);
      
      const contextData = {
        project,
        piers,
        wbs,
        activities,
        dailyProgress,
        weeklyProgress,
        monthlyProgress,
        constraints,
        issues,
        actions,
        materials,
        equipment,
        manpower
      };
      const res = await syncDatabaseToSingleGoogleSheet(created.spreadsheetId, contextData);
      const newSheet = {
        id: created.spreadsheetId,
        title: 'DATABASE_MASTER_HBR2_PROYEK',
        url: res.spreadsheetUrl,
        lastSync: res.timestamp
      };
      setConnectedSheet(newSheet);
      setSyncStatus('File database (1 File - 10 Tab) berhasil dibuat langsung di folder Google Drive dan disinkronkan!');
    } catch (err: any) {
      setSyncStatus(err.message || 'Gagal menginisialisasi database di folder Google Drive');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDownloadWorkbook = () => {
    const contextData = {
      project,
      piers,
      wbs,
      activities,
      dailyProgress,
      weeklyProgress,
      monthlyProgress,
      constraints,
      issues,
      actions,
      materials,
      equipment,
      manpower
    };
    exportSingleDatabaseWorkbook(contextData, 'DATABASE_MASTER_HBR2_PROYEK.xlsx');
  };

  const handleQuickSync = async () => {
    if (!connectedSheet) return;
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const contextData = {
        project,
        piers,
        wbs,
        activities,
        dailyProgress,
        weeklyProgress,
        monthlyProgress,
        constraints,
        issues,
        actions,
        materials,
        equipment,
        manpower
      };
      const res = await syncDatabaseToSingleGoogleSheet(connectedSheet.id, contextData);
      setConnectedSheet({
        ...connectedSheet,
        lastSync: res.timestamp
      });
      setSyncStatus('Sinkronisasi 10 tab ke 1 file Google Sheet berhasil!');
    } catch (err: any) {
      setSyncStatus(err.message || 'Gagal sinkronisasi data');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div id="master-data-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Master Data Management</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Konfigurasi parameter induk proyek HBR II: Profil Kontrak, Zonasi Trase, Kontraktor, Aturan Cutoff, dan Akses Pengguna
          </p>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex border-b border-slate-800 text-xs overflow-x-auto">
        {[
          { id: 'project', label: '1. Profil Proyek', icon: Building2 },
          { id: 'zones', label: '2. Master Zona (Zones)', icon: MapPin },
          { id: 'contractors', label: '3. Master Kontraktor', icon: Building2 },
          { id: 'calendar', label: '4. Kalender & Cutoff', icon: Calendar },
          { id: 'roles', label: '5. Role & Hak Akses (RBAC)', icon: Shield },
          { id: 'database', label: '6. Database (1 File Google Sheet)', icon: FileSpreadsheet }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-blue-500 text-blue-400 bg-slate-800/30'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. PROJECT INFO */}
      {activeTab === 'project' && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Informasi Kontrak Proyek HBR II
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700">
              <span className="text-slate-400 text-[11px]">NAMA PROYEK</span>
              <div className="text-base font-bold text-white mt-1">{project.name}</div>
            </div>

            <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700">
              <span className="text-slate-400 text-[11px]">KODE PROYEK</span>
              <div className="text-base font-mono font-bold text-blue-400 mt-1">{project.code}</div>
            </div>

            <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700">
              <span className="text-slate-400 text-[11px]">PANJANG TRASE ELEVATED</span>
              <div className="text-base font-bold text-emerald-400 mt-1">{project.lengthKm} KM (Double Decker & Elevated)</div>
            </div>

            <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700">
              <span className="text-slate-400 text-[11px]">TOTAL JUMLAH ELEVATED PIER</span>
              <div className="text-base font-bold text-white font-mono mt-1">{project.totalPiers} Titik Pier (Jalur Selatan & Utara)</div>
            </div>

            <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700">
              <span className="text-slate-400 text-[11px]">TANGGAL MULAI KONTRAK</span>
              <div className="text-sm font-mono font-medium text-slate-200 mt-1">{project.startDate}</div>
            </div>

            <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700">
              <span className="text-slate-400 text-[11px]">TARGET SELESAI (FINISH)</span>
              <div className="text-sm font-mono font-medium text-slate-200 mt-1">{project.targetFinishDate}</div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ZONES */}
      {activeTab === 'zones' && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Pembagian Zona Konstruksi
            </h3>
            <span className="text-xs text-slate-400">Total: {zones.length} Zona</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-300 uppercase font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3">Zone ID</th>
                  <th className="p-3">Nama Zona</th>
                  <th className="p-3">Arah Jalur</th>
                  <th className="p-3">Rentang Pier</th>
                  <th className="p-3">Kontraktor Utama</th>
                  <th className="p-3">Deskripsi Area Trase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {zones.map(z => (
                  <tr key={z.zoneId} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-blue-400">{z.zoneId}</td>
                    <td className="p-3 font-bold text-white">{z.zoneName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                        Jalur {z.direction}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-semibold text-emerald-400">
                      {z.pierRangeStart} → {z.pierRangeEnd}
                    </td>
                    <td className="p-3 font-bold text-slate-200">{z.contractorId}</td>
                    <td className="p-3 text-slate-400">{z.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. CONTRACTORS */}
      {activeTab === 'contractors' && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Master Data Kontraktor Pelaksana
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {contractors.map(c => (
              <div key={c.id} className="p-5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-400" />
                    <span className="text-base font-bold text-white">{c.name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-500/20 text-blue-300">
                    {c.id}
                  </span>
                </div>

                <div className="space-y-1.5 text-slate-300 pt-2 border-t border-slate-700/60">
                  <div>
                    <span className="text-slate-400">Lingkup Pekerjaan:</span> {c.scope}
                  </div>
                  <div>
                    <span className="text-slate-400">Zona Penugasan:</span>{' '}
                    <strong className="text-white">{c.assignedZones.join(', ')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Project Manager:</span> {c.pic}
                  </div>
                  <div>
                    <span className="text-slate-400">Kontak:</span> {c.contact}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CALENDAR & CUTOFF */}
      {activeTab === 'calendar' && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Aturan Baku Kalender & Periode Cutoff PME
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-5 rounded-xl bg-blue-950/30 border border-blue-800/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-300 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Cutoff Progres Mingguan (Weekly)</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Hari Cutoff Baku: <strong className="text-white">Setiap Hari JUMAT pukul 23:59 WIB</strong>
              </p>
              <p className="text-slate-400 text-[11px]">
                Data daily progress yang masuk hingga hari Jumat diagregasikan menjadi capaian mingguan untuk Weekly Coordination Meeting (WCM) setiap hari Senin.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Cutoff Progres Bulanan (Monthly Certification)</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Tanggal Cutoff Baku: <strong className="text-white">Setiap Tanggal 25 pukul 23:59 WIB</strong>
              </p>
              <p className="text-slate-400 text-[11px]">
                Digunakan sebagai dasar penerbitan Monthly Progress Certificate (MPC) dan klaim pembayaran termin prestasi pekerjaan fisik.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. ROLES (RBAC) */}
      {activeTab === 'roles' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-6 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Role-Based Access Control (RBAC): PME &amp; Viewer
                </h3>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Konfigurasi otorisasi sistem difokuskan pada 2 peran utama: <strong>PME (Project Control / Editor)</strong> dan <strong>Viewer (Read-Only Stakeholder)</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs">Peran Aktif:</span>
              <span
                className={`px-3 py-1 rounded-full font-mono font-bold text-xs ${
                  currentRole === 'Viewer'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}
              >
                {currentRole === 'Viewer' ? 'Viewer (Read-Only)' : 'PME (Editor)'}
              </span>
            </div>
          </div>

          {/* Primary Cards: PME vs Viewer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: PME */}
            <div
              onClick={() => setCurrentRole('PME')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                currentRole === 'PME' || currentRole === 'Admin'
                  ? 'bg-blue-950/40 border-blue-500 shadow-lg ring-1 ring-blue-500/50'
                  : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800/80 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>PME (Project Monitoring &amp; Evaluation)</span>
                      {(currentRole === 'PME' || currentRole === 'Admin') && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </h4>
                    <span className="text-[11px] text-blue-300 font-mono">Lead Project Control &amp; Planner</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Full Editor Access
                </span>
              </div>

              <p className="text-slate-300 text-[11px] leading-relaxed">
                Peran pengendali utama untuk tim Project Control, Planner, dan Site Monitoring. Memiliki otorisasi penuh untuk melakukan input, update jadwal teknis, pembaruan master pier, serta pengelolaan mitigasi.
              </p>

              <div className="pt-2 border-t border-slate-700/60 space-y-1.5 text-[11px] text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Input &amp; simpan progres harian, cutoff mingguan (Jumat) &amp; bulanan (25)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Tambah, edit, dan hapus basis data Master Pier Elevated &amp; BOQ</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Update jadwal WBS teknis (rencana mulai, rencana selesai, aktual)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Registrasi kendala utilitas/lahan, issue kritis, &amp; recovery plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Import data dari spreadsheet Excel &amp; sinkronisasi otomatis</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentRole('PME')}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer mt-2 ${
                  currentRole === 'PME' || currentRole === 'Admin'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }`}
              >
                {currentRole === 'PME' || currentRole === 'Admin' ? 'Peran PME Sedang Aktif' : 'Aktifkan Peran PME'}
              </button>
            </div>

            {/* Card 2: Viewer */}
            <div
              onClick={() => setCurrentRole('Viewer')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                currentRole === 'Viewer'
                  ? 'bg-purple-950/40 border-purple-500 shadow-lg ring-1 ring-purple-500/50'
                  : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800/80 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Viewer (Stakeholder &amp; Direksi)</span>
                      {currentRole === 'Viewer' && (
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                      )}
                    </h4>
                    <span className="text-[11px] text-purple-300 font-mono">Executive &amp; Read-Only Audience</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Read-Only Mode
                </span>
              </div>

              <p className="text-slate-300 text-[11px] leading-relaxed">
                Peran pengawasan khusus untuk Direksi BUJT, Owner/Kementerian PUPR, Konsultan Supervisi, Auditor, dan Tamu Eksekutif. Melindungi integritas data tanpa risiko perubahan atau penghapusan data secara tidak sengaja.
              </p>

              <div className="pt-2 border-t border-slate-700/60 space-y-1.5 text-[11px] text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Akses visualisasi Dashboard Eksekutif, Stripmap Pier, &amp; Kurva-S</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Membaca rincian Master Tabel Pier, 9 major items, &amp; status BOQ</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Melihat dokumentasi galeri foto progres lapangan &amp; recovery plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Mengekspor laporan ke format Excel (.xlsx) &amp; presentasi PDF</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="w-3.5 h-3.5 flex items-center justify-center font-bold text-rose-400">✕</span>
                  <span>Tombol Tambah, Edit, Hapus, dan Import dinonaktifkan secara aman</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentRole('Viewer')}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer mt-2 ${
                  currentRole === 'Viewer'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }`}
              >
                {currentRole === 'Viewer' ? 'Peran Viewer Sedang Aktif' : 'Aktifkan Peran Viewer'}
              </button>
            </div>
          </div>

          {/* Permissions Matrix Comparison Table */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden space-y-0">
            <div className="p-3.5 border-b border-slate-800 bg-slate-950">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                Matriks Hak Akses &amp; Otoritas (PME vs Viewer)
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                    <th className="py-2.5 px-4">Modul / Tindakan Sistem</th>
                    <th className="py-2.5 px-4 text-center text-blue-400">Role PME (Editor)</th>
                    <th className="py-2.5 px-4 text-center text-purple-400">Role Viewer (Read-Only)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-4 font-semibold text-white">Monitoring Dashboard KPI &amp; Kurva-S</td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-400">✓ Akses Penuh</td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-400">✓ Akses Penuh</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-4 font-semibold text-white">Visualisasi Stripmap Pier &amp; Heatmap</td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-400">✓ Akses Penuh</td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-400">✓ Akses Penuh</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-4 font-semibold text-white">Input Daily Progress &amp; Approval Mingguan</td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-400">✓ Boleh Input &amp; Simpan</td>
                    <td className="py-2.5 px-4 text-center font-bold text-rose-400">✕ Hanya Lihat (Disabled)</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-4 font-semibold text-white">Tambah, Edit, &amp; Hapus Data Master Pier</td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-400">✓ Boleh CRUD</td>
                    <td className="py-2.5 px-4 text-center font-bold text-rose-400">✕ Tombol Dinonaktifkan</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-4 font-semibold text-white">Update Jadwal Teknis WBS &amp; Target</td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-400">✓ Boleh Edit Jadwal</td>
                    <td className="py-2.5 px-4 text-center font-bold text-rose-400">✕ Hanya Lihat Jadwal</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-4 font-semibold text-white">Input Kendala Lahan/Utilitas &amp; Isu</td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-400">✓ Boleh Registrasi</td>
                    <td className="py-2.5 px-4 text-center font-bold text-rose-400">✕ Hanya Membaca Rekap</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-4 font-semibold text-white">Upload Dokumentasi Foto Lapangan</td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-400">✓ Boleh Upload</td>
                    <td className="py-2.5 px-4 text-center font-bold text-rose-400">✕ Hanya Membuka Galeri</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-4 font-semibold text-white">Ekspor Data &amp; Laporan ke Excel (.xlsx)</td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-400">✓ Diizinkan</td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-400">✓ Diizinkan</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. DATABASE (1 FILE GOOGLE SHEET) */}
      {activeTab === 'database' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Database Master Tunggal: 1 File Google Sheet
                </h3>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Seluruh data proyek dikonsolidasi ke dalam <strong>1 File Google Spreadsheet Utama</strong> (Single Source of Truth) yang berisi 10 tab modul.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs">Status File:</span>
              <span
                className={`px-3 py-1 rounded-full font-mono font-bold text-xs ${
                  connectedSheet
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {connectedSheet ? 'Terhubung (1 File)' : 'Belum Terhubung'}
              </span>
            </div>
          </div>

          {/* 1. Lokasi Database Google Drive Folder */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Lokasi Folder Database Google Drive:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Terhubung
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">
                    {driveFolder?.name || DEFAULT_DATABASE_FOLDER.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Folder ID: <strong className="text-blue-400">{driveFolder?.id || DEFAULT_DATABASE_FOLDER.id}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={driveFolder?.url || DEFAULT_DATABASE_FOLDER.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>Buka Folder di Google Drive</span>
                </a>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5 leading-relaxed">
              📍 File spreadsheet tunggal <strong>DATABASE_MASTER_HBR2_PROYEK</strong> beserta arsip sinkronisasi dan foto dokumentasi proyek disimpan secara terpusat di folder Google Drive ini.
            </p>
          </div>

          {/* 2. Connected Sheet Card (Single Spreadsheet File) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">File Spreadsheet Database Aktif:</span>
                  <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                    {connectedSheet ? connectedSheet.title : 'DATABASE_MASTER_HBR2_PROYEK'}
                  </div>
                  {connectedSheet ? (
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Spreadsheet ID: {connectedSheet.id}
                    </div>
                  ) : (
                    <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                      Belum diinisialisasi di folder Drive. Klik tombol untuk membuat file 10 tab sekarang.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleDownloadWorkbook}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Unduh seluruh 10 tab database master dalam 1 file Excel (.xlsx)"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Unduh File Excel (.xlsx)</span>
                </button>

                {connectedSheet?.url && (
                  <a
                    href={connectedSheet.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    <span>Buka di Google Sheets</span>
                  </a>
                )}

                {canEdit && connectedSheet && (
                  <button
                    onClick={handleQuickSync}
                    disabled={isSyncing}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan 10 Tab Sekarang'}</span>
                  </button>
                )}

                {canEdit && !connectedSheet && (
                  <button
                    onClick={handleCreateAndSyncInFolder}
                    disabled={isInitializing}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{isInitializing ? 'Membuat File di Folder Drive...' : 'Buat 1 File Database di Google Drive'}</span>
                  </button>
                )}
              </div>
            </div>

            {connectedSheet?.lastSync && (
              <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-between">
                <span>Sinkronisasi Terakhir: <strong>{new Date(connectedSheet.lastSync).toLocaleString('id-ID')}</strong></span>
                {syncStatus && <span className="text-emerald-400 font-semibold">{syncStatus}</span>}
              </div>
            )}
            {!connectedSheet && syncStatus && (
              <div className="text-[11px] text-emerald-400 border-t border-slate-800/80 pt-2 font-semibold">
                {syncStatus}
              </div>
            )}
          </div>

          {/* 3. Cara Penggunaan / Penempatan Database */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2.5">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>2 Opsi Pembuatan &amp; Penempatan Database di Folder Google Drive:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-700/60 space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5" /> Opsi 1: Otomatis Langsung di Google Drive
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Klik tombol <strong>"Buat 1 File Database di Google Drive"</strong> di atas. Sistem akan membuat file spreadsheet <code>DATABASE_MASTER_HBR2_PROYEK</code> langsung di dalam folder <code>1US-vwhcJXlfEgFCKlgZFZWKTgqJQy5eO</code> dan mengisinya dengan 10 tab lengkap.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-700/60 space-y-1">
                <div className="font-bold text-blue-400 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" /> Opsi 2: Unduh File &amp; Upload ke Folder Drive
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Klik tombol <strong>"Unduh File Excel (.xlsx)"</strong> untuk memperoleh file master 10 tab siap pakai (berisi 505 baris pier, WBS, Progress, Cutoff, MC, BOQ, dll.). Anda dapat langsung menarik (*drag &amp; drop*) file tersebut ke <a href={driveFolder?.url || DEFAULT_DATABASE_FOLDER.url} target="_blank" rel="noreferrer" className="text-blue-400 underline font-semibold">Folder Google Drive HBR II</a>.
                </p>
              </div>
            </div>
          </div>

          {/* The 10 Tabs inside that single spreadsheet */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Daftar 10 Tab Lembar Kerja di Dalam 1 File Spreadsheet Ini:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { no: '01', tab: '01_Master_Piers', desc: 'Database Master Register Pier, 9 Major Items (titik), WBS, Terprogress & Tertagih' },
                { no: '02', tab: '02_WBS_Hierarchy', desc: 'Hirarki WBS Proyek L1 s/d L6 beserta kode aktivitas dan bobot' },
                { no: '03', tab: '03_Daily_Progress', desc: 'Log harian progres pekerjaan, volume terpasang, tenaga kerja, dan cuaca' },
                { no: '04', tab: '04_Weekly_Cutoff', desc: 'Data progres mingguan cutoff setiap hari Jumat pukul 23:59 WIB' },
                { no: '05', tab: '05_Monthly_MC', desc: 'Sertifikasi bulanan progress (Monthly Certificate) cutoff setiap tanggal 25' },
                { no: '06', tab: '06_BOQ_Contract', desc: 'Mata pembayaran BOQ Addendum 4, volume kontrak, dan harga satuan' },
                { no: '07', tab: '07_Constraints_Log', desc: 'Register kendala teknis, utilitas pipa/kabel, dan status pembebasan lahan' },
                { no: '08', tab: '08_Issues_Action', desc: 'Isu kritis, analisis akar masalah (root cause), dan tracking tindak lanjut' },
                { no: '09', tab: '09_Resources', desc: 'Monitoring ketersediaan material utama, alat berat, dan tenaga kerja' },
                { no: '10', tab: '10_Project_Profile', desc: 'Parameter kontrak induk HBR II, masa pelaksanaan, dan data pemangku kepentingan' }
              ].map(item => (
                <div key={item.tab} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-blue-400 font-mono font-bold text-[10px] shrink-0">
                    {item.no}
                  </span>
                  <div>
                    <div className="font-mono font-bold text-white text-xs">{item.tab}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
