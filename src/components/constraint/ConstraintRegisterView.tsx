import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Filter,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  ConstraintRecord,
  ConstraintCategory,
  ConstraintStatus,
  ContractorId
} from '../../types';

export const ConstraintRegisterView: React.FC = () => {
  const { constraints, zones, piers, addConstraint, updateConstraint, deleteConstraint, canEdit, exportToExcel } = useProject();

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [contractorFilter, setContractorFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [showModal, setShowModal] = useState(false);
  const [editingConstraint, setEditingConstraint] = useState<ConstraintRecord | null>(null);

  const [formData, setFormData] = useState<ConstraintRecord>({
    constraintId: '',
    zoneId: 'Z-1S',
    pierNumber: 'P18S',
    contractorId: 'WIKA',
    category: 'Utilitas',
    description: '',
    impact: '',
    pic: '',
    targetResolution: new Date().toISOString().split('T')[0],
    status: 'Open',
    dateIdentified: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  const [error, setError] = useState<string | null>(null);

  // Calculate Aging in days
  const calculateAging = (dateStr: string, status: ConstraintStatus) => {
    if (!dateStr) return 0;
    const identified = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diffDays = Math.max(0, Math.floor((now - identified) / (1000 * 60 * 60 * 24)));
    return diffDays;
  };

  const filteredConstraints = useMemo(() => {
    return constraints.filter(c => {
      if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;
      if (zoneFilter !== 'ALL' && c.zoneId !== zoneFilter) return false;
      if (contractorFilter !== 'ALL' && c.contractorId !== contractorFilter) return false;
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      return true;
    });
  }, [constraints, categoryFilter, zoneFilter, contractorFilter, statusFilter]);

  const openAdd = () => {
    setEditingConstraint(null);
    setFormData({
      constraintId: `CST-${Date.now().toString().slice(-4)}`,
      zoneId: 'Z-1S',
      pierNumber: 'P20S',
      contractorId: 'WIKA',
      category: 'Utilitas',
      description: '',
      impact: '',
      pic: '',
      targetResolution: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'Open',
      dateIdentified: new Date().toISOString().split('T')[0],
      remarks: ''
    });
    setError(null);
    setShowModal(true);
  };

  const openEdit = (c: ConstraintRecord) => {
    setEditingConstraint(c);
    setFormData({ ...c });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (editingConstraint) {
      const res = updateConstraint(formData);
      if (!res.success) setError(res.error || 'Gagal menyimpan perubahan.');
      else setShowModal(false);
    } else {
      const res = addConstraint(formData);
      if (!res.success) setError(res.error || 'Gagal menambahkan constraint.');
      else setShowModal(false);
    }
  };

  const handleExport = () => {
    const data = filteredConstraints.map(c => ({
      'Constraint ID': c.constraintId,
      'Zona': c.zoneId,
      'Pier No.': c.pierNumber,
      'Kontraktor': c.contractorId,
      'Category': c.category,
      'Description': c.description,
      'Impact': c.impact,
      'PIC': c.pic,
      'Target Resolution': c.targetResolution,
      'Status': c.status,
      'Aging (Hari)': calculateAging(c.dateIdentified, c.status),
      'Remarks': c.remarks || '-'
    }));
    exportToExcel('Constraint_Register_HBR2', 'Constraints', data);
  };

  const categories: ConstraintCategory[] = [
    'Lahan',
    'Utilitas',
    'Desain',
    'Akses Kerja',
    'Perijinan',
    'Material',
    'Equipment',
    'Lainnya'
  ];

  return (
    <div id="constraint-register-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Constraint Register (PME Control)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Log register kendala fisik/non-fisik (Lahan, Utilitas, Desain, Akses Kerja, Perijinan) dan pelacakan aging hari
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          {canEdit && (
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Input Constraint Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px]">Kategori:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Zone */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px]">Zona:</span>
            <select
              value={zoneFilter}
              onChange={e => setZoneFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs"
            >
              <option value="ALL">Semua Zona</option>
              {zones.map(z => (
                <option key={z.zoneId} value={z.zoneId}>
                  {z.zoneName}
                </option>
              ))}
            </select>
          </div>

          {/* Contractor */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px]">Kontraktor:</span>
            <select
              value={contractorFilter}
              onChange={e => setContractorFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs"
            >
              <option value="ALL">Semua</option>
              <option value="WIKA">WIKA</option>
              <option value="GI">GI</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs"
            >
              <option value="ALL">Semua Status</option>
              <option value="Open">Open</option>
              <option value="On Progress">On Progress</option>
              <option value="Closed">Closed</option>
              <option value="N/A">N/A</option>
            </select>
          </div>
        </div>

        <div className="text-slate-400">
          Total Constraint: <span className="font-bold text-white">{filteredConstraints.length}</span>
        </div>
      </div>

      {/* Constraints Table */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800 text-slate-400 uppercase font-semibold border-b border-slate-700">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Pier No.</th>
              <th className="p-3">Kontraktor</th>
              <th className="p-3">Kategori</th>
              <th className="p-3">Uraian Kendala (Description)</th>
              <th className="p-3">Dampak (Impact)</th>
              <th className="p-3">PIC</th>
              <th className="p-3">Target Selesai</th>
              <th className="p-3 text-center">Aging (Hari)</th>
              <th className="p-3">Status</th>
              {canEdit && <th className="p-3 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredConstraints.map(c => {
              const agingDays = calculateAging(c.dateIdentified, c.status);
              return (
                <tr key={c.constraintId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-200">{c.constraintId}</td>
                  <td className="p-3 font-mono font-bold text-white">{c.pierNumber}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.contractorId === 'WIKA'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {c.contractorId}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-200 border border-slate-700">
                      {c.category}
                    </span>
                  </td>
                  <td className="p-3 max-w-xs text-slate-200">{c.description}</td>
                  <td className="p-3 max-w-xs text-slate-400">{c.impact}</td>
                  <td className="p-3 font-medium text-slate-300 whitespace-nowrap">{c.pic}</td>
                  <td className="p-3 font-mono text-slate-400 whitespace-nowrap">{c.targetResolution}</td>
                  <td className="p-3 text-center font-mono font-bold">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        agingDays > 30
                          ? 'bg-rose-500/20 text-rose-300 font-black'
                          : agingDays > 14
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {agingDays} hr
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'Open'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : c.status === 'On Progress'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : c.status === 'Closed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="p-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1 text-blue-400 hover:text-blue-300 mr-1"
                        title="Edit Constraint"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteConstraint(c.constraintId)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                        title="Hapus Constraint"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingConstraint ? `Edit Constraint ${editingConstraint.constraintId}` : 'Input Constraint Register Baru'}
            </h3>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Constraint ID*</label>
                  <input
                    type="text"
                    required
                    value={formData.constraintId}
                    disabled={!!editingConstraint}
                    onChange={e => setFormData({ ...formData, constraintId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pier Number*</label>
                  <select
                    value={formData.pierNumber}
                    onChange={e => setFormData({ ...formData, pierNumber: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                  >
                    {piers.map(p => (
                      <option key={p.pierId} value={p.pierNumber}>
                        {p.pierNumber} ({p.contractorId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kontraktor*</label>
                  <select
                    value={formData.contractorId}
                    onChange={e => setFormData({ ...formData, contractorId: e.target.value as ContractorId })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="WIKA">WIKA</option>
                    <option value="GI">GI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kategori Kendala*</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as ConstraintCategory })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as ConstraintStatus })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Open">Open</option>
                    <option value="On Progress">On Progress</option>
                    <option value="Closed">Closed</option>
                    <option value="N/A">N/A</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Uraian Kendala (Description)*</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Deskripsikan hambatan/kendala secara detail..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Dampak Terhadap Proyek (Impact)</label>
                <textarea
                  rows={2}
                  placeholder="Dampak pada jadwal, lintasan kritis, atau biaya..."
                  value={formData.impact}
                  onChange={e => setFormData({ ...formData, impact: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Penanggung Jawab (PIC)*</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama / Jabatan PIC"
                    value={formData.pic}
                    onChange={e => setFormData({ ...formData, pic: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Penyelesaian</label>
                  <input
                    type="date"
                    value={formData.targetResolution}
                    onChange={e => setFormData({ ...formData, targetResolution: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold"
                >
                  {editingConstraint ? 'Simpan Perubahan' : 'Simpan Constraint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
