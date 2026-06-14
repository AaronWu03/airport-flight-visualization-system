<template>
  <div class="flight-radar-container">
    <div class="search-section">
      <div class="search-title">
        <span class="radar-pulse"></span>
        FLIGHT RADAR SYSTEM
      </div>
      <div class="search-bar">
        <input 
          type="text" 
          v-model="flightNumber" 
          placeholder="请输入航班号 (例: HU7137)"
          class="cyber-input"
          @keyup.enter="searchFlight"
        />
        <button @click="searchFlight" class="cyber-button" :disabled="isLoading">
          <span v-if="!isLoading">SEARCH</span>
          <span v-else class="loading-spinner"></span>
        </button>
      </div>
      <div v-if="error" class="error-tip">{{ error }}</div>
    </div>
    
    <transition name="slide-up">
      <div class="flight-panel" v-if="flightInfo">
        <div class="panel-header">
          <div class="flight-identity">
            <div class="logo-wrapper">
              <img 
                :src="getAirlineLogoUrl(flightInfo.FlightNo, flightInfo.FlightCompany)" 
                :alt="flightInfo.FlightCompany"
                class="airline-logo"
                @error="handleLogoError"
              />
            </div>
            <div class="text-info">
              <span class="company">{{ flightInfo.FlightCompany }}</span>
              <span class="no">{{ flightInfo.FlightNo }}</span>
            </div>
          </div>
          <div class="status-badge" :class="statusClass(flightInfo.FlightState)">
            {{ flightInfo.FlightState }}
          </div>
        </div>

        <div class="route-display">
          <div class="airport departure">
            <div class="city">{{ flightInfo.FlightDep }}</div>
            <div class="code">{{ flightInfo.FlightDepcode }}</div>
            <div class="time">{{ formatTime(flightInfo.FlightDeptimePlanDate) }}</div>
          </div>

          <div class="route-anim">
            <div class="path-line"></div>
            <div class="moving-plane">✈</div>
          </div>

          <div class="airport arrival">
            <div class="city">{{ flightInfo.FlightArr }}</div>
            <div class="code">{{ flightInfo.FlightArrcode }}</div>
            <div class="time">{{ formatTime(flightInfo.FlightArrtimePlanDate) }}</div>
          </div>
        </div>

        <div class="specs-grid">
          <div class="spec-item">
            <div class="label">AIRCRAFT / 机型</div>
            <div class="val">{{ flightInfo.ftype || flightInfo.generic || '--' }}</div>
          </div>
          <div class="spec-item">
            <div class="label">GATE / 登机口</div>
            <div class="val highlight">{{ flightInfo.BoardGate || '--' }}</div>
          </div>
          <div class="spec-item">
            <div class="label">BAGGAGE / 行李</div>
            <div class="val">{{ flightInfo.BaggageID || '待定' }}</div>
          </div>
          <div class="spec-item">
            <div class="label">WEATHER / 天气</div>
            <div class="val weather">
              <span class="w-icon">{{ getWeatherEmoji(flightInfo.DepWeather) }}</span>
              {{ formatWeather(flightInfo.DepWeather) }}
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { getAirlineLogoSrc, getAirlineLogoPngSrc, getAirlineLogoCode } from '../utils/airlineLogoMap';

const flightNumber = ref('');
const flightInfo = ref(null);
const error = ref('');
const isLoading = ref(false);

