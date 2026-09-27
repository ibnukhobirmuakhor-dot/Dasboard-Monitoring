import React from 'react';
import { Search, X, MapPin, Activity, AlertTriangle, Flame, Boxes } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

interface GlobalSearchResultModalProps {
  onClose: () => void;
  onNavigateToPier?: (pierNumber: string) => void;
}

export const GlobalSearchResultModal: React.FC<GlobalSearchResultModalProps> = ({
  onClose,
  onNavigateToPier
}) => {
  const { searchQuery, setSearchQuery, searchResults } = useProject();

  if (!searchQuery) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Pier':
        return <MapPin className="w-4 h-4 text-blue-400" />;
      case 'Activity':
        return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'Constraint':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'Issue':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'Material':
        return <Boxes className="w-4 h-4 text-indigo-400" />;
      default:
        return <Search className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTagBadge = (type: string, tag: string) => {
    if (tag === 'Closed' || tag === 'Completed' || tag === 'Aman') {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
    if (tag === 'On Progress' || tag === 'In Progress' || tag === 'Menipis') {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
    if (tag === 'Open' || tag === 'Delayed' || tag === 'Kritis') {
      return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }
    return 'bg-slate-700 text-slate-300 border-slate-600';
  };

  return (
    <div
      id="global-search-modal"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/80 backdrop-blur-xs"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Hasil Pencarian Proyek</h3>
              <p className="text-xs text-slate-400">
                Kata kunci: <span className="text-blue-300 font-mono font-bold">"{searchQuery}"</span> ({searchResults.length} hasil ditemukan)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[70vh] overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/60">
          {searchResults.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Search className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-medium">Tidak ada data yang cocok dengan "{searchQuery}"</p>
              <p className="text-xs text-slate-400 mt-1">
                Coba cari nomor Pier seperti <span className="text-blue-400 font-mono">P16S</span>, <span className="text-blue-400 font-mono">P178N</span>, atau nama kontraktor <span className="text-blue-400 font-mono">WIKA</span>.
              </p>
            </div>
          ) : (
            searchResults.map(result => (
              <div
                key={`${result.type}-${result.id}`}
                className="pt-2.5 first:pt-0 group flex items-start justify-between gap-3 p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/80 shrink-0 mt-0.5">
                    {getTypeIcon(result.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {result.type}
                      </span>
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-blue-300 transition-colors truncate">
                        {result.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{result.subtitle}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getTagBadge(
                      result.type,
                      result.tag
                    )}`}
                  >
                    {result.tag}
                  </span>
                  {result.type === 'Pier' && onNavigateToPier && (
                    <button
                      onClick={() => {
                        onNavigateToPier(result.data.pierNumber);
                        setSearchQuery('');
                        onClose();
                      }}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-medium underline"
                    >
                      Buka Stripmap →
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Tekan ESC atau tombol silang untuk menutup.</span>
          <button
            onClick={() => {
              setSearchQuery('');
              onClose();
            }}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
