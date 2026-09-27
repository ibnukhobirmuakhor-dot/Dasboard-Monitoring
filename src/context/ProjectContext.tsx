import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  ProjectMaster,
  ZoneMaster,
  PierMaster,
  WBSNode,
  ActivityItem,
  DailyProgressRecord,
  WeeklyProgressItem,
  MonthlyProgressItem,
  SCurveDataPoint,
  ConstraintRecord,
  IssueRecord,
  ActionTrackerRecord,
  MaterialRecord,
  EquipmentRecord,
  ManpowerRecord,
  PhotoProgressRecord,
  RecoveryPlanData,
  RoleType,
  ContractorId,
  GlobalFilterState
} from '../types';
import {
  initialProject,
  initialZones,
  initialPiers,
  initialWBS,
  initialActivities,
  initialDailyProgress,
  initialWeeklyProgress,
  initialMonthlyProgress,
  initialSCurve,
  initialConstraints,
  initialIssues,
  initialActions,
  initialMaterials,
  initialEquipment,
  initialManpower,
  initialPhotos,
  initialRecoveryPlan
} from '../data/initialData';

interface SearchResult {
  type: 'Pier' | 'Activity' | 'Constraint' | 'Issue' | 'Progress' | 'Material';
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  data: any;
}

interface ProjectContextType {
  // State
  project: ProjectMaster;
  zones: ZoneMaster[];
  piers: PierMaster[];
  wbs: WBSNode[];
  activities: ActivityItem[];
  dailyProgress: DailyProgressRecord[];
  weeklyProgress: WeeklyProgressItem[];
  monthlyProgress: MonthlyProgressItem[];
  sCurve: SCurveDataPoint[];
  constraints: ConstraintRecord[];
  issues: IssueRecord[];
  actions: ActionTrackerRecord[];
  materials: MaterialRecord[];
  equipment: EquipmentRecord[];
  manpower: ManpowerRecord[];
  photos: PhotoProgressRecord[];
  recoveryPlan: RecoveryPlanData;

  // Roles
  currentRole: RoleType;
  setCurrentRole: (role: RoleType) => void;
  contractorUser: ContractorId;
  setContractorUser: (c: ContractorId) => void;
  canEdit: boolean;
  canInputProgress: boolean;
  canInputIssue: boolean;

  // Global Filters
  filters: GlobalFilterState;
  setFilters: React.Dispatch<React.SetStateAction<GlobalFilterState>>;
  resetFilters: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: SearchResult[];

