import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import {
  initialProject,
  initialPiers,
  initialWBS,
  initialActivities,
  initialDailyProgress,
  initialWeeklyProgress,
  initialMonthlyProgress,
  initialConstraints,
  initialIssues,
  initialActions,
  initialMaterials,
  initialEquipment,
  initialManpower
} from '../src/data/initialData';
import { buildSingleSheetPayload, ProjectContextDataForSheet } from '../src/services/singleGoogleSheetSync';

const contextData: ProjectContextDataForSheet = {
  project: initialProject,
  piers: initialPiers,
  wbs: initialWBS,
  activities: initialActivities,
  dailyProgress: initialDailyProgress,
  weeklyProgress: initialWeeklyProgress,
  monthlyProgress: initialMonthlyProgress,
  constraints: initialConstraints,
  issues: initialIssues,
  actions: initialActions,
  materials: initialMaterials,
  equipment: initialEquipment,
  manpower: initialManpower
};

const payload = buildSingleSheetPayload(contextData);
const workbook = XLSX.utils.book_new();

for (const item of payload) {
  const tabName = item.range.split('!')[0];
  const worksheet = XLSX.utils.aoa_to_sheet(item.values);
  XLSX.utils.book_append_sheet(workbook, worksheet, tabName);
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const outputPath = path.join(publicDir, 'DATABASE_MASTER_HBR2_PROYEK.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`Database master file successfully created at: ${outputPath}`);
console.log(`Contains 10 tabs:`);
payload.forEach((item, index) => {
  const tabName = item.range.split('!')[0];
  console.log(` ${index + 1}. ${tabName} (${item.values.length} rows)`);
});
