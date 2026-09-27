import React, { useState, useEffect } from 'react';
import {
  FolderCheck,
  FileSpreadsheet,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
  RefreshCw,
  ExternalLink,
  LogOut,
  Folder,
  Database,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  Search,
  MousePointerClick,
  Calendar,
  Clock,
  Check,
  FileCheck,
  X,
  Code2,
  Copy,
  Terminal,
  Zap
} from 'lucide-react';
import {
  googleWorkspace,
  GoogleUserSession,
  GoogleDriveFolder,
  GoogleDriveFile,
  GOOGLE_CLIENT_ID,
  SINGLE_SPREADSHEET_TABS,
  DEFAULT_DATABASE_FOLDER
} from '../../services/googleWorkspace';
import { syncDatabaseToSingleGoogleSheet } from '../../services/singleGoogleSheetSync';
import { useProject } from '../../context/ProjectContext';

interface GoogleWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({ isOpen, onClose }) => {
  const {
    project,
    piers,
    wbs,
    activities,
    dailyProgress,
    weeklyProgress,
    monthlyProgress,
    constraints,
    issues,
    actions,
    materials,
    equipment,
    manpower,
    exportToExcel
  } = useProject();

  const [session, setSession] = useState<GoogleUserSession | null>(googleWorkspace.getSession());
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Tabs: 'overview' | 'drive' | 'sheets' | 'sync' | 'appscript'
  const [activeTab, setActiveTab] = useState<'overview' | 'drive' | 'sheets' | 'sync' | 'appscript'>('sheets');
  const [appScriptUrl, setAppScriptUrl] = useState<string>(() => {
    return localStorage.getItem('hbr2_appscript_web_app_url') || '';
  });
  const [copiedCode, setCopiedCode] = useState(false);
  const [testingScript, setTestingScript] = useState(false);
  const [scriptTestResult, setScriptTestResult] = useState<string | null>(null);
  const [selectedScriptType, setSelectedScriptType] = useState<'ui_sidebar' | 'webapp' | 'ui_webapp' | 'menu' | 'onedit'>('ui_sidebar');
  const [selectedUiFile, setSelectedUiFile] = useState<'code' | 'html'>('html');

  const handleTestAppScript = async () => {
    if (!appScriptUrl.trim()) {
      setStatusMessage({ type: 'error', text: 'Masukkan Web App URL terlebih dahulu' });
      return;
    }
    setTestingScript(true);
    setScriptTestResult(null);
    try {
      localStorage.setItem('hbr2_appscript_web_app_url', appScriptUrl.trim());
      const res = await fetch(`${appScriptUrl.trim()}?action=ping`);
      const data = await res.json();
      setScriptTestResult(`Berhasil terhubung! Spreadsheet: "${data.spreadsheetName || 'HBR2 Connected'}" (ID: ${data.spreadsheetId || 'Valid'})`);
      setStatusMessage({ type: 'success', text: 'Google Apps Script Web App berhasil terhubung!' });
    } catch (err: any) {
      setScriptTestResult(`Gagal menghubungi Web App: ${err.message || err}. Pastikan Deployment Web App di-set 'Execute as: Me' dan 'Who has access: Anyone'.`);
      setStatusMessage({ type: 'error', text: 'Koneksi ke Apps Script Web App gagal' });
    } finally {
      setTestingScript(false);
    }
  };

  // Drive state
  const [folders, setFolders] = useState<GoogleDriveFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<{ id: string; name: string; url?: string }>(
    () => googleWorkspace.getStoredFolder()
  );
  const [newFolderName, setNewFolderName] = useState('HBR II - Project Control & Site Photos');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [manualFolderInput, setManualFolderInput] = useState(DEFAULT_DATABASE_FOLDER.url);
  const [showManualFolderInput, setShowManualFolderInput] = useState(false);
  const [folderSearchQuery, setFolderSearchQuery] = useState('');
  const [loadingFolders, setLoadingFolders] = useState(false);

  // Sheets state & File Picker UI
  const [spreadsheets, setSpreadsheets] = useState<GoogleDriveFile[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<{ id: string; title: string; url?: string; lastSync?: string } | null>(
    googleWorkspace.getStoredSpreadsheet()
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState(`DATABASE_MASTER_HBR2_PROYEK`);
  
  // File Picker UI filters & states
  const [sheetSearchQuery, setSheetSearchQuery] = useState('');
  const [sheetFolderFilter, setSheetFolderFilter] = useState<'all' | string>('all');
  const [loadingSpreadsheets, setLoadingSpreadsheets] = useState(false);
  const [isOpeningGooglePicker, setIsOpeningGooglePicker] = useState(false);
  const [manualSheetInput, setManualSheetInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = googleWorkspace.getSession();
      setSession(current);
      if (current) {
        loadDriveFolders();
        loadSpreadsheets();
      }
    }
  }, [isOpen]);

