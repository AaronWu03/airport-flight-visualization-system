import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(__dirname, '../public/assets/airports/NKG');

function showTotals(file, dataStartRow, n = 2) {
  const wb = XLSX.readFile(path.join(ASSETS, file));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  console.log(`\n=== ${file} ===`);
  for (let r = dataStartRow; r < dataStartRow + n; r++) {
    const row = data[r];
    if (!row) continue;
    const len = row.length;
    console.log(`Row[${r}] (len=${len}), last 10:`, row.slice(Math.max(0, len - 10)));
  }
}

showTotals('4.机场周时刻量分布.xlsx', 90, 4);
showTotals('5.运营航司周时刻量统计.xlsx', 3, 3);
showTotals('8.连通机场周时刻量统计.xlsx', 2, 3);
showTotals('10.连通省市国家周时刻量统计.xlsx', 2, 3);
