import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Bell,
  BellRing,
  CheckCircle2,
  Sliders,
  Volume2,
  VolumeX,
  FileText,
  Send,
  ExternalLink,
  Flame,
  Search,
  Filter,
  Download,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldAlert,
  ArrowDownRight,
  TrendingDown,
  Building2,
  RefreshCw,
  Copy
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  PMEAlert,
  PMEAlertSettings,
  AlertSeverity,
  ContractorId,
  ActivityItem,
  ActionTrackerRecord
} from '../../types';

// Web Audio API Synth for Alert Sounds (Zero external dependencies)
function playPMEAlertSound(type: 'critical' | 'warning' | 'ack') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'critical') {
      // Double high-pitch warning beep (880Hz -> 1046Hz)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1046, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'warning') {
      // Soft chime (587Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Gentle confirmation blip
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(784, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch {
    // Ignore audio permission or restriction errors
  }
}

// Known Project Context Recommendations and Constraints
const getContextualAdvice = (act: ActivityItem): { constraint: string; recommendation: string } => {
  const name = act.activityName.toLowerCase();
  const pier = (act.pierId || '').toLowerCase();

  if (name.includes('gas pgn') || pier.includes('p20') || pier.includes('p.20')) {
    return {
      constraint: 'Kendala utilitas crossing pipa gas transmisi PGN D16 inch dan pipa PAM Jaya yang belum tuntas direlokasi.',
      recommendation: 'Instruksikan tim WIKA koordinasi harian terpadu dengan Satgas PGN & PAM Jaya; siapkan metode proteksi steel casing pelindung.'
    };
  }
  if (name.includes('portal') || pier.includes('p56') || pier.includes('p.56') || name.includes('kai')) {
    return {
      constraint: 'Revisi gambar kerja (Shop Drawing) Pier Portal P.56A & pembatasan izin Window Time kerja malam PT KAI (maks 3 jam/malam).',
      recommendation: 'Ajukan penambahan personil crane double shift malam & percepat approval shop drawing bentang portal ke Konsultan Pengawas.'
    };
  }
  if (name.includes('bore pile') || name.includes('bored pile') || name.includes('pengeboran')) {
    return {
      constraint: 'Lensa batuan keras (boulder rock) pada kedalaman 18–22 meter dan kepadatan tanah alluvium pesisir Ancol.',
      recommendation: 'Mobilisasi rock roller bit tambahan & rig cadangan untuk mengejar target 2 titik bore pile per hari per zona.'
    };
  }
  if (name.includes('erection') || name.includes('box girder')) {
    return {
      constraint: 'Kepadatan lalu lintas jalan RE Martadinata / Lodan Raya dan keterbatasan manuver crawler crane kapasitas 250 Ton.',
      recommendation: 'Optimalkan manajemen rekayasa lalu lintas bersama Dishub DKI; jalankan erection bertahap pada window malam (23:00 - 04:30 WIB).'
    };
  }
  if (name.includes('clearing') || name.includes('lahan') || name.includes('akses')) {
    return {
      constraint: 'Akses manuver alat berat terhambat bangunan semi-permanen dan relokasi kabel fiber optik serta tiang PLN.',
      recommendation: 'Eskalasi ke bagian Pengadaan Lahan (P2T) dan PPK Pengadaan Tanah Kementerian PUPR untuk percepatan konsinyasi.'
    };
  }

  return {
    constraint: 'Deviasi capaian progres fisik lapangan berada jauh di bawah kurva target rencana.',
    recommendation: 'Minta Kontraktor Pelaksana menyampaikan Catch-Up Schedule revisi 1x24 jam disertai penambahan sumber daya dan jam lembur.'
  };
};

export const PMESCurveAlertSystem: React.FC = () => {
  const { activities, addAction, exportToExcel, project } = useProject();

  // Settings State
  const [settings, setSettings] = useState<PMEAlertSettings>(() => {
    const saved = localStorage.getItem('hbr2_pme_alert_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // use default
      }
    }
    return {
      enabled: true,
      criticalThreshold: 10,      // variance <= -10% -> Kritis
      warningThreshold: 5,        // variance <= -5% -> Peringatan
      criticalPathStrict: true,   // Critical path activities strictly flagged at <= -2%
      minWeightFilter: 0.05,      // Filter out tiny activities below 0.05% weight
      soundEnabled: true,
      filterContractor: 'ALL'
    };
  });

  // Acknowledged alerts tracking (stored in localStorage)
  const [acknowledgedIds, setAcknowledgedIds] = useState<Record<string, { at: string; by: string }>>(() => {
    const saved = localStorage.getItem('hbr2_pme_ack_alerts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // default empty
      }
    }
    return {};
  });

  // UI States
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'ACK'>('ALL');
  const [contractorTab, setContractorTab] = useState<ContractorId | 'ALL'>('ALL');
  const [criticalOnlyTab, setCriticalOnlyTab] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAlertForSPK, setSelectedAlertForSPK] = useState<PMEAlert | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedSPK, setCopiedSPK] = useState<boolean>(false);

  // Show toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Persist settings
  const updateSettings = (newSettings: PMEAlertSettings) => {
    setSettings(newSettings);
    localStorage.setItem('hbr2_pme_alert_settings', JSON.stringify(newSettings));
  };

  // Evaluate Activities against predefined thresholds
  const alerts: PMEAlert[] = useMemo(() => {
    if (!settings.enabled || !activities || activities.length === 0) return [];

    const list: PMEAlert[] = [];
    const nowStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    activities.forEach(act => {
      // Check contractor filter from settings
      if (settings.filterContractor !== 'ALL' && act.contractorId !== settings.filterContractor) {
        return;
      }

      // Check min weight filter
      if ((act.weight || 0) < settings.minWeightFilter) {
        return;
      }

      // Calculate variance (Actual - Planned)
      const planned = act.progressPlan ?? 0;
      const actual = act.progressActual ?? 0;
      const variance = Math.round((actual - planned) * 10) / 10;

      // Only trigger if progress is behind plan
      if (variance < 0) {
        const absVariance = Math.abs(variance);
        let severity: AlertSeverity | null = null;
        let thresholdBreached = 0;

        // Rule 1: Critical Path strict zero-tolerance
        if (settings.criticalPathStrict && act.isCritical && absVariance >= 2.0) {
          severity = 'CRITICAL';
          thresholdBreached = 2.0;
        }
        // Rule 2: Exceeds critical threshold
        else if (absVariance >= settings.criticalThreshold) {
          severity = 'CRITICAL';
          thresholdBreached = settings.criticalThreshold;
        }
        // Rule 3: Exceeds warning threshold
        else if (absVariance >= settings.warningThreshold) {
          severity = 'WARNING';
          thresholdBreached = settings.warningThreshold;
        }

        if (severity) {
          const ack = acknowledgedIds[act.activityId];
          const { constraint, recommendation } = getContextualAdvice(act);

          list.push({
            id: `ALERT-${act.activityId}`,
            activityId: act.activityId,
            activityName: act.activityName,
            wbsCode: act.wbsCode,
            pierId: act.pierId,
            contractorId: act.contractorId,
            weight: act.weight,
            plannedProgress: planned,
            actualProgress: actual,
            variance,
            thresholdBreached,
            severity,
            isCriticalPath: !!act.isCritical,
            status: ack ? 'ACKNOWLEDGED' : 'OPEN',
            acknowledgedAt: ack?.at,
            acknowledgedBy: ack?.by,
            recommendedAction: recommendation,
            constraintReason: constraint,
            detectedAt: nowStr
          });
        }
      }
    });

    // Sort by severity (CRITICAL first), then isCriticalPath, then largest negative variance
    return list.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'OPEN' ? -1 : 1;
      }
      if (a.severity !== b.severity) {
        return a.severity === 'CRITICAL' ? -1 : 1;
      }
      if (a.isCriticalPath !== b.isCriticalPath) {
        return a.isCriticalPath ? -1 : 1;
      }
      return a.variance - b.variance; // Most negative first
    });
  }, [activities, settings, acknowledgedIds]);

  // Alert summary counts
  const summary = useMemo(() => {
    const total = alerts.length;
    const critical = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'OPEN').length;
    const warning = alerts.filter(a => a.severity === 'WARNING' && a.status === 'OPEN').length;
    const ackCount = alerts.filter(a => a.status === 'ACKNOWLEDGED').length;
    const criticalPathCount = alerts.filter(a => a.isCriticalPath && a.status === 'OPEN').length;

    return { total, critical, warning, ackCount, criticalPathCount };
  }, [alerts]);

  // Audio cue when new critical alerts are detected
  useEffect(() => {
    if (settings.soundEnabled && summary.critical > 0) {
      // Play brief warning tone once on load or count increase
      const timer = setTimeout(() => {
        playPMEAlertSound('warning');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [summary.critical, settings.soundEnabled]);

  // Filtered alerts for list view
  const displayedAlerts = useMemo(() => {
    return alerts.filter(a => {
      // Severity / Ack filter
      if (filterSeverity === 'CRITICAL' && (a.severity !== 'CRITICAL' || a.status !== 'OPEN')) return false;
      if (filterSeverity === 'WARNING' && (a.severity !== 'WARNING' || a.status !== 'OPEN')) return false;
      if (filterSeverity === 'ACK' && a.status !== 'ACKNOWLEDGED') return false;

      // Contractor filter
      if (contractorTab !== 'ALL' && a.contractorId !== contractorTab) return false;

      // Critical path tab
      if (criticalOnlyTab && !a.isCriticalPath) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = a.activityName.toLowerCase().includes(q);
        const matchId = a.activityId.toLowerCase().includes(q);
        const matchPier = (a.pierId || '').toLowerCase().includes(q);
        const matchWbs = (a.wbsCode || '').toLowerCase().includes(q);
        if (!matchName && !matchId && !matchPier && !matchWbs) return false;
      }

      return true;
    });
  }, [alerts, filterSeverity, contractorTab, criticalOnlyTab, searchQuery]);

  // Toggle Acknowledge status
  const handleToggleAcknowledge = (alertItem: PMEAlert) => {
    const updated = { ...acknowledgedIds };
    if (updated[alertItem.activityId]) {
      delete updated[alertItem.activityId];
      setAcknowledgedIds(updated);
      localStorage.setItem('hbr2_pme_ack_alerts', JSON.stringify(updated));
      showToast(`Status alert ${alertItem.activityId} dikembalikan ke OPEN.`);
    } else {
      const at = new Date().toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      updated[alertItem.activityId] = { at, by: 'PME Lead (Progress Monitoring Engineer)' };
      setAcknowledgedIds(updated);
      localStorage.setItem('hbr2_pme_ack_alerts', JSON.stringify(updated));
      playPMEAlertSound('ack');
      showToast(`Aktivitas ${alertItem.activityId} ditandai SUDAH DITINJAU oleh PME.`);
    }
  };

  // Escalate directly to Project Action Tracker
  const handleEscalateToActionTracker = (alertItem: PMEAlert) => {
    const newAction: ActionTrackerRecord = {
      actionId: `ACT-REC-${Date.now().toString().slice(-4)}`,
      meeting: 'Rakor PME & S-Curve Monitoring',
      date: new Date().toISOString().split('T')[0],
      action: `[PME ALERT] Percepatan ${alertItem.activityName} (${alertItem.pierId || alertItem.activityId}) deviasi ${alertItem.variance}%`,
      pic: alertItem.contractorId === 'WIKA' ? 'Site Manager WIKA / Project Control' : 'Project Manager GI / Pelaksana Lapangan',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], // 7 days from now
      status: 'Open',
      remarks: `Dipicu otomatis dari deteksi Kurva-S: Realisasi ${alertItem.actualProgress}% vs Target ${alertItem.plannedProgress}%. Rekomendasi: ${alertItem.recommendedAction}`
    };

    const res = addAction(newAction);
    if (res.success) {
      playPMEAlertSound('ack');
      showToast(`Berhasil dieskalasi ke Action Tracker: ${newAction.actionId}`);
    } else {
      showToast(`Gagal menambahkan aksi: ${res.error || 'Terjadi kesalahan'}`);
    }
  };

  // Export Alerts to Excel
  const handleExportAlerts = () => {
    const rows = alerts.map(a => ({
      'ID Aktivitas': a.activityId,
      'Nama Aktivitas': a.activityName,
      'Kode WBS': a.wbsCode || '-',
      Pier: a.pierId || '-',
      Kontraktor: a.contractorId,
      'Bobot (%)': a.weight,
      'Rencana (%)': a.plannedProgress,
      'Realisasi (%)': a.actualProgress,
      'Deviasi Varians (%)': a.variance,
      Tingkat: a.severity,
      'Lintasan Kritis': a.isCriticalPath ? 'YA (CRITICAL PATH)' : 'TIDAK',
      Status: a.status,
      'Ditinjau Pada': a.acknowledgedAt || '-',
      'Ditinjau Oleh': a.acknowledgedBy || '-',
      'Kendala Lapangan': a.constraintReason || '-',
      'Rekomendasi PME': a.recommendedAction
    }));

    exportToExcel(
      `PME_Alert_Notifikasi_KurvaS_${new Date().toISOString().split('T')[0]}`,
      'PME S-Curve Alerts',
      rows
    );
  };

  // Generate Formal Warning Letter Text (Surat Peringatan / SPK)
  const generateSPKText = (alertItem: PMEAlert) => {
    const today = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const contractorName =
      alertItem.contractorId === 'WIKA'
        ? 'PT Wijaya Karya (Persero) Tbk'
        : 'PT Girder Indonesia';

    return `KONSULTAN PENGAWAS & MONITORING PROYEK
JALAN TOL HARBOUR ROAD II (ELEVATED) - PT CMNP
=============================================================
Nomor Surat : 044/PME-NOTIF/HBR2/${new Date().getMonth() + 1}/${new Date().getFullYear()}
Lampiran    : 1 (satu) Berkas Analisis Kurva-S
Perihal     : NOTIFIKASI TEGURAN KETERLAMBATAN FISIK PEKERJAAN (PME ALERT)

Kepada Yth.
General Superintendent / Project Manager
${contractorName}
Proyek Jalan Tol Harbour Road II (Elevated)
Di Tempat

Dengan hormat,

Sehubungan dengan hasil evaluasi periodik Progress Monitoring Engineer (PME) terhadap Kurva-S dan Master Schedule Addendum 4 Proyek Jalan Tol Harbour Road II (Elevated) per tanggal ${today}, dengan ini kami sampaikan notifikasi resmi deviasi pekerjaan:

1. Rincian Pekerjaan Terlambat:
   - ID Aktivitas    : ${alertItem.activityId} (${alertItem.wbsCode || 'WBS Terkait'})
   - Uraian Pekerjaan: ${alertItem.activityName}
   - Lokasi / Pier   : ${alertItem.pierId || 'Zona Terkait'}
   - Bobot Pekerjaan : ${alertItem.weight}%
   - Target Rencana  : ${alertItem.plannedProgress.toFixed(2)}%
   - Realisasi Aktual: ${alertItem.actualProgress.toFixed(2)}%
   - Deviasi/Slippage: ${alertItem.variance.toFixed(2)}% (Melewati ambang toleransi ${alertItem.thresholdBreached}%)
   - Status Kritis   : ${alertItem.isCriticalPath ? 'BERADA PADA LINTASAN KRITIS (CRITICAL PATH)' : 'Non-Critical Path'}

2. Analisis & Identifikasi Kendala:
   ${alertItem.constraintReason}

3. Instruksi Tindak Lanjut PME:
   Berdasarkan deviasi yang terjadi, Saudara diinstruksikan untuk:
   a. Menyusun dan menyerahkan Catch-Up Schedule revisi dalam waktu paling lambat 3 x 24 jam kalender.
   b. Menambah shift kerja lembur dan alat berat pendukung di lokasi tersebut.
   c. Mengimplementasikan rekomendasi teknis: "${alertItem.recommendedAction}".
   d. Menghadiri Rapat Koordinasi Khusus Percepatan Lapangan pada hari kerja berikutnya.

Demikian surat notifikasi dan teguran ini kami sampaikan untuk segera ditindaklanjuti demi kelancaran target penyelesaian proyek (PHO).

Jakarta, ${today}
Hormat kami,
Lead Progress Monitoring Engineer (PME)
Proyek Jalan Tol Harbour Road II (Elevated)

Tembusan:
1. Kuasa Pengguna Anggaran / Project Director PT CMNP
2. Konsultan Supervisi / Pengawas Rekayasa
3. Arsip PME Control`;
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white border border-blue-500/50 shadow-2xl shadow-blue-500/20 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Notification Card Banner */}
      <div
        id="pme-scurve-alert-container"
        className={`rounded-2xl border transition-all duration-300 shadow-xl overflow-hidden ${
          summary.critical > 0
            ? 'bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/50'
            : summary.warning > 0
            ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/50'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        {/* Banner Top Bar */}
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 min-w-0">
            {/* Pulsing Bell / Alert Icon */}
            <div
              className={`relative p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
                summary.critical > 0
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : summary.warning > 0
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
              }`}
            >
              <BellRing
                className={`w-5 h-5 ${
                  summary.critical > 0 ? 'animate-bounce text-rose-400' : ''
                }`}
              />
              {summary.total > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      summary.critical > 0 ? 'bg-rose-400' : 'bg-amber-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-4 w-4 text-[9px] font-black items-center justify-center text-white ${
                      summary.critical > 0 ? 'bg-rose-600' : 'bg-amber-600'
                    }`}
                  >
                    {summary.critical > 0 ? summary.critical : summary.warning}
                  </span>
                </span>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>PME Automated Alert System: Deteksi Keterlambatan Aktivitas</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Threshold: -{settings.criticalThreshold}% / -{settings.warningThreshold}%
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {summary.total === 0 ? (
                  <span className="text-emerald-400 font-medium">
                    ✓ Seluruh pekerjaan saat ini berada dalam batas toleransi aman Kurva-S.
                  </span>
                ) : (
                  <span>
                    Terdeteksi <strong className="text-rose-400 font-mono">{summary.total} aktivitas</strong>{' '}
                    mengalami kemunduran progres di bawah batas rencana (berkontribusi pada defisit S-Curve proyek -8.5%).
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Action Tools & Toggles */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Sound Toggle */}
            <button
              onClick={() => {
                const next = !settings.soundEnabled;
                updateSettings({ ...settings, soundEnabled: next });
                if (next) playPMEAlertSound('warning');
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                settings.soundEnabled
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 hover:bg-blue-600/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title={settings.soundEnabled ? 'Suara Alarm Aktif (Klik untuk matikan)' : 'Suara Alarm Mati (Klik untuk aktifkan)'}
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Threshold Settings Modal Trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold transition-all cursor-pointer shadow-xs"
              title="Sesuaikan Ambang Batas Keterlambatan"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Atur Threshold</span>
            </button>

            {/* Export Alerts */}
            {summary.total > 0 && (
              <button
                onClick={handleExportAlerts}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold transition-all cursor-pointer shadow-xs"
                title="Ekspor Rekap Alert ke Excel"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Ekspor Rekap</span>
              </button>
            )}

            {/* Expand / Collapse Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all cursor-pointer"
              title={isExpanded ? 'Sembunyikan Panel' : 'Buka Rincian Panel'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expandable Alert Content */}
        {isExpanded && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Quick KPI Badges / Filter Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setFilterSeverity('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterSeverity === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Semua Alert ({summary.total})</span>
                </button>

                <button
                  onClick={() => setFilterSeverity('CRITICAL')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterSeverity === 'CRITICAL'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-800/60 text-rose-400 hover:text-rose-300'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Kritis &le; -{settings.criticalThreshold}% ({summary.critical})</span>
                </button>

                <button
                  onClick={() => setFilterSeverity('WARNING')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterSeverity === 'WARNING'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-800/60 text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Peringatan &le; -{settings.warningThreshold}% ({summary.warning})</span>
                </button>

                <button
                  onClick={() => setFilterSeverity('ACK')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterSeverity === 'ACK'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-800/60 text-emerald-400 hover:text-emerald-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sudah Ditinjau PME ({summary.ackCount})</span>
                </button>
              </div>

              {/* Critical Path Toggle & Contractor Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setCriticalOnlyTab(!criticalOnlyTab)}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                    criticalOnlyTab
                      ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                      : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:text-slate-200'
                  }`}
                  title="Tampilkan hanya pekerjaan yang berada di Lintasan Kritis CPM"
                >
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Lintasan Kritis Saja ({summary.criticalPathCount})</span>
                </button>

                <div className="inline-flex p-0.5 rounded-lg bg-slate-900 border border-slate-800">
                  {(['ALL', 'WIKA', 'GI'] as const).map(c => (
                    <button
                      key={c}
                      onClick={() => setContractorTab(c)}
                      className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                        contractorTab === c
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

            {/* Search Input Filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari aktivitas terlambat berdasarkan nama, ID, atau Pier (misal: P.20.S, P.56A, bored pile)..."
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

            {/* List of Breached Activities */}
            {displayedAlerts.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800/80">
                <CheckCircle2 className="w-10 h-10 text-emerald-400/80 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">Tidak ada aktivitas yang melanggar filter ini</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Seluruh pekerjaan yang dievaluasi berada dalam batas deviasi yang diizinkan sesuai filter yang aktif.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {displayedAlerts.map(alertItem => {
                  const isAck = alertItem.status === 'ACKNOWLEDGED';
                  const isCrit = alertItem.severity === 'CRITICAL';

                  return (
                    <div
                      key={alertItem.id}
                      className={`p-4 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                        isAck
                          ? 'bg-slate-950/50 border-slate-800 opacity-75'
                          : isCrit
                          ? 'bg-gradient-to-br from-rose-950/30 via-slate-900 to-slate-900 border-rose-500/40 hover:border-rose-500/70 shadow-lg shadow-rose-950/20'
                          : 'bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900 border-amber-500/40 hover:border-amber-500/70'
                      }`}
                    >
                      {/* Left Accent Bar */}
                      <div
                        className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                          isAck
                            ? 'bg-emerald-500'
                            : isCrit
                            ? 'bg-rose-500 animate-pulse'
                            : 'bg-amber-500'
                        }`}
                      />

                      <div className="pl-2 space-y-3">
                        {/* Header: IDs, Contractor & Critical Tag */}
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                              <span className="font-bold text-blue-400">{alertItem.activityId}</span>
                              {alertItem.wbsCode && <span>• {alertItem.wbsCode}</span>}
                              {alertItem.pierId && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                                  {alertItem.pierId}
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-white mt-1 leading-snug">
                              {alertItem.activityName}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {alertItem.isCriticalPath && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                                <Flame className="w-3 h-3 text-rose-400" />
                                <span>Lintasan Kritis</span>
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                alertItem.contractorId === 'WIKA'
                                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                                  : 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {alertItem.contractorId}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bars & Variance Stat Box */}
                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Target Rencana:</span>
                            <span className="font-mono font-bold text-blue-400">
                              {alertItem.plannedProgress.toFixed(1)}%
                            </span>
                          </div>

                          {/* Progress Dual Bar */}
                          <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                            {/* Planned Target Line marker */}
                            <div
                              className="absolute top-0 bottom-0 bg-blue-500/30 z-0"
                              style={{ width: `${Math.min(100, alertItem.plannedProgress)}%` }}
                            />
                            {/* Actual Progress Fill */}
                            <div
                              className={`h-full rounded-full transition-all duration-500 relative z-10 ${
                                isCrit ? 'bg-rose-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, alertItem.actualProgress)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                            <div>
                              <span className="text-slate-400 text-[10px]">Realisasi Fisik: </span>
                              <strong
                                className={`font-mono ${
                                  isCrit ? 'text-rose-400' : 'text-amber-400'
                                }`}
                              >
                                {alertItem.actualProgress.toFixed(1)}%
                              </strong>
                            </div>

                            {/* Deviation Tag */}
                            <div className="flex items-center gap-1 font-mono font-black text-rose-400">
                              <TrendingDown className="w-3.5 h-3.5" />
                              <span>Deviasi: {alertItem.variance.toFixed(1)}%</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                (Ambang: -{alertItem.thresholdBreached}%)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Field Constraint & Recommendation */}
                        <div className="text-[11px] space-y-1.5 pt-1">
                          <div className="text-slate-400">
                            <strong className="text-amber-300">Faktor Penyebab: </strong>
                            <span>{alertItem.constraintReason}</span>
                          </div>
                          <div className="text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                            <strong className="text-blue-300">Rekomendasi Tindakan PME: </strong>
                            <span>{alertItem.recommendedAction}</span>
                          </div>
                        </div>

                        {/* Acknowledged By Notice */}
                        {isAck && (
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg">
                            <Check className="w-3.5 h-3.5" />
                            <span>
                              Ditinjau oleh <strong>{alertItem.acknowledgedBy}</strong> pada{' '}
                              {alertItem.acknowledgedAt}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Button Bar */}
                      <div className="pl-2 pt-3 mt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                        {/* Acknowledge Toggle */}
                        <button
                          onClick={() => handleToggleAcknowledge(alertItem)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isAck
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                          }`}
                        >
                          {isAck ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                              <span>Batal Review</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Tandai Ditinjau PME</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-2">
                          {/* Formal Warning Letter Generator (SPK) */}
                          <button
                            onClick={() => setSelectedAlertForSPK(alertItem)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Buat Draft Surat Peringatan (SPK) ke Kontraktor"
                          >
                            <FileText className="w-3.5 h-3.5 text-rose-400" />
                            <span>Terbitkan SPK</span>
                          </button>

                          {/* Escalate to Action Tracker */}
                          <button
                            onClick={() => handleEscalateToActionTracker(alertItem)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Eskalasi ke Action Tracker Proyek"
                          >
                            <Send className="w-3.5 h-3.5 text-blue-400" />
                            <span className="hidden sm:inline">Eskalasi</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Threshold Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Konfigurasi Ambang Batas Alert PME
                  </h3>
                  <p className="text-xs text-slate-400">
                    Kustomisasi toleransi deviasi progres terhadap kurva rencana
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Enable Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="font-bold text-white">Aktifkan PME Automated Alerting</div>
                  <div className="text-slate-400 text-[11px]">
                    Memeriksa otomatis seluruh item WBS terhadap Kurva-S
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={e => updateSettings({ ...settings, enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Critical Threshold Slider */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Ambang Batas Kritis (Critical Threshold)
                  </span>
                  <span className="font-mono font-bold text-rose-300 text-sm">
                    -{settings.criticalThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={settings.criticalThreshold}
                  onChange={e =>
                    updateSettings({
                      ...settings,
                      criticalThreshold: Number(e.target.value)
                    })
                  }
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <p className="text-[11px] text-slate-400">
                  Aktivitas dengan deviasi lebih buruk dari{' '}
                  <strong className="text-rose-400">-{settings.criticalThreshold}%</strong> akan diklasifikasikan sebagai Kritis.
                </p>
              </div>

              {/* Warning Threshold Slider */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Ambang Batas Peringatan (Warning Threshold)
                  </span>
                  <span className="font-mono font-bold text-amber-300 text-sm">
                    -{settings.warningThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="15"
                  step="1"
                  value={settings.warningThreshold}
                  onChange={e =>
                    updateSettings({
                      ...settings,
                      warningThreshold: Number(e.target.value)
                    })
                  }
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <p className="text-[11px] text-slate-400">
                  Aktivitas dengan deviasi antara -{settings.warningThreshold}% s/d -{settings.criticalThreshold}% masuk status Peringatan.
                </p>
              </div>

              {/* Critical Path Strict Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    Zero-Tolerance Lintasan Kritis (Critical Path)
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Otomatis kategorikan KRITIS jika deviasi &le; -2.0% pada lintasan kritis
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.criticalPathStrict}
                  onChange={e =>
                    updateSettings({
                      ...settings,
                      criticalPathStrict: e.target.checked
                    })
                  }
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-rose-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Audio Alarm Sound Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                    Suara Alarm Otomatis
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Putar nada peringatan saat alert kritis terdeteksi
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => playPMEAlertSound('critical')}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 cursor-pointer"
                  >
                    Tes Suara
                  </button>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={e =>
                      updateSettings({
                        ...settings,
                        soundEnabled: e.target.checked
                      })
                    }
                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  const defaults: PMEAlertSettings = {
                    enabled: true,
                    criticalThreshold: 10,
                    warningThreshold: 5,
                    criticalPathStrict: true,
                    minWeightFilter: 0.05,
                    soundEnabled: true,
                    filterContractor: 'ALL'
                  };
                  updateSettings(defaults);
                  showToast('Pengaturan dikembalikan ke standar toleransi PUPR.');
                }}
                className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                Reset ke Standar PUPR
              </button>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                Selesai &amp; Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Official Warning Letter (Surat Peringatan / SPK) */}
      {selectedAlertForSPK && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Draft Surat Notifikasi &amp; Teguran Keterlambatan (SPK)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Format resmi korespondensi PME / Konsultan Pengawas kepada Kontraktor Pelaksana
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedAlertForSPK(null);
                  setCopiedSPK(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Letter Text Preview */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
              {generateSPKText(selectedAlertForSPK)}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-400 text-[11px]">
                Target Kontraktor:{' '}
                <strong className="text-white">{selectedAlertForSPK.contractorId}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const text = generateSPKText(selectedAlertForSPK);
                    navigator.clipboard.writeText(text);
                    setCopiedSPK(true);
                    showToast('Teks Surat Peringatan berhasil disalin ke clipboard.');
                    setTimeout(() => setCopiedSPK(false), 2500);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSPK ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-blue-400" />
                      <span>Salin Teks Surat</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    const text = generateSPKText(selectedAlertForSPK);
                    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Surat_Teguran_PME_${selectedAlertForSPK.contractorId}_${selectedAlertForSPK.activityId}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast('File draft surat berhasil diunduh.');
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Dokumen (.TXT)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
