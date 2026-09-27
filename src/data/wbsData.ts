import { WBSNode, ActivityItem } from '../types';

export const comprehensiveWBS: WBSNode[] = [
  // Level 1: Project
  {
    wbsId: 'WBS-1',
    level: 1,
    wbsCode: '1.0',
    wbsName: 'Proyek Jalan Tol Harbour Road II (Elevated) Ruas Ancol Timur - Pluit'
  },

  // Level 2: Trase Sections / Zones
  {
    wbsId: 'WBS-2-MA',
    level: 2,
    parentWbsId: 'WBS-1',
    wbsCode: '1.1',
    wbsName: 'Main Road Awal (P.1 ~ P.15)',
    section: 'Main Road Awal'
  },
  {
    wbsId: 'WBS-2-Z1S',
    level: 2,
    parentWbsId: 'WBS-1',
    wbsCode: '1.2',
    wbsName: 'Sisi Selatan Zona 1 (P.16.S ~ P.62.S)',
    section: 'Sisi Selatan',
    zoneId: 'Z-1S'
  },
  {
    wbsId: 'WBS-2-Z2S',
    level: 2,
    parentWbsId: 'WBS-1',
    wbsCode: '1.3',
    wbsName: 'Sisi Selatan Zona 2 (P.63.S ~ P.116.S)',
    section: 'Sisi Selatan',
    zoneId: 'Z-2S'
  },
  {
    wbsId: 'WBS-2-Z3S',
    level: 2,
    parentWbsId: 'WBS-1',
    wbsCode: '1.4',
    wbsName: 'Sisi Selatan Zona 3 (P.117.S ~ P.147.S)',
    section: 'Sisi Selatan',
    zoneId: 'Z-3S'
  },
  {
    wbsId: 'WBS-2-Z4S',
    level: 2,
    parentWbsId: 'WBS-1',
    wbsCode: '1.5',
    wbsName: 'Sisi Selatan Zona 4 (P.148.S ~ P.177.S)',
    section: 'Sisi Selatan',
    zoneId: 'Z-4S'
  },
  {
    wbsId: 'WBS-2-Z1N',
    level: 2,
    parentWbsId: 'WBS-1',
    wbsCode: '1.6',
    wbsName: 'Sisi Utara Zona 1 (P.21.N ~ P.68.N)',
    section: 'Sisi Utara',
    zoneId: 'Z-1N'
  },
  {
    wbsId: 'WBS-2-Z2N',
    level: 2,
    parentWbsId: 'WBS-1',
    wbsCode: '1.7',
    wbsName: 'Sisi Utara Zona 2 (P.69.N ~ P.122.N)',
    section: 'Sisi Utara',
    zoneId: 'Z-2N'
  },
  {
    wbsId: 'WBS-2-Z3N',
    level: 2,
    parentWbsId: 'WBS-1',
    wbsCode: '1.8',
    wbsName: 'Sisi Utara Zona 3 (P.123.N ~ P.152.N)',
    section: 'Sisi Utara',
    zoneId: 'Z-3N'
  },
  {
    wbsId: 'WBS-2-Z4N',
    level: 2,
    parentWbsId: 'WBS-1',
    wbsCode: '1.9',
    wbsName: 'Sisi Utara Zona 4 (P.153.N ~ P.182.N)',
    section: 'Sisi Utara',
    zoneId: 'Z-4N'
  },
  {
    wbsId: 'WBS-2-MAK',
    level: 2,
    parentWbsId: 'WBS-1',
    wbsCode: '1.10',
    wbsName: 'Main Road Akhir (P.178 ~ P.213)',
    section: 'Main Road Akhir',
    zoneId: 'Z-MAK'
  },
  {
    wbsId: 'WBS-2-RAMP',
    level: 2,
    parentWbsId: 'WBS-1',
    wbsCode: '1.11',
    wbsName: 'Ramp On / Off & Akses Simpang Susun',
    section: 'Ramp'
  },
  {
    wbsId: 'WBS-2-FRONT',
    level: 2,
    parentWbsId: 'WBS-1',
    wbsCode: '1.12',
    wbsName: 'Frontage Road & Jembatan Akses',
    section: 'Frontage'
  },

  // Level 3: Work Packages / Disciplines under Main Road Awal
  {
    wbsId: 'WBS-3-MA-SUB',
    level: 3,
    parentWbsId: 'WBS-2-MA',
    wbsCode: '1.1.1',
    wbsName: 'Pekerjaan Pondasi & Substruktur P.1 - P.15'
  },
  {
    wbsId: 'WBS-3-MA-SUP',
    level: 3,
    parentWbsId: 'WBS-2-MA',
    wbsCode: '1.1.2',
    wbsName: 'Pekerjaan Superstruktur Box Girder P.1 - P.15'
  },

  // Level 3: Disciplines under Sisi Selatan Zona 1
  {
    wbsId: 'WBS-3-Z1S-PREP',
    level: 3,
    parentWbsId: 'WBS-2-Z1S',
    wbsCode: '1.2.1',
    wbsName: 'Pekerjaan Persiapan, Utilitas & Traffic Management Zona 1S'
  },
  {
    wbsId: 'WBS-3-Z1S-FND',
    level: 3,
    parentWbsId: 'WBS-2-Z1S',
    wbsCode: '1.2.2',
    wbsName: 'Pekerjaan Pondasi Bored Pile & Pile Cap Zona 1S'
  },
  {
    wbsId: 'WBS-3-Z1S-SUB',
    level: 3,
    parentWbsId: 'WBS-2-Z1S',
    wbsCode: '1.2.3',
    wbsName: 'Pekerjaan Struktur Bawah (Pier Column & Pier Head) Zona 1S'
  },
  {
    wbsId: 'WBS-3-Z1S-SUP',
    level: 3,
    parentWbsId: 'WBS-2-Z1S',
    wbsCode: '1.2.4',
    wbsName: 'Pekerjaan Struktur Atas (Erection Double Box Girder) Zona 1S'
  },
  {
    wbsId: 'WBS-3-Z1S-FIN',
    level: 3,
    parentWbsId: 'WBS-2-Z1S',
    wbsCode: '1.2.5',
    wbsName: 'Pekerjaan Finishing Deck Slab, Barrier & Expansion Joint'
  },

  // Level 3: Disciplines under Sisi Selatan Zona 2
  {
    wbsId: 'WBS-3-Z2S-FND',
    level: 3,
    parentWbsId: 'WBS-2-Z2S',
    wbsCode: '1.3.1',
    wbsName: 'Pekerjaan Pondasi Bored Pile D1500 & Pile Cap Zona 2S'
  },
  {
    wbsId: 'WBS-3-Z2S-SUB',
    level: 3,
    parentWbsId: 'WBS-2-Z2S',
    wbsCode: '1.3.2',
    wbsName: 'Pekerjaan Kolom Pier & Pier Head Zona 2S'
  },
  {
    wbsId: 'WBS-3-Z2S-SUP',
    level: 3,
    parentWbsId: 'WBS-2-Z2S',
    wbsCode: '1.3.3',
    wbsName: 'Pekerjaan Superstruktur Double Box Girder Zona 2S'
  },

  // Level 3: Disciplines under Sisi Utara Zona 1 & 2
  {
    wbsId: 'WBS-3-Z1N-FND',
    level: 3,
    parentWbsId: 'WBS-2-Z1N',
    wbsCode: '1.6.1',
    wbsName: 'Pekerjaan Pondasi Bored Pile Zona 1N'
  },
  {
    wbsId: 'WBS-3-Z1N-SUB',
    level: 3,
    parentWbsId: 'WBS-2-Z1N',
    wbsCode: '1.6.2',
    wbsName: 'Pekerjaan Struktur Kolom & Portal Pier Zona 1N'
  },
  {
    wbsId: 'WBS-3-Z1N-SUP',
    level: 3,
    parentWbsId: 'WBS-2-Z1N',
    wbsCode: '1.6.3',
    wbsName: 'Pekerjaan Superstruktur Girder Zona 1N'
  },

  // Level 3: Ramp & Simpang Susun
  {
    wbsId: 'WBS-3-RAMP-RAO',
    level: 3,
    parentWbsId: 'WBS-2-RAMP',
    wbsCode: '1.11.1',
    wbsName: 'Ramp On Ancol Timur (RAO.1 ~ RAO.16)'
  },
  {
    wbsId: 'WBS-3-RAMP-RAF',
    level: 3,
    parentWbsId: 'WBS-2-RAMP',
    wbsCode: '1.11.2',
    wbsName: 'Ramp Off Ancol Timur (RAF.1 ~ RAF.18)'
  },
  {
    wbsId: 'WBS-3-RAMP-RSF',
    level: 3,
    parentWbsId: 'WBS-2-RAMP',
    wbsCode: '1.11.3',
    wbsName: 'Akses Main Road Selatan ke HBR 1 (RSF.1 ~ RSF.23)'
  },

  // Level 4 Sample Detailed Nodes for Pier Column
  {
    wbsId: 'WBS-4-P18S-COL',
    level: 4,
    parentWbsId: 'WBS-3-Z1S-SUB',
    wbsCode: '1.2.3.1',
    wbsName: 'Struktur Kolom Pier P.18.S'
  },
  {
    wbsId: 'WBS-5-P18S-REBAR',
    level: 5,
    parentWbsId: 'WBS-4-P18S-COL',
    wbsCode: '1.2.3.1.1',
    wbsName: 'Fabrikasi & Pembesian Kolom Pier P.18.S'
  },
  {
    wbsId: 'WBS-5-P18S-FORM',
    level: 5,
    parentWbsId: 'WBS-4-P18S-COL',
    wbsCode: '1.2.3.1.2',
    wbsName: 'Pemasangan Bekisting Kolom Pier P.18.S'
  },
  {
    wbsId: 'WBS-5-P18S-CAST',
    level: 5,
    parentWbsId: 'WBS-4-P18S-COL',
    wbsCode: '1.2.3.1.3',
    wbsName: 'Pengecoran Beton Kolom fc 45 MPa P.18.S'
  }
];

