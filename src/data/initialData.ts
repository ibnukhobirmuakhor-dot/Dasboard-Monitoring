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
  RecoveryPlanData
} from '../types';
import { allMasterPiers, extendedZones } from './allMasterPiers';

export const initialProject: ProjectMaster = {
  projectId: 'HARBOUR ROAD II',
  projectName: 'Proyek Jalan Tol Harbour Road II (Elevated)',
  contractStart: '2024-01-15',
  contractFinish: '2026-12-31',
  currentTargetFinish: '2027-03-31',
  client: 'PT Citra Marga Nusaphala Persada Tbk (CMNP)',
  consultant: 'PT Virama Karya - CEC Joint Venture',
  contractors: ['WIKA', 'GI']
};

import { comprehensiveWBS, comprehensiveActivities } from './wbsData';

export const initialZones: ZoneMaster[] = extendedZones;

export const initialPiers: PierMaster[] = allMasterPiers;

export const initialWBS: WBSNode[] = comprehensiveWBS;

export const initialActivities: ActivityItem[] = comprehensiveActivities;

export const initialDailyProgress: DailyProgressRecord[] = [
  {
    id: 'DLY-2025-09-15-01',
    date: '2025-09-15',
    contractorId: 'WIKA',
    zoneId: 'Z-1S',
    pierId: 'P18S',
    wbsId: 'WBS-6-REBAR',
    activityId: 'ACT-P18S-REBAR',
    plannedProgress: 2.5,
    actualProgress: 2.2,
    quantityPlan: 4.5,
    quantityActual: 4.1,
    unit: 'Ton',
    manpower: 18,
    equipment: 'Crawler Crane 50T, Bar Bender 32mm',
    description: 'Pemasangan pembesian rebar D32 layer 2 kolom pier P18S dan inspeksi QC bersama Konsultan Pengawas.',
    remarks: 'Cuaca cerah, inspeksi disetujui (RFI No. WIKA-QC-182).',
    createdAt: '2025-09-15T17:30:00Z'
  },
  {
    id: 'DLY-2025-09-15-02',
    date: '2025-09-15',
    contractorId: 'GI',
    zoneId: 'Z-2S',
    pierId: 'P57S',
    wbsId: 'WBS-3-P57S',
    activityId: 'ACT-P57S-COL',
    plannedProgress: 3.0,
    actualProgress: 2.8,
    quantityPlan: 45,
    quantityActual: 42,
    unit: 'm3',
    manpower: 22,
    equipment: 'Concrete Pump Truck, Mobile Crane 25T, Internal Vibrator (3 unit)',
    description: 'Pengecoran Pier Column tahap 1 segmen elevasi +8.500 s/d +14.000.',
    remarks: 'Slump test rata-rata 12±2 cm, pembuatan benda uji silinder 6 set.',
    createdAt: '2025-09-15T18:10:00Z'
  },
  {
    id: 'DLY-2025-09-14-01',
    date: '2025-09-14',
    contractorId: 'WIKA',
    zoneId: 'Z-1N',
    pierId: 'P34N',
    wbsId: 'WBS-3-P34N',
    activityId: 'ACT-P34N-HEAD',
    plannedProgress: 1.8,
    actualProgress: 1.5,
    quantityPlan: 6,
    quantityActual: 6,
    unit: 'Tendon',
    manpower: 12,
    equipment: 'Hydraulic Jack 500T, Grouting Machine',
    description: 'Stressing tendon longitudinal nomor T-03 dan T-04 pada pier head P34N.',
    remarks: 'Elongasi aktual memenuhi toleransi ±7% spesifikasi teknik.',
    createdAt: '2025-09-14T17:00:00Z'
  },
  {
    id: 'DLY-2025-09-13-01',
    date: '2025-09-13',
    contractorId: 'WIKA',
    zoneId: 'Z-1S',
    pierId: 'P19S',
    wbsId: 'WBS-4-STR-BAWAH',
    activityId: 'ACT-P18S-FORMWORK',
    plannedProgress: 2.0,
    actualProgress: 1.9,
    quantityPlan: 60,
    quantityActual: 58,
    unit: 'm2',
    manpower: 14,
    equipment: 'Mobile Crane 35T, Scaffolding Heavy Duty',
    description: 'Ereksi bekisting baja baja peri untuk sisi luar pile cap.',
    remarks: 'Safety briefing K3 mengenai bahaya bekerja di dekat galian.',
    createdAt: '2025-09-13T16:45:00Z'
  }
];

