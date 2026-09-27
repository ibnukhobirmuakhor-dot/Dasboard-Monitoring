import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  CalendarCheck2,
  TrendingUp,
  MapPin,
  GitFork,
  Columns3,
  AlertTriangle,
  Flame,
  CheckSquare,
  Boxes,
  Truck,
  Users2,
  Camera,
  Activity,
  FileSpreadsheet,
  Database,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Eye,
  Coins
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export type NavTab =
  | 'dashboard'
  | 'boq'
  | 'daily_progress'
  | 'weekly_progress'
  | 'monthly_progress'
  | 'scurve'
  | 'stripmap'
  | 'wbs'
  | 'pier_master'
  | 'constraint'
  | 'issue'
  | 'action_tracker'
  | 'material'
  | 'equipment'
  | 'manpower'
  | 'photo_progress'
  | 'recovery'
  | 'reports'
  | 'master_data'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen
}) => {
  const { currentRole, setCurrentRole, contractorUser, setContractorUser, projectKPIs } = useProject();

  const navGroups = [
    {
      group: 'Overview & Analytics',
      items: [
        { id: 'dashboard' as NavTab, label: 'Dashboard KPI', icon: LayoutDashboard, badge: null },
        {
          id: 'boq' as NavTab,
          label: 'BOQ & Addendum Kontrak',
          icon: Coins,
          badge: 'Add 1-4',
          badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
        },
        { id: 'scurve' as NavTab, label: 'S-Curve Analysis', icon: TrendingUp, badge: null },
        { id: 'stripmap' as NavTab, label: 'Stripmap Pier', icon: Columns3, badge: 'Hot' },
        { id: 'recovery' as NavTab, label: 'Recovery Plan', icon: Activity, badge: null }
      ]
    },
    {
      group: 'Progress Monitoring',
      items: [
        { id: 'daily_progress' as NavTab, label: 'Daily Progress', icon: CalendarDays, badge: null },
        { id: 'weekly_progress' as NavTab, label: 'Weekly Cutoff (Fri)', icon: CalendarRange, badge: null },
        { id: 'monthly_progress' as NavTab, label: 'Monthly Cutoff (25th)', icon: CalendarCheck2, badge: null },
        { id: 'photo_progress' as NavTab, label: 'Photo Gallery', icon: Camera, badge: null }
      ]
    },
    {
      group: 'Work Breakdown & Pier',
      items: [
        { id: 'wbs' as NavTab, label: 'WBS Hierarchy (L1-L6)', icon: GitFork, badge: null },
        { id: 'pier_master' as NavTab, label: 'Tabel Master Pier', icon: MapPin, badge: 'Full' }
      ]
    },
    {
      group: 'Control & Risk Management',
      items: [
        { 
          id: 'constraint' as NavTab, 
          label: 'Constraint Register', 
          icon: AlertTriangle, 
          badge: projectKPIs.openConstraintsCount > 0 ? `${projectKPIs.openConstraintsCount}` : null,
          badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
        },
        { 
          id: 'issue' as NavTab, 
          label: 'Issue Register', 
          icon: Flame, 
          badge: projectKPIs.criticalIssuesCount > 0 ? `${projectKPIs.criticalIssuesCount}` : null,
          badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
        },
        { id: 'action_tracker' as NavTab, label: 'Action Tracker', icon: CheckSquare, badge: null }
      ]
    },
    {
      group: 'Resource Management',
      items: [
        { id: 'material' as NavTab, label: 'Material Monitoring', icon: Boxes, badge: null },
        { id: 'equipment' as NavTab, label: 'Equipment Monitoring', icon: Truck, badge: null },
        { id: 'manpower' as NavTab, label: 'Manpower Monitoring', icon: Users2, badge: null }
      ]
    },
    {
      group: 'Project Admin & Reports',
      items: [
        { id: 'reports' as NavTab, label: 'Report Generator', icon: FileSpreadsheet, badge: 'PDF' },
        { id: 'master_data' as NavTab, label: 'Master Data Proyek', icon: Database, badge: null },
        {
          id: 'settings' as NavTab,
          label: 'Database (1 File Sheet)',
          icon: FileSpreadsheet,
          badge: '1 File',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          id="sidebar-overlay"
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        id="main-sidebar"
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div id="sidebar-header" className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20 tracking-wider">
              HBR
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-white">HBR II SYSTEM</div>
              <div className="text-xs text-blue-400 font-medium">Project Control • PME</div>
            </div>
          </div>
        </div>

        {/* User Role Badge & Switcher (PME & Viewer) */}
        <div id="role-switcher-card" className="p-3 mx-3 my-2.5 rounded-xl bg-slate-900 border border-slate-700/80 shadow-xs text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Role Pengguna:
            </span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full text-[10px] font-mono ${
                currentRole === 'PME' || currentRole === 'Admin'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              }`}
            >
              {currentRole === 'Viewer' ? 'Viewer (Read-Only)' : 'PME (Editor)'}
            </span>
          </div>

          {/* Primary PME & Viewer Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              id="btn-role-pme"
              onClick={() => setCurrentRole('PME')}
              title="Aktifkan Role PME (Project Monitoring & Evaluation - Akses Penuh)"
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                currentRole === 'PME' || currentRole === 'Admin'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PME</span>
            </button>

            <button
              id="btn-role-viewer"
              onClick={() => setCurrentRole('Viewer')}
              title="Aktifkan Role Viewer (Stakeholder / Direksi - Akses Baca Saja)"
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                currentRole === 'Viewer'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Viewer</span>
            </button>
          </div>

          <div className="text-[10px] leading-tight text-slate-400">
            {currentRole === 'Viewer' ? (
              <span className="text-purple-300 flex items-center gap-1">
                <Eye className="w-3 h-3 text-purple-400 shrink-0" />
                <span>Mode Read-Only: Tampilan aman untuk monitoring stakeholder.</span>
              </span>
            ) : (
              <span className="text-blue-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-400 shrink-0" />
                <span>Akses Penuh: Input data harian, kelola WBS &amp; Master Pier.</span>
              </span>
            )}
          </div>
        </div>

        {/* Navigation Items List */}
        <div id="sidebar-nav-scroll" className="flex-1 overflow-y-auto px-3 py-2 space-y-4 text-xs select-none custom-scrollbar">
          {navGroups.map(group => (
            <div key={group.group} className="space-y-1">
              <div className="px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                {group.group}
              </div>
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                          item.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300')
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div id="sidebar-footer" className="p-3 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/40 flex items-center justify-between">
          <div className="truncate">
            <span className="font-semibold text-slate-300">CMNP • WIKA • GI</span>
            <div className="text-[10px] text-slate-400">PME Project Control v2.4</div>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Database Synced" />
        </div>
      </aside>
    </>
  );
};
