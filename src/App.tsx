import React, { useState } from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { GlobalFilterBar } from './components/common/GlobalFilterBar';
import { GlobalSearchResultModal } from './components/common/GlobalSearchResultModal';
import { ProjectDashboard } from './components/dashboard/ProjectDashboard';
import { DailyProgressView } from './components/progress/DailyProgressView';
import { WeeklyProgressView } from './components/progress/WeeklyProgressView';
import { MonthlyProgressView } from './components/progress/MonthlyProgressView';
import { SCurveView } from './components/scurve/SCurveView';
import { BOQContractView } from './components/boq/BOQContractView';
import { StripmapView } from './components/stripmap/StripmapView';
import { WBSView } from './components/wbs/WBSView';
import { PierMasterView } from './components/pier/PierMasterView';
import { ConstraintRegisterView } from './components/constraint/ConstraintRegisterView';
import { IssueRegisterView } from './components/issue/IssueRegisterView';
import { ActionTrackerView } from './components/action/ActionTrackerView';
import { ResourceMonitoringView } from './components/resources/ResourceMonitoringView';
import { PhotoDocumentationView } from './components/photo/PhotoDocumentationView';
import { RecoveryPlanView } from './components/recovery/RecoveryPlanView';
import { ProjectReportsView } from './components/reports/ProjectReportsView';
import { MasterDataView } from './components/master/MasterDataView';
import { ExcelImportExportView } from './components/import/ExcelImportExportView';
import { GoogleWorkspaceModal } from './components/workspace/GoogleWorkspaceModal';
import { X } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPierNumber, setSelectedPierNumber] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);

  const { setSearchQuery } = useProject();

  const handleSelectPier = (pierNo: string) => {
    setSelectedPierNumber(pierNo);
    setActiveTab('stripmap');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content Area (offset by sidebar on desktop) */}
      <div className="lg:pl-72 flex flex-col flex-1 min-w-0">
        {/* Sticky Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenImportModal={() => setShowImportModal(true)}
          onOpenWorkspaceModal={() => setShowWorkspaceModal(true)}
          onNavigateToSCurve={() => setActiveTab('scurve')}
        />

        {/* Global Filter Bar */}
        <GlobalFilterBar />

        {/* Content View Router */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <ProjectDashboard
              onNavigateTab={setActiveTab}
              onSelectPier={handleSelectPier}
            />
          )}

          {activeTab === 'stripmap' && (
            <StripmapView
              selectedPierNumber={selectedPierNumber}
              onClearSelectedPier={() => setSelectedPierNumber(null)}
            />
          )}

          {activeTab === 'daily_progress' && <DailyProgressView />}
          {activeTab === 'weekly_progress' && <WeeklyProgressView />}
          {activeTab === 'monthly_progress' && <MonthlyProgressView />}
          {activeTab === 'scurve' && <SCurveView onNavigateToBOQ={() => setActiveTab('boq')} />}
          {activeTab === 'boq' && <BOQContractView />}
          {activeTab === 'wbs' && <WBSView />}
          {activeTab === 'pier_master' && <PierMasterView />}
          {activeTab === 'constraint' && <ConstraintRegisterView />}
          {activeTab === 'issue' && <IssueRegisterView />}
          {activeTab === 'action_tracker' && <ActionTrackerView />}
          
          {(activeTab === 'material' || activeTab === 'equipment' || activeTab === 'manpower') && (
            <ResourceMonitoringView />
          )}

          {activeTab === 'photo_progress' && <PhotoDocumentationView />}
          {activeTab === 'recovery' && <RecoveryPlanView />}
          {activeTab === 'reports' && <ProjectReportsView />}
          {activeTab === 'master_data' && <MasterDataView initialTab="project" />}
          {activeTab === 'settings' && <MasterDataView initialTab="database" />}
        </main>
      </div>

      {/* Global Search Result Modal */}
      <GlobalSearchResultModal
        onClose={() => setSearchQuery('')}
        onNavigateToPier={handleSelectPier}
      />

      {/* Google Workspace Integration Modal */}
      <GoogleWorkspaceModal
        isOpen={showWorkspaceModal}
        onClose={() => setShowWorkspaceModal(false)}
      />

      {/* Excel Import/Export Modal Dialog */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
            <button
              onClick={() => setShowImportModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <ExcelImportExportView />
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ProjectProvider>
      <MainAppContent />
    </ProjectProvider>
  );
}