export const initialWeeklyProgress: WeeklyProgressItem[] = [
  // Cutoff Friday: 2025-08-22 (Week 34)
  {
    id: 'W-34-WIKA',
    weekNumber: 34,
    period: '18 Aug - 22 Aug 2025',
    cutoffDate: '2025-08-22',
    contractorId: 'WIKA',
    planProgress: 64.2,
    actualProgress: 61.8,
    deviation: -2.4,
    spi: 0.963,
    remainingWork: 38.2
  },
  {
    id: 'W-34-GI',
    weekNumber: 34,
    period: '18 Aug - 22 Aug 2025',
    cutoffDate: '2025-08-22',
    contractorId: 'GI',
    planProgress: 52.0,
    actualProgress: 46.5,
    deviation: -5.5,
    spi: 0.894,
    remainingWork: 53.5
  },
  {
    id: 'W-34-TOTAL',
    weekNumber: 34,
    period: '18 Aug - 22 Aug 2025',
    cutoffDate: '2025-08-22',
    contractorId: 'TOTAL',
    planProgress: 58.1,
    actualProgress: 54.15,
    deviation: -3.95,
    spi: 0.932,
    remainingWork: 45.85
  },
  // Week 35 (Cutoff: 2025-08-29)
  {
    id: 'W-35-WIKA',
    weekNumber: 35,
    period: '25 Aug - 29 Aug 2025',
    cutoffDate: '2025-08-29',
    contractorId: 'WIKA',
    planProgress: 66.0,
    actualProgress: 63.1,
    deviation: -2.9,
    spi: 0.956,
    remainingWork: 36.9
  },
  {
    id: 'W-35-GI',
    weekNumber: 35,
    period: '25 Aug - 29 Aug 2025',
    cutoffDate: '2025-08-29',
    contractorId: 'GI',
    planProgress: 54.5,
    actualProgress: 48.0,
    deviation: -6.5,
    spi: 0.881,
    remainingWork: 52.0
  },
  {
    id: 'W-35-TOTAL',
    weekNumber: 35,
    period: '25 Aug - 29 Aug 2025',
    cutoffDate: '2025-08-29',
    contractorId: 'TOTAL',
    planProgress: 60.25,
    actualProgress: 55.55,
    deviation: -4.7,
    spi: 0.922,
    remainingWork: 44.45
  },
  // Week 36 (Cutoff: 2025-09-05)
  {
    id: 'W-36-WIKA',
    weekNumber: 36,
    period: '01 Sep - 05 Sep 2025',
    cutoffDate: '2025-09-05',
    contractorId: 'WIKA',
    planProgress: 68.1,
    actualProgress: 65.0,
    deviation: -3.1,
    spi: 0.954,
    remainingWork: 35.0
  },
  {
    id: 'W-36-GI',
    weekNumber: 36,
    period: '01 Sep - 05 Sep 2025',
    cutoffDate: '2025-09-05',
    contractorId: 'GI',
    planProgress: 57.0,
    actualProgress: 49.8,
    deviation: -7.2,
    spi: 0.874,
    remainingWork: 50.2
  },
  {
    id: 'W-36-TOTAL',
    weekNumber: 36,
    period: '01 Sep - 05 Sep 2025',
    cutoffDate: '2025-09-05',
    contractorId: 'TOTAL',
    planProgress: 62.55,
    actualProgress: 57.4,
    deviation: -5.15,
    spi: 0.918,
    remainingWork: 42.6
  },
  // Week 37 (Cutoff: 2025-09-12 - latest)
  {
    id: 'W-37-WIKA',
    weekNumber: 37,
    period: '08 Sep - 12 Sep 2025',
    cutoffDate: '2025-09-12',
    contractorId: 'WIKA',
    planProgress: 70.3,
    actualProgress: 67.2,
    deviation: -3.1,
    spi: 0.956,
    remainingWork: 32.8
  },
  {
    id: 'W-37-GI',
    weekNumber: 37,
    period: '08 Sep - 12 Sep 2025',
    cutoffDate: '2025-09-12',
    contractorId: 'GI',
    planProgress: 59.8,
    actualProgress: 51.9,
    deviation: -7.9,
    spi: 0.868,
    remainingWork: 48.1
  },
  {
    id: 'W-37-TOTAL',
    weekNumber: 37,
    period: '08 Sep - 12 Sep 2025',
    cutoffDate: '2025-09-12',
    contractorId: 'TOTAL',
    planProgress: 65.05,
    actualProgress: 59.55,
    deviation: -5.50,
    spi: 0.915,
    remainingWork: 40.45
  }
];

