export type RoleType = 'Admin' | 'PME' | 'Engineer' | 'Contractor' | 'Viewer';

export type ContractorId = 'WIKA' | 'GI' | 'WIKA-GI' | 'Unassigned';

export type PierStatus = 'Closed' | 'On Progress' | 'Open' | 'N/A'; // Green, Yellow, Red, Grey

export type ConstraintCategory = 
  | 'Lahan'
  | 'Utilitas'
  | 'Desain'
  | 'Akses Kerja'
  | 'Perijinan'
  | 'Material'
  | 'Equipment'
  | 'Lainnya';

export type ConstraintStatus = 'Open' | 'On Progress' | 'Closed' | 'N/A';

export type IssueStatus = 'Open' | 'On Progress' | 'Closed';

export type ActionStatus = 'Open' | 'On Progress' | 'Closed';

export type ActivityStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';

export interface ProjectMaster {
  projectId: string;
  projectName: string;
  contractStart: string;
  contractFinish: string;
  currentTargetFinish: string;
  client: string;
  consultant: string;
  contractors: ContractorId[];
}

export interface ZoneMaster {
  zoneId: string;
  zoneName: string;
  direction: 'Selatan' | 'Utara';
  startPier: string;
  endPier: string;
}

export type PierSection = 
  | 'Main Road Awal' 
  | 'Sisi Selatan' 
  | 'Sisi Utara' 
  | 'Main Road Akhir' 
  | 'Ramp' 
  | 'Frontage';

export interface PierMaster {
  pierId: string;
  pierNumber: string; // e.g. P.1, P.16.S, P.21.N, RAO.1, RAF.1, RSF.1, RUO.1, GPF.1
  zoneId: string;
  section?: PierSection;
  zona?: string; // e.g. Zona 0, Zona 1, RMO, RAO, RAF, FU, dll
  ruas?: string; // Ruas original dari sheet (mis. Main Road Awal, Main Road Selatan, Ramp On Ancol Timur (RAO), dll)
  kodeArea?: string; // e.g. P.1 ~ P.2, P.16.S ~ P.17.S
  tipePier?: string; // e.g. Single Pier, Cantilever 2.00 m, Portal, Balance Cantilever, dll
  tipeSuperstruktur?: string; // e.g. Double Box Girder, Single Box Girder, PCU, SBG, Balance Cantilever, Tie Beam
  lingkupKontraktor?: string; // e.g. PT Wijaya Karya, PT Girder Indonesia, PT Wijaya Karya / PT Girder Indonesia
  contractorId: ContractorId;
  latitude: number;
  longitude: number;
  status: PierStatus;
  overallProgress: number;
  plannedFinish: string;
  actualFinish?: string;
  planStart?: string;
  actualStart?: string;
  wbsCode?: string;
  staPosition?: string;
  mainActivity?: string;
  boqItems?: PierBOQItem[];
}

export type MajorItemStatus = 'Selesai' | 'Progress' | 'Belum' | 'N/A';

export interface MajorItemPointProgress {
  status: MajorItemStatus;
  percent: number; // 0 - 100
  note?: string; // e.g. "8/8 Titik", "Lift 2/2", "1 Bentang"
}

export interface PierMajorItemsData {
  borepile: MajorItemPointProgress;
  pilecap: MajorItemPointProgress;
  pierKolom: MajorItemPointProgress;
  pierhead: MajorItemPointProgress;
  lrb: MajorItemPointProgress;
  prodBoxGirder: MajorItemPointProgress;
  erectionBoxGirder: MajorItemPointProgress;
  steelBoxGirder: MajorItemPointProgress;
  pcuPci: MajorItemPointProgress;
}

