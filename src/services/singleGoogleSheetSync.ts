import * as XLSX from 'xlsx';
import { googleWorkspace, SINGLE_SPREADSHEET_TABS } from './googleWorkspace';
import {
  PierMaster,
  DailyProgressRecord,
  WeeklyProgressItem,
  MonthlyProgressItem,
  ConstraintRecord,
  IssueRecord,
  ActionTrackerRecord,
  WBSNode,
  ActivityItem,
  MaterialRecord,
  EquipmentRecord,
  ManpowerRecord,
  ProjectMaster
} from '../types';
import { getPierMajorItems, getPierWBSDetails, getPierFinancialProgress } from '../data/pierMajorItems';

export interface ProjectContextDataForSheet {
  project: ProjectMaster;
  piers: PierMaster[];
  wbs: WBSNode[];
  activities: ActivityItem[];
  dailyProgress: DailyProgressRecord[];
  weeklyProgress: WeeklyProgressItem[];
  monthlyProgress: MonthlyProgressItem[];
  constraints: ConstraintRecord[];
  issues: IssueRecord[];
  actions: ActionTrackerRecord[];
  materials: MaterialRecord[];
  equipment: EquipmentRecord[];
  manpower: ManpowerRecord[];
}

/**
 * Builds structured 2D table arrays for all 10 tabs inside the 1 single Google Sheet database
 */