  const handleLogin = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const userSession = await googleWorkspace.requestLogin();
      setSession(userSession);
      setStatusMessage({ type: 'success', text: `Berhasil terhubung ke akun Google Workspace: ${userSession.userEmail || 'Akun Aktif'}` });
      await loadDriveFolders();
      await loadSpreadsheets();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal login ke Google' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await googleWorkspace.logout();
    setSession(null);
    setSelectedFolder(null);
    setSelectedSheet(null);
    googleWorkspace.setStoredFolder(null);
    googleWorkspace.setStoredSpreadsheet(null);
    setStatusMessage({ type: 'info', text: 'Koneksi Google Workspace telah diputus.' });
  };

  const loadDriveFolders = async () => {
    setLoadingFolders(true);
    try {
      const list = await googleWorkspace.listDriveFolders();
      setFolders(list);
    } catch (err: any) {
      console.error('Error loading folders:', err);
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleLinkManualFolder = async (folderLinkOrId: string = manualFolderInput) => {
    if (!folderLinkOrId.trim()) return;
    setLoading(true);
    try {
      const folderId = googleWorkspace.extractFolderId(folderLinkOrId);
      // Fetch actual folder metadata if authenticated, or use fallback name
      let folderName = `Folder G-Drive (${folderId.substring(0, 10)}...)`;
      if (session) {
        try {
          const meta = await googleWorkspace.getFolderMetadata(folderId);
          if (meta.name) {
            folderName = meta.name;
          }
        } catch {
          // If metadata lookup fails due to permissions or shared link format, fallback to default friendly name
          folderName = 'Folder Berbagi HBR II (Link Google Drive)';
        }
      } else {
        folderName = 'Folder Berbagi HBR II (Link Google Drive)';
      }

      const folderObj = { id: folderId, name: folderName };
      setSelectedFolder(folderObj);
      googleWorkspace.setStoredFolder(folderObj);
      
      // Also add to folders list if not already present
      setFolders(prev => {
        if (!prev.some(f => f.id === folderId)) {
          return [{ id: folderId, name: folderName }, ...prev];
        }
        return prev;
      });

      setStatusMessage({
        type: 'success',
        text: `Folder Google Drive "${folderName}" (ID: ${folderId}) berhasil ditautkan dan diset sebagai target penyimpanan foto proyek!`
      });
      setShowManualFolderInput(false);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Gagal menautkan link folder Google Drive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSpreadsheets = async (query: string = sheetSearchQuery, folderId: string = sheetFolderFilter) => {
    setLoadingSpreadsheets(true);
    try {
      const list = await googleWorkspace.listSpreadsheets(query, folderId === 'all' ? undefined : folderId);
      setSpreadsheets(list);
    } catch (err: any) {
      console.error('Error loading spreadsheets:', err);
    } finally {
      setLoadingSpreadsheets(false);
    }
  };

  const handleOpenGooglePicker = async () => {
    setIsOpeningGooglePicker(true);
    try {
      const picked = await googleWorkspace.openSpreadsheetPicker();
      if (picked) {
        setSelectedSheet({ id: picked.id, title: picked.name });
        googleWorkspace.setStoredSpreadsheet({ id: picked.id, title: picked.name });
        setStatusMessage({
          type: 'success',
          text: `Google Spreadsheet berhasil dipilih via Google Picker: "${picked.name}"`
        });
        // Refresh list to make sure it includes this spreadsheet
        await loadSpreadsheets();
      }
    } catch (err: any) {
      console.warn('Google Picker fallback:', err);
      setStatusMessage({
        type: 'info',
        text: `Google Picker Dialog ditutup atau dialihkan ke file browser internal (${err.message || 'Gunakan browser file di bawah'}).`
      });
    } finally {
      setIsOpeningGooglePicker(false);
    }
  };

  const handleSelectManualSheet = () => {
    if (!manualSheetInput.trim()) return;
    const input = manualSheetInput.trim();
    let sheetId = input;
    // Check if input is a full URL: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit...
    const urlMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      sheetId = urlMatch[1];
    }

    const title = `Spreadsheet (${sheetId.substring(0, 10)}...)`;
    setSelectedSheet({ id: sheetId, title });
    googleWorkspace.setStoredSpreadsheet({ id: sheetId, title });
    setStatusMessage({
      type: 'success',
      text: `Spreadsheet ID berhasil ditautkan secara manual: ${sheetId}`
    });
    setManualSheetInput('');
    setShowManualInput(false);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setLoading(true);
    try {
      const folder = await googleWorkspace.createDriveFolder(newFolderName.trim());
      setSelectedFolder({ id: folder.id, name: folder.name });
      googleWorkspace.setStoredFolder({ id: folder.id, name: folder.name });
      setStatusMessage({ type: 'success', text: `Folder Google Drive "${folder.name}" berhasil dibuat!` });
      setIsCreatingFolder(false);
      await loadDriveFolders();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal membuat folder Google Drive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFolder = (f: GoogleDriveFolder) => {
    setSelectedFolder({ id: f.id, name: f.name });
    googleWorkspace.setStoredFolder({ id: f.id, name: f.name });
    setStatusMessage({ type: 'success', text: `Folder target diset ke: "${f.name}"` });
  };

  const handleCreateNewSpreadsheet = async () => {
    if (!newSheetTitle.trim()) return;
    setLoading(true);
    try {
      const targetFolderId = selectedFolder?.id || DEFAULT_DATABASE_FOLDER.id;
      // Create 1 single Google Spreadsheet with all 10 project tabs stored directly in target folder
      const created = await googleWorkspace.createSingleDatabaseSpreadsheet(newSheetTitle.trim(), targetFolderId);
      const newSheetObj = {
        id: created.spreadsheetId,
        title: newSheetTitle.trim(),
        url: created.spreadsheetUrl,
        lastSync: new Date().toISOString()
      };
      setSelectedSheet(newSheetObj);
      googleWorkspace.setStoredSpreadsheet(newSheetObj);
      
      // Sync all 10 database tables immediately into this 1 file
      await syncAllDataToSpreadsheet(created.spreadsheetId);
      
      setStatusMessage({
        type: 'success',
        text: `1 File Database Google Sheet "${newSheetTitle}" berhasil dibuat langsung di dalam folder database HBR II (${targetFolderId}) dengan 10 tab lengkap dan seluruh data terisi!`
      });
      await loadSpreadsheets();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal membuat Google Spreadsheet' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSheet = (sheet: GoogleDriveFile) => {
    const sheetObj = {
      id: sheet.id,
      title: sheet.name,
      url: sheet.webViewLink || `https://docs.google.com/spreadsheets/d/${sheet.id}`,
      lastSync: undefined
    };
    setSelectedSheet(sheetObj);
    googleWorkspace.setStoredSpreadsheet(sheetObj);
    setStatusMessage({ type: 'success', text: `Database diset ke 1 File Google Sheet: "${sheet.name}"` });
  };

  const syncAllDataToSpreadsheet = async (sheetId: string) => {
    setIsSyncing(true);
    try {
      const contextData = {
        project,
        piers,
        wbs,
        activities,
        dailyProgress,
        weeklyProgress,
        monthlyProgress,
        constraints,
        issues,
        actions,
        materials,
        equipment,
        manpower
      };

      const result = await syncDatabaseToSingleGoogleSheet(sheetId, contextData);
      
      setSelectedSheet(prev => prev ? { ...prev, lastSync: result.timestamp } : {
        id: sheetId,
        title: selectedSheet?.title || 'DATABASE_MASTER_HBR2_PROYEK',
        url: result.spreadsheetUrl,
        lastSync: result.timestamp
      });

      setStatusMessage({
        type: 'success',
        text: 'Sinkronisasi berhasil! 10 Tab Database Proyek telah diperbarui di 1 file Google Sheet ini.'
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Gagal menyinkronkan data ke Google Sheets'
      });
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="google-workspace-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="google-workspace-modal-card"
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Google Workspace Cloud Integration
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Drive & Sheets Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Simpan dokumentasi foto site ke Google Drive & sinkronisasi data progres ke Google Sheets secara real-time
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-slate-800 bg-slate-950/40 flex gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Ringkasan & Akun', icon: Sparkles },
            { id: 'drive', label: 'Google Drive (Folder Foto & Dokumen)', icon: Folder },
            { id: 'sheets', label: 'Google Sheets (Live Sync Database)', icon: FileSpreadsheet },
            { id: 'sync', label: 'Export & Eksekusi Sinkronisasi', icon: RefreshCw },
            { id: 'appscript', label: 'Google Apps Script (Web App & Macro)', icon: Code2 }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Alert / Status Bar */}
        {statusMessage && (
          <div
            className={`px-5 py-2.5 text-xs flex items-center justify-between border-b ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/50 border-rose-800/60 text-rose-300'
                : 'bg-blue-950/50 border-blue-800/60 text-blue-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
              {statusMessage.type === 'info' && <Sparkles className="w-4 h-4 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs hover:underline ml-3 opacity-75 hover:opacity-100"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* TAB: OVERVIEW & AUTH */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Status Koneksi Google
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        session ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                      }`}
                    />
                    <span className="text-sm font-bold text-white">
                      {session
                        ? `Terhubung: ${session.userEmail || 'Google User'}`
                        : 'Belum Terhubung ke Google Workspace'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Scope OAuth resmi: Google Drive API (Drive V3) dan Google Sheets API (Sheets V4).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {session ? (
                    <button
                      onClick={handleLogout}
                      className="px-3.5 py-2 rounded-lg bg-rose-900/40 hover:bg-rose-800/60 text-rose-300 border border-rose-700/50 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Putuskan Akun
                    </button>
                  ) : (
                    <button
                      onClick={handleLogin}
                      disabled={loading}
                      className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                    >
                      <UploadCloud className="w-4 h-4" />
                      {loading ? 'Menghubungkan...' : 'Hubungkan Akun Google'}
                    </button>
                  )}
                </div>
              </div>

              {/* Status Target Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase">
                      <Folder className="w-4 h-4" />
                      Folder Target Google Drive
                    </div>
                    {selectedFolder && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                        Aktif
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-white truncate">
                    {selectedFolder ? selectedFolder.name : 'Belum dipilih (Default: Root Drive)'}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Semua foto inspeksi lapangan, bukti opname, dan laporan PDF akan diunggah ke folder ini.
                  </p>
                  <button
                    onClick={() => setActiveTab('drive')}
                    className="mt-3 text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                  >
                    Atur Folder Drive <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase">
                      <FileSpreadsheet className="w-4 h-4" />
                      Google Spreadsheet Sinkronisasi
                    </div>
                    {selectedSheet && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                        Aktif
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-white truncate">
                    {selectedSheet ? selectedSheet.title : 'Belum dipilih'}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Menyimpan tabel Master Piers, Daily Progress, Cutoff Mingguan, Kendala & Isu proyek.
                  </p>
                  <button
                    onClick={() => setActiveTab('sheets')}
                    className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                  >
                    Kelola Google Spreadsheet <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Data Summary */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div className="font-semibold text-slate-300 mb-2">Statistik Data Siap Sinkron:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Total Pier:</span>{' '}
                    <span className="font-bold text-white">{piers.length} Titik</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Daily Records:</span>{' '}
                    <span className="font-bold text-white">{dailyProgress.length} Baris</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Cutoff Records:</span>{' '}
                    <span className="font-bold text-white">{weeklyProgress.length} Minggu</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Kendala & Isu:</span>{' '}
                    <span className="font-bold text-white">{constraints.length + issues.length} Catatan</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: GOOGLE DRIVE */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              {!session ? (
                <div className="text-center py-8 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                  <Lock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <div className="text-sm font-bold text-white">Otentikasi Diperlukan</div>
                  <p className="text-xs text-slate-400 mb-4 max-w-md mx-auto">
                    Silakan hubungkan akun Google Workspace Anda terlebih dahulu untuk mengelola folder foto di Google Drive.
                  </p>
                  <button
                    onClick={handleLogin}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Hubungkan Google Sekarang
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">Folder Penyimpanan Google Drive</h3>
                      <p className="text-xs text-slate-400">
                        Tautkan link folder Google Drive yang Anda miliki atau buat folder baru khusus proyek HBR II
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        id="btn-toggle-manual-folder"
                        onClick={() => setShowManualFolderInput(!showManualFolderInput)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                        title="Tautkan folder lewat URL Google Drive"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Tautkan Link Folder
                      </button>
                      <button
                        onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        Buat Folder Baru
                      </button>
                      <button
                        onClick={loadDriveFolders}
                        disabled={loadingFolders}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700"
                        title="Segarkan daftar folder"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingFolders ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Manual Folder Link Input Bar */}
                  {showManualFolderInput && (
                    <div className="p-3.5 rounded-xl bg-slate-800/90 border border-blue-500/60 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                          <Folder className="w-3.5 h-3.5" />
                          Tautkan Folder Google Drive via URL / Folder ID:
                        </label>
                        <button
                          onClick={() => setShowManualFolderInput(false)}
                          className="text-slate-400 hover:text-white text-xs"
                        >
                          Tutup
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={manualFolderInput}
                          onChange={e => setManualFolderInput(e.target.value)}
                          placeholder="https://drive.google.com/drive/folders/..."
                          className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                        />
                        <button
                          id="btn-confirm-link-folder"
                          onClick={() => handleLinkManualFolder(manualFolderInput)}
                          disabled={loading}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shrink-0 disabled:opacity-50"
                        >
                          {loading ? 'Menghubungkan...' : 'Tautkan Sekarang'}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Tips: Cukup salin dan tempel link berbagi Google Drive (contoh: folder <code>1US-vwhcJXlfEgFCKlgZFZWKTgqJQy5eO</code>). Sistem akan otomatis mendeteksi ID folder.
                      </p>
                    </div>
                  )}

                  {/* Quick Card for Provided Folder */}
                  <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                        <Folder className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">Folder Berbagi Proyek HBR II</div>
                        <div className="text-[10px] text-blue-300 font-mono truncate">ID: 1US-vwhcJXlfEgFCKlgZFZWKTgqJQy5eO</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {selectedFolder?.id === '1US-vwhcJXlfEgFCKlgZFZWKTgqJQy5eO' ? (
                        <span className="px-2.5 py-1 rounded bg-blue-500/30 text-blue-300 text-xs font-bold flex items-center gap-1 border border-blue-500/40">
                          <Check className="w-3 h-3" /> Folder Aktif
                        </span>
                      ) : (
                        <button
                          id="btn-quick-connect-user-folder"
                          onClick={() => handleLinkManualFolder('1US-vwhcJXlfEgFCKlgZFZWKTgqJQy5eO')}
                          disabled={loading}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
                        >
                          Tautkan Folder Ini
                        </button>
                      )}
                      <a
                        href="https://drive.google.com/drive/folders/1US-vwhcJXlfEgFCKlgZFZWKTgqJQy5eO?usp=sharing"
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                        title="Buka Folder di Tab Baru"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {isCreatingFolder && (
                    <div className="p-3.5 rounded-xl bg-slate-800 border border-blue-500/50 flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        placeholder="Nama folder (mis. HBR II - Foto Lapangan)"
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleCreateFolder}
                          disabled={loading}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                        >
                          {loading ? 'Membuat...' : 'Simpan Folder'}
                        </button>
                        <button
                          onClick={() => setIsCreatingFolder(false)}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}

                    {/* Folder List */}
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      {loadingFolders ? (
                        <div className="text-xs text-slate-400 p-4 text-center border border-slate-800 rounded-xl flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                          <span>Memindai folder di Google Drive...</span>
                        </div>
                      ) : folders.length === 0 ? (
                        <div className="text-xs text-slate-400 p-4 text-center border border-dashed border-slate-700 rounded-xl">
                          Tidak ada folder ditemukan di Google Drive root. Anda dapat menautkan link folder di atas atau membuat folder baru.
                        </div>
                      ) : (
                        folders.map(f => {
                          const isSelected = selectedFolder?.id === f.id;
                          return (
                            <div
                              key={f.id}
                              onClick={() => handleSelectFolder(f)}
                              className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-900/30 border-blue-500/60 text-white'
                                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                                <span className="text-xs font-medium truncate">{f.name}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {isSelected ? (
                                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold flex items-center gap-1">
                                    <Check className="w-2.5 h-2.5" />
                                    Folder Terpilih
                                  </span>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectFolder(f);
                                    }}
                                    className="px-2.5 py-1 rounded bg-slate-700 hover:bg-blue-600 text-white text-[11px] font-medium"
                                  >
                                    Pilih Folder
                                  </button>
                                )}
                                <a
                                  href={`https://drive.google.com/drive/folders/${f.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 rounded text-slate-400 hover:text-white"
                                  title="Buka di Google Drive"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Selected Folder Status Footer */}
                    {selectedFolder && (
                      <div className="p-3 rounded-xl bg-slate-800/70 border border-blue-600/40 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="text-slate-300">
                            Folder Target Aktif: <strong className="text-white">{selectedFolder.name}</strong>
                          </span>
                        </div>
                        <a
                          href={`https://drive.google.com/drive/folders/${selectedFolder.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shrink-0 flex items-center gap-1"
                        >
                          Buka di Drive <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                </>
              )}
            </div>
          )}

          {/* TAB: GOOGLE SHEETS */}
          {activeTab === 'sheets' && (
            <div className="space-y-4">
              {!session ? (
                <div className="text-center py-8 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                  <Lock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <div className="text-sm font-bold text-white">Otentikasi Diperlukan</div>
                  <p className="text-xs text-slate-400 mb-4 max-w-md mx-auto">
                    Hubungkan akun Google Workspace Anda untuk membaca atau membuat spreadsheet proyek.
                  </p>
                  <button
                    onClick={handleLogin}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Hubungkan Google Sekarang
                  </button>
                </div>
              ) : (
                <>
                  {/* Database Folder Location Banner */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <Folder className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Lokasi Folder Database Google Drive:</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">Folder Terpilih</span>
                        </div>
                        <div className="text-xs font-bold text-white truncate font-mono">
                          {selectedFolder?.name || DEFAULT_DATABASE_FOLDER.name}
                          <span className="text-slate-400 font-normal ml-2 text-[11px] font-mono">
                            (ID: {selectedFolder?.id || DEFAULT_DATABASE_FOLDER.id})
                          </span>
                        </div>
                      </div>
                    </div>
                    <a
                      href={selectedFolder?.url || `https://drive.google.com/drive/folders/${selectedFolder?.id || DEFAULT_DATABASE_FOLDER.id}?usp=drive_link`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                      <span>Buka Folder Drive</span>
                    </a>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase">
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Database Master Tunggal: 1 File Google Sheet</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        10 Tab Terpadu
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Sistem mengonsolidasi seluruh modul proyek ke dalam <b>1 File Google Spreadsheet Utama</b> (Single Source of Truth) yang memuat 10 tab:
                      <span className="font-mono text-emerald-300 text-[11px] block mt-1">
                        01_Master_Piers • 02_WBS_Hierarchy • 03_Daily_Progress • 04_Weekly_Cutoff • 05_Monthly_MC • 06_BOQ_Contract • 07_Constraints_Log • 08_Issues_Action • 09_Resources • 10_Project_Profile
                      </span>
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <input
                        type="text"
                        value={newSheetTitle}
                        onChange={e => setNewSheetTitle(e.target.value)}
                        placeholder="DATABASE_MASTER_HBR2_PROYEK"
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                      />
                      <button
                        onClick={handleCreateNewSpreadsheet}
                        disabled={loading}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        {loading ? 'Membuat 1 File Spreadsheet...' : 'Buat 1 File Database'}
                      </button>
                    </div>
                  </div>

                  {/* SPREADSHEET FILE PICKER UI */}
                  <div className="pt-1 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <div>
                        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <FileCheck className="w-4 h-4 text-emerald-400" />
                          File Picker: Pilih Google Spreadsheet dari Google Drive
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Jelajahi dan pilih file spreadsheet proyek yang tersimpan di akun Google Drive Anda.
                        </p>
                      </div>

                      {/* Action buttons: Google Picker modal launcher & Manual ID button */}
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          id="btn-launch-google-picker"
                          onClick={handleOpenGooglePicker}
                          disabled={isOpeningGooglePicker}
                          className="flex-1 sm:flex-initial px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                          title="Buka dialog resmi Google Drive Picker"
                        >
                          <MousePointerClick className="w-3.5 h-3.5" />
                          <span>{isOpeningGooglePicker ? 'Membuka...' : 'Buka Google Picker'}</span>
                        </button>
                        <button
                          id="btn-toggle-manual-sheet"
                          onClick={() => setShowManualInput(!showManualInput)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700"
                          title="Tautkan dengan ID/URL spreadsheet langsung"
                        >
                          Tautkan URL/ID
                        </button>
                      </div>
                    </div>

                    {/* Manual ID / URL input drawer */}
                    {showManualInput && (
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                        <label className="text-[11px] text-slate-300 font-semibold block">
                          Masukkan Link URL Google Spreadsheet atau Spreadsheet ID:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={manualSheetInput}
                            onChange={e => setManualSheetInput(e.target.value)}
                            placeholder="Contoh: https://docs.google.com/spreadsheets/d/1BxiMVs.../edit atau spreadsheet ID"
                            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500"
                          />
                          <button
                            onClick={handleSelectManualSheet}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                          >
                            Tautkan
                          </button>
                          <button
                            onClick={() => setShowManualInput(false)}
                            className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Search & Filter Toolbar */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-7 relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={sheetSearchQuery}
                          onChange={e => setSheetSearchQuery(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              loadSpreadsheets(sheetSearchQuery, sheetFolderFilter);
                            }
                          }}
                          placeholder="Cari nama spreadsheet (mis. HBR II, Laporan)..."
                          className="w-full pl-8 pr-8 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                        />
                        {sheetSearchQuery && (
                          <button
                            onClick={() => {
                              setSheetSearchQuery('');
                              loadSpreadsheets('', sheetFolderFilter);
                            }}
                            className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="sm:col-span-3">
                        <select
                          value={sheetFolderFilter}
                          onChange={e => {
                            const val = e.target.value;
                            setSheetFolderFilter(val);
                            loadSpreadsheets(sheetSearchQuery, val);
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-blue-500"
                        >
                          <option value="all">Semua Lokasi Drive</option>
                          {folders.map(f => (
                            <option key={f.id} value={f.id}>
                              📁 {f.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2 flex gap-1">
                        <button
                          onClick={() => loadSpreadsheets(sheetSearchQuery, sheetFolderFilter)}
                          disabled={loadingSpreadsheets}
                          className="w-full px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center justify-center gap-1.5 border border-slate-700"
                        >
                          <RefreshCw className={`w-3 h-3 ${loadingSpreadsheets ? 'animate-spin' : ''}`} />
                          <span>{loadingSpreadsheets ? 'Mencari...' : 'Cari'}</span>
                        </button>
                      </div>
                    </div>

                    {/* File Picker Grid / List */}
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1 border border-slate-800 rounded-xl p-2 bg-slate-900/60">
                      {loadingSpreadsheets ? (
                        <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                          <span>Memindai Google Spreadsheets di Google Drive Anda...</span>
                        </div>
                      ) : spreadsheets.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                          <FileSpreadsheet className="w-8 h-8 text-slate-600 mx-auto" />
                          <p>
                            {sheetSearchQuery
                              ? `Tidak ada file spreadsheet yang cocok dengan kata kunci "${sheetSearchQuery}".`
                              : 'Tidak ada file Google Spreadsheet ditemukan di Google Drive.'}
                          </p>
                          <div className="flex items-center justify-center gap-2 pt-1">
                            <button
                              onClick={() => {
                                setSheetSearchQuery('');
                                setSheetFolderFilter('all');
                                loadSpreadsheets('', 'all');
                              }}
                              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                            >
                              Reset Pencarian
                            </button>
                            <button
                              onClick={handleOpenGooglePicker}
                              className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                            >
                              Gunakan Google Picker
                            </button>
                          </div>
                        </div>
                      ) : (
                        spreadsheets.map(sheet => {
                          const isSelected = selectedSheet?.id === sheet.id;
                          const formattedDate = sheet.modifiedTime
                            ? new Date(sheet.modifiedTime).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            : null;

                          return (
                            <div
                              key={sheet.id}
                              onClick={() => handleSelectSheet(sheet)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                                  : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                              }`}
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <div
                                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? 'bg-emerald-500 text-slate-950'
                                      : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                                  }`}
                                >
                                  <FileSpreadsheet className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={`text-xs font-bold truncate ${
                                        isSelected ? 'text-emerald-200' : 'text-slate-200'
                                      }`}
                                    >
                                      {sheet.name}
                                    </span>
                                    {isSelected && (
                                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                                        <Check className="w-2.5 h-2.5" />
                                        Aktif Terpilih
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                                    <span className="font-mono text-[10px] text-slate-400">ID: {sheet.id.substring(0, 16)}...</span>
                                    {formattedDate && (
                                      <span className="flex items-center gap-1 text-slate-400">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        Update: {formattedDate}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                {isSelected ? (
                                  <span className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> Terpilih
                                  </span>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectSheet(sheet);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-emerald-600 text-white text-xs font-medium transition-colors"
                                  >
                                    Pilih File Ini
                                  </button>
                                )}
                                {sheet.webViewLink && (
                                  <a
                                    href={sheet.webViewLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                                    title="Buka Spreadsheet di Google Sheets (Tab Baru)"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Summary of Selected Spreadsheet in Picker */}
                    {selectedSheet && (
                      <div className="p-3 rounded-xl bg-slate-800/70 border border-emerald-600/40 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-slate-300">
                            Spreadsheet Terhubung Saat Ini: <strong className="text-white">{selectedSheet.title}</strong>
                          </span>
                        </div>
                        <button
                          onClick={() => setActiveTab('sync')}
                          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shrink-0"
                        >
                          Buka Sinkronisasi →
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB: SYNC EXECUTION */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <RefreshCw className={`w-4 h-4 text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Sinkronisasi Data ke 1 File Google Sheet Terpadu</span>
                  </div>
                  {selectedSheet && (
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${selectedSheet.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      Buka File Spreadsheet <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[11px]">Database Tunggal Aktif:</span>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">
                      {selectedSheet ? selectedSheet.title : 'Belum dipilih (Pilih atau Buat di tab Google Sheets)'}
                    </div>
                  </div>
                  {selectedSheet?.lastSync && (
                    <div className="text-right font-mono text-[10px] text-slate-400">
                      Sync Terakhir: {new Date(selectedSheet.lastSync).toLocaleTimeString('id-ID')}
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2 text-slate-300">
                  <div className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <Database className="w-4 h-4 text-blue-400" />
                    <span>10 Worksheet / Tab Terpadu dalam 1 File Google Sheet Ini:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <b className="text-white">01_Master_Piers:</b> Register Pier, 9 Major Items per titik, WBS, Terprogress &amp; Tertagih
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <b className="text-white">02_WBS_Hierarchy:</b> Struktur Hirarki WBS L1-L6 &amp; Activities
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <b className="text-white">03_Daily_Progress:</b> Catatan harian aktivitas lapangan per kontraktor
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <b className="text-white">04_Weekly_Cutoff:</b> Evaluasi Kurva-S, deviasi, &amp; SPI mingguan Jumat
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <b className="text-white">05_Monthly_MC:</b> Sertifikasi Bulanan BAP Cutoff Tanggal 25
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <b className="text-white">06_BOQ_Contract:</b> Item Pekerjaan BOQ Addendum 4 &amp; Harga Satuan
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <b className="text-white">07_Constraints_Log:</b> Register kendala utilitas &amp; pembebasan lahan
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <b className="text-white">08_Issues_Action:</b> Isu risiko kritis &amp; tracking tindak lanjut mitigasi
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <b className="text-white">09_Resources:</b> Monitoring ketersediaan Material, Alat Berat, &amp; Manpower
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <b className="text-white">10_Project_Profile:</b> Profil kontrak, tanggal target, &amp; parameter HBR II
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-2.5">
                  <button
                    onClick={() => {
                      if (!selectedSheet) {
                        setStatusMessage({
                          type: 'error',
                          text: 'Pilih atau buat 1 file Google Spreadsheet terlebih dahulu di tab Google Sheets'
                        });
                        return;
                      }
                      syncAllDataToSpreadsheet(selectedSheet.id);
                    }}
                    disabled={isSyncing || !session || !selectedSheet}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    {isSyncing ? 'Sedang Menyinkronkan 10 Tab...' : 'Kirim Semua Data ke 1 File Google Sheet Ini'}
                  </button>

                  <button
                    onClick={() => {
                      exportToExcel(
                        `HBR_II_Export_Google_Format_${new Date().toISOString().split('T')[0]}`,
                        'Master_Piers',
                        piers
                      );
                    }}
                    className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    Download Backup .XLSX Lokal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: GOOGLE APPS SCRIPT (WEB APP & MACRO AUTOMATION) */}
          {activeTab === 'appscript' && (
            <div className="space-y-5">
              {/* Header Info Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/60 to-indigo-950/50 border border-blue-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      <Code2 className="w-4 h-4" />
                    </span>
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      Google Apps Script Automation &amp; Web App API
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Gratis &amp; Tanpa Server Tambahan
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Gunakan Apps Script untuk menghubungkan Google Sheets dengan Web App Harbour Road II secara otomatis via REST API Webhook, serta menambahkan menu pintas otomatisasi langsung di toolbar Google Sheets.
                  </p>
                </div>
              </div>

              {/* Script Preset Selector */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-blue-400" />
                    <span>Pilih Solusi Antarmuka &amp; Otomatisasi:</span>
                  </div>
                  <span className="text-[11px] text-blue-400 font-semibold">
                    Tersedia Antarmuka Sidebar &amp; Web Portal
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedScriptType('ui_sidebar')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedScriptType === 'ui_sidebar'
                        ? 'bg-blue-950/70 border-blue-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span className="text-emerald-300">1. Antarmuka Sidebar Spreadsheet</span>
                      {selectedScriptType === 'ui_sidebar' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Formulir modern di panel samping Google Sheets (showSidebar + Sidebar.html).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedScriptType('ui_webapp')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedScriptType === 'ui_webapp'
                        ? 'bg-blue-950/70 border-blue-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span className="text-blue-300">2. Antarmuka Web Portal Mobile</span>
                      {selectedScriptType === 'ui_webapp' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Halaman web responsif mandiri untuk input tim inspektur lapangan dari HP.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedScriptType('webapp')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedScriptType === 'webapp'
                        ? 'bg-blue-950/70 border-blue-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>3. Web App REST API (JSON)</span>
                      {selectedScriptType === 'webapp' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Endpoint doGet &amp; doPost untuk sinkronisasi otomatis dengan aplikasi web ini.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedScriptType('menu')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedScriptType === 'menu'
                        ? 'bg-blue-950/70 border-blue-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>4. Menu Toolbar Google Sheets</span>
                      {selectedScriptType === 'menu' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Menu kustom &quot;Harbour Road II&quot; di Spreadsheet untuk kalkulasi SPI &amp; scan pier.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedScriptType('onedit')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedScriptType === 'onedit'
                        ? 'bg-blue-950/70 border-blue-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>5. Trigger onEdit &amp; Notifikasi</span>
                      {selectedScriptType === 'onedit' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Auto-validasi sel, pencatatan timestamp inspeksi, dan email peringatan.
                    </p>
                  </button>
                </div>
              </div>

              {/* Code Box with File Switcher and Copy Button */}
              <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>

                    {/* File Switcher for UI Scripts */}
                    {(selectedScriptType === 'ui_sidebar' || selectedScriptType === 'ui_webapp') ? (
                      <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                        <button
                          type="button"
                          onClick={() => setSelectedUiFile('code')}
                          className={`px-2.5 py-1 rounded-md font-mono transition-colors cursor-pointer ${
                            selectedUiFile === 'code'
                              ? 'bg-blue-600 text-white font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Code.gs
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedUiFile('html')}
                          className={`px-2.5 py-1 rounded-md font-mono transition-colors cursor-pointer ${
                            selectedUiFile === 'html'
                              ? 'bg-emerald-600 text-white font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {selectedScriptType === 'ui_sidebar' ? 'Sidebar.html' : 'Index.html'}
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-slate-300 font-semibold">
                        Code.gs (Google Apps Script)
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      let codeToCopy = '';
                      if (selectedScriptType === 'ui_sidebar') {
                        if (selectedUiFile === 'code') {
                          codeToCopy = `/**
 * GOOGLE APPS SCRIPT: HARBOUR ROAD II - SIDEBAR ANTARMUKA
 * File: Code.gs
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏗️ Harbour Road II')
    .addItem('📱 Buka Antarmuka Sidebar HBR II', 'showHBR2Sidebar')
    .addItem('📊 Hitung Ulang Kurva S', 'recalculateSCurve')
    .addToUi();
}

function showHBR2Sidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Panel Kontrol Harbour Road II')
    .setWidth(340);
  SpreadsheetApp.getUi().showSidebar(html);
}

// Fungsi server dipanggil oleh antarmuka Sidebar
function saveProgressFromSidebar(formData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Update ke tab 01_Master_Piers
  var sheet = ss.getSheetByName('01_Master_Piers');
  if (sheet) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).toUpperCase() === String(formData.pierNumber).toUpperCase()) {
        sheet.getRange(i + 1, 6).setValue(Number(formData.progress)); // Kolom Progres %
        sheet.getRange(i + 1, 8).setValue(formData.status);           // Kolom Status
        break;
      }
    }
  }

  // 2. Catat riwayat ke tab 03_Daily_Progress
  var daily = ss.getSheetByName('03_Daily_Progress');
  if (daily) {
    daily.appendRow([
      new Date(),
      formData.contractor || 'WIKA',
      formData.pierNumber,
      formData.activity,
      Number(formData.progress),
      formData.notes
    ]);
  }

  return { status: 'success', message: 'Progres ' + formData.pierNumber + ' (' + formData.progress + '%) tersimpan di Spreadsheet!' };
}`;
                        } else {
                          codeToCopy = `<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <meta charset="utf-8">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    </style>
  </head>
  <body class="bg-slate-900 text-slate-100 p-4 text-xs">
    <!-- Header Antarmuka -->
    <div class="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-800">
      <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
        H2
      </div>
      <div>
        <h1 class="font-bold text-white text-sm leading-tight">Harbour Road II</h1>
        <p class="text-[10px] text-slate-400">Panel Kontrol Lapangan Elevated</p>
      </div>
    </div>

    <!-- Quick Status Cards -->
    <div class="grid grid-cols-2 gap-2 mb-4">
      <div class="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
        <span class="text-[10px] text-slate-400">Target PHO</span>
        <div class="text-xs font-bold text-blue-400 mt-0.5">31 Mar 2027</div>
      </div>
      <div class="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
        <span class="text-[10px] text-slate-400">Kontraktor</span>
        <div class="text-xs font-bold text-emerald-400 mt-0.5">WIKA - GI JO</div>
      </div>
    </div>

    <!-- Form Input Progres Cepat -->
    <form id="progressForm" onsubmit="handleSubmit(event)" class="space-y-3">
      <div>
        <label class="block text-[11px] font-semibold text-slate-300 mb-1">Nomor Pier</label>
        <select id="pierNumber" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-blue-500 focus:outline-none">
          <option value="P18S">P.18.S (STA 1+800)</option>
          <option value="P19S">P.19.S (STA 1+900)</option>
          <option value="P20S">P.20.S (Pipa PGN Kritis)</option>
          <option value="P21S">P.21.S (Portal Elevated)</option>
          <option value="P56A">P.56.A (Akses Ancol Timur)</option>
        </select>
      </div>

      <div>
        <label class="block text-[11px] font-semibold text-slate-300 mb-1">Pekerjaan Utama</label>
        <select id="activity" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-blue-500 focus:outline-none">
          <option value="Bored Pile">Bored Pile Foundation</option>
          <option value="Pile Cap">Pile Cap Concrete</option>
          <option value="Pier Column">Pier Column Concreting</option>
          <option value="Pier Head">Pier Head Casting</option>
          <option value="Box Girder">Erection Box Girder</option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">Progres Kumulatif (%)</label>
          <input type="number" id="progressPct" min="0" max="100" step="0.1" required placeholder="Contoh: 85.5" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono focus:border-blue-500 focus:outline-none">
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">Status Lapangan</label>
          <select id="pierStatus" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-blue-500 focus:outline-none">
            <option value="Sesuai Jadwal">Sesuai Jadwal</option>
            <option value="Perlu Atensi">Perlu Atensi</option>
            <option value="Kendala Kritis">Kendala Kritis</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-[11px] font-semibold text-slate-300 mb-1">Catatan / Kendala Lapangan</label>
        <textarea id="notes" rows="2" placeholder="Catatan inspeksi atau utilitas..." class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-blue-500 focus:outline-none"></textarea>
      </div>

      <button type="submit" id="submitBtn" class="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5">
        <span>Simpan ke Spreadsheet</span>
      </button>
    </form>

    <!-- Alert Response Status -->
    <div id="statusAlert" class="hidden mt-3 p-2.5 rounded-lg text-xs font-semibold"></div>

    <script>
      function handleSubmit(e) {
        e.preventDefault();
        var btn = document.getElementById('submitBtn');
        var alertBox = document.getElementById('statusAlert');
        btn.disabled = true;
        btn.innerText = 'Menyimpan data...';

        var formData = {
          pierNumber: document.getElementById('pierNumber').value,
          activity: document.getElementById('activity').value,
          progress: document.getElementById('progressPct').value,
          status: document.getElementById('pierStatus').value,
          notes: document.getElementById('notes').value
        };

        // Panggil fungsi Apps Script server via google.script.run
        google.script.run
          .withSuccessHandler(function(response) {
            btn.disabled = false;
            btn.innerText = 'Simpan ke Spreadsheet';
            alertBox.className = 'mt-3 p-2.5 rounded-lg text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700';
            alertBox.innerText = response.message || 'Data berhasil disimpan!';
            alertBox.classList.remove('hidden');
          })
          .withFailureHandler(function(error) {
            btn.disabled = false;
            btn.innerText = 'Simpan ke Spreadsheet';
            alertBox.className = 'mt-3 p-2.5 rounded-lg text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-700';
            alertBox.innerText = 'Error: ' + error.message;
            alertBox.classList.remove('hidden');
          })
          .saveProgressFromSidebar(formData);
      }
    </script>
  </body>
</html>`;
                        }
                      } else if (selectedScriptType === 'ui_webapp') {
                        if (selectedUiFile === 'code') {
                          codeToCopy = `/**
 * GOOGLE APPS SCRIPT: HARBOUR ROAD II - WEB APP PORTAL MANDIRI
 * File: Code.gs
 */

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Portal Input Lapangan - Tol Harbour Road II')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function submitInspection(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('03_Daily_Progress');
  if (sheet) {
    sheet.appendRow([
      new Date(),
      data.contractor,
      data.zone,
      data.pier,
      data.activity,
      Number(data.progress),
      data.remarks
    ]);
  }
  return { status: 'success', message: 'Laporan lapangan pier ' + data.pier + ' berhasil dicatat!' };
}`;
                        } else {
                          codeToCopy = `<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Portal Lapangan HBR II</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-slate-950 text-slate-100 min-h-screen p-4 flex flex-col items-center justify-center font-sans">
    <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      <div class="flex items-center gap-3 pb-3 border-b border-slate-800">
        <div class="p-2.5 rounded-xl bg-blue-600 text-white font-bold">H2</div>
        <div>
          <h2 class="text-base font-bold text-white leading-tight">Portal Input Lapangan</h2>
          <p class="text-xs text-slate-400">Jalan Tol Harbour Road II (Elevated)</p>
        </div>
      </div>

      <form onsubmit="handlePost(event)" class="space-y-3 text-xs">
        <div>
          <label class="block text-slate-300 font-bold mb-1">Kontraktor Pelaksana</label>
          <select id="contractor" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white">
            <option value="WIKA">WIKA (PT Wijaya Karya Tbk)</option>
            <option value="GI">GI (PT Girder Indonesia)</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-slate-300 font-bold mb-1">Zona</label>
            <input type="text" id="zone" placeholder="Contoh: Z-1S" required class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white">
          </div>
          <div>
            <label class="block text-slate-300 font-bold mb-1">Nomor Pier</label>
            <input type="text" id="pier" placeholder="Contoh: P18S" required class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white">
          </div>
        </div>

        <div>
          <label class="block text-slate-300 font-bold mb-1">Item Pekerjaan</label>
          <input type="text" id="activity" placeholder="Contoh: Pengecoran Pier Head" required class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white">
        </div>

        <div>
          <label class="block text-slate-300 font-bold mb-1">Progres Aktual (%)</label>
          <input type="number" id="progress" min="0" max="100" step="0.1" placeholder="85.0" required class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono">
        </div>

        <div>
          <label class="block text-slate-300 font-bold mb-1">Catatan / Cuaca / Kendala</label>
          <textarea id="remarks" rows="2" placeholder="Catatan cuaca atau kendala lapangan..." class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"></textarea>
        </div>

        <button type="submit" id="btnSubmit" class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md">
          Kirim Laporan ke Spreadsheet
        </button>
      </form>

      <div id="msgBox" class="hidden p-3 rounded-xl text-center text-xs font-bold"></div>
    </div>

    <script>
      function handlePost(e) {
        e.preventDefault();
        var btn = document.getElementById('btnSubmit');
        var msg = document.getElementById('msgBox');
        btn.disabled = true;
        btn.innerText = 'Mengirim...';

        var payload = {
          contractor: document.getElementById('contractor').value,
          zone: document.getElementById('zone').value,
          pier: document.getElementById('pier').value,
          activity: document.getElementById('activity').value,
          progress: document.getElementById('progress').value,
          remarks: document.getElementById('remarks').value
        };

        google.script.run
          .withSuccessHandler(function(res) {
            btn.disabled = false;
            btn.innerText = 'Kirim Laporan ke Spreadsheet';
            msg.className = 'p-3 rounded-xl text-center text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-600';
            msg.innerText = res.message;
            msg.classList.remove('hidden');
          })
          .withFailureHandler(function(err) {
            btn.disabled = false;
            btn.innerText = 'Kirim Laporan ke Spreadsheet';
            msg.className = 'p-3 rounded-xl text-center text-xs font-bold bg-rose-950 text-rose-300 border border-rose-600';
            msg.innerText = 'Gagal: ' + err.message;
            msg.classList.remove('hidden');
          })
          .submitInspection(payload);
      }
    </script>
  </body>
</html>`;
                        }
                      } else if (selectedScriptType === 'webapp') {
                        codeToCopy = `/**
 * GOOGLE APPS SCRIPT: HARBOUR ROAD II - WEB APP API (doGet & doPost)
 * Proyek: Jalan Tol Harbour Road II (Elevated)
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏗️ Harbour Road II')
    .addItem('📊 Hitung Ulang Deviasi Kurva S & SPI', 'recalculateSCurve')
    .addItem('⚠️ Pindai Pier Kritis (Slippage < -10%)', 'scanCriticalPiers')
    .addItem('📧 Kirim Ringkasan Progres Mingguan via Email', 'sendWeeklyProgressEmail')
    .addToUi();
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'ping';

    if (action === 'ping') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        project: 'Proyek Jalan Tol Harbour Road II (Elevated)',
        spreadsheetName: ss.getName(),
        spreadsheetId: ss.getId(),
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'get_tab') {
      var tabName = e.parameter.tab || '04_Weekly_Cutoff';
      var sheet = ss.getSheetByName(tabName);
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Tab ' + tabName + ' tidak ditemukan' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var values = sheet.getDataRange().getValues();
      var headers = values[0];
      var rows = [];
      for (var i = 1; i < values.length; i++) {
        var obj = {};
        for (var j = 0; j < headers.length; j++) {
          obj[headers[j]] = values[i][j];
        }
        rows.push(obj);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', tab: tabName, count: rows.length, data: rows }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Apps Script HBR II aktif dan siap digunakan.',
      actions: ['ping', 'get_tab']
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || 'update_scurve';

    if (action === 'update_scurve') {
      var sheet = ss.getSheetByName('04_Weekly_Cutoff') || ss.getSheetByName('05_Monthly_MC');
      if (sheet && payload.period) {
        var data = sheet.getDataRange().getValues();
        var found = false;
        for (var r = 1; r < data.length; r++) {
          if (String(data[r][0]).toLowerCase() === String(payload.period).toLowerCase()) {
            if (payload.actual !== undefined) sheet.getRange(r + 1, 6).setValue(Number(payload.actual));
            if (payload.planned !== undefined) sheet.getRange(r + 1, 5).setValue(Number(payload.planned));
            found = true;
            break;
          }
        }
        if (!found) {
          sheet.appendRow([payload.period, new Date(), 'TOTAL', Number(payload.planned || 0), Number(payload.actual || 0)]);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Kurva S berhasil diupdate' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', received: payload }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
                      } else if (selectedScriptType === 'menu') {
                        codeToCopy = `function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🏗️ Harbour Road II')
    .addItem('📊 Hitung Ulang Deviasi Kurva S & SPI', 'recalculateSCurve')
    .addItem('⚠️ Pindai Pier Kritis (Slippage < -10%)', 'scanCriticalPiers')
    .addItem('📧 Kirim Ringkasan Progres Mingguan via Email', 'sendWeeklyProgressEmail')
    .addToUi();
}`;
                      } else {
                        codeToCopy = `function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  var range = e.range;
  if (range.getValue() === 'Kendala Kritis') {
    SpreadsheetApp.getActiveSpreadsheet().toast('Pier ditandai Kritis!', 'Peringatan HBR II');
  }
}`;
                      }

                      navigator.clipboard.writeText(codeToCopy);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 3000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Kode File Ini</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Preformatted Code Display */}
                <pre className="p-4 font-mono text-xs text-blue-200 overflow-x-auto max-h-72 custom-scrollbar bg-slate-950/90 leading-relaxed selection:bg-blue-600 selection:text-white">
                  {selectedScriptType === 'ui_sidebar' && selectedUiFile === 'code' && (
`// File: Code.gs
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏗️ Harbour Road II')
    .addItem('📱 Buka Antarmuka Sidebar HBR II', 'showHBR2Sidebar')
    .addItem('📊 Hitung Ulang Kurva S', 'recalculateSCurve')
    .addToUi();
}

function showHBR2Sidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Panel Kontrol Harbour Road II')
    .setWidth(340);
  SpreadsheetApp.getUi().showSidebar(html);
}

function saveProgressFromSidebar(formData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // Simpan progres ke tab 01_Master_Piers dan 03_Daily_Progress...
  return { status: 'success', message: 'Data ' + formData.pierNumber + ' tersimpan!' };
}`
                  )}

                  {selectedScriptType === 'ui_sidebar' && selectedUiFile === 'html' && (
`<!-- File: Sidebar.html (Buat file baru tipe HTML di Apps Script) -->
<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <script src="https://cdn.tailwindcss.com"><\/script>
  </head>
  <body class="bg-slate-900 text-slate-100 p-4 text-xs">
    <h1 class="font-bold text-sm text-white">Harbour Road II - Panel Samping</h1>
    <!-- Form Input Cepat Lapangan -->
    <form onsubmit="handleSubmit(event)" class="space-y-3 mt-3">
      <select id="pierNumber" class="w-full bg-slate-950 p-2 rounded text-white">
        <option value="P18S">P.18.S (STA 1+800)</option>
        <option value="P19S">P.19.S (STA 1+900)</option>
        <option value="P20S">P.20.S (Pipa PGN)</option>
      </select>
      <input type="number" id="progressPct" placeholder="Progres %" class="w-full bg-slate-950 p-2 rounded text-white">
      <button type="submit" class="w-full py-2 bg-blue-600 text-white font-bold rounded">
        Simpan ke Spreadsheet
      </button>
    </form>
    <script>
      function handleSubmit(e) {
        e.preventDefault();
        // Kirim data ke Code.gs via google.script.run
        google.script.run.saveProgressFromSidebar({
          pierNumber: document.getElementById('pierNumber').value,
          progress: document.getElementById('progressPct').value
        });
      }
    <\/script>
  </body>
</html>`
                  )}

                  {selectedScriptType === 'ui_webapp' && selectedUiFile === 'code' && (
`// File: Code.gs (Web App Portal Lapangan Standalone)
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Portal Input Lapangan - Tol Harbour Road II')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function submitInspection(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // Simpan data laporan inspeksi ke Google Sheet...
  return { status: 'success', message: 'Laporan pier ' + data.pier + ' berhasil dicatat!' };
}`
                  )}

                  {selectedScriptType === 'ui_webapp' && selectedUiFile === 'html' && (
`<!-- File: Index.html (Halaman Portal Mandiri untuk HP / Tablet) -->
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script src="https://cdn.tailwindcss.com"><\/script>
  </head>
  <body class="bg-slate-950 text-white p-4 flex flex-col items-center">
    <div class="w-full max-w-md bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
      <h2 class="font-bold text-base">Portal Input Lapangan Tol HBR II</h2>
      <!-- Form Input Mobile Lapangan -->
    </div>
  </body>
</html>`
                  )}

                  {selectedScriptType === 'webapp' && (
`// File: Code.gs (REST API Webhook)
function doGet(e) {
  // Return JSON untuk membaca Kurva S, BOQ, atau Pier...
}
function doPost(e) {
  // Menerima POST data JSON dari Web App...
}`
                  )}

                  {selectedScriptType === 'menu' && (
`function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏗️ Harbour Road II')
    .addItem('📊 Hitung Ulang Deviasi Kurva S & SPI', 'recalculateSCurve')
    .addItem('⚠️ Pindai Pier Kritis', 'scanCriticalPiers')
    .addToUi();
}`
                  )}

                  {selectedScriptType === 'onedit' && (
`function onEdit(e) {
  // Validasi otomatis saat sel diubah...
}`
                  )}
                </pre>
              </div>

              {/* 4-Step Deployment Guide */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Cara Pasang Antarmuka di Google Sheets:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <div className="font-bold text-white">Buka Apps Script</div>
                    <p className="text-[11px] text-slate-400">
                      Di Google Sheets HBR II, klik <b className="text-slate-200">Ekstensi &gt; Apps Script</b>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <div className="font-bold text-white">Buat File HTML</div>
                    <p className="text-[11px] text-slate-400">
                      Klik tanda <b className="text-blue-400">+ (Tambah)</b> di panel kiri Apps Script &gt; pilih <b className="text-slate-200">HTML</b> &gt; beri nama <code className="text-emerald-400">Sidebar</code> (atau <code className="text-emerald-400">Index</code>).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                      3
                    </span>
                    <div className="font-bold text-white">Paste Kode</div>
                    <p className="text-[11px] text-slate-400">
                      Paste kode <code className="text-blue-300">Code.gs</code> di file script dan kode <code className="text-emerald-300">Sidebar.html</code> di file HTML.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                      4
                    </span>
                    <div className="font-bold text-white">Buka Antarmuka</div>
                    <p className="text-[11px] text-slate-400">
                      Muat ulang Google Sheets Anda, lalu klik menu baru <b className="text-emerald-400">🏗️ Harbour Road II &gt; Buka Antarmuka Sidebar</b>!
                    </p>
                  </div>
                </div>
              </div>

              {/* Web App URL Connection & Ping Test */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tautkan URL Google Apps Script Web App:</span>
                  </div>
                  {scriptTestResult && (
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    value={appScriptUrl}
                    onChange={e => setAppScriptUrl(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={handleTestAppScript}
                    disabled={testingScript}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingScript ? 'animate-spin' : ''}`} />
                    <span>{testingScript ? 'Menguji...' : 'Tes & Simpan URL'}</span>
                  </button>
                </div>

                {scriptTestResult && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 text-emerald-300 font-mono text-xs">
                    {scriptTestResult}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Google API v3 (Drive) & v4 (Sheets) • Cloud Project: gen-lang-client-0891902948</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