export const initialMonthlyProgress: MonthlyProgressItem[] = [
  {
    id: 'M-2025-05',
    monthIndex: 5,
    monthName: 'Mei 2025',
    cutoffDate: '2025-05-25',
    monthlyPlan: 6.8,
    monthlyActual: 6.1,
    monthlyDeviation: -0.7,
    cumulativePlan: 42.5,
    cumulativeActual: 40.8,
    cumulativeDeviation: -1.7,
    spi: 0.960,
    remainingWork: 59.2
  },
  {
    id: 'M-2025-06',
    monthIndex: 6,
    monthName: 'Juni 2025',
    cutoffDate: '2025-06-25',
    monthlyPlan: 7.2,
    monthlyActual: 6.4,
    monthlyDeviation: -0.8,
    cumulativePlan: 49.7,
    cumulativeActual: 47.2,
    cumulativeDeviation: -2.5,
    spi: 0.950,
    remainingWork: 52.8
  },
  {
    id: 'M-2025-07',
    monthIndex: 7,
    monthName: 'Juli 2025',
    cutoffDate: '2025-07-25',
    monthlyPlan: 7.5,
    monthlyActual: 6.2,
    monthlyDeviation: -1.3,
    cumulativePlan: 57.2,
    cumulativeActual: 53.4,
    cumulativeDeviation: -3.8,
    spi: 0.934,
    remainingWork: 46.6
  },
  {
    id: 'M-2025-08',
    monthIndex: 8,
    monthName: 'Agustus 2025',
    cutoffDate: '2025-08-25',
    monthlyPlan: 7.0,
    monthlyActual: 5.6,
    monthlyDeviation: -1.4,
    cumulativePlan: 64.2,
    cumulativeActual: 59.0,
    cumulativeDeviation: -5.2,
    spi: 0.919,
    remainingWork: 41.0
  }
];

import { rawMonthlySCurve } from './sCurveData';

export const initialSCurve: SCurveDataPoint[] = rawMonthlySCurve;

