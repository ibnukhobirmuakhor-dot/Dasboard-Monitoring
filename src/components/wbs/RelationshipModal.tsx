import React, { useState } from 'react';
import { X, Plus, Trash2, Link2, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { ActivityItem, TaskDependency, DependencyType } from '../../types';
import { addDays, calculateDurationDays } from '../../utils/msProjectUtils';

interface RelationshipModalProps {
  activity: ActivityItem;
  allActivities: ActivityItem[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedActivity: ActivityItem) => void;
}

export const RelationshipModal: React.FC<RelationshipModalProps> = ({
  activity,
  allActivities,
  isOpen,
  onClose,
  onSave
}) => {
  const [dependencies, setDependencies] = useState<TaskDependency[]>(activity.predecessors || []);
  const [newPredId, setNewPredId] = useState<string>('');
  const [newType, setNewType] = useState<DependencyType>('FS');
  const [newLag, setNewLag] = useState<number>(0);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  // Available predecessors (cannot depend on itself)
  const availablePredecessors = allActivities.filter(a => a.activityId !== activity.activityId);

  const handleAddDependency = () => {
    setError('');
    if (!newPredId) {
      setError('Pilih aktivitas Predecessor.');
      return;
    }

    if (dependencies.some(d => d.predecessorId === newPredId)) {
      setError('Aktivitas ini sudah ada dalam daftar Predecessor.');
      return;
    }

    const newDep: TaskDependency = {
      predecessorId: newPredId,
      type: newType,
      lagDays: Number(newLag) || 0
    };

    setDependencies(prev => [...prev, newDep]);
    setNewPredId('');
    setNewLag(0);
    setNewType('FS');
  };

  const handleRemoveDependency = (predecessorId: string) => {
    setDependencies(prev => prev.filter(d => d.predecessorId !== predecessorId));
  };

  const handleSaveAll = () => {
    // Optionally calculate new start date based on dependencies
    let calculatedStart = activity.startPlan;
    const duration = activity.duration || calculateDurationDays(activity.startPlan, activity.finishPlan);

    dependencies.forEach(dep => {
      const predAct = allActivities.find(a => a.activityId === dep.predecessorId);
      if (!predAct) return;

      const lag = dep.lagDays || 0;
      let candidate = '';
      if (dep.type === 'FS') {
        candidate = addDays(predAct.finishPlan, 1 + lag);
      } else if (dep.type === 'SS') {
        candidate = addDays(predAct.startPlan, lag);
      } else if (dep.type === 'FF') {
        candidate = addDays(predAct.finishPlan, -duration + 1 + lag);
      }
      if (candidate && candidate > calculatedStart) {
        calculatedStart = candidate;
      }
    });

    const calculatedFinish = addDays(calculatedStart, duration - 1);

    const updated: ActivityItem = {
      ...activity,
      predecessors: dependencies,
      startPlan: calculatedStart,
      finishPlan: calculatedFinish,
      duration
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Kelola Hubungan Task (MS Project Relationship)</h3>
              <p className="text-xs text-slate-400">
                Task: <span className="text-blue-300 font-mono font-semibold">{activity.wbsCode || activity.activityId}</span> - {activity.activityName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Info Card */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Start Plan Saat Ini</span>
              <p className="font-mono text-emerald-400 font-bold mt-0.5">{activity.startPlan}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Finish Plan Saat Ini</span>
              <p className="font-mono text-emerald-400 font-bold mt-0.5">{activity.finishPlan}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Durasi Task</span>
              <p className="font-mono text-white font-bold mt-0.5">{activity.duration || calculateDurationDays(activity.startPlan, activity.finishPlan)} Hari</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Kontraktor Pelaksana</span>
              <p className="font-semibold text-blue-400 mt-0.5">{activity.contractorId}</p>
            </div>
          </div>

          {/* Current Predecessors List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <span>Daftar Predecessor (Aktivitas Pendahulu)</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                  {dependencies.length}
                </span>
              </h4>
            </div>

            {dependencies.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-800/30 border border-slate-700/40 text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-500 opacity-60" />
                <p>Belum ada predecessor untuk aktivitas ini (Mulai independen / awal jadwal).</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dependencies.map((dep, idx) => {
                  const predAct = allActivities.find(a => a.activityId === dep.predecessorId);
                  const predRowIdx = allActivities.findIndex(a => a.activityId === dep.predecessorId) + 1;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/80 border border-slate-700"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="px-2 py-1 rounded bg-slate-700 text-slate-300 font-mono text-[11px] font-bold shrink-0">
                          #{predRowIdx}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate text-xs">
                            {predAct?.activityName || dep.predecessorId}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            ID: {dep.predecessorId} • Selesai: {predAct?.finishPlan || '-'} • Pier: {predAct?.pierId || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-1 rounded font-bold text-[11px] border ${
                          dep.type === 'FS' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                          dep.type === 'SS' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                          dep.type === 'FF' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                          'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {dep.type}
                        </span>

                        <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[11px]">
                          Lag: {dep.lagDays ? `${dep.lagDays > 0 ? `+${dep.lagDays}` : dep.lagDays}d` : '0d'}
                        </span>

                        <button
                          onClick={() => handleRemoveDependency(dep.predecessorId)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-500/30 transition-colors cursor-pointer"
                          title="Hapus Predecessor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add New Predecessor Section */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-200 text-xs flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              <span>Tambah Hubungan Ketergantungan Baru</span>
            </h4>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              {/* Select Predecessor */}
              <div className="sm:col-span-6">
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Pilih Aktivitas Predecessor
                </label>
                <select
                  value={newPredId}
                  onChange={e => setNewPredId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-hidden"
                >
                  <option value="">-- Pilih Predecessor --</option>
                  {availablePredecessors.map((act, index) => (
                    <option key={act.activityId} value={act.activityId}>
                      #{index + 1} [{act.pierId}] {act.activityName} ({act.finishPlan})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dependency Type */}
              <div className="sm:col-span-3">
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Tipe Hubungan
                </label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as DependencyType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-hidden"
                >
                  <option value="FS">FS (Finish-to-Start)</option>
                  <option value="SS">SS (Start-to-Start)</option>
                  <option value="FF">FF (Finish-to-Finish)</option>
                  <option value="SF">SF (Start-to-Finish)</option>
                </select>
              </div>

              {/* Lag (Days) */}
              <div className="sm:col-span-3">
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Lag (Hari)
                </label>
                <input
                  type="number"
                  value={newLag}
                  onChange={e => setNewLag(parseInt(e.target.value, 10) || 0)}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono focus:outline-hidden"
                />
              </div>
            </div>

            {/* Relationship Type Helper Explanation */}
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              {newType === 'FS' && (
                <p>
                  <strong className="text-blue-300">Finish-to-Start (FS):</strong> Aktivitas ini baru dapat dimulai setelah predecessor selesai (default paling umum).
                </p>
              )}
              {newType === 'SS' && (
                <p>
                  <strong className="text-cyan-300">Start-to-Start (SS):</strong> Aktivitas ini dimulai bersamaan dengan dimulainya predecessor (ditambah lag bila ada).
                </p>
              )}
              {newType === 'FF' && (
                <p>
                  <strong className="text-emerald-300">Finish-to-Finish (FF):</strong> Aktivitas ini selesai saat atau setelah predecessor selesai.
                </p>
              )}
              {newType === 'SF' && (
                <p>
                  <strong className="text-amber-300">Start-to-Finish (SF):</strong> Aktivitas ini harus selesai saat predecessor dimulai.
                </p>
              )}
            </div>

            <button
              onClick={handleAddDependency}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambahkan ke Predecessor</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSaveAll}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Perubahan Hubungan & Perbarui Jadwal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
