import React, { useState } from 'react';
import {
  Flame,
  Plus,
  Trash2,
  Edit2,
  Download,
  AlertCircle,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { IssueRecord, IssueStatus, ContractorId } from '../../types';

export const IssueRegisterView: React.FC = () => {
  const { issues, zones, piers, addIssue, updateIssue, deleteIssue, canEdit, exportToExcel } = useProject();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [contractorFilter, setContractorFilter] = useState<string>('ALL');

  const [showModal, setShowModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState<IssueRecord | null>(null);

  const [formData, setFormData] = useState<IssueRecord>({
    issueId: '',
    date: new Date().toISOString().split('T')[0],
    zoneId: 'Z-1S',
    pierNumber: 'P18S',
    contractorId: 'WIKA',
    issue: '',
    rootCause: '',
    impact: '',
    action: '',
    pic: '',
    targetDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: 'Open'
  });

  const [error, setError] = useState<string | null>(null);

  // Calculate Aging (Days)
  const calculateAging = (dateStr: string) => {
    if (!dateStr) return 0;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const filteredIssues = issues.filter(iss => {
    if (statusFilter !== 'ALL' && iss.status !== statusFilter) return false;
    if (contractorFilter !== 'ALL' && iss.contractorId !== contractorFilter) return false;
    return true;
  });

  const openAdd = () => {
    setEditingIssue(null);
    setFormData({
      issueId: `ISS-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      zoneId: 'Z-1S',
      pierNumber: 'P20S',
      contractorId: 'WIKA',
      issue: '',
      rootCause: '',
      impact: '',
      action: '',
      pic: '',
      targetDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'Open'
    });
    setError(null);
    setShowModal(true);
  };

  const openEdit = (iss: IssueRecord) => {
    setEditingIssue(iss);
    setFormData({ ...iss });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (editingIssue) {
      const res = updateIssue(formData);
      if (!res.success) setError(res.error || 'Gagal menyimpan perubahan.');
      else setShowModal(false);
    } else {
      const res = addIssue(formData);
      if (!res.success) setError(res.error || 'Gagal menambahkan issue.');
      else setShowModal(false);
    }
  };

  const handleExport = () => {
    const data = filteredIssues.map(i => ({
      'Issue ID': i.issueId,
      'Tanggal': i.date,
      'Zona': i.zoneId,
      'Pier No.': i.pierNumber,
      'Kontraktor': i.contractorId,
      'Issue Teknis': i.issue,
      'Root Cause': i.rootCause,
      'Dampak': i.impact,
      'Tindakan (Action)': i.action,
      'PIC': i.pic,
      'Target Date': i.targetDate,
      'Status': i.status,
      'Aging (Hari)': calculateAging(i.date)
    }));
    exportToExcel('Issue_Register_HBR2', 'Issues', data);
  };

  return (
    <div id="issue-register-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-rose-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Issue Register & Root Cause Analysis</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Log pelacakan masalah mutu teknis di lapangan, akar penyebab (root cause), rencana tindakan, dan target tanggal
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
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Input Issue Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1"
            >
              <option value="ALL">Semua Status</option>
              <option value="Open">Open</option>
              <option value="On Progress">On Progress</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-400">Kontraktor:</span>
            <select
              value={contractorFilter}
              onChange={e => setContractorFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1"
            >
              <option value="ALL">Semua Kontraktor</option>
              <option value="WIKA">WIKA</option>
              <option value="GI">GI</option>
            </select>
          </div>
        </div>

        <div className="text-slate-400">
          Total: <span className="font-bold text-white">{filteredIssues.length}</span> Issue
        </div>
      </div>

      {/* Issues Table */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800 text-slate-400 uppercase font-semibold border-b border-slate-700">
            <tr>
              <th className="p-3">ID Issue</th>
              <th className="p-3">Tanggal</th>
              <th className="p-3">Pier No.</th>
              <th className="p-3">Kontraktor</th>
              <th className="p-3">Masalah (Issue)</th>
              <th className="p-3">Akar Masalah (Root Cause)</th>
              <th className="p-3">Tindakan Mitigasi (Action)</th>
              <th className="p-3">PIC</th>
              <th className="p-3">Target Date</th>
              <th className="p-3 text-center">Aging</th>
              <th className="p-3">Status</th>
              {canEdit && <th className="p-3 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredIssues.map(i => {
              const aging = calculateAging(i.date);
              return (
                <tr key={i.issueId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-200">{i.issueId}</td>
                  <td className="p-3 font-mono text-slate-400 whitespace-nowrap">{i.date}</td>
                  <td className="p-3 font-mono font-bold text-white">{i.pierNumber}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        i.contractorId === 'WIKA'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {i.contractorId}
                    </span>
                  </td>
                  <td className="p-3 max-w-xs font-medium text-slate-200">{i.issue}</td>
                  <td className="p-3 max-w-xs text-slate-400">{i.rootCause}</td>
                  <td className="p-3 max-w-xs text-emerald-300 font-medium">{i.action}</td>
                  <td className="p-3 text-slate-300 whitespace-nowrap">{i.pic}</td>
                  <td className="p-3 font-mono text-slate-400 whitespace-nowrap">{i.targetDate}</td>
                  <td className="p-3 text-center font-mono font-bold">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        aging > 14 ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {aging} hr
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        i.status === 'Open'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : i.status === 'On Progress'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {i.status}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="p-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => openEdit(i)}
                        className="p-1 text-blue-400 hover:text-blue-300 mr-1"
                        title="Edit Issue"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteIssue(i.issueId)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                        title="Hapus Issue"
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

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingIssue ? `Edit Issue ${editingIssue.issueId}` : 'Input Issue Teknis Baru'}
            </h3>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Issue ID*</label>
                  <input
                    type="text"
                    required
                    value={formData.issueId}
                    disabled={!!editingIssue}
                    onChange={e => setFormData({ ...formData, issueId: e.target.value })}
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
                  <label className="block text-slate-300 font-semibold mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

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
                  <label className="block text-slate-300 font-semibold mb-1">Status Issue</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as IssueStatus })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Open">Open</option>
                    <option value="On Progress">On Progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Deskripsi Masalah (Issue)*</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Deskripsikan masalah teknis lapangan..."
                  value={formData.issue}
                  onChange={e => setFormData({ ...formData, issue: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Akar Masalah (Root Cause)*</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Mengapa masalah ini bisa terjadi..."
                  value={formData.rootCause}
                  onChange={e => setFormData({ ...formData, rootCause: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tindakan / Action Plan*</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Solusi dan langkah korektif..."
                  value={formData.action}
                  onChange={e => setFormData({ ...formData, action: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">PIC*</label>
                  <input
                    type="text"
                    required
                    value={formData.pic}
                    onChange={e => setFormData({ ...formData, pic: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Date</label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={e => setFormData({ ...formData, targetDate: e.target.value })}
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
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold"
                >
                  {editingIssue ? 'Simpan Perubahan' : 'Simpan Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
