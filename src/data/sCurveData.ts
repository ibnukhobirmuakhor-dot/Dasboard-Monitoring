import { AddendumMilestone, SCurveDataPoint, ContractorId } from '../types';

export const addendumMilestones: AddendumMilestone[] = [
  {
    version: 'ORIGINAL',
    title: 'Rencana Kontrak Awal (Baseline 0)',
    shortName: 'Kontrak Awal',
    addendumNumber: 'KTR-01/HBR2/CMNP/V/2022',
    approvalDate: '2022-05-25',
    targetFinishDate: '2025-04-25',
    durationDays: 1065,
    extensionDays: 0,
    reason: 'Rencana kerja awal kontrak konstruksi Jalan Tol Harbour Road II (Elevated) PT Wijaya Karya (100%). Nilai Kontrak Rp 7,175 Triliun.',
    color: '#38bdf8', // Sky Blue
    dashArray: '4 4'
  },
  {
    version: 'ADD_1',
    title: 'Addendum 1 (Penyesuaian Akses & Termin Awal)',
    shortName: 'Addendum 1',
    addendumNumber: 'ADD-01/HBR2/CMNP/VI/2022',
    approvalDate: '2022-06-25',
    targetFinishDate: '2025-04-25',
    durationDays: 1065,
    extensionDays: 0,
    reason: 'Penataan tahapan akses kerja & clearing utilitas crossing Ancol Timur tanpa penambahan waktu kontrak.',
    color: '#a855f7', // Purple
    dashArray: '5 3'
  },
  {
    version: 'ADD_2',
    title: 'Addendum 2 (KSO PT WIKA 74.20% & PT Girder Indonesia 25.80%)',
    shortName: 'Addendum 2',
    addendumNumber: 'ADD-02/HBR2/CMNP/IX/2022',
    approvalDate: '2022-09-25',
    targetFinishDate: '2026-06-30',
    durationDays: 1497,
    extensionDays: 432,
    reason: 'Pembagian porsi kontraktor pelaksana: PT Wijaya Karya (74.20%) dan PT Girder Indonesia (25.80%). Nilai Kontrak Rp 6,768 Triliun.',
    color: '#06b6d4', // Cyan
    dashArray: '6 3'
  },
  {
    version: 'ADD_3',
    title: 'Addendum 3 (Penyesuaian Porsi 70:30 & Relokasi Pipa Gas PGN/PAM)',
    shortName: 'Addendum 3',
    addendumNumber: 'ADD-03/HBR2/CMNP/V/2024',
    approvalDate: '2024-05-25',
    targetFinishDate: '2027-02-28',
    durationDays: 1739,
    extensionDays: 243,
    reason: 'Dampak relokasi utilitas pipa gas PGN dan pipa PAM Jaya Papanggo serta perubahan porsi KSO WIKA 70% & GI 30%. Nilai Kontrak Rp 7,175 Triliun.',
    color: '#f97316', // Orange
    dashArray: '4 2'
  },
  {
    version: 'ADD_4',
    title: 'Addendum 4 (Working Baseline & Catch-Up Schedule PHO 2027)',
    shortName: 'Addendum 4 (Terkini)',
    addendumNumber: 'ADD-04/HBR2/CMNP/VIII/2025',
    approvalDate: '2025-08-15',
    targetFinishDate: '2027-03-31',
    durationDays: 1770,
    extensionDays: 31,
    reason: 'Penetapan target PHO 31 Maret 2027 dengan skema percepatan erection girder double crane dan bekisting pier portal.',
    color: '#3b82f6', // Solid Royal Blue
    dashArray: undefined
  }
];

