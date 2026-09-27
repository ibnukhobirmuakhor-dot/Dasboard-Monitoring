import React, { useState } from 'react';
import {
  Package,
  Truck,
  Users,
  Wrench,
  Download,
  AlertCircle,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export const ResourceMonitoringView: React.FC = () => {
  const { materials, equipment, manpower, exportToExcel } = useProject();
  const [activeTab, setActiveTab] = useState<'material' | 'equipment' | 'manpower'>('material');
  const [contractorFilter, setContractorFilter] = useState<'ALL' | 'WIKA' | 'GI'>('ALL');

  // Filtered lists
  const filteredMaterials = materials.filter(m =>
    contractorFilter === 'ALL' ? true : m.contractorId === contractorFilter
  );

  const filteredEquipment = equipment.filter(e =>
    contractorFilter === 'ALL' ? true : e.contractorId === contractorFilter
  );

  const filteredManpower = manpower.filter(mp =>
    contractorFilter === 'ALL' ? true : mp.contractorId === contractorFilter
  );

  const handleExport = () => {
    if (activeTab === 'material') {
      const data = filteredMaterials.map(m => ({
        'Material Name': m.materialName,
        'Satuan': m.unit,
        'Required Total': m.required,
        'Delivered': m.delivered,
        'Used (Terpasang)': m.used,
        'Stock Balance': m.balance,
        'Status': m.status,
        'Kontraktor': m.contractorId
      }));
      exportToExcel('Monitoring_Material_HBR2', 'Materials', data);
    } else if (activeTab === 'equipment') {
      const data = filteredEquipment.map(e => ({
        'Nama Alat': e.equipmentName,
        'Kapasitas': e.capacity,
        'Jumlah (Qty)': e.qty,
        'Kontraktor': e.contractorId,
        'Lokasi Pier': e.locationPier,
        'Status Operasional': e.status
      }));
      exportToExcel('Monitoring_Equipment_HBR2', 'Equipment', data);
    } else {
      const data = filteredManpower.map(mp => ({
        'Kategori Tenaga Kerja': mp.category,
        'Kontraktor': mp.contractorId,
        'Rencana (Org)': mp.planQty,
        'Aktual (Org)': mp.actualQty,
        'Varians': mp.variance
      }));
      exportToExcel('Monitoring_Manpower_HBR2', 'Manpower', data);
    }
  };

  return (
    <div id="resource-monitoring-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Resource Monitoring Control</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Pelacakan terintegrasi 3 elemen utama konstruksi: Material Utama, Alat Berat (Equipment), dan Tenaga Kerja (Manpower)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400 px-1 text-[11px]">Kontraktor:</span>
            {(['ALL', 'WIKA', 'GI'] as const).map(c => (
              <button
                key={c}
                onClick={() => setContractorFilter(c)}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  contractorFilter === c ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {c === 'ALL' ? 'Semua' : c}
              </button>
            ))}
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

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('material')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold transition-colors ${
            activeTab === 'material'
              ? 'border-blue-500 text-blue-400 bg-slate-800/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>1. Material Monitoring ({filteredMaterials.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('equipment')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold transition-colors ${
            activeTab === 'equipment'
              ? 'border-blue-500 text-blue-400 bg-slate-800/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>2. Equipment Monitoring ({filteredEquipment.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('manpower')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold transition-colors ${
            activeTab === 'manpower'
              ? 'border-blue-500 text-blue-400 bg-slate-800/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>3. Manpower Monitoring ({filteredManpower.length})</span>
        </button>
      </div>

      {/* TAB 1: MATERIAL */}
      {activeTab === 'material' && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Status Pasokan & Penggunaan Material Utama
            </h3>
            <span className="text-xs text-slate-400">
              Formula: Balance = Delivered - Used
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-400 uppercase font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3">Nama Material</th>
                  <th className="p-3">Kontraktor</th>
                  <th className="p-3 text-right">Required (Kebutuhan)</th>
                  <th className="p-3 text-right">Delivered (Terkirim)</th>
                  <th className="p-3 text-right">Used (Terpasang)</th>
                  <th className="p-3 text-right">Balance (Sisa Stock)</th>
                  <th className="p-3">Satuan</th>
                  <th className="p-3">Status Suplai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredMaterials.map(m => (
                  <tr key={m.materialId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-semibold text-white">{m.materialName}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.contractorId === 'WIKA'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {m.contractorId}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-300">{m.required.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-cyan-400 font-medium">
                      {m.delivered.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400 font-bold">
                      {m.used.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-amber-300">
                      {m.balance.toLocaleString()}
                    </td>
                    <td className="p-3 text-slate-400 font-mono">{m.unit}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.status === 'OK'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : m.status === 'Critical'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EQUIPMENT */}
      {activeTab === 'equipment' && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Mobilisasi & Kondisi Operasional Alat Berat
            </h3>
            <span className="text-xs text-slate-400">
              Heavy Equipment Fleet
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-400 uppercase font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3">Nama Alat Berat</th>
                  <th className="p-3">Kapasitas</th>
                  <th className="p-3 text-center">Jumlah (Unit)</th>
                  <th className="p-3">Kontraktor</th>
                  <th className="p-3">Lokasi / Pier Penugasan</th>
                  <th className="p-3">Status Operasional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredEquipment.map(e => (
                  <tr key={e.equipmentId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-semibold text-white">{e.equipmentName}</td>
                    <td className="p-3 text-slate-300 font-medium">{e.capacity}</td>
                    <td className="p-3 text-center font-mono font-bold text-blue-400">{e.qty} unit</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          e.contractorId === 'WIKA'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {e.contractorId}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-semibold text-emerald-400">{e.locationPier}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          e.status === 'Operational'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : e.status === 'Standby'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MANPOWER */}
      {activeTab === 'manpower' && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Monitoring Kebutuhan vs Realisasi Tenaga Kerja
            </h3>
            <span className="text-xs text-slate-400">
              Formula: Variance = Actual - Plan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-400 uppercase font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3">Kategori Tenaga Kerja</th>
                  <th className="p-3">Kontraktor</th>
                  <th className="p-3 text-right">Rencana / Plan (Org)</th>
                  <th className="p-3 text-right">Realisasi / Actual (Org)</th>
                  <th className="p-3 text-right">Varians Manpower</th>
                  <th className="p-3 text-center">Status Pemenuhan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredManpower.map(mp => (
                  <tr key={mp.manpowerId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-semibold text-white">{mp.category}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          mp.contractorId === 'WIKA'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {mp.contractorId}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-300">{mp.planQty} org</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      {mp.actualQty} org
                    </td>
                    <td className="p-3 text-right font-mono font-bold">
                      <span className={mp.variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {mp.variance > 0 ? `+${mp.variance}` : mp.variance} org
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          mp.variance >= 0
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {mp.variance >= 0 ? 'Terpenuhi' : 'Kurang Manpower'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
