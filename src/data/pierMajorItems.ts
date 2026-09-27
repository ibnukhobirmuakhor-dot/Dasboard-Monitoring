import { PierMaster, PierMajorItemsData, MajorItemStatus, MajorItemPointProgress } from '../types';
import { computePierBOQMetrics } from './pierBOQData';

/**
 * Calculates progress of 9 Major Items for an individual Pier point (titik):
 * 1. Borepile (Pondasi Tiang Bor)
 * 2. Pilecap (Kepala Tiang Pondasi)
 * 3. Pier Kolom (Kolom Pier)
 * 4. Pierhead (Kepala Pier / Portal Crosshead)
 * 5. LRB (Lead Rubber Bearing)
 * 6. Produksi Box Girder (Fabrikasi di Casting Yard)
 * 7. Erection Box Girder (Pemasangan Girder Precast)
 * 8. Steel Box Girder (Fabrikasi & Erection Steel Box Girder khusus)
 * 9. PCU / PCI Girder (I-Girder Beton Prategang Ramp/Frontage)
 */
export function getPierMajorItems(pier: PierMaster): PierMajorItemsData {
  const p = pier.overallProgress || 0;
  const pierNo = pier.pierNumber || '';
  const tipePier = (pier.tipePier || '').toLowerCase();
  const tipeSuper = (pier.tipeSuperstruktur || '').toLowerCase();
  const section = pier.section || '';

  // Detect special pier types
  const isSteelBox =
    pierNo.includes('56') ||
    pierNo.includes('57') ||
    tipeSuper.includes('steel') ||
    tipeSuper.includes('sbg');

  const isPcuPci =
    tipeSuper.includes('pcu') ||
    tipeSuper.includes('pci') ||
    tipeSuper.includes('i-girder') ||
    (section === 'Ramp' && (pierNo.startsWith('RAO') || pierNo.startsWith('RAF'))) ||
    section === 'Frontage';

  const isBoxGirder = !isSteelBox && !isPcuPci;

  // 1. BOREPILE (Pondasi Tiang Bor)
  let borepile: MajorItemPointProgress;
  const totalPiles = pierNo.includes('56') || pierNo.includes('57') || tipePier.includes('portal') ? 12 : 8;
  if (p >= 25) {
    borepile = { status: 'Selesai', percent: 100, note: `${totalPiles}/${totalPiles} Titik Selesai` };
  } else if (p > 0) {
    const donePiles = Math.max(1, Math.min(totalPiles - 1, Math.round((p / 25) * totalPiles)));
    const pct = Math.round((donePiles / totalPiles) * 100);
    borepile = { status: 'Progress', percent: pct, note: `${donePiles}/${totalPiles} Titik Pengeboran` };
  } else {
    borepile = { status: 'Belum', percent: 0, note: `0/${totalPiles} Titik` };
  }

  // 2. PILECAP
  let pilecap: MajorItemPointProgress;
  if (p >= 45) {
    pilecap = { status: 'Selesai', percent: 100, note: '100% Pengecoran' };
  } else if (p >= 25) {
    const pct = Math.min(95, Math.round(((p - 25) / 20) * 100));
    pilecap = { status: 'Progress', percent: Math.max(20, pct), note: `${pct}% Pembesian & Cor` };
  } else {
    pilecap = { status: 'Belum', percent: 0, note: 'Belum Mulai' };
  }

  // 3. PIER KOLOM
  let pierKolom: MajorItemPointProgress;
  if (p >= 65) {
    pierKolom = { status: 'Selesai', percent: 100, note: 'Lift Selesai (100%)' };
  } else if (p >= 45) {
    const pct = Math.min(95, Math.round(((p - 45) / 20) * 100));
    const lift = pct >= 50 ? 'Lift 2/2' : 'Lift 1/2';
    pierKolom = { status: 'Progress', percent: Math.max(20, pct), note: `${lift} (${pct}%)` };
  } else {
    pierKolom = { status: 'Belum', percent: 0, note: 'Belum Mulai' };
  }

  // 4. PIERHEAD
  let pierhead: MajorItemPointProgress;
  if (p >= 80) {
    pierhead = { status: 'Selesai', percent: 100, note: 'Casting Selesai' };
  } else if (p >= 65) {
    const pct = Math.min(95, Math.round(((p - 65) / 15) * 100));
    pierhead = { status: 'Progress', percent: Math.max(20, pct), note: `Bekisting/Cor (${pct}%)` };
  } else {
    pierhead = { status: 'Belum', percent: 0, note: 'Belum Mulai' };
  }

  // 5. LRB (Lead Rubber Bearing)
  let lrb: MajorItemPointProgress;
  const lrbCount = tipePier.includes('portal') || isSteelBox ? 8 : 4;
  if (p >= 90) {
    lrb = { status: 'Selesai', percent: 100, note: `${lrbCount}/${lrbCount} Terpasang` };
  } else if (p >= 80) {
    const half = Math.round(lrbCount / 2);
    lrb = { status: 'Progress', percent: 50, note: `${half}/${lrbCount} Setting Elevasi` };
  } else {
    lrb = { status: 'Belum', percent: 0, note: `0/${lrbCount} Unit` };
  }

  // 6. PRODUKSI BOX GIRDER (Casting Yard)
  let prodBoxGirder: MajorItemPointProgress;
  if (!isBoxGirder) {
    prodBoxGirder = { status: 'N/A', percent: 0, note: 'N/A (Bukan Precast Box)' };
  } else if (p >= 70) {
    prodBoxGirder = { status: 'Selesai', percent: 100, note: 'Segment Terfabrikasi' };
  } else if (p >= 35) {
    const pct = Math.min(95, Math.round(((p - 35) / 35) * 100));
    prodBoxGirder = { status: 'Progress', percent: Math.max(25, pct), note: `Casting Yard (${pct}%)` };
  } else {
    prodBoxGirder = { status: 'Belum', percent: 0, note: 'Antrian Cetak' };
  }

  // 7. ERECTION BOX GIRDER
  let erectionBoxGirder: MajorItemPointProgress;
  if (!isBoxGirder) {
    erectionBoxGirder = { status: 'N/A', percent: 0, note: 'N/A' };
  } else if (p >= 100) {
    erectionBoxGirder = { status: 'Selesai', percent: 100, note: 'Erection & Stressing Selesai' };
  } else if (p >= 88) {
    const pct = Math.min(95, Math.round(((p - 88) / 12) * 100));
    erectionBoxGirder = { status: 'Progress', percent: Math.max(25, pct), note: `Launcher Gantry (${pct}%)` };
  } else {
    erectionBoxGirder = { status: 'Belum', percent: 0, note: 'Belum Erection' };
  }

  // 8. STEEL BOX GIRDER
  let steelBoxGirder: MajorItemPointProgress;
  if (!isSteelBox) {
    steelBoxGirder = { status: 'N/A', percent: 0, note: 'N/A (Bukan Steel Box)' };
  } else if (p >= 100) {
    steelBoxGirder = { status: 'Selesai', percent: 100, note: 'Erection & Baut HV Selesai' };
  } else if (p >= 60) {
    const pct = Math.min(95, Math.round(((p - 60) / 40) * 100));
    steelBoxGirder = { status: 'Progress', percent: Math.max(20, pct), note: `Fabrikasi & Erection (${pct}%)` };
  } else {
    steelBoxGirder = { status: 'Belum', percent: 0, note: 'Fabrikasi Bengkel' };
  }

  // 9. PCU / PCI GIRDER
  let pcuPci: MajorItemPointProgress;
  if (!isPcuPci) {
    pcuPci = { status: 'N/A', percent: 0, note: 'N/A (Bukan PCI/PCU)' };
  } else if (p >= 100) {
    pcuPci = { status: 'Selesai', percent: 100, note: 'Erection Selesai' };
  } else if (p >= 75) {
    const pct = Math.min(95, Math.round(((p - 75) / 25) * 100));
    pcuPci = { status: 'Progress', percent: Math.max(25, pct), note: `Erection Crane (${pct}%)` };
  } else {
    pcuPci = { status: 'Belum', percent: 0, note: 'Belum Erection' };
  }

  return {
    borepile,
    pilecap,
    pierKolom,
    pierhead,
    lrb,
    prodBoxGirder,
    erectionBoxGirder,
    steelBoxGirder,
    pcuPci
  };
}

