import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tripsFile = path.join(__dirname, 'trips.json');

if (!fs.existsSync(tripsFile)) {
  fs.writeFileSync(tripsFile, JSON.stringify([]));
}

function readTrips() {
  try {
    const data = fs.readFileSync(tripsFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function saveTrips(trips) {
  fs.writeFileSync(tripsFile, JSON.stringify(trips, null, 2));
}

function extractTime(dateTimeStr) {
  if (!dateTimeStr) return '-';
  const parts = dateTimeStr.split(' ');
  if (parts.length < 2) return '-';
  const timePart = parts[1];
  return timePart?.substring(0, 5) || '-';
}

function parseDateStr(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split(' ');
  if (parts.length < 1) return '';
  return parts[0];
}

// 获取用户的行程列表
router.get('/api/trips', async (req, res) => {
  try {
    const { username, status } = req.query;

    if (!username) {
      return res.status(400).json({ error: '缺少用户名参数' });
    }

    const trips = readTrips();
    const userTrips = trips.filter(t => t.username === username);

    const today = new Date().toISOString().split('T')[0];
    let filteredTrips = userTrips;

    if (status === 'upcoming') {
      filteredTrips = userTrips.filter(t => t.flightDate >= today);
    } else if (status === 'completed') {
      filteredTrips = userTrips.filter(t => t.flightDate < today);
    }

    filteredTrips.sort((a, b) => {
      const dateA = a.flightDate + (a.depTime || '');
      const dateB = b.flightDate + (b.depTime || '');
      return dateA.localeCompare(dateB);
    });

    res.json({ code: 200, data: filteredTrips });
  } catch (err) {
    console.error('获取行程列表失败:', err);
    res.status(500).json({ error: '获取行程列表失败' });
  }
});

// 添加新行程
router.post('/api/trips', async (req, res) => {
  try {
    const { username, flightNo, date } = req.body;

    if (!username || !flightNo || !date) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const trips = readTrips();

    const existing = trips.find(t => t.username === username && t.flightNo === flightNo && t.flightDate === date);
    if (existing) {
      return res.status(400).json({ error: '该航班行程已存在' });
    }

    const client = req.app.locals.mcpClient;

    try {
      const result = await client.callTool({
        name: 'searchFlightsByNumber',
        arguments: { fnum: flightNo, date: date }
      });

      const rawContent = result.content[0].text;

      if (rawContent.startsWith('MCP error')) {
        return res.status(400).json({ error: '航班信息查询失败，请检查航班号和日期' });
      }

      const flightData = JSON.parse(rawContent);

      if (flightData.code !== 200 || !flightData.data || flightData.data.length === 0) {
        return res.status(400).json({ error: '未找到该航班信息' });
      }

      const flight = flightData.data[0];
      
      // 打印完整的航班数据用于调试
      console.log('航班返回数据:', JSON.stringify(flight, null, 2));

      // 尝试获取经停信息 - 优先从航班数据本身获取
      let segments = [];
      let isStopover = false;

      // 方式1: 检查航班数据中是否自带经停信息
      const rawStops = flight.FlightStops || flight.Stops || flight.StopInfo || flight.TechnicalStop || null;
      console.log('原始经停标记:', rawStops);

      // 方式2: 检查是否有多段数据 - data[0]是全程, data[1:]是各航段
      if (flightData.data.length > 1) {
        console.log('发现多段航班数据, 共', flightData.data.length, '段');
        console.log('data[0]全程:', flightData.data[0].FlightDep, '→', flightData.data[0].FlightArr);
        isStopover = true;
        // 全部放入segments: data[0]是全程, data[1:]是分程
        segments = flightData.data.map((seg, idx) => ({
          depAirport: seg.FlightDep,
          depAirportCode: seg.FlightDepcode,
          arrAirport: seg.FlightArr,
          arrAirportCode: seg.FlightArrcode,
          depTime: extractTime(seg.FlightDeptimePlanDate),
          arrTime: extractTime(seg.FlightArrtimePlanDate),
          depDate: parseDateStr(seg.FlightDeptimePlanDate),
          arrDate: parseDateStr(seg.FlightArrtimePlanDate),
          label: idx === 0 ? '全程' : (idx === 1 ? '第一程' : (idx === 2 ? '第二程' : `第${idx + 1}程`))
        }));
        console.log('解析出', segments.length, '个选项:', segments.map(s => `[${s.label}]${s.depAirport}→${s.arrAirport}`));
      }

      // 方式3: 调用 getFlightTransferInfo 获取经停信息
      if (!isStopover) {
        try {
          const transferResult = await client.callTool({
            name: 'getFlightTransferInfo',
            arguments: { fnum: flightNo, date: date }
          });

          const transferRaw = transferResult.content[0].text;
          console.log('经停查询原始返回:', transferRaw.substring(0, 500));

          if (!transferRaw.startsWith('MCP error')) {
            const transferData = JSON.parse(transferRaw);
            console.log('经停数据解析结果:', JSON.stringify(transferData, null, 2));

            if (transferData.code === 200 && transferData.data) {
              const transferList = Array.isArray(transferData.data) ? transferData.data : [transferData.data];
              
              if (transferList.length > 0) {
                const transferInfo = transferList[0];
                // 尝试多种可能的字段名
                const stopPoints = transferInfo.StopPoint || transferInfo.StopPoints || transferInfo.stops || transferInfo.Stops || [];
                const stopCodes = transferInfo.StopPointCode || transferInfo.StopPointCodes || transferInfo.stopCodes || [];
                
                console.log('经停点列表:', stopPoints);
                console.log('经停点代码:', stopCodes);

                if (stopPoints.length > 0) {
                  isStopover = true;
                  const depDate = parseDateStr(flight.FlightDeptimePlanDate);
                  const arrDate = parseDateStr(flight.FlightArrtimePlanDate);

                  // 全程作为第一个选项
                  const fullRouteOption = {
                    depAirport: flight.FlightDep,
                    depAirportCode: flight.FlightDepcode,
                    arrAirport: flight.FlightArr,
                    arrAirportCode: flight.FlightArrcode,
                    depTime: extractTime(flight.FlightDeptimePlanDate),
                    arrTime: extractTime(flight.FlightArrtimePlanDate),
                    depDate,
                    arrDate,
                    label: '全程'
                  };

                  if (stopPoints.length === 1) {
                    segments = [
                      fullRouteOption,
                      {
                        depAirport: flight.FlightDep,
                        depAirportCode: flight.FlightDepcode,
                        arrAirport: stopPoints[0],
                        arrAirportCode: Array.isArray(stopCodes) ? (stopCodes[0] || '-') : stopCodes || '-',
                        depTime: extractTime(flight.FlightDeptimePlanDate),
                        arrTime: '-',
                        depDate,
                        arrDate: depDate,
                        label: '第一程'
                      },
                      {
                        depAirport: stopPoints[0],
                        depAirportCode: Array.isArray(stopCodes) ? (stopCodes[0] || '-') : stopCodes || '-',
                        arrAirport: flight.FlightArr,
                        arrAirportCode: flight.FlightArrcode,
                        depTime: '-',
                        arrTime: extractTime(flight.FlightArrtimePlanDate),
                        depDate: arrDate !== depDate ? arrDate : depDate,
                        arrDate,
                        label: '第二程'
                      }
                    ];
                  } else if (stopPoints.length >= 2) {
                    const legSegments = stopPoints.map((point, idx) => {
                      const prevPoint = idx === 0 ? flight.FlightDep : stopPoints[idx - 1];
                      const nextPoint = idx === stopPoints.length - 1 ? flight.FlightArr : stopPoints[idx + 1];
                      const prevCode = idx === 0 ? flight.FlightDepcode : (Array.isArray(stopCodes) ? stopCodes[idx - 1] : stopCodes);
                      const nextCode = idx === stopPoints.length - 1 ? flight.FlightArrcode : (Array.isArray(stopCodes) ? stopCodes[idx] : stopCodes);

                      return {
                        depAirport: prevPoint,
                        depAirportCode: prevCode || '-',
                        arrAirport: nextPoint,
                        arrAirportCode: nextCode || '-',
                        depTime: idx === 0 ? extractTime(flight.FlightDeptimePlanDate) : '-',
                        arrTime: idx === stopPoints.length - 1 ? extractTime(flight.FlightArrtimePlanDate) : '-',
                        depDate,
                        arrDate,
                        label: idx === 0 ? '第一程' : idx === 1 ? '第二程' : `第${idx + 1}程`
                      };
                    });
                    segments = [fullRouteOption, ...legSegments];
                  }
                  console.log('方式3解析出', segments.length, '个选项:', segments.map(s => `[${s.label}]${s.depAirport}→${s.arrAirport}`));
                }
              }
            }
          } else {
            console.log('getFlightTransferInfo 返回错误:', transferRaw);
          }
        } catch (transferErr) {
          console.log('获取经停信息失败:', transferErr.message);
        }
      }

      // 方式4: 如果 flightData 中有 via/stop 相关字段
      if (!isStopover) {
        const viaInfo = flight.FlightVia || flight.Via || flight.TransferCity || null;
        console.log('备选经停字段:', viaInfo);
        if (viaInfo) {
          isStopover = true;
          const viaCities = Array.isArray(viaInfo) ? viaInfo : [viaInfo];
          const fullRouteOpt = {
            depAirport: flight.FlightDep,
            depAirportCode: flight.FlightDepcode,
            arrAirport: flight.FlightArr,
            arrAirportCode: flight.FlightArrcode,
            depTime: extractTime(flight.FlightDeptimePlanDate),
            arrTime: extractTime(flight.FlightArrtimePlanDate),
            depDate: parseDateStr(flight.FlightDeptimePlanDate),
            arrDate: parseDateStr(flight.FlightArrtimePlanDate),
            label: '全程'
          };
          // 构建各航段: 起点→经停1, 经停1→经停2, ..., 经停n→终点
          const cities = [flight.FlightDep, ...viaCities, flight.FlightArr];
          const legs = [];
          for (let i = 0; i < cities.length - 1; i++) {
            legs.push({
              depAirport: cities[i],
              depAirportCode: i === 0 ? flight.FlightDepcode : '-',
              arrAirport: cities[i + 1],
              arrAirportCode: i === cities.length - 2 ? flight.FlightArrcode : '-',
              depTime: i === 0 ? extractTime(flight.FlightDeptimePlanDate) : '-',
              arrTime: i === cities.length - 2 ? extractTime(flight.FlightArrtimePlanDate) : '-',
              depDate: parseDateStr(flight.FlightDeptimePlanDate),
              arrDate: parseDateStr(flight.FlightArrtimePlanDate),
              label: `第${i + 1}程`
            });
          }
          segments = [fullRouteOpt, ...legs];
        }
      }

      console.log('最终判断 - isStopover:', isStopover, 'segments数量:', segments.length);

      const newTrip = {
        _id: Date.now().toString(),
        username,
        flightNo: flight.FlightNo,
        airline: flight.FlightCompany,
        depAirport: flight.FlightDep,
        depAirportCode: flight.FlightDepcode,
        arrAirport: flight.FlightArr,
        arrAirportCode: flight.FlightArrcode,
        depTime: extractTime(flight.FlightDeptimePlanDate),
        arrTime: extractTime(flight.FlightArrtimePlanDate),
        flightDate: date,
        notes: '',
        isStopover,
        segments,
        selectedSegment: 0,
        createdAt: new Date().toISOString()
      };

      trips.push(newTrip);
      saveTrips(trips);

      res.json({ code: 200, message: '行程添加成功', data: newTrip });
    } catch (mcpErr) {
      console.error('MCP调用失败:', mcpErr);
      res.status(500).json({ error: '航班信息查询失败' });
    }
  } catch (err) {
    console.error('添加行程失败:', err);
    res.status(500).json({ error: '添加行程失败' });
  }
});

// 选择经停航段
router.post('/api/trips/segment', async (req, res) => {
  try {
    const { username, tripId, segmentIndex, segment } = req.body;

    if (!username || !tripId) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const trips = readTrips();
    const tripIndex = trips.findIndex(t => t._id === tripId && t.username === username);

    if (tripIndex === -1) {
      return res.status(404).json({ error: '行程不存在' });
    }

    // 更新航段信息 - 将选定航段设为行程主路线
    if (segment) {
      trips[tripIndex].depAirport = segment.depAirport;
      trips[tripIndex].depAirportCode = segment.depAirportCode;
      trips[tripIndex].arrAirport = segment.arrAirport;
      trips[tripIndex].arrAirportCode = segment.arrAirportCode;
      trips[tripIndex].depTime = segment.depTime;
      trips[tripIndex].arrTime = segment.arrTime;
      trips[tripIndex].flightDate = segment.depDate || trips[tripIndex].flightDate;
    }
    
    // 确认选择后清除经停标记，后续不再显示切换器
    trips[tripIndex].isStopover = false;
    trips[tripIndex].segments = [];
    trips[tripIndex].selectedSegment = 0;
    saveTrips(trips);

    res.json({ code: 200, message: '航段选择成功', data: trips[tripIndex] });
  } catch (err) {
    console.error('选择航段失败:', err);
    res.status(500).json({ error: '选择航段失败' });
  }
});

// 删除行程
router.delete('/api/trips/:id', async (req, res) => {
  try {
    const { username } = req.query;
    const { id } = req.params;

    if (!username) {
      return res.status(400).json({ error: '缺少用户名参数' });
    }

    let trips = readTrips();
    const initialLength = trips.length;
    trips = trips.filter(t => !(t._id === id && t.username === username));

    if (trips.length === initialLength) {
      return res.status(404).json({ error: '行程不存在' });
    }

    saveTrips(trips);
    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    console.error('删除行程失败:', err);
    res.status(500).json({ error: '删除行程失败' });
  }
});

// 更新行程（备注、航段等）
router.put('/api/trips/:id', async (req, res) => {
  try {
    const { username } = req.query;
    const { id } = req.params;
    const updates = req.body;

    if (!username) {
      return res.status(400).json({ error: '缺少用户名参数' });
    }

    let trips = readTrips();
    const tripIndex = trips.findIndex(t => t._id === id && t.username === username);

    if (tripIndex === -1) {
      return res.status(404).json({ error: '行程不存在' });
    }

    // 只允许更新特定字段
    const allowedFields = ['notes', 'selectedSegment', 'depAirport', 'depAirportCode', 'arrAirport', 'arrAirportCode', 'depTime', 'arrTime'];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        trips[tripIndex][field] = updates[field];
      }
    }

    trips[tripIndex].updatedAt = new Date().toISOString();
    saveTrips(trips);

    res.json({ code: 200, message: '更新成功', data: trips[tripIndex] });
  } catch (err) {
    console.error('更新行程失败:', err);
    res.status(500).json({ error: '更新行程失败' });
  }
});

export default router;