export const initialConstraints: ConstraintRecord[] = [
  {
    constraintId: 'CST-001',
    zoneId: 'Z-1S',
    pierNumber: 'P20S',
    contractorId: 'WIKA',
    category: 'Utilitas',
    description: 'Interferensi pipa gas tekanan tinggi milik PGN diameter 16 inch di koordinat Bored Pile no. 3 & 4.',
    impact: 'Pekerjaan pengeboran dihentikan sementara, keterlambatan 3 minggu pada jalur kritis.',
    pic: 'Ir. Hendra (PME WIKA)',
    targetResolution: '2025-10-05',
    status: 'Open',
    dateIdentified: '2025-07-10',
    remarks: 'Telah dilakukan test pit & join survey bersama PGN dan Konsultan Pengawas.'
  },
  {
    constraintId: 'CST-002',
    zoneId: 'Z-2S',
    pierNumber: 'P56AS',
    contractorId: 'GI',
    category: 'Lahan',
    description: 'Lahan relokasi gudang eksisting warga belum selesai ganti untung oleh BPN/PPK Lahan.',
    impact: 'Manuver crawler crane dan rig bore pile belum dapat masuk ke lokasi.',
    pic: 'Bambang S. (PPK Pengadaan Tanah)',
    targetResolution: '2025-10-20',
    status: 'Open',
    dateIdentified: '2025-06-25',
    remarks: 'Musyawarah tahap II dijadwalkan akhir pekan ini di Kantor Kelurahan.'
  },
  {
    constraintId: 'CST-003',
    zoneId: 'Z-3S',
    pierNumber: 'P110S',
    contractorId: 'GI',
    category: 'Desain',
    description: 'Revisi gambar kerja (Shop Drawing) Pier Head portal akibat geometri jalan rel ganda di bawahnya.',
    impact: 'Pabrikasi bekisting khusus tertunda di workshop.',
    pic: 'Ahmad Fauzi (Lead Structure Consultant)',
    targetResolution: '2025-09-30',
    status: 'On Progress',
    dateIdentified: '2025-08-01',
    remarks: 'Draft revisi desain sudah diajukan ke Ditjen Bina Marga untuk approval.'
  },
  {
    constraintId: 'CST-004',
    zoneId: 'Z-2N',
    pierNumber: 'P178N',
    contractorId: 'GI',
    category: 'Perijinan',
    description: 'Izin Window Time kerja malam dari Balai Teknik Perkeretaapian (BTP) & KAI DAOP 1.',
    impact: 'Pengeboran malam dibatasi maksimal 3 jam per malam.',
    pic: 'Dedy Kurniawan (HSE & Permit GI)',
    targetResolution: '2025-09-25',
    status: 'On Progress',
    dateIdentified: '2025-08-15',
    remarks: 'Surat permohonan dispensasi jam kerja diajukan ke Dirjen Perkeretaapian.'
  },
  {
    constraintId: 'CST-005',
    zoneId: 'Z-1S',
    pierNumber: 'P18S',
    contractorId: 'WIKA',
    category: 'Material',
    description: 'Keterlambatan pengiriman rebar ulir D32 KS karena kuota rolling pabrik.',
    impact: 'Progress rebar sempat drop 5% dari target mingguan.',
    pic: 'Rian Pratama (Procurement WIKA)',
    targetResolution: '2025-08-28',
    status: 'Closed',
    dateIdentified: '2025-08-05',
    remarks: 'Material telah tiba 120 ton di stockyard Ancol Barat.'
  }
];