/**
 * Calculates technical WBS schedule attributes for a pier
 */
export function getPierWBSDetails(pier: PierMaster) {
  // Plan Start calculation
  let planStart = pier.planStart;
  if (!planStart) {
    const pierNo = pier.pierNumber || '';
    const numMatch = pierNo.match(/\d+/);
    const num = numMatch ? parseInt(numMatch[0], 10) : 1;
    if (num <= 20) planStart = '2025-01-05';
    else if (num <= 50) planStart = '2025-03-01';
    else if (num <= 80) planStart = '2025-05-15';
    else if (num <= 120) planStart = '2025-08-01';
    else if (num <= 160) planStart = '2025-11-01';
    else planStart = '2026-01-15';
  }

  const planFinish = pier.plannedFinish || '2026-06-30';

  // Actual Start
  let actualStart = pier.actualStart;
  if (!actualStart && pier.overallProgress > 0) {
    actualStart = planStart; // Work commenced according to baseline or slight offset
  }

  // Actual Finish
  const actualFinish = pier.actualFinish || (pier.overallProgress >= 100 ? planFinish : undefined);

  // WBS Code
  let wbsCode = pier.wbsCode;
  if (!wbsCode) {
    const z = pier.zoneId || 'Z-1S';
    if (pier.overallProgress >= 85) wbsCode = `1.${z}.3 (Superstruktur)`;
    else if (pier.overallProgress >= 25) wbsCode = `1.${z}.2 (Substruktur)`;
    else wbsCode = `1.${z}.1 (Pondasi)`;
  }

  // Schedule status evaluation
  let scheduleStatus: 'Ahead' | 'On Track' | 'Delayed' | 'Critical';
  const progress = pier.overallProgress || 0;
  if (pier.status === 'Open') {
    scheduleStatus = 'Critical';
  } else if (progress >= 100) {
    scheduleStatus = 'Ahead';
  } else if (progress >= 50) {
    scheduleStatus = 'On Track';
  } else if (progress > 0 && progress < 30) {
    scheduleStatus = 'Delayed';
  } else {
    scheduleStatus = 'On Track';
  }

  return {
    planStart,
    planFinish,
    actualStart: actualStart || '-',
    actualFinish: actualFinish || '-',
    wbsCode,
    scheduleStatus
  };
}

