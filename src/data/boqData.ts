import { BOQItem, ContractAddendumMeta, BOQDivisionSummary, ContractorId } from '../types';

export const contractAddendumList: ContractAddendumMeta[] = [
  {
    version: 'ORIGINAL',
    code: 'B0',
    title: 'Kontrak Awal (Original Contract Baseline)',
    contractNumber: 'KTR-01/HBR2/CMNP/I/2024',
    date: '15 Januari 2024',
    effectiveDate: '15 Januari 2024',
    totalValue: 4285000000000, // Rp 4,285 Triliun
    deltaValue: 0,
    deltaPercentage: 0,
    durationDays: 1082,
    targetPHO: '31 Desember 2026',
    legalBasis: 'Surat Perjanjian Pemborongan Pekerjaan Proyek Jalan Tol Harbour Road II No. 01/DIR-CMNP/2024',
    mainChanges: [
      'Penetapan lingkup awal struktur elevated tollway sepanjang 9.6 km (Ancol Timur - Pluit).',
      'Desain standar single pier kolom bundar cantilever.',
      'Alokasi paket kerja: Konsorsium PT Wijaya Karya (WIKA) & PT Girder Indonesia (GI).'
    ]
  },
  {
    version: 'ADD_1',
    code: 'ADD-1',
    title: 'Addendum 1: Penataan Akses Kerja & Relokasi Utilitas Ancol Timur',
    contractNumber: 'ADD-01/HBR2/CMNP/VI/2024',
    date: '20 Juni 2024',
    effectiveDate: '20 Juni 2024',
    totalValue: 4285000000000, // Rp 4,285 Triliun (CCO Nol Biaya)
    deltaValue: 0,
    deltaPercentage: 0,
    durationDays: 1082,
    targetPHO: '31 Desember 2026',
    legalBasis: 'Berita Acara Kesepakatan Bersama No. 12/BA-HBR2/VI/2024 & Approval Ditjen Bina Marga',
    mainChanges: [
      'Penataan ulang tahapan clearing dan manuver alat berat di Ramp On/Off Ancol Timur.',
      'Pergeseran volume (CCO nol rupiah) dari Divisi 8 ke penanganan akses kerja Divisi 1.',
      'Waktu pelaksanaan dan nilai total kontrak tetap.'
    ]
  },
  {
    version: 'ADD_2',
    code: 'ADD-2',
    title: 'Addendum 2: Redesain Struktur Portal P.56A & Window Time KAI',
    contractNumber: 'ADD-02/HBR2/CMNP/XI/2024',
    date: '25 November 2024',
    effectiveDate: '25 November 2024',
    totalValue: 4342500000000, // +Rp 57.5 Milyar
    deltaValue: 57500000000,
    deltaPercentage: 1.34,
    durationDays: 1097, // +15 hari
    targetPHO: '15 Januari 2027',
    legalBasis: 'Rekomendasi Teknis Balai Jembatan Khusus & Izin Balai Teknik Perkeretaapian KAI DAOP 1',
    mainChanges: [
      'Perubahan desain pier tunggal menjadi Tipe Portal Pier P.56A.S melangkahi rel ganda KA Tanjung Priok.',
      'Peningkatan mutu beton portal menjadi fc 50 MPa dan penambahan bentang khusus steel box girder.',
      'Penambahan biaya Rp 57,5 Miliar (+1,34%) dan kompensasi waktu +15 hari kerja malam.'
    ]
  },
  {
    version: 'ADD_3',
    code: 'ADD-3',
    title: 'Addendum 3: Pengamanan & Relokasi Pipa Gas PGN P.20.S & Air PAM Papanggo',
    contractNumber: 'ADD-03/HBR2/CMNP/V/2025',
    date: '30 Mei 2025',
    effectiveDate: '30 Mei 2025',
    totalValue: 4418000000000, // +Rp 75.5 Milyar
    deltaValue: 75500000000,
    deltaPercentage: 1.74,
    durationDays: 1141, // +44 hari tambahan
    targetPHO: '28 Februari 2027',
    legalBasis: 'MoU Tripartit PT CMNP - PT PGN Tbk - PAM Jaya & Penetapan PPK Pengadaan Tanah PUPR',
    mainChanges: [
      'Pekerjaan tambah Divisi 9: Pemasangan steel casing pelindung pipa transmisi gas PGN D16" di Pier P.20.S.',
      'Relokasi jalur pipa transmisi air baku PAM Jaya diameter 600mm di ruas Papanggo.',
      'Penambahan biaya Rp 75,5 Miliar (+1,74%) dan perpanjangan waktu kontrak.'
    ]
  },
  {
    version: 'ADD_4',
    code: 'ADD-4',
    title: 'Addendum 4: Working Baseline & Percepatan Erection Box Girder Terkini',
    contractNumber: 'ADD-04/HBR2/CMNP/VIII/2025',
    date: '15 Agustus 2025',
    effectiveDate: '15 Agustus 2025',
    totalValue: 4498000000000, // +Rp 80.0 Milyar
    deltaValue: 80000000000,
    deltaPercentage: 1.81,
    durationDays: 1172, // +31 hari tambahan (total +90 hari kalender)
    targetPHO: '31 Maret 2027',
    legalBasis: 'Amandemen Kontrak Addendum IV No. 04/AM-HBR2/VIII/2025 (Working Contract Resmi)',
    mainChanges: [
      'Mobilisasi tambahan 2 unit heavy crawler crane kapasitas 250 Ton untuk erection paralel.',
      'Penambahan bekisting climbing shoring ganda untuk mengejar keterlambatan pier portal.',
      'Penambahan biaya percepatan Rp 80,0 Miliar (+1,81%), total kenaikan kumulatif Rp 213 M (+4,97%).',
      'Target akhir Provisional Hand Over (PHO) ditetapkan definitif tanggal 31 Maret 2027.'
    ]
  }
];

