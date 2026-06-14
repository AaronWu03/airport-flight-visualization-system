import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(__dirname, '../public/assets/airports/NKG');

function check(file, showRowIdx, showRows = 3) {
  const wb = XLSX.readFile(path.join(ASSETS, file));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  console.log(`\n=== ${file} ===`);
  console.log('Total rows:', data.length);
  for (let r = 0; r < showRows; r++) {
    const row = data[showRowIdx + r];
    if (!row) continue;
    console.log(`Row[${showRowIdx + r}] length=${row.length}`);
    // Find "总计"
    for (let c = row.length - 1; c >= 0; c--) {
      if (row[c] === '总计') {
        console.log(`  "总计" at col ${c}`);
        // Print last 8 values
        console.log(`  last 8:`, row.slice(c));
        break;
      }
    }
  }
}

check('4.机场周时刻量分布.xlsx', 0, 3);
check('5.运营航司周时刻量统计.xlsx', 0, 3);
check('8.连通机场周时刻量统计.xlsx', 0, 3);
check('10.连通省市国家周时刻量统计.xlsx', 0, 3);