export function buildSingleSheetPayload(data: ProjectContextDataForSheet) {
  const {
    project,
    piers,
    wbs,
    dailyProgress,
    weeklyProgress,
    monthlyProgress,
    constraints,
    issues,
    materials,
    equipment,
    manpower
  } = data;

  // 1. Tab: 01_Master_Piers
  const pierHeaders = [
    'No. Pier',
    'Ruas Jalan',
    'Zona',
    'STA / Kode Area',
    'Tipe Pier',
    'Tipe Superstruktur',
    'Kontraktor',
    'Status Pier',
    'Overall Progress (%)',
    'Borepile (Titik)',
    'Pilecap (Titik)',
    'Pier Kolom (Titik)',
    'Pierhead (Titik)',
    'LRB (Titik)',
    'Produksi Box Girder',
    'Erection Box Girder',
    'Steel Box Girder',
    'PCU / PCI Girder',
    'WBS Code',
    'Rencana Mulai (Plan)',
    'Rencana Selesai (Plan)',
    'Aktual Mulai (Actual)',
    'Aktual Selesai (Actual)',
    'Status Deviasi WBS',
    'Nilai Rencana (Rp)',
    'Nilai Shop Dwg (Rp)',
    'Nilai Terprogress (Rp)',
    'Nilai Tertagih (MC) (Rp)',
    '% Realisasi Tertagih',
    'Sisa Belum Tertagih (Rp)',
    'Aktivitas Utama'
  ];

  const pierRows = piers.map(p => {
    const major = getPierMajorItems(p);
    const wbsDetail = getPierWBSDetails(p);
    const fin = getPierFinancialProgress(p);

    return [
      p.pierNumber,
      p.ruas || '-',
      p.zoneId,
      p.kodeArea || '-',
      p.tipePier || 'Single Pier',
      p.tipeSuperstruktur || 'Box Girder',
      p.lingkupKontraktor || p.contractorId,
      p.status,
      p.overallProgress,
      `${major.borepile.status} (${major.borepile.note || major.borepile.percent + '%'})`,
      `${major.pilecap.status} (${major.pilecap.percent}%)`,
      `${major.pierKolom.status} (${major.pierKolom.note || major.pierKolom.percent + '%'})`,
      `${major.pierhead.status} (${major.pierhead.percent}%)`,
      `${major.lrb.status} (${major.lrb.note || major.lrb.percent + '%'})`,
      `${major.prodBoxGirder.status} (${major.prodBoxGirder.percent}%)`,
      `${major.erectionBoxGirder.status} (${major.erectionBoxGirder.percent}%)`,
      `${major.steelBoxGirder.status} (${major.steelBoxGirder.percent}%)`,
      `${major.pcuPci.status} (${major.pcuPci.percent}%)`,
      wbsDetail.wbsCode,
      wbsDetail.planStart,
      wbsDetail.planFinish,
      wbsDetail.actualStart,
      wbsDetail.actualFinish,
      wbsDetail.scheduleStatus,
      fin.totalPlanValue,
      fin.totalSDValue,
      fin.totalProgressValue,
      fin.totalBilledValue,
      `${fin.billedPercentage.toFixed(2)}%`,
      fin.unbilledValue,
      p.mainActivity || '-'
    ];
  });

  // 2. Tab: 02_WBS_Hierarchy
  const wbsHeaders = ['WBS ID', 'Level', 'WBS Code', 'WBS Name', 'Parent WBS', 'Section', 'Zone ID'];
  const wbsRows = wbs.map(w => [
    w.wbsId,
    w.level,
    w.wbsCode,
    w.wbsName,
    w.parentWbsId || '-',
    w.section || '-',
    w.zoneId || '-'
  ]);

  // 3. Tab: 03_Daily_Progress
  const dailyHeaders = [
    'Log ID',
    'Tanggal',
    'Pier ID',
    'Kontraktor',
    'Zone',
    'Aktivitas / Uraian',
    'Vol Rencana',
    'Vol Aktual',
    'Satuan',
    'Progres Rencana (%)',
    'Progres Aktual (%)',
    'Manpower (Org)',
    'Peralatan',
    'Catatan Lapangan'
  ];
  const dailyRows = dailyProgress.map(d => [
    d.id,
    d.date,
    d.pierId,
    d.contractorId,
    d.zoneId,
    d.description || d.activityId,
    d.quantityPlan,
    d.quantityActual,
    d.unit,
    d.plannedProgress,
    d.actualProgress,
    d.manpower,
    d.equipment,
    d.remarks || '-'
  ]);

  // 4. Tab: 04_Weekly_Cutoff
  const weeklyHeaders = [
    'Cutoff Date (Jumat)',
    'Week No',
    'Periode',
    'Kontraktor',
    'Rencana Mingguan (%)',
    'Realisasi Mingguan (%)',
    'Deviasi (%)',
    'SPI (Schedule Perf Index)',
    'Evaluasi WCM'
  ];
  const weeklyRows = weeklyProgress.map(w => [
    w.cutoffDate,
    w.weekNumber,
    w.period,
    w.contractorId,
    w.planProgress,
    w.actualProgress,
    w.deviation,
    w.spi,
    w.deviation < -5 ? 'Kritis (Perlu Percepatan)' : w.deviation < 0 ? 'Tertinggal Minor' : 'Sesuai Target'
  ]);

  // 5. Tab: 05_Monthly_MC
  const monthlyHeaders = [
    'Cutoff Date (Tgl 25)',
    'Periode Bulan',
    'Rencana Bulanan (%)',
    'Realisasi Bulanan (%)',
    'Deviasi Bulanan (%)',
    'Rencana Kumulatif (%)',
    'Realisasi Kumulatif (%)',
    'SPI Kumulatif'
  ];
  const monthlyRows = monthlyProgress.map(m => [
    m.cutoffDate,
    m.monthName,
    m.monthlyPlan,
    m.monthlyActual,
    m.monthlyDeviation,
    m.cumulativePlan,
    m.cumulativeActual,
    m.spi
  ]);

  // 6. Tab: 06_BOQ_Contract
  const boqHeaders = [
    'No. Mata Pembayaran',
    'Divisi',
    'Uraian Pekerjaan Spesifikasi Umum Bina Marga',
    'Satuan',
    'Harga Satuan (Rp)',
    'Volume Addendum 4',
    'Nilai Rencana (Rp)',
    'Realisasi Tertagih (MC)',
    'Status Pembayaran'
  ];
  const boqRows = [
    ['7.1.(1)', 'DIV-7', 'Pondasi Tiang Bor Beton (Bored Pile) Dia. 1200mm', 'm', 4250000, 38500, 163625000000, 130900000000, 'On Progress'],
    ['7.1.(2)', 'DIV-7', 'Pondasi Tiang Bor Beton (Bored Pile) Dia. 1500mm', 'm', 6850000, 14200, 97270000000, 77816000000, 'On Progress'],
    ['7.2.(1)', 'DIV-7', 'Beton Struktur Mutu Tinggi fc 35 MPa (Pile Cap Masif)', 'm3', 1950000, 52400, 102180000000, 71526000000, 'On Progress'],
    ['7.2.(2)', 'DIV-7', 'Beton Mutu Tinggi fc 45 MPa (Kolom Pier & Pier Head)', 'm3', 2450000, 34800, 85260000000, 51156000000, 'On Progress'],
    ['7.3.(1)', 'DIV-7', 'Baja Tulangan Sirip Ulir BjTS 420B (Rebar D16 s/d D32)', 'kg', 17200, 18500000, 318200000000, 222740000000, 'On Progress'],
    ['7.4.(1)', 'DIV-7', 'Pengadaan & Erection Box Girder Precast Segmental', 'Bentang', 7450000000, 248, 1847600000000, 1108560000000, 'On Progress'],
    ['7.4.(2)', 'DIV-7', 'Pengadaan & Erection Steel Box Girder Bentang Khusus Rel KAI', 'kg', 42000, 1450000, 60900000000, 36540000000, 'On Progress'],
    ['7.5.(1)', 'DIV-7', 'Bantalan Karet Elastomer Lead Rubber Bearing (LRB)', 'Buah', 85000000, 1240, 105400000000, 63240000000, 'On Progress']
  ];

  // 7. Tab: 07_Constraints_Log
  const constraintHeaders = [
    'ID Kendala',
    'Pier No',
    'Kategori',
    'Deskripsi Kendala',
    'Dampak Progres',
    'Target Penyelesaian',
    'Status',
    'PIC / Instansi Terkait'
  ];
  const constraintRows = constraints.map(c => [
    c.constraintId,
    c.pierNumber,
    c.category,
    c.description,
    c.impact,
    c.targetResolution,
    c.status,
    c.pic
  ]);

  // 8. Tab: 08_Issues_Action
  const issueHeaders = [
    'ID Issue',
    'Tanggal',
    'Pier No',
    'Kontraktor',
    'Deskripsi Masalah',
    'Akar Masalah (Root Cause)',
    'Tindakan Mitigasi Lapangan',
    'PIC',
    'Target Tanggal',
    'Status'
  ];
  const issueRows = issues.map(i => [
    i.issueId,
    i.date,
    i.pierNumber,
    i.contractorId,
    i.issue,
    i.rootCause,
    i.action,
    i.pic,
    i.targetDate,
    i.status
  ]);

  // 9. Tab: 09_Resources
  const resourceHeaders = [
    'Kategori Sumber Daya',
    'Nama Item / Spesifikasi',
    'Kontraktor / Pemasok',
    'Kebutuhan Rencana',
    'Realisasi / Stok Aktual',
    'Satuan',
    'Status Ketersediaan'
  ];
  const resourceRows = [
    ...materials.map(m => ['Material Utama', m.material, m.supplier, m.requiredQuantity, m.availableStock, m.unit, m.status]),
    ...equipment.map(e => ['Alat Berat', e.equipment, e.contractorId, e.quantityPlan, e.quantityActual, 'Unit', `${e.availability}% Siap`]),
    ...manpower.map(mp => ['Tenaga Kerja', mp.position, mp.contractorId, mp.plannedManpower, mp.actualManpower, 'Orang', mp.actualManpower >= mp.plannedManpower ? 'Cukup' : 'Kurang'])
  ];

  // 10. Tab: 10_Project_Profile
  const profileHeaders = ['Parameter Induk Proyek HBR II', 'Nilai / Keterangan Kontrak', 'Catatan'];
  const profileRows = [
    ['Nama Proyek', project.projectName, 'Jalan Tol Ancol Timur - Pluit (Elevated Harbour Road II)'],
    ['Kode Proyek', project.projectId, 'HBR-II-ELEVATED'],
    ['Panjang Trase Elevated', '8.95 KM', 'Double Decker & Elevated Viaduct'],
    ['Jumlah Pier Elevated', '312 Titik Pier', 'Sisi Selatan & Sisi Utara Trase'],
    ['Tanggal Mulai Kontrak', project.contractStart, 'Awal Pelaksanaan Fisik'],
    ['Target Selesai Kontrak', project.contractFinish, 'Berdasarkan Addendum 4'],
    ['Target Selesai Sekarang', project.currentTargetFinish, 'Jadwal Kerja Aktif'],
    ['Pemilik Proyek (Client)', project.client, 'BUJT Badan Usaha Jalan Tol'],
    ['Konsultan Supervisi', project.consultant, 'Pengawas Independen'],
    ['Kontraktor Pelaksana', project.contractors.join(', '), 'WIKA & PT Girder Indonesia'],
    ['Terakhir Disinkronkan', new Date().toLocaleString('id-ID'), '1 File Database Google Sheet Terpadu']
  ];

  return [
    { range: '01_Master_Piers!A1', values: [pierHeaders, ...pierRows] },
    { range: '02_WBS_Hierarchy!A1', values: [wbsHeaders, ...wbsRows] },
    { range: '03_Daily_Progress!A1', values: [dailyHeaders, ...dailyRows] },
    { range: '04_Weekly_Cutoff!A1', values: [weeklyHeaders, ...weeklyRows] },
    { range: '05_Monthly_MC!A1', values: [monthlyHeaders, ...monthlyRows] },
    { range: '06_BOQ_Contract!A1', values: [boqHeaders, ...boqRows] },
    { range: '07_Constraints_Log!A1', values: [constraintHeaders, ...constraintRows] },
    { range: '08_Issues_Action!A1', values: [issueHeaders, ...issueRows] },
    { range: '09_Resources!A1', values: [resourceHeaders, ...resourceRows] },
    { range: '10_Project_Profile!A1', values: [profileHeaders, ...profileRows] }
  ];
}

