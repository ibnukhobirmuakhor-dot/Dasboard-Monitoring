import React, { useState, useRef } from 'react';
import {
  FileUp,
  FileDown,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  MapPin,
  CalendarDays,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useProject } from '../../context/ProjectContext';
import { PierMaster, ContractorId } from '../../types';

export const ExcelImportExportView: React.FC = () => {
  const {
    addPier,
    addDailyProgress,
    exportToExcel,
    exportToCSV,
    piers,
    wbs,
    dailyProgress,
    zones
  } = useProject();

  const [importType, setImportType] = useState<'pier' | 'daily' | 'wbs'>('pier');
  const [fileData, setFileData] = useState<any[] | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Download Templates
  const handleDownloadTemplate = () => {
    if (importType === 'pier') {
      const templateData = [
        {
          'Pier Number': 'P180N',
          'Zone ID': 'Z-1U',
          'Contractor ID': 'WIKA',
          Latitude: -6.1265,
          Longitude: 106.8724,
          Status: 'On Progress',
          'Overall Progress': 15,
          'Planned Finish': '2026-04-30',
          'Main Activity': 'Bored Pile Drilling Titik 1-4'
        },
        {
          'Pier Number': 'P181N',
          'Zone ID': 'Z-1U',
          'Contractor ID': 'WIKA',
          Latitude: -6.1263,
          Longitude: 106.8735,
          Status: 'Open',
          'Overall Progress': 0,
          'Planned Finish': '2026-05-15',
          'Main Activity': 'Persiapan Lahan & Utilitas'
        }
      ];
      exportToExcel('Template_Import_Master_Pier', 'Template Pier', templateData);
    } else if (importType === 'daily') {
      const templateData = [
        {
          Date: new Date().toISOString().split('T')[0],
          Contractor: 'WIKA',
          Zone: 'Z-1S',
          Pier: 'P18S',
          'Planned Progress': 2.5,
          'Actual Progress': 2.0,
          'Quantity Plan': 12,
          'Quantity Actual': 10,
          Unit: 'm3',
          Manpower: 18,
          Equipment: 'Crawler Crane 50T, Vibrator',
          Description: 'Pengecoran Pier Column segmen 2',
          Remarks: 'Kondisi cuaca cerah'
        }
      ];
      exportToExcel('Template_Import_Daily_Progress', 'Template Daily', templateData);
    } else {
      const templateData = [
        {
          'WBS ID': 'WBS-CUSTOM-1',
          'WBS Code': '1.2.3.4.5',
          'WBS Name': 'Pemasangan Parapet & Barrier',
          Level: 5,
          'Parent ID': 'WBS-4-STR-ATAS'
        }
      ];
      exportToExcel('Template_Import_WBS', 'Template WBS', templateData);
    }
  };

  // Handle File Upload & Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setValidationErrors([]);
    setSuccessMessage(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawJson || rawJson.length === 0) {
          setValidationErrors(['File Excel kosong atau tidak memiliki baris data.']);
          setFileData(null);
          setIsProcessing(false);
          return;
        }

        // Validate structure based on importType
        const errors: string[] = [];
        if (importType === 'pier') {
          rawJson.forEach((row, idx) => {
            const pierNum = row['Pier Number'] || row['pierNumber'] || row['Pier'];
            if (!pierNum) {
              errors.push(`Baris ${idx + 2}: 'Pier Number' tidak ditemukan atau kosong.`);
            }
            // Check for duplicate with existing
            if (piers.some(p => p.pierNumber === String(pierNum).trim())) {
              errors.push(`Baris ${idx + 2}: Pier ${pierNum} sudah terdaftar di database (duplikasi ditolak).`);
            }
          });
        } else if (importType === 'daily') {
          rawJson.forEach((row, idx) => {
            const date = row['Date'] || row['Tanggal'];
            const pier = row['Pier'] || row['Pier Number'];
            if (!date) errors.push(`Baris ${idx + 2}: 'Date' wajib diisi.`);
            if (!pier) errors.push(`Baris ${idx + 2}: 'Pier' wajib diisi.`);
          });
        }

        setValidationErrors(errors);
        setFileData(rawJson);
      } catch (err: any) {
        setValidationErrors([`Gagal membaca file: ${err.message}`]);
        setFileData(null);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Commit Parsed Data into Database State
  const handleCommitData = () => {
    if (!fileData || fileData.length === 0 || validationErrors.length > 0) return;

    let importedCount = 0;

    if (importType === 'pier') {
      fileData.forEach(row => {
        const rawPier = row['Pier'] || row['Pier Number'] || row['pierNumber'] || row['PIER'];
        const pierNum = (rawPier || '').toString().trim();
        const ruas = row['Ruas'] || row['Ruas Jalan'] || row['ruas'] || '';
        const rawZona = row['Zona'] || row['zona'] || row['Zone'] || row['Zone ID'];
        const kodeArea = row['Kode Area'] || row['kodeArea'] || '';
        const tipePier = row['Tipe Pier'] || row['tipePier'] || '';
        const tipeSuper = row['Tipe Superstruktur'] || row['tipeSuperstruktur'] || '';
        const lingkup = row['Lingkup Kontraktor'] || row['lingkupKontraktor'] || '';
        const section = row['Kategori Sheet'] || row['Section'] || row['section'];

        let contractorId: ContractorId = 'Unassigned';
        if (lingkup.includes('Wijaya Karya') && lingkup.includes('Girder Indonesia')) contractorId = 'WIKA-GI';
        else if (lingkup.includes('Wijaya Karya') || row['Contractor ID'] === 'WIKA') contractorId = 'WIKA';
        else if (lingkup.includes('Girder Indonesia') || row['Contractor ID'] === 'GI') contractorId = 'GI';

        const zoneId = rawZona || (ruas.includes('Utara') ? 'Zona 1N' : 'Zona 1S');
        const lat = Number(row['Latitude']) || -6.1265;
        const lng = Number(row['Longitude']) || 106.8724;
        const status = row['Status'] || 'On Progress';
        const prog = Number(row['Overall Progress']) || Number(row['Progress (%)']) || 0;
        const plannedFinish = row['Planned Finish'] || row['Target Selesai'] || '2026-06-30';
        const mainActivity = row['Main Activity'] || row['Aktivitas Utama'] || (tipeSuper ? `Struktur ${tipeSuper}` : 'Pekerjaan Pier');

        const res = addPier({
          pierId: pierNum.replace(/\s+/g, '_'),
          pierNumber: pierNum,
          zoneId,
          ruas: ruas || undefined,
          zona: rawZona || undefined,
          kodeArea: kodeArea || undefined,
          tipePier: tipePier || undefined,
          tipeSuperstruktur: tipeSuper || undefined,
          lingkupKontraktor: lingkup || undefined,
          section: section || undefined,
          contractorId,
          latitude: lat,
          longitude: lng,
          status: status as any,
          overallProgress: prog,
          plannedFinish,
          mainActivity
        });

        if (res.success) importedCount++;
      });
    } else if (importType === 'daily') {
      fileData.forEach(row => {
        const res = addDailyProgress({
          date: row['Date'] || new Date().toISOString().split('T')[0],
          contractorId: (row['Contractor'] || 'WIKA') as ContractorId,
          zoneId: row['Zone'] || 'Z-1S',
          pierId: row['Pier'] || 'P18S',
          wbsId: 'WBS-6-REBAR',
          activityId: 'ACT-BULK',
          plannedProgress: Number(row['Planned Progress']) || 1.0,
          actualProgress: Number(row['Actual Progress']) || 1.0,
          quantityPlan: Number(row['Quantity Plan']) || 10,
          quantityActual: Number(row['Quantity Actual']) || 10,
          unit: row['Unit'] || 'm3',
          manpower: Number(row['Manpower']) || 12,
          equipment: row['Equipment'] || 'Crane',
          description: row['Description'] || 'Pekerjaan Harian Excel Import',
          remarks: row['Remarks'] || 'Import via Excel'
        });
        if (res.success) importedCount++;
      });
    }

    setSuccessMessage(`Berhasil menyimpan ${importedCount} data ke database sistem!`);
    setFileData(null);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div id="excel-import-export-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Excel Data Import & System Export</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Integrasi batch data menggunakan template resmi spreadsheet (.xlsx / .csv) dengan verifikasi schema otomatis
          </p>
        </div>

        {/* Quick Export All */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => exportToExcel('Master_Database_Lengkap_HBR2', 'All Piers', piers)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Master Pier (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Choose Import Dataset Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            id: 'pier',
            title: '1. Master Pier Data',
            desc: 'Nomor Pier (P16S, P178N), Zona, Kontraktor, Koordinat Lat/Long',
            icon: MapPin
          },
          {
            id: 'daily',
            title: '2. Daily Progress Log',
            desc: 'Tanggal, Kontraktor, Pier, Plan %, Actual %, Manpower, Alat',
            icon: CalendarDays
          },
          {
            id: 'wbs',
            title: '3. WBS Structure (6 Level)',
            desc: 'WBS Code, Hierarchy Level, Parent ID, Activity Description',
            icon: Layers
          }
        ].map(item => {
          const Icon = item.icon;
          const isSelected = importType === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setImportType(item.id as any);
                setFileData(null);
                setValidationErrors([]);
                setSuccessMessage(null);
              }}
              className={`p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500'
                  : 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                <h3 className="font-bold text-white text-xs">{item.title}</h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Step 1: Download Template */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              1
            </span>
            <h3 className="text-sm font-bold text-white">Download Template Resmi Spreadsheet</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gunakan format kolom baku agar sistem dapat membaca dan memvalidasi tipe data secara akurat.
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download Template Excel ({importType.toUpperCase()})</span>
        </button>
      </div>

      {/* Step 2: Upload Area */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
            2
          </span>
          <h3 className="text-sm font-bold text-white">Upload File Excel Hasil Isian</h3>
        </div>

        {/* Drag & Drop Box */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-800/40 hover:bg-slate-800/80 rounded-xl p-8 text-center cursor-pointer transition-all"
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-white">
            {fileName ? `File Terpilih: ${fileName}` : 'Klik untuk memilih file Excel atau seret (drag & drop) ke sini'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Format yang didukung: Microsoft Excel (.xlsx, .xls) atau CSV (.csv)
          </p>
        </div>

        {/* Validation Errors Box */}
        {validationErrors.length > 0 && (
          <div className="p-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs space-y-2">
            <div className="flex items-center gap-2 text-rose-300 font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>Ditemukan {validationErrors.length} Kesalahan Validasi:</span>
            </div>
            <ul className="list-disc list-inside text-rose-200 space-y-1 text-[11px] pl-1">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Step 3: Data Preview Table & Commit */}
      {fileData && fileData.length > 0 && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h3 className="text-sm font-bold text-white">Preview Data Sebelum Disimpan</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Total baris valid: <strong className="text-white">{fileData.length} baris</strong>
              </p>
            </div>

            <button
              disabled={validationErrors.length > 0}
              onClick={handleCommitData}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan ke Database ({fileData.length} Record)</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-72 custom-scrollbar border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-300 uppercase sticky top-0 font-semibold">
                <tr>
                  {Object.keys(fileData[0]).map((col, idx) => (
                    <th key={idx} className="p-2.5 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {fileData.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-800/40">
                    {Object.values(row).map((val: any, cIdx) => (
                      <td key={cIdx} className="p-2.5 whitespace-nowrap font-mono text-[11px]">
                        {val !== undefined ? String(val) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
