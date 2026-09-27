import { PierMaster, PierBOQItem } from '../types';

/**
 * Generates tailored BOQ items for a specific pier based on its pier number,
 * structural type (Single Pier, Cantilever, Portal, Ramp), and actual construction progress.
 */
export function getPierBOQItems(pier: PierMaster): PierBOQItem[] {
  const isPortal =
    pier.pierNumber.includes('56') ||
    pier.pierNumber.includes('57') ||
    (pier.tipePier && pier.tipePier.toLowerCase().includes('portal'));

  const isPGNZone = pier.pierNumber === 'P.20.S' || pier.pierNumber === 'P20S';
  const isPAMZone = pier.pierNumber === 'P.28.S' || pier.pierNumber === 'P.29.S';
  const isRamp = pier.pierNumber.startsWith('RA') || pier.pierNumber.startsWith('RS') || pier.pierNumber.startsWith('RU');

  // Multipliers based on pier size / type
  const baseScale = isPortal ? 1.8 : isRamp ? 0.75 : 1.0;
  const progressRatio = (pier.overallProgress || 0) / 100;

  // 1. Bored Pile Pondasi
  const bpIsD1500 = isPortal || isPGNZone;
  const bpPlanVol = bpIsD1500 ? Math.round(280 * baseScale) : Math.round(240 * baseScale);
  // Shop drawing volume has slight variation due to actual boring log depth to hard rock
  const bpSDVol = Math.round(bpPlanVol * 1.02);
  // Bored pile progress (substructure done first)
  const bpProg = Math.min(1, progressRatio > 0.15 ? 1 : progressRatio * 6.5);
  const bpActVol = Math.round(bpSDVol * bpProg);

  // 2. Pile Cap Masif fc' 35 MPa
  const pcPlanVol = isPortal ? 320 : Math.round(165 * baseScale);
  const pcSDVol = Math.round(pcPlanVol * 1.015);
  const pcProg = Math.min(1, Math.max(0, (progressRatio - 0.15) * 3.5));
  const pcActVol = Math.round(pcSDVol * pcProg);

  // 3. Kolom Pier & Pier Head
  const colPlanVol = isPortal ? 185 : Math.round(92 * baseScale);
  const colSDVol = Math.round(colPlanVol * 1.01);
  const colProg = Math.min(1, Math.max(0, (progressRatio - 0.35) * 3.0));
  const colActVol = Math.round(colSDVol * colProg);

  // 4. Baja Tulangan Sirip Ulir BjTS 420B (Rebar D16 s/d D32)
  // ~210 kg rebar per m3 total concrete
  const totalConcreteVol = pcPlanVol + colPlanVol;
  const rebarPlanVol = Math.round(totalConcreteVol * 215);
  const rebarSDVol = Math.round(rebarPlanVol * 1.025); // detailing lap length & hooks
  const rebarProg = Math.min(1, Math.max(0, (progressRatio - 0.20) * 2.8));
  const rebarActVol = Math.round(rebarSDVol * rebarProg);

  // 5. Superstruktur: Box Girder (Precast Segmental atau Steel Box Girder untuk Portal)
  const bgPlanVol = isPortal ? 385000 : 1.0; // kg untuk steel box girder portal, 1.00 bentang untuk precast
  const bgSDVol = isPortal ? 392000 : 1.0;
  const bgProg = Math.min(1, Math.max(0, (progressRatio - 0.65) * 3.0));
  const bgActVol = isPortal ? Math.round(bgSDVol * bgProg) : Number((bgSDVol * bgProg).toFixed(2));

  // 6. Bantalan Karet Elastomer (LRB)
  const bearingPlanVol = isPortal ? 8 : 4;
  const bearingSDVol = bearingPlanVol;
  const bearingProg = progressRatio >= 0.85 ? 1 : 0;
  const bearingActVol = bearingSDVol * bearingProg;

  // Base list of BOQ items
  const items: PierBOQItem[] = [
    {
      itemNumber: bpIsD1500 ? '7.1.(2)' : '7.1.(1)',
      itemDescription: bpIsD1500
        ? 'Pondasi Tiang Bor Beton (Bored Pile) Dia. 1500mm'
        : 'Pondasi Tiang Bor Beton (Bored Pile) Dia. 1200mm',
      divisionId: 'DIV-7',
      unit: 'm',
      unitPrice: bpIsD1500 ? 6850000 : 4250000,
      volumePlan: bpPlanVol,
      volumeShopDrawing: bpSDVol,
      volumeActualBilled: bpActVol,
      verificationStatus:
        bpProg >= 1 ? 'Terverifikasi MC' : bpProg > 0 ? 'Pengajuan BAP' : 'Belum Dimulai',
      shopDrawingNo: `SD-HBR2-BP-${pier.pierNumber.replace('.', '')}`,
      mcBatchNo: bpProg >= 1 ? 'MC-18/HBR2/2025' : bpProg > 0 ? 'MC-19 (Draft)' : '-'
    },
    {
      itemNumber: '7.2.(1)',
      itemDescription: 'Beton Struktur Mutu Tinggi fc 35 MPa (Pile Cap Masif)',
      divisionId: 'DIV-7',
      unit: 'm3',
      unitPrice: 1950000,
      volumePlan: pcPlanVol,
      volumeShopDrawing: pcSDVol,
      volumeActualBilled: pcActVol,
      verificationStatus:
        pcProg >= 1 ? 'Terverifikasi MC' : pcProg > 0 ? 'Pengajuan BAP' : 'Belum Dimulai',
      shopDrawingNo: `SD-HBR2-PC-${pier.pierNumber.replace('.', '')}`,
      mcBatchNo: pcProg >= 1 ? 'MC-18/HBR2/2025' : pcProg > 0 ? 'MC-19 (Draft)' : '-'
    },
    {
      itemNumber: isPortal ? '7.2.(3)' : '7.2.(2)',
      itemDescription: isPortal
        ? 'Beton Mutu Khusus fc 50 MPa (Pier Portal Crossing Rel KAI)'
        : 'Beton Struktur Mutu Tinggi fc 45 MPa (Kolom Pier & Pier Head Cantilever)',
      divisionId: 'DIV-7',
      unit: 'm3',
      unitPrice: isPortal ? 3200000 : 2450000,
      volumePlan: colPlanVol,
      volumeShopDrawing: colSDVol,
      volumeActualBilled: colActVol,
      verificationStatus:
        colProg >= 1 ? 'Terverifikasi MC' : colProg > 0 ? 'Pengajuan BAP' : 'Belum Dimulai',
      shopDrawingNo: `SD-HBR2-COL-${pier.pierNumber.replace('.', '')}`,
      mcBatchNo: colProg >= 1 ? 'MC-18/HBR2/2025' : colProg > 0 ? 'MC-19 (Draft)' : '-'
    },
    {
      itemNumber: '7.3.(1)',
      itemDescription: 'Baja Tulangan Sirip Ulir Mutu BjTS 420B (Rebar D16 s/d D32)',
      divisionId: 'DIV-7',
      unit: 'kg',
      unitPrice: 17200,
      volumePlan: rebarPlanVol,
      volumeShopDrawing: rebarSDVol,
      volumeActualBilled: rebarActVol,
      verificationStatus:
        rebarProg >= 1 ? 'Terverifikasi MC' : rebarProg > 0 ? 'Pengajuan BAP' : 'Belum Dimulai',
      shopDrawingNo: `SD-HBR2-BAR-${pier.pierNumber.replace('.', '')}`,
      mcBatchNo: rebarProg >= 1 ? 'MC-18/HBR2/2025' : rebarProg > 0 ? 'MC-19 (Draft)' : '-'
    },
    {
      itemNumber: isPortal ? '7.4.(2)' : '7.4.(1)',
      itemDescription: isPortal
        ? 'Pengadaan & Fabrikasi Erection Steel Box Girder Bentang 68m (Crossing KA)'
        : 'Pengadaan & Erection Box Girder Precast Segmental Prestressed Bentang 40-50m',
      divisionId: 'DIV-7',
      unit: isPortal ? 'kg' : 'Bentang',
      unitPrice: isPortal ? 42000 : 7450000000,
      volumePlan: bgPlanVol,
      volumeShopDrawing: bgSDVol,
      volumeActualBilled: bgActVol,
      verificationStatus:
        bgProg >= 1 ? 'Terverifikasi MC' : bgProg > 0 ? 'Pengajuan BAP' : 'Belum Dimulai',
      shopDrawingNo: `SD-HBR2-BG-${pier.pierNumber.replace('.', '')}`,
      mcBatchNo: bgProg >= 1 ? 'MC-18/HBR2/2025' : bgProg > 0 ? 'MC-19 (Draft)' : '-'
    },
    {
      itemNumber: '7.5.(1)',
      itemDescription: isPortal
        ? 'Bantalan Karet Elastomer Lead Rubber Bearing (LRB) Kapasitas 800 Ton'
        : 'Bantalan Karet Elastomer Lead Rubber Bearing (LRB) Kapasitas 500 Ton',
      divisionId: 'DIV-7',
      unit: 'Buah',
      unitPrice: 85000000,
      volumePlan: bearingPlanVol,
      volumeShopDrawing: bearingSDVol,
      volumeActualBilled: bearingActVol,
      verificationStatus:
        bearingProg >= 1 ? 'Terverifikasi MC' : 'Belum Dimulai',
      shopDrawingNo: `SD-HBR2-LRB-${pier.pierNumber.replace('.', '')}`,
      mcBatchNo: bearingProg >= 1 ? 'MC-18/HBR2/2025' : '-'
    }
  ];

  // Additional CCO items if pier has special utility protection
  if (isPGNZone) {
    items.push({
      itemNumber: '9.1.(1)',
      itemDescription: 'Proteksi Steel Casing Pelindung Pipa Gas Transmisi PGN D16" (Addendum 3)',
      divisionId: 'DIV-9',
      unit: 'Ls',
      unitPrice: 42500000000,
      volumePlan: 1.0,
      volumeShopDrawing: 1.0,
      volumeActualBilled: 0.85,
      verificationStatus: 'Pengajuan BAP',
      shopDrawingNo: 'SD-HBR2-CCO-PGN-01',
      mcBatchNo: 'MC-19 (Draft Review)'
    });
  }

  if (isPAMZone) {
    items.push({
      itemNumber: '9.2.(2)',
      itemDescription: 'Relokasi Jalur Pipa Distribusi Air PAM Jaya D600mm Papanggo (Addendum 3)',
      divisionId: 'DIV-9',
      unit: 'm',
      unitPrice: 38500000,
      volumePlan: 65.0,
      volumeShopDrawing: 68.0,
      volumeActualBilled: 68.0,
      verificationStatus: 'Terverifikasi MC',
      shopDrawingNo: 'SD-HBR2-CCO-PAM-02',
      mcBatchNo: 'MC-18/HBR2/2025'
    });
  }

  return items;
}

/**
 * Quick computation of total financial metrics for a pier
 */
export function computePierBOQMetrics(pier: PierMaster) {
  const items = getPierBOQItems(pier);

  let totalPlanValue = 0;
  let totalSDValue = 0;
  let totalBilledValue = 0;

  items.forEach(item => {
    totalPlanValue += item.volumePlan * item.unitPrice;
    totalSDValue += item.volumeShopDrawing * item.unitPrice;
    totalBilledValue += item.volumeActualBilled * item.unitPrice;
  });

  const billedPercentage = totalSDValue > 0 ? (totalBilledValue / totalSDValue) * 100 : 0;
  const remainingValue = Math.max(0, totalSDValue - totalBilledValue);

  return {
    items,
    itemCount: items.length,
    totalPlanValue,
    totalSDValue,
    totalBilledValue,
    billedPercentage,
    remainingValue
  };
}