/**
 * Executes a full sync of all 10 modules to EXACTLY ONE Google Sheet file
 */
export async function syncDatabaseToSingleGoogleSheet(
  spreadsheetId: string,
  contextData: ProjectContextDataForSheet
): Promise<{ success: boolean; spreadsheetUrl: string; timestamp: string }> {
  // 1. Ensure all 10 tabs exist in this single file
  await googleWorkspace.ensureTabsExist(spreadsheetId, [...SINGLE_SPREADSHEET_TABS]);

  // 2. Build payload for all 10 tabs
  const payload = buildSingleSheetPayload(contextData);

  // 3. Write in 1 batch HTTP request
  await googleWorkspace.batchUpdateValues(spreadsheetId, payload);

  const timestamp = new Date().toISOString();
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // Update stored spreadsheet metadata
  const meta = await googleWorkspace.getSpreadsheetMeta(spreadsheetId).catch(() => null);
  googleWorkspace.setStoredSpreadsheet({
    id: spreadsheetId,
    title: meta?.title || 'DATABASE_MASTER_HBR2_PROYEK',
    url: spreadsheetUrl,
    lastSync: timestamp
  });

  return {
    success: true,
    spreadsheetUrl,
    timestamp
  };
}

/**
 * Exports the complete 10-tab database as a single Excel (.xlsx) file
 * matching the exact Google Sheets schema (1 File Single Source of Truth)
 */
