import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  FileText,
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  UploadCloud
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { googleWorkspace } from '../../services/googleWorkspace';

export const ProjectReportsView: React.FC = () => {
  const {
    kpi,
    project,
    weeklyProgress,
    monthlyProgress,
    piers,
    constraints,
    issues,
    exportToExcel,
    exportToCSV
  } = useProject();

  const [selectedReport, setSelectedReport] = useState<
    'executive' | 'weekly' | 'monthly' | 'pier' | 'constraint' | 'issue'
  >('executive');

  const printReport = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (selectedReport === 'executive') {
      const data = [
        { Indikator: 'Nama Proyek', Nilai: project.name },
        { Indikator: 'Planned Baseline (%)', Nilai: kpi.plannedProgress },
        { Indikator: 'Actual Progress (%)', Nilai: kpi.actualProgress },
        { Indikator: 'Deviasi (%)', Nilai: kpi.deviation },
        { Indikator: 'Schedule Performance Index (SPI)', Nilai: kpi.spi },
        { Indikator: 'Total Pier Elevated', Nilai: kpi.totalPiers },
        { Indikator: 'Pier Completed', Nilai: kpi.completedPiers },
        { Indikator: 'Pier On Progress', Nilai: kpi.onProgressPiers },
        { Indikator: 'Open Constraints', Nilai: kpi.openConstraints },
        { Indikator: 'Open Issues', Nilai: kpi.openIssues }
      ];
      exportToExcel('Executive_Summary_HBR2', 'Executive Summary', data);
    } else if (selectedReport === 'weekly') {
      const data = weeklyProgress.map(w => ({
        Minggu: w.weekNumber,
        Periode: w.period,
        Cutoff: w.cutoffDate,
        Kontraktor: w.contractorId,
        'Plan (%)': w.planProgress,
        'Actual (%)': w.actualProgress,
        'Deviation (%)': w.deviation,
        SPI: w.spi
      }));
      exportToExcel('Laporan_Mingguan_HBR2', 'Weekly', data);
    } else if (selectedReport === 'monthly') {
      const data = monthlyProgress.map(m => ({
        Bulan: m.monthName,
        'Cutoff Tanggal': m.cutoffDate,
        'Monthly Plan (%)': m.monthlyPlan,
        'Monthly Actual (%)': m.monthlyActual,
        'Cumul Actual (%)': m.cumulativeActual,
        SPI: m.spi
      }));
      exportToExcel('Laporan_Bulanan_HBR2', 'Monthly', data);
    } else if (selectedReport === 'pier') {
      const data = piers.map(p => ({
        'Pier Number': p.pierNumber,
        Zona: p.zoneId,
        Kontraktor: p.contractorId,
        'Overall Progress (%)': p.overallProgress,
        Status: p.status,
        'Target Finish': p.plannedFinish,
        'Main Activity': p.mainActivity
      }));
      exportToExcel('Laporan_Pier_Elevated_HBR2', 'Pier Progress', data);
    } else if (selectedReport === 'constraint') {
      const data = constraints.map(c => ({
        ID: c.constraintId,
        Pier: c.pierNumber,
        Kontraktor: c.contractorId,
        Kategori: c.category,
        Deskripsi: c.description,
        Dampak: c.impact,
        PIC: c.pic,
        Status: c.status
      }));
      exportToExcel('Laporan_Constraint_HBR2', 'Constraints', data);
    } else {
      const data = issues.map(i => ({
        ID: i.issueId,
        Tanggal: i.date,
        Pier: i.pierNumber,
        Kontraktor: i.contractorId,
        Issue: i.issue,
        AkarMasalah: i.rootCause,
        Action: i.action,
        Status: i.status
      }));
      exportToExcel('Laporan_Issue_Mutu_HBR2', 'Issues', data);
    }
  };

  const [syncingGoogleSheets, setSyncingGoogleSheets] = useState(false);
  const [googleSyncMsg, setGoogleSyncMsg] = useState<string | null>(null);

  const handleExportToGoogleSheets = async () => {
    if (!googleWorkspace.isAuthenticated()) {
      alert('Silakan hubungkan akun Google Workspace terlebih dahulu via tombol "Google Workspace" di pojok kanan atas.');
      return;
    }

    setSyncingGoogleSheets(true);
    setGoogleSyncMsg(null);
    try {
      let targetSheet = googleWorkspace.getStoredSpreadsheet();
      let sheetId = targetSheet?.id;

      if (!sheetId) {
        // Create new if none selected
        const created = await googleWorkspace.createProjectSpreadsheet(
          `Laporan ${selectedReport.toUpperCase()} HBR II - ${new Date().toISOString().split('T')[0]}`
        );
        sheetId = created.spreadsheetId;
        googleWorkspace.setStoredSpreadsheet({ id: created.spreadsheetId, title: `Laporan ${selectedReport.toUpperCase()} HBR II` });
      }

      // Format data based on selectedReport
      let values: any[][] = [];
      let targetRange = 'Sheet1!A1';

      if (selectedReport === 'weekly') {
        const headers = ['Minggu', 'Periode', 'Cutoff', 'Kontraktor', 'Plan (%)', 'Actual (%)', 'Deviation (%)', 'SPI'];
        const rows = weeklyProgress.map(w => [w.weekNumber, w.period, w.cutoffDate, w.contractorId, w.planProgress, w.actualProgress, w.deviation, w.spi]);
        values = [headers, ...rows];
        targetRange = 'Weekly_Cutoff!A1:H' + (rows.length + 1);
      } else if (selectedReport === 'pier') {
        const headers = ['Pier Number', 'Zona', 'Kontraktor', 'Tipe', 'Kedalaman (m)', 'Status', 'Progress (%)'];
        const rows = piers.map(p => [p.pierNumber, p.zoneId, p.contractorId, p.pierType, p.foundationDepth, p.status, p.overallProgress]);
        values = [headers, ...rows];
        targetRange = 'Master_Piers!A1:G' + (rows.length + 1);
      } else if (selectedReport === 'constraint') {
        const headers = ['ID', 'Pier', 'Kontraktor', 'Kategori', 'Deskripsi', 'Dampak', 'PIC', 'Status'];
        const rows = constraints.map(c => [c.constraintId, c.pierNumber, c.contractorId, c.category, c.description, c.impact, c.assignedTo, c.status]);
        values = [headers, ...rows];
        targetRange = 'Constraints!A1:H' + (rows.length + 1);
      } else {
        const headers = ['Parameter', 'Nilai'];
        const rows = [
          ['Nama Proyek', project.projectName],
          ['Client', project.client],
          ['Target Selesai', project.currentTargetFinish],
          ['Planned Progress', `${kpi.plannedProgress}%`],
          ['Actual Progress', `${kpi.actualProgress}%`],
          ['Deviation', `${kpi.deviation}%`],
          ['SPI', `${kpi.spi}`]
        ];
        values = [headers, ...rows];
        targetRange = 'Executive_Summary!A1:B' + (rows.length + 1);
      }

      await googleWorkspace.writeSheetValues(sheetId, targetRange, values);
      setGoogleSyncMsg(`Berhasil dikirim ke Google Sheets: https://docs.google.com/spreadsheets/d/${sheetId}`);
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim data ke Google Sheets');
    } finally {
      setSyncingGoogleSheets(false);
    }
  };

  const handleExportCSV = () => {
    if (selectedReport === 'weekly') {
      exportToCSV('Laporan_Mingguan_HBR2', weeklyProgress);
    } else if (selectedReport === 'pier') {
      exportToCSV('Laporan_Pier_HBR2', piers);
    } else {
      exportToCSV('Laporan_Data_HBR2', constraints);
    }
  };

  return (
    <div id="project-reports-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Project Reporting & Formal Outputs</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Pusat cetak dan ekspor laporan resmi PME: Executive Summary, Weekly Cutoff, Monthly Cutoff, Pier Matrix, & Register
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={printReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleExportToGoogleSheets}
            disabled={syncingGoogleSheets}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
            title="Kirim laporan saat ini ke Google Sheets di Google Drive Anda"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{syncingGoogleSheets ? 'Mengirim...' : 'Kirim ke Google Sheets'}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
          >
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Google Sheets Sync Notification */}
      {googleSyncMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-xs text-emerald-300 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{googleSyncMsg}</span>
          </div>
          <button
            onClick={() => setGoogleSyncMsg(null)}
            className="text-xs hover:underline text-emerald-400 font-semibold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Select Report Type (print:hidden) */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs print:hidden">
        {[
          { id: 'executive', label: 'Executive Summary Report' },
          { id: 'weekly', label: 'Weekly Progress (Cutoff Jumat)' },
          { id: 'monthly', label: 'Monthly Progress (Cutoff 25)' },
          { id: 'pier', label: 'Pier Matrix Progress Report' },
          { id: 'constraint', label: 'Constraint Register Report' },
          { id: 'issue', label: 'Issue & Root Cause Report' }
        ].map(r => (
          <button
            key={r.id}
            onClick={() => setSelectedReport(r.id as any)}
            className={`px-3.5 py-2 rounded-lg font-bold transition-colors ${
              selectedReport === r.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Printable Report Canvas */}
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl print:bg-white print:text-black print:p-0 print:border-none space-y-6">
        {/* Document Formal Header */}
        <div className="border-b-2 border-slate-700 pb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-blue-400 font-bold">
              HARBOUR ROAD II ELEVATED TOLLWAY PROJECT
            </div>
            <h1 className="text-xl font-black text-white mt-1">
              {selectedReport === 'executive' && 'EXECUTIVE SUMMARY & KPI REPORT'}
              {selectedReport === 'weekly' && 'WEEKLY PROGRESS & PERFORMANCE REPORT'}
              {selectedReport === 'monthly' && 'MONTHLY CUTOFF CERTIFICATION REPORT'}
              {selectedReport === 'pier' && 'PIER BY PIER PHYSICAL PROGRESS REGISTER'}
              {selectedReport === 'constraint' && 'CRITICAL CONSTRAINT & OBSTRUCTION REPORT'}
              {selectedReport === 'issue' && 'TECHNICAL ISSUE & QUALITY NON-CONFORMANCE REPORT'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Project Control & Progress Monitoring Engineer (PME) Management Office
            </p>
          </div>

          <div className="text-right text-xs font-mono space-y-1">
            <div className="text-slate-400">Tanggal Dokumen: <span className="text-white font-bold">{new Date().toLocaleDateString('id-ID')}</span></div>
            <div className="text-slate-400">Penyusun: <span className="text-white font-bold">Progress Monitoring Engineer</span></div>
            <div className="text-slate-400">Kontraktor: <span className="text-white font-bold">KSO WIKA - GI</span></div>
          </div>
        </div>

        {/* 1. EXECUTIVE REPORT */}
        {selectedReport === 'executive' && (
          <div className="space-y-6 text-xs">
            {/* KPI Summary Block */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-slate-400 text-[11px]">PLAN BASELINE</span>
                <div className="text-2xl font-black text-white font-mono mt-1">
                  {kpi.plannedProgress.toFixed(2)}%
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-slate-400 text-[11px]">ACTUAL PROGRESS</span>
                <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                  {kpi.actualProgress.toFixed(2)}%
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-slate-400 text-[11px]">DEVIASI (VARIAN)</span>
                <div className="text-2xl font-black text-rose-400 font-mono mt-1">
                  {kpi.deviation.toFixed(2)}%
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-slate-400 text-[11px]">SPI (SCHEDULE INDEX)</span>
                <div className="text-2xl font-black text-amber-300 font-mono mt-1">
                  {kpi.spi.toFixed(3)}
                </div>
              </div>
            </div>

            {/* Pier Summary Stats */}
            <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/80 space-y-3">
              <h3 className="font-bold text-white text-sm">Status Elemen Pier Struktur Elevated</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">TOTAL ELEVATED PIER</span>
                  <div className="text-xl font-bold text-white font-mono mt-0.5">{kpi.totalPiers} Titik</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">PIER SELESAI (100%)</span>
                  <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">{kpi.completedPiers} Titik</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">DALAM PENGERJAAN</span>
                  <div className="text-xl font-bold text-amber-300 font-mono mt-0.5">{kpi.onProgressPiers} Titik</div>
                </div>
              </div>
            </div>

            {/* Narrative Analysis */}
            <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/60 space-y-2 leading-relaxed text-slate-300">
              <h4 className="font-bold text-white">Ringkasan Analisis Progress Monitoring Engineer (PME):</h4>
              <p>
                1. Proyek HBR II Elevated Tollway saat ini berada pada minggu evaluasi ke-37 dengan realisasi kumulatif sebesar <strong>{kpi.actualProgress.toFixed(2)}%</strong> terhadap rencana sebesar <strong>{kpi.plannedProgress.toFixed(2)}%</strong> (varians <strong>{kpi.deviation.toFixed(2)}%</strong>, SPI <strong>{kpi.spi.toFixed(3)}</strong>).
              </p>
              <p>
                2. Faktor hambatan utama terkonsentrasi pada segmen Zona 1 Selatan (P18S-P20S) akibat relokasi utilitas pipa gas bawah tanah serta pengadaan izin kerja lintasan rel kereta api pada Zona 2.
              </p>
              <p>
                3. Rekomendasi tindakan korektif mendesak adalah pelaksanaan simulasi catch-up plan melalui penambahan shift malam, akselerasi rig pemancangan/drilling bored pile, serta fast-tracking bekisting pier head.
              </p>
            </div>
          </div>
        )}

        {/* 2. WEEKLY REPORT TABLE */}
        {selectedReport === 'weekly' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-300 uppercase font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3">Minggu</th>
                  <th className="p-3">Periode</th>
                  <th className="p-3">Cutoff</th>
                  <th className="p-3">Kontraktor</th>
                  <th className="p-3 text-right">Plan (%)</th>
                  <th className="p-3 text-right">Actual (%)</th>
                  <th className="p-3 text-right">Deviasi (%)</th>
                  <th className="p-3 text-right">SPI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {weeklyProgress.map(w => (
                  <tr key={w.id}>
                    <td className="p-3 font-mono font-bold text-white">Mg {w.weekNumber}</td>
                    <td className="p-3">{w.period}</td>
                    <td className="p-3 font-mono text-slate-400">{w.cutoffDate}</td>
                    <td className="p-3 font-bold text-blue-400">{w.contractorId}</td>
                    <td className="p-3 text-right font-mono">{w.planProgress.toFixed(2)}%</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">{w.actualProgress.toFixed(2)}%</td>
                    <td className="p-3 text-right font-mono text-rose-400 font-bold">{w.deviation.toFixed(2)}%</td>
                    <td className="p-3 text-right font-mono text-amber-300 font-bold">{w.spi.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. MONTHLY REPORT TABLE */}
        {selectedReport === 'monthly' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-300 uppercase font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3">Bulan</th>
                  <th className="p-3">Cutoff</th>
                  <th className="p-3 text-right">Monthly Plan (%)</th>
                  <th className="p-3 text-right">Monthly Actual (%)</th>
                  <th className="p-3 text-right">Cumulative Plan (%)</th>
                  <th className="p-3 text-right">Cumulative Actual (%)</th>
                  <th className="p-3 text-right">Cumul Deviasi (%)</th>
                  <th className="p-3 text-right">SPI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {monthlyProgress.map(m => (
                  <tr key={m.id}>
                    <td className="p-3 font-bold text-white">{m.monthName}</td>
                    <td className="p-3 font-mono text-slate-400">{m.cutoffDate}</td>
                    <td className="p-3 text-right font-mono">{m.monthlyPlan.toFixed(2)}%</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">{m.monthlyActual.toFixed(2)}%</td>
                    <td className="p-3 text-right font-mono">{m.cumulativePlan.toFixed(2)}%</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">{m.cumulativeActual.toFixed(2)}%</td>
                    <td className="p-3 text-right font-mono text-rose-400 font-bold">{m.cumulativeDeviation.toFixed(2)}%</td>
                    <td className="p-3 text-right font-mono text-amber-300 font-bold">{m.spi.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. PIER REPORT TABLE */}
        {selectedReport === 'pier' && (
          <div className="overflow-x-auto max-h-96 custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-300 uppercase font-semibold sticky top-0">
                <tr>
                  <th className="p-3">Pier No.</th>
                  <th className="p-3">Zona</th>
                  <th className="p-3">Kontraktor</th>
                  <th className="p-3 text-right">Progress</th>
                  <th className="p-3">Target Selesai</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Aktivitas Utama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {piers.map(p => (
                  <tr key={p.pierId}>
                    <td className="p-3 font-mono font-bold text-white">{p.pierNumber}</td>
                    <td className="p-3">{p.zoneId}</td>
                    <td className="p-3 font-bold text-blue-400">{p.contractorId}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">{p.overallProgress}%</td>
                    <td className="p-3 font-mono text-slate-400">{p.plannedFinish}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{p.mainActivity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. CONSTRAINT REPORT */}
        {selectedReport === 'constraint' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-300 uppercase font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Pier No.</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Deskripsi Kendala</th>
                  <th className="p-3">Dampak</th>
                  <th className="p-3">PIC</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {constraints.map(c => (
                  <tr key={c.constraintId}>
                    <td className="p-3 font-mono font-bold text-white">{c.constraintId}</td>
                    <td className="p-3 font-mono font-bold text-amber-400">{c.pierNumber}</td>
                    <td className="p-3">{c.category}</td>
                    <td className="p-3">{c.description}</td>
                    <td className="p-3 text-slate-400">{c.impact}</td>
                    <td className="p-3 font-medium text-slate-300">{c.pic}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Signatures block for formal documentation */}
        <div className="grid grid-cols-3 gap-8 pt-10 border-t border-slate-800 text-center text-xs">
          <div>
            <div className="text-slate-400">Disiapkan Oleh:</div>
            <div className="font-bold text-white mt-12">Progress Monitoring Engineer (PME)</div>
            <div className="text-[10px] text-slate-400">Tim Project Control</div>
          </div>
          <div>
            <div className="text-slate-400">Diperiksa Oleh:</div>
            <div className="font-bold text-white mt-12">Project Manager Kontraktor</div>
            <div className="text-[10px] text-slate-400">KSO WIKA - GI</div>
          </div>
          <div>
            <div className="text-slate-400">Disetujui Oleh:</div>
            <div className="font-bold text-white mt-12">Konsultan Supervisi & Owner</div>
            <div className="text-[10px] text-slate-400">PT Citra Marga Nusaphala Persada Tbk</div>
          </div>
        </div>
      </div>
    </div>
  );
};
