import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ActivityItem, TaskDependency, DependencyType } from '../../types';
import {
  Flame,
  Link2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Search,
  Filter,
  Layers,
  ArrowRight,
  Info,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  ChevronRight,
  X,
  Sparkles,
  Download
} from 'lucide-react';
import { calculateDurationDays } from '../../utils/msProjectUtils';

interface PrecedenceDiagramViewProps {
  activities: ActivityItem[];
  onSelectActivity?: (act: ActivityItem) => void;
  onEditRelationships?: (act: ActivityItem) => void;
}

interface LayoutNode {
  activity: ActivityItem;
  rank: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DiagramLink {
  id: string;
  sourceId: string;
  targetId: string;
  type: DependencyType;
  lag: number;
  isCritical: boolean;
  path: string;
  labelX: number;
  labelY: number;
}

export const PrecedenceDiagramView: React.FC<PrecedenceDiagramViewProps> = ({
  activities,
  onSelectActivity,
  onEditRelationships
}) => {
  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filters & Interactivity
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCriticalOnly, setFilterCriticalOnly] = useState<boolean>(false);
  const [selectedContractor, setSelectedContractor] = useState<'ALL' | string>('ALL');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightTrace, setHighlightTrace] = useState<boolean>(true);
  const [showNodeDetailsDrawer, setShowNodeDetailsDrawer] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Filter activities for the diagram
  const activeActivities = useMemo(() => {
    return activities.filter(act => {
      if (filterCriticalOnly && !act.isCritical) return false;
      if (selectedContractor !== 'ALL' && act.contractorId !== selectedContractor) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = act.activityName.toLowerCase().includes(q);
        const matchesCode = (act.wbsCode || '').toLowerCase().includes(q);
        const matchesPier = act.pierId.toLowerCase().includes(q);
        const matchesId = act.activityId.toLowerCase().includes(q);
        return matchesName || matchesCode || matchesPier || matchesId;
      }
      return true;
    });
  }, [activities, filterCriticalOnly, selectedContractor, searchQuery]);

  // Node dimensions & layout constants
  const nodeWidth = 270;
  const nodeHeight = 146;
  const colGap = 130;
  const rowGap = 50;

  // Topological rank calculation (Sugiyama level layering)
  const { layoutNodes, diagramLinks, canvasWidth, canvasHeight, ranksCount } = useMemo(() => {
    if (activeActivities.length === 0) {
      return {
        layoutNodes: [],
        diagramLinks: [],
        canvasWidth: 800,
        canvasHeight: 600,
        ranksCount: 0
      };
    }

    const actMap = new Map<string, ActivityItem>();
    activeActivities.forEach(a => actMap.set(a.activityId, a));

    // Calculate topological ranks (longest path from start)
    const rankMap = new Map<string, number>();

    const getRank = (actId: string, visited: Set<string>): number => {
      if (rankMap.has(actId)) return rankMap.get(actId)!;
      if (visited.has(actId)) return 0; // prevent cycle loop

      visited.add(actId);
      const act = actMap.get(actId);
      if (!act || !act.predecessors || act.predecessors.length === 0) {
        rankMap.set(actId, 0);
        return 0;
      }

      let maxPredRank = -1;
      act.predecessors.forEach(p => {
        if (actMap.has(p.predecessorId)) {
          const r = getRank(p.predecessorId, new Set(visited));
          if (r > maxPredRank) maxPredRank = r;
        }
      });

      const finalRank = maxPredRank + 1;
      rankMap.set(actId, finalRank);
      return finalRank;
    };

    activeActivities.forEach(a => getRank(a.activityId, new Set()));

    // Group activities by rank
    const rankGroups = new Map<number, ActivityItem[]>();
    activeActivities.forEach(act => {
      const r = rankMap.get(act.activityId) || 0;
      if (!rankGroups.has(r)) rankGroups.set(r, []);
      rankGroups.get(r)!.push(act);
    });

    const sortedRanks = Array.from(rankGroups.keys()).sort((a, b) => a - b);
    const nodes: LayoutNode[] = [];
    const nodeCoords = new Map<string, LayoutNode>();

    let maxRowInCol = 1;

    sortedRanks.forEach(r => {
      const group = rankGroups.get(r)!;
      // Sort within column: Critical path first, then by Early Start date
      group.sort((a, b) => {
        if (a.isCritical && !b.isCritical) return -1;
        if (!a.isCritical && b.isCritical) return 1;
        return (a.earlyStart || a.startPlan).localeCompare(b.earlyStart || b.startPlan);
      });

      if (group.length > maxRowInCol) maxRowInCol = group.length;

      group.forEach((act, rowIndex) => {
        const x = 60 + r * (nodeWidth + colGap);
        const y = 60 + rowIndex * (nodeHeight + rowGap);
        const layoutNode: LayoutNode = {
          activity: act,
          rank: r,
          row: rowIndex,
          x,
          y,
          width: nodeWidth,
          height: nodeHeight
        };
        nodes.push(layoutNode);
        nodeCoords.set(act.activityId, layoutNode);
      });
    });

    // Generate links and routing
    const links: DiagramLink[] = [];

    activeActivities.forEach(succAct => {
      if (!succAct.predecessors) return;
      const succLayout = nodeCoords.get(succAct.activityId);
      if (!succLayout) return;

      succAct.predecessors.forEach(p => {
        const predLayout = nodeCoords.get(p.predecessorId);
        if (!predLayout) return;

        const isCrit = (succAct.isCritical && predLayout.activity.isCritical);

        let startX = predLayout.x + nodeWidth;
        let startY = predLayout.y + nodeHeight / 2;
        let endX = succLayout.x;
        let endY = succLayout.y + nodeHeight / 2;

        if (p.type === 'SS') {
          startX = predLayout.x;
          endX = succLayout.x;
        } else if (p.type === 'FF') {
          startX = predLayout.x + nodeWidth;
          endX = succLayout.x + nodeWidth;
        } else if (p.type === 'SF') {
          startX = predLayout.x;
          endX = succLayout.x + nodeWidth;
        }

        let pathStr = '';
        let labelX = (startX + endX) / 2;
        let labelY = (startY + endY) / 2 - 8;

        if (p.type === 'FS') {
          if (endX >= startX + 30) {
            // Forward stepped curve
            const midX = (startX + endX) / 2;
            pathStr = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
            labelX = midX;
            labelY = (startY + endY) / 2 - 10;
          } else {
            // Loop backward
            const loopX1 = startX + 25;
            const loopY = startY + (endY > startY ? 20 : -20);
            const loopX2 = endX - 25;
            pathStr = `M ${startX} ${startY} L ${loopX1} ${startY} L ${loopX1} ${loopY} L ${loopX2} ${loopY} L ${loopX2} ${endY} L ${endX} ${endY}`;
            labelX = (loopX1 + loopX2) / 2;
            labelY = loopY - 8;
          }
        } else if (p.type === 'SS') {
          const leftMidX = Math.min(startX, endX) - 35;
          pathStr = `M ${startX} ${startY} L ${leftMidX} ${startY} L ${leftMidX} ${endY} L ${endX} ${endY}`;
          labelX = leftMidX;
          labelY = (startY + endY) / 2;
        } else if (p.type === 'FF') {
          const rightMidX = Math.max(startX, endX) + 35;
          pathStr = `M ${startX} ${startY} L ${rightMidX} ${startY} L ${rightMidX} ${endY} L ${endX} ${endY}`;
          labelX = rightMidX;
          labelY = (startY + endY) / 2;
        } else {
          pathStr = `M ${startX} ${startY} L ${endX} ${endY}`;
        }

        links.push({
          id: `${p.predecessorId}->${succAct.activityId}`,
          sourceId: p.predecessorId,
          targetId: succAct.activityId,
          type: p.type,
          lag: p.lagDays || 0,
          isCritical: !!isCrit,
          path: pathStr,
          labelX,
          labelY
        });
      });
    });

    const totalCols = sortedRanks.length || 1;
    const calcWidth = Math.max(1200, totalCols * (nodeWidth + colGap) + 200);
    const calcHeight = Math.max(800, maxRowInCol * (nodeHeight + rowGap) + 200);

    return {
      layoutNodes: nodes,
      diagramLinks: links,
      canvasWidth: calcWidth,
      canvasHeight: calcHeight,
      ranksCount: totalCols
    };
  }, [activeActivities]);

  // Selected node details
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return layoutNodes.find(n => n.activity.activityId === selectedNodeId) || null;
  }, [selectedNodeId, layoutNodes]);

  // Trace related nodes (predecessors & successors of selected)
  const relatedNodeIds = useMemo(() => {
    if (!selectedNodeId || !highlightTrace) return new Set<string>();
    const related = new Set<string>([selectedNodeId]);

    // Add direct predecessors
    diagramLinks.forEach(l => {
      if (l.targetId === selectedNodeId) related.add(l.sourceId);
      if (l.sourceId === selectedNodeId) related.add(l.targetId);
    });

    return related;
  }, [selectedNodeId, highlightTrace, diagramLinks]);

  // Pan event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.pdm-node-card')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetView = () => {
    setZoom(0.85);
    setPan({ x: 20, y: 20 });
    setSelectedNodeId(null);
  };

  const handleFitToView = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const scaleX = (clientWidth - 80) / canvasWidth;
    const scaleY = (clientHeight - 80) / canvasHeight;
    const fitScale = Math.min(1.2, Math.max(0.4, Math.min(scaleX, scaleY)));
    setZoom(fitScale);
    setPan({ x: 40, y: 40 });
  };

  // Node selection click
  const handleNodeClick = (act: ActivityItem) => {
    setSelectedNodeId(act.activityId);
    setShowNodeDetailsDrawer(true);
    if (onSelectActivity) onSelectActivity(act);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        {/* Left Filters */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Task / Pier di PDM..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden w-56"
            />
          </div>

          {/* Critical Path filter button */}
          <button
            onClick={() => setFilterCriticalOnly(!filterCriticalOnly)}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              filterCriticalOnly
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-900/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Hanya Critical Path ({activities.filter(a => a.isCritical).length})</span>
          </button>

          {/* Contractor filter */}
          <select
            value={selectedContractor}
            onChange={e => setSelectedContractor(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-hidden"
          >
            <option value="ALL">Semua Kontraktor</option>
            <option value="WIKA">WIKA (PT Wijaya Karya)</option>
            <option value="GI">GI (PT Girder Indonesia)</option>
            <option value="WIKA-GI">Joint (WIKA - GI)</option>
          </select>

          {/* Trace dependency toggle */}
          <label className="flex items-center gap-1.5 text-slate-300 font-medium cursor-pointer ml-1">
            <input
              type="checkbox"
              checked={highlightTrace}
              onChange={e => setHighlightTrace(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
            />
            <span className="text-[11px] text-slate-300">Sorot Jalur Terhubung (Predecessor/Successor)</span>
          </label>
        </div>

        {/* Right Canvas Zoom Controls */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center p-1 rounded-xl bg-slate-800 border border-slate-700">
            <button
              onClick={() => setZoom(prev => Math.min(1.6, prev + 0.1))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-300 font-bold min-w-[48px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(prev => Math.max(0.35, prev - 0.1))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-700 mx-1" />
            <button
              onClick={handleFitToView}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
              title="Fit to View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetView}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
              title="Reset Zoom & Pan"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* PDM Anatomy Explanation Card */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-200">Format Kotak Node PDM (Activity-on-Node / AON):</span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Baris Atas: <strong className="text-emerald-400">ES (Early Start)</strong> | <strong className="text-white">Durasi (Hari)</strong> | <strong className="text-emerald-400">EF (Early Finish)</strong> • Baris Bawah: <strong className="text-amber-400">LS (Late Start)</strong> | <strong className="text-cyan-400">TF (Total Float)</strong> | <strong className="text-amber-400">LF (Late Finish)</strong>
            </p>
          </div>
        </div>

        {/* Legend pills */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs border-2 border-rose-500 bg-rose-950/40" />
            <strong className="text-rose-400">Critical Node</strong> (TF ≤ 1d)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs border border-slate-600 bg-slate-800" />
            Standard Node
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-rose-500" />
            Critical Precedence Link
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-400" />
            Standard Precedence Link (FS, SS, FF)
          </span>
        </div>
      </div>

      {/* Main Interactive Pan & Zoom Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative w-full h-[680px] rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden select-none cursor-${
          isDragging ? 'grabbing' : 'grab'
        }`}
      >
        {/* Stage Columns Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />

        {/* Movable & Scalable Canvas Layer */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`
          }}
          className="absolute left-0 top-0 transition-transform duration-75 ease-out"
        >
          {/* Stage Rank Column Labels */}
          {Array.from({ length: ranksCount }).map((_, rankIdx) => {
            const x = 60 + rankIdx * (nodeWidth + colGap);
            return (
              <div
                key={rankIdx}
                style={{ left: `${x}px`, width: `${nodeWidth}px` }}
                className="absolute top-3 text-center pointer-events-none"
              >
                <span className="px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest shadow-sm">
                  Tahap / Stage {rankIdx + 1}
                </span>
              </div>
            );
          })}

          {/* SVG Dependency Precedence Arrows */}
          <svg
            className="absolute inset-0 pointer-events-none z-0"
            style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
          >
            <defs>
              {/* Cyan Standard Marker */}
              <marker
                id="pdm-arrow-std"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#38bdf8" />
              </marker>

              {/* Rose Critical Marker */}
              <marker
                id="pdm-arrow-crit"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#f43f5e" />
              </marker>

              {/* Highlighted Selected Marker */}
              <marker
                id="pdm-arrow-hl"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#60a5fa" />
              </marker>
            </defs>

            {diagramLinks.map(link => {
              const isSourceSelected = link.sourceId === selectedNodeId;
              const isTargetSelected = link.targetId === selectedNodeId;
              const isHighlighted = isSourceSelected || isTargetSelected;
              const isDimmed = selectedNodeId && !isHighlighted;

              const strokeColor = isHighlighted
                ? '#60a5fa'
                : link.isCritical
                ? '#f43f5e'
                : '#38bdf8';

              const strokeWidth = isHighlighted ? '3' : link.isCritical ? '2.5' : '1.8';
              const markerId = isHighlighted
                ? 'url(#pdm-arrow-hl)'
                : link.isCritical
                ? 'url(#pdm-arrow-crit)'
                : 'url(#pdm-arrow-std)';

              return (
                <g key={link.id} opacity={isDimmed ? 0.25 : 0.85}>
                  {/* Outer glow for critical or highlighted link */}
                  {(link.isCritical || isHighlighted) && (
                    <path
                      d={link.path}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={Number(strokeWidth) + 3}
                      opacity={0.3}
                    />
                  )}

                  {/* Main link path */}
                  <path
                    d={link.path}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={link.type === 'SS' ? '4,3' : link.type === 'FF' ? '6,3' : 'none'}
                    markerEnd={markerId}
                  />

                  {/* Relationship Label Pill (FS, SS, FF + Lag) */}
                  <g transform={`translate(${link.labelX}, ${link.labelY})`}>
                    <rect
                      x="-18"
                      y="-9"
                      width="36"
                      height="18"
                      rx="4"
                      fill="#0f172a"
                      stroke={strokeColor}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="3.5"
                      fill={strokeColor}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {link.type}{link.lag ? `+${link.lag}d` : ''}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Interactive Activity Nodes */}
          {layoutNodes.map(node => {
            const act = node.activity;
            const isSelected = act.activityId === selectedNodeId;
            const isRelated = relatedNodeIds.has(act.activityId);
            const isDimmed = selectedNodeId && !isSelected && !isRelated;
            const isCrit = act.isCritical;
            const duration = act.duration || calculateDurationDays(act.startPlan, act.finishPlan);

            return (
              <div
                key={act.activityId}
                onClick={() => handleNodeClick(act)}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: `${node.width}px`,
                  height: `${node.height}px`
                }}
                className={`pdm-node-card absolute rounded-xl shadow-xl transition-all cursor-pointer z-10 flex flex-col justify-between overflow-hidden border ${
                  isSelected
                    ? 'ring-4 ring-blue-500 border-blue-400 bg-slate-900 shadow-blue-900/50 scale-105'
                    : isCrit
                    ? 'border-rose-500/80 bg-slate-900/95 hover:border-rose-400 hover:shadow-rose-900/40'
                    : 'border-slate-700 bg-slate-900/90 hover:border-blue-500/60 hover:shadow-blue-950/30'
                } ${isDimmed ? 'opacity-35 grayscale-50' : 'opacity-100'}`}
              >
                {/* TOP MATRIX ROW: ES | Duration | EF */}
                <div className="grid grid-cols-3 divide-x divide-slate-800 bg-slate-950/80 border-b border-slate-800 font-mono text-[10px] text-center py-1">
                  <div className="px-1" title="Early Start (ES)">
                    <span className="text-[8px] text-slate-500 block uppercase font-bold">ES</span>
                    <span className="text-emerald-400 font-bold truncate block">
                      {act.earlyStart || act.startPlan}
                    </span>
                  </div>
                  <div className="px-1 bg-slate-900/60" title="Duration">
                    <span className="text-[8px] text-slate-500 block uppercase font-bold">DUR</span>
                    <span className="text-white font-bold block">{duration}d</span>
                  </div>
                  <div className="px-1" title="Early Finish (EF)">
                    <span className="text-[8px] text-slate-500 block uppercase font-bold">EF</span>
                    <span className="text-emerald-400 font-bold truncate block">
                      {act.earlyFinish || act.finishPlan}
                    </span>
                  </div>
                </div>

                {/* MIDDLE CONTENT: Task Name & Codes */}
                <div className="p-2.5 flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isCrit && (
                        <span className="p-0.5 rounded bg-rose-500/20 text-rose-400" title="Critical Path Activity">
                          <Flame className="w-3 h-3" />
                        </span>
                      )}
                      <span className="font-mono text-[10px] font-bold text-blue-400 truncate">
                        {act.wbsCode || act.activityId}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                        {act.contractorId}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-950/60 text-blue-300">
                        {act.pierId}
                      </span>
                    </div>
                  </div>

                  {/* Activity Name */}
                  <h4
                    className={`font-bold text-xs line-clamp-2 leading-snug ${
                      isCrit ? 'text-rose-100' : 'text-slate-100'
                    }`}
                    title={act.activityName}
                  >
                    {act.activityName}
                  </h4>

                  {/* Progress bar */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isCrit ? 'bg-rose-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, act.progressActual)}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono font-semibold text-slate-400">
                      {Math.round(act.progressActual)}%
                    </span>
                  </div>
                </div>

                {/* BOTTOM MATRIX ROW: LS | Total Float (TF) | LF */}
                <div className="grid grid-cols-3 divide-x divide-slate-800 bg-slate-950/80 border-t border-slate-800 font-mono text-[10px] text-center py-1">
                  <div className="px-1" title="Late Start (LS)">
                    <span className="text-[8px] text-slate-500 block uppercase font-bold">LS</span>
                    <span className="text-amber-400 font-bold truncate block">
                      {act.lateStart || act.startPlan}
                    </span>
                  </div>
                  <div
                    className={`px-1 ${
                      isCrit ? 'bg-rose-950/40 text-rose-300' : 'bg-slate-900/60 text-cyan-300'
                    }`}
                    title="Total Float / Slack (TF)"
                  >
                    <span className="text-[8px] text-slate-500 block uppercase font-bold">FLOAT</span>
                    <span className="font-bold block">{act.totalFloat ?? 0}d</span>
                  </div>
                  <div className="px-1" title="Late Finish (LF)">
                    <span className="text-[8px] text-slate-500 block uppercase font-bold">LF</span>
                    <span className="text-amber-400 font-bold truncate block">
                      {act.lateFinish || act.finishPlan}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state when no activities match */}
        {layoutNodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-slate-400">
            <div>
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-amber-500 opacity-60" />
              <h4 className="text-base font-bold text-white mb-1">Tidak ada aktivitas yang sesuai</h4>
              <p className="text-xs">Coba sesuaikan kata kunci pencarian atau filter kontraktor.</p>
            </div>
          </div>
        )}
      </div>

      {/* SIDE DRAWER: SELECTED NODE INSPECTOR */}
      {showNodeDetailsDrawer && selectedNode && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {selectedNode.activity.wbsCode || selectedNode.activity.activityId}
              </span>
              <h3 className="font-bold text-white text-sm">
                Detail Node Aktivitas PDM
              </h3>
              {selectedNode.activity.isCritical && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3" /> Critical Path
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onEditRelationships && (
                <button
                  onClick={() => onEditRelationships(selectedNode.activity)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Kelola Predecessors</span>
                </button>
              )}
              <button
                onClick={() => setShowNodeDetailsDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* Task Info */}
            <div className="md:col-span-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-200 text-xs mb-1">
                {selectedNode.activity.activityName}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500">Pier:</span>
                  <span className="font-mono text-emerald-400 ml-1 font-semibold">{selectedNode.activity.pierId}</span>
                </div>
                <div>
                  <span className="text-slate-500">Kontraktor:</span>
                  <span className="font-semibold text-blue-400 ml-1">{selectedNode.activity.contractorId}</span>
                </div>
                <div>
                  <span className="text-slate-500">Durasi:</span>
                  <span className="font-mono text-white ml-1 font-bold">
                    {selectedNode.activity.duration || calculateDurationDays(selectedNode.activity.startPlan, selectedNode.activity.finishPlan)} Hari
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Bobot Proyek:</span>
                  <span className="font-mono text-emerald-400 ml-1 font-bold">{selectedNode.activity.weight}%</span>
                </div>
              </div>
            </div>

            {/* Precedence Inputs (Predecessors) */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Aktivitas Predecessor ({selectedNode.activity.predecessors?.length || 0})
              </span>
              {(!selectedNode.activity.predecessors || selectedNode.activity.predecessors.length === 0) ? (
                <p className="text-[11px] text-slate-500 italic">Tidak ada (Task Awal / Independen)</p>
              ) : (
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {selectedNode.activity.predecessors.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] font-mono p-1 rounded bg-slate-900 border border-slate-800">
                      <span className="text-blue-300 font-bold truncate max-w-[130px]">{p.predecessorId}</span>
                      <span className="text-cyan-400">{p.type}{p.lagDays ? `+${p.lagDays}d` : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Schedule Times (ES, EF, LS, LF, Float) */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 font-mono text-[11px]">
              <span className="text-[10px] text-slate-400 uppercase font-bold block font-sans">
                Parameter Jadwal CPM
              </span>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <div className="p-1 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block">Early Start (ES)</span>
                  <span className="text-emerald-400 font-bold">{selectedNode.activity.earlyStart || selectedNode.activity.startPlan}</span>
                </div>
                <div className="p-1 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block">Early Finish (EF)</span>
                  <span className="text-emerald-400 font-bold">{selectedNode.activity.earlyFinish || selectedNode.activity.finishPlan}</span>
                </div>
                <div className="p-1 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block">Late Start (LS)</span>
                  <span className="text-amber-400 font-bold">{selectedNode.activity.lateStart || selectedNode.activity.startPlan}</span>
                </div>
                <div className="p-1 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block">Late Finish (LF)</span>
                  <span className="text-amber-400 font-bold">{selectedNode.activity.lateFinish || selectedNode.activity.finishPlan}</span>
                </div>
              </div>
              <div className="pt-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Total Float:</span>
                <span className={`font-bold ${selectedNode.activity.isCritical ? 'text-rose-400' : 'text-cyan-400'}`}>
                  {selectedNode.activity.totalFloat ?? 0} Hari
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
