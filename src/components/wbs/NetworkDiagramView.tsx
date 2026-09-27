import React, { useState } from 'react';
import { ActivityItem } from '../../types';
import { Flame, Link2, Clock, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';

interface NetworkDiagramViewProps {
  activities: ActivityItem[];
  onSelectActivity: (act: ActivityItem) => void;
}

export const NetworkDiagramView: React.FC<NetworkDiagramViewProps> = ({
  activities,
  onSelectActivity
}) => {
  const [filterCriticalOnly, setFilterCriticalOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = activities.filter(a => {
    if (filterCriticalOnly && !a.isCritical) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.activityName.toLowerCase().includes(q) ||
        a.activityId.toLowerCase().includes(q) ||
        a.pierId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Cari aktivitas di Network Diagram..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden w-64"
          />
          <button
            onClick={() => setFilterCriticalOnly(!filterCriticalOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              filterCriticalOnly
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Hanya Critical Path ({activities.filter(a => a.isCritical).length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-xs border-2 border-rose-500 bg-rose-950/30" />
            Critical Path (Float ≤ 1 hari)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-xs border border-slate-600 bg-slate-800" />
            Non-Critical
          </span>
        </div>
      </div>

      {/* Network Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((act, index) => {
          const predCount = act.predecessors?.length || 0;
          const isCrit = act.isCritical;

          return (
            <div
              key={act.activityId}
              onClick={() => onSelectActivity(act)}
              className={`p-4 rounded-xl transition-all cursor-pointer hover:shadow-lg border ${
                isCrit
                  ? 'bg-slate-900/90 border-rose-500/60 shadow-rose-950/20 hover:border-rose-400'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header bar */}
              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-mono font-bold text-slate-400">#{index + 1}</span>
                  {isCrit ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-0.5">
                      <Flame className="w-3 h-3" /> Critical
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      Standard
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-blue-400 truncate font-semibold">
                    {act.wbsCode || act.activityId}
                  </span>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  act.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300' :
                  act.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300' :
                  act.status === 'Delayed' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {act.status}
                </span>
              </div>

              {/* Task Name */}
              <h4 className="font-bold text-slate-100 text-xs line-clamp-2 min-h-8 mb-3">
                {act.activityName}
              </h4>

              {/* MS Project Node Box Matrix (ES, EF, LS, LF) */}
              <div className="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800 font-mono text-[11px] mb-3">
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800/60">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Early Start (ES)</span>
                  <span className="text-emerald-400 font-semibold">{act.earlyStart || act.startPlan}</span>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800/60">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Early Finish (EF)</span>
                  <span className="text-emerald-400 font-semibold">{act.earlyFinish || act.finishPlan}</span>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800/60">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Late Start (LS)</span>
                  <span className="text-amber-400 font-semibold">{act.lateStart || act.startPlan}</span>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800/60">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Late Finish (LF)</span>
                  <span className="text-amber-400 font-semibold">{act.lateFinish || act.finishPlan}</span>
                </div>
              </div>

              {/* Bottom Specs */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-white font-semibold">
                    Durasi: {act.duration || 1} Hari
                  </span>
                  <span>•</span>
                  <span className={`font-mono font-bold ${isCrit ? 'text-rose-400' : 'text-slate-300'}`}>
                    Float: {act.totalFloat ?? 0}d
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-slate-300">
                    {act.contractorId}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 text-[10px] font-mono font-bold">
                    Pier: {act.pierId}
                  </span>
                </div>
              </div>

              {/* Predecessors pills */}
              {predCount > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-1 flex-wrap text-[10px]">
                  <Link2 className="w-3 h-3 text-blue-400 shrink-0" />
                  <span className="text-slate-500">Pred:</span>
                  {act.predecessors?.map((p, pIdx) => (
                    <span key={pIdx} className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-blue-300 font-mono">
                      {p.predecessorId} ({p.type}{p.lagDays ? `+${p.lagDays}d` : ''})
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
