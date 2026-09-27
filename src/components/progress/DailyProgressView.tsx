import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Trash2,
  Image,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Users,
  Wrench,
  Sparkles
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { ContractorId } from '../../types';

export const DailyProgressView: React.FC = () => {
  const {
    dailyProgress,
    zones,
    piers,
    wbs,
    activities,
    addDailyProgress,
    deleteDailyProgress,
    canInputProgress,
    currentRole,
    contractorUser
  } = useProject();

  const [showForm, setShowForm] = useState(false);
  const [filterContractor, setFilterContractor] = useState<'ALL' | ContractorId>('ALL');
  const [filterDate, setFilterDate] = useState<string>('');

  // Form states
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    contractorId: (currentRole === 'Contractor' ? contractorUser : 'WIKA') as ContractorId,
    zoneId: 'Z-1S',
    pierId: 'P18S',
    wbsId: 'WBS-6-REBAR',
    activityId: 'ACT-P18S-REBAR',
    plannedProgress: 2.0,
    actualProgress: 1.8,
    quantityPlan: 10,
    quantityActual: 9,
    unit: 'm3',
    manpower: 16,
    equipment: 'Crawler Crane 50T, Bar Bender',
    description: '',
    photoUrl: '',
    remarks: ''
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Available piers based on zone
  const availablePiers = piers.filter(p => p.zoneId === formData.zoneId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const result = addDailyProgress({
      ...formData,
      plannedProgress: Number(formData.plannedProgress),
      actualProgress: Number(formData.actualProgress),
      quantityPlan: Number(formData.quantityPlan),
      quantityActual: Number(formData.quantityActual),
      manpower: Number(formData.manpower)
    });

    if (!result.success) {
      setFormError(result.error || 'Gagal menyimpan daily progress.');
    } else {
      setFormSuccess('Progress harian berhasil diverifikasi dan disimpan ke database.');
      // Reset description and remarks
      setFormData(prev => ({
        ...prev,
        description: '',
        remarks: '',
        photoUrl: ''
      }));
      setTimeout(() => setFormSuccess(null), 4000);
    }
  };

  const filteredLogs = dailyProgress.filter(log => {
    if (filterContractor !== 'ALL' && log.contractorId !== filterContractor) return false;
    if (filterDate && log.date !== filterDate) return false;
    return true;
  });

  return (
    <div id="daily-progress-view" className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Daily Progress Entry & Log</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Input capaian harian pekerjaan elevated, peralatan, tenaga kerja (manpower), dan dokumentasi lapangan
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canInputProgress && (
            <button
              id="btn-toggle-daily-form"
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{showForm ? 'Sembunyikan Form' : '+ Input Daily Progress'}</span>
            </button>
          )}
        </div>
      </div>

      {/* INPUT FORM */}
      {showForm && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-700 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Form Input Daily Progress (PME / Contractor)</span>
            </h3>
            <span className="text-xs text-slate-400">
              Role: <span className="font-semibold text-blue-400">{currentRole}</span>
            </span>
          </div>

          {formError && (
            <div className="p-3 mb-4 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 mb-4 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Date */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tanggal (Date)*</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Contractor */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Kontraktor*</label>
                <select
                  value={formData.contractorId}
                  disabled={currentRole === 'Contractor'}
                  onChange={e => setFormData({ ...formData, contractorId: e.target.value as ContractorId })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500 disabled:opacity-75"
                >
                  <option value="WIKA">WIKA (PT Wijaya Karya)</option>
                  <option value="GI">GI (PT Girder Indonesia)</option>
                </select>
              </div>

              {/* Zone */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Zona (Zone)*</label>
                <select
                  value={formData.zoneId}
                  onChange={e => setFormData({ ...formData, zoneId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500"
                >
                  {zones.map(z => (
                    <option key={z.zoneId} value={z.zoneId}>
                      {z.zoneName} ({z.direction})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pier */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Pier No.*</label>
                <select
                  value={formData.pierId}
                  onChange={e => setFormData({ ...formData, pierId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500"
                >
                  {availablePiers.map(p => (
                    <option key={p.pierId} value={p.pierNumber}>
                      {p.pierNumber} ({p.contractorId})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* WBS */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">WBS Level</label>
                <select
                  value={formData.wbsId}
                  onChange={e => setFormData({ ...formData, wbsId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500"
                >
                  {wbs.map(w => (
                    <option key={w.wbsId} value={w.wbsId}>
                      {w.wbsCode} - {w.wbsName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Activity */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Aktivitas (Activity)*</label>
                <select
                  value={formData.activityId}
                  onChange={e => setFormData({ ...formData, activityId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500"
                >
                  {activities.map(a => (
                    <option key={a.activityId} value={a.activityId}>
                      {a.activityName} ({a.contractorId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Planned Progress % */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Planned Progress (%)*</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={formData.plannedProgress}
                  onChange={e => setFormData({ ...formData, plannedProgress: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Actual Progress % */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Actual Progress (%)*</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={formData.actualProgress}
                  onChange={e => setFormData({ ...formData, actualProgress: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500 font-mono text-emerald-400 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {/* Quantity Plan */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Volume Plan</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.quantityPlan}
                  onChange={e => setFormData({ ...formData, quantityPlan: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Quantity Actual */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Volume Actual</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.quantityActual}
                  onChange={e => setFormData({ ...formData, quantityActual: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Satuan (Unit)</label>
                <input
                  type="text"
                  placeholder="m3 / Ton / Titik"
                  value={formData.unit}
                  onChange={e => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Manpower */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Manpower (Orang)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.manpower}
                  onChange={e => setFormData({ ...formData, manpower: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Equipment */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Alat Berat (Equipment)</label>
                <input
                  type="text"
                  placeholder="Crane 50T, Pump"
                  value={formData.equipment}
                  onChange={e => setFormData({ ...formData, equipment: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Description & Remarks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Deskripsi Pekerjaan*</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Pengecoran beton Pier Column segmen 2, slump test 12cm..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Catatan / Remarks / Cuaca</label>
                <textarea
                  rows={2}
                  placeholder="Kondisi cuaca, kendala minor, catatan QC konsultan..."
                  value={formData.remarks}
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>
            </div>

            {/* Submit button */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Daily Progress</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER BAR & LOGS TABLE */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>Riwayat Laporan Progress Harian ({filteredLogs.length})</span>
          </h3>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={filterContractor}
              onChange={e => setFilterContractor(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
            >
              <option value="ALL">Semua Kontraktor</option>
              <option value="WIKA">WIKA</option>
              <option value="GI">GI</option>
            </select>

            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 focus:outline-hidden"
            />

            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-slate-400 hover:text-white px-1.5 py-1"
              >
                Reset Tgl
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold border-b border-slate-700">
              <tr>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Kontraktor</th>
                <th className="p-3">Pier</th>
                <th className="p-3">Deskripsi Pekerjaan</th>
                <th className="p-3 text-right">Plan %</th>
                <th className="p-3 text-right">Actual %</th>
                <th className="p-3 text-right">Volume</th>
                <th className="p-3 text-center">Manpower</th>
                <th className="p-3">Alat & Catatan</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-500 italic">
                    Belum ada catatan daily progress untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-medium text-white whitespace-nowrap">
                      {log.date}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.contractorId === 'WIKA'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {log.contractorId}
                      </span>
                    </td>
                    <td className="p-3 font-bold font-mono text-slate-200">{log.pierId}</td>
                    <td className="p-3 max-w-xs">
                      <div className="font-medium text-slate-200 line-clamp-1">{log.description}</div>
                      <div className="text-[10px] text-slate-400 truncate">{log.remarks}</div>
                    </td>
                    <td className="p-3 text-right font-mono">{log.plannedProgress}%</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      {log.actualProgress}%
                    </td>
                    <td className="p-3 text-right font-mono whitespace-nowrap">
                      {log.quantityActual} / {log.quantityPlan} {log.unit}
                    </td>
                    <td className="p-3 text-center font-mono">{log.manpower} org</td>
                    <td className="p-3 text-[11px] text-slate-400 max-w-xs truncate">
                      {log.equipment}
                    </td>
                    <td className="p-3 text-center">
                      {canInputProgress && (
                        <button
                          onClick={() => deleteDailyProgress(log.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          title="Hapus progress ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
