import React, { useState } from 'react';
import { X, Plus, Calendar, AlertCircle } from 'lucide-react';
import { ActivityItem, ActivityStatus, ContractorId, WBSNode, PierMaster } from '../../types';
import { calculateDurationDays, addDays, parsePredecessors, formatPredecessors } from '../../utils/msProjectUtils';

interface TaskModalProps {
  activity?: ActivityItem | null;
  allActivities: ActivityItem[];
  wbsNodes: WBSNode[];
  piers: PierMaster[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: ActivityItem) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  activity,
  allActivities,
  wbsNodes,
  piers,
  isOpen,
  onClose,
  onSave
}) => {
  const isEditing = !!activity;

  const [activityId, setActivityId] = useState<string>(activity?.activityId || `ACT-${Date.now().toString().slice(-4)}`);
  const [activityName, setActivityName] = useState<string>(activity?.activityName || '');
  const [wbsId, setWbsId] = useState<string>(activity?.wbsId || (wbsNodes[0]?.wbsId || 'WBS-1'));
  const [wbsCode, setWbsCode] = useState<string>(activity?.wbsCode || '');
  const [pierId, setPierId] = useState<string>(activity?.pierId || (piers[0]?.pierNumber || 'P.16.S'));
  const [contractorId, setContractorId] = useState<ContractorId>(activity?.contractorId || 'WIKA');
  const [startPlan, setStartPlan] = useState<string>(activity?.startPlan || new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState<number>(activity?.duration || (activity ? calculateDurationDays(activity.startPlan, activity.finishPlan) : 30));
  const [finishPlan, setFinishPlan] = useState<string>(activity?.finishPlan || addDays(new Date().toISOString().split('T')[0], 29));
  const [weight, setWeight] = useState<number>(activity?.weight || 0.5);
  const [progressPlan, setProgressPlan] = useState<number>(activity?.progressPlan || 0);
  const [progressActual, setProgressActual] = useState<number>(activity?.progressActual || 0);
  const [status, setStatus] = useState<ActivityStatus>(activity?.status || 'Not Started');
  const [predecessorsInput, setPredecessorsInput] = useState<string>(activity ? formatPredecessors(activity.predecessors, allActivities) : '');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleDurationChange = (dur: number) => {
    setDuration(dur);
    if (startPlan && dur > 0) {
      setFinishPlan(addDays(startPlan, dur - 1));
    }
  };

  const handleStartChange = (start: string) => {
    setStartPlan(start);
    if (start && duration > 0) {
      setFinishPlan(addDays(start, duration - 1));
    }
  };

  const handleFinishChange = (finish: string) => {
    setFinishPlan(finish);
    if (startPlan && finish) {
      const calcDur = calculateDurationDays(startPlan, finish);
      setDuration(calcDur);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!activityId.trim() || !activityName.trim()) {
      setError('ID Aktivitas dan Nama Aktivitas wajib diisi.');
      return;
    }

    if (new Date(finishPlan) < new Date(startPlan)) {
      setError('Tanggal Finish tidak boleh lebih awal dari Start.');
      return;
    }

    // Parse predecessors input
    const parsedDeps = parsePredecessors(predecessorsInput, allActivities);

    const savedItem: ActivityItem = {
      activityId: activityId.trim(),
      activityName: activityName.trim(),
      wbsId,
      wbsCode: wbsCode.trim() || undefined,
      pierId,
      contractorId,
      startPlan,
      finishPlan,
      duration,
      weight: Number(weight) || 0,
      progressPlan: Number(progressPlan) || 0,
      progressActual: Number(progressActual) || 0,
      status,
      predecessors: parsedDeps,
      startActual: activity?.startActual,
      finishActual: activity?.finishActual
    };

    onSave(savedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? 'Edit Aktivitas WBS' : 'Tambah Aktivitas Baru (MS Project Task)'}
              </h3>
              <p className="text-xs text-slate-400">
                Pengaturan parameter durasi, jadwal mulai, target selesai, dan hubungan predecessor
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Activity ID <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                disabled={isEditing}
                value={activityId}
                onChange={e => setActivityId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-hidden disabled:opacity-60"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                WBS Code (e.g. 1.2.3.1)
              </label>
              <input
                type="text"
                value={wbsCode}
                onChange={e => setWbsCode(e.target.value)}
                placeholder="1.2.3.1"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
              Nama Aktivitas / Task Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={activityName}
              onChange={e => setActivityName(e.target.value)}
              placeholder="e.g. Bored Pile D1500mm P.18.S"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-hidden font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Parent WBS
              </label>
              <select
                value={wbsId}
                onChange={e => setWbsId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-hidden"
              >
                {wbsNodes.map(w => (
                  <option key={w.wbsId} value={w.wbsId}>
                    {w.wbsCode} - {w.wbsName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Lokasi Pier
              </label>
              <select
                value={pierId}
                onChange={e => setPierId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-hidden font-mono"
              >
                <option value="ALL">ALL (Project Wide)</option>
                {piers.slice(0, 100).map(p => (
                  <option key={p.pierId} value={p.pierNumber}>
                    {p.pierNumber} ({p.ruas || p.zoneId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Kontraktor Pelaksana
              </label>
              <select
                value={contractorId}
                onChange={e => setContractorId(e.target.value as ContractorId)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-hidden"
              >
                <option value="WIKA">WIKA (PT Wijaya Karya)</option>
                <option value="GI">GI (PT Girder Indonesia)</option>
                <option value="WIKA-GI">Joint (WIKA - GI)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Start Plan
              </label>
              <input
                type="date"
                value={startPlan}
                onChange={e => handleStartChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Durasi (Hari)
              </label>
              <input
                type="number"
                min={1}
                value={duration}
                onChange={e => handleDurationChange(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Finish Plan
              </label>
              <input
                type="date"
                value={finishPlan}
                onChange={e => handleFinishChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
              Predecessors (MS Project Notation: e.g. "2FS", "3SS+2d", "4FF")
            </label>
            <input
              type="text"
              value={predecessorsInput}
              onChange={e => setPredecessorsInput(e.target.value)}
              placeholder="Contoh: 2FS, 3SS+2d, 4"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-hidden"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Gunakan format nomor baris atau ID task (mis. <span className="text-blue-300">2FS+2d</span> artinya tergantung baris #2 tipe Finish-to-Start dengan lag 2 hari).
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Bobot (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={weight}
                onChange={e => setWeight(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Progress Plan (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={progressPlan}
                onChange={e => setProgressPlan(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Progress Actual (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={progressActual}
                onChange={e => setProgressActual(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ActivityStatus)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-hidden"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Delayed">Delayed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isEditing ? 'Simpan Perubahan Task' : 'Tambah Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