export const initialIssues: IssueRecord[] = [
  {
    issueId: 'ISS-001',
    date: '2025-08-18',
    zoneId: 'Z-1S',
    pierNumber: 'P20S',
    contractorId: 'WIKA',
    issue: 'Casing bore pile bengkok saat menabrak boulder batuan di kedalaman 18m.',
    rootCause: 'Data penyelidikan tanah boring log lama tidak mendeteksi lensa batuan keras.',
    impact: 'Pengeboran titik no. 2 tertunda 4 hari, perlu coring bit khusus.',
    action: 'Mobilisasi rotary rock roller bit dan penggantian segmen casing pipa 12mm.',
    pic: 'Surya (Geoteknik Engineer WIKA)',
    targetDate: '2025-08-25',
    status: 'Closed'
  },
  {
    issueId: 'ISS-002',
    date: '2025-09-02',
    zoneId: 'Z-2S',
    pierNumber: 'P57S',
    contractorId: 'GI',
    issue: 'Kerusakan pompa hydraulic crane saat penurunan tulangan sangkar rebar.',
    rootCause: 'Kebocoran seal silinder boom utama akibat beban siklis tinggi.',
    impact: 'Penurunan sangkar terhenti di elevasi -6m, risiko runtuhan dinding lubang.',
    action: 'Support darurat menggunakan mobile crane tandem 80T milik Subkon.',
    pic: 'Gatot (Equipment Manager GI)',
    targetDate: '2025-09-04',
    status: 'Closed'
  },
  {
    issueId: 'ISS-003',
    date: '2025-09-10',
    zoneId: 'Z-2N',
    pierNumber: 'P178N',
    contractorId: 'GI',
    issue: 'Limpasan air hujan menggenangi pit galian pile cap karena drainase kota tersumbat.',
    rootCause: 'Saluran inlet gorong-gorong Jl. Lodan tersumbat sedimentasi dan sampah.',
    impact: 'Pekerjaan lantai kerja ditunda, tanah dasar becek.',
    action: 'Pemasangan 3 unit pompa submersible 6 inch dan dewatering parit darurat.',
    pic: 'Kurniawan (Site Manager GI)',
    targetDate: '2025-09-18',
    status: 'On Progress'
  }
];

export const initialActions: ActionTrackerRecord[] = [
  {
    actionId: 'ACT-TRK-01',
    meeting: 'Weekly Progress Review #36 CMNP',
    date: '2025-09-08',
    action: 'Kontraktor WIKA & GI wajib menyerahkan Catch-up Plan revisi percepatan pengecoran Pier Head.',
    pic: 'Project Manager WIKA & GI',
    dueDate: '2025-09-15',
    status: 'Closed',
    remarks: 'Diserahkan dalam rapat koordinasi hari ini.'
  },
  {
    actionId: 'ACT-TRK-02',
    meeting: 'Site Coordination Meeting Utilitas PGN',
    date: '2025-09-11',
    action: 'Pembuatan box proteksi pelindung pipa gas baja di Pier P20S sebelum bor dilanjutkan.',
    pic: 'Hendra (WIKA) & Tim Teknis PGN',
    dueDate: '2025-09-22',
    status: 'On Progress',
    remarks: 'Material pelindung plat baja tebal 16mm sedang dipabrikasi.'
  },
  {
    actionId: 'ACT-TRK-03',
    meeting: 'Safety & Traffic Management Meeting Dishub DKI',
    date: '2025-09-12',
    action: 'Peremajaan rambu segitiga reflektif dan lampu rotary pada pagar seng batas proyek Zona 1.',
    pic: 'HSE Coordinator Konsorsium',
    dueDate: '2025-09-19',
    status: 'Open',
    remarks: 'Pengadaan 40 unit solar warning light sedang berjalan.'
  }
];