export interface PierBOQItem {
  itemNumber: string; // e.g. "7.1.(1)"
  itemDescription: string;
  divisionId: BOQDivisionId;
  unit: string; // e.g. "m", "m3", "kg", "bentang", "buah", "Ls"
  unitPrice: number; // IDR (Rp)
  volumePlan: number; // Volume Rencana (Kontrak Addendum 4)
  volumeShopDrawing: number; // Volume Shop Drawing Disetujui
  volumeProgressed?: number; // Volume Terprogress (Fisik)
  volumeActualBilled: number; // Volume Actual Tertagih (Certified MC)
  verificationStatus: 'Terverifikasi MC' | 'Pengajuan BAP' | 'Dalam Pengerjaan' | 'Belum Dimulai';
  shopDrawingNo?: string;
  mcBatchNo?: string;
}

export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface TaskDependency {
  predecessorId: string; // activityId or row ID
  type: DependencyType;  // Finish-to-Start (FS), Start-to-Start (SS), Finish-to-Finish (FF), Start-to-Finish (SF)
  lagDays?: number;      // e.g. 0, 2, -1
}

export interface WBSNode {
  wbsId: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  parentWbsId?: string;
  wbsCode: string;
  wbsName: string;
  description?: string;
  section?: string;
  zoneId?: string;
}

export interface ActivityItem {
  activityId: string;
  wbsId: string;
  wbsCode?: string;
  pierId: string;
  contractorId: ContractorId;
  activityName: string;
  weight: number; // Percentage weight in project (e.g. 0.45%)
  duration?: number; // Duration in calendar days
  startPlan: string;
  finishPlan: string;
  startActual?: string;
  finishActual?: string;
  progressPlan: number; // 0 - 100
  progressActual: number; // 0 - 100
  status: ActivityStatus;
  predecessors?: TaskDependency[]; // MS Project dependencies
  isCritical?: boolean; // Critical Path Flag
  totalFloat?: number; // Total Float / Slack in days
  freeFloat?: number; // Free Float in days
  earlyStart?: string;
  earlyFinish?: string;
  lateStart?: string;
  lateFinish?: string;
  isMilestone?: boolean;

  // Baseline Comparison (Baseline 0 - Original Planned Schedule)
  baselineStart?: string;
  baselineFinish?: string;
  baselineDuration?: number;
  baselineProgressPlan?: number;
}

export type SlippageSeverity = 'ahead' | 'on_track' | 'minor_slippage' | 'critical_slippage';

export interface ActivitySlippageAnalysis {
  activityId: string;
  wbsCode?: string;
  activityName: string;
  pierId: string;
  contractorId: ContractorId;
  weight: number;
  status: ActivityStatus;
  isCritical: boolean;

  // Baseline Schedule
  baselineStart: string;
  baselineFinish: string;
  baselineDuration: number;

  // Current / Revised Schedule
  currentStart: string;
  currentFinish: string;
  currentDuration: number;
  startActual?: string;
  finishActual?: string;
  progressPlan: number;
  progressActual: number;

  // Variances & Slippages (in days and %)
  startVarianceDays: number; // >0: Start slipped later than baseline
  finishVarianceDays: number; // >0: Finish slipped past baseline finish date
  durationVarianceDays: number; // >0: Duration expanded
  progressVariance: number; // actual - plan (<0: falling behind)

  // Categorization
  slippageDays: number; // Primary finish variance days
  severity: SlippageSeverity;
  slippageSummary: string;
  impactsCriticalPath: boolean;
}

export interface BaselineComparisonSummary {
  totalActivities: number;
  aheadCount: number;
  onTrackCount: number;
  minorSlippageCount: number;
  criticalSlippageCount: number;
  maxSlippageDays: number;
  averageSlippageDays: number;
  criticalPathSlippageDays: number;
  overallScheduleStatus: SlippageSeverity;
  activities: ActivitySlippageAnalysis[];
}

export interface DailyProgressRecord {
  id: string;
  date: string; // YYYY-MM-DD
  contractorId: ContractorId;
  zoneId: string;
  pierId: string;
  wbsId: string;
  activityId: string;
  plannedProgress: number; // Daily plan %
  actualProgress: number; // Daily actual %
  quantityPlan: number;
  quantityActual: number;
  unit: string;
  manpower: number;
  equipment: string;
  description: string;
  photoUrl?: string;
  remarks: string;
  createdAt: string;
}