export const comprehensiveActivities: ActivityItem[] = [
  // --- MILESTONE 1: Project Kick-off ---
  {
    activityId: 'ACT-001',
    wbsId: 'WBS-1',
    wbsCode: '1.0.1',
    pierId: 'ALL',
    contractorId: 'WIKA',
    activityName: 'Surat Perintah Mulai Kerja (SPMK) & Mobilisasi Awal',
    duration: 1,
    weight: 0.10,
    startPlan: '2025-01-02',
    finishPlan: '2025-01-02',
    startActual: '2025-01-02',
    finishActual: '2025-01-02',
    progressPlan: 100,
    progressActual: 100,
    status: 'Completed',
    isMilestone: true,
    isCritical: true,
    predecessors: []
  },

  // --- Main Road Awal P.1 - P.15 (GI) ---
  {
    activityId: 'ACT-002',
    wbsId: 'WBS-3-MA-SUB',
    wbsCode: '1.1.1.1',
    pierId: 'P.1',
    contractorId: 'GI',
    activityName: 'Pengeboran Bored Pile D1200mm P.1 s/d P.5',
    duration: 45,
    weight: 0.75,
    startPlan: '2025-01-05',
    finishPlan: '2025-02-18',
    startActual: '2025-01-05',
    finishActual: '2025-02-15',
    progressPlan: 100,
    progressActual: 100,
    status: 'Completed',
    predecessors: [
      { predecessorId: 'ACT-001', type: 'FS', lagDays: 2 }
    ]
  },
  {
    activityId: 'ACT-003',
    wbsId: 'WBS-3-MA-SUB',
    wbsCode: '1.1.1.2',
    pierId: 'P.1',
    contractorId: 'GI',
    activityName: 'Konstruksi Pile Cap & Kolom Pier P.1 ~ P.5',
    duration: 50,
    weight: 0.85,
    startPlan: '2025-02-20',
    finishPlan: '2025-04-10',
    startActual: '2025-02-18',
    finishActual: '2025-04-05',
    progressPlan: 100,
    progressActual: 100,
    status: 'Completed',
    predecessors: [
      { predecessorId: 'ACT-002', type: 'FS', lagDays: 1 }
    ]
  },
  {
    activityId: 'ACT-004',
    wbsId: 'WBS-3-MA-SUP',
    wbsCode: '1.1.2.1',
    pierId: 'P.1',
    contractorId: 'GI',
    activityName: 'Erection Box Girder Bentang P.1 - P.5',
    duration: 40,
    weight: 1.10,
    startPlan: '2025-04-15',
    finishPlan: '2025-05-25',
    startActual: '2025-04-12',
    finishActual: '2025-05-20',
    progressPlan: 100,
    progressActual: 100,
    status: 'Completed',
    predecessors: [
      { predecessorId: 'ACT-003', type: 'FS', lagDays: 4 }
    ]
  },

  // --- Sisi Selatan Zona 1 (WIKA): P.16.S ~ P.20.S ---
  {
    activityId: 'ACT-005',
    wbsId: 'WBS-3-Z1S-PREP',
    wbsCode: '1.2.1.1',
    pierId: 'P.16.S',
    contractorId: 'WIKA',
    activityName: 'Traffic Diversion & Relokasi Utilitas Zona 1S (P.16.S - P.25.S)',
    duration: 30,
    weight: 0.40,
    startPlan: '2025-01-10',
    finishPlan: '2025-02-09',
    startActual: '2025-01-10',
    finishActual: '2025-02-08',
    progressPlan: 100,
    progressActual: 100,
    status: 'Completed',
    predecessors: [
      { predecessorId: 'ACT-001', type: 'FS', lagDays: 7 }
    ]
  },
  {
    activityId: 'ACT-006',
    wbsId: 'WBS-3-Z1S-FND',
    wbsCode: '1.2.2.1',
    pierId: 'P.16.S',
    contractorId: 'WIKA',
    activityName: 'Bored Pile D1500mm Pier P.16.S (8 titik)',
    duration: 25,
    weight: 0.65,
    startPlan: '2025-02-10',
    finishPlan: '2025-03-07',
    startActual: '2025-02-10',
    finishActual: '2025-03-05',
    progressPlan: 100,
    progressActual: 100,
    status: 'Completed',
    predecessors: [
      { predecessorId: 'ACT-005', type: 'FS', lagDays: 0 }
    ]
  },
  {
    activityId: 'ACT-007',
    wbsId: 'WBS-3-Z1S-FND',
    wbsCode: '1.2.2.2',
    pierId: 'P.16.S',
    contractorId: 'WIKA',
    activityName: 'Galian & Pembesian Pile Cap Pier P.16.S',
    duration: 20,
    weight: 0.50,
    startPlan: '2025-03-08',
    finishPlan: '2025-03-28',
    startActual: '2025-03-07',
    finishActual: '2025-03-25',
    progressPlan: 100,
    progressActual: 100,
    status: 'Completed',
    predecessors: [
      { predecessorId: 'ACT-006', type: 'FS', lagDays: 1 }
    ]
  },
  {
    activityId: 'ACT-008',
    wbsId: 'WBS-3-Z1S-SUB',
    wbsCode: '1.2.3.1',
    pierId: 'P.16.S',
    contractorId: 'WIKA',
    activityName: 'Pier Column & Pier Head P.16.S (Cantilever 2.00m)',
    duration: 35,
    weight: 0.80,
    startPlan: '2025-03-29',
    finishPlan: '2025-05-02',
    startActual: '2025-03-28',
    finishActual: '2025-05-01',
    progressPlan: 100,
    progressActual: 100,
    status: 'Completed',
    predecessors: [
      { predecessorId: 'ACT-007', type: 'FS', lagDays: 1 }
    ]
  },
  {
    activityId: 'ACT-009',
    wbsId: 'WBS-3-Z1S-SUP',
    wbsCode: '1.2.4.1',
    pierId: 'P.16.S',
    contractorId: 'WIKA',
    activityName: 'Box Girder Span Erection P.16.S - P.17.S',
    duration: 30,
    weight: 1.20,
    startPlan: '2025-05-05',
    finishPlan: '2025-06-04',
    startActual: '2025-05-04',
    finishActual: '2025-06-02',
    progressPlan: 100,
    progressActual: 100,
    status: 'Completed',
    predecessors: [
      { predecessorId: 'ACT-008', type: 'FS', lagDays: 2 }
    ]
  },

  // --- Pier P.18.S (Active Pier in Progress) ---
  {
    activityId: 'ACT-010',
    wbsId: 'WBS-3-Z1S-FND',
    wbsCode: '1.2.2.3',
    pierId: 'P.18.S',
    contractorId: 'WIKA',
    activityName: 'Bored Pile & Pile Cap P.18.S',
    duration: 30,
    weight: 0.70,
    baselineStart: '2025-05-15',
    baselineFinish: '2025-06-14',
    baselineDuration: 30,
    startPlan: '2025-05-15',
    finishPlan: '2025-06-14',
    startActual: '2025-05-16',
    finishActual: '2025-06-18',
    progressPlan: 100,
    progressActual: 100,
    status: 'Completed',
    predecessors: [
      { predecessorId: 'ACT-007', type: 'FS', lagDays: 14 }
    ]
  },
  {
    activityId: 'ACT-011',
    wbsId: 'WBS-5-P18S-REBAR',
    wbsCode: '1.2.3.1.1',
    pierId: 'P.18.S',
    contractorId: 'WIKA',
    activityName: 'Rebar Installation Pier Column P.18.S',
    duration: 25,
    weight: 0.55,
    baselineStart: '2025-06-15',
    baselineFinish: '2025-07-10',
    baselineDuration: 25,
    startPlan: '2025-06-20',
    finishPlan: '2025-07-15',
    startActual: '2025-06-22',
    progressPlan: 100,
    progressActual: 88,
    status: 'In Progress',
    isCritical: true,
    predecessors: [
      { predecessorId: 'ACT-010', type: 'FS', lagDays: 5 }
    ]
  },
  {
    activityId: 'ACT-012',
    wbsId: 'WBS-5-P18S-FORM',
    wbsCode: '1.2.3.1.2',
    pierId: 'P.18.S',
    contractorId: 'WIKA',
    activityName: 'Formwork Erection Pier Column P.18.S',
    duration: 20,
    weight: 0.40,
    baselineStart: '2025-07-01',
    baselineFinish: '2025-07-20',
    baselineDuration: 20,
    startPlan: '2025-07-05',
    finishPlan: '2025-07-25',
    startActual: '2025-07-08',
    progressPlan: 90,
    progressActual: 65,
    status: 'In Progress',
    isCritical: true,
    predecessors: [
      { predecessorId: 'ACT-011', type: 'SS', lagDays: 10 }
    ]
  },
  {
    activityId: 'ACT-013',
    wbsId: 'WBS-5-P18S-CAST',
    wbsCode: '1.2.3.1.3',
    pierId: 'P.18.S',
    contractorId: 'WIKA',
    activityName: 'Concreting Kolom Pier fc 45 MPa & Curing P.18.S',
    duration: 18,
    weight: 0.60,
    baselineStart: '2025-07-20',
    baselineFinish: '2025-08-07',
    baselineDuration: 18,
    startPlan: '2025-07-26',
    finishPlan: '2025-08-13',
    progressPlan: 60,
    progressActual: 30,
    status: 'In Progress',
    isCritical: true,
    predecessors: [
      { predecessorId: 'ACT-012', type: 'FS', lagDays: 1 }
    ]
  },
  {
    activityId: 'ACT-014',
    wbsId: 'WBS-3-Z1S-SUB',
    wbsCode: '1.2.3.2',
    pierId: 'P.18.S',
    contractorId: 'WIKA',
    activityName: 'Shoring & Pier Head Cantilever P.18.S',
    duration: 28,
    weight: 0.75,
    baselineStart: '2025-08-08',
    baselineFinish: '2025-09-05',
    baselineDuration: 28,
    startPlan: '2025-08-15',
    finishPlan: '2025-09-12',
    progressPlan: 30,
    progressActual: 10,
    status: 'In Progress',
    isCritical: true,
    predecessors: [
      { predecessorId: 'ACT-013', type: 'FS', lagDays: 2 }
    ]
  },

  // --- Pier P.20.S (Delayed Bored Pile) ---
  {
    activityId: 'ACT-015',
    wbsId: 'WBS-3-Z1S-FND',
    wbsCode: '1.2.2.4',
    pierId: 'P.20.S',
    contractorId: 'WIKA',
    activityName: 'Bored Pile D1500mm P.20.S (Kendala Utilitas Gas PGN)',
    duration: 45,
    weight: 0.90,
    baselineStart: '2025-04-15',
    baselineFinish: '2025-05-30',
    baselineDuration: 45,
    startPlan: '2025-05-01',
    finishPlan: '2025-06-15',
    startActual: '2025-05-12',
    progressPlan: 100,
    progressActual: 35,
    status: 'Delayed',
    isCritical: true,
    predecessors: [
      { predecessorId: 'ACT-006', type: 'FS', lagDays: 10 }
    ]
  },
  {
    activityId: 'ACT-016',
    wbsId: 'WBS-3-Z1S-FND',
    wbsCode: '1.2.2.5',
    pierId: 'P.20.S',
    contractorId: 'WIKA',
    activityName: 'Pile Cap & Kolom Pier P.20.S',
    duration: 35,
    weight: 0.85,
    baselineStart: '2025-06-01',
    baselineFinish: '2025-07-05',
    baselineDuration: 35,
    startPlan: '2025-06-18',
    finishPlan: '2025-07-23',
    progressPlan: 85,
    progressActual: 0,
    status: 'Delayed',
    isCritical: true,
    predecessors: [
      { predecessorId: 'ACT-015', type: 'FS', lagDays: 2 }
    ]
  },

  // --- Sisi Selatan Zona 2 (GI): P.56A.S & P.57.S ---
  {
    activityId: 'ACT-017',
    wbsId: 'WBS-3-Z2S-FND',
    wbsCode: '1.3.1.1',
    pierId: 'P.56A.S',
    contractorId: 'GI',
    activityName: 'Clearing & Akses Lahan Kerja Pier P.56A.S',
    duration: 35,
    weight: 0.35,
    baselineStart: '2025-05-10',
    baselineFinish: '2025-06-15',
    baselineDuration: 35,
    startPlan: '2025-06-01',
    finishPlan: '2025-07-06',
    startActual: '2025-06-15',
    progressPlan: 100,
    progressActual: 25,
    status: 'Delayed',
    predecessors: [
      { predecessorId: 'ACT-005', type: 'FS', lagDays: 30 }
    ]
  },
  {
    activityId: 'ACT-018',
    wbsId: 'WBS-3-Z2S-FND',
    wbsCode: '1.3.1.2',
    pierId: 'P.56A.S',
    contractorId: 'GI',
    activityName: 'Pengeboran Bored Pile P.56A.S (Tipe Portal)',
    duration: 30,
    weight: 0.70,
    baselineStart: '2025-06-20',
    baselineFinish: '2025-07-20',
    baselineDuration: 30,
    startPlan: '2025-07-10',
    finishPlan: '2025-08-09',
    progressPlan: 80,
    progressActual: 10,
    status: 'Delayed',
    predecessors: [
      { predecessorId: 'ACT-017', type: 'FS', lagDays: 2 }
    ]
  },
  {
    activityId: 'ACT-019',
    wbsId: 'WBS-3-Z2S-SUB',
    wbsCode: '1.3.2.1',
    pierId: 'P.57.S',
    contractorId: 'GI',
    activityName: 'Pier Column Formwork & Casting P.57.S',
    duration: 40,
    weight: 0.65,
    startPlan: '2025-07-15',
    finishPlan: '2025-08-24',
    startActual: '2025-07-20',
    progressPlan: 75,
    progressActual: 62,
    status: 'In Progress',
    predecessors: [
      { predecessorId: 'ACT-018', type: 'SS', lagDays: 5 }
    ]
  },
  {
    activityId: 'ACT-020',
    wbsId: 'WBS-3-Z2S-SUP',
    wbsCode: '1.3.3.1',
    pierId: 'P.57.S',
    contractorId: 'GI',
    activityName: 'Erection Double Box Girder Bentang P.57.S - P.58.S',
    duration: 30,
    weight: 1.15,
    startPlan: '2025-08-30',
    finishPlan: '2025-09-29',
    progressPlan: 25,
    progressActual: 0,
    status: 'Not Started',
    predecessors: [
      { predecessorId: 'ACT-019', type: 'FS', lagDays: 6 }
    ]
  },

  // --- Sisi Utara Zona 1 & 2 (WIKA) ---
  {
    activityId: 'ACT-021',
    wbsId: 'WBS-3-Z1N-FND',
    wbsCode: '1.6.1.1',
    pierId: 'P.21.N',
    contractorId: 'WIKA',
    activityName: 'Bored Pile & Pile Cap Pier P.21.N',
    duration: 32,
    weight: 0.65,
    startPlan: '2025-03-01',
    finishPlan: '2025-04-02',
    startActual: '2025-03-01',
    finishActual: '2025-04-01',
    progressPlan: 100,
    progressActual: 100,
    status: 'Completed',
    predecessors: [
      { predecessorId: 'ACT-005', type: 'SS', lagDays: 15 }
    ]
  },
  {
    activityId: 'ACT-022',
    wbsId: 'WBS-3-Z1N-SUB',
    wbsCode: '1.6.2.1',
    pierId: 'P.34.N',
    contractorId: 'WIKA',
    activityName: 'Pier Head Prestressing & Tensioning P.34.N',
    duration: 22,
    weight: 0.75,
    startPlan: '2025-07-01',
    finishPlan: '2025-07-23',
    startActual: '2025-07-03',
    finishActual: '2025-07-22',
    progressPlan: 100,
    progressActual: 100,
    status: 'Completed',
    predecessors: [
      { predecessorId: 'ACT-021', type: 'FS', lagDays: 30 }
    ]
  },
  {
    activityId: 'ACT-023',
    wbsId: 'WBS-3-Z1N-SUP',
    wbsCode: '1.6.3.1',
    pierId: 'P.34.N',
    contractorId: 'WIKA',
    activityName: 'Erection Box Girder Pier P.34.N - P.35.N',
    duration: 35,
    weight: 1.25,
    startPlan: '2025-07-25',
    finishPlan: '2025-08-29',
    startActual: '2025-07-26',
    progressPlan: 85,
    progressActual: 80,
    status: 'In Progress',
    predecessors: [
      { predecessorId: 'ACT-022', type: 'FS', lagDays: 2 }
    ]
  },

  // --- Ramp On / Off & Akses (WIKA & GI) ---
  {
    activityId: 'ACT-024',
    wbsId: 'WBS-3-RAMP-RAO',
    wbsCode: '1.11.1.1',
    pierId: 'RAO.1',
    contractorId: 'WIKA',
    activityName: 'Struktur Bawah Ramp On Ancol Timur RAO.1 ~ RAO.8',
    duration: 60,
    weight: 0.95,
    startPlan: '2025-04-01',
    finishPlan: '2025-05-31',
    startActual: '2025-04-05',
    finishActual: '2025-05-28',
    progressPlan: 100,
    progressActual: 100,
    status: 'Completed',
    predecessors: [
      { predecessorId: 'ACT-005', type: 'FS', lagDays: 20 }
    ]
  },
  {
    activityId: 'ACT-025',
    wbsId: 'WBS-3-RAMP-RAO',
    wbsCode: '1.11.1.2',
    pierId: 'RAO.1',
    contractorId: 'WIKA',
    activityName: 'Erection Girder Ramp On Ancol Timur RAO.1 ~ RAO.8',
    duration: 45,
    weight: 1.10,
    startPlan: '2025-06-05',
    finishPlan: '2025-07-20',
    startActual: '2025-06-08',
    finishActual: '2025-07-18',
    progressPlan: 100,
    progressActual: 100,
    status: 'Completed',
    predecessors: [
      { predecessorId: 'ACT-024', type: 'FS', lagDays: 5 }
    ]
  },
  {
    activityId: 'ACT-026',
    wbsId: 'WBS-3-RAMP-RSF',
    wbsCode: '1.11.3.1',
    pierId: 'RSF.1',
    contractorId: 'GI',
    activityName: 'Substructure Akses MR Selatan - HBR 1 (RSF.1 ~ RSF.10)',
    duration: 55,
    weight: 0.85,
    baselineStart: '2025-06-01',
    baselineFinish: '2025-07-25',
    baselineDuration: 55,
    startPlan: '2025-06-15',
    finishPlan: '2025-08-09',
    startActual: '2025-06-20',
    progressPlan: 90,
    progressActual: 60,
    status: 'In Progress',
    predecessors: [
      { predecessorId: 'ACT-024', type: 'SS', lagDays: 30 }
    ]
  },

  // --- Project Finishing & Deck Works ---
  {
    activityId: 'ACT-027',
    wbsId: 'WBS-3-Z1S-FIN',
    wbsCode: '1.2.5.1',
    pierId: 'P.16.S',
    contractorId: 'WIKA',
    activityName: 'Pengecoran Deck Slab & Parapet Barrier P.16.S - P.20.S',
    duration: 40,
    weight: 0.80,
    startPlan: '2025-08-15',
    finishPlan: '2025-09-24',
    progressPlan: 45,
    progressActual: 20,
    status: 'In Progress',
    isCritical: true,
    predecessors: [
      { predecessorId: 'ACT-009', type: 'FS', lagDays: 30 },
      { predecessorId: 'ACT-014', type: 'FF', lagDays: 10 }
    ]
  },
  {
    activityId: 'ACT-028',
    wbsId: 'WBS-3-Z1S-FIN',
    wbsCode: '1.2.5.2',
    pierId: 'P.16.S',
    contractorId: 'WIKA',
    activityName: 'Waterproofing, Expansion Joint & Aspal Wearing Course Zona 1S',
    duration: 35,
    weight: 0.70,
    startPlan: '2025-09-25',
    finishPlan: '2025-10-30',
    progressPlan: 0,
    progressActual: 0,
    status: 'Not Started',
    isCritical: true,
    predecessors: [
      { predecessorId: 'ACT-027', type: 'FS', lagDays: 1 }
    ]
  },

  // --- MILESTONE 2: Project Commissioning & Completion ---
  {
    activityId: 'ACT-029',
    wbsId: 'WBS-1',
    wbsCode: '1.0.99',
    pierId: 'ALL',
    contractorId: 'WIKA',
    activityName: 'Uji Beban Dinamis / Statis & Sertifikasi Laik Fungsi Jalan (SLF)',
    duration: 20,
    weight: 0.50,
    startPlan: '2026-05-01',
    finishPlan: '2026-05-21',
    progressPlan: 0,
    progressActual: 0,
    status: 'Not Started',
    isMilestone: true,
    isCritical: true,
    predecessors: [
      { predecessorId: 'ACT-028', type: 'FS', lagDays: 60 }
    ]
  },
  {
    activityId: 'ACT-030',
    wbsId: 'WBS-1',
    wbsCode: '1.0.100',
    pierId: 'ALL',
    contractorId: 'WIKA',
    activityName: 'Serah Terima Pertama (PHO) Proyek HBR II',
    duration: 1,
    weight: 0.05,
    startPlan: '2026-06-30',
    finishPlan: '2026-06-30',
    progressPlan: 0,
    progressActual: 0,
    status: 'Not Started',
    isMilestone: true,
    isCritical: true,
    predecessors: [
      { predecessorId: 'ACT-029', type: 'FS', lagDays: 40 }
    ]
  }
];