export const initialBOQItems: BOQItem[] = [
  // ================= DIVISI 1: UMUM =================
  {
    id: 'BOQ-1.1',
    itemNumber: '1.1',
    description: 'Mobilisasi & Demobilisasi Alat Berat Utama (Bore Rig, Crane 250T, Launching Gantry)',
    divisionId: 'DIV-1',
    divisionName: 'Divisi 1: Umum & Fasilitas',
    unit: 'Ls',
    contractorId: 'WIKA-GI',
    unitPrice: 45000000000,
    volOriginal: 1.0,
    volAddendum1: 1.0,
    volAddendum2: 1.0,
    volAddendum3: 1.0,
    volAddendum4: 1.25, // Penambahan crawler crane percepatan Add. 4
    volActual: 1.15,
    changeJustification: 'Add. 4: Mobilisasi tambahan 2 unit crawler crane 250T dan heavy lifting gear untuk akselerasi erection girder malam hari.',
    wbsCodeRef: 'WBS-01.01'
  },
  {
    id: 'BOQ-1.2',
    itemNumber: '1.2',
    description: 'Manajemen & Keselamatan Lalu Lintas Kerja Jalan Arteri (Traffic Management RE Martadinata)',
    divisionId: 'DIV-1',
    divisionName: 'Divisi 1: Umum & Fasilitas',
    unit: 'Bulan',
    contractorId: 'WIKA',
    unitPrice: 950000000,
    volOriginal: 36.0,
    volAddendum1: 36.0,
    volAddendum2: 36.5,
    volAddendum3: 38.0,
    volAddendum4: 39.0, // Perpanjangan durasi kontrak menjadi 39 bulan
    volActual: 32.0,
    changeJustification: 'Penyesuaian volume durasi traffic control mengikuti penambahan waktu kontrak Addendum 2, 3, dan 4.',
    wbsCodeRef: 'WBS-01.01.02'
  },
  {
    id: 'BOQ-1.3',
    itemNumber: '1.3',
    description: 'Penerapan Sistem Manajemen Keselamatan Konstruksi (SMKK / K3MP Terpadu)',
    divisionId: 'DIV-1',
    divisionName: 'Divisi 1: Umum & Fasilitas',
    unit: 'Ls',
    contractorId: 'WIKA-GI',
    unitPrice: 28500000000,
    volOriginal: 1.0,
    volAddendum1: 1.0,
    volAddendum2: 1.05,
    volAddendum3: 1.08,
    volAddendum4: 1.12,
    volActual: 0.95,
    changeJustification: 'Peningkatan proteksi K3 untuk pekerjaan elevasi di atas perlintasan kereta api aktif DAOP 1.',
    wbsCodeRef: 'WBS-01.01.03'
  },
  {
    id: 'BOQ-1.4',
    itemNumber: '1.4',
    description: 'Fasilitas Kantor Lapangan Pengawas, Ruang Rapat PME, & Laboratorium Beton Terakreditasi',
    divisionId: 'DIV-1',
    divisionName: 'Divisi 1: Umum & Fasilitas',
    unit: 'Bulan',
    contractorId: 'WIKA',
    unitPrice: 320000000,
    volOriginal: 36.0,
    volAddendum1: 36.0,
    volAddendum2: 36.5,
    volAddendum3: 38.0,
    volAddendum4: 39.0,
    volActual: 32.0,
    changeJustification: 'Operasional monitoring kantor supervisi diperpanjang sesuai target PHO Addendum 4.',
    wbsCodeRef: 'WBS-01.01.04'
  },

  // ================= DIVISI 2: DRAINASE =================
  {
    id: 'BOQ-2.1',
    itemNumber: '2.1.(1)',
    description: 'Saluran U-Ditch Precast 80x80 cm Heavy Duty dengan Cover Pelat Baja di Jalur Frontage',
    divisionId: 'DIV-2',
    divisionName: 'Divisi 2: Drainase & Saluran',
    unit: 'm',
    contractorId: 'GI',
    unitPrice: 2850000,
    volOriginal: 9400.0,
    volAddendum1: 9650.0, // Penyesuaian akses Ancol Timur
    volAddendum2: 9650.0,
    volAddendum3: 9800.0,
    volAddendum4: 9800.0,
    volActual: 8250.0,
    changeJustification: 'Add. 1: Penambahan panjang saluran drainase crossing untuk mencegah genangan di area manuver rig Ancol Timur.',
    wbsCodeRef: 'WBS-01.04.01'
  },
  {
    id: 'BOQ-2.2',
    itemNumber: '2.2.(2)',
    description: 'Pipa Drainase Vertikal PVC Dia. 150mm & Box Inlet Deck Slab Kolom Pier Elevated',
    divisionId: 'DIV-2',
    divisionName: 'Divisi 2: Drainase & Saluran',
    unit: 'Titik',
    contractorId: 'WIKA',
    unitPrice: 18500000,
    volOriginal: 310.0,
    volAddendum1: 310.0,
    volAddendum2: 318.0, // Tambah pier portal
    volAddendum3: 318.0,
    volAddendum4: 318.0,
    volActual: 245.0,
    changeJustification: 'Add. 2: Penambahan titik pipa drainase internal pada kolom pier portal ganda P.56A.',
    wbsCodeRef: 'WBS-01.04.02'
  },

  // ================= DIVISI 3: PEKERJAAN TANAH =================
  {
    id: 'BOQ-3.1',
    itemNumber: '3.1.(1)',
    description: 'Galian Struktur Tanah Biasa untuk Pile Cap, Saluran & Proteksi Pipa Bawah Tanah',
    divisionId: 'DIV-3',
    divisionName: 'Divisi 3: Pekerjaan Tanah',
    unit: 'm3',
    contractorId: 'WIKA',
    unitPrice: 175000,
    volOriginal: 125000.0,
    volAddendum1: 128000.0,
    volAddendum2: 132000.0,
    volAddendum3: 141500.0, // Galian pengamanan pipa gas & PAM
    volAddendum4: 142000.0,
    volActual: 131500.0,
    changeJustification: 'Add. 3: Penambahan galian hati-hati (manual test pit) eksposur pipa gas PGN dan pipa air PAM Papanggo.',
    wbsCodeRef: 'WBS-01.02.01'
  },
  {
    id: 'BOQ-3.2',
    itemNumber: '3.2.(2)',
    description: 'Timbunan Pilihan Berbutir (Granular Backfill) Oprit Jembatan & Pemadatan Rigid',
    divisionId: 'DIV-3',
    divisionName: 'Divisi 3: Pekerjaan Tanah',
    unit: 'm3',
    contractorId: 'GI',
    unitPrice: 385000,
    volOriginal: 48000.0,
    volAddendum1: 49500.0,
    volAddendum2: 49500.0,
    volAddendum3: 50200.0,
    volAddendum4: 50200.0,
    volActual: 42000.0,
    changeJustification: 'Penyesuaian perbaikan tanah lunak pada zona oprit Ramp Off Ancol Barat.',
    wbsCodeRef: 'WBS-01.02.02'
  },

  // ================= DIVISI 7: STRUKTUR (UTAMA) =================
  {
    id: 'BOQ-7.1',
    itemNumber: '7.1.(1)',
    description: 'Pondasi Tiang Bor Beton (Bored Pile) Diameter 1200 mm Kedalaman 36-42 meter',
    divisionId: 'DIV-7',
    divisionName: 'Divisi 7: Struktur Tol Elevated',
    unit: 'm',
    contractorId: 'WIKA',
    unitPrice: 4250000,
    volOriginal: 48500.0,
    volAddendum1: 48500.0,
    volAddendum2: 47200.0, // Digeser ke D1500 di zona portal
    volAddendum3: 47200.0,
    volAddendum4: 47200.0,
    volActual: 44100.0,
    changeJustification: 'Add. 2: Pengurangan 1.300 meter D1200mm yang dikonversi menjadi bored pile D1500mm di pier portal P.56A.',
    wbsCodeRef: 'WBS-01.02.01'
  },
  {
    id: 'BOQ-7.2',
    itemNumber: '7.1.(2)',
    description: 'Pondasi Tiang Bor Beton (Bored Pile) Diameter 1500 mm Kedalaman 40-48 meter',
    divisionId: 'DIV-7',
    divisionName: 'Divisi 7: Struktur Tol Elevated',
    unit: 'm',
    contractorId: 'WIKA-GI',
    unitPrice: 6850000,
    volOriginal: 26800.0,
    volAddendum1: 26800.0,
    volAddendum2: 28950.0, // Tambahan di zona rel KA
    volAddendum3: 29800.0, // Tambahan di Pier P.20.S proteksi pipa gas
    volAddendum4: 29800.0,
    volActual: 27150.0,
    changeJustification: 'Add. 2 & 3: Peningkatan pondasi D1500mm untuk menahan beban gandar pier portal dan relokasi sumbu P.20.S.',
    wbsCodeRef: 'WBS-01.02.02'
  },
  {
    id: 'BOQ-7.3',
    itemNumber: '7.2.(1)',
    description: 'Beton Struktur Mutu Tinggi fc 35 MPa untuk Pile Cap Masif & Abutment Jembatan',
    divisionId: 'DIV-7',
    divisionName: 'Divisi 7: Struktur Tol Elevated',
    unit: 'm3',
    contractorId: 'WIKA',
    unitPrice: 1950000,
    volOriginal: 62000.0,
    volAddendum1: 62000.0,
    volAddendum2: 63800.0,
    volAddendum3: 65200.0,
    volAddendum4: 65200.0,
    volActual: 56800.0,
    changeJustification: 'Add. 2 & 3: Pembesaran dimensi pile cap Pier Portal P.56A dan perkuatan pile cap P.20.S.',
    wbsCodeRef: 'WBS-01.02.03'
  },
  {
    id: 'BOQ-7.4',
    itemNumber: '7.2.(2)',
    description: 'Beton Struktur Mutu Tinggi fc 45 MPa untuk Kolom Pier Tunggal & Pier Head Cantilever',
    divisionId: 'DIV-7',
    divisionName: 'Divisi 7: Struktur Tol Elevated',
    unit: 'm3',
    contractorId: 'WIKA-GI',
    unitPrice: 2450000,
    volOriginal: 84000.0,
    volAddendum1: 84000.0,
    volAddendum2: 81500.0,
    volAddendum3: 81500.0,
    volAddendum4: 81500.0,
    volActual: 70400.0,
    changeJustification: 'Sebagian volume kolom bundar dikonversi ke struktur portal mutu fc 50 MPa.',
    wbsCodeRef: 'WBS-01.02.04'
  },
  {
    id: 'BOQ-7.5',
    itemNumber: '7.2.(3)',
    description: 'Beton Mutu Khusus fc 50 MPa & Self-Compacting Concrete (SCC) Pier Portal P.56A Rel KA',
    divisionId: 'DIV-7',
    divisionName: 'Divisi 7: Struktur Tol Elevated',
    unit: 'm3',
    contractorId: 'GI',
    unitPrice: 3200000,
    volOriginal: 0.0, // Item Baru Addendum 2
    volAddendum1: 0.0,
    volAddendum2: 4850.0,
    volAddendum3: 4850.0,
    volAddendum4: 4850.0,
    volActual: 2900.0,
    changeJustification: 'Add. 2: Item baru untuk balok portal bentang 28 meter melangkahi rel ganda KA Tanjung Priok.',
    wbsCodeRef: 'WBS-01.02.05'
  },
  {
    id: 'BOQ-7.6',
    itemNumber: '7.3.(1)',
    description: 'Baja Tulangan Sirip Ulir Mutu BjTS 420B (Rebar D16 mm sampai D32 mm)',
    divisionId: 'DIV-7',
    divisionName: 'Divisi 7: Struktur Tol Elevated',
    unit: 'Kg',
    contractorId: 'WIKA-GI',
    unitPrice: 17200,
    volOriginal: 34500000.0,
    volAddendum1: 34500000.0,
    volAddendum2: 35850000.0,
    volAddendum3: 36400000.0,
    volAddendum4: 36400000.0,
    volActual: 30250000.0,
    changeJustification: 'Add. 2 & 3: Penambahan pembesian ekstra rapat gempa (seismic hook) pada portal pier head dan pile cap P.20.',
    wbsCodeRef: 'WBS-01.02.06'
  },
  {
    id: 'BOQ-7.7',
    itemNumber: '7.4.(1)',
    description: 'Pengadaan & Erection Box Girder Precast Segmental Prestressed Bentang 40-50m',
    divisionId: 'DIV-7',
    divisionName: 'Divisi 7: Struktur Tol Elevated',
    unit: 'Bentang',
    contractorId: 'WIKA-GI',
    unitPrice: 7450000000,
    volOriginal: 218.0,
    volAddendum1: 218.0,
    volAddendum2: 216.0, // 2 bentang diubah ke steel box girder
    volAddendum3: 216.0,
    volAddendum4: 216.0,
    volActual: 172.0,
    changeJustification: 'Add. 2: Konversi 2 bentang box girder precast menjadi bentang baja bentang lebar di atas rel KA.',
    wbsCodeRef: 'WBS-01.03.01'
  },
  {
    id: 'BOQ-7.8',
    itemNumber: '7.4.(2)',
    description: 'Pengadaan & Fabrikasi Erection Steel Box Girder Khusus Bentang Panjang 68m (Crossing Rel KAI)',
    divisionId: 'DIV-7',
    divisionName: 'Divisi 7: Struktur Tol Elevated',
    unit: 'Kg',
    contractorId: 'GI',
    unitPrice: 42000,
    volOriginal: 0.0, // Item Baru Addendum 2
    volAddendum1: 0.0,
    volAddendum2: 1250000.0,
    volAddendum3: 1250000.0,
    volAddendum4: 1250000.0,
    volActual: 980000.0,
    changeJustification: 'Add. 2: Struktur jembatan baja khusus bentang panjang agar tidak menempatkan pier di ruang bebas KA.',
    wbsCodeRef: 'WBS-01.03.02'
  },
  {
    id: 'BOQ-7.9',
    itemNumber: '7.5.(1)',
    description: 'Bantalan Jembatan Karet Elastomer Tipe Lead Rubber Bearing (LRB) Kapasitas 500-800 Ton',
    divisionId: 'DIV-7',
    divisionName: 'Divisi 7: Struktur Tol Elevated',
    unit: 'Buah',
    contractorId: 'WIKA',
    unitPrice: 85000000,
    volOriginal: 872.0,
    volAddendum1: 872.0,
    volAddendum2: 896.0,
    volAddendum3: 896.0,
    volAddendum4: 896.0,
    volActual: 710.0,
    changeJustification: 'Add. 2: Tambahan isolator gempa LRB pada dudukan steel box girder portal rel.',
    wbsCodeRef: 'WBS-01.03.03'
  },
  {
    id: 'BOQ-7.10',
    itemNumber: '7.5.(2)',
    description: 'Siar Muai Jembatan (Expansion Joint) Modular Gap 160 mm dengan Noise Reducer',
    divisionId: 'DIV-7',
    divisionName: 'Divisi 7: Struktur Tol Elevated',
    unit: 'm',
    contractorId: 'GI',
    unitPrice: 18500000,
    volOriginal: 2850.0,
    volAddendum1: 2850.0,
    volAddendum2: 2850.0,
    volAddendum3: 2850.0,
    volAddendum4: 2850.0,
    volActual: 1980.0,
    changeJustification: 'Volume tetap sesuai panjang pergerakan ekspansi termal jembatan layang.',
    wbsCodeRef: 'WBS-01.03.04'
  },

  // ================= DIVISI 8: PEKERJAAN MINOR & PENGEMBALIAN KONDISI =================
  {
    id: 'BOQ-8.1',
    itemNumber: '8.1.(1)',
    description: 'Perkerasan Aspal Modifikasi Polimer AC-WC Tebal 5 cm pada Lantai Jembatan & Oprit',
    divisionId: 'DIV-8',
    divisionName: 'Divisi 8: Pengembalian Kondisi & Minor',
    unit: 'Ton',
    contractorId: 'WIKA',
    unitPrice: 1650000,
    volOriginal: 42000.0,
    volAddendum1: 42000.0,
    volAddendum2: 42000.0,
    volAddendum3: 42000.0,
    volAddendum4: 42000.0,
    volActual: 21500.0,
    changeJustification: 'Volume tetap sesuai luas bidang perkerasan 2x2 lajur HBR II.',
    wbsCodeRef: 'WBS-01.05.01'
  },
  {
    id: 'BOQ-8.2',
    itemNumber: '8.2.(2)',
    description: 'Parapet Barrier Beton Bertulang Cast in Situ Tipe F-Shape dengan Railing Baja Galvanis',
    divisionId: 'DIV-8',
    divisionName: 'Divisi 8: Pengembalian Kondisi & Minor',
    unit: 'm',
    contractorId: 'WIKA-GI',
    unitPrice: 3450000,
    volOriginal: 19200.0,
    volAddendum1: 19200.0,
    volAddendum2: 19200.0,
    volAddendum3: 19200.0,
    volAddendum4: 19200.0,
    volActual: 13500.0,
    changeJustification: 'Pengamanan tepi jembatan elevated sisi kiri dan kanan.',
    wbsCodeRef: 'WBS-01.05.02'
  },
  {
    id: 'BOQ-8.3',
    itemNumber: '8.3.(1)',
    description: 'Penerangan Jalan Umum (PJU) LED 120W Smart System Tiang Oktagonal Hot Dip Galvanized 11m',
    divisionId: 'DIV-8',
    divisionName: 'Divisi 8: Pengembalian Kondisi & Minor',
    unit: 'Titik',
    contractorId: 'GI',
    unitPrice: 24500000,
    volOriginal: 480.0,
    volAddendum1: 480.0,
    volAddendum2: 480.0,
    volAddendum3: 480.0,
    volAddendum4: 480.0,
    volActual: 240.0,
    changeJustification: 'Titik penerangan elevated tollway.',
    wbsCodeRef: 'WBS-01.05.03'
  },

  // ================= DIVISI 9: RELOKASI UTILITAS & PEKERJAAN KHUSUS (CCO) =================
  {
    id: 'BOQ-9.1',
    itemNumber: '9.1.(1)',
    description: 'Proteksi Steel Casing & Sleeve Pelindung Pipa Gas Transmisi PGN D16" (Pier P.20.S)',
    divisionId: 'DIV-9',
    divisionName: 'Divisi 9: Relokasi Utilitas & CCO',
    unit: 'Ls',
    contractorId: 'WIKA',
    unitPrice: 42500000000,
    volOriginal: 0.0, // Item Baru Addendum 3
    volAddendum1: 0.0,
    volAddendum2: 0.0,
    volAddendum3: 1.0,
    volAddendum4: 1.0,
    volActual: 0.85,
    changeJustification: 'Add. 3: Pekerjaan Tambah Darurat proteksi pipa gas bertekanan tinggi PGN D16" yang bersinggungan langsung dengan tiang bor P.20.S.',
    wbsCodeRef: 'WBS-01.02.01-PGN'
  },
  {
    id: 'BOQ-9.2',
    itemNumber: '9.2.(2)',
    description: 'Relokasi & Pengalihan Jalur Pipa Transmisi Air Baku PAM Jaya Dia. 600mm Ruas Papanggo',
    divisionId: 'DIV-9',
    divisionName: 'Divisi 9: Relokasi Utilitas & CCO',
    unit: 'm',
    contractorId: 'WIKA',
    unitPrice: 38500000,
    volOriginal: 0.0, // Item Baru Addendum 3
    volAddendum1: 0.0,
    volAddendum2: 0.0,
    volAddendum3: 650.0,
    volAddendum4: 650.0,
    volActual: 620.0,
    changeJustification: 'Add. 3: Pengalihan pipa transmisi air PAM Jaya sepanjang 650m ke sisi luar jalur frontage tol.',
    wbsCodeRef: 'WBS-01.02.02-PAM'
  },
  {
    id: 'BOQ-9.3',
    itemNumber: '9.3.(3)',
    description: 'Relokasi Kabel Bawah Tanah Fiber Optik & Tiang Saluran Udara PLN Area Ramp Ancol Timur',
    divisionId: 'DIV-9',
    divisionName: 'Divisi 9: Relokasi Utilitas & CCO',
    unit: 'Ls',
    contractorId: 'GI',
    unitPrice: 7950000000,
    volOriginal: 0.0, // Item Baru Addendum 1 & 3
    volAddendum1: 1.0,
    volAddendum2: 1.0,
    volAddendum3: 1.0,
    volAddendum4: 1.0,
    volActual: 1.0,
    changeJustification: 'Add. 1: Pemindahan jaringan kabel FO Telkom/Icon+ dan tiang trafo PLN agar tidak menghalangi manuver crane.',
    wbsCodeRef: 'WBS-01.01.05'
  }
];

