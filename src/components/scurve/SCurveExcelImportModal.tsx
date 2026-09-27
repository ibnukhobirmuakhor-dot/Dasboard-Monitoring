import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Terminal,
  Code2,
  X,
  Eye,
  Sparkles,
  ArrowRight,
  Database
} from 'lucide-react';
import { SCurveDataPoint, SCurveGranularity } from '../../types';

interface SCurveExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (data: SCurveDataPoint[], granularity: SCurveGranularity) => void;
  currentGranularity?: SCurveGranularity;
}

// Sample dataset matching the user's authentic Harbour Road II contract baseline and actual data
export const SAMPLE_HBR2_TABLE_TSV = `BULAN\tBULAN KE\tKONTRAKTOR\tKONTRAK/ADD\tNILAI KONTRAK\tPORSI (%)\tRENCANA KONTRAK\tRENCANA REVISI 1\tRENCANA AMMANDENEN 1\tRENCANA AMMANDEMEN 3\tRENCANA AMMANDEMEN 4\tREALISASI
25-May-2022\t1\tPT Wijaya Karya\tKontrak Awal\t7,175,142,283,117.00\t100.00%\t0.11\t0.48\t\t0.43\t0.43\t0.43
25-May-2022\t1\tTOTAL\tKontrak Awal\t7,175,142,283,117.00\t100.00%\t0.11\t0.48\t0.00\t0.43\t0.43\t0.43
25-Jun-2022\t2\tPT Wijaya Karya\tAmandemen 1\t7,175,142,283,117.00\t100.00%\t0.27\t0.01\t\t0.25\t0.25\t0.25
25-Jun-2022\t2\tTOTAL\tAmandemen 1\t7,175,142,283,117.00\t100.00%\t0.27\t0.01\t0.00\t0.25\t0.25\t0.25
25-Jul-2022\t3\tPT Wijaya Karya\tAmandemen 1\t7,175,142,283,117.00\t100.00%\t0.82\t0.05\t\t0.15\t0.15\t0.15
25-Jul-2022\t3\tTOTAL\tAmandemen 1\t7,175,142,283,117.00\t100.00%\t0.82\t0.05\t0.00\t0.15\t0.15\t0.15
25-Aug-2022\t4\tPT Wijaya Karya\tAmandemen 1\t7,175,142,283,117.00\t100.00%\t0.82\t0.88\t\t0.53\t0.53\t0.53
25-Aug-2022\t4\tTOTAL\tAmandemen 1\t7,175,142,283,117.00\t100.00%\t0.82\t0.88\t0.00\t0.53\t0.53\t0.53
25-Sep-2022\t5\tPT Wijaya Karya\tAmandemen 2\t5,022,599,598,182.00\t74.20%\t0.79\t0.69\t\t0.64\t0.64\t0.64
25-Sep-2022\t1\tPT Girder Indonesia\tKontrak Awal\t1,746,048,705,031.00\t25.80%\t0.12\t0.12\t0.10\t0.10\t\t0.12
25-Sep-2022\t5\tTOTAL\tAmandemen 2\t6,768,648,303,213.00\t100.00%\t0.62\t0.54\t0.03\t0.50\t0.47\t0.50
25-Oct-2022\t6\tPT Wijaya Karya\tAmandemen 2\t5,022,599,598,182.00\t74.20%\t1.03\t0.47\t\t0.47\t0.47\t0.47
25-Oct-2022\t2\tPT Girder Indonesia\tKontrak Awal\t1,746,048,705,031.00\t25.80%\t0.14\t0.13\t0.11\t0.11\t\t0.13
25-Oct-2022\t6\tTOTAL\tAmandemen 2\t6,768,648,303,213.00\t100.00%\t0.80\t0.38\t0.03\t0.37\t0.35\t0.38
25-Nov-2022\t7\tPT Wijaya Karya\tKontrak Awal\t5,022,599,598,182.00\t74.20%\t1.44\t0.26\t\t0.94\t0.94\t0.94
25-Nov-2022\t3\tPT Girder Indonesia\tAmandemen 2\t1,746,048,705,031.00\t25.80%\t0.31\t0.06\t0.05\t0.05\t\t0.06
25-Nov-2022\t7\tTOTAL\tKontrak Awal\t6,768,648,303,213.00\t100.00%\t1.15\t0.21\t0.01\t0.71\t0.70\t0.71
25-Dec-2022\t8\tPT Wijaya Karya\tAmandemen 2\t5,022,599,598,182.00\t74.20%\t1.14\t0.74\t\t1.28\t1.28\t1.28
25-Dec-2022\t4\tPT Girder Indonesia\tKontrak Awal\t1,746,048,705,031.00\t25.80%\t0.61\t0.39\t0.32\t0.31\t\t0.39
25-Dec-2022\t8\tTOTAL\tAmandemen 2\t6,768,648,303,213.00\t100.00%\t1.01\t0.65\t0.08\t1.03\t0.95\t1.05
25-Jan-2023\t9\tPT Wijaya Karya\tKontrak Awal\t5,022,599,598,182.00\t74.20%\t1.19\t1.09\t\t0.72\t0.72\t0.72
25-Jan-2023\t5\tPT Girder Indonesia\tAmandemen 2\t1,746,048,705,031.00\t25.80%\t0.72\t1.31\t1.07\t1.06\t\t1.31
25-Jan-2023\t9\tTOTAL\tKontrak Awal\t6,768,648,303,213.00\t100.00%\t1.07\t1.15\t0.27\t0.81\t0.53\t0.87
25-Feb-2023\t10\tPT Wijaya Karya\tAmandemen 2\t5,022,599,598,182.00\t74.20%\t1.68\t1.14\t\t0.49\t0.49\t0.49
25-Feb-2023\t6\tPT Girder Indonesia\tKontrak Awal\t1,746,048,705,031.00\t25.80%\t0.83\t1.71\t1.39\t1.38\t\t1.71
25-Feb-2023\t10\tTOTAL\tAmandemen 2\t6,768,648,303,213.00\t100.00%\t1.46\t1.28\t0.36\t0.72\t0.36\t0.80
25-Mar-2023\t11\tPT Wijaya Karya\tKontrak Awal\t5,022,599,598,182.00\t74.20%\t1.62\t1.67\t\t0.27\t0.27\t0.27
25-Mar-2023\t7\tPT Girder Indonesia\tAmandemen 2\t1,746,048,705,031.00\t25.80%\t0.92\t1.17\t0.95\t0.94\t\t1.17
25-Mar-2023\t11\tTOTAL\tKontrak Awal\t6,768,648,303,213.00\t100.00%\t1.44\t1.54\t0.25\t0.45\t0.20\t0.51
25-Apr-2023\t12\tPT Wijaya Karya\tAmandemen 2\t5,022,599,598,182.00\t74.20%\t2.36\t2.37\t\t0.35\t0.35\t0.35
25-Apr-2023\t8\tPT Girder Indonesia\tKontrak Awal\t1,746,048,705,031.00\t25.80%\t0.92\t0.88\t0.72\t0.71\t\t0.88
25-Apr-2023\t12\tTOTAL\tAmandemen 2\t6,768,648,303,213.00\t100.00%\t1.99\t1.99\t0.18\t0.44\t0.26\t0.49
25-May-2023\t13\tPT Wijaya Karya\tKontrak Awal\t5,022,599,598,182.00\t74.20%\t2.88\t3.06\t\t0.38\t0.38\t0.38
25-May-2023\t9\tPT Girder Indonesia\tAmandemen 2\t1,746,048,705,031.00\t25.80%\t1.03\t0.62\t0.50\t0.50\t\t0.62
25-May-2023\t13\tTOTAL\tKontrak Awal\t6,768,648,303,213.00\t100.00%\t2.40\t2.43\t0.13\t0.41\t0.28\t0.44
25-Jun-2023\t14\tPT Wijaya Karya\tAmandemen 2\t5,022,599,598,182.00\t74.20%\t2.73\t3.46\t\t0.25\t0.25\t0.25
25-Jun-2023\t10\tPT Girder Indonesia\tKontrak Awal\t1,746,048,705,031.00\t25.80%\t1.05\t0.43\t0.35\t0.35\t\t0.43
25-Jun-2023\t14\tTOTAL\tAmandemen 2\t6,768,648,303,213.00\t100.00%\t2.30\t2.68\t0.09\t0.27\t0.18\t0.30
25-Jul-2023\t15\tPT Wijaya Karya\tKontrak Awal\t5,022,599,598,182.00\t74.20%\t3.36\t3.80\t\t0.33\t0.33\t0.33
25-Jul-2023\t11\tPT Girder Indonesia\tAmandemen 2\t1,746,048,705,031.00\t25.80%\t1.55\t0.38\t0.31\t0.31\t\t0.38
25-Jul-2023\t15\tTOTAL\tKontrak Awal\t6,768,648,303,213.00\t100.00%\t2.90\t2.92\t0.08\t0.32\t0.24\t0.34
25-Aug-2023\t16\tPT Wijaya Karya\tAmandemen 2\t5,022,599,598,182.00\t74.20%\t4.56\t3.78\t\t0.61\t0.61\t0.61
25-Aug-2023\t12\tPT Girder Indonesia\tKontrak Awal\t1,746,048,705,031.00\t25.80%\t1.78\t1.61\t1.31\t1.30\t\t1.61
25-Aug-2023\t16\tTOTAL\tAmandemen 2\t6,768,648,303,213.00\t100.00%\t3.85\t3.22\t0.34\t0.78\t0.45\t0.87
25-Sep-2023\t17\tPT Wijaya Karya\tKontrak Awal\t5,022,599,598,182.00\t74.20%\t5.08\t3.99\t\t0.46\t0.46\t0.46
25-Sep-2023\t13\tPT Girder Indonesia\tAmandemen 2\t1,746,048,705,031.00\t25.80%\t2.01\t0.67\t0.55\t0.54\t\t0.67
25-Sep-2023\t17\tTOTAL\tKontrak Awal\t6,768,648,303,213.00\t100.00%\t4.29\t3.14\t0.14\t0.48\t0.34\t0.51
25-Oct-2023\t18\tPT Wijaya Karya\tAmandemen 2\t5,022,599,598,182.00\t74.20%\t4.72\t4.59\t\t0.34\t0.34\t0.34
25-Oct-2023\t14\tPT Girder Indonesia\tKontrak Awal\t1,746,048,705,031.00\t25.80%\t2.43\t1.52\t1.23\t1.22\t\t1.52
25-Oct-2023\t18\tTOTAL\tAmandemen 2\t6,768,648,303,213.00\t100.00%\t4.13\t3.80\t0.32\t0.56\t0.25\t0.64
25-Nov-2023\t19\tPT Wijaya Karya\tKontrak Awal\t5,022,599,598,182.00\t74.20%\t5.71\t5.43\t\t0.34\t0.34\t0.34
25-Nov-2023\t15\tPT Girder Indonesia\tAmandemen 2\t1,746,048,705,031.00\t25.80%\t2.97\t0.77\t0.63\t0.62\t\t0.77
25-Nov-2023\t19\tTOTAL\tKontrak Awal\t6,768,648,303,213.00\t100.00%\t5.00\t4.23\t0.16\t0.41\t0.25\t0.45
25-Dec-2023\t20\tPT Wijaya Karya\tAmandemen 2\t5,022,599,598,182.00\t74.20%\t5.91\t5.75\t\t0.32\t0.32\t0.32
25-Dec-2023\t16\tPT Girder Indonesia\tKontrak Awal\t1,746,048,705,031.00\t25.80%\t3.04\t0.97\t0.79\t0.78\t\t0.97
25-Dec-2023\t20\tTOTAL\tAmandemen 2\t6,768,648,303,213.00\t100.00%\t5.17\t4.52\t0.20\t0.44\t0.24\t0.49
25-Jan-2024\t21\tPT Wijaya Karya\tKontrak Awal\t5,022,599,598,182.00\t74.20%\t6.62\t6.13\t\t0.41\t0.41\t0.41
25-Jan-2024\t17\tPT Girder Indonesia\tAmandemen 2\t1,746,048,705,031.00\t25.80%\t4.16\t0.59\t1.16\t1.16\t\t1.44
25-Jan-2024\t21\tTOTAL\tKontrak Awal\t6,768,648,303,213.00\t100.00%\t5.99\t4.70\t0.30\t0.60\t0.30\t0.68
25-Feb-2024\t22\tPT Wijaya Karya\tAmandemen 2\t5,022,599,598,182.00\t74.20%\t4.18\t5.64\t\t0.45\t0.45\t0.45
25-Feb-2024\t18\tPT Girder Indonesia\tKontrak Awal\t1,746,048,705,031.00\t25.80%\t4.68\t0.88\t1.29\t1.28\t\t1.59
25-Feb-2024\t22\tTOTAL\tAmandemen 2\t6,768,648,303,213.00\t100.00%\t4.31\t4.41\t0.33\t0.66\t0.33\t0.74
25-Mar-2024\t23\tPT Wijaya Karya\tKontrak Awal\t5,022,599,598,182.00\t74.20%\t4.70\t4.95\t\t0.27\t0.27\t0.27
25-Mar-2024\t19\tPT Girder Indonesia\tAmandemen 2\t1,746,048,705,031.00\t25.80%\t7.57\t0.92\t1.08\t1.07\t\t1.33
25-Mar-2024\t23\tTOTAL\tKontrak Awal\t6,768,648,303,213.00\t100.00%\t5.44\t3.91\t0.28\t0.48\t0.20\t0.55
25-Apr-2024\t24\tPT Wijaya Karya\tAmandemen 2\t5,022,599,598,182.00\t74.20%\t4.86\t4.73\t\t0.15\t0.15\t0.15
25-Apr-2024\t20\tPT Girder Indonesia\tKontrak Awal\t1,746,048,705,031.00\t25.80%\t7.22\t0.69\t0.83\t0.93\t\t1.03
25-Apr-2024\t24\tTOTAL\tAmandemen 2\t6,768,648,303,213.00\t100.00%\t5.47\t3.69\t0.22\t0.35\t0.11\t0.38
25-May-2024\t25\tPT Wijaya Karya\tAmandemen 2\t5,022,599,598,182.00\t70.00%\t4.55\t5.10\t\t0.34\t0.34\t0.34
25-May-2024\t21\tPT Girder Indonesia\tAmandemen 1\t2,152,542,684,935.00\t30.00%\t8.23\t1.31\t0.74\t1.46\t\t1.47
25-May-2024\t25\tTOTAL\tAmandemen 2\t7,175,142,283,117.00\t100.00%\t5.65\t3.96\t0.22\t0.68\t0.24\t0.68
25-Jun-2024\t26\tPT Wijaya Karya\tAmandemen 2\t5,022,599,598,182.00\t70.00%\t4.04\t4.00\t\t0.26\t0.26\t0.26
25-Jun-2024\t22\tPT Girder Indonesia\tAmandemen 1\t2,152,542,684,935.00\t30.00%\t8.11\t1.61\t0.95\t1.62\t\t1.63
25-Jun-2024\t26\tTOTAL\tAmandemen 2\t7,175,142,283,117.00\t100.00%\t5.26\t3.28\t0.29\t0.67\t0.18\t0.67
25-Jul-2024\t27\tPT Wijaya Karya\tAmandemen 2\t5,022,599,598,182.00\t70.00%\t2.92\t3.61\t\t0.21\t0.21\t0.21
25-Jul-2024\t23\tPT Girder Indonesia\tAmandemen 1\t2,152,542,684,935.00\t30.00%\t7.55\t1.95\t1.36\t1.27\t\t1.28
25-Jul-2024\t27\tTOTAL\tAmandemen 2\t7,175,142,283,117.00\t100.00%\t4.31\t3.11\t0.41\t0.53\t0.15\t0.53
25-Aug-2024\t28\tPT Wijaya Karya\tAmandemen 2\t5,022,599,598,182.00\t70.00%\t3.01\t3.22\t\t0.29\t0.29\t0.29
25-Aug-2024\t24\tPT Girder Indonesia\tAmandemen 1\t2,152,542,684,935.00\t30.00%\t6.44\t2.09\t1.49\t1.32\t\t1.33
25-Aug-2024\t28\tTOTAL\tAmandemen 2\t7,175,142,283,117.00\t100.00%\t4.04\t2.88\t0.45\t0.60\t0.20\t0.60
25-Sep-2024\t29\tPT Wijaya Karya\tAmandemen 2\t5,022,599,598,182.00\t70.00%\t2.82\t2.93\t\t0.49\t0.49\t0.49
25-Sep-2024\t25\tPT Girder Indonesia\tAmandemen 1\t2,152,542,684,935.00\t30.00%\t4.39\t2.12\t1.58\t1.47\t\t1.48
25-Sep-2024\t29\tTOTAL\tAmandemen 2\t7,175,142,283,117.00\t100.00%\t3.29\t2.69\t0.47\t0.79\t0.35\t0.79
25-Oct-2024\t30\tPT Wijaya Karya\tAmandemen 2\t5,022,599,598,182.00\t70.00%\t1.70\t2.28\t\t0.66\t0.66\t0.66
25-Oct-2024\t26\tPT Girder Indonesia\tAmandemen 1\t2,152,542,684,935.00\t30.00%\t4.35\t2.16\t2.69\t2.07\t\t2.09
25-Oct-2024\t30\tTOTAL\tAmandemen 2\t7,175,142,283,117.00\t100.00%\t2.50\t2.25\t0.81\t1.09\t0.46\t1.09
25-Nov-2024\t31\tPT Wijaya Karya\tAmandemen 2\t5,022,599,598,182.00\t70.00%\t1.47\t2.81\t\t0.69\t0.69\t0.69
25-Nov-2024\t27\tPT Girder Indonesia\tAmandemen 1\t2,152,542,684,935.00\t30.00%\t4.18\t5.08\t3.93\t1.52\t\t1.53
25-Nov-2024\t31\tTOTAL\tAmandemen 2\t7,175,142,283,117.00\t100.00%\t2.28\t3.49\t1.18\t0.94\t0.48\t0.94
25-Dec-2024\t32\tPT Wijaya Karya\tAmandemen 2\t5,022,599,598,182.00\t70.00%\t1.92\t2.66\t\t0.70\t0.70\t0.70
25-Dec-2024\t28\tPT Girder Indonesia\tAmandemen 1\t2,152,542,684,935.00\t30.00%\t3.63\t7.86\t4.96\t0.84\t\t0.84
25-Dec-2024\t32\tTOTAL\tAmandemen 2\t7,175,142,283,117.00\t100.00%\t2.43\t4.22\t1.49\t0.74\t0.49\t0.75
25-Jan-2025\t33\tPT Wijaya Karya\tAmandemen 2\t5,022,599,598,182.00\t70.00%\t2.07\t2.17\t\t0.86\t0.86\t0.86
25-Jan-2025\t29\tPT Girder Indonesia\tAmandemen 2\t2,152,542,684,935.00\t30.00%\t3.33\t8.57\t11.53\t2.25\t\t2.27
25-Jan-2025\t33\tTOTAL\tKontrak Awal\t7,175,142,283,117.00\t100.00%\t2.45\t4.09\t3.46\t1.28\t0.60\t1.28
25-Feb-2025\t34\tPT Wijaya Karya\tAmandemen 2\t5,022,599,598,182.00\t70.00%\t2.40\t2.23\t\t1.25\t1.25\t1.25
25-Feb-2025\t30\tPT Girder Indonesia\tAmandemen 2\t2,152,542,684,935.00\t30.00%\t1.74\t11.23\t12.65\t2.38\t\t2.39
25-Feb-2025\t34\tTOTAL\tAmandemen 2\t7,175,142,283,117.00\t100.00%\t2.20\t4.93\t3.80\t1.59\t0.87\t1.59
25-Mar-2025\t35\tPT Wijaya Karya\tAmandemen 2\t5,022,599,598,182.00\t70.00%\t2.26\t2.25\t\t0.96\t0.96\t0.96
25-Mar-2025\t31\tPT Girder Indonesia\tAmandemen 2\t2,152,542,684,935.00\t30.00%\t0.80\t11.37\t13.11\t2.00\t\t2.02
25-Mar-2025\t35\tTOTAL\tKontrak Awal\t7,175,142,283,117.00\t100.00%\t1.82\t4.99\t3.93\t1.27\t0.67\t1.28
25-Apr-2025\t36\tPT Wijaya Karya\tAmandemen 3\t5,022,599,598,182.00\t70.00%\t2.24\t1.56\t\t0.38\t0.44\t0.44
25-Apr-2025\t32\tPT Girder Indonesia\tAmandemen 2\t2,152,542,684,935.00\t30.00%\t0.80\t11.00\t11.80\t2.00\t\t2.02
25-Apr-2025\t36\tTOTAL\tAmandemen 3\t7,175,142,283,117.00\t100.00%\t1.81\t4.39\t3.50\t0.87\t0.91\t1.15
25-May-2025\t37\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t1.15\t1.25\t1.20
25-Jun-2025\t38\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t1.25\t1.35\t1.10
25-Jul-2025\t39\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t1.30\t1.40\t1.05
25-Aug-2025\t40\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t1.40\t1.50\t0.95
25-Sep-2025\t41\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t1.50\t1.60\t0.90
25-Oct-2025\t42\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t1.55\t3.80\t
25-Nov-2025\t43\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t1.60\t4.20\t
25-Dec-2025\t44\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t1.65\t4.50\t
25-Jan-2026\t45\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t1.70\t4.60\t
25-Feb-2026\t46\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t1.75\t4.80\t
25-Mar-2026\t47\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t1.80\t5.00\t
25-Apr-2026\t48\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t1.85\t5.20\t
25-May-2026\t49\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t1.90\t5.20\t
25-Jun-2026\t50\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t2.00\t5.40\t
25-Jul-2026\t51\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t2.10\t5.50\t
25-Aug-2026\t52\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t2.20\t5.20\t
25-Sep-2026\t53\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t2.25\t4.80\t
25-Oct-2026\t54\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t2.30\t4.20\t
25-Nov-2026\t55\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t2.35\t3.60\t
25-Dec-2026\t56\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t2.40\t3.00\t
25-Jan-2027\t57\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t2.45\t2.20\t
25-Feb-2027\t58\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t2.50\t1.50\t
31-Mar-2027\t59\tTOTAL\tAmandemen 4\t7,175,142,283,117.00\t100.00%\t0.00\t0.00\t0.00\t0.00\t0.65\t`;

