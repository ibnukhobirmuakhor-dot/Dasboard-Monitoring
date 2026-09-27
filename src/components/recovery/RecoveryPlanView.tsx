import React, { useState } from 'react';
import {
  LifeBuoy,
  AlertTriangle,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  Sliders,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useProject } from '../../context/ProjectContext';

export const RecoveryPlanView: React.FC = () => {
  const { kpi, piers, sCurve } = useProject();

  // Simulation parameters for Catch-up Plan
  const [extraShifts, setExtraShifts] = useState<number>(2); // +2 shifts (day & night)
  const [extraEquipment, setExtraEquipment] = useState<number>(3); // +3 crane & boring rigs
  const [extraManpower, setExtraManpower] = useState<number>(45); // +45 skilled workers
  const [rescheduleCriticalPath, setRescheduleCriticalPath] = useState<boolean>(true);

  // Delayed piers (SPI < 0.95 or overall progress lag)
  const delayedPiers = piers.filter(p => p.status === 'Open' || (p.status === 'On Progress' && p.overallProgress < 60));

  // Critical path activities
  const criticalPathItems = [
    { id: 'CP-1', pier: 'P18S', work: 'Relokasi Pipa Gas 24" PGN', duration: '14 hari', status: 'Blocked', impact: 'Substructure P18S-P20S' },
    { id: 'CP-2', pier: 'P19S', work: 'Bored Pile Drilling Titik 4 & 5', duration: '10 hari', status: 'Pending', impact: 'Pile Cap P19S' },
    { id: 'CP-3', pier: 'P56AS', work: 'Erection Steel Box Girder Bentang 60m', duration: '21 hari', status: 'Critical', impact: 'Slab P56AS-P57S' },
    { id: 'CP-4', pier: 'P110S', work: 'Pier Head Concreting C50/60', duration: '7 hari', status: 'Scheduled', impact: 'Bearing Pad Placement' }
  ];

  // Calculate catch-up velocity boost
  const velocityMultiplier = 1.0 + (extraShifts * 0.08) + (extraEquipment * 0.05) + (extraManpower * 0.002) + (rescheduleCriticalPath ? 0.08 : 0);

  // Simulated revised S-Curve
  const simulatedSCurve = sCurve.map(pt => {
    if (pt.forecast !== undefined) {
      const remainingDistance = 100 - (pt.actual || pt.planned);
      const acceleratedRate = Math.min(100, Math.round(((pt.actual || pt.planned) + (remainingDistance * (velocityMultiplier - 1) * 0.7)) * 10) / 10);
      return {
        ...pt,
        recoveryPlan: Math.min(100, acceleratedRate)
      };
    }
    return {
      ...pt,
      recoveryPlan: pt.actual !== undefined ? pt.actual : pt.planned
    };
  });

  return (
    <div id="recovery-plan-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Project Recovery & Catch-up Plan Engine</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Analisis jalur kritis (Critical Path), Pier terlambat, dan simulasi strategi akselerasi (Shift, Alat, Manpower)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            Deviasi Proyek: {kpi.deviation.toFixed(2)}%
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            SPI: {kpi.spi.toFixed(3)}
          </span>
        </div>
      </div>

      {/* Grid: Delayed Piers & Critical Path */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Path Register */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Lintasan Kritis Proyek (Critical Path)</span>
            </h3>
            <span className="text-[11px] text-slate-400">Zero Float Sequence</span>
          </div>

          <div className="space-y-2.5">
            {criticalPathItems.map(cp => (
              <div key={cp.id} className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-blue-400">{cp.id} • Pier {cp.pier}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    cp.status === 'Blocked' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {cp.status}
                  </span>
                </div>
                <div className="font-semibold text-white">{cp.work}</div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-2 pt-1.5 border-t border-slate-700/60">
                  <span>Durasi: <strong className="text-slate-200">{cp.duration}</strong></span>
                  <span>Dampak: <strong className="text-rose-300">{cp.impact}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delayed Pier Register */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Daftar Pier Terlambat ({delayedPiers.length} Pier)</span>
            </h3>
            <span className="text-[11px] text-slate-400">Memerlukan Intervensi</span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
            {delayedPiers.map(dp => (
              <div key={dp.pierId} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2 font-mono font-bold text-white">
                    <span>Pier {dp.pierNumber}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                      {dp.contractorId}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{dp.mainActivity}</div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-emerald-400 font-bold">{dp.overallProgress}%</div>
                  <div className="text-[10px] text-slate-400">Target: {dp.plannedFinish}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Catch-up Simulator */}
      <div className="p-6 rounded-xl bg-slate-900 border border-blue-900/50 shadow-md space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>Simulasi Catch-Up Strategy & Akselerasi</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Sesuaikan instrumen recovery untuk menghitung kecepatan baru dan Revised S-Curve
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Kecepatan Tambahan (Speed Boost):</span>
            <div className="text-xl font-black text-emerald-400 font-mono">
              +{((velocityMultiplier - 1) * 100).toFixed(1)}% Percepatan
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Shift */}
          <div className="p-4 rounded-lg bg-slate-800/70 border border-slate-700 space-y-2">
            <label className="block font-semibold text-slate-200">
              Penambahan Shift Kerja: <span className="text-blue-400 font-bold">{extraShifts} Shift</span>
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={extraShifts}
              onChange={e => setExtraShifts(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <p className="text-[10px] text-slate-400">Shift 2 (Malam) & Shift 3 (Lembur kontinu)</p>
          </div>

          {/* Equipment */}
          <div className="p-4 rounded-lg bg-slate-800/70 border border-slate-700 space-y-2">
            <label className="block font-semibold text-slate-200">
              Tambah Alat Berat: <span className="text-blue-400 font-bold">+{extraEquipment} Unit</span>
            </label>
            <input
              type="range"
              min="0"
              max="8"
              step="1"
              value={extraEquipment}
              onChange={e => setExtraEquipment(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <p className="text-[10px] text-slate-400">Mobile Crane 100T & Hydraulic Boring Rig</p>
          </div>

          {/* Manpower */}
          <div className="p-4 rounded-lg bg-slate-800/70 border border-slate-700 space-y-2">
            <label className="block font-semibold text-slate-200">
              Tambah Manpower: <span className="text-blue-400 font-bold">+{extraManpower} Orang</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={extraManpower}
              onChange={e => setExtraManpower(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <p className="text-[10px] text-slate-400">Tukang besi rebar, bekisting & cor</p>
          </div>

          {/* Reschedule */}
          <div className="p-4 rounded-lg bg-slate-800/70 border border-slate-700 space-y-2 flex flex-col justify-between">
            <label className="font-semibold text-slate-200">Fast-Tracking / Reschedule</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reschedule-cb"
                checked={rescheduleCriticalPath}
                onChange={e => setRescheduleCriticalPath(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600"
              />
              <label htmlFor="reschedule-cb" className="text-[11px] text-slate-300 font-medium">
                Paralelisasi Pier Erection
              </label>
            </div>
            <p className="text-[10px] text-slate-400">Pekerjaan paralel span sebelum seluruh pier selesai</p>
          </div>
        </div>

        {/* Revised S-Curve Visual */}
        <div className="space-y-3 pt-3">
          <div className="flex items-center justify-between text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider">
              Revised S-Curve (Simulasi Skenario Catch-Up vs Baseline)
            </h4>
            <div className="flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-sky-400 rounded-full" />
                <span className="text-slate-300">Baseline Plan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-emerald-400 rounded-full" />
                <span className="text-slate-300 font-bold">Actual Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-violet-400 rounded-full" />
                <span className="text-slate-300 font-bold">Catch-up Simulation</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={simulatedSCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="period" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc'
                  }}
                  formatter={(val: any) => [`${val}%`]}
                />
                <Line
                  type="monotone"
                  dataKey="planned"
                  name="Baseline Plan"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="recoveryPlan"
                  name="Catch-up Recovery"
                  stroke="#a78bfa"
                  strokeWidth={3}
                  strokeDasharray="4 4"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-800/40 text-xs text-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Dengan skenario penambahan <strong>{extraShifts} shift</strong>, <strong>+{extraEquipment} unit alat</strong>, dan <strong>+{extraManpower} manpower</strong>, keterlambatan diperkirakan dapat dinetralkan pada <strong>Mg 44 (Nov 2026)</strong>.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