// Helper to compute Division Summaries dynamically
export function computeDivisionSummaries(items: BOQItem[]): BOQDivisionSummary[] {
  const map: Record<string, BOQDivisionSummary> = {};

  items.forEach(item => {
    if (!map[item.divisionId]) {
      map[item.divisionId] = {
        divisionId: item.divisionId,
        divisionName: item.divisionName,
        valOriginal: 0,
        valAddendum1: 0,
        valAddendum2: 0,
        valAddendum3: 0,
        valAddendum4: 0,
        valActual: 0,
        weightOriginal: 0,
        weightAddendum4: 0,
        financialProgress: 0
      };
    }

    const rec = map[item.divisionId];
    rec.valOriginal += item.volOriginal * item.unitPrice;
    rec.valAddendum1 += item.volAddendum1 * item.unitPrice;
    rec.valAddendum2 += item.volAddendum2 * item.unitPrice;
    rec.valAddendum3 += item.volAddendum3 * item.unitPrice;
    rec.valAddendum4 += item.volAddendum4 * item.unitPrice;
    rec.valActual += item.volActual * item.unitPrice;
  });

  const list = Object.values(map);
  const totalOrig = list.reduce((sum, d) => sum + d.valOriginal, 0);
  const totalAdd4 = list.reduce((sum, d) => sum + d.valAddendum4, 0);

  return list.map(d => ({
    ...d,
    weightOriginal: totalOrig > 0 ? (d.valOriginal / totalOrig) * 100 : 0,
    weightAddendum4: totalAdd4 > 0 ? (d.valAddendum4 / totalAdd4) * 100 : 0,
    financialProgress: d.valAddendum4 > 0 ? (d.valActual / d.valAddendum4) * 100 : 0
  }));
}