export const initialMaterials: MaterialRecord[] = [
  {
    id: 'MAT-01',
    material: 'Beton Ready-mix fc 45 MPa (Pier Head/Column)',
    contractorId: 'WIKA',
    supplier: 'PT WIKA Beton Tbk / Adhimix',
    unit: 'm3',
    requiredQuantity: 18500,
    availableStock: 2400,
    delivered: 9800,
    used: 9100,
    remaining: 8700,
    status: 'Aman'
  },
  {
    id: 'MAT-02',
    material: 'Baja Tulangan Ulir BJTS 420B D32',
    contractorId: 'WIKA',
    supplier: 'PT Krakatau Steel Tbk',
    unit: 'Ton',
    requiredQuantity: 3400,
    availableStock: 180,
    delivered: 2100,
    used: 1950,
    remaining: 1300,
    status: 'Menipis'
  },
  {
    id: 'MAT-03',
    material: 'PC Strand 12.7 mm 7-Wire Uncoated',
    contractorId: 'WIKA',
    supplier: 'PT VSL Indonesia',
    unit: 'Ton',
    requiredQuantity: 620,
    availableStock: 95,
    delivered: 380,
    used: 320,
    remaining: 240,
    status: 'Aman'
  },
  {
    id: 'MAT-04',
    material: 'Beton Ready-mix fc 35 MPa (Bored Pile & Pile Cap)',
    contractorId: 'GI',
    supplier: 'PT Pionirbeton Industri',
    unit: 'm3',
    requiredQuantity: 14200,
    availableStock: 650,
    delivered: 6800,
    used: 6600,
    remaining: 7400,
    status: 'Menipis'
  },
  {
    id: 'MAT-05',
    material: 'Elastomeric Bearing Pad 400x500x72mm',
    contractorId: 'GI',
    supplier: 'PT Karet Ngagel Surabaya',
    unit: 'Pcs',
    requiredQuantity: 320,
    availableStock: 15,
    delivered: 120,
    used: 110,
    remaining: 200,
    status: 'Kritis' // Shortage indicator triggered!
  }
];

export const initialEquipment: EquipmentRecord[] = [
  {
    id: 'EQ-01',
    equipment: 'Bauer BG 28 Rotary Drilling Rig',
    contractorId: 'WIKA',
    type: 'Boring Rig',
    quantityPlan: 4,
    quantityActual: 3,
    availability: 75,
    utilization: 88,
    remarks: '1 unit relokasi ke P21S setelah selesai overhaul gear box.'
  },
  {
    id: 'EQ-02',
    equipment: 'Crawler Crane Sumitomo SCX 1500 (150 Ton)',
    contractorId: 'WIKA',
    type: 'Heavy Crane',
    quantityPlan: 3,
    quantityActual: 3,
    availability: 100,
    utilization: 92,
    remarks: 'Kondisi operasional sangat prima untuk erection bekisting Pier Head.'
  },
  {
    id: 'EQ-03',
    equipment: 'Mobile Concrete Pump Truck 42m Boom',
    contractorId: 'GI',
    type: 'Concrete Pump',
    quantityPlan: 3,
    quantityActual: 2,
    availability: 66.7,
    utilization: 85,
    remarks: 'Perlu tambahan 1 unit standby untuk pengecoran masal Pile Cap P57S.'
  },
  {
    id: 'EQ-04',
    equipment: 'Launching Gantry Box Girder 900T',
    contractorId: 'WIKA',
    type: 'Erection Gantry',
    quantityPlan: 1,
    quantityActual: 1,
    availability: 100,
    utilization: 78,
    remarks: 'Perakitan di P16S-P17S selesai commissioning uji beban statis.'
  },
  {
    id: 'EQ-05',
    equipment: 'Genset Cummins 500 kVA Silent Type',
    contractorId: 'GI',
    type: 'Power Generator',
    quantityPlan: 5,
    quantityActual: 5,
    availability: 100,
    utilization: 95,
    remarks: 'Sumber daya listrik utama site proyek Zona 2.'
  }
];

