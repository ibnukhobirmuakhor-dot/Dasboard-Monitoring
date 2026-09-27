import React, { useState } from 'react';
import {
  ListTodo,
  Plus,
  Trash2,
  Edit2,
  Download,
  CheckCircle2,
  Clock,
  Users
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { ActionItem, ActionStatus } from '../../types';

export const ActionTrackerView: React.FC = () => {
  const { actionItems, addActionItem, updateActionItem, deleteActionItem, canEdit, exportToExcel } = useProject();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [meetingFilter, setMeetingFilter] = useState<string>('ALL');

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);

  const [formData, setFormData] = useState<ActionItem>({
    actionId: '',
    meeting: 'Weekly Progress Meeting #36',
    date: new Date().toISOString().split('T')[0],
    action: '',
    pic: '',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: 'Open',
    remarks: ''
  });

  const [error, setError] = useState<string | null>(null);

  const calculateAging = (dateStr: string) => {
    if (!dateStr) return 0;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const meetings = Array.from(new Set(actionItems.map(a => a.meeting)));

  const filteredItems = actionItems.filter(item => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (meetingFilter !== 'ALL' && item.meeting !== meetingFilter) return false;
    return true;
  });

  const openAdd = () => {
    setEditingItem(null);
    setFormData({
      actionId: `ACT-ITM-${Date.now().toString().slice(-4)}`,
      meeting: 'Weekly Coordination Meeting',
      date: new Date().toISOString().split('T')[0],
      action: '',
      pic: '',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'Open',
      remarks: ''
    });
    setError(null);
    setShowModal(true);
  };

  const openEdit = (itm: ActionItem) => {
    setEditingItem(itm);
    setFormData({ ...itm });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (editingItem) {
      const res = updateActionItem(formData);
      if (!res.success) setError(res.error || 'Gagal menyimpan perubahan.');
      else setShowModal(false);
    } else {
      const res = addActionItem(formData);
      if (!res.success) setError(res.error || 'Gagal menambahkan action item.');
      else setShowModal(false);
    }
  };

  const handleExport = () => {
    const data = filteredItems.map(a => ({
      'Action ID': a.actionId,
      'Meeting': a.meeting,
      'Tanggal': a.date,
      'Action Description': a.action,
      'PIC': a.pic,
      'Due Date': a.dueDate,
      'Status': a.status,
      'Aging (Hari)': calculateAging(a.date),
      'Remarks': a.remarks || '-'
    }));
    exportToExcel('Action_Tracker_HBR2', 'Action Items', data);
  };

  return (
    <div id="action-tracker-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Meeting Action Tracker</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Tindak lanjut komitmen rapat koordinasi mingguan, rapat konsultan supervisi, dan owner HBR II
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
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Input Action Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
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
            <span className="text-slate-400">Meeting:</span>
            <select
              value={meetingFilter}
              onChange={e => setMeetingFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1"
            >
              <option value="ALL">Semua Rapat</option>
              {meetings.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-slate-400">
          Total: <span className="font-bold text-white">{filteredItems.length}</span> Komitmen Action
        </div>
      </div>

      {/* Table */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800 text-slate-400 uppercase font-semibold border-b border-slate-700">
            <tr>
              <th className="p-3">Action ID</th>
              <th className="p-3">Nama Rapat (Meeting)</th>
              <th className="p-3">Tanggal Rapat</th>
              <th className="p-3">Tindakan / Komitmen (Action)</th>
              <th className="p-3">PIC</th>
              <th className="p-3">Due Date</th>
              <th className="p-3 text-center">Aging</th>
              <th className="p-3">Status</th>
              <th className="p-3">Remarks</th>
              {canEdit && <th className="p-3 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredItems.map(a => {
              const aging = calculateAging(a.date);
              return (
                <tr key={a.actionId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-200">{a.actionId}</td>
                  <td className="p-3 font-medium text-white max-w-xs">{a.meeting}</td>
                  <td className="p-3 font-mono text-slate-400 whitespace-nowrap">{a.date}</td>
                  <td className="p-3 max-w-sm text-slate-200">{a.action}</td>
                  <td className="p-3 font-medium text-slate-300 whitespace-nowrap">{a.pic}</td>
                  <td className="p-3 font-mono text-slate-400 whitespace-nowrap">{a.dueDate}</td>
                  <td className="p-3 text-center font-mono font-bold">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        aging > 14 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {aging} hr
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.status === 'Open'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : a.status === 'On Progress'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 text-[11px]">{a.remarks || '-'}</td>
                  {canEdit && (
                    <td className="p-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => openEdit(a)}
                        className="p-1 text-blue-400 hover:text-blue-300 mr-1"
                        title="Edit Action"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteActionItem(a.actionId)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                        title="Hapus Action"
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

      {/* Modal Add / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingItem ? `Edit Action ${editingItem.actionId}` : 'Input Action Tracker Baru'}
            </h3>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Action ID*</label>
                  <input
                    type="text"
                    required
                    value={formData.actionId}
                    disabled={!!editingItem}
                    onChange={e => setFormData({ ...formData, actionId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as ActionStatus })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Open">Open</option>
                    <option value="On Progress">On Progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nama Rapat / Agenda (Meeting)*</label>
                <input
                  type="text"
                  required
                  value={formData.meeting}
                  onChange={e => setFormData({ ...formData, meeting: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tindakan / Action Description*</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Uraian butir kesepakatan atau tindak lanjut rapat..."
                  value={formData.action}
                  onChange={e => setFormData({ ...formData, action: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tanggal Rapat</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">PIC (Penanggung Jawab)*</label>
                <input
                  type="text"
                  required
                  placeholder="Nama / Instansi"
                  value={formData.pic}
                  onChange={e => setFormData({ ...formData, pic: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="Catatan tambahan"
                  value={formData.remarks || ''}
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
