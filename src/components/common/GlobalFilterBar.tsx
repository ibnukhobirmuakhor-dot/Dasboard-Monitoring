import React from 'react';
import { Filter, X, RefreshCw } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { ContractorId } from '../../types';

export const GlobalFilterBar: React.FC = () => {
  const { zones, piers, wbs, filters, setFilters, resetFilters } = useProject();

  const isFiltered =
    filters.contractorId !== 'ALL' ||
    filters.zoneId !== 'ALL' ||
    filters.pierId !== 'ALL' ||
    filters.status !== 'ALL';

  return (
    <div
      id="global-filter-bar"
      className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center gap-3 text-xs"
    >
      <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[10px] shrink-0">
        <Filter className="w-3.5 h-3.5 text-blue-400" />
        <span>Filter Global:</span>
      </div>

      {/* Contractor Filter */}
      <div className="flex items-center gap-1.5">
        <label className="text-slate-400 font-medium">Kontraktor:</label>
        <select
          id="filter-contractor"
          value={filters.contractorId}
          onChange={e => setFilters(prev => ({ ...prev, contractorId: e.target.value as ContractorId | 'ALL' }))}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
        >
          <option value="ALL">Semua (WIKA & GI)</option>
          <option value="WIKA">WIKA (PT Wijaya Karya)</option>
          <option value="GI">GI (PT Girder Indonesia)</option>
        </select>
      </div>

      {/* Zone Filter */}
      <div className="flex items-center gap-1.5">
        <label className="text-slate-400 font-medium">Zona:</label>
        <select
          id="filter-zone"
          value={filters.zoneId}
          onChange={e => setFilters(prev => ({ ...prev, zoneId: e.target.value }))}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
        >
          <option value="ALL">Semua Zona</option>
          {zones.map(z => (
            <option key={z.zoneId} value={z.zoneId}>
              {z.zoneName} ({z.direction})
            </option>
          ))}
        </select>
      </div>

      {/* Pier Filter */}
      <div className="flex items-center gap-1.5">
        <label className="text-slate-400 font-medium">Pier:</label>
        <select
          id="filter-pier"
          value={filters.pierId}
          onChange={e => setFilters(prev => ({ ...prev, pierId: e.target.value }))}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
        >
          <option value="ALL">Semua Pier</option>
          {piers.map(p => (
            <option key={p.pierId} value={p.pierId}>
              {p.pierNumber} ({p.contractorId})
            </option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-1.5">
        <label className="text-slate-400 font-medium">Status Pier:</label>
        <select
          id="filter-status"
          value={filters.status}
          onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
        >
          <option value="ALL">Semua Status</option>
          <option value="Closed">Closed (Selesai)</option>
          <option value="On Progress">On Progress (Sedang Dikerjakan)</option>
          <option value="Open">Open / Critical (Tertunda/Kritis)</option>
          <option value="N/A">N/A (Belum Mulai)</option>
        </select>
      </div>

      {/* Reset Filter Button */}
      {isFiltered && (
        <button
          id="btn-reset-global-filter"
          onClick={resetFilters}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 font-medium ml-auto transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          <span>Hapus Filter</span>
        </button>
      )}
    </div>
  );
};
