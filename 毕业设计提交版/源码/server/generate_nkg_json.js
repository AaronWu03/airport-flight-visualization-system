import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, '../public/assets/airports/NKG');
const OUTPUT_DIR = __dirname;

function readExcel(filename) {
  const wb = XLSX.readFile(path.join(ASSETS_DIR, filename));
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { header: 1 });
}

function parsePercent(str) {
  if (typeof str === 'string') {
    return parseFloat(str.replace('%', '')) / 100;
  }
  return 0;
}

// 1. Generate nkg_weekly_heatmap.json
// File 4: weekly time-slot distribution with 00-23 hour columns
// Last 3 rows are 总计: 进港, 出港, 进出港合计
function generateHeatmap() {
  console.log('Generating heatmap data...');
  const data = readExcel('4.机场周时刻量分布.xlsx');
  
  // Find the "总计" + "进出港合计" row (last row typically)
  let totalRow = null;
  for (let i = data.length - 1; i >= data.length - 5; i--) {
    const row = data[i];
    if (row && row[2] === '进出港合计') {
      totalRow = row;
      break;
    }
  }
  
  // Extract 24-hour data (columns 3-26 for 00时-23时)
  const hourlyTotals = [];
  for (let h = 0; h < 24; h++) {
    hourlyTotals.push(Number(totalRow[3 + h]) || 0);
  }
  
  // Create 7x24 matrix - divide weekly totals by 7 for daily estimates
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const matrix = dayNames.map(day => {
    const hours = hourlyTotals.map(v => Math.round(v / 7));
    return { day, hours };
  });
  
  const totalFromMatrix = matrix.reduce((sum, d) => sum + d.hours.reduce((s, v) => s + v, 0), 0);
  console.log(`  Original total: ${hourlyTotals.reduce((s, v) => s + v, 0)}, Matrix total: ${totalFromMatrix}`);
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'nkg_weekly_heatmap.json'),
    JSON.stringify({ hourlyTotals, matrix }, null, 2)
  );
  console.log('  ✓ nkg_weekly_heatmap.json');
}

// 2. Generate nkg_airline_rank.json
// File 5: airline weekly slot statistics
// Last 13 cols of 总计 section: [周总量, 地区, 国际, 国内, 周总量占比, 出港总量, 地区, 国际, 国内, 进港总量, 地区, 国际, 国内]
function generateAirlineRank() {
  console.log('Generating airline ranking...');
  const data = readExcel('5.运营航司周时刻量统计.xlsx');
  
  // Data rows start from index 3 (rows 0-2 are headers)
  const airlines = [];
  for (let i = 3; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[1] || row[1] === '') continue;
    
    const len = row.length;
    airlines.push({
      code: row[0] || '',
      name: row[1] || '',
      totalSlots: Number(row[len - 13]) || 0,
      percentage: parsePercent(row[len - 9]),
      departures: Number(row[len - 8]) || 0,
      arrivals: Number(row[len - 4]) || 0
    });
  }
  
  airlines.sort((a, b) => b.totalSlots - a.totalSlots);
  const top20 = airlines.slice(0, 20);
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'nkg_airline_rank.json'),
    JSON.stringify({ total: airlines.length, top20 }, null, 2)
  );
  console.log(`  ✓ nkg_airline_rank.json (${airlines.length} airlines)`);
}

// 3. Generate nkg_connected_airports.json
// File 8: connected airport weekly slot statistics
// Last 4 cols: [周总量, 周总量占比, 出港, 进港]
function generateConnectedAirports() {
  console.log('Generating connected airports...');
  const data = readExcel('8.连通机场周时刻量统计.xlsx');
  
  // Data rows start from index 2 (rows 0-1 are headers)
  const airports = [];
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0] || row[0] === '' || row[0] === '总计') continue;
    
    const len = row.length;
    airports.push({
      code: row[0] || '',
      name: row[1] || '',
      region: row[2] || '',
      classification: row[3] || '',
      total: Number(row[len - 4]) || 0,
      percentage: parsePercent(row[len - 3]),
      departures: Number(row[len - 2]) || 0,
      arrivals: Number(row[len - 1]) || 0
    });
  }
  
  airports.sort((a, b) => b.total - a.total);
  const top20 = airports.slice(0, 20);
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'nkg_connected_airports.json'),
    JSON.stringify({ total: airports.length, top20 }, null, 2)
  );
  console.log(`  ✓ nkg_connected_airports.json (${airports.length} airports)`);
}

// 4. Generate nkg_region_distribution.json
// File 10: region weekly slot statistics
// Last 4 cols: [周总量, 周总量占比, 出港, 进港]
function generateRegionDistribution() {
  console.log('Generating region distribution...');
  const data = readExcel('10.连通省市国家周时刻量统计.xlsx');
  
  // Data rows start from index 2 (rows 0-1 are headers)
  const regions = [];
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0] || row[0] === '' || row[0] === '总计') continue;
    
    const len = row.length;
    const classification = row[1] || '';
    
    regions.push({
      name: row[0] || '',
      type: classification === '国际' ? 'international' : 'domestic',
      total: Number(row[len - 4]) || 0,
      percentage: parsePercent(row[len - 3]),
      departures: Number(row[len - 2]) || 0,
      arrivals: Number(row[len - 1]) || 0
    });
  }
  
  regions.sort((a, b) => b.total - a.total);
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'nkg_region_distribution.json'),
    JSON.stringify({ total: regions.length, regions }, null, 2)
  );
  console.log(`  ✓ nkg_region_distribution.json (${regions.length} regions)`);
}

// Main
console.log('Starting NKG data processing...\n');

try {
  generateHeatmap();
  generateAirlineRank();
  generateConnectedAirports();
  generateRegionDistribution();
  console.log('\nAll JSON files generated successfully!');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