  // CRUD with validation
  addDailyProgress: (record: Omit<DailyProgressRecord, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  deleteDailyProgress: (id: string) => void;
  
  addPier: (pier: PierMaster) => { success: boolean; error?: string };
  updatePier: (pier: PierMaster) => { success: boolean; error?: string };
  deletePier: (pierId: string) => void;

  addWbsNode: (node: WBSNode) => { success: boolean; error?: string };
  updateWbsNode: (node: WBSNode) => { success: boolean; error?: string };
  deleteWbsNode: (wbsId: string) => void;

  addActivity: (act: ActivityItem) => { success: boolean; error?: string };
  updateActivity: (act: ActivityItem) => { success: boolean; error?: string };
  deleteActivity: (activityId: string) => void;

  addConstraint: (c: ConstraintRecord) => { success: boolean; error?: string };
  updateConstraint: (c: ConstraintRecord) => { success: boolean; error?: string };
  deleteConstraint: (id: string) => void;

  addIssue: (iss: IssueRecord) => { success: boolean; error?: string };
  updateIssue: (iss: IssueRecord) => { success: boolean; error?: string };
  deleteIssue: (id: string) => void;

  addAction: (act: ActionTrackerRecord) => { success: boolean; error?: string };
  updateAction: (act: ActionTrackerRecord) => { success: boolean; error?: string };
  deleteAction: (id: string) => void;

  addMaterial: (mat: MaterialRecord) => { success: boolean; error?: string };
  updateMaterial: (mat: MaterialRecord) => { success: boolean; error?: string };
  
  addEquipment: (eq: EquipmentRecord) => { success: boolean; error?: string };
  updateEquipment: (eq: EquipmentRecord) => { success: boolean; error?: string };

  addManpower: (mp: ManpowerRecord) => { success: boolean; error?: string };

  addPhoto: (photo: PhotoProgressRecord) => { success: boolean; error?: string };

  // Excel Import & Export
  importDataFromExcel: (category: string, rows: any[]) => { success: boolean; count: number; error?: string };
  exportToExcel: (filename: string, sheetName: string, data: any[]) => void;
  exportToCSV: (filename: string, data: any[]) => void;
  bulkUpdateFromSheet: (updates: {
    piers?: PierMaster[];
    constraints?: ConstraintRecord[];
    issues?: IssueRecord[];
  }) => void;

  // Reset database
  resetDatabase: () => void;

  // Computed KPIs
  projectKPIs: {
    totalPlanned: number;
    totalActual: number;
    deviation: number;
    spi: number;
    remainingWork: number;
    daysRemainingContract: number;
    daysRemainingTarget: number;
    wikaProgress: { plan: number; actual: number; spi: number; dev: number };
    giProgress: { plan: number; actual: number; spi: number; dev: number };
    openConstraintsCount: number;
    criticalIssuesCount: number;
  };
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const STORAGE_KEY = 'hbr2_monitoring_data_v4';

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial from storage if available
  const [project, setProject] = useState<ProjectMaster>(initialProject);
  const [zones, setZones] = useState<ZoneMaster[]>(initialZones);
  const [piers, setPiers] = useState<PierMaster[]>(initialPiers);
  const [wbs, setWbs] = useState<WBSNode[]>(initialWBS);
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [dailyProgress, setDailyProgress] = useState<DailyProgressRecord[]>(initialDailyProgress);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgressItem[]>(initialWeeklyProgress);
  const [monthlyProgress, setMonthlyProgress] = useState<MonthlyProgressItem[]>(initialMonthlyProgress);
  const [sCurve, setSCurve] = useState<SCurveDataPoint[]>(initialSCurve);
  const [constraints, setConstraints] = useState<ConstraintRecord[]>(initialConstraints);
  const [issues, setIssues] = useState<IssueRecord[]>(initialIssues);
  const [actions, setActions] = useState<ActionTrackerRecord[]>(initialActions);
  const [materials, setMaterials] = useState<MaterialRecord[]>(initialMaterials);
  const [equipment, setEquipment] = useState<EquipmentRecord[]>(initialEquipment);
  const [manpower, setManpower] = useState<ManpowerRecord[]>(initialManpower);
  const [photos, setPhotos] = useState<PhotoProgressRecord[]>(initialPhotos);
  const [recoveryPlan, setRecoveryPlan] = useState<RecoveryPlanData>(initialRecoveryPlan);

  // User Role
  const [currentRole, setCurrentRole] = useState<RoleType>('PME');
  const [contractorUser, setContractorUser] = useState<ContractorId>('WIKA');

  // Search
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Global Filters
  const initialFilters: GlobalFilterState = {
    dateRange: 'ALL',
    contractorId: 'ALL',
    zoneId: 'ALL',
    pierId: 'ALL',
    wbsId: 'ALL',
    activityId: 'ALL',
    status: 'ALL'
  };
  const [filters, setFilters] = useState<GlobalFilterState>(initialFilters);

  const resetFilters = () => setFilters(initialFilters);

  // Save to localStorage
  useEffect(() => {
    try {
      const dataToSave = {
        project,
        zones,
        piers,
        wbs,
        activities,
        dailyProgress,
        weeklyProgress,
        monthlyProgress,
        sCurve,
        constraints,
        issues,
        actions,
        materials,
        equipment,
        manpower,
        photos,
        recoveryPlan
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [
    project, zones, piers, wbs, activities, dailyProgress, weeklyProgress,
    monthlyProgress, sCurve, constraints, issues, actions, materials, equipment,
    manpower, photos, recoveryPlan
  ]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.piers && parsed.piers.length > 0) {
          setPiers(parsed.piers);
          if (parsed.wbs && parsed.wbs.length >= 10) setWbs(parsed.wbs);
          else setWbs(initialWBS);

          if (parsed.activities && parsed.activities.some((a: any) => a.predecessors && a.predecessors.length > 0)) {
            setActivities(parsed.activities);
          } else {
            setActivities(initialActivities);
          }

          if (parsed.dailyProgress) setDailyProgress(parsed.dailyProgress);
          if (parsed.weeklyProgress) setWeeklyProgress(parsed.weeklyProgress);
          if (parsed.monthlyProgress) setMonthlyProgress(parsed.monthlyProgress);
          if (parsed.constraints) setConstraints(parsed.constraints);
          if (parsed.issues) setIssues(parsed.issues);
          if (parsed.actions) setActions(parsed.actions);
          if (parsed.materials) setMaterials(parsed.materials);
          if (parsed.equipment) setEquipment(parsed.equipment);
          if (parsed.manpower) setManpower(parsed.manpower);
          if (parsed.photos) setPhotos(parsed.photos);
        }
      }
    } catch (e) {
      console.warn('Could not restore from localStorage, using initial seed data.');
    }
  }, []);

