import React from 'react';
import { CalendarCheck2, Download, TrendingUp } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export const MonthlyProgressView: React.FC = () => {
  const { monthlyProgress, exportToExcel } = useProject();

  const handleExport = () => {
    const exportData = monthlyProgress.map(m => ({
      Bulan: m.monthName,
      'Cutoff Date': m.cutoffDate,
      'Monthly Plan (%)': m.monthlyPlan,
      'Monthly Actual (%)': m.monthlyActual,
      'Monthly Dev (%)': m.monthlyDeviation,
      'Cumulative Plan (%)': m.cumulativePlan,
      'Cumulative Actual (%)': m.cumulativeActual,
      'Cumulative Dev (%)': m.cumulativeDeviation,
      SPI: m.spi,
      'Remaining Work (%)': m.remainingWork
    }));
    exportToExcel('Laporan_Progress_Bulanan_HBR2', 'Monthly Progress', exportData);
  };

  const latestMonth = monthlyProgress[monthlyProgress.length - 1];

  return (
    <div id="monthly-progress-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Monthly Progress Monitoring</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Laporan bulanan sertifikasi progres fisik PME dengan cutoff tetap tanggal 25 setiap bulan
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700"
        >
          <Download className="w-4 h-4" />
          <span>Export Excel</span>
        </button>
      </div>

      {/* Latest Month Highlight Card */}
      {latestMonth && (
        <div className="p-6 rounded-xl bg-gradient-to-br from-slate-900 to-blue-950/70 border border-blue-900/40 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Pencapaian Bulan Terakhir:
              </span>
              <h3 className="text-xl font-black text-white">{latestMonth.monthName} (Cutoff 25)</h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              SPI: {latestMonth.spi.toFixed(3)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700/80">
              <span className="text-[10px] text-slate-400 font-semibold">BULANAN (ACT / PLAN)</span>
              <div className="text-lg font-bold text-white mt-1 font-mono">
                <span className="text-emerald-400">{latestMonth.monthlyActual}%</span> / {latestMonth.monthlyPlan}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Deviasi: <span className="text-rose-400 font-bold">{latestMonth.monthlyDeviation}%</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700/80">
              <span className="text-[10px] text-slate-400 font-semibold">KUMULATIF ACTUAL</span>
              <div className="text-xl font-black text-emerald-400 mt-1 font-mono">
                {latestMonth.cumulativeActual}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Plan: {latestMonth.cumulativePlan}%
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700/80">
              <span className="text-[10px] text-slate-400 font-semibold">KUMULATIF DEVIASI</span>
              <div className="text-xl font-black text-rose-400 mt-1 font-mono">
                {latestMonth.cumulativeDeviation}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Variance fisik</div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700/80">
              <span className="text-[10px] text-slate-400 font-semibold">SISA PEKERJAAN</span>
              <div className="text-xl font-black text-amber-300 mt-1 font-mono">
                {latestMonth.remainingWork}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Sisa bobot kontrak</div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Table */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
          Tabel Rekapitulasi Progres Bulanan (Cutoff Tanggal 25)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800 text-slate-400 uppercase font-semibold border-b border-slate-700">
              <tr>
                <th className="p-3">Bulan</th>
                <th className="p-3">Cutoff</th>
                <th className="p-3 text-right">Monthly Plan (%)</th>
                <th className="p-3 text-right">Monthly Actual (%)</th>
                <th className="p-3 text-right">Monthly Dev (%)</th>
                <th className="p-3 text-right">Cumul Plan (%)</th>
                <th className="p-3 text-right">Cumul Actual (%)</th>
                <th className="p-3 text-right">Cumul Dev (%)</th>
                <th className="p-3 text-right">SPI</th>
                <th className="p-3 text-right">Remaining (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {monthlyProgress.map(m => (
                <tr key={m.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 font-bold text-white">{m.monthName}</td>
                  <td className="p-3 font-mono text-slate-400">{m.cutoffDate}</td>
                  <td className="p-3 text-right font-mono text-slate-300">{m.monthlyPlan.toFixed(2)}%</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">
                    {m.monthlyActual.toFixed(2)}%
                  </td>
                  <td className="p-3 text-right font-mono text-rose-400 font-semibold">
                    {m.monthlyDeviation.toFixed(2)}%
                  </td>
                  <td className="p-3 text-right font-mono text-slate-300">{m.cumulativePlan.toFixed(2)}%</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">
                    {m.cumulativeActual.toFixed(2)}%
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-rose-400">
                    {m.cumulativeDeviation.toFixed(2)}%
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-amber-300">{m.spi.toFixed(3)}</td>
                  <td className="p-3 text-right font-mono text-slate-400">{m.remainingWork.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