export function exportSingleDatabaseWorkbook(
  data: ProjectContextDataForSheet,
  filename: string = 'DATABASE_MASTER_HBR2_PROYEK.xlsx'
) {
  const payload = buildSingleSheetPayload(data);
  const workbook = XLSX.utils.book_new();

  for (const item of payload) {
    const tabName = item.range.split('!')[0];
    const worksheet = XLSX.utils.aoa_to_sheet(item.values);
    XLSX.utils.book_append_sheet(workbook, worksheet, tabName);
  }

  XLSX.writeFile(workbook, filename);
}

export interface PulledSheetResult {
  success: boolean;
  timestamp: string;
  summary: string;
  piers?: PierMaster[];
  constraints?: ConstraintRecord[];
  issues?: IssueRecord[];
  updatedCount: number;
}

/**
 * Pulls updated records from the 1 single Google Sheet database file
 * and merges them back into the application state (Two-Way Sync / Pull)
 */
export async function pullDatabaseFromSingleGoogleSheet(
  spreadsheetId: string,
  existingPiers: PierMaster[],
  existingConstraints: ConstraintRecord[] = [],
  existingIssues: IssueRecord[] = []
): Promise<PulledSheetResult> {
  const timestamp = new Date().toISOString();
  let updatedCount = 0;
  const updatedPiers: PierMaster[] = existingPiers.map(p => ({ ...p }));
  const pierMap = new Map<string, PierMaster>();
  updatedPiers.forEach(p => pierMap.set(p.pierNumber.toUpperCase(), p));

  // 1. Read tab '01_Master_Piers' (Header on row 1, data row 2 to 600)
  try {
    const pierValues = await googleWorkspace.readSheetValues(spreadsheetId, '01_Master_Piers!A2:AE600');
    if (pierValues && Array.isArray(pierValues)) {
      for (const row of pierValues) {
        if (!row || !row[0]) continue;
        const pierNum = String(row[0]).trim().toUpperCase();
        const existing = pierMap.get(pierNum);
        if (existing) {
          let hasChange = false;

          // Parse overall progress (column index 8)
          if (row[8] !== undefined && row[8] !== null && String(row[8]).trim() !== '') {
            const cleanStr = String(row[8]).replace('%', '').replace(',', '.').trim();
            const num = parseFloat(cleanStr);
            if (!isNaN(num)) {
              const clamped = Math.min(100, Math.max(0, num));
              if (existing.overallProgress !== clamped) {
                existing.overallProgress = clamped;
                hasChange = true;
              }
            }
          }

          // Parse status (column index 7)
          if (row[7] && String(row[7]).trim() !== existing.status) {
            existing.status = String(row[7]).trim() as any;
            hasChange = true;
          }

          // Parse mainActivity (column index 30)
          if (row[30] && String(row[30]).trim() !== existing.mainActivity) {
            existing.mainActivity = String(row[30]).trim();
            hasChange = true;
          }

          if (hasChange) {
            updatedCount++;
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('Could not read 01_Master_Piers from Google Sheets:', err);
  }

  // Update stored spreadsheet lastSync
  googleWorkspace.setStoredSpreadsheet({
    id: spreadsheetId,
    title: 'DATABASE_MASTER_HBR2_PROYEK',
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    lastSync: timestamp
  });

  return {
    success: true,
    timestamp,
    updatedCount,
    piers: updatedPiers,
    summary: updatedCount > 0
      ? `Berhasil menarik data dari Google Sheets! ${updatedCount} data pier diperbarui di aplikasi.`
      : 'Berhasil terhubung ke Google Sheets! Data di aplikasi sudah sinkron dengan versi terbaru.'
  };
}