  const resetDatabase = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProject(initialProject);
    setZones(initialZones);
    setPiers(initialPiers);
    setWbs(initialWBS);
    setActivities(initialActivities);
    setDailyProgress(initialDailyProgress);
    setWeeklyProgress(initialWeeklyProgress);
    setMonthlyProgress(initialMonthlyProgress);
    setSCurve(initialSCurve);
    setConstraints(initialConstraints);
    setIssues(initialIssues);
    setActions(initialActions);
    setMaterials(initialMaterials);
    setEquipment(initialEquipment);
    setManpower(initialManpower);
    setPhotos(initialPhotos);
    setRecoveryPlan(initialRecoveryPlan);
  };

  // Role permissions
  const canEdit = currentRole === 'Admin' || currentRole === 'PME';
  const canInputProgress = currentRole === 'Admin' || currentRole === 'PME' || currentRole === 'Engineer' || currentRole === 'Contractor';
  const canInputIssue = currentRole === 'Admin' || currentRole === 'PME' || currentRole === 'Engineer';

  // --- CRUD OPERATIONS WITH STRICT VALIDATION ---

  const addDailyProgress = (record: Omit<DailyProgressRecord, 'id' | 'createdAt'>) => {
    // Validations:
    if (!record.contractorId) return { success: false, error: 'Kontraktor wajib dipilih.' };
    if (!record.pierId) return { success: false, error: 'Pier wajib dipilih.' };
    if (record.actualProgress < 0) return { success: false, error: 'Actual Progress tidak boleh bernilai negatif.' };
    if (record.actualProgress > 100 || record.plannedProgress > 100) return { success: false, error: 'Progress tidak boleh melebihi 100%.' };

    const newRecord: DailyProgressRecord = {
      ...record,
      id: `DLY-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setDailyProgress(prev => [newRecord, ...prev]);

    // Automatically recalculate corresponding Pier progress slightly and update status if needed
    setPiers(prev => prev.map(p => {
      if (p.pierId === record.pierId || p.pierNumber === record.pierId) {
        const newOverall = Math.min(100, Math.round((p.overallProgress + (record.actualProgress * 0.2)) * 10) / 10);
        return {
          ...p,
          overallProgress: newOverall,
          status: newOverall >= 100 ? 'Closed' : newOverall > 0 ? 'On Progress' : p.status
        };
      }
      return p;
    }));

    return { success: true };
  };

  const deleteDailyProgress = (id: string) => {
    setDailyProgress(prev => prev.filter(item => item.id !== id));
  };

  const addPier = (newPier: PierMaster) => {
    // Validations
    if (!newPier.pierId || !newPier.pierNumber) return { success: false, error: 'Pier ID dan Pier Number wajib diisi.' };
    if (!newPier.contractorId) return { success: false, error: 'Kontraktor wajib diisi.' };
    if (newPier.overallProgress < 0 || newPier.overallProgress > 100) return { success: false, error: 'Progress harus antara 0% - 100%.' };

    const duplicate = piers.some(
      p => p.pierId.toLowerCase() === newPier.pierId.toLowerCase() || 
           p.pierNumber.toLowerCase() === newPier.pierNumber.toLowerCase()
    );
    if (duplicate) {
      return { success: false, error: `Pier dengan nomor/ID '${newPier.pierNumber}' sudah terdaftar dalam sistem (Duplicate Pier).` };
    }

    setPiers(prev => [...prev, newPier]);
    return { success: true };
  };

  const updatePier = (updatedPier: PierMaster) => {
    if (!updatedPier.contractorId) return { success: false, error: 'Kontraktor wajib diisi.' };
    if (updatedPier.overallProgress < 0 || updatedPier.overallProgress > 100) return { success: false, error: 'Progress harus antara 0% - 100%.' };

    setPiers(prev => prev.map(p => p.pierId === updatedPier.pierId ? updatedPier : p));
    return { success: true };
  };

  const deletePier = (pierId: string) => {
    setPiers(prev => prev.filter(p => p.pierId !== pierId));
  };

  const addWbsNode = (node: WBSNode) => {
    if (!node.wbsId || !node.wbsName) return { success: false, error: 'WBS ID dan Nama WBS wajib diisi.' };
    if (wbs.some(w => w.wbsId.toLowerCase() === node.wbsId.toLowerCase())) {
      return { success: false, error: `WBS ID '${node.wbsId}' sudah ada.` };
    }
    setWbs(prev => [...prev, node]);
    return { success: true };
  };

  const updateWbsNode = (node: WBSNode) => {
    setWbs(prev => prev.map(w => w.wbsId === node.wbsId ? node : w));
    return { success: true };
  };

  const deleteWbsNode = (wbsId: string) => {
    setWbs(prev => prev.filter(w => w.wbsId !== wbsId));
  };

  const addActivity = (act: ActivityItem) => {
    if (!act.activityId || !act.activityName) return { success: false, error: 'Activity ID dan Nama Aktivitas wajib diisi.' };
    if (!act.contractorId) return { success: false, error: 'Kontraktor wajib diisi.' };
    if (!act.pierId) return { success: false, error: 'Pier ID wajib diisi untuk aktivitas pekerjaan.' };

    // Duplicate check
    if (activities.some(a => a.activityId.toLowerCase() === act.activityId.toLowerCase())) {
      return { success: false, error: `Activity ID '${act.activityId}' sudah ada (Duplicate Activity ID).` };
    }

    // Date validation: Finish date before Start date
    if (new Date(act.finishPlan) < new Date(act.startPlan)) {
      return { success: false, error: 'Tanggal Finish Plan tidak boleh mendahului Start Plan.' };
    }
    if (act.startActual && act.finishActual && new Date(act.finishActual) < new Date(act.startActual)) {
      return { success: false, error: 'Tanggal Finish Actual tidak boleh mendahului Start Actual.' };
    }

    if (act.progressActual < 0 || act.progressActual > 100) return { success: false, error: 'Progress Actual harus antara 0% dan 100%.' };

    setActivities(prev => [...prev, act]);
    return { success: true };
  };

  const updateActivity = (act: ActivityItem) => {
    if (new Date(act.finishPlan) < new Date(act.startPlan)) {
      return { success: false, error: 'Tanggal Finish Plan tidak boleh mendahului Start Plan.' };
    }
    setActivities(prev => prev.map(a => a.activityId === act.activityId ? act : a));
    return { success: true };
  };

  const deleteActivity = (activityId: string) => {
    setActivities(prev => prev.filter(a => a.activityId !== activityId));
  };

  const addConstraint = (c: ConstraintRecord) => {
    if (!c.constraintId || !c.description) return { success: false, error: 'Constraint ID dan Deskripsi wajib diisi.' };
    if (!c.contractorId) return { success: false, error: 'Kontraktor wajib diisi.' };
    if (!c.pierNumber) return { success: false, error: 'Nomor Pier wajib diisi.' };

    if (constraints.some(item => item.constraintId === c.constraintId)) {
      return { success: false, error: `Constraint ID '${c.constraintId}' sudah ada.` };
    }

    setConstraints(prev => [c, ...prev]);
    return { success: true };
  };

  const updateConstraint = (c: ConstraintRecord) => {
    setConstraints(prev => prev.map(item => item.constraintId === c.constraintId ? c : item));
    return { success: true };
  };

  const deleteConstraint = (id: string) => {
    setConstraints(prev => prev.filter(item => item.constraintId !== id));
  };

  const addIssue = (iss: IssueRecord) => {
    if (!iss.issueId || !iss.issue) return { success: false, error: 'Issue ID dan Uraian Masalah wajib diisi.' };
    if (!iss.contractorId) return { success: false, error: 'Kontraktor wajib diisi.' };

    if (issues.some(item => item.issueId === iss.issueId)) {
      return { success: false, error: `Issue ID '${iss.issueId}' sudah ada.` };
    }

    setIssues(prev => [iss, ...prev]);
    return { success: true };
  };

  const updateIssue = (iss: IssueRecord) => {
    setIssues(prev => prev.map(item => item.issueId === iss.issueId ? iss : item));
    return { success: true };
  };

  const deleteIssue = (id: string) => {
    setIssues(prev => prev.filter(item => item.issueId !== id));
  };

  const addAction = (act: ActionTrackerRecord) => {
    if (!act.actionId || !act.action) return { success: false, error: 'Action ID dan Tindakan wajib diisi.' };
    setActions(prev => [act, ...prev]);
    return { success: true };
  };

  const updateAction = (act: ActionTrackerRecord) => {
    setActions(prev => prev.map(item => item.actionId === act.actionId ? act : item));
    return { success: true };
  };

  const deleteAction = (id: string) => {
    setActions(prev => prev.filter(item => item.actionId !== id));
  };

  const addMaterial = (mat: MaterialRecord) => {
    setMaterials(prev => [...prev, mat]);
    return { success: true };
  };

  const updateMaterial = (mat: MaterialRecord) => {
    setMaterials(prev => prev.map(item => item.id === mat.id ? mat : item));
    return { success: true };
  };

  const addEquipment = (eq: EquipmentRecord) => {
    setEquipment(prev => [...prev, eq]);
    return { success: true };
  };

  const updateEquipment = (eq: EquipmentRecord) => {
    setEquipment(prev => prev.map(item => item.id === eq.id ? eq : item));
    return { success: true };
  };

  const addManpower = (mp: ManpowerRecord) => {
    setManpower(prev => [mp, ...prev]);
    return { success: true };
  };

  const addPhoto = (photo: PhotoProgressRecord) => {
    setPhotos(prev => [photo, ...prev]);
    return { success: true };
  };

  // --- EXCEL IMPORT & EXPORT ---

  const importDataFromExcel = (category: string, rows: any[]) => {
    if (!rows || rows.length === 0) {
      return { success: false, count: 0, error: 'File kosong atau format tidak sesuai.' };
    }

    try {
      let count = 0;
      if (category === 'Pier') {
        const newPiers: PierMaster[] = [];
        for (const row of rows) {
          const pierNumber = String(row['Pier Number'] || row['pierNumber'] || row['Pier'] || '').trim();
          if (!pierNumber) continue;

          // Check duplicate
          if (piers.some(p => p.pierNumber.toLowerCase() === pierNumber.toLowerCase()) || 
              newPiers.some(p => p.pierNumber.toLowerCase() === pierNumber.toLowerCase())) {
            continue; // Skip duplicate
          }

          newPiers.push({
            pierId: String(row['Pier ID'] || row['pierId'] || pierNumber),
            pierNumber,
            zoneId: String(row['Zone'] || row['zoneId'] || 'Z-1S'),
            contractorId: (row['Contractor'] || row['contractorId'] || 'WIKA') as ContractorId,
            latitude: Number(row['Latitude'] || -6.1265),
            longitude: Number(row['Longitude'] || 106.8724),
            status: (row['Status'] || 'On Progress'),
            overallProgress: Math.min(100, Math.max(0, Number(row['Progress'] || row['overallProgress'] || 0))),
            plannedFinish: String(row['Planned Finish'] || '2026-03-31'),
            mainActivity: String(row['Main Activity'] || 'Construction In Progress')
          });
          count++;
        }
        if (newPiers.length > 0) setPiers(prev => [...prev, ...newPiers]);
      } else if (category === 'Daily Progress') {
        const newLogs: DailyProgressRecord[] = [];
        for (const row of rows) {
          const pier = String(row['Pier'] || row['pierId'] || '').trim();
          if (!pier) continue;

          newLogs.push({
            id: `DLY-IMP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            date: String(row['Date'] || new Date().toISOString().split('T')[0]),
            contractorId: (row['Contractor'] || 'WIKA') as ContractorId,
            zoneId: String(row['Zone'] || 'Z-1S'),
            pierId: pier,
            wbsId: String(row['WBS'] || 'WBS-3-P18S'),
            activityId: String(row['Activity'] || 'ACT-P18S-REBAR'),
            plannedProgress: Number(row['Planned Progress'] || 2.0),
            actualProgress: Number(row['Actual Progress'] || 1.8),
            quantityPlan: Number(row['Quantity Plan'] || 10),
            quantityActual: Number(row['Quantity Actual'] || 9),
            unit: String(row['Unit'] || 'm3'),
            manpower: Number(row['Manpower'] || 12),
            equipment: String(row['Equipment'] || 'Crane, Pump'),
            description: String(row['Description'] || 'Imported progress log'),
            remarks: String(row['Remarks'] || 'Imported from Excel'),
            createdAt: new Date().toISOString()
          });
          count++;
        }
        if (newLogs.length > 0) setDailyProgress(prev => [...newLogs, ...prev]);
      } else if (category === 'Constraint') {
        const newConstraints: ConstraintRecord[] = [];
        for (const row of rows) {
          const pier = String(row['Pier No.'] || row['pierNumber'] || '').trim();
          const desc = String(row['Description'] || row['description'] || '').trim();
          if (!pier || !desc) continue;

          newConstraints.push({
            constraintId: String(row['Constraint ID'] || `CST-IMP-${Date.now().toString().slice(-4)}`),
            zoneId: String(row['Zona'] || 'Z-1S'),
            pierNumber: pier,
            contractorId: (row['Contractor'] || 'WIKA') as ContractorId,
            category: (row['Category'] || 'Utilitas'),
            description: desc,
            impact: String(row['Impact'] || 'Potensi keterlambatan'),
            pic: String(row['PIC'] || 'Site Coordinator'),
            targetResolution: String(row['Target Resolution'] || '2025-11-30'),
            status: (row['Status'] || 'Open'),
            dateIdentified: String(row['Date Identified'] || new Date().toISOString().split('T')[0]),
            remarks: String(row['Remarks'] || '')
          });
          count++;
        }
        if (newConstraints.length > 0) setConstraints(prev => [...newConstraints, ...prev]);
      }

      return { success: true, count };
    } catch (e: any) {
      return { success: false, count: 0, error: e.message || 'Gagal memproses file Excel.' };
    }
  };

  const bulkUpdateFromSheet = (updates: {
    piers?: PierMaster[];
    constraints?: ConstraintRecord[];
    issues?: IssueRecord[];
  }) => {
    if (updates.piers && updates.piers.length > 0) {
      setPiers(updates.piers);
    }
    if (updates.constraints && updates.constraints.length > 0) {
      setConstraints(updates.constraints);
    }
    if (updates.issues && updates.issues.length > 0) {
      setIssues(updates.issues);
    }
  };

  const exportToExcel = (filename: string, sheetName: string, data: any[]) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const exportToCSV = (filename: string, data: any[]) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- SEARCH ENGINE ---
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length === 0) return [];
    const q = searchQuery.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Search in Piers
    for (const p of piers) {
      if (p.pierNumber.toLowerCase().includes(q) || p.pierId.toLowerCase().includes(q) || p.mainActivity?.toLowerCase().includes(q)) {
        results.push({
          type: 'Pier',
          id: p.pierId,
          title: `Pier ${p.pierNumber}`,
          subtitle: `Zona ${p.zoneId} • Kontraktor: ${p.contractorId} • Progress: ${p.overallProgress}%`,
          tag: p.status,
          data: p
        });
      }
    }

    // Search in Activities
    for (const a of activities) {
      if (a.activityName.toLowerCase().includes(q) || a.activityId.toLowerCase().includes(q) || a.pierId.toLowerCase().includes(q)) {
        results.push({
          type: 'Activity',
          id: a.activityId,
          title: a.activityName,
          subtitle: `Pier ${a.pierId} • Kontraktor: ${a.contractorId} • Plan: ${a.progressPlan}% / Actual: ${a.progressActual}%`,
          tag: a.status,
          data: a
        });
      }
    }

    // Search in Constraints
    for (const c of constraints) {
      if (c.description.toLowerCase().includes(q) || c.pierNumber.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.pic.toLowerCase().includes(q)) {
        results.push({
          type: 'Constraint',
          id: c.constraintId,
          title: `[${c.category}] Pier ${c.pierNumber} - ${c.description}`,
          subtitle: `PIC: ${c.pic} • Target: ${c.targetResolution}`,
          tag: c.status,
          data: c
        });
      }
    }

    // Search in Issues
    for (const iss of issues) {
      if (iss.issue.toLowerCase().includes(q) || iss.pierNumber.toLowerCase().includes(q) || iss.rootCause.toLowerCase().includes(q)) {
        results.push({
          type: 'Issue',
          id: iss.issueId,
          title: `Issue ${iss.issueId} (Pier ${iss.pierNumber}): ${iss.issue}`,
          subtitle: `Root Cause: ${iss.rootCause}`,
          tag: iss.status,
          data: iss
        });
      }
    }

    // Search in Materials
    for (const m of materials) {
      if (m.material.toLowerCase().includes(q) || m.supplier.toLowerCase().includes(q)) {
        results.push({
          type: 'Material',
          id: m.id,
          title: m.material,
          subtitle: `Stock: ${m.availableStock} ${m.unit} • Supplier: ${m.supplier}`,
          tag: m.status,
          data: m
        });
      }
    }

    return results;
  }, [searchQuery, piers, activities, constraints, issues, materials]);

  // --- COMPUTED KPIS ---
  const projectKPIs = useMemo(() => {
    // Latest weekly total record
    const latestTotal = weeklyProgress.filter(w => w.contractorId === 'TOTAL').slice(-1)[0] || {
      planProgress: 65.05,
      actualProgress: 59.55,
      deviation: -5.5,
      spi: 0.915,
      remainingWork: 40.45
    };

    const latestWika = weeklyProgress.filter(w => w.contractorId === 'WIKA').slice(-1)[0] || {
      planProgress: 70.3,
      actualProgress: 67.2,
      deviation: -3.1,
      spi: 0.956
    };

    const latestGi = weeklyProgress.filter(w => w.contractorId === 'GI').slice(-1)[0] || {
      planProgress: 59.8,
      actualProgress: 51.9,
      deviation: -7.9,
      spi: 0.868
    };

    // Calculate remaining days
    const today = new Date();
    const finishDate = new Date(project.contractFinish);
    const targetDate = new Date(project.currentTargetFinish);
    const msPerDay = 1000 * 60 * 60 * 24;

    const daysRemainingContract = Math.max(0, Math.ceil((finishDate.getTime() - today.getTime()) / msPerDay));
    const daysRemainingTarget = Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / msPerDay));

    const openConstraintsCount = constraints.filter(c => c.status === 'Open' || c.status === 'On Progress').length;
    const criticalIssuesCount = issues.filter(i => i.status === 'Open').length;

    return {
      totalPlanned: latestTotal.planProgress,
      totalActual: latestTotal.actualProgress,
      deviation: latestTotal.deviation,
      spi: latestTotal.spi,
      remainingWork: latestTotal.remainingWork,
      daysRemainingContract,
      daysRemainingTarget,
      wikaProgress: {
        plan: latestWika.planProgress,
        actual: latestWika.actualProgress,
        spi: latestWika.spi,
        dev: latestWika.deviation
      },
      giProgress: {
        plan: latestGi.planProgress,
        actual: latestGi.actualProgress,
        spi: latestGi.spi,
        dev: latestGi.deviation
      },
      openConstraintsCount,
      criticalIssuesCount
    };
  }, [weeklyProgress, project, constraints, issues]);

  return (
    <ProjectContext.Provider
      value={{
        project,
        zones,
        piers,
        wbs,
        activities,
        dailyProgress,
        weeklyProgress,
        monthlyProgress,
        sCurve,
        constraints,
        issues,
        actions,
        materials,
        equipment,
        manpower,
        photos,
        recoveryPlan,
        currentRole,
        setCurrentRole,
        contractorUser,
        setContractorUser,
        canEdit,
        canInputProgress,
        canInputIssue,
        filters,
        setFilters,
        resetFilters,
        searchQuery,
        setSearchQuery,
        searchResults,
        addDailyProgress,
        deleteDailyProgress,
        addPier,
        updatePier,
        deletePier,
        addWbsNode,
        updateWbsNode,
        deleteWbsNode,
        addActivity,
        updateActivity,
        deleteActivity,
        addConstraint,
        updateConstraint,
        deleteConstraint,
        addIssue,
        updateIssue,
        deleteIssue,
        addAction,
        updateAction,
        deleteAction,
        addMaterial,
        updateMaterial,
        addEquipment,
        updateEquipment,
        addManpower,
        addPhoto,
        importDataFromExcel,
        exportToExcel,
        exportToCSV,
        bulkUpdateFromSheet,
        resetDatabase,
        projectKPIs
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
