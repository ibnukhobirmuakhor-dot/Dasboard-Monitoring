import React, { useState } from 'react';
import {
  Camera,
  Plus,
  Filter,
  Image as ImageIcon,
  Calendar,
  MapPin,
  Building2,
  X,
  Upload,
  UploadCloud,
  FolderCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { PhotoDocumentation, ContractorId } from '../../types';
import { googleWorkspace } from '../../services/googleWorkspace';

export const PhotoDocumentationView: React.FC = () => {
  const { photos, piers, zones, activities, addPhoto, canEdit } = useProject();

  const [pierFilter, setPierFilter] = useState<string>('ALL');
  const [contractorFilter, setContractorFilter] = useState<string>('ALL');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoDocumentation | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newPhoto, setNewPhoto] = useState<Omit<PhotoDocumentation, 'photoId'>>({
    date: new Date().toISOString().split('T')[0],
    contractorId: 'WIKA',
    zoneId: 'Z-1S',
    pierNumber: 'P18S',
    activityId: 'P18S-REBAR',
    activityName: 'Rebar Installation Pier Column',
    description: '',
    photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=800&q=80',
    type: 'Progress'
  });

  const [uploadingDrive, setUploadingDrive] = useState(false);
  const [driveUploadSuccess, setDriveUploadSuccess] = useState<string | null>(null);

  const filteredPhotos = photos.filter(p => {
    if (pierFilter !== 'ALL' && p.pierNumber !== pierFilter) return false;
    if (contractorFilter !== 'ALL' && p.contractorId !== contractorFilter) return false;
    return true;
  });

  const handleFileUploadToDrive = async (file: File) => {
    if (!googleWorkspace.isAuthenticated()) {
      alert('Silakan hubungkan akun Google Workspace terlebih dahulu melalui tombol "Google Workspace" di header atas.');
      return;
    }

    setUploadingDrive(true);
    setDriveUploadSuccess(null);
    try {
      const storedFolder = googleWorkspace.getStoredFolder();
      const folderId = storedFolder?.id;
      const uploaded = await googleWorkspace.uploadFileToDrive(file, `${newPhoto.pierNumber}_${file.name}`, folderId);
      
      const fileUrl = uploaded.webViewLink || uploaded.webContentLink || `https://drive.google.com/file/d/${uploaded.id}/view`;
      setNewPhoto(prev => ({
        ...prev,
        photoUrl: fileUrl,
        description: prev.description ? `${prev.description} (Tersimpan di Google Drive: ${uploaded.name})` : `Tersimpan di Google Drive: ${uploaded.name}`
      }));
      setDriveUploadSuccess(`Foto berhasil diunggah ke Google Drive${storedFolder ? ` folder: ${storedFolder.name}` : ''}!`);
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah foto ke Google Drive');
    } finally {
      setUploadingDrive(false);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPhoto({
      photoId: `PHT-${Date.now().toString().slice(-4)}`,
      ...newPhoto
    });
    setShowAddModal(false);
  };

  return (
    <div id="photo-documentation-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Site Photo Documentation</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Dokumentasi visual kemajuan fisik per Pier, komparasi Before/After, dan arsip inspeksi elevasi HBR II
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canEdit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Upload Foto Lapangan</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Pier:</span>
            <select
              value={pierFilter}
              onChange={e => setPierFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs"
            >
              <option value="ALL">Semua Pier</option>
              {piers.map(p => (
                <option key={p.pierId} value={p.pierNumber}>
                  {p.pierNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-400">Kontraktor:</span>
            <select
              value={contractorFilter}
              onChange={e => setContractorFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs"
            >
              <option value="ALL">Semua</option>
              <option value="WIKA">WIKA</option>
              <option value="GI">GI</option>
            </select>
          </div>
        </div>

        <div className="text-slate-400">
          Total Foto: <span className="font-bold text-white">{filteredPhotos.length}</span>
        </div>
      </div>

      {/* Photos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPhotos.map(photo => (
          <div
            key={photo.photoId}
            className="group rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm hover:border-slate-700 transition-all flex flex-col"
          >
            {/* Image Container */}
            <div
              onClick={() => setSelectedPhoto(photo)}
              className="relative aspect-video bg-slate-950 cursor-pointer overflow-hidden"
            >
              <img
                src={photo.photoUrl}
                alt={photo.description}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 flex gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900/90 text-white border border-slate-700">
                  {photo.pierNumber}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    photo.type === 'Before'
                      ? 'bg-amber-500 text-slate-950'
                      : photo.type === 'After'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {photo.type || 'Progress'}
                </span>
              </div>

              <div className="absolute bottom-2 right-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] text-slate-300 font-mono">
                {photo.date}
              </div>
            </div>

            {/* Meta */}
            <div className="p-4 flex-1 flex flex-col justify-between text-xs space-y-2">
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>{photo.contractorId} • {photo.zoneId}</span>
                  <span className="font-mono">{photo.photoId}</span>
                </div>
                <h4 className="font-bold text-white text-sm line-clamp-1">{photo.activityName}</h4>
                <p className="text-slate-300 text-xs mt-1 line-clamp-2">{photo.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
                <span className="text-blue-400 hover:underline cursor-pointer" onClick={() => setSelectedPhoto(photo)}>
                  Lihat Foto Resolusi Tinggi →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">
                  {selectedPhoto.pierNumber} - {selectedPhoto.activityName}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedPhoto.date} • Kontraktor: {selectedPhoto.contractorId} ({selectedPhoto.zoneId})
                </p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src={selectedPhoto.photoUrl}
                alt={selectedPhoto.description}
                referrerPolicy="no-referrer"
                className="max-h-[60vh] w-auto object-contain"
              />
            </div>

            <div className="p-4 text-xs text-slate-300">
              <span className="font-semibold text-white">Deskripsi Pekerjaan:</span>
              <p className="mt-1">{selectedPhoto.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Upload / Tambah Foto Dokumentasi</h3>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pier Number*</label>
                  <select
                    value={newPhoto.pierNumber}
                    onChange={e => setNewPhoto({ ...newPhoto, pierNumber: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  >
                    {piers.map(p => (
                      <option key={p.pierId} value={p.pierNumber}>
                        {p.pierNumber} ({p.contractorId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipe Dokumentasi</label>
                  <select
                    value={newPhoto.type}
                    onChange={e => setNewPhoto({ ...newPhoto, type: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Progress">Progress Harian</option>
                    <option value="Before">Before (Sebelum Pekerjaan)</option>
                    <option value="After">After (Selesai Pekerjaan)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kontraktor</label>
                  <select
                    value={newPhoto.contractorId}
                    onChange={e => setNewPhoto({ ...newPhoto, contractorId: e.target.value as ContractorId })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="WIKA">WIKA</option>
                    <option value="GI">GI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tanggal Foto</label>
                  <input
                    type="date"
                    value={newPhoto.date}
                    onChange={e => setNewPhoto({ ...newPhoto, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nama Pekerjaan / Aktivitas*</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Pengecoran Pier Column Segmen 1"
                  value={newPhoto.activityName}
                  onChange={e => setNewPhoto({ ...newPhoto, activityName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Pilih File Foto (Otomatis Upload ke Google Drive)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUploadToDrive(f);
                    }}
                    className="flex-1 text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                  />
                  {uploadingDrive && (
                    <span className="text-xs text-blue-400 animate-pulse flex items-center gap-1">
                      <UploadCloud className="w-3.5 h-3.5" /> Uploading ke Drive...
                    </span>
                  )}
                </div>
                {driveUploadSuccess && (
                  <div className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{driveUploadSuccess}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">URL Foto (Link Gambar atau Google Drive)*</label>
                <input
                  type="text"
                  required
                  placeholder="https://..."
                  value={newPhoto.photoUrl}
                  onChange={e => setNewPhoto({ ...newPhoto, photoUrl: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Uraian / Keterangan Visual</label>
                <textarea
                  rows={2}
                  placeholder="Catatan inspeksi visual lapangan..."
                  value={newPhoto.description}
                  onChange={e => setNewPhoto({ ...newPhoto, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold"
                >
                  Simpan Foto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
