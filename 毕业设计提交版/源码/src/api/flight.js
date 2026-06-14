// MD5签名算法（纯JavaScript实现）
const md5 = (string) => {
  function md5cycle(x, k) {
    var a = x[0], b = x[1], c = x[2], d = x[3];

    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);

    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);

    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);

    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);

    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);
  }

  function cmn(q, a, b, x, s, t) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }

  function ff(a, b, c, d, x, s, t) {
    return cmn((b & c) | ((~b) & d), a, b, x, s, t);
  }

  function gg(a, b, c, d, x, s, t) {
    return cmn((b & d) | (c & (~d)), a, b, x, s, t);
  }

  function hh(a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function ii(a, b, c, d, x, s, t) {
    return cmn(c ^ (b | (~d)), a, b, x, s, t);
  }

  function add32(a, b) {
    return (a + b) & 0xFFFFFFFF;
  }

  var i, l, n, msg = new Array();
  var K = [0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
           0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
           0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
           0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
           0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
           0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
           0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
           0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
           0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
           0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
           0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
           0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
           0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
           0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
           0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
           0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391];

  var S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
           5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
           4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
           6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];

  msg = utf8Encode(string);
  l = msg.length;
  n = l + 8;
  n += (56 - n) % 64;

  // Convert string to array for manipulation
  var msgArray = [];
  for (var i = 0; i < n; i += 4) {
    msgArray[i >> 2] = (i < l ? msg.charCodeAt(i) : 0) |
                     ((i + 1 < l ? msg.charCodeAt(i + 1) : 0) << 8) |
                     ((i + 2 < l ? msg.charCodeAt(i + 2) : 0) << 16) |
                     ((i + 3 < l ? msg.charCodeAt(i + 3) : 0) << 24);
  }

  msgArray[n >> 2] = l << 3;
  msgArray[(n >> 2) + 1] = l >>> 29;
  msg = msgArray;

  var x = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];

  for (i = 0; i < msg.length; i += 16) {
    var k = [];
    for (var j = 0; j < 16; j++) {
      k[j] = msg[i + j];
    }
    md5cycle(x, k);
  }

  var hexChars = "0123456789abcdef";
  var hex = "";
  for (i = 0; i < 4; i++) {
    hex += hexChars.charAt((x[i] >> 4) & 0x0F) +
           hexChars.charAt(x[i] & 0x0F) +
           hexChars.charAt((x[i] >> 12) & 0x0F) +
           hexChars.charAt((x[i] >> 8) & 0x0F) +
           hexChars.charAt((x[i] >> 20) & 0x0F) +
           hexChars.charAt((x[i] >> 16) & 0x0F) +
           hexChars.charAt((x[i] >> 28) & 0x0F) +
           hexChars.charAt((x[i] >> 24) & 0x0F);
  }

  return hex;
}

function utf8Encode(string) {
  string = string.replace(/\r\n/g, "\n");
  var utftext = "";

  for (var n = 0; n < string.length; n++) {
    var c = string.charCodeAt(n);

    if (c < 128) {
      utftext += String.fromCharCode(c);
    } else if ((c > 127) && (c < 2048)) {
      utftext += String.fromCharCode((c >> 6) | 192);
      utftext += String.fromCharCode((c & 63) | 128);
    } else {
      utftext += String.fromCharCode((c >> 12) | 224);
      utftext += String.fromCharCode(((c >> 6) & 63) | 128);
      utftext += String.fromCharCode((c & 63) | 128);
    }
  }

  return utftext;
}

// 获取环境变量（浏览器环境）
const APP_ID = window.APP_ID || 'your_app_id'
const APP_KEY = window.APP_KEY || 'your_app_key'

// 引入axios
import axios from 'axios'