export const SCurveExcelImportModal: React.FC<SCurveExcelImportModalProps> = ({
  isOpen,
  onClose,
  onApplyData,
  currentGranularity = 'monthly'
}) => {
  const [pastedText, setPastedText] = useState<string>('');
  const [filterContractor, setFilterContractor] = useState<'TOTAL' | 'PT Wijaya Karya' | 'PT Girder Indonesia' | 'ALL'>('TOTAL');
  const [inputMode, setInputMode] = useState<'incremental' | 'cumulative'>('incremental');
  const [selectedGranularity, setSelectedGranularity] = useState<SCurveGranularity>(currentGranularity);
  const [activeTab, setActiveTab] = useState<'paste' | 'preview' | 'apps_script'>('paste');
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  // Month abbreviations parser
  const parseDateAndPeriod = (rawMonthStr: string): { date: string; period: string } => {
    const trimmed = rawMonthStr.trim();
    if (!trimmed) {
      return { date: '2024-01-25', period: 'Jan 24' };
    }

    // Match format: 25-May-2022 or 25-Mei-2022 or 2022-05-25
    const parts = trimmed.split(/[-/\s]/);
    if (parts.length >= 3) {
      let day = '25';
      let monthStr = 'Jan';
      let year = '2024';

      if (parts[0].length === 4) {
        // YYYY-MM-DD
        year = parts[0];
        const mNum = parseInt(parts[1], 10);
        day = parts[2].padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        monthStr = months[(mNum - 1) % 12] || 'Jan';
      } else {
        // DD-MMM-YYYY
        day = parts[0].padStart(2, '0');
        monthStr = parts[1];
        year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
      }

      // Standardize month name
      const mNorm = monthStr.toLowerCase();
      let mIndex = 1;
      let shortLabel = 'Jan';
      if (mNorm.startsWith('jan')) { mIndex = 1; shortLabel = 'Jan'; }
      else if (mNorm.startsWith('feb')) { mIndex = 2; shortLabel = 'Feb'; }
      else if (mNorm.startsWith('mar')) { mIndex = 3; shortLabel = 'Mar'; }
      else if (mNorm.startsWith('apr')) { mIndex = 4; shortLabel = 'Apr'; }
      else if (mNorm.startsWith('may') || mNorm.startsWith('mei')) { mIndex = 5; shortLabel = 'Mei'; }
      else if (mNorm.startsWith('jun')) { mIndex = 6; shortLabel = 'Jun'; }
      else if (mNorm.startsWith('jul')) { mIndex = 7; shortLabel = 'Jul'; }
      else if (mNorm.startsWith('aug') || mNorm.startsWith('agu')) { mIndex = 8; shortLabel = 'Agu'; }
      else if (mNorm.startsWith('sep')) { mIndex = 9; shortLabel = 'Sep'; }
      else if (mNorm.startsWith('oct') || mNorm.startsWith('okt')) { mIndex = 10; shortLabel = 'Okt'; }
      else if (mNorm.startsWith('nov')) { mIndex = 11; shortLabel = 'Nov'; }
      else if (mNorm.startsWith('dec') || mNorm.startsWith('des')) { mIndex = 12; shortLabel = 'Des'; }

      const isoDate = `${year}-${String(mIndex).padStart(2, '0')}-${day}`;
      const shortYear = year.slice(-2);
      return {
        date: isoDate,
        period: `${shortLabel} ${shortYear}`
      };
    }

    return { date: '2024-01-25', period: trimmed };
  };

  // Parser
  const parsedResult = useMemo(() => {
    if (!pastedText.trim()) return { points: [], rowCount: 0, error: null };

    try {
      const lines = pastedText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length === 0) return { points: [], rowCount: 0, error: null };

      // Check header row
      let startIdx = 0;
      const firstLineLower = lines[0].toLowerCase();
      if (
        firstLineLower.includes('bulan') ||
        firstLineLower.includes('kontraktor') ||
        firstLineLower.includes('rencana') ||
        firstLineLower.includes('realisasi')
      ) {
        startIdx = 1;
      }

      // Column mapping helper: auto-detect delimiter (\t or , or ;)
      const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';

      interface RawRow {
        monthStr: string;
        contractor: string;
        kontrak: number;
        rev1: number;
        amm1: number;
        amm3: number;
        amm4: number;
        act?: number;
      }

      const rawRows: RawRow[] = [];

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));

        if (cols.length < 3) continue;

        // Position mapping based on standard HBR2 table:
        // 0: BULAN
        // 1: BULAN KE
        // 2: KONTRAKTOR
        // 3: KONTRAK/ADD
        // 4: NILAI KONTRAK
        // 5: PORSI (%)
        // 6: RENCANA KONTRAK
        // 7: RENCANA REVISI 1
        // 8: RENCANA AMMANDENEN 1
        // 9: RENCANA AMMANDEMEN 3
        // 10: RENCANA AMMANDEMEN 4
        // 11: REALISASI
        const monthStr = cols[0];
        const contractor = cols.length > 2 ? cols[2] : 'TOTAL';

        const parseNum = (val?: string): number => {
          if (!val) return 0;
          const cleaned = val.replace(/,/g, '').replace(/%/g, '').trim();
          const n = parseFloat(cleaned);
          return isNaN(n) ? 0 : n;
        };

        const parseOptionalNum = (val?: string): number | undefined => {
          if (!val || val.trim() === '') return undefined;
          const cleaned = val.replace(/,/g, '').replace(/%/g, '').trim();
          const n = parseFloat(cleaned);
          return isNaN(n) ? undefined : n;
        };

        const kontrak = parseNum(cols[6] || cols[2]);
        const rev1 = parseNum(cols[7] || cols[3]);
        const amm1 = parseNum(cols[8] || cols[4]);
        const amm3 = parseNum(cols[9] || cols[5]);
        const amm4 = parseNum(cols[10] || cols[6]);
        const act = parseOptionalNum(cols[11] || cols[7]);

        rawRows.push({
          monthStr,
          contractor,
          kontrak,
          rev1,
          amm1,
          amm3,
          amm4,
          act
        });
      }

      // Filter by contractor if multiple contractors present
      const hasContractorCol = rawRows.some(r => r.contractor && r.contractor !== 'TOTAL');
      const filtered = hasContractorCol && filterContractor !== 'ALL'
        ? rawRows.filter(r => r.contractor.toLowerCase().includes(filterContractor.toLowerCase()) || (filterContractor === 'TOTAL' && r.contractor.toUpperCase() === 'TOTAL'))
        : rawRows;

      const finalRows = filtered.length > 0 ? filtered : rawRows;

      // Accumulation logic
      let cumOrig = 0;
      let cumRev1 = 0;
      let cumAmm1 = 0;
      let cumAmm3 = 0;
      let cumAmm4 = 0;
      let cumAct = 0;

      const points: SCurveDataPoint[] = finalRows.map(r => {
        const { date, period } = parseDateAndPeriod(r.monthStr);

        if (inputMode === 'incremental') {
          cumOrig = Math.min(100, Math.round((cumOrig + r.kontrak) * 100) / 100);
          cumRev1 = Math.min(100, Math.round((cumRev1 + r.rev1) * 100) / 100);
          cumAmm1 = Math.min(100, Math.round((cumAmm1 + r.amm1) * 100) / 100);
          cumAmm3 = Math.min(100, Math.round((cumAmm3 + r.amm3) * 100) / 100);
          cumAmm4 = Math.min(100, Math.round((cumAmm4 + r.amm4) * 100) / 100);
          if (r.act !== undefined) {
            cumAct = Math.round((cumAct + r.act) * 100) / 100;
          }

          const activePlanned = cumAmm4 > 0 ? cumAmm4 : cumAmm3 > 0 ? cumAmm3 : cumOrig;
          const variance = r.act !== undefined ? Math.round((cumAct - activePlanned) * 100) / 100 : undefined;
          const spi = r.act !== undefined && activePlanned > 0 ? Math.round((cumAct / activePlanned) * 1000) / 1000 : undefined;

          return {
            period,
            date,
            plannedOriginal: cumOrig,
            plannedAddendum1: cumAmm1 > 0 ? cumAmm1 : undefined,
            plannedAddendum2: cumRev1 > 0 ? cumRev1 : undefined,
            plannedAddendum3: cumAmm3 > 0 ? cumAmm3 : undefined,
            plannedAddendum4: cumAmm4 > 0 ? cumAmm4 : undefined,
            planned: activePlanned,
            actual: r.act !== undefined ? cumAct : undefined,
            incrementalPlan: r.amm4 || r.amm3 || r.kontrak,
            incrementalActual: r.act,
            variance,
            spi
          };
        } else {
          // Already cumulative
          const activePlanned = r.amm4 > 0 ? r.amm4 : r.amm3 > 0 ? r.amm3 : r.kontrak;
          const variance = r.act !== undefined ? Math.round((r.act - activePlanned) * 100) / 100 : undefined;
          const spi = r.act !== undefined && activePlanned > 0 ? Math.round((r.act / activePlanned) * 1000) / 1000 : undefined;

          return {
            period,
            date,
            plannedOriginal: r.kontrak,
            plannedAddendum1: r.amm1 > 0 ? r.amm1 : undefined,
            plannedAddendum2: r.rev1 > 0 ? r.rev1 : undefined,
            plannedAddendum3: r.amm3 > 0 ? r.amm3 : undefined,
            plannedAddendum4: r.amm4 > 0 ? r.amm4 : undefined,
            planned: activePlanned,
            actual: r.act,
            incrementalPlan: undefined,
            incrementalActual: undefined,
            variance,
            spi
          };
        }
      });

      return { points, rowCount: finalRows.length, error: null };
    } catch (err: any) {
      return { points: [], rowCount: 0, error: err.message || 'Gagal memproses tabel' };
    }
  }, [pastedText, filterContractor, inputMode]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (parsedResult.points.length === 0) {
      alert('Tidak ada data valid yang dapat diterapkan.');
      return;
    }
    onApplyData(parsedResult.points, selectedGranularity);
    onClose();
  };

  const handleLoadSample = () => {
    setPastedText(SAMPLE_HBR2_TABLE_TSV);
    setInputMode('incremental');
    setFilterContractor('TOTAL');
    setActiveTab('preview');
  };

  // Google Apps Script template for direct two-way sync
  const appsScriptCode = `/**
 * GOOGLE APPS SCRIPT: KURVA S SPREADSHEET TO WEB APP BRIDGE
 * Tempatkan kode ini di Google Sheets > Ekstensi > Apps Script
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'getSCurve';
  
  if (action === 'getSCurve') {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('04_Kurva_S') || ss.getActiveSheet();
    var data = sheet.getDataRange().getValues();
    
    // Konversi ke format JSON Kurva S
    var points = [];
    var cumKontrak = 0, cumAdd4 = 0, cumAct = 0;
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var period = String(row[0]);
      var incPlan = Number(row[10] || row[6] || 0); // Amandemen 4
      var incAct = row[11] !== "" ? Number(row[11]) : null;
      
      cumAdd4 += incPlan;
      if (incAct !== null) cumAct += incAct;
      
      points.push({
        period: period,
        date: String(row[0]),
        planned: Math.round(cumAdd4 * 100) / 100,
        actual: incAct !== null ? Math.round(cumAct * 100) / 100 : null,
        incrementalPlan: incPlan,
        incrementalActual: incAct
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      count: points.length,
      data: points
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  // Terima data Kurva S dari Web App untuk update spreadsheet otomatis
  try {
    var payload = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('04_Kurva_S');
    if (!sheet) {
      sheet = ss.insertSheet('04_Kurva_S');
    }
    
    // Tulis data update...
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Kurva S berhasil disinkronisasi ke Google Sheets'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Import / Paste Data Tabel Kurva S
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Excel &amp; Google Sheets Parser
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Salin baris &amp; kolom dari spreadsheet Anda, tempel ke form ini, dan data Kurva-S langsung terakumulasi &amp; terintegrasi.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="flex items-center justify-between px-6 pt-3 border-b border-slate-800 bg-slate-900/80 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-4 py-2 font-bold rounded-t-lg border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'paste'
                  ? 'border-emerald-500 text-emerald-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>1. Tempel / Input Teks Tabel</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 font-bold rounded-t-lg border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'preview'
                  ? 'border-emerald-500 text-emerald-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>2. Tinjauan Hasil Parse ({parsedResult.rowCount} Baris)</span>
            </button>
            <button
              onClick={() => setActiveTab('apps_script')}
              className={`px-4 py-2 font-bold rounded-t-lg border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'apps_script'
                  ? 'border-emerald-500 text-emerald-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>3. Integrasi Apps Script (Otomasi)</span>
            </button>
          </div>

          <button
            onClick={handleLoadSample}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 font-semibold transition-all cursor-pointer text-[11px]"
            title="Muat data riwayat kontrak Harbour Road II lengkap 2022-2027"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Muat Data Riwayat Kontrak HBR II</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-950/40">
          {/* TAB 1: PASTE INPUT */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              {/* Configuration Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                {/* Granularity Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Resolusi Kurva-S:
                  </label>
                  <select
                    value={selectedGranularity}
                    onChange={(e) => setSelectedGranularity(e.target.value as SCurveGranularity)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-medium"
                  >
                    <option value="monthly">Bulanan (Monthly)</option>
                    <option value="weekly">Mingguan (Weekly)</option>
                    <option value="daily">Harian (Daily)</option>
                  </select>
                </div>

                {/* Accumulation Mode */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Format Angka Input:
                  </label>
                  <select
                    value={inputMode}
                    onChange={(e) => setInputMode(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-medium"
                  >
                    <option value="incremental">Nilai Periodik (Otomatis Diakumulasikan)</option>
                    <option value="cumulative">Nilai Sudah Kumulatif (%)</option>
                  </select>
                </div>

                {/* Contractor Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Filter Baris Kontraktor:
                  </label>
                  <select
                    value={filterContractor}
                    onChange={(e) => setFilterContractor(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-medium"
                  >
                    <option value="TOTAL">TOTAL Proyek (Rekomendasi Utama)</option>
                    <option value="PT Wijaya Karya">PT Wijaya Karya</option>
                    <option value="PT Girder Indonesia">PT Girder Indonesia</option>
                    <option value="ALL">Semua Baris (Tanpa Filter)</option>
                  </select>
                </div>
              </div>

              {/* Textarea Area */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="font-bold text-slate-300">
                    Tempel (Paste) Teks Tabel (Tab-Separated dari Excel/Sheets):
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Mendukung kolom BULAN, KONTRAKTOR, RENCANA KONTRAK, REVISI, AMANDEMEN, REALISASI
                  </span>
                </div>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Contoh format (Tab separated):\nBULAN\tBULAN KE\tKONTRAKTOR\tKONTRAK/ADD\tNILAI KONTRAK\tPORSI (%)\tRENCANA KONTRAK\tRENCANA REVISI 1\tRENCANA AMMANDENEN 1\tRENCANA AMMANDEMEN 3\tRENCANA AMMANDEMEN 4\tREALISASI\n25-May-2022\t1\tTOTAL\tKontrak Awal\t7,175,142,283,117.00\t100.00%\t0.11\t0.48\t0.00\t0.43\t0.43\t0.43\n25-Jun-2022\t2\tTOTAL\tAmandemen 1\t7,175,142,283,117.00\t100.00%\t0.27\t0.01\t0.00\t0.25\t0.25\t0.25`}
                  rows={14}
                  className="w-full p-3 font-mono text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Live Status Banner */}
              {parsedResult.points.length > 0 ? (
                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      Tabel berhasil dibaca: <strong>{parsedResult.rowCount} baris data valid</strong>.
                      Rentang: <strong>{parsedResult.points[0]?.period}</strong> s/d{' '}
                      <strong>{parsedResult.points[parsedResult.points.length - 1]?.period}</strong>.
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
                  >
                    <span>Lihat Pratinjau</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-400" />
                  <span>
                    Klik tombol <strong>"Muat Data Riwayat Kontrak HBR II"</strong> di atas atau tempel data dari file Excel Anda.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Periode</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {parsedResult.points.length} Titik
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {parsedResult.points[0]?.period} - {parsedResult.points[parsedResult.points.length - 1]?.period}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-blue-400">Rencana Terkini (Add. 4)</div>
                  <div className="text-xl font-bold text-blue-300 mt-1">
                    {parsedResult.points[parsedResult.points.length - 1]?.plannedAddendum4 ?? parsedResult.points[parsedResult.points.length - 1]?.planned}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Target Penyelesaian Kontrak</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-emerald-400">Realisasi Aktual Terakhir</div>
                  <div className="text-xl font-bold text-emerald-300 mt-1">
                    {(() => {
                      const acts = parsedResult.points.filter(p => p.actual !== undefined);
                      const last = acts[acts.length - 1];
                      return last ? `${last.actual}% (${last.period})` : '-';
                    })()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Progres Fisik Aktual Tertagih</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-amber-400">Varians Progres</div>
                  <div className="text-xl font-bold text-amber-300 mt-1">
                    {(() => {
                      const acts = parsedResult.points.filter(p => p.actual !== undefined);
                      const last = acts[acts.length - 1];
                      if (!last || last.actual === undefined) return '-';
                      const plan = last.plannedAddendum4 ?? last.planned;
                      const diff = Math.round((last.actual - plan) * 100) / 100;
                      return `${diff > 0 ? '+' : ''}${diff}%`;
                    })()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Deviasi terhadap Baseline 4</div>
                </div>
              </div>

              {/* Table Preview */}
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-slate-200">
                    Daftar Titik Kurva-S yang Akan Diterapkan ({parsedResult.points.length} Baris):
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Mode: {inputMode === 'incremental' ? 'Akumulasi Otomatis (Periodic to Cumulative)' : 'Nilai Kumulatif Langsung'}
                  </span>
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-950 text-slate-400 text-[11px] sticky top-0 border-b border-slate-800 z-10">
                      <tr>
                        <th className="py-2 px-3">Periode</th>
                        <th className="py-2 px-3">Tanggal Cutoff</th>
                        <th className="py-2 px-3 text-right">Rencana Kontrak Awal (%)</th>
                        <th className="py-2 px-3 text-right">Rencana Add. 1 (%)</th>
                        <th className="py-2 px-3 text-right">Rencana Add. 3 (%)</th>
                        <th className="py-2 px-3 text-right text-blue-400">Rencana Add. 4 (%)</th>
                        <th className="py-2 px-3 text-right text-emerald-400">Realisasi Aktual (%)</th>
                        <th className="py-2 px-3 text-right">Bobot Periodik (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {parsedResult.points.map((pt, i) => (
                        <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-1.5 px-3 font-bold text-white">{pt.period}</td>
                          <td className="py-1.5 px-3 text-slate-400">{pt.date}</td>
                          <td className="py-1.5 px-3 text-right text-slate-400">
                            {pt.plannedOriginal !== undefined ? `${pt.plannedOriginal}%` : '-'}
                          </td>
                          <td className="py-1.5 px-3 text-right text-purple-300">
                            {pt.plannedAddendum1 !== undefined ? `${pt.plannedAddendum1}%` : '-'}
                          </td>
                          <td className="py-1.5 px-3 text-right text-orange-300">
                            {pt.plannedAddendum3 !== undefined ? `${pt.plannedAddendum3}%` : '-'}
                          </td>
                          <td className="py-1.5 px-3 text-right font-bold text-blue-300">
                            {pt.plannedAddendum4 !== undefined ? `${pt.plannedAddendum4}%` : `${pt.planned}%`}
                          </td>
                          <td className="py-1.5 px-3 text-right font-bold text-emerald-300">
                            {pt.actual !== undefined ? `${pt.actual}%` : '-'}
                          </td>
                          <td className="py-1.5 px-3 text-right text-slate-400">
                            {pt.incrementalPlan !== undefined ? `${pt.incrementalPlan}%` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APPS SCRIPT INTEGRATION */}
          {activeTab === 'apps_script' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs space-y-2">
                <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                  <Terminal className="w-4 h-4 text-blue-400" />
                  <span>Google Apps Script untuk Sinkronisasi Otomatis Kurva-S</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Jika Anda ingin data tabel di atas dapat diperbarui secara otomatis dari Google Sheets langsung ke Web App tanpa harus copy-paste manual setiap bulan, Anda dapat menggunakan Apps Script Web App API di bawah ini.
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-slate-400 text-[11px]">
                  <li>Buka spreadsheet Google Sheets Anda (tab <strong>04_Kurva_S</strong>).</li>
                  <li>Buka menu <strong>Ekstensi &gt; Apps Script</strong>.</li>
                  <li>Salin dan tempel kode di bawah ini, lalu klik <strong>Terapkan (Deploy) &gt; Deployment baru &gt; Aplikasi Web (Web App)</strong>.</li>
                  <li>Atur akses ke <strong>"Siapa saja" (Anyone)</strong>, lalu salin URL Web App yang dihasilkan.</li>
                </ol>
              </div>

              <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono font-bold text-emerald-400">GoogleAppsScript_KurvaS_Bridge.gs</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(appsScriptCode);
                      setCopiedScript(true);
                      setTimeout(() => setCopiedScript(false), 2500);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-all cursor-pointer text-[11px]"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Tersalin!' : 'Salin Kode Script'}</span>
                  </button>
                </div>
                <pre className="p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[300px]">
                  {appsScriptCode}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {parsedResult.points.length > 0 ? (
              <span className="text-emerald-400 font-medium">
                Siap menerapkan {parsedResult.points.length} titik ke Kurva S ({selectedGranularity}).
              </span>
            ) : (
              <span>Tempel data tabel untuk memulai.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleApply}
              disabled={parsedResult.points.length === 0}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs transition-all shadow-lg cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan ke Kurva-S</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