/**
 * Calculates Volume & Financial information for a pier (Terprogress & Tertagih)
 */
export function getPierFinancialProgress(pier: PierMaster) {
  const metrics = computePierBOQMetrics(pier);
  const progressRatio = (pier.overallProgress || 0) / 100;

  // Approximate total volumes across key items
  let totalVolumePlan = 0;
  let totalVolumeSD = 0;
  let totalVolumeProgressed = 0;
  let totalVolumeBilled = 0;

  metrics.items.forEach(item => {
    totalVolumePlan += item.volumePlan;
    totalVolumeSD += item.volumeShopDrawing;
    // Volume physically completed based on pier progress
    const itemProgRatio = Math.min(1, Math.max(0, progressRatio * 1.05));
    const itemProgressedVol = item.volumeShopDrawing * itemProgRatio;
    totalVolumeProgressed += itemProgressedVol;
    totalVolumeBilled += item.volumeActualBilled;
  });

  const totalProgressValue = metrics.totalSDValue * progressRatio;
  const totalBilledValue = metrics.totalBilledValue;
  const unbilledValue = Math.max(0, totalProgressValue - totalBilledValue);

  return {
    metrics,
    totalPlanValue: metrics.totalPlanValue,
    totalSDValue: metrics.totalSDValue,
    totalProgressValue,
    totalBilledValue,
    unbilledValue,
    billedPercentage: metrics.billedPercentage,
    progressPercentage: pier.overallProgress,
    totalVolumePlan,
    totalVolumeSD,
    totalVolumeProgressed,
    totalVolumeBilled
  };
}

export interface MajorItemSummaryItem {
  id: string;
  name: string;
  code: string;
  totalPoints: number;
  completedPoints: number;
  inProgressPoints: number;
  notStartedPoints: number;
  percentage: number;
}

/**
 * Computes major item progress aggregated across all points (piers)
 */
export function computeMajorItemsSummary(piers: PierMaster[]): MajorItemSummaryItem[] {
  const itemsDef = [
    { id: 'borepile', name: 'Bored Pile D1200/D1500', code: 'BP' },
    { id: 'pilecap', name: 'Pile Cap Beton Masif', code: 'PC' },
    { id: 'pierKolom', name: 'Pier Kolom', code: 'COL' },
    { id: 'pierhead', name: 'Pier Head & Cantilever', code: 'PH' },
    { id: 'lrb', name: 'Lead Rubber Bearing (LRB)', code: 'LRB' },
    { id: 'prodBoxGirder', name: 'Produksi Box Girder', code: 'PRD-BG' },
    { id: 'erectionBoxGirder', name: 'Erection Box Girder', code: 'ERC-BG' },
    { id: 'steelBoxGirder', name: 'Steel Box Girder (Khusus)', code: 'SBG' },
    { id: 'pcuPci', name: 'PCI / PCU Girder (Ramp/Front)', code: 'PCI' }
  ];

  return itemsDef.map(def => {
    let totalApplicable = 0;
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;

    piers.forEach(p => {
      const major = getPierMajorItems(p);
      const item = (major as any)[def.id] as MajorItemPointProgress;
      if (!item || item.status === 'N/A') return;

      totalApplicable++;
      if (item.status === 'Selesai') completed++;
      else if (item.status === 'Progress') inProgress++;
      else notStarted++;
    });

    const percentage = totalApplicable > 0 ? (completed / totalApplicable) * 100 : 0;

    return {
      id: def.id,
      name: def.name,
      code: def.code,
      totalPoints: totalApplicable,
      completedPoints: completed,
      inProgressPoints: inProgress,
      notStartedPoints: notStarted,
      percentage
    };
  });
}
