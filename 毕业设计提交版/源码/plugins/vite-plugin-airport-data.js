import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');

const REQUIRED_JSON_FILES = [
  'weekly_heatmap.json',
  'airline_weekly_data.json',
  'region_weekly_data.json',
  'connected_airports_data.json'
];

/**
 * 检查指定机场的图表JSON数据是否完整
 */
function hasChartData(airport) {
  const dir = path.join(PROJECT_ROOT, 'public', 'assets', 'airports', airport);
  if (!fs.existsSync(dir)) return false;
  return REQUIRED_JSON_FILES.every(f => fs.existsSync(path.join(dir, f)));
}

/**
 * 运行Python脚本生成数据
 */
function runPythonScript(scriptRelPath, args) {
  const scriptPath = path.join(PROJECT_ROOT, 'scripts', scriptRelPath);
  const result = spawnSync('python', [scriptPath, ...args], {
    cwd: PROJECT_ROOT,
    encoding: 'utf-8',
    timeout: 60000
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || '脚本执行失败');
  return result;
}

/**
 * 读取JSON文件，失败返回null
 */
function readJsonFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (e) {
    console.error(`读取JSON失败 ${filePath}:`, e.message);
  }
  return null;
}

/**
 * Vite插件：统一机场数据处理中心
 *
 * 端点1: /api/airports-data?airport=XXX&date=YYYY/MM/DD
 *   生成地图航线数据 (airports_summary.json)
 *
 * 端点2: /api/airport-charts?airport=XXX&date=YYYY/MM/DD
 *   统一返回所有图表数据（热力图、航司、省市、连通机场）
 *   如果数据不存在则自动生成
 */
export default function airportDataPlugin() {
  return {
    name: 'vite-plugin-airport-data',

    configureServer(server) {

      // ===== 端点1: 地图航线数据 =====
      server.middlewares.use('/api/airports-data', async (req, res, next) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const airport = url.searchParams.get('airport') || 'NKG';
        const date = url.searchParams.get('date') || null;

        try {
          const csvPath = path.join(
            PROJECT_ROOT, 'public', 'assets', 'airports', airport,
            '1.机场进出港时刻表.csv'
          );

          if (!fs.existsSync(csvPath)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `未找到机场 ${airport} 的数据文件` }));
            return;
          }

          const args = ['generate_daily_flights.py', csvPath];
          if (date) args.push(date);
          args.push(airport);
          runPythonScript('generate_daily_flights.py', args.slice(1));

          const jsonPath = path.join(PROJECT_ROOT, 'public', 'airports_summary.json');
          if (!fs.existsSync(jsonPath)) {
            throw new Error('未生成 airports_summary.json');
          }

          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          });
          res.end(fs.readFileSync(jsonPath, 'utf-8'));

        } catch (error) {
          console.error('生成地图数据失败:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });

      // ===== 端点2: 统一图表数据 =====
      server.middlewares.use('/api/airport-charts', async (req, res, next) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const airport = url.searchParams.get('airport') || 'NKG';
        const date = url.searchParams.get('date') || null;

        try {
          const assetDir = path.join(PROJECT_ROOT, 'public', 'assets', 'airports', airport);

          if (!fs.existsSync(assetDir)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `未找到机场 ${airport} 的数据目录` }));
            return;
          }

          // 检查数据是否完整，不完整则自动生成
          const wasComplete = hasChartData(airport);
          if (!wasComplete) {
            console.log(`[airport-charts] ${airport} 图表数据不完整，自动生成中...`);
            const extractArgs = [airport];
            if (date) extractArgs.push(date);
            runPythonScript('extract_weekly_data.py', extractArgs);
            console.log(`[airport-charts] ${airport} 图表数据生成完成`);
          }

          // 读取所有JSON文件并组装响应
          const heatmap = readJsonFile(path.join(assetDir, 'weekly_heatmap.json'));
          const airline = readJsonFile(path.join(assetDir, 'airline_weekly_data.json'));
          const region = readJsonFile(path.join(assetDir, 'region_weekly_data.json'));
          const connectedAirports = readJsonFile(path.join(assetDir, 'connected_airports_data.json'));

          const result = {
            airport: airport,
            generated: wasComplete ? 'cached' : 'now',
            heatmap: heatmap,
            airline: airline,
            region: region,
            connectedAirports: connectedAirports
          };

          // 检查哪些数据缺失
          const missing = [];
          if (!heatmap) missing.push('heatmap');
          if (!airline) missing.push('airline');
          if (!region) missing.push('region');
          if (!connectedAirports) missing.push('connectedAirports');

          if (missing.length > 0) {
            result.warning = `以下数据生成失败: ${missing.join(', ')}`;
          }

          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          });
          res.end(JSON.stringify(result, null, 2));

        } catch (error) {
          console.error('生成图表数据失败:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
    }
  };
}