export interface WeeklyProgressItem {
  id: string;
  weekNumber: number;
  period: string; // e.g. "01 Sep - 05 Sep 2025" (cutoff Friday)
  cutoffDate: string;
  contractorId: ContractorId | 'TOTAL';
  planProgress: number; // Cumulative or weekly
  actualProgress: number;
  deviation: number; // Actual - Plan
  spi: number; // Actual / Plan
  remainingWork: number; // 100 - Actual
}

export interface MonthlyProgressItem {
  id: string;
  monthIndex: number;
  monthName: string;
  cutoffDate: string; // 25th of month
  monthlyPlan: number;
  monthlyActual: number;
  monthlyDeviation: number;
  cumulativePlan: number;
  cumulativeActual: number;
  cumulativeDeviation: number;
  spi: number;
  remainingWork: number;
}

export type SCurveGranularity = 'daily' | 'weekly' | 'monthly';

export type SCurveBaselineVersion = 'ALL' | 'ORIGINAL' | 'ADD_1' | 'ADD_2' | 'ADD_3' | 'ADD_4';

export interface AddendumMilestone {
  version: 'ORIGINAL' | 'ADD_1' | 'ADD_2' | 'ADD_3' | 'ADD_4';
  title: string;
  shortName: string;
  addendumNumber: string;
  approvalDate: string;
  targetFinishDate: string;
  durationDays: number;
  extensionDays: number;
  reason: string;
  color: string;
  dashArray?: string;
}

export interface SCurveDataPoint {
  period: string; // Date or week or month label
  date: string;
  contractorId?: ContractorId;
  zoneId?: string;
  planned: number; // Active or current working planned (Addendum 4 by default)
  actual?: number;
  forecast?: number;

  // Specific baseline values for Contract Initial and Addendums
  plannedOriginal?: number;  // Rencana Kontrak Awal (Baseline 0)
  plannedAddendum1?: number; // Addendum 1
  plannedAddendum2?: number; // Addendum 2
  plannedAddendum3?: number; // Addendum 3
  plannedAddendum4?: number; // Addendum 4

  // Incremental (period delta)
  incrementalPlan?: number;
  incrementalActual?: number;
  spi?: number;
  variance?: number;
}

export interface ConstraintRecord {
  constraintId: string;
  zoneId: string;
  pierNumber: string;
  contractorId: ContractorId;
  category: ConstraintCategory;
  description: string;
  impact: string;
  pic: string;
  targetResolution: string;
  status: ConstraintStatus;
  dateIdentified: string;
  remarks?: string;
}

export interface IssueRecord {
  issueId: string;
  date: string;
  zoneId: string;
  pierNumber: string;
  contractorId: ContractorId;
  issue: string;
  rootCause: string;
  impact: string;
  action: string;
  pic: string;
  targetDate: string;
  status: IssueStatus;
}

export interface ActionTrackerRecord {
  actionId: string;
  meeting: string;
  date: string;
  action: string;
  pic: string;
  dueDate: string;
  status: ActionStatus;
  remarks?: string;
}

export interface MaterialRecord {
  id: string;
  material: string;
  contractorId: ContractorId;
  supplier: string;
  unit: string;
  requiredQuantity: number;
  availableStock: number;
  delivered: number;
  used: number;
  remaining: number;
  status: 'Aman' | 'Kritis' | 'Menipis';
}

export interface EquipmentRecord {
  id: string;
  equipment: string;
  contractorId: ContractorId;
  type: string;
  quantityPlan: number;
  quantityActual: number;
  availability: number; // %
  utilization: number; // %
  remarks: string;
}

export interface ManpowerRecord {
  id: string;
  contractorId: ContractorId;
  date: string;
  zoneId: string;
  pierNumber: string;
  position: string;
  plannedManpower: number;
  actualManpower: number;
}

export interface PhotoProgressRecord {
  id: string;
  date: string;
  zoneId: string;
  pierNumber: string;
  activity: string;
  contractorId: ContractorId;
  description: string;
  photoUrl: string;
}

