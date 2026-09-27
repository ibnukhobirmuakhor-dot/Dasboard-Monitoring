import { ActivityItem, TaskDependency, DependencyType, ActivitySlippageAnalysis, BaselineComparisonSummary, SlippageSeverity } from '../types';

/**
 * Format dependencies to MS Project notation: e.g. "2FS+3d", "4SS", "5"
 */
export function formatPredecessors(
  predecessors?: TaskDependency[],
  activityList?: ActivityItem[]
): string {
  if (!predecessors || predecessors.length === 0) return '-';

  return predecessors
    .map(p => {
      // Find row index (1-based) if activityList is provided, otherwise use predecessorId
      let ref = p.predecessorId;
      if (activityList) {
        const idx = activityList.findIndex(a => a.activityId === p.predecessorId);
        if (idx !== -1) {
          ref = `${idx + 1}`;
        }
      }

      const typeStr = p.type === 'FS' && (!p.lagDays || p.lagDays === 0) ? '' : p.type;
      let lagStr = '';
      if (p.lagDays && p.lagDays > 0) {
        lagStr = `+${p.lagDays}d`;
      } else if (p.lagDays && p.lagDays < 0) {
        lagStr = `${p.lagDays}d`;
      }

      return `${ref}${typeStr}${lagStr}`;
    })
    .join(', ');
}

/**
 * Parse MS Project predecessor string (e.g. "1FS+2d, 3SS, 4") into TaskDependency[]
 */
export function parsePredecessors(
  input: string,
  activityList: ActivityItem[]
): TaskDependency[] {
  if (!input || !input.trim() || input === '-') return [];

  const parts = input.split(',').map(s => s.trim()).filter(Boolean);
  const result: TaskDependency[] = [];

  for (const part of parts) {
    // Regex matches: (id/index)(FS|SS|FF|SF)?([+-]\d+d?)?
    const match = part.match(/^([a-zA-Z0-9_\-]+?)(FS|SS|FF|SF)?([+-]\d+)?d?$/i);
    if (!match) continue;

    const rawRef = match[1];
    const rawType = (match[2]?.toUpperCase() || 'FS') as DependencyType;
    const rawLag = match[3] ? parseInt(match[3], 10) : 0;

    let targetActivityId = rawRef;

    // Check if rawRef is numeric row index
    const numericIndex = parseInt(rawRef, 10);
    if (!isNaN(numericIndex) && numericIndex >= 1 && numericIndex <= activityList.length) {
      targetActivityId = activityList[numericIndex - 1].activityId;
    } else {
      // Match by activityId
      const found = activityList.find(a => a.activityId.toLowerCase() === rawRef.toLowerCase());
      if (found) targetActivityId = found.activityId;
    }

    if (targetActivityId) {
      result.push({
        predecessorId: targetActivityId,
        type: rawType,
        lagDays: rawLag
      });
    }
  }

  return result;
}

/**
 * Calculate duration in days between two dates inclusive
 */
export function calculateDurationDays(startDateStr: string, finishDateStr: string): number {
  const start = new Date(startDateStr);
  const finish = new Date(finishDateStr);
  const diffTime = finish.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, isNaN(diffDays) ? 1 : diffDays);
}

/**
 * Add days to a date string (YYYY-MM-DD)
 */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Critical Path Method (CPM) and Float Calculation
 */
