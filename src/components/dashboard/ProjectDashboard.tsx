import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Flame,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  ChevronRight,
  Activity as ActivityIcon
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
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useProject } from '../../context/ProjectContext';
import { NavTab } from '../layout/Sidebar';

interface ProjectDashboardProps {
  onNavigateTab: (tab: NavTab) => void;
  onSelectPier: (pierNumber: string) => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  onNavigateTab,
  onSelectPier
}) => {
  const {
    project,
    zones,
    piers,
    activities,
    sCurve,
    constraints,
    issues,
    projectKPIs,
    recoveryPlan,
    filters
  } = useProject();

  const [sCurveContractorFilter, setSCurveContractorFilter] = useState<'ALL' | 'WIKA' | 'GI'>('ALL');

  // Filtered piers according to global filter
  const filteredPiers = useMemo(() => {
    return piers.filter(p => {
      if (filters.contractorId !== 'ALL' && p.contractorId !== filters.contractorId) return false;
      if (filters.zoneId !== 'ALL' && p.zoneId !== filters.zoneId) return false;
      if (filters.status !== 'ALL' && p.status !== filters.status) return false;
      return true;
    });
  }, [piers, filters]);

  // Zone Progress aggregation
  const zoneProgressData = useMemo(() => {
    return zones.map(z => {
      const zonePiers = piers.filter(p => p.zoneId === z.zoneId);
      const avgProgress =
        zonePiers.length > 0
          ? Math.round((zonePiers.reduce((sum, p) => sum + p.overallProgress, 0) / zonePiers.length) * 10) / 10
          : 0;
      return {
        zoneName: z.zoneName,
        direction: z.direction,
        pierCount: zonePiers.length,
        progress: avgProgress
      };
    });
  }, [zones, piers]);

  // Major Activities
  const majorActivities = useMemo(() => {
    return activities.slice(0, 5);
  }, [activities]);

  return (
    <div id="project-dashboard-view" className="space-y-6 pb-12">
      {/* 1. TOP KPI CARDS (TOTAL PROJECT PROGRESS, PLAN, ACTUAL, DEVIATION, SPI, REMAINING WORK, REMAINING DAYS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Project Progress */}
        <div className="col-span-2 sm:col-span-2 p-4 rounded-xl bg-gradient-to-br from-blue-950/80 to-slate-900 border border-blue-800/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <span>TOTAL PROJECT PROGRESS</span>
            <Building2 className="w-4 h-4" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-white tracking-tight">
              {projectKPIs.totalActual.toFixed(1)}%
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, projectKPIs.totalActual)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Target Akhir: {project.currentTargetFinish}</span>
            <span className="text-emerald-400 font-bold">WIKA & GI</span>
          </div>
        </div>

        {/* Plan Progress */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            PLAN PROGRESS
          </div>
          <div className="text-2xl font-bold text-slate-100 my-1">
            {projectKPIs.totalPlanned.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-blue-400" />
            <span>Cutoff Mg. Ini</span>
          </div>
        </div>

        {/* Actual Progress */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            ACTUAL PROGRESS
          </div>
          <div className="text-2xl font-bold text-emerald-400 my-1">
            {projectKPIs.totalActual.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400">
            Verified Physical PME
          </div>
        </div>

        {/* Deviation */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            DEVIATION
          </div>
          <div
            className={`text-2xl font-bold my-1 flex items-center gap-1 ${
              projectKPIs.deviation >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {projectKPIs.deviation >= 0 ? (
              <ArrowUpRight className="w-5 h-5 shrink-0" />
            ) : (
              <ArrowDownRight className="w-5 h-5 shrink-0" />
            )}
            <span>{projectKPIs.deviation > 0 ? `+${projectKPIs.deviation.toFixed(2)}` : projectKPIs.deviation.toFixed(2)}%</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Actual - Plan
          </div>
        </div>

        {/* SPI */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            SPI (INDEX)
          </div>
          <div
            className={`text-2xl font-bold my-1 ${
              projectKPIs.spi >= 1.0 ? 'text-emerald-400' : projectKPIs.spi >= 0.9 ? 'text-amber-400' : 'text-rose-400'
            }`}
          >
            {projectKPIs.spi.toFixed(3)}
          </div>
          <div className="text-[11px] text-slate-400">
            {projectKPIs.spi >= 1.0 ? 'On Track' : 'Behind Schedule'}
          </div>
        </div>

        {/* Remaining Days */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            REMAINING DAYS
          </div>
          <div className="text-2xl font-bold text-amber-300 my-1 font-mono">
            {projectKPIs.daysRemainingContract}
          </div>
          <div className="text-[11px] text-slate-400">
            Sisa: {projectKPIs.remainingWork.toFixed(1)}% Bobot
          </div>
        </div>
      </div>

      {/* 2. S-CURVE & CONTRACTOR PROGRESS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* S-Curve Chart (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Project S-Curve Cumulative</h3>
              </div>
              <p className="text-xs text-slate-400">Planned vs Actual vs Forecast Kurva-S Proyek HBR II</p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => onNavigateTab('scurve')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 rounded font-medium transition-colors"
              >
                Detail Analisis →
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sCurve} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="period" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  formatter={(value: any, name: any) => [`${value}%`, name === 'planned' ? 'Planned' : name === 'actual' ? 'Actual' : 'Forecast']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="plannedOriginal"
                  name="Kontrak Awal (B0)"
                  stroke="#38bdf8"
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="planned"
                  name="Addendum 4 (Terkini)"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual Progress"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="Forecast Completion"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Progress by Contractor (1 col) */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <span>Progress by Contractor</span>
              </h3>
              <button
                onClick={() => onNavigateTab('weekly_progress')}
                className="text-xs text-blue-400 hover:underline"
              >
                Weekly →
              </button>
            </div>

            {/* WIKA Card */}
            <div className="p-4 rounded-lg bg-slate-800/70 border border-slate-700/80 mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-slate-100">PT Wijaya Karya (WIKA)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
                  SPI: {projectKPIs.wikaProgress.spi.toFixed(3)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs py-2 border-y border-slate-700/60 my-2">
                <div>
                  <div className="text-slate-400 text-[10px]">PLAN</div>
                  <div className="font-semibold text-slate-200">{projectKPIs.wikaProgress.plan.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">ACTUAL</div>
                  <div className="font-bold text-emerald-400">{projectKPIs.wikaProgress.actual.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">DEVIATION</div>
                  <div className="font-semibold text-rose-400">{projectKPIs.wikaProgress.dev.toFixed(1)}%</div>
                </div>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${projectKPIs.wikaProgress.actual}%` }}
                />
              </div>
            </div>

            {/* GI Card */}
            <div className="p-4 rounded-lg bg-slate-800/70 border border-slate-700/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-slate-100">PT Girder Indonesia (GI)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                  SPI: {projectKPIs.giProgress.spi.toFixed(3)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs py-2 border-y border-slate-700/60 my-2">
                <div>
                  <div className="text-slate-400 text-[10px]">PLAN</div>
                  <div className="font-semibold text-slate-200">{projectKPIs.giProgress.plan.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">ACTUAL</div>
                  <div className="font-bold text-emerald-400">{projectKPIs.giProgress.actual.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">DEVIATION</div>
                  <div className="font-semibold text-rose-400">{projectKPIs.giProgress.dev.toFixed(1)}%</div>
                </div>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${projectKPIs.giProgress.actual}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Kontraktor Terdaftar: WIKA, GI</span>
            <span className="text-slate-300 font-mono">Cutoff: Jumat</span>
          </div>
        </div>
      </div>

      {/* 3. PROGRESS BY ZONE & PROGRESS BY PIER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress by Zone */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              <span>Progress by Zone</span>
            </h3>
            <span className="text-xs text-slate-400">{zones.length} Zona Terdaftar</span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {zoneProgressData.map(z => (
              <div key={z.zoneName} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="font-semibold text-slate-200">
                    {z.zoneName} <span className="text-slate-400 font-normal">({z.direction} • {z.pierCount} Pier)</span>
                  </div>
                  <div className="font-bold text-emerald-400 font-mono">{z.progress}%</div>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${z.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress by Pier (Stripmap Preview) */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Progress by Pier (Stripmap Quick View)</span>
              </h3>
              <button
                onClick={() => onNavigateTab('stripmap')}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                Buka Stripmap Penuh <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-60 overflow-y-auto p-1 custom-scrollbar">
              {filteredPiers.map(p => {
                let badgeBg = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
                if (p.status === 'On Progress') badgeBg = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
                if (p.status === 'Open') badgeBg = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
                if (p.status === 'N/A') badgeBg = 'bg-slate-700/50 text-slate-400 border-slate-600';

                return (
                  <button
                    key={p.pierId}
                    onClick={() => onSelectPier(p.pierNumber)}
                    className={`p-2 rounded-lg border text-center transition-all hover:scale-105 active:scale-95 ${badgeBg}`}
                  >
                    <div className="text-xs font-bold font-mono">{p.pierNumber}</div>
                    <div className="text-[10px] font-semibold mt-0.5">{p.overallProgress}%</div>
                    <div className="text-[9px] text-slate-400">{p.contractorId}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Complete
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block ml-1.5" /> In Progress
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block ml-1.5" /> Critical
            </span>
            <span className="font-mono text-slate-300">{filteredPiers.length} Pier</span>
          </div>
        </div>
      </div>

      {/* 4. MAJOR ACTIVITIES & RECOVERY PROGRESS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Major Activities */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ActivityIcon className="w-5 h-5 text-blue-400" />
              <span>Major Activities</span>
            </h3>
            <button
              onClick={() => onNavigateTab('wbs')}
              className="text-xs text-blue-400 hover:underline"
            >
              Lihat Semua WBS →
            </button>
          </div>

          <div className="space-y-3">
            {majorActivities.map(act => (
              <div key={act.activityId} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-200 truncate">{act.activityName}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      act.status === 'Completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : act.status === 'Delayed'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {act.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                  <span>
                    Pier {act.pierId} • {act.contractorId} • Bobot: {act.weight}%
                  </span>
                  <span className="font-mono text-slate-300">
                    Plan {act.progressPlan}% / Act {act.progressActual}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      act.progressActual >= act.progressPlan ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${act.progressActual}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recovery Progress Summary */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <span>Recovery Plan Overview</span>
              </h3>
              <button
                onClick={() => onNavigateTab('recovery')}
                className="text-xs text-blue-400 hover:underline"
              >
                Buka Catch-up Plan →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80">
                <div className="text-slate-400 text-[10px] font-semibold">RECOVERY GAP</div>
                <div className="text-xl font-bold text-rose-400 my-1 font-mono">
                  {recoveryPlan.recoveryGap.toFixed(2)}%
                </div>
                <div className="text-[10px] text-slate-400">Deviasi kumulatif terhadap baseline</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80">
                <div className="text-slate-400 text-[10px] font-semibold">TARGET RECOVERY</div>
                <div className="text-xl font-bold text-amber-400 my-1 font-mono">
                  {recoveryPlan.recoveryTarget.toFixed(2)}%
                </div>
                <div className="text-[10px] text-slate-400">Target pada Week 43</div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-blue-950/40 border border-blue-800/40 text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span>Percepatan Mingguan Diperlukan:</span>
                <span className="font-bold text-blue-300 font-mono">+{recoveryPlan.requiredWeeklyProgress}% / mg</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Percepatan Bulanan Diperlukan:</span>
                <span className="font-bold text-blue-300 font-mono">+{recoveryPlan.requiredMonthlyProgress}% / bln</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Strategi: Penambahan jam kerja malam & 1 set gantry</span>
            <span className="text-emerald-400 font-medium">Draft Approved</span>
          </div>
        </div>
      </div>

      {/* 5. CONSTRAINT & ISSUE SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Constraint Summary */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Constraint Register Summary</span>
            </h3>
            <button
              onClick={() => onNavigateTab('constraint')}
              className="text-xs text-blue-400 hover:underline"
            >
              Lihat Register ({constraints.length}) →
            </button>
          </div>

          <div className="space-y-2.5">
            {constraints.slice(0, 3).map(c => (
              <div key={c.constraintId} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-100 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {c.category}
                    </span>
                    Pier {c.pierNumber} ({c.contractorId})
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.status === 'Open'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : c.status === 'On Progress'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2 mt-1">{c.description}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-700/50">
                  <span>PIC: {c.pic}</span>
                  <span>Target: {c.targetResolution}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Issue Summary */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-400" />
              <span>Issue Register Summary</span>
            </h3>
            <button
              onClick={() => onNavigateTab('issue')}
              className="text-xs text-blue-400 hover:underline"
            >
              Lihat Register ({issues.length}) →
            </button>
          </div>

          <div className="space-y-2.5">
            {issues.slice(0, 3).map(iss => (
              <div key={iss.issueId} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-100">
                    Pier {iss.pierNumber} • {iss.contractorId}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      iss.status === 'Open'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : iss.status === 'On Progress'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {iss.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium line-clamp-1">{iss.issue}</p>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">Tindakan: {iss.action}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-700/50">
                  <span>PIC: {iss.pic}</span>
                  <span>Tgl: {iss.targetDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