export interface RecoveryPlanData {
  originalPlan: number;
  actualProgress: number;
  recoveryTarget: number;
  requiredWeeklyProgress: number;
  requiredMonthlyProgress: number;
  recoveryGap: number;
  chartPoints: {
    period: string;
    baseline: number;
    actual?: number;
    recovery: number;
  }[];
}

export interface GlobalFilterState {
  dateRange: string;
  contractorId: ContractorId | 'ALL';
  zoneId: string | 'ALL';
  pierId: string | 'ALL';
  wbsId: string | 'ALL';
  activityId: string | 'ALL';
  status: string | 'ALL';
}

// Aliases for component convenience
export type UserRole = RoleType;
export type ActionItem = ActionTrackerRecord;
export interface PhotoDocumentation {
  photoId: string;
  date: string;
  contractorId: ContractorId;
  zoneId: string;
  pierNumber: string;
  activityId?: string;
  activityName: string;
  description: string;
  photoUrl: string;
  type?: 'Before' | 'After' | 'Progress';
}

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'NOTICE';

export interface PMEAlert {
  id: string;
  activityId: string;
  activityName: string;
  wbsCode?: string;
  pierId?: string;
  contractorId: ContractorId;
  weight: number;
  plannedProgress: number; // in % (e.g. 100)
  actualProgress: number;  // in % (e.g. 35)
  variance: number;        // actual - planned (e.g. -65.0)
  thresholdBreached: number; // threshold value (e.g. -10)
  severity: AlertSeverity;
  isCriticalPath: boolean;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  recommendedAction: string;
  constraintReason?: string;
  detectedAt: string;
}

export interface PMEAlertSettings {
  enabled: boolean;
  criticalThreshold: number;      // e.g. 10 (triggers when variance <= -10%)
  warningThreshold: number;       // e.g. 5 (triggers when variance <= -5%)
  criticalPathStrict: boolean;    // e.g. true (strict threshold for critical path items: <= -2%)
  minWeightFilter: number;        // e.g. 0.05%
  soundEnabled: boolean;
  filterContractor: ContractorId | 'ALL';
}

// BOQ & Addendum Types
export type BOQDivisionId =
  | 'DIV-1'
  | 'DIV-2'
  | 'DIV-3'
  | 'DIV-7'
  | 'DIV-8'
  | 'DIV-9';

export interface BOQItem {
  id: string;
  itemNumber: string; // e.g. "1.1", "7.1.(1)"
  description: string;
  divisionId: BOQDivisionId;
  divisionName: string;
  unit: string; // e.g. "Ls", "m", "m3", "kg", "buah"
  contractorId: ContractorId;
  unitPrice: number; // IDR

  // Volumes
  volOriginal: number;    // Kontrak Awal (Baseline 0)
  volAddendum1: number;   // Addendum 1
  volAddendum2: number;   // Addendum 2
  volAddendum3: number;   // Addendum 3
  volAddendum4: number;   // Addendum 4 (Working Contract)

  // Installed / Claimed
  volActual: number;      // Realisasi Fisik Lapangan

  changeJustification?: string;
  wbsCodeRef?: string;
}

export interface BOQDivisionSummary {
  divisionId: BOQDivisionId;
  divisionName: string;
  valOriginal: number;
  valAddendum1: number;
  valAddendum2: number;
  valAddendum3: number;
  valAddendum4: number;
  valActual: number;
  weightOriginal: number; // %
  weightAddendum4: number; // %
  financialProgress: number; // %
}

export interface ContractAddendumMeta {
  version: 'ORIGINAL' | 'ADD_1' | 'ADD_2' | 'ADD_3' | 'ADD_4';
  code: string;
  title: string;
  contractNumber: string;
  date: string;
  effectiveDate: string;
  totalValue: number;
  deltaValue: number;
  deltaPercentage: number;
  durationDays: number;
  targetPHO: string;
  legalBasis: string;
  mainChanges: string[];
}