// BULANAN: Mei 2022 s/d Maret 2027 (Cutoff tgl 25 tiap bulan) berdasarkan Data Riwayat Kontrak & Addendum HBR II
export const rawMonthlySCurve: SCurveDataPoint[] = [
  // 2022
  { period: 'Mei 22', date: '2022-05-25', plannedOriginal: 0.11, plannedAddendum2: 0.48, plannedAddendum3: 0.43, plannedAddendum4: 0.43, planned: 0.43, actual: 0.43, incrementalPlan: 0.43, incrementalActual: 0.43 },
  { period: 'Jun 22', date: '2022-06-25', plannedOriginal: 0.38, plannedAddendum2: 0.49, plannedAddendum3: 0.68, plannedAddendum4: 0.68, planned: 0.68, actual: 0.68, incrementalPlan: 0.25, incrementalActual: 0.25 },
  { period: 'Jul 22', date: '2022-07-25', plannedOriginal: 1.20, plannedAddendum2: 0.54, plannedAddendum3: 0.83, plannedAddendum4: 0.83, planned: 0.83, actual: 0.83, incrementalPlan: 0.15, incrementalActual: 0.15 },
  { period: 'Agu 22', date: '2022-08-25', plannedOriginal: 2.02, plannedAddendum2: 1.42, plannedAddendum3: 1.36, plannedAddendum4: 1.36, planned: 1.36, actual: 1.36, incrementalPlan: 0.53, incrementalActual: 0.53 },
  { period: 'Sep 22', date: '2022-09-25', plannedOriginal: 2.64, plannedAddendum1: 0.03, plannedAddendum2: 1.96, plannedAddendum3: 1.86, plannedAddendum4: 1.83, planned: 1.83, actual: 1.86, incrementalPlan: 0.47, incrementalActual: 0.50 },
  { period: 'Okt 22', date: '2022-10-25', plannedOriginal: 3.44, plannedAddendum1: 0.06, plannedAddendum2: 2.34, plannedAddendum3: 2.23, plannedAddendum4: 2.18, planned: 2.18, actual: 2.24, incrementalPlan: 0.35, incrementalActual: 0.38 },
  { period: 'Nov 22', date: '2022-11-25', plannedOriginal: 4.59, plannedAddendum1: 0.07, plannedAddendum2: 2.55, plannedAddendum3: 2.94, plannedAddendum4: 2.88, planned: 2.88, actual: 2.95, incrementalPlan: 0.70, incrementalActual: 0.71 },
  { period: 'Des 22', date: '2022-12-25', plannedOriginal: 5.60, plannedAddendum1: 0.15, plannedAddendum2: 3.20, plannedAddendum3: 3.97, plannedAddendum4: 3.83, planned: 3.83, actual: 4.00, incrementalPlan: 0.95, incrementalActual: 1.05 },
  // 2023
  { period: 'Jan 23', date: '2023-01-25', plannedOriginal: 6.67, plannedAddendum1: 0.42, plannedAddendum2: 4.35, plannedAddendum3: 4.78, plannedAddendum4: 4.36, planned: 4.36, actual: 4.87, incrementalPlan: 0.53, incrementalActual: 0.87 },
  { period: 'Feb 23', date: '2023-02-25', plannedOriginal: 8.13, plannedAddendum1: 0.78, plannedAddendum2: 5.63, plannedAddendum3: 5.50, plannedAddendum4: 4.72, planned: 4.72, actual: 5.67, incrementalPlan: 0.36, incrementalActual: 0.80 },
  { period: 'Mar 23', date: '2023-03-25', plannedOriginal: 9.57, plannedAddendum1: 1.03, plannedAddendum2: 7.17, plannedAddendum3: 5.95, plannedAddendum4: 4.92, planned: 4.92, actual: 6.18, incrementalPlan: 0.20, incrementalActual: 0.51 },
  { period: 'Apr 23', date: '2023-04-25', plannedOriginal: 11.56, plannedAddendum1: 1.21, plannedAddendum2: 9.16, plannedAddendum3: 6.39, plannedAddendum4: 5.18, planned: 5.18, actual: 6.67, incrementalPlan: 0.26, incrementalActual: 0.49 },
  { period: 'Mei 23', date: '2023-05-25', plannedOriginal: 13.96, plannedAddendum1: 1.34, plannedAddendum2: 11.59, plannedAddendum3: 6.80, plannedAddendum4: 5.46, planned: 5.46, actual: 7.11, incrementalPlan: 0.28, incrementalActual: 0.44 },
  { period: 'Jun 23', date: '2023-06-25', plannedOriginal: 16.26, plannedAddendum1: 1.43, plannedAddendum2: 14.27, plannedAddendum3: 7.07, plannedAddendum4: 5.64, planned: 5.64, actual: 7.41, incrementalPlan: 0.18, incrementalActual: 0.30 },
  { period: 'Jul 23', date: '2023-07-25', plannedOriginal: 19.16, plannedAddendum1: 1.51, plannedAddendum2: 17.19, plannedAddendum3: 7.39, plannedAddendum4: 5.88, planned: 5.88, actual: 7.75, incrementalPlan: 0.24, incrementalActual: 0.34 },
  { period: 'Agu 23', date: '2023-08-25', plannedOriginal: 23.01, plannedAddendum1: 1.85, plannedAddendum2: 20.41, plannedAddendum3: 8.17, plannedAddendum4: 6.33, planned: 6.33, actual: 8.62, incrementalPlan: 0.45, incrementalActual: 0.87 },
  { period: 'Sep 23', date: '2023-09-25', plannedOriginal: 27.30, plannedAddendum1: 1.99, plannedAddendum2: 23.55, plannedAddendum3: 8.65, plannedAddendum4: 6.67, planned: 6.67, actual: 9.13, incrementalPlan: 0.34, incrementalActual: 0.51 },
  { period: 'Okt 23', date: '2023-10-25', plannedOriginal: 31.43, plannedAddendum1: 2.31, plannedAddendum2: 27.35, plannedAddendum3: 9.21, plannedAddendum4: 6.92, planned: 6.92, actual: 9.77, incrementalPlan: 0.25, incrementalActual: 0.64 },
  { period: 'Nov 23', date: '2023-11-25', plannedOriginal: 36.43, plannedAddendum1: 2.47, plannedAddendum2: 31.58, plannedAddendum3: 9.62, plannedAddendum4: 7.17, planned: 7.17, actual: 10.22, incrementalPlan: 0.25, incrementalActual: 0.45 },
  { period: 'Des 23', date: '2023-12-25', plannedOriginal: 41.60, plannedAddendum1: 2.67, plannedAddendum2: 36.10, plannedAddendum3: 10.06, plannedAddendum4: 7.41, planned: 7.41, actual: 10.71, incrementalPlan: 0.24, incrementalActual: 0.49 },
  // 2024
  { period: 'Jan 24', date: '2024-01-25', plannedOriginal: 47.59, plannedAddendum1: 2.97, plannedAddendum2: 40.80, plannedAddendum3: 10.66, plannedAddendum4: 7.71, planned: 7.71, actual: 11.39, incrementalPlan: 0.30, incrementalActual: 0.68 },
  { period: 'Feb 24', date: '2024-02-25', plannedOriginal: 51.90, plannedAddendum1: 3.30, plannedAddendum2: 45.21, plannedAddendum3: 11.32, plannedAddendum4: 8.04, planned: 8.04, actual: 12.13, incrementalPlan: 0.33, incrementalActual: 0.74 },
  { period: 'Mar 24', date: '2024-03-25', plannedOriginal: 57.34, plannedAddendum1: 3.58, plannedAddendum2: 49.12, plannedAddendum3: 11.80, plannedAddendum4: 8.24, planned: 8.24, actual: 12.68, incrementalPlan: 0.20, incrementalActual: 0.55 },
  { period: 'Apr 24', date: '2024-04-25', plannedOriginal: 62.81, plannedAddendum1: 3.80, plannedAddendum2: 52.81, plannedAddendum3: 12.15, plannedAddendum4: 8.35, planned: 8.35, actual: 13.06, incrementalPlan: 0.11, incrementalActual: 0.38 },
  { period: 'Mei 24', date: '2024-05-25', plannedOriginal: 68.46, plannedAddendum1: 4.02, plannedAddendum2: 56.77, plannedAddendum3: 12.83, plannedAddendum4: 8.59, planned: 8.59, actual: 13.74, incrementalPlan: 0.24, incrementalActual: 0.68 },
  { period: 'Jun 24', date: '2024-06-25', plannedOriginal: 73.72, plannedAddendum1: 4.31, plannedAddendum2: 60.05, plannedAddendum3: 13.50, plannedAddendum4: 8.77, planned: 8.77, actual: 14.41, incrementalPlan: 0.18, incrementalActual: 0.67 },
  { period: 'Jul 24', date: '2024-07-25', plannedOriginal: 78.03, plannedAddendum1: 4.72, plannedAddendum2: 63.16, plannedAddendum3: 14.03, plannedAddendum4: 8.92, planned: 8.92, actual: 14.94, incrementalPlan: 0.15, incrementalActual: 0.53 },
  { period: 'Agu 24', date: '2024-08-25', plannedOriginal: 82.07, plannedAddendum1: 5.17, plannedAddendum2: 66.04, plannedAddendum3: 14.63, plannedAddendum4: 9.12, planned: 9.12, actual: 15.54, incrementalPlan: 0.20, incrementalActual: 0.60 },
  { period: 'Sep 24', date: '2024-09-25', plannedOriginal: 85.36, plannedAddendum1: 5.64, plannedAddendum2: 68.73, plannedAddendum3: 15.42, plannedAddendum4: 9.47, planned: 9.47, actual: 16.33, incrementalPlan: 0.35, incrementalActual: 0.79 },
  { period: 'Okt 24', date: '2024-10-25', plannedOriginal: 87.86, plannedAddendum1: 6.45, plannedAddendum2: 70.98, plannedAddendum3: 16.51, plannedAddendum4: 9.93, planned: 9.93, actual: 17.42, incrementalPlan: 0.46, incrementalActual: 1.09 },
  { period: 'Nov 24', date: '2024-11-25', plannedOriginal: 90.14, plannedAddendum1: 7.63, plannedAddendum2: 74.47, plannedAddendum3: 17.45, plannedAddendum4: 10.41, planned: 10.41, actual: 18.36, incrementalPlan: 0.48, incrementalActual: 0.94 },
  { period: 'Des 24', date: '2024-12-25', plannedOriginal: 92.57, plannedAddendum1: 9.12, plannedAddendum2: 78.69, plannedAddendum3: 18.19, plannedAddendum4: 10.90, planned: 10.90, actual: 19.11, incrementalPlan: 0.49, incrementalActual: 0.75 },
  // 2025
  { period: 'Jan 25', date: '2025-01-25', plannedOriginal: 95.02, plannedAddendum1: 12.58, plannedAddendum2: 82.78, plannedAddendum3: 19.47, plannedAddendum4: 11.50, planned: 11.50, actual: 20.39, incrementalPlan: 0.60, incrementalActual: 1.28 },
  { period: 'Feb 25', date: '2025-02-25', plannedOriginal: 97.22, plannedAddendum1: 16.38, plannedAddendum2: 87.71, plannedAddendum3: 21.06, plannedAddendum4: 12.37, planned: 12.37, actual: 21.98, incrementalPlan: 0.87, incrementalActual: 1.59 },
  { period: 'Mar 25', date: '2025-03-25', plannedOriginal: 99.04, plannedAddendum1: 20.31, plannedAddendum2: 92.70, plannedAddendum3: 22.33, plannedAddendum4: 13.04, planned: 13.04, actual: 23.26, incrementalPlan: 0.67, incrementalActual: 1.28 },
  { period: 'Apr 25', date: '2025-04-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 23.20, plannedAddendum4: 13.95, planned: 13.95, actual: 24.41, incrementalPlan: 0.91, incrementalActual: 1.15 },
  { period: 'Mei 25', date: '2025-05-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 24.35, plannedAddendum4: 15.20, planned: 15.20, actual: 25.61, incrementalPlan: 1.25, incrementalActual: 1.20 },
  { period: 'Jun 25', date: '2025-06-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 25.60, plannedAddendum4: 16.55, planned: 16.55, actual: 26.71, incrementalPlan: 1.35, incrementalActual: 1.10 },
  { period: 'Jul 25', date: '2025-07-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 26.90, plannedAddendum4: 17.95, planned: 17.95, actual: 27.76, incrementalPlan: 1.40, incrementalActual: 1.05 },
  { period: 'Agu 25', date: '2025-08-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 28.30, plannedAddendum4: 19.45, planned: 19.45, actual: 28.71, incrementalPlan: 1.50, incrementalActual: 0.95 },
  { period: 'Sep 25', date: '2025-09-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 29.80, plannedAddendum4: 21.05, planned: 21.05, actual: 29.61, forecast: 29.61, incrementalPlan: 1.60, incrementalActual: 0.90 },
  // Target Proyeksi Catch-Up Addendum 4 Menuju PHO 31 Maret 2027
  { period: 'Okt 25', date: '2025-10-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 31.35, plannedAddendum4: 24.85, planned: 24.85, forecast: 33.40, incrementalPlan: 3.80 },
  { period: 'Nov 25', date: '2025-11-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 32.95, plannedAddendum4: 29.05, planned: 29.05, forecast: 37.60, incrementalPlan: 4.20 },
  { period: 'Des 25', date: '2025-12-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 34.60, plannedAddendum4: 33.55, planned: 33.55, forecast: 42.10, incrementalPlan: 4.50 },
  { period: 'Jan 26', date: '2026-01-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 36.30, plannedAddendum4: 38.15, planned: 38.15, forecast: 46.70, incrementalPlan: 4.60 },
  { period: 'Feb 26', date: '2026-02-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 38.05, plannedAddendum4: 42.95, planned: 42.95, forecast: 51.50, incrementalPlan: 4.80 },
  { period: 'Mar 26', date: '2026-03-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 39.85, plannedAddendum4: 47.95, planned: 47.95, forecast: 56.50, incrementalPlan: 5.00 },
  { period: 'Apr 26', date: '2026-04-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 41.70, plannedAddendum4: 53.15, planned: 53.15, forecast: 61.70, incrementalPlan: 5.20 },
  { period: 'Mei 26', date: '2026-05-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 43.60, plannedAddendum4: 58.35, planned: 58.35, forecast: 66.90, incrementalPlan: 5.20 },
  { period: 'Jun 26', date: '2026-06-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 45.60, plannedAddendum4: 63.75, planned: 63.75, forecast: 72.30, incrementalPlan: 5.40 },
  { period: 'Jul 26', date: '2026-07-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 47.70, plannedAddendum4: 69.25, planned: 69.25, forecast: 77.80, incrementalPlan: 5.50 },
  { period: 'Agu 26', date: '2026-08-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 49.90, plannedAddendum4: 74.45, planned: 74.45, forecast: 83.00, incrementalPlan: 5.20 },
  { period: 'Sep 26', date: '2026-09-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 52.15, plannedAddendum4: 79.25, planned: 79.25, forecast: 87.80, incrementalPlan: 4.80 },
  { period: 'Okt 26', date: '2026-10-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 54.45, plannedAddendum4: 83.45, planned: 83.45, forecast: 92.00, incrementalPlan: 4.20 },
  { period: 'Nov 26', date: '2026-11-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 56.80, plannedAddendum4: 87.05, planned: 87.05, forecast: 95.60, incrementalPlan: 3.60 },
  { period: 'Des 26', date: '2026-12-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 59.20, plannedAddendum4: 90.05, planned: 90.05, forecast: 98.60, incrementalPlan: 3.00 },
  { period: 'Jan 27', date: '2027-01-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 61.65, plannedAddendum4: 92.25, planned: 92.25, forecast: 100.0, incrementalPlan: 2.20 },
  { period: 'Feb 27', date: '2027-02-25', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 64.15, plannedAddendum4: 93.75, planned: 93.75, forecast: 100.0, incrementalPlan: 1.50 },
  { period: 'Mar 27', date: '2027-03-31', plannedOriginal: 100.0, plannedAddendum1: 23.81, plannedAddendum2: 97.09, plannedAddendum3: 64.15, plannedAddendum4: 100.0, planned: 100.0, forecast: 100.0, incrementalPlan: 6.25 }
];

// MINGGUAN: Sampling detail dari Minggu 25 s/d Minggu 45 (fokus periode berjalan & forecast)
export const rawWeeklySCurve: SCurveDataPoint[] = [
  { period: 'Mgg 26', date: '2025-06-27', plannedOriginal: 87.5, plannedAddendum1: 86.2, plannedAddendum2: 84.5, plannedAddendum3: 82.0, plannedAddendum4: 80.2, planned: 80.2, actual: 72.1, incrementalPlan: 1.15, incrementalActual: 1.05 },
  { period: 'Mgg 27', date: '2025-07-04', plannedOriginal: 88.6, plannedAddendum1: 87.3, plannedAddendum2: 85.6, plannedAddendum3: 83.1, plannedAddendum4: 81.3, planned: 81.3, actual: 73.1, incrementalPlan: 1.10, incrementalActual: 1.00 },
  { period: 'Mgg 28', date: '2025-07-11', plannedOriginal: 89.6, plannedAddendum1: 88.4, plannedAddendum2: 86.7, plannedAddendum3: 84.2, plannedAddendum4: 82.4, planned: 82.4, actual: 74.0, incrementalPlan: 1.10, incrementalActual: 0.90 },
  { period: 'Mgg 29', date: '2025-07-18', plannedOriginal: 90.6, plannedAddendum1: 89.4, plannedAddendum2: 87.7, plannedAddendum3: 85.2, plannedAddendum4: 83.4, planned: 83.4, actual: 75.0, incrementalPlan: 1.00, incrementalActual: 1.00 },
  { period: 'Mgg 30', date: '2025-07-25', plannedOriginal: 91.5, plannedAddendum1: 90.4, plannedAddendum2: 88.7, plannedAddendum3: 86.1, plannedAddendum4: 84.4, planned: 84.4, actual: 75.9, incrementalPlan: 1.00, incrementalActual: 0.90 },
  { period: 'Mgg 31', date: '2025-08-01', plannedOriginal: 92.4, plannedAddendum1: 91.3, plannedAddendum2: 89.7, plannedAddendum3: 87.1, plannedAddendum4: 85.4, planned: 85.4, actual: 76.9, incrementalPlan: 1.00, incrementalActual: 1.00 },
  { period: 'Mgg 32', date: '2025-08-08', plannedOriginal: 93.2, plannedAddendum1: 92.2, plannedAddendum2: 90.7, plannedAddendum3: 88.0, plannedAddendum4: 86.4, planned: 86.4, actual: 77.9, incrementalPlan: 1.00, incrementalActual: 1.00 },
  { period: 'Mgg 33', date: '2025-08-15', plannedOriginal: 94.0, plannedAddendum1: 93.1, plannedAddendum2: 91.6, plannedAddendum3: 89.0, plannedAddendum4: 87.4, planned: 87.4, actual: 79.0, incrementalPlan: 1.00, incrementalActual: 1.10 },
  { period: 'Mgg 34', date: '2025-08-22', plannedOriginal: 94.7, plannedAddendum1: 93.9, plannedAddendum2: 92.5, plannedAddendum3: 89.9, plannedAddendum4: 88.3, planned: 88.3, actual: 80.0, incrementalPlan: 0.90, incrementalActual: 1.00 },
  { period: 'Mgg 35', date: '2025-08-29', plannedOriginal: 95.4, plannedAddendum1: 94.6, plannedAddendum2: 93.3, plannedAddendum3: 90.8, plannedAddendum4: 89.2, planned: 89.2, actual: 81.0, incrementalPlan: 0.90, incrementalActual: 1.00 },
  { period: 'Mgg 36', date: '2025-09-05', plannedOriginal: 96.1, plannedAddendum1: 95.3, plannedAddendum2: 94.1, plannedAddendum3: 91.7, plannedAddendum4: 90.1, planned: 90.1, actual: 81.8, incrementalPlan: 0.90, incrementalActual: 0.80 },
  { period: 'Mgg 37', date: '2025-09-12', plannedOriginal: 96.7, plannedAddendum1: 96.0, plannedAddendum2: 94.8, plannedAddendum3: 92.5, plannedAddendum4: 91.0, planned: 91.0, actual: 82.5, forecast: 82.5, incrementalPlan: 0.90, incrementalActual: 0.70 },
  // Proyeksi ke Depan
  { period: 'Mgg 38', date: '2025-09-19', plannedOriginal: 97.2, plannedAddendum1: 96.6, plannedAddendum2: 95.5, plannedAddendum3: 93.3, plannedAddendum4: 91.8, planned: 91.8, forecast: 83.4, incrementalPlan: 0.80 },
  { period: 'Mgg 39', date: '2025-09-26', plannedOriginal: 97.7, plannedAddendum1: 97.1, plannedAddendum2: 96.1, plannedAddendum3: 94.0, plannedAddendum4: 92.6, planned: 92.6, forecast: 84.4, incrementalPlan: 0.80 },
  { period: 'Mgg 40', date: '2025-10-03', plannedOriginal: 98.1, plannedAddendum1: 97.6, plannedAddendum2: 96.7, plannedAddendum3: 94.7, plannedAddendum4: 93.4, planned: 93.4, forecast: 85.5, incrementalPlan: 0.80 },
  { period: 'Mgg 41', date: '2025-10-10', plannedOriginal: 98.5, plannedAddendum1: 98.0, plannedAddendum2: 97.2, plannedAddendum3: 95.3, plannedAddendum4: 94.1, planned: 94.1, forecast: 86.7, incrementalPlan: 0.70 },
  { period: 'Mgg 42', date: '2025-10-17', plannedOriginal: 98.9, plannedAddendum1: 98.4, plannedAddendum2: 97.7, plannedAddendum3: 95.9, plannedAddendum4: 94.8, planned: 94.8, forecast: 87.9, incrementalPlan: 0.70 },
  { period: 'Mgg 43', date: '2025-10-24', plannedOriginal: 99.2, plannedAddendum1: 98.8, plannedAddendum2: 98.1, plannedAddendum3: 96.5, plannedAddendum4: 95.5, planned: 95.5, forecast: 89.2, incrementalPlan: 0.70 },
  { period: 'Mgg 44', date: '2025-10-31', plannedOriginal: 99.5, plannedAddendum1: 99.1, plannedAddendum2: 98.5, plannedAddendum3: 97.0, plannedAddendum4: 96.2, planned: 96.2, forecast: 90.5, incrementalPlan: 0.70 },
  { period: 'Mgg 45', date: '2025-11-07', plannedOriginal: 99.7, plannedAddendum1: 99.4, plannedAddendum2: 98.9, plannedAddendum3: 97.5, plannedAddendum4: 96.8, planned: 96.8, forecast: 91.8, incrementalPlan: 0.60 }
];

// HARIAN: 30 Hari terakhir menjelang & melewati Cutoff (Agustus s/d September 2025)
export const rawDailySCurve: SCurveDataPoint[] = [
  { period: '15 Agu', date: '2025-08-15', plannedOriginal: 94.00, plannedAddendum1: 93.10, plannedAddendum2: 91.60, plannedAddendum3: 89.00, plannedAddendum4: 87.40, planned: 87.40, actual: 79.02, incrementalPlan: 0.14, incrementalActual: 0.15 },
  { period: '16 Agu', date: '2025-08-16', plannedOriginal: 94.12, plannedAddendum1: 93.22, plannedAddendum2: 91.73, plannedAddendum3: 89.13, plannedAddendum4: 87.53, planned: 87.53, actual: 79.18, incrementalPlan: 0.13, incrementalActual: 0.16 },
  { period: '18 Agu', date: '2025-08-18', plannedOriginal: 94.34, plannedAddendum1: 93.45, plannedAddendum2: 91.98, plannedAddendum3: 89.38, plannedAddendum4: 87.78, planned: 87.78, actual: 79.44, incrementalPlan: 0.22, incrementalActual: 0.26 },
  { period: '19 Agu', date: '2025-08-19', plannedOriginal: 94.46, plannedAddendum1: 93.57, plannedAddendum2: 92.11, plannedAddendum3: 89.51, plannedAddendum4: 87.91, planned: 87.91, actual: 79.58, incrementalPlan: 0.12, incrementalActual: 0.14 },
  { period: '20 Agu', date: '2025-08-20', plannedOriginal: 94.57, plannedAddendum1: 93.69, plannedAddendum2: 92.24, plannedAddendum3: 89.64, plannedAddendum4: 88.04, planned: 88.04, actual: 79.72, incrementalPlan: 0.11, incrementalActual: 0.14 },
  { period: '21 Agu', date: '2025-08-21', plannedOriginal: 94.68, plannedAddendum1: 93.80, plannedAddendum2: 92.37, plannedAddendum3: 89.77, plannedAddendum4: 88.17, planned: 88.17, actual: 79.86, incrementalPlan: 0.11, incrementalActual: 0.14 },
  { period: '22 Agu', date: '2025-08-22', plannedOriginal: 94.79, plannedAddendum1: 93.91, plannedAddendum2: 92.50, plannedAddendum3: 89.90, plannedAddendum4: 88.30, planned: 88.30, actual: 80.00, incrementalPlan: 0.11, incrementalActual: 0.14 },
  { period: '23 Agu', date: '2025-08-23', plannedOriginal: 94.90, plannedAddendum1: 94.02, plannedAddendum2: 92.62, plannedAddendum3: 90.03, plannedAddendum4: 88.43, planned: 88.43, actual: 80.15, incrementalPlan: 0.11, incrementalActual: 0.15 },
  { period: '25 Agu', date: '2025-08-25', plannedOriginal: 95.10, plannedAddendum1: 94.23, plannedAddendum2: 92.85, plannedAddendum3: 90.28, plannedAddendum4: 88.68, planned: 88.68, actual: 80.42, incrementalPlan: 0.20, incrementalActual: 0.27 },
  { period: '26 Agu', date: '2025-08-26', plannedOriginal: 95.20, plannedAddendum1: 94.33, plannedAddendum2: 92.97, plannedAddendum3: 90.41, plannedAddendum4: 88.81, planned: 88.81, actual: 80.56, incrementalPlan: 0.10, incrementalActual: 0.14 },
  { period: '27 Agu', date: '2025-08-27', plannedOriginal: 95.30, plannedAddendum1: 94.44, plannedAddendum2: 93.09, plannedAddendum3: 90.54, plannedAddendum4: 88.94, planned: 88.94, actual: 80.71, incrementalPlan: 0.10, incrementalActual: 0.15 },
  { period: '28 Agu', date: '2025-08-28', plannedOriginal: 95.40, plannedAddendum1: 94.54, plannedAddendum2: 93.20, plannedAddendum3: 90.67, plannedAddendum4: 89.07, planned: 89.07, actual: 80.85, incrementalPlan: 0.10, incrementalActual: 0.14 },
  { period: '29 Agu', date: '2025-08-29', plannedOriginal: 95.50, plannedAddendum1: 94.65, plannedAddendum2: 93.32, plannedAddendum3: 90.80, plannedAddendum4: 89.20, planned: 89.20, actual: 81.00, incrementalPlan: 0.10, incrementalActual: 0.15 },
  { period: '30 Agu', date: '2025-08-30', plannedOriginal: 95.60, plannedAddendum1: 94.75, plannedAddendum2: 93.44, plannedAddendum3: 90.93, plannedAddendum4: 89.33, planned: 89.33, actual: 81.12, incrementalPlan: 0.10, incrementalActual: 0.12 },
  { period: '01 Sep', date: '2025-09-01', plannedOriginal: 95.80, plannedAddendum1: 94.95, plannedAddendum2: 93.68, plannedAddendum3: 91.19, plannedAddendum4: 89.59, planned: 89.59, actual: 81.35, incrementalPlan: 0.20, incrementalActual: 0.23 },
  { period: '02 Sep', date: '2025-09-02', plannedOriginal: 95.90, plannedAddendum1: 95.05, plannedAddendum2: 93.80, plannedAddendum3: 91.32, plannedAddendum4: 89.72, planned: 89.72, actual: 81.47, incrementalPlan: 0.10, incrementalActual: 0.12 },
  { period: '03 Sep', date: '2025-09-03', plannedOriginal: 96.00, plannedAddendum1: 95.15, plannedAddendum2: 93.92, plannedAddendum3: 91.45, plannedAddendum4: 89.85, planned: 89.85, actual: 81.58, incrementalPlan: 0.10, incrementalActual: 0.11 },
  { period: '04 Sep', date: '2025-09-04', plannedOriginal: 96.10, plannedAddendum1: 95.25, plannedAddendum2: 94.04, plannedAddendum3: 91.58, plannedAddendum4: 89.98, planned: 89.98, actual: 81.69, incrementalPlan: 0.10, incrementalActual: 0.11 },
  { period: '05 Sep', date: '2025-09-05', plannedOriginal: 96.20, plannedAddendum1: 95.35, plannedAddendum2: 94.16, plannedAddendum3: 91.71, plannedAddendum4: 90.11, planned: 90.11, actual: 81.80, incrementalPlan: 0.10, incrementalActual: 0.11 },
  { period: '06 Sep', date: '2025-09-06', plannedOriginal: 96.28, plannedAddendum1: 95.45, plannedAddendum2: 94.27, plannedAddendum3: 91.83, plannedAddendum4: 90.24, planned: 90.24, actual: 81.91, incrementalPlan: 0.08, incrementalActual: 0.11 },
  { period: '08 Sep', date: '2025-09-08', plannedOriginal: 96.44, plannedAddendum1: 95.65, plannedAddendum2: 94.49, plannedAddendum3: 92.07, plannedAddendum4: 90.50, planned: 90.50, actual: 82.10, incrementalPlan: 0.16, incrementalActual: 0.19 },
  { period: '09 Sep', date: '2025-09-09', plannedOriginal: 96.52, plannedAddendum1: 95.74, plannedAddendum2: 94.59, plannedAddendum3: 92.18, plannedAddendum4: 90.63, planned: 90.63, actual: 82.20, incrementalPlan: 0.08, incrementalActual: 0.10 },
  { period: '10 Sep', date: '2025-09-10', plannedOriginal: 96.60, plannedAddendum1: 95.83, plannedAddendum2: 94.70, plannedAddendum3: 92.30, plannedAddendum4: 90.75, planned: 90.75, actual: 82.31, incrementalPlan: 0.08, incrementalActual: 0.11 },
  { period: '11 Sep', date: '2025-09-11', plannedOriginal: 96.68, plannedAddendum1: 95.92, plannedAddendum2: 94.80, plannedAddendum3: 92.41, plannedAddendum4: 90.88, planned: 90.88, actual: 82.41, incrementalPlan: 0.08, incrementalActual: 0.10 },
  { period: '12 Sep', date: '2025-09-12', plannedOriginal: 96.76, plannedAddendum1: 96.01, plannedAddendum2: 94.90, plannedAddendum3: 92.52, plannedAddendum4: 91.00, planned: 91.00, actual: 82.50, forecast: 82.50, incrementalPlan: 0.08, incrementalActual: 0.09 },
  // Target Proyeksi Harian Mendatang
  { period: '13 Sep', date: '2025-09-13', plannedOriginal: 96.84, plannedAddendum1: 96.10, plannedAddendum2: 95.00, plannedAddendum3: 92.64, plannedAddendum4: 91.12, planned: 91.12, forecast: 82.63, incrementalPlan: 0.08 },
  { period: '15 Sep', date: '2025-09-15', plannedOriginal: 97.00, plannedAddendum1: 96.28, plannedAddendum2: 95.20, plannedAddendum3: 92.86, plannedAddendum4: 91.36, planned: 91.36, forecast: 82.88, incrementalPlan: 0.16 },
  { period: '16 Sep', date: '2025-09-16', plannedOriginal: 97.08, plannedAddendum1: 96.37, plannedAddendum2: 95.30, plannedAddendum3: 92.97, plannedAddendum4: 91.48, planned: 91.48, forecast: 83.01, incrementalPlan: 0.08 },
  { period: '17 Sep', date: '2025-09-17', plannedOriginal: 97.16, plannedAddendum1: 96.46, plannedAddendum2: 95.40, plannedAddendum3: 93.08, plannedAddendum4: 91.60, planned: 91.60, forecast: 83.15, incrementalPlan: 0.08 }
];

// Helper filter contractor & zona
export function filterSCurveData(
  dataset: SCurveDataPoint[],
  contractor: ContractorId | 'ALL',
  zoneId: string
): SCurveDataPoint[] {
  let factor = 1.0;
  if (contractor === 'WIKA') factor = 1.025; // WIKA slightly ahead in execution
  if (contractor === 'GI') factor = 0.945;   // GI facing bridge portal constraints

  return dataset.map(item => {
    const scale = (val?: number) => {
      if (val === undefined) return undefined;
      if (contractor === 'ALL') return val;
      return Math.min(100, Math.round(val * factor * 10) / 10);
    };

    const plannedOriginal = scale(item.plannedOriginal) ?? item.planned;
    const plannedAddendum1 = scale(item.plannedAddendum1) ?? item.planned;
    const plannedAddendum2 = scale(item.plannedAddendum2) ?? item.planned;
    const plannedAddendum3 = scale(item.plannedAddendum3) ?? item.planned;
    const plannedAddendum4 = scale(item.plannedAddendum4) ?? item.planned;
    const planned = scale(item.planned) ?? 0;
    const actual = scale(item.actual);
    const forecast = scale(item.forecast);

    const variance = actual !== undefined ? Math.round((actual - planned) * 10) / 10 : undefined;
    const spi = actual !== undefined && planned > 0 ? Math.round((actual / planned) * 1000) / 1000 : undefined;

    return {
      ...item,
      plannedOriginal,
      plannedAddendum1,
      plannedAddendum2,
      plannedAddendum3,
      plannedAddendum4,
      planned,
      actual,
      forecast,
      variance,
      spi
    };
  });
}