const searchFlight = async () => {
  if (!flightNumber.value) {
    error.value = '请输入航班号';
    return;
  }
  
  isLoading.value = true;
  error.value = '';
  flightInfo.value = null;
  
  try {
    const response = await axios.post('http://localhost:3001/api/mcp', {
      toolName: 'searchFlightsByNumber',
      args: {
        fnum: flightNumber.value.toUpperCase(),
        date: new Date().toISOString().split('T')[0]
      }
    });
    
    console.log("获取到的原始数据:", response.data);
    
    // 解析 MCP 返回的嵌套 JSON 字符串
    if (response.data && response.data.content) {
      try {
        const rawData = JSON.parse(response.data.content[0].text);
        if (rawData.code === 200 && rawData.data.length > 0) {
          flightInfo.value = rawData.data[0];
          console.log("解析后的航班信息:", flightInfo.value);
          
          // 绘制航班航线
          drawFlightRoute(flightInfo.value);
        } else {
          error.value = "未查找到该航班信息";
        }
      } catch (parseError) {
        console.error("解析 JSON 失败:", parseError);
        error.value = "数据解析失败，请稍后重试";
      }
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    console.error("查询失败:", errorMsg);
    error.value = "查询失败: " + errorMsg;
  } finally {
    isLoading.value = false;
  }
};

// 格式化时间
const formatTime = (timeString) => {
  if (!timeString) return '--';
  const date = new Date(timeString);
  return date.toTimeString().substring(0, 5);
};

// 格式化天气
const formatWeather = (weatherString) => {
  if (!weatherString) return '--';
  const parts = weatherString.split('|');
  if (parts.length >= 5) {
    return `${parts[0]} / ${parts[4]}℃`;
  }
  return weatherString;
};

// 获取天气Emoji
const getWeatherEmoji = (weatherStr) => {
  if (!weatherStr) return '☁️';
  // 提取第一个词并去掉空格，例如 "晴天 " -> "晴天"
  const status = weatherStr.split('|')[0].trim();
  
  const emojiMap = {
    '晴天': '☀️',
    '多云': '⛅',
    '阴': '☁️',
    '阴天': '☁️',
    '阵雨': '🌦️',
    '雷阵雨': '⛈️',
    '小雨': '🌧️',
    '中雨': '🌧️',
    '大雨': '🌊',
    '雨': '☔',
    '雪': '❄️',
    '雾': '🌫️',
    '霾': '🌫️'
  };

  return emojiMap[status] || '🔹'; // 如果没匹配到，返回一个科技感的小方块
};

// 状态样式
const statusClass = (status) => {
  if (!status) return 'status-plan';
  const statusLower = status.toLowerCase();
  if (statusLower.includes('计划')) return 'status-plan';
  if (statusLower.includes('起飞')) return 'status-departed';
  if (statusLower.includes('到达')) return 'status-arrived';
  return 'status-plan';
};

// 获取航空公司logo URL
const getAirlineLogoUrl = (flightNo, airlineName) => {
  // 优先尝试SVG
  const svgSrc = getAirlineLogoSrc(null, airlineName, flightNo);
  return svgSrc;
};

// logo加载失败时的回退
const handleLogoError = (e) => {
  const img = e.target;
  if (img.src.endsWith('.svg')) {
    // SVG失败，尝试PNG
    const flightNo = flightInfo.value?.FlightNo;
    const airlineName = flightInfo.value?.FlightCompany;
    img.src = getAirlineLogoPngSrc(null, airlineName, flightNo);
  } else {
    // PNG也失败，使用默认图
    img.src = '/assets/airline-logos/default.svg';
  }
};

// 初始化 Cesium 实例
let viewer = null;
let routeEntities = [];

// 初始化 Cesium
const initCesium = () => {
  if (viewer) return;
  
  try {
    // 检查是否已经在 FlightDetail 中初始化了 Cesium
    const cesiumContainer = document.getElementById('cesiumContainer');
    if (cesiumContainer) {
      // 使用现有的 Cesium 实例
      // 这里需要根据实际情况获取 Cesium 实例
      // 由于我们无法直接访问 FlightDetail 组件的 viewer，我们需要在 FlightDetail 中暴露一个方法
      console.log('Cesium container found, but we need to get the viewer instance from FlightDetail');
    } else {
      // 创建新的 Cesium 实例
      console.log('Creating new Cesium instance');
    }
  } catch (error) {
    console.error('Error initializing Cesium:', error);
  }
};

// 绘制航班航线
const drawFlightRoute = (flightInfo) => {
  if (!flightInfo) return;
  
  try {
    // 清除旧的实体
    if (viewer) {
      viewer.entities.removeAll();
    }
    
    // 提取坐标
    const depLon = parseFloat(flightInfo.DepAirportLon) || 110.457;
    const depLat = parseFloat(flightInfo.DepAirportLat) || 19.941;
    const arrLon = parseFloat(flightInfo.ArrAirportLon) || 118.866;
    const arrLat = parseFloat(flightInfo.ArrAirportLat) || 31.735;
    
    console.log('Flight route coordinates:', {
      departure: { lon: depLon, lat: depLat },
      arrival: { lon: arrLon, lat: arrLat }
    });
    
    // 这里需要使用 viewer 实例绘制航线
    // 由于我们无法直接访问 viewer，我们暂时只打印坐标
    // 在实际应用中，我们需要在 FlightDetail 组件中实现这个功能
  } catch (error) {
    console.error('Error drawing flight route:', error);
  }
};
</script>

<style scoped>
/* 1. 容器与全局字体设置 */
.flight-radar-container {
  padding: 0; /* 取消内边距，让内容去贴合边框 */
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  width: 100%; /* 撑满父容器 */
  max-width: 500px; /* 适当调大最大宽度 */
  margin: 0 auto;
}

/* 2. 搜索区：不再是孤岛，而是面板的“顶栏” */
.search-section {
  background: #FFFFFF;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(13, 110, 253, 0.3);
  border-bottom: none; /* 与下方详情页衔接 */
  border-radius: 12px 12px 2px 2px; /* 只给顶部圆角 */
  padding: 20px;
}

.search-title {
  color: #0D6EFD;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 2px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.radar-pulse {
  width: 8px;
  height: 8px;
  background: #0D6EFD;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.search-bar {
  display: flex;
  gap: 8px;
}

/* 3. 输入框：变长、变酷 */
.cyber-input {
  flex: 1;
  background: #D8D8D8;
  border: 1px solid rgba(13, 110, 253, 0.4);
  border-radius: 4px;
  padding: 12px 16px;
  color: #212529;
  font-family: "Courier New", Courier, monospace; /* 输入时就有代码感 */
  font-size: 16px;
  transition: all 0.3s;
}

.cyber-input:focus {
  border-color: #0D6EFD;
  box-shadow: 0 0 10px rgba(13, 110, 253, 0.2);
  outline: none;
}

.cyber-button {
  background: #0D6EFD;
  color: #0f172a;
  border: none;
  border-radius: 6px;
  padding: 0 20px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s;
}

.cyber-button:hover:not(:disabled) {
  background: #3D8BFD;
  box-shadow: 0 0 15px rgba(13, 110, 253, 0.5);
}

/* 4. 详情面板：无缝衔接，撑满宽度 */
.flight-panel {
  background: #FFFFFF;
  backdrop-filter: blur(20px);
  /* 重点：底部圆角加大到 16px，看起来更圆润 */
  border-radius: 0 0 16px 16px; 
  padding: 30px;
  border: 1px solid rgba(13, 110, 253, 0.3);
  border-top: none; /* 保持与搜索框的无缝连接 */
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.flight-identity {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-wrapper {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  background: #F8F9FA;
  border-radius: 8px;
  border: 1px solid rgba(13, 110, 253, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.airline-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.text-info {
  display: flex;
  flex-direction: column;
}

.company {
  display: block;
  font-size: 15px;
  color: #6C757D;
  text-transform: uppercase;
}

.no {
  font-size: 26px;
  font-weight: 900;
  color: #212529;
}

.status-badge {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 4px;
  height: fit-content;
  border: 1px solid currentColor;
}

.status-plan { color: #0D6EFD; }
.status-departed { color: #D4A015; }
.status-arrived { color: #198754; }

/* 航线展示区 */
.route-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

/* 城市名称：增加字间距，提升高级感 */
.airport .city {
  font-size: 20px;
  font-weight: 500;
  color: #6C757D;
  text-transform: uppercase;
  letter-spacing: 2px; /* 关键：拉开字间距 */
  margin-bottom: 5px;
}

/* 三字码：力量感的核心 */
.airport .code {
  font-size: 40px; /* 显著加大 */
  font-weight: 800;
  color: #0D6EFD;
  line-height: 1;
  text-shadow: 0 0 20px rgba(13, 110, 253, 0.4);
}

/* 时间：必须等宽 */
.airport .time {
  font-size: 22px;
  color: #D4A015;
  font-family: "Consolas", "Monaco", "Courier New", monospace; /* 模拟电子表 */
  font-weight: bold;
  margin-top: 8px;
}

.route-anim {
  flex: 1;
  position: relative;
  margin: 0 20px;
  height: 40px;
}

.path-line {
  position: absolute;
  top: 50%;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(13, 110, 253,0.5), transparent);
}

.moving-plane {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(90deg);
  font-size: 20px;
  color: #0D6EFD;
  text-shadow: 0 0 10px #0D6EFD;
  animation: plane-fly 3s infinite linear;
}

/* 底部数据网格：更加整齐 */
.specs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px; /* 间距拉开一点，不要让圆角挤在一起 */
  margin-top: 25px;
  padding-top: 25px;
  border-top: 1px solid rgba(13, 110, 253, 0.15);
}

.spec-item:hover {
  background: rgba(13, 110, 253, 0.08);
  border-color: rgba(13, 110, 253, 0.3);
  transform: translateY(-2px);
}

/* 2. 给底部的小数据卡片（specs-grid 里的项）也加圆角 */
.spec-item {
  /* 给每个小格加个淡淡的背景，圆角才看得出来 */
  background: #F8F9FA; 
  padding: 15px;
  border-radius: 10px; /* 小格子的圆角 */
  border: 1px solid rgba(13, 110, 253, 0.1); /* 极细的边框增加精密感 */
  transition: all 0.3s ease;
}

.spec-item .label {
  font-size: 11px;
  font-weight: 700;
  color: #ADB5BD;
  text-transform: uppercase;
  letter-spacing: 1.5px; /* 标签小写字母拉开间距非常好看 */
  margin-bottom: 6px;
}

.spec-item .val {
  font-size: 18px;
  font-weight: 600;
  color: #212529;
}

.val.highlight { color: #198754; }

.weather {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* --- 动画效果 --- */
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(13, 110, 253, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(13, 110, 253, 0); }
  100% { box-shadow: 0 0 0 0 rgba(13, 110, 253, 0); }
}

@keyframes plane-fly {
  0% { left: 0%; opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { left: 100%; opacity: 0; }
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.4s ease-out;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
</style>