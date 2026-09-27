import React, { useState } from 'react';
import {
  CalendarRange,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Calendar,
  Download,
  CheckCircle2
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export const WeeklyProgressView: React.FC = () => {
  const { weeklyProgress, exportToExcel, exportToCSV } = useProject();
  const [selectedWeek, setSelectedWeek] = useState<number>(37);

  // Group by week
  const weekNumbers = Array.from(new Set(weeklyProgress.map(w => w.weekNumber))).sort((a: number, b: number) => b - a);

  const currentWeekItems = weeklyProgress.filter(w => w.weekNumber === selectedWeek);
  const wikaItem = currentWeekItems.find(w => w.contractorId === 'WIKA');
  const giItem = currentWeekItems.find(w => w.contractorId === 'GI');
  const totalItem = currentWeekItems.find(w => w.contractorId === 'TOTAL');

  const handleExport = () => {
    const exportData = weeklyProgress.map(w => ({
      'Week No': w.weekNumber,
      'Period': w.period,
      'Cutoff Date': w.cutoffDate,
      'Contractor': w.contractorId,
      'Plan Progress (%)': w.planProgress,
      'Actual Progress (%)': w.actualProgress,
      'Deviation (%)': w.deviation,
      'SPI': w.spi,
      'Remaining Work (%)': w.remainingWork
    }));
    exportToExcel('Laporan_Progress_Mingguan_HBR2', 'Weekly Progress', exportData);
  };

  return (
    <div id="weekly-progress-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <CalendarRange className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Weekly Progress Monitoring</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluasi mingguan standar PME dengan cutoff resmi setiap hari Jumat. Formula: Deviation = Actual - Plan, SPI = Actual / Plan
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-400 font-medium">Pilih Minggu:</label>
            <select
              value={selectedWeek}
              onChange={e => setSelectedWeek(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 font-bold"
            >
              {weekNumbers.map(wn => (
                <option key={wn} value={wn}>
                  Minggu ke-{wn}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS (WIKA, GI, TOTAL) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TOTAL SUMMARY */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-blue-950/80 to-slate-900 border border-blue-800/60 shadow-md">
          <div className="flex items-center justify-between text-xs font-bold text-blue-300 uppercase tracking-wider mb-2">
            <span>TOTAL PROYEK HBR II</span>
            <span className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/40">
              Cutoff Jumat
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 my-3">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold">PLAN KELUARAN</span>
              <div className="text-2xl font-black text-white font-mono">
                {totalItem?.planProgress.toFixed(2) || '0.00'}%
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold">ACTUAL PROGRESS</span>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {totalItem?.actualProgress.toFixed(2) || '0.00'}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400">DEVIASI</span>
              <div className={`font-bold font-mono ${Number(totalItem?.deviation) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {Number(totalItem?.deviation) > 0 ? `+${totalItem?.deviation.toFixed(2)}` : totalItem?.deviation.toFixed(2)}%
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">SPI</span>
              <div className="font-bold font-mono text-amber-300">
                {totalItem?.spi.toFixed(3) || '0.000'}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">SISA KERJA</span>
              <div className="font-bold font-mono text-slate-200">
                {totalItem?.remainingWork.toFixed(2) || '0.00'}%
              </div>
            </div>
          </div>
        </div>

        {/* WIKA SUMMARY */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
            <span>KONTRAKTOR: WIKA</span>
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
              Zona 1
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 my-3">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold">PLAN</span>
              <div className="text-xl font-bold text-slate-200 font-mono">
                {wikaItem?.planProgress.toFixed(2) || '0.00'}%
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold">ACTUAL</span>
              <div className="text-xl font-bold text-emerald-400 font-mono">
                {wikaItem?.actualProgress.toFixed(2) || '0.00'}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400">DEVIASI</span>
              <div className={`font-bold font-mono ${Number(wikaItem?.deviation) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {Number(wikaItem?.deviation) > 0 ? `+${wikaItem?.deviation.toFixed(2)}` : wikaItem?.deviation.toFixed(2)}%
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">SPI</span>
              <div className="font-bold font-mono text-amber-300">
                {wikaItem?.spi.toFixed(3) || '0.000'}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">SISA</span>
              <div className="font-bold font-mono text-slate-200">
                {wikaItem?.remainingWork.toFixed(2) || '0.00'}%
              </div>
            </div>
          </div>
        </div>

        {/* GI SUMMARY */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
            <span>KONTRAKTOR: GI</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
              Zona 2 & 3
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 my-3">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold">PLAN</span>
              <div className="text-xl font-bold text-slate-200 font-mono">
                {giItem?.planProgress.toFixed(2) || '0.00'}%
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold">ACTUAL</span>
              <div className="text-xl font-bold text-emerald-400 font-mono">
                {giItem?.actualProgress.toFixed(2) || '0.00'}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400">DEVIASI</span>
              <div className={`font-bold font-mono ${Number(giItem?.deviation) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {Number(giItem?.deviation) > 0 ? `+${giItem?.deviation.toFixed(2)}` : giItem?.deviation.toFixed(2)}%
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">SPI</span>
              <div className="font-bold font-mono text-amber-300">
                {giItem?.spi.toFixed(3) || '0.000'}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">SISA</span>
              <div className="font-bold font-mono text-slate-200">
                {giItem?.remainingWork.toFixed(2) || '0.00'}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULL WEEKLY TABLE */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
          Tabel Historis Weekly Progress (Cutoff Jumat)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800 text-slate-400 uppercase font-semibold border-b border-slate-700">
              <tr>
                <th className="p-3">Minggu</th>
                <th className="p-3">Periode (Cutoff)</th>
                <th className="p-3">Kontraktor</th>
                <th className="p-3 text-right">Plan (%)</th>
                <th className="p-3 text-right">Actual (%)</th>
                <th className="p-3 text-right">Deviation (%)</th>
                <th className="p-3 text-right">SPI</th>
                <th className="p-3 text-right">Remaining Work (%)</th>
                <th className="p-3 text-center">Status Jadwal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {weeklyProgress.map(item => (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-800/50 transition-colors ${
                    item.contractorId === 'TOTAL' ? 'bg-slate-800/30 font-semibold' : ''
                  }`}
                >
                  <td className="p-3 font-mono font-bold text-white">Mg {item.weekNumber}</td>
                  <td className="p-3 font-medium">
                    <div>{item.period}</div>
                    <div className="text-[10px] text-slate-400">{item.cutoffDate}</div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.contractorId === 'WIKA'
                          ? 'bg-blue-500/20 text-blue-300'
                          : item.contractorId === 'GI'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {item.contractorId}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono text-slate-200">{item.planProgress.toFixed(2)}%</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">
                    {item.actualProgress.toFixed(2)}%
                  </td>
                  <td className="p-3 text-right font-mono">
                    <span
                      className={`font-bold ${
                        item.deviation >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {item.deviation > 0 ? `+${item.deviation.toFixed(2)}` : item.deviation.toFixed(2)}%
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono">
                    <span
                      className={`font-bold ${
                        item.spi >= 1.0 ? 'text-emerald-400' : item.spi >= 0.9 ? 'text-amber-400' : 'text-rose-400'
                      }`}
                    >
                      {item.spi.toFixed(3)}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono text-slate-400">
                    {item.remainingWork.toFixed(2)}%
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.spi >= 1.0
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : item.spi >= 0.9
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {item.spi >= 1.0 ? 'On Schedule' : item.spi >= 0.9 ? 'Minor Delay' : 'Critical Delay'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