export const initialManpower: ManpowerRecord[] = [
  { id: 'MP-01', contractorId: 'WIKA', date: '2025-09-15', zoneId: 'Z-1S', pierNumber: 'P18S', position: 'Tukang Besi (Rebar Fixer)', plannedManpower: 24, actualManpower: 22 },
  { id: 'MP-02', contractorId: 'WIKA', date: '2025-09-15', zoneId: 'Z-1S', pierNumber: 'P18S', position: 'Tukang Kayu & Bekisting', plannedManpower: 16, actualManpower: 15 },
  { id: 'MP-03', contractorId: 'WIKA', date: '2025-09-15', zoneId: 'Z-1S', pierNumber: 'P18S', position: 'Operator Alat Berat & Rigger', plannedManpower: 8, actualManpower: 8 },
  { id: 'MP-04', contractorId: 'WIKA', date: '2025-09-15', zoneId: 'Z-1S', pierNumber: 'P18S', position: 'Inspector QC & Safety K3', plannedManpower: 4, actualManpower: 4 },
  { id: 'MP-05', contractorId: 'GI', date: '2025-09-15', zoneId: 'Z-2S', pierNumber: 'P57S', position: 'Pekerja Pengecoran (Concreter)', plannedManpower: 20, actualManpower: 18 },
  { id: 'MP-06', contractorId: 'GI', date: '2025-09-15', zoneId: 'Z-2S', pierNumber: 'P57S', position: 'Tukang Besi (Rebar Fixer)', plannedManpower: 18, actualManpower: 16 },
  { id: 'MP-07', contractorId: 'GI', date: '2025-09-15', zoneId: 'Z-2S', pierNumber: 'P57S', position: 'Surveyor & Teknisi Lab', plannedManpower: 5, actualManpower: 5 }
];

export const initialPhotos: PhotoProgressRecord[] = [
  {
    id: 'PHT-01',
    date: '2025-09-15',
    zoneId: 'Z-1S',
    pierNumber: 'P18S',
    activity: 'Pemasangan Rebar Pier Column D32',
    contractorId: 'WIKA',
    description: 'Pemasangan sangkar rebar kolom silinder diameter 2200mm menggunakan crawler crane 50 ton.',
    photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1000&q=80'
  },
  {
    id: 'PHT-02',
    date: '2025-09-14',
    zoneId: 'Z-1N',
    pierNumber: 'P34N',
    activity: 'Post-Tensioning Pier Head',
    contractorId: 'WIKA',
    description: 'Inspeksi gaya dongkrak hidraulik 500 Ton pada ujung angkur strand tendon P34N.',
    photoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1000&q=80'
  },
  {
    id: 'PHT-03',
    date: '2025-09-12',
    zoneId: 'Z-1S',
    pierNumber: 'P16S',
    activity: 'Erection Box Girder Elevated Toll',
    contractorId: 'WIKA',
    description: 'Ereksi bentang segmental box girder menggunakan launching gantry bentang 45 meter.',
    photoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80'
  },
  {
    id: 'PHT-04',
    date: '2025-09-10',
    zoneId: 'Z-2S',
    pierNumber: 'P57S',
    activity: 'Pengecoran Beton Pier Column',
    contractorId: 'GI',
    description: 'Pengecoran beton ready-mix fc 45 MPa dengan bantuan concrete pump boom 42 meter.',
    photoUrl: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=1000&q=80'
  }
];

export const initialRecoveryPlan: RecoveryPlanData = {
  originalPlan: 65.05,
  actualProgress: 59.55,
  recoveryTarget: 78.50,
  requiredWeeklyProgress: 2.35, // % per week
  requiredMonthlyProgress: 9.40, // % per month
  recoveryGap: -5.50,
  chartPoints: [
    { period: 'Week 34', baseline: 58.10, actual: 54.15, recovery: 54.15 },
    { period: 'Week 35', baseline: 60.25, actual: 55.55, recovery: 55.55 },
    { period: 'Week 36', baseline: 62.55, actual: 57.40, recovery: 57.40 },
    { period: 'Week 37 (Now)', baseline: 65.05, actual: 59.55, recovery: 59.55 },
    { period: 'Week 38', baseline: 67.40, recovery: 62.10 },
    { period: 'Week 39', baseline: 69.80, recovery: 64.90 },
    { period: 'Week 40', baseline: 72.20, recovery: 67.90 },
    { period: 'Week 41', baseline: 74.50, recovery: 71.10 },
    { period: 'Week 42', baseline: 76.60, recovery: 74.60 },
    { period: 'Week 43', baseline: 78.50, recovery: 78.50 },
    { period: 'Week 44', baseline: 80.20, recovery: 80.20 }
  ]
};