export function calculateScheduleNetwork(activities: ActivityItem[]): ActivityItem[] {
  if (activities.length === 0) return [];

  // Create a working clone map
  const actMap = new Map<string, ActivityItem>();
  activities.forEach(a => {
    const dur = a.duration || calculateDurationDays(a.startPlan, a.finishPlan);
    actMap.set(a.activityId, {
      ...a,
      duration: dur,
      earlyStart: a.startPlan,
      earlyFinish: a.finishPlan,
      lateStart: a.startPlan,
      lateFinish: a.finishPlan,
      totalFloat: 0,
      freeFloat: 0,
      isCritical: false
    });
  });

  // Build graph of successors
  const successorsMap = new Map<string, Array<{ id: string; type: DependencyType; lag: number }>>();
  activities.forEach(a => successorsMap.set(a.activityId, []));

  activities.forEach(a => {
    if (a.predecessors) {
      a.predecessors.forEach(p => {
        if (successorsMap.has(p.predecessorId)) {
          successorsMap.get(p.predecessorId)!.push({
            id: a.activityId,
            type: p.type,
            lag: p.lagDays || 0
          });
        }
      });
    }
  });

  // Calculate project finish date
  let maxFinishDate = '';
  actMap.forEach(act => {
    if (!maxFinishDate || act.earlyFinish! > maxFinishDate) {
      maxFinishDate = act.earlyFinish!;
    }
  });

  // Forward Pass (Calculate Early Dates based on dependencies)
  // Simple topological ordering
  const visited = new Set<string>();
  const visitOrder: string[] = [];

  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const act = actMap.get(id);
    if (act?.predecessors) {
      act.predecessors.forEach(p => visit(p.predecessorId));
    }
    visitOrder.push(id);
  }

  activities.forEach(a => visit(a.activityId));

  // Compute Early Starts and Early Finishes
  for (const id of visitOrder) {
    const act = actMap.get(id)!;
    if (act.predecessors && act.predecessors.length > 0) {
      let earliestCandidate = act.startPlan;
      act.predecessors.forEach(pred => {
        const pAct = actMap.get(pred.predecessorId);
        if (!pAct) return;
        const lag = pred.lagDays || 0;
        let candidate = '';
        if (pred.type === 'FS') {
          candidate = addDays(pAct.earlyFinish!, 1 + lag);
        } else if (pred.type === 'SS') {
          candidate = addDays(pAct.earlyStart!, lag);
        } else if (pred.type === 'FF') {
          const reqFinish = addDays(pAct.earlyFinish!, lag);
          candidate = addDays(reqFinish, -act.duration! + 1);
        }
        if (candidate && candidate > earliestCandidate) {
          earliestCandidate = candidate;
        }
      });
      // We keep earlyStart/earlyFinish updated
      act.earlyStart = earliestCandidate;
      act.earlyFinish = addDays(act.earlyStart, act.duration! - 1);
    }
  }

  // Update max finish date after forward pass
  actMap.forEach(act => {
    if (!maxFinishDate || act.earlyFinish! > maxFinishDate) {
      maxFinishDate = act.earlyFinish!;
    }
  });

  // Backward Pass (Calculate Late Dates & Slack/Float)
  const reverseOrder = [...visitOrder].reverse();
  for (const id of reverseOrder) {
    const act = actMap.get(id)!;
    const succs = successorsMap.get(id) || [];
    if (succs.length === 0) {
      act.lateFinish = maxFinishDate;
      act.lateStart = addDays(act.lateFinish, -act.duration! + 1);
    } else {
      let latestCandidate = maxFinishDate;
      succs.forEach(succ => {
        const sAct = actMap.get(succ.id);
        if (!sAct) return;
        let candidate = '';
        if (succ.type === 'FS') {
          candidate = addDays(sAct.lateStart!, -1 - succ.lag);
        } else if (succ.type === 'FF') {
          candidate = addDays(sAct.lateFinish!, -succ.lag);
        } else if (succ.type === 'SS') {
          const reqStart = addDays(sAct.lateStart!, -succ.lag);
          candidate = addDays(reqStart, act.duration! - 1);
        }
        if (candidate && candidate < latestCandidate) {
          latestCandidate = candidate;
        }
      });
      act.lateFinish = latestCandidate;
      act.lateStart = addDays(act.lateFinish, -act.duration! + 1);
    }

    // Total float = Late Start - Early Start
    const startLate = new Date(act.lateStart!).getTime();
    const startEarly = new Date(act.earlyStart!).getTime();
    const floatDays = Math.round((startLate - startEarly) / (1000 * 60 * 60 * 24));
    act.totalFloat = Math.max(0, floatDays);

    // Critical if Total Float is 0 (or <= 2 days for near-critical)
    act.isCritical = act.totalFloat <= 1;
  }

  return Array.from(actMap.values());
}

/**
 * Generate SVG Path for Gantt dependency arrow
 */
export function generateConnectorPath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  type: DependencyType = 'FS'
): string {
  // Arrow radius & offsets
  const cornerRadius = 4;
  const leadGap = 12;

  if (type === 'FS') {
    // Connect from right of predecessor to left of successor
    if (toX >= fromX + leadGap) {
      // Normal forward elbow
      const midX = fromX + (toX - fromX) / 2;
      return `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`;
    } else {
      // Loop around (successor starts earlier than predecessor finish)
      const loopX1 = fromX + leadGap;
      const loopY = fromY + (toY > fromY ? 16 : -16);
      const loopX2 = toX - leadGap;
      return `M ${fromX} ${fromY} L ${loopX1} ${fromY} L ${loopX1} ${loopY} L ${loopX2} ${loopY} L ${loopX2} ${toY} L ${toX} ${toY}`;
    }
  } else if (type === 'SS') {
    // From left of predecessor to left of successor
    const leftX = Math.min(fromX, toX) - leadGap;
    return `M ${fromX} ${fromY} L ${leftX} ${fromY} L ${leftX} ${toY} L ${toX} ${toY}`;
  } else if (type === 'FF') {
    // From right of predecessor to right of successor
    const rightX = Math.max(fromX, toX) + leadGap;
    return `M ${fromX} ${fromY} L ${rightX} ${fromY} L ${rightX} ${toY} L ${toX} ${toY}`;
  }

  return `M ${fromX} ${fromY} L ${toX} ${toY}`;
}