// 飞常准API调用函数
const runMCP = async (serverName, toolName, args) => {
  try {
    // 使用axios调用后端代理
    const response = await axios.post('http://localhost:3001/api/mcp', {
      toolName: toolName,
      args: args
    })
    
    // 解析返回结果
    const rawContent = response.data.content[0].text
    if (rawContent.startsWith('MCP error')) {
      throw new Error(rawContent)
    }
    
    // 1. 打印原始响应，方便你在控制台看到到底是什么鬼
    console.log("MCP 原始响应片段:", rawContent.substring(0, 100));

    // 如果响应本身就是日期格式 (YYYY-MM-DD)，直接返回
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawContent.trim())) {
        return rawContent.trim();
    }

    // 2. 尝试提取最外层的大括号内容
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
        // 如果连大括号都没有，直接返回原文本
        return rawContent;
    }

    let jsonString = jsonMatch[0];

    // 3. 递归清洗：处理某些返回结果在最后多出字符的情况
    // 比如有些响应会返回 {...}var x=...
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        // 如果解析失败，尝试从右侧缩减，直到遇到最后一个 '}'
        const lastBraceIndex = jsonString.lastIndexOf('}');
        jsonString = jsonString.substring(0, lastBraceIndex + 1);
        try {
            return JSON.parse(jsonString);
        } catch (e2) {
            // 如果仍然解析失败，返回原文本
            return rawContent;
        }
    }
  } catch (error) {
    console.error('MCP API解析详细失败:', error);
    // 出错时返回原文本，避免程序崩溃
    return error.message;
  }
}

// 获取当前日期
export const getTodayDate = async () => {
  try {
    const result = await runMCP('mcp_variflight', 'getTodayDate', { random_string: 'test' })
    if (!result || !result.date || typeof result.date !== 'string') {
      throw new Error('无效的日期数据')
    }
    return result.date
  } catch (error) {
    console.error('获取日期失败:', error)
    return new Date().toISOString().split('T')[0]
  }
}

// 根据航班号搜索航班
export const searchFlightByNumber = async (flightNumber, date = null) => {
  try {
    // 1. 确保先拿到日期
    let flightDate = date || await getTodayDate();
    
    // 如果 date 获取失败变成了对象或 undefined，强制补丁
    if (!flightDate || typeof flightDate !== 'string') {
        flightDate = new Date().toISOString().split('T')[0]; // 兜底使用客户端当前日期 "2026-04-06"
    }

    console.log(`正在搜索航班: ${flightNumber}, 日期: ${flightDate}`);

    // 2. 这里的参数必须严格包含 date
    const result = await runMCP('mcp_variflight', 'searchFlightsByNumber', {
      fnum: flightNumber.toUpperCase(),
      date: flightDate // 确保这个字段不是 undefined
    })
    return result
  } catch (error) {
    console.error('搜索航班失败:', error)
    throw error
  }
}

// 根据出发地和目的地搜索航班
export const searchFlightByRoute = async (departure, arrival, date) => {
  try {
    const result = await runMCP('mcp_variflight', 'searchFlightsByDepArr', {
      dep: departure.toUpperCase(),
      arr: arrival.toUpperCase(),
      date: date
    })
    return result
  } catch (error) {
    console.error('搜索航线失败:', error)
    throw error
  }
}

// 获取航班实时位置
export const getFlightRealTimeLocation = async (flightNumber) => {
  try {
    const result = await runMCP('mcp_variflight', 'getRealtimeLocationByAnum', {
      anum: flightNumber.toUpperCase()
    })
    return result
  } catch (error) {
    console.error('获取实时位置失败:', error)
    throw error
  }
}

// 获取航班行程信息
export const getFlightItineraries = async (flightNumber, date = null) => {
  try {
    const flightDate = date || await getTodayDate()
    const result = await runMCP('mcp_variflight', 'searchFlightItineraries', {
      fnum: flightNumber.toUpperCase(),
      date: flightDate
    })
    return result
  } catch (error) {
    console.error('获取航班行程失败:', error)
    throw error
  }
}

// 获取机场天气
export const getAirportWeather = async (airportCode) => {
  try {
    const result = await runMCP('mcp_variflight', 'getFutureWeatherByAirport', {
      icao: airportCode.toUpperCase()
    })
    return result
  } catch (error) {
    console.error('获取机场天气失败:', error)
    throw error
  }
}

// 获取航班幸福指数
export const getFlightHappinessIndex = async (flightNumber, date = null) => {
  try {
    let flightDate = (date !== undefined && date !== null) ? date : await getTodayDate()
    
    if (!flightDate || typeof flightDate !== 'string') {
      flightDate = new Date().toISOString().split('T')[0]
    }
    
    const result = await runMCP('mcp_variflight', 'flightHappinessIndex', {
      fnum: flightNumber.toUpperCase(),
      date: flightDate
    })
    return result
  } catch (error) {
    console.error('获取航班幸福指数失败:', error)
    throw error
  }
}