/**
 * Generate MS Project XML schema for direct import into Microsoft Project
 */
export function generateMSProjectXML(activities: ActivityItem[], projectName = 'Proyek HBR II'): string {
  const taskXml = activities
    .map((act, index) => {
      const uid = index + 1;
      const durationHours = (act.duration || 1) * 8;
      
      const predXml = (act.predecessors || [])
        .map(p => {
          const predIdx = activities.findIndex(a => a.activityId === p.predecessorId);
          if (predIdx === -1) return '';
          const predUID = predIdx + 1;
          const typeCode = p.type === 'FF' ? 0 : p.type === 'FS' ? 1 : p.type === 'SF' ? 2 : 3; // 1 = FS, 3 = SS, 0 = FF, 2 = SF in MS Project XML
          const lagMinutes = (p.lagDays || 0) * 8 * 60;
          return `
        <PredecessorLink>
          <PredecessorUID>${predUID}</PredecessorUID>
          <Type>${typeCode}</Type>
          <LinkLag>${lagMinutes}</LinkLag>
          <LagFormat>7</LagFormat>
        </PredecessorLink>`;
        })
        .join('');

      return `
    <Task>
      <UID>${uid}</UID>
      <ID>${uid}</ID>
      <Name>${act.activityName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Name>
      <WBS>${act.wbsCode || `1.${uid}`}</WBS>
      <Start>${act.startPlan}T08:00:00</Start>
      <Finish>${act.finishPlan}T17:00:00</Finish>
      <Duration>PT${durationHours}H0M0S</Duration>
      <PercentComplete>${Math.round(act.progressActual)}</PercentComplete>
      <Milestone>${act.isMilestone ? 1 : 0}</Milestone>
      <Critical>${act.isCritical ? 1 : 0}</Critical>
      ${predXml}
    </Task>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <Name>${projectName}</Name>
  <Title>${projectName}</Title>
  <Tasks>${taskXml}
  </Tasks>
</Project>`;
}

export function downloadFile(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Difference in days between two YYYY-MM-DD date strings (dateA - dateB)
 * Positive means dateA is AFTER dateB (delay / slippage)
 */
export function getDaysDiff(dateAStr: string, dateBStr: string): number {
  if (!dateAStr || !dateBStr) return 0;
  const dateA = new Date(dateAStr);
  const dateB = new Date(dateBStr);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((dateA.getTime() - dateB.getTime()) / msPerDay);
}

/**
 * Compare Current Progress and Schedule against Original Baseline (Baseline 0)
 * Evaluates Start Variance, Finish Variance, and Progress Deviation (% actual vs plan)
 */
export function calculateScheduleSlippage(activities: ActivityItem[]): BaselineComparisonSummary {
  if (!activities || activities.length === 0) {
    return {
      totalActivities: 0,
      aheadCount: 0,
      onTrackCount: 0,
      minorSlippageCount: 0,
      criticalSlippageCount: 0,
      maxSlippageDays: 0,
      averageSlippageDays: 0,
      criticalPathSlippageDays: 0,
      overallScheduleStatus: 'on_track',
      activities: []
    };
  }

  const analysisList: ActivitySlippageAnalysis[] = [];
  let aheadCount = 0;
  let onTrackCount = 0;
  let minorSlippageCount = 0;
  let criticalSlippageCount = 0;
  let maxSlippageDays = 0;
  let totalSlippageDays = 0;
  let criticalPathSlippageDays = 0;

  activities.forEach(act => {
    // Determine baseline dates (fallback to initial startPlan/finishPlan if unassigned)
    const baseStart = act.baselineStart || act.startPlan;
    const baseFinish = act.baselineFinish || act.finishPlan;
    const baseDuration = act.baselineDuration || calculateDurationDays(baseStart, baseFinish);

    // Current schedule dates
    const curStart = act.startPlan;
    const curFinish = act.finishPlan;
    const curDuration = act.duration || calculateDurationDays(curStart, curFinish);

    // Variances in days
    const startVariance = getDaysDiff(curStart, baseStart);
    const finishVariance = getDaysDiff(curFinish, baseFinish);
    const durationVariance = curDuration - baseDuration;
    const progressVariance = Number(((act.progressActual ?? 0) - (act.progressPlan ?? 0)).toFixed(2));

    // Determine primary slippage days
    // If finished, compare actual finish vs baseline; otherwise compare planned/forecast finish vs baseline
    let primarySlippage = finishVariance;
    if (act.status === 'Completed' && act.finishActual) {
      primarySlippage = getDaysDiff(act.finishActual, baseFinish);
    }

    // Determine severity
    let severity: SlippageSeverity = 'on_track';
    const isCrit = !!act.isCritical;

    if (primarySlippage <= -2 || (progressVariance >= 5 && primarySlippage <= 0)) {
      severity = 'ahead';
      aheadCount++;
    } else if (primarySlippage === 0 && progressVariance >= -2) {
      severity = 'on_track';
      onTrackCount++;
    } else if (
      (primarySlippage > 0 && primarySlippage <= 7 && !isCrit) ||
      (progressVariance < -2 && progressVariance >= -10 && !isCrit)
    ) {
      severity = 'minor_slippage';
      minorSlippageCount++;
    } else {
      // Major slippage (> 7 days, or severe progress delay < -10%, or any slippage on critical path)
      severity = 'critical_slippage';
      criticalSlippageCount++;
    }

    if (primarySlippage > maxSlippageDays) {
      maxSlippageDays = primarySlippage;
    }
    if (primarySlippage > 0) {
      totalSlippageDays += primarySlippage;
    }
    if (isCrit && primarySlippage > criticalPathSlippageDays) {
      criticalPathSlippageDays = primarySlippage;
    }

    // Human-readable summary
    let summary = 'Sesuai Baseline';
    if (primarySlippage > 0) {
      summary = `Terlambat ${primarySlippage} hari dari baseline (${baseFinish} → ${curFinish})`;
    } else if (primarySlippage < 0) {
      summary = `Lebih awal ${Math.abs(primarySlippage)} hari dari baseline`;
    } else if (progressVariance < -3) {
      summary = `Deviasi progres ${progressVariance}% di bawah target`;
    }

    analysisList.push({
      activityId: act.activityId,
      wbsCode: act.wbsCode,
      activityName: act.activityName,
      pierId: act.pierId,
      contractorId: act.contractorId,
      weight: act.weight || 0,
      status: act.status,
      isCritical: isCrit,

      baselineStart: baseStart,
      baselineFinish: baseFinish,
      baselineDuration: baseDuration,

      currentStart: curStart,
      currentFinish: curFinish,
      currentDuration: curDuration,
      startActual: act.startActual,
      finishActual: act.finishActual,
      progressPlan: act.progressPlan ?? 0,
      progressActual: act.progressActual ?? 0,

      startVarianceDays: startVariance,
      finishVarianceDays: finishVariance,
      durationVarianceDays: durationVariance,
      progressVariance,

      slippageDays: primarySlippage,
      severity,
      slippageSummary: summary,
      impactsCriticalPath: isCrit && primarySlippage > 0
    });
  });

  // Calculate average slippage among slipped activities or total
  const avgSlippage = activities.length > 0 ? Number((totalSlippageDays / activities.length).toFixed(1)) : 0;

  // Overall schedule status
  let overallStatus: SlippageSeverity = 'on_track';
  if (criticalSlippageCount > 0 || criticalPathSlippageDays > 3) {
    overallStatus = 'critical_slippage';
  } else if (minorSlippageCount > 0) {
    overallStatus = 'minor_slippage';
  } else if (aheadCount > onTrackCount) {
    overallStatus = 'ahead';
  }

  return {
    totalActivities: activities.length,
    aheadCount,
    onTrackCount,
    minorSlippageCount,
    criticalSlippageCount,
    maxSlippageDays,
    averageSlippageDays: avgSlippage,
    criticalPathSlippageDays,
    overallScheduleStatus: overallStatus,
    activities: analysisList
  };
}

/**
 * Capture current schedule as the original baseline (Baseline Snapshot)
 */
export function setBaselineSnapshot(activities: ActivityItem[]): ActivityItem[] {
  return activities.map(act => ({
    ...act,
    baselineStart: act.startPlan,
    baselineFinish: act.finishPlan,
    baselineDuration: act.duration || calculateDurationDays(act.startPlan, act.finishPlan),
    baselineProgressPlan: act.progressPlan
  }));
}

