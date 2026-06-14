<template>
  <div class="page-wrapper">
    
    <header class="global-header">
      <div class="header-content">
        <!-- 左侧：标题区域 -->
        <div class="header-left">
          <h1>全球机场航班动态可视化系统</h1>
          <p class="subtitle">Flight Data Real-time Monitoring System</p>
        </div>
        
        <!-- 中间：中心机场模块 -->
        <div class="header-center">
          <div class="airport-info">
            <span class="airport-icon">📍</span>
            <span class="airport-name">{{ currentCenterAirport.name }}</span>
            <span class="airport-code">{{ currentCenterAirport.code }}</span>
          </div>
        </div>
        
        <!-- 右侧：环境监控模块 -->
        <div class="header-right">
          <div class="weather-section">
            <span class="weather-icon">🌤</span>
            <div class="weather-info">
              <div class="weather-status">多云转晴</div>
              <div class="weather-details">24°C | 东北风 | 45%</div>
            </div>
          </div>
          <div class="divider"></div>
          <div class="time-section">
            <div class="time-date">{{ currentDate }}</div>
            <div class="time-display">{{ currentTime }}</div>
          </div>
          <div class="divider"></div>
          <router-link to="/" class="back-button">
            ← 返回首页
          </router-link>
        </div>
      </div>
    </header>

    <div class="map-full-container">
      <div id="cesiumContainer" class="map-full-area"></div>
      <div class="map-overlay-mask"></div>
      
      <!-- 左侧图表面板容器 -->
      <div class="left-chart-container">
        <div class="chart-panel-individual left-top" v-if="charts.flightVolume" @mouseenter="setActivePanel('leftTop')" :style="{ zIndex: getPanelZIndex('leftTop') }">
          <div class="chart-header">
            <div class="chart-title">📈 航班量分析</div>
            <div class="chart-controls">
            <div class="data-type-switch">
              <button 
                :class="['type-btn', { active: dataType === 'domestic' }]" 
                @click="toggleDataType('domestic')"
              >国内</button>
              <button 
                :class="['type-btn', { active: dataType === 'international' }]" 
                @click="toggleDataType('international')"
              >国际</button>
            </div>
            <select class="country-select" v-model="selectedCountry" @change="updateFlightVolumeChart">
              <option v-for="country in countries" :key="country" :value="country">{{ country }}</option>
            </select>
            <CommonDatePicker 
              v-model:startDate="startDate" 
              v-model:endDate="endDate"
              @change="updateFlightVolumeChart"
            />
          </div>
        </div>
        <div ref="chartFlightVolume" class="chart-container"></div>
      </div>
      
      <div class="chart-panel-individual left-middle" v-if="charts.cancelRate" @mouseenter="setActivePanel('middle')" :style="{ zIndex: getPanelZIndex('middle') }">
        <div class="chart-header">
          <div class="chart-title">📊 航班取消率</div>
          <div class="chart-controls">
            <div class="cancel-rate-date-input" @click="showCancelRateDatePicker = !showCancelRateDatePicker">
              {{ cancelRateDate }}
            </div>
            <div class="date-picker-popup cancel-rate-date-picker" v-if="showCancelRateDatePicker">
              <div class="date-picker-header">
                <button class="date-picker-nav" @click="prevCancelRateMonth">&lt;&lt;</button>
                <span class="date-picker-title">{{ cancelRateYear }}年{{ cancelRateMonth + 1 }}月</span>
                <button class="date-picker-nav" @click="nextCancelRateMonth">&gt;&gt;</button>
              </div>
              <div class="date-picker-weekdays">
                <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
              </div>
              <div class="date-picker-days">
                <span 
                  v-for="(day, index) in cancelRateCalendarDays" 
                  :key="index"
                  :class="getCancelRateDayClass(day)"
                  @click="selectCancelRateDate(day)"
                >{{ day.day }}</span>
              </div>
            </div>
          </div>
        </div>
        <div ref="chartCancelRate" class="chart-container"></div>
      </div>
      
      <div class="chart-panel-individual left-bottom" v-if="charts.utilization" @mouseenter="setActivePanel('bottom')" :style="{ zIndex: getPanelZIndex('bottom') }">
        <div class="chart-header">
          <div class="chart-title">✈️ 航司飞机利用率</div>
          <div class="chart-controls">
            <select class="country-select" v-model="selectedUtilizationAirline" @change="updateUtilizationChart">
              <option v-for="airline in availableUtilizationAirlines" :key="airline" :value="airline">{{ airline === 'all' ? '全部' : airline }}</option>
            </select>
            <CommonDatePicker 
              v-model:startDate="utilizationStartDate" 
              v-model:endDate="utilizationEndDate"
              @change="updateUtilizationChart"
            />
          </div>
        </div>
        <div ref="chartUtilization" class="chart-container"></div>
      </div>
      
      <!-- NKG 周时刻热力图 - 左侧第4个 -->
      <div class="chart-panel-individual nkg-heatmap" v-if="charts.nkgHeatmap" @mouseenter="setActivePanel('nkgHeatmap')" :style="{ zIndex: getPanelZIndex('nkgHeatmap') }">
        <div class="chart-header">
          <div class="chart-title"> 机场周时刻热力图</div>
          <div class="chart-controls">
            <select class="country-select" v-model="heatmapDataType" @change="updateNkgHeatmapChart">
              <option value="total">总计</option>
              <option value="arrivals">进港</option>
              <option value="departures">出港</option>
            </select>
            <div class="heatmap-legend">
              <span class="legend-item"><span class="legend-color" style="background:rgba(13,110,253,0.2)"></span>低</span>
              <span class="legend-item"><span class="legend-color" style="background:rgba(13,110,253,0.5)"></span>中</span>
              <span class="legend-item"><span class="legend-color" style="background:rgba(13,110,253,0.85)"></span>高</span>
            </div>
          </div>
        </div>
        <div ref="chartNkgHeatmap" class="chart-container heatmap-container">
          <div class="chart-loading-overlay" v-if="nkgChartsLoading">图表数据加载中...</div>
        </div>
      </div>
      </div>
      
      <!-- 右侧图表面板容器 -->
      <div class="right-chart-container">
        <div class="chart-panel-individual right-top" v-if="charts.capacity" @mouseenter="setActivePanel('rightTop')" :style="{ zIndex: getPanelZIndex('rightTop') }">
          <div class="chart-header">
            <div class="chart-title">📉 {{ capacityChartMode === 'trend' ? '运力分析' : '三月国内航线排行' }}</div>
            <div class="chart-controls">
              <button 
                class="type-btn" 
                :class="{ active: capacityChartMode === 'ranking' }"
                @click="toggleCapacityChartMode"
              >排行</button>
              <CommonDatePicker 
                v-if="capacityChartMode === 'trend'"
                v-model:startDate="capacityStartDate" 
                v-model:endDate="capacityEndDate"
                @change="updateCapacityChart"
              />
            </div>
          </div>
          <div ref="chartCapacity" class="chart-container"></div>
        </div>
        
        <div class="chart-panel-individual right-middle" v-if="charts.passengerFlow" @mouseenter="setActivePanel('rightMiddle')" :style="{ zIndex: getPanelZIndex('rightMiddle') }">
          <div class="chart-header">
            <div class="chart-title">👥 预估人流量</div>
          </div>
          <div ref="chartPassengerFlow" class="chart-container"></div>
        </div>
        
        <div class="chart-panel-individual right-bottom" v-if="charts.takeoffLanding" @mouseenter="setActivePanel('rightBottom')" :style="{ zIndex: getPanelZIndex('rightBottom') }">
          <div class="chart-header">
            <div class="chart-title">📋 机场起降架次分析</div>
            <div class="chart-controls">
              <select class="country-select" v-model="selectedTakeoffLandingAirport" @change="updateTakeoffLandingChart">
                <option v-for="airport in availableTakeoffLandingAirports" :key="airport" :value="airport">{{ airport }}</option>
              </select>
              <CommonDatePicker 
                v-model:startDate="takeoffLandingStartDate" 
                v-model:endDate="takeoffLandingEndDate"
                @change="updateTakeoffLandingChart"
              />
            </div>
          </div>
          <div ref="chartTakeoffLanding" class="chart-container"></div>
        </div>
        
        <!-- NKG 运营航司排行榜 - 右侧第4个 -->
        <div class="chart-panel-individual nkg-airline" v-if="charts.nkgAirline" @mouseenter="setActivePanel('nkgAirline')" :style="{ zIndex: getPanelZIndex('nkgAirline') }">
          <div class="chart-header">
            <div class="chart-title">🏢 运营航司排行榜</div>
            <div class="chart-controls">
              <select class="country-select" v-model="airlineDataDimension" @change="updateNkgAirlineChart">
                <option value="total">周总量</option>
                <option value="departures">出港</option>
                <option value="arrivals">进港</option>
                <option value="domestic">国内</option>
                <option value="international">国际</option>
              </select>
              <select class="country-select" v-model="nkgAirlineView" @change="updateNkgAirlineChart">
                <option value="bar">柱状图</option>
                <option value="pie">饼图</option>
              </select>
            </div>
          </div>
          <div ref="chartNkgAirline" class="chart-container"></div>
        </div>
        
        <!-- NKG 连通省市分布 - 右侧第5个 -->
        <div class="chart-panel-individual nkg-region" v-if="charts.nkgRegion" @mouseenter="setActivePanel('nkgRegion')" :style="{ zIndex: getPanelZIndex('nkgRegion') }">
          <div class="chart-header">
            <div class="chart-title">🌏 连通省市分布</div>
            <div class="chart-controls">
              <select class="country-select" v-model="regionDataDimension" @change="updateNkgRegionChart">
                <option value="total">周总量</option>
                <option value="departures">出港</option>
                <option value="arrivals">进港</option>
              </select>
              <select class="country-select" v-model="nkgRegionFilter" @change="updateNkgRegionChart">
                <option value="all">全部</option>
                <option value="domestic">国内</option>
                <option value="international">国际</option>
                <option value="hkmo">港澳台</option>
              </select>
            </div>
          </div>
          <div ref="chartNkgRegion" class="chart-container"></div>
        </div>
        
        <!-- NKG 连通机场分布 - 右侧第6个 -->
        <div class="chart-panel-individual nkg-connected-airports" v-if="charts.nkgConnectedAirports" @mouseenter="setActivePanel('nkgConnectedAirports')" :style="{ zIndex: getPanelZIndex('nkgConnectedAirports') }">
          <div class="chart-header">
            <div class="chart-title">✈️ 连通机场分布</div>
            <div class="chart-controls">
              <select class="country-select" v-model="nkgConnectedAirportsDimension" @change="updateNkgConnectedAirportsChart">
                <option value="total">周总量</option>
                <option value="departures">出港</option>
                <option value="arrivals">进港</option>
              </select>
              <select class="country-select" v-model="nkgConnectedAirportsFilter" @change="updateNkgConnectedAirportsChart">
                <option value="all">全部</option>
                <option value="国际">国际</option>
                <option value="港澳台">港澳台</option>
                <option value="省外">省外</option>
                <option value="省内">省内</option>
              </select>
            </div>
          </div>
          <div ref="chartNkgConnectedAirports" class="chart-container"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ====== 以下是独立控件，使用 Teleport 渲染到 body，避免 overflow:hidden 裁剪 ====== -->
  <Teleport to="body">
    <!-- 控制按钮和面板 -->
    <div class="ctrl-bar" data-ctrl-bar>
      <button class="ctrl-btn" @click.stop="handleLayerClick" data-ctrl-btn="layer">
        <span class="btn-icon">🗺️</span>
        <span class="btn-label">图层</span>
      </button>
      <button class="ctrl-btn" @click.stop="handleChartClick" data-ctrl-btn="chart">
        <span class="btn-icon">📊</span>
        <span class="btn-label">图表</span>
      </button>
      <button class="ctrl-btn" :class="{ active: rippleMode }" @click.stop="toggleRippleMode" data-ctrl-btn="ripple">
        <span class="btn-icon">{{ rippleMode ? '🔄' : '📍' }}</span>
        <span class="btn-label">{{ rippleMode ? '波纹' : '散点' }}</span>
      </button>

      <!-- 图层面板 -->
      <div class="panel layer-panel" :style="layerOpen ? panelShowStyle : panelHideStyle">
        <div class="panel-title">图层控制</div>
        <div class="panel-body">
          <label class="chk-item">
            <input type="checkbox" v-model="layers.departureAirports" @change="updateLayerVisibility" />
            <span class="dot blue"></span>出发机场 <span class="cnt">{{ layerCounts.departure }}</span>
          </label>
          <label class="chk-item">
            <input type="checkbox" v-model="layers.arrivalAirports" @change="updateLayerVisibility" />
            <span class="dot green"></span>到达机场 <span class="cnt">{{ layerCounts.arrival }}</span>
          </label>
          <div class="div"></div>
          <label class="chk-item"><input type="checkbox" v-model="layers.labels" @change="updateLayerVisibility" />📝 城市标签</label>
          <label class="chk-item"><input type="checkbox" v-model="layers.weather" @change="updateLayerVisibility" />🌤️ 天气图标</label>
          <label class="chk-item"><input type="checkbox" v-model="layers.weatherParticlesRain" @change="updateWeatherParticleVisibility" />🌧️ 下雨粒子</label>
          <label class="chk-item"><input type="checkbox" v-model="layers.weatherParticlesSnow" @change="updateWeatherParticleVisibility" />❄️ 下雪粒子</label>
          <div class="div"></div>
          <label class="chk-item">
            <input type="checkbox" v-model="layers.arrivalRoutes" @change="updateRouteVisibility" />
            <span class="dot green"></span>到达航线
          </label>
          <label class="chk-item">
            <input type="checkbox" v-model="layers.departureRoutes" @change="updateRouteVisibility" />
            <span class="dot blue"></span>出发航线
          </label>
          <label class="chk-item"><input type="checkbox" v-model="layers.arrivalPlanes" @change="updatePlaneVisibility" />✈️ 到达航班</label>
          <label class="chk-item"><input type="checkbox" v-model="layers.departurePlanes" @change="updatePlaneVisibility" />🛫 出发航班</label>
          <button class="reset-btn" @click="resetLayers">重置图层</button>
        </div>
      </div>

      <!-- 图表面板 -->
      <div class="panel chart-panel" :style="chartOpen ? panelShowStyle : panelHideStyle">
        <div class="panel-title">图表控制</div>
        <div class="panel-body">
          <button class="all-btn" @click="toggleAllCharts">{{ areAllChartsVisible ? '隐藏所有' : '显示所有' }}</button>
          <div class="div"></div>
          <label class="chk-item"><input type="checkbox" v-model="charts.flightVolume" @change="updateChartVisibility" />📈 航班量分析</label>
          <label class="chk-item"><input type="checkbox" v-model="charts.cancelRate" @change="updateChartVisibility" />📊 航班取消率</label>
          <label class="chk-item"><input type="checkbox" v-model="charts.utilization" @change="updateChartVisibility" />✈️ 航司利用率</label>
          <label class="chk-item"><input type="checkbox" v-model="charts.capacity" @change="updateChartVisibility" />📉 运力分析</label>
          <label class="chk-item"><input type="checkbox" v-model="charts.passengerFlow" @change="updateChartVisibility" />👥 预估人流量</label>
          <label class="chk-item"><input type="checkbox" v-model="charts.takeoffLanding" @change="updateChartVisibility" />📋 起降架次</label>
          <div class="div"></div>
          <label class="chk-item"><input type="checkbox" v-model="charts.nkgHeatmap" @change="updateChartVisibility" />🕐 周时刻热力图</label>
          <label class="chk-item"><input type="checkbox" v-model="charts.nkgAirline" @change="updateChartVisibility" />🏢 运营航司排行</label>
          <label class="chk-item"><input type="checkbox" v-model="charts.nkgRegion" @change="updateChartVisibility" />🌏 连通省市分布</label>
          <label class="chk-item"><input type="checkbox" v-model="charts.nkgConnectedAirports" @change="updateChartVisibility" />✈️ 连通机场分布</label>
        </div>
      </div>
    </div>

    <!-- InfoBox -->
    <div class="info-box" v-if="infoBox.show" :style="{ left: infoBox.x + 'px', top: infoBox.y + 'px' }">
      <div class="info-box-head" @mousedown="infoBoxDrag">
        <span class="info-box-tit">{{ infoBox.title }}</span>
        <button class="info-box-x" @click.stop="infoBox.show = false">×</button>
      </div>
      <div class="info-box-body" v-html="infoBox.html"></div>
    </div>

    <!-- 视角切换 -->
    <button class="view-toggle-btn" @click="toggleView">
      <span class="view-icon">{{ currentView === 'global' ? '📍' : currentView === 'asia' ? '🌏' : '✈️' }}</span>
      <span class="view-tooltip">{{ currentView === 'global' ? '亚洲视角' : currentView === 'asia' ? '机场视角' : '全球视角' }}</span>
    </button>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import * as Cesium from 'cesium';
import { getAirlineName } from '../data/airlineCodeMap.js';
import * as echarts from 'echarts';
import CircleWave from '../utils/CircleWave.js';
import CommonDatePicker from '../components/CommonDatePicker.vue';

// Echarts 实例引用
const chartFlightVolume = ref(null);
const chartCancelRate = ref(null);
const chartUtilization = ref(null);
const chartCapacity = ref(null);
const chartPassengerFlow = ref(null);
const chartTakeoffLanding = ref(null);

// NKG 机场专属图表
const chartNkgHeatmap = ref(null);
const chartNkgAirline = ref(null);
const chartNkgRegion = ref(null);
const chartNkgConnectedAirports = ref(null);

// NKG 图表数据
const nkgHeatmapData = ref(null);
const nkgAirlineData = ref(null);
const nkgRegionData = ref(null);
const nkgConnectedAirportsData = ref(null);
const nkgAirlineView = ref('bar');
const nkgRegionFilter = ref('all');
const nkgConnectedAirportsFilter = ref('all'); // 'all' | '国际' | '港澳台' | '省外' | '省内'
const nkgConnectedAirportsDimension = ref('total'); // 'total' | 'departures' | 'arrivals'
const heatmapDataType = ref('total'); // 'total' | 'arrivals' | 'departures'
const airlineDataDimension = ref('total'); // 'total' | 'departures' | 'arrivals' | 'domestic' | 'international'
const regionDataDimension = ref('total'); // 'total' | 'departures' | 'arrivals' | 'domestic' | 'international' | 'hkmo'

let chartInstances = [];

// 单独的图表实例
let chartFlightVolumeInstance = null;
let chartCancelRateInstance = null;
let chartUtilizationInstance = null;
let chartCapacityInstance = null;
let chartPassengerFlowInstance = null;

// 航班数据
let flightData = [];

// 数据类型切换：'domestic' 国内, 'international' 国际
const dataType = ref('domestic');

// 国家列表
const countries = ref([]);

// 选中的国家
const selectedCountry = ref('中国');

// 实时时间
const currentTime = ref('');
const currentDate = ref('');

// 中心机场信息
const currentCenterAirport = reactive({
  name: '南京禄口国际机场',
  code: 'NKG'
});

// 获取今日日期字符串，格式: YYYY/MM/DD
const getTodayStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

// 动态加载指定机场的指定日期数据
const loadAirportDataDynamic = async (airportCode, targetDate = null) => {
  try {
    const dateStr = targetDate || selectedDate.value || getTodayStr();
    const url = `/api/airports-data?airport=${airportCode}&date=${encodeURIComponent(dateStr)}`;
    console.log(`正在加载 ${airportCode} 机场的当日数据: ${dateStr}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.error) {
      console.error('加载机场数据失败:', data.error);
      return null;
    }
    
    console.log(`成功加载 ${airportCode} 机场数据，共 ${data.airports?.length || 0} 个连通机场`);
    return data;
  } catch (error) {
    console.error('加载机场数据失败:', error);
    return null;
  }
};

// InfoBox
const infoBox = reactive({ show: false, title: '', html: '', x: 200, y: 100 });
let ibDrag = false, ibOX = 0, ibOY = 0;
const infoBoxDrag = (e) => { ibDrag = true; ibOX = e.clientX - infoBox.x; ibOY = e.clientY - infoBox.y; };
document.addEventListener('mousemove', (e) => { if (!ibDrag) return; infoBox.x = e.clientX - ibOX; infoBox.y = e.clientY - ibOY; });
document.addEventListener('mouseup', () => { ibDrag = false; });

// 控制面板状态
const layerOpen = ref(false);
const chartOpen = ref(false);

// 调试用：测试按钮点击是否响应
const handleLayerClick = () => {
  console.log('图层按钮被点击, layerOpen:', layerOpen.value);
  layerOpen.value = !layerOpen.value;
  chartOpen.value = false;
};

const handleChartClick = () => {
  console.log('图表按钮被点击, chartOpen:', chartOpen.value);
  chartOpen.value = !chartOpen.value;
  layerOpen.value = false;
};

// 面板显示/隐藏的内联样式
const panelHideStyle = {
  opacity: '0',
  visibility: 'hidden',
  transform: 'translateY(-8px)',
  pointerEvents: 'none'
};
const panelShowStyle = {
  opacity: '1',
  visibility: 'visible',
  transform: 'translateY(0)',
  pointerEvents: 'auto'
};

// 更新时间函数
const updateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[now.getDay()];
  
  currentDate.value = `${year}年${month}月${day}日 ${weekDay}`;
  currentTime.value = `${hours}:${minutes}:${seconds}`;
};

let timeInterval = null;
let planeInterval = null;

// 日期范围
const selectedDate = ref('');
const startDate = ref('');
const endDate = ref('');
const minDate = ref('');
const maxDate = ref('');

// 临时日期用于日期选择器
const tempStartDate = ref('');
const tempEndDate = ref('');

// 当前年月
const currentYear = ref(2026);
const currentMonth = ref(3);

// 日期选择器状态
// 可用日期集合
const availableDates = ref([]);

// 航班取消率数据
let cancelRateData = [];

// 飞机利用率数据
let utilizationData = [];

// 飞机利用率日期选择
const utilizationStartDate = ref('');
const utilizationEndDate = ref('');
// 飞机利用率航司选择
const selectedUtilizationAirline = ref('all');
const availableUtilizationAirlines = ref([]);

// 运力数据
let capacityData = [];

// 航线排行数据
let rankingData = [];

// 机场起降架次数据
let takeoffLandingData = [];

// 机场起降架次日期选择
const takeoffLandingStartDate = ref('');
const takeoffLandingEndDate = ref('');
// 机场起降架次机场选择
const selectedTakeoffLandingAirport = ref('南京禄口机场');
const availableTakeoffLandingAirports = ref([]);

// 动态滚动相关变量
let takeoffLandingChartInstance = null;
let takeoffLandingScrollTimer = null;
let currentDisplayIndex = 0;
let currentFullDates = [];
let currentFullCapacity = [];

// 颜色处理函数 - 使颜色变亮
const lightenColor = (hex, percent) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
};

// 运力日期选择
const capacityStartDate = ref('');
const capacityEndDate = ref('');

// 运力图表模式: 'trend' 趋势图, 'ranking' 排行图
const capacityChartMode = ref('trend');

// 运力图表实例
let capacityChartInstance = null;

// 运力图表动态滚动相关变量
let capacityScrollTimer = null;
let capacityDisplayIndex = 0;
let capacityFullDates = [];
let capacityCurrentData = [];
let capacityPreviousData = [];
let capacityGrowthRate = [];

// 预估人流量动态滚动相关变量
let passengerFlowScrollTimer = null;
let passengerFlowDisplayIndex = 0;
let passengerFlowFullDates = [];
let passengerFlowFullData = [];
let passengerFlowFullGrowthRate = [];

// 航司名称映射已从 src/data/airlineCodeMap.js 导入，getAirlineName 已全局可用

// 可用航司列表
const availableAirlines = ref([]);

// 默认选中的航司
const defaultAirlines = ['CZ', 'MU', 'CA', 'HU', 'MF', '3U', 'ZH', '9C', 'SC', 'G5'];
const selectedAirlines = ref([...defaultAirlines]);

// 航司多选下拉框状态
const showAirlineDropdown = ref(false);

// 面板动态层级控制
const activePanel = ref('top'); // 'top' | 'middle'

// 切换面板激活状态
const setActivePanel = (panel) => {
  activePanel.value = panel;
};

// 获取面板的 z-index
const getPanelZIndex = (panel) => {
  return activePanel.value === panel ? 2000 : 1000;
};

// 航班取消率日期选择
const cancelRateDate = ref('2026-04-11');
const showCancelRateDatePicker = ref(false);
const cancelRateYear = ref(2026);
const cancelRateMonth = ref(3);

// 航班取消率可用日期
const cancelRateAvailableDates = ref([]);

// 日期范围显示
const dateRangeDisplay = computed(() => {
  if (!startDate.value || !endDate.value) return '选择日期';
  const start = new Date(startDate.value);
  const end = new Date(endDate.value);
  return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
});

// 处理航班数据
const processFlightData = (data) => {
  flightData = data;
  
  // 获取所有国家
  const countrySet = new Set(data.map(item => item.国家));
  countries.value = Array.from(countrySet);
  
  // 获取所有日期
  const dates = [...new Set(data.map(item => item.日期))].sort();
  minDate.value = dates[0];
  maxDate.value = dates[dates.length - 1];
  
  // 设置可用日期数组
  availableDates.value = dates;
  
  // 默认选择最近7天
  const defaultEndDate = dates[dates.length - 1];
  const defaultStartIndex = Math.max(0, dates.length - 7);
  const defaultStartDate = dates[defaultStartIndex];
  
  startDate.value = defaultStartDate;
  endDate.value = defaultEndDate;
  
  // 设置临时日期用于日期选择器
  tempStartDate.value = defaultStartDate;
  tempEndDate.value = defaultEndDate;
  
  // 设置当前年月
  const date = new Date(defaultEndDate);
  currentYear.value = date.getFullYear();
  currentMonth.value = date.getMonth();
};

// 获取指定国家和日期范围的数据
const getFilteredFlightData = (country, start, end) => {
  return flightData.filter(item => {
    return item.国家 === country && item.日期 >= start && item.日期 <= end;
  }).sort((a, b) => new Date(a.日期) - new Date(b.日期));
};

// 切换数据类型
const toggleDataType = async (type) => {
  if (dataType.value === type) return;
  
  dataType.value = type;
  const filePath = type === 'domestic' ? '/assets/flight_data.json' : '/assets/flight_data_international.json';
  
  try {
    const response = await fetch(filePath);
    const data = await response.json();
    processFlightData(data);
    updateFlightVolumeChart();
    loadAirportChartsData(currentCenterAirport.code || 'NKG');
  } catch (error) {
    console.error('加载航班数据失败:', error);
  }
};

// 更新航班量图表
const updateFlightVolumeChart = () => {
  if (!chartFlightVolume.value) return;
  
  const data = getFilteredFlightData(selectedCountry.value, startDate.value, endDate.value);
  
  if (data.length === 0) return;
  
  // 销毁旧图表
  chartInstances = chartInstances.filter(chart => {
    const dom = chart.getDom();
    if (dom === chartFlightVolume.value) {
      chart.dispose();
      return false;
    }
    return true;
  });
  
  // 创建新图表
  const chart = echarts.init(chartFlightVolume.value);
  chart.setOption(getFlightVolumeOption(data));
  chart.resize(); // 确保 Canvas 画布完美贴合容器尺寸
  chartInstances.push(chart);
};

// 日期选择器方法


// 航班取消率日期选择器方法
const prevCancelRateMonth = () => {
  if (cancelRateMonth.value === 0) {
    cancelRateYear.value--;
    cancelRateMonth.value = 11;
  } else {
    cancelRateMonth.value--;
  }
};

const nextCancelRateMonth = () => {
  if (cancelRateMonth.value === 11) {
    cancelRateYear.value++;
    cancelRateMonth.value = 0;
  } else {
    cancelRateMonth.value++;
  }
};

const cancelRateCalendarDays = computed(() => {
  const days = [];
  const firstDay = new Date(cancelRateYear.value, cancelRateMonth.value, 1);
  const lastDay = new Date(cancelRateYear.value, cancelRateMonth.value + 1, 0);
  const startDay = firstDay.getDay();
  
  const prevLastDay = new Date(cancelRateYear.value, cancelRateMonth.value, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({ day: prevLastDay - i, month: 'prev', available: false });
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const dateStr = `${cancelRateYear.value}-${String(cancelRateMonth.value + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({ 
      day: i, 
      month: 'current', 
      available: cancelRateAvailableDates.value.includes(dateStr),
      dateStr: dateStr 
    });
  }
  
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, month: 'next', available: false });
  }
  
  return days;
});

const getCancelRateDayClass = (day) => {
  const classes = [];
  
  if (day.month !== 'current') {
    classes.push('other-month');
  }
  
  if (!day.available) {
    classes.push('not-available');
  }
  
  if (day.dateStr === cancelRateDate.value) {
    classes.push('selected-date');
  }
  
  return classes;
};

const selectCancelRateDate = (day) => {
  if (!day.available || !day.dateStr) return;
  cancelRateDate.value = day.dateStr;
  showCancelRateDatePicker.value = false;
  updateCancelRateChart();
};

// 航司多选方法
const toggleAirline = (airline) => {
  const index = selectedAirlines.value.indexOf(airline);
  if (index > -1) {
    selectedAirlines.value.splice(index, 1);
  } else {
    selectedAirlines.value.push(airline);
  }
  updateCancelRateChart();
};

const selectAllAirlines = () => {
  if (selectedAirlines.value.length === availableAirlines.value.length) {
    selectedAirlines.value = [];
  } else {
    selectedAirlines.value = [...availableAirlines.value];
  }
  updateCancelRateChart();
};

// 加载航班取消率数据
const loadCancelRateData = async () => {
  try {
    const response = await fetch('/assets/中国航司取消率.json');
    cancelRateData = await response.json();
    
    const airlineSet = new Set(cancelRateData.map(item => item.航线));
    availableAirlines.value = Array.from(airlineSet).sort();
    
    const dateSet = new Set(cancelRateData.map(item => item.日期));
    cancelRateAvailableDates.value = Array.from(dateSet).sort();
    
    const availableDatesList = cancelRateAvailableDates.value;
    if (availableDatesList.includes('2026-04-11')) {
      cancelRateDate.value = '2026-04-11';
    } else if (availableDatesList.length > 0) {
      cancelRateDate.value = availableDatesList[availableDatesList.length - 1];
    }
    
    updateCancelRateChart();
  } catch (error) {
    console.error('加载航班取消率数据失败:', error);
  }
};

// 加载飞机利用率数据
const loadUtilizationData = async () => {
  try {
    const response = await fetch('/assets/飞机利用率.json');
    utilizationData = await response.json();
    
    const airlineSet = new Set(utilizationData.map(item => item.航司));
    availableUtilizationAirlines.value = Array.from(airlineSet).sort();
    
    const dates = [...new Set(utilizationData.map(item => item.日期))].sort();
    if (dates.length > 0) {
      const defaultEndDate = dates[dates.length - 1];
      const defaultStartIndex = Math.max(0, dates.length - 7);
      const defaultStartDate = dates[defaultStartIndex];
      
      utilizationStartDate.value = defaultStartDate;
      utilizationEndDate.value = defaultEndDate;
    }
    
    updateUtilizationChart();
  } catch (error) {
    console.error('加载飞机利用率数据失败:', error);
  }
};

// 更新飞机利用率图表
const updateUtilizationChart = () => {
  if (!chartUtilization.value || utilizationData.length === 0) return;
  
  let filteredData = utilizationData.filter(item => item.航司 === selectedUtilizationAirline.value);
  
  if (utilizationStartDate.value && utilizationEndDate.value) {
    filteredData = filteredData.filter(item => item.日期 >= utilizationStartDate.value && item.日期 <= utilizationEndDate.value);
  }
  
  filteredData.sort((a, b) => new Date(a.日期) - new Date(b.日期));
  
  const dates = filteredData.map(item => {
    const date = new Date(item.日期);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  const utilization = filteredData.map(item => item.飞机利用率);
  const wideBody = filteredData.map(item => item.宽体机);
  const narrowBody = filteredData.map(item => item.窄体机);
  
  chartOptions.utilization.xAxis.data = dates;
  chartOptions.utilization.series[0].data = utilization;
  chartOptions.utilization.series[1].data = wideBody;
  chartOptions.utilization.series[2].data = narrowBody;
  
  if (chartUtilization.value && chartUtilization.value.clientWidth > 0) {
    const chart3 = echarts.init(chartUtilization.value);
    chart3.setOption(chartOptions.utilization);
  }
};

// 飞机利用率日期选择器方法


// 加载运力数据
const loadCapacityData = async () => {
  try {
    const response = await fetch('/assets/国内运力.json');
    capacityData = await response.json();
    
    if (capacityData.length > 0) {
      capacityStartDate.value = '2026-03-15';
      capacityEndDate.value = '2026-04-08';
    }
  } catch (error) {
    console.error('加载运力数据失败:', error);
  }
};

// 加载预估人流量数据
const loadPassengerFlowData = async () => {
  try {
    const response = await fetch('/assets/预估人流量.json');
    const data = await response.json();
    
    passengerFlowFullDates = data.map(item => {
      const date = new Date(item.日期);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    passengerFlowFullData = data.map(item => item['预估客流量 (人次)']);
    passengerFlowFullGrowthRate = data.map(item => (item['增长率 (较均值)'] * 100).toFixed(1));
  } catch (error) {
    console.error('加载预估人流量数据失败:', error);
  }
};

// 加载机场起降架次数据
const loadTakeoffLandingData = async () => {
  try {
    const response = await fetch('/assets/机场起降架次.json');
    takeoffLandingData = await response.json();
    
    const airportSet = new Set(takeoffLandingData.map(item => item.机场));
    availableTakeoffLandingAirports.value = Array.from(airportSet).sort();
    
    takeoffLandingStartDate.value = '2026-03-15';
    takeoffLandingEndDate.value = '2026-04-08';
  } catch (error) {
    console.error('加载机场起降架次数据失败:', error);
  }
};

// 加载航线排行数据
const loadRankingData = async () => {
  try {
    const response = await fetch('/assets/三月中国运力航线排行.json');
    rankingData = await response.json();
  } catch (error) {
    console.error('加载航线排行数据失败:', error);
  }
};

// 更新机场起降架次图表
const updateTakeoffLandingChart = () => {
  if (!chartTakeoffLanding.value || takeoffLandingData.length === 0) return;
  
  let filteredData = takeoffLandingData.filter(item => item.机场 === selectedTakeoffLandingAirport.value);
  
  if (takeoffLandingStartDate.value && takeoffLandingEndDate.value) {
    filteredData = filteredData.filter(item => item.日期 >= takeoffLandingStartDate.value && item.日期 <= takeoffLandingEndDate.value);
  }
  
  filteredData.sort((a, b) => new Date(a.日期) - new Date(b.日期));
  
  currentFullDates = filteredData.map(item => {
    const date = new Date(item.日期);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  currentFullCapacity = filteredData.map(item => item.当期运力);
  
  if (!takeoffLandingChartInstance) {
    takeoffLandingChartInstance = echarts.init(chartTakeoffLanding.value);
    chartInstances.push(takeoffLandingChartInstance);
  }
  
  if (takeoffLandingScrollTimer) {
    clearInterval(takeoffLandingScrollTimer);
    takeoffLandingScrollTimer = null;
  }
  
  currentDisplayIndex = 0;
  
  if (currentFullDates.length <= 7) {
    takeoffLandingChartInstance.setOption({
      xAxis: {
        data: currentFullDates
      },
      series: [{
        type: 'bar',
        name: '起降架次',
        data: currentFullCapacity
      }]
    });
  } else {
    startTakeoffLandingScroll();
  }
};

// 启动动态滚动
const startTakeoffLandingScroll = () => {
  const displayCount = 7;
  
  const updateChart = () => {
    const endIndex = Math.min(currentDisplayIndex + displayCount, currentFullDates.length);
    const displayDates = currentFullDates.slice(currentDisplayIndex, endIndex);
    const displayCapacity = currentFullCapacity.slice(currentDisplayIndex, endIndex);
    
    takeoffLandingChartInstance.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(240, 244, 248, 0.95)',
        borderColor: 'rgba(56, 189, 248, 0.4)',
        borderWidth: 1,
        textStyle: { color: '#334155', fontSize: 12 },
        appendToBody: false,
        confine: true,
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['起降架次'],
        textStyle: { color: '#475569', fontSize: 10 },
        itemGap: 10,
        itemWidth: 12,
        itemHeight: 10,
        bottom: 5,
        left: 'center'
      },
      grid: {
        left: '4%',
        right: '4%',
        bottom: '20%',
        top: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: displayDates,
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.3)' } },
        axisLabel: { color: '#64748b', fontSize: 10 },
        axisTick: { show: false },
        axisGap: 15
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.25)', type: 'dashed' } },
        axisTick: { show: false }
      },
      series: [{
        type: 'bar',
        name: '起降架次',
        barWidth: '35%',
        barGap: '10%',
        barCategoryGap: '30%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#88b09b' },
            { offset: 1, color: '#38bdf8' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        data: displayCapacity
      }]
    });
    
    currentDisplayIndex++;
    if (currentDisplayIndex + displayCount > currentFullDates.length) {
      currentDisplayIndex = 0;
    }
  };
  
  updateChart();
  takeoffLandingScrollTimer = setInterval(updateChart, 2000);
};

// 切换运力图表模式
const toggleCapacityChartMode = async () => {
  if (capacityScrollTimer) {
    clearInterval(capacityScrollTimer);
    capacityScrollTimer = null;
  }
  
  if (capacityChartMode.value === 'trend' && rankingData.length === 0) {
    await loadRankingData();
    console.log('Ranking data loaded:', rankingData);
  }
  capacityChartMode.value = capacityChartMode.value === 'trend' ? 'ranking' : 'trend';
  console.log('Chart mode:', capacityChartMode.value);
  updateCapacityChart();
};

// ========== 机场专属图表（根据中心机场动态加载） ==========

const nkgChartsLoading = ref(false);

// 1. 加载机场图表数据（统一API，自动生成缺失数据）
const loadAirportChartsData = async (airportCode) => {
  nkgChartsLoading.value = true;
  try {
    const dateStr = selectedDate.value || getTodayStr();
    const apiUrl = `/api/airport-charts?airport=${airportCode}&date=${encodeURIComponent(dateStr)}`;
    console.log(`[图表数据] 正在加载 ${airportCode} 的图表数据...`);

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      console.error(`[图表数据] ${airportCode} 加载失败:`, result.error);
      return;
    }

    if (result.warning) {
      console.warn(`[图表数据] ${airportCode} 部分数据缺失:`, result.warning);
    }

    // 注入数据到响应式变量
    nkgHeatmapData.value = result.heatmap?.weeks ? result.heatmap : null;
    nkgAirlineData.value = result.airline?.airlines ? result.airline : null;
    nkgRegionData.value = result.region?.regions ? result.region : null;
    nkgConnectedAirportsData.value = result.connectedAirports?.airports ? result.connectedAirports : null;

    console.log(`[图表数据] ${airportCode} 加载完成 (${result.generated === 'now' ? '自动生成' : '缓存'}), `
      + `热力图:${nkgHeatmapData.value ? '✓' : '✗'} `
      + `航司:${nkgAirlineData.value ? '✓' : '✗'} `
      + `省市:${nkgRegionData.value ? '✓' : '✗'} `
      + `连通机场:${nkgConnectedAirportsData.value ? '✓' : '✗'}`);

    // 初始化NKG图表（整合到 initCharts 逻辑中，不在此直接调用）
    // NKG图表将在 handleChartVisibilityChange 中按需初始化
  } catch (error) {
    console.error(`[图表数据] 加载 ${airportCode} 失败:`, error);
  } finally {
    nkgChartsLoading.value = false;
  }
};

// ==================== 周时刻热力图工具函数（可复用） ====================
// 通用函数：根据当前日期从机场周时刻数据中找到当前周
const getAirportWeekData = (heatmapData) => {
  if (!heatmapData || !heatmapData.weeks) return null;
  
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const todayStr = `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
  
  for (const week of heatmapData.weeks) {
    const [startStr, endStr] = week.dateRange.split(' - ');
    if (todayStr >= startStr && todayStr <= endStr) {
      return week;
    }
  }
  
  // 如果不在任何周范围内，返回最后一周
  return heatmapData.weeks[heatmapData.weeks.length - 1];
};

// 通用函数：渲染机场周时刻热力图
const renderAirportHeatmap = (chartContainer, weekData, dataType) => {
  if (!chartContainer || !weekData) return null;
  
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  
  // 根据类型选择数据
  const dataMap = {
    arrivals: weekData.arrivals,
    departures: weekData.departures,
    total: weekData.total
  };
  const hourData = dataMap[dataType] || weekData.total;
  
  // 构建热力图数据 [x, y, value]
  const heatmapValues = [];
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 24; x++) {
      heatmapValues.push([x, y, Math.round(hourData[x] / 7)]);
    }
  }
  
  // 计算最大值
  let maxVal = 0;
  for (const item of heatmapValues) {
    if (item[2] > maxVal) maxVal = item[2];
  }
  
  const chart = echarts.init(chartContainer);
  
  chart.setOption({
    tooltip: {
      position: 'top',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderColor: 'rgba(59, 130, 246, 0.5)',
      borderWidth: 1,
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      formatter: (params) => {
        const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return `${dayNames[params.value[1]]} ${hours[params.value[0]]}<br/>航班量: ${params.value[2]}`;
      }
    },
    grid: {
      left: '10%',
      right: '3%',
      bottom: '30%',
      top: '4%'
    },
    xAxis: {
      type: 'category',
      data: hours,
      splitArea: { show: false },
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
      axisLabel: {
        color: '#64748b',
        fontSize: 10,
        rotate: 0,
        interval: 2,
        formatter: (val) => val.split(':')[0] + '时'
      },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'category',
      data: days,
      splitArea: { show: false },
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
      axisLabel: { color: '#64748b', fontSize: 10 },
      axisTick: { show: false }
    },
    visualMap: {
      min: 0,
      max: maxVal,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: '3%',
      itemWidth: 15,
      itemHeight: 280,
      inRange: {
        color: ['#e8f0fe', '#a8c8f8', '#5a9cf0', '#0d6efd', '#0044b0']
      },
      textStyle: { color: '#64748b', fontSize: 10 },
      text: ['高', '低']
    },
    series: [{
      type: 'heatmap',
      data: heatmapValues,
      itemStyle: {
        borderColor: '#f0f4f8',
        borderWidth: 1,
        borderRadius: 2
      },
      label: { show: false },
      emphasis: {
        itemStyle: {
          shadowBlur: 8,
          shadowColor: 'rgba(0,0,0,0.25)',
          borderColor: '#fff',
          borderWidth: 2
        }
      }
    }]
  });
  
  chart.resize();
  return chart;
};

// 2. NKG 周时刻热力图
let nkgHeatmapChartInstance = null;

const updateNkgHeatmapChart = () => {
  // 销毁旧图表
  if (nkgHeatmapChartInstance) {
    chartInstances = chartInstances.filter(chart => {
      if (chart === nkgHeatmapChartInstance) {
        chart.dispose();
        return false;
      }
      return true;
    });
    nkgHeatmapChartInstance = null;
  }
  
  // 关键：检查 DOM ref 是否存在
  if (!chartNkgHeatmap.value || !nkgHeatmapData.value) return;
  
  // 获取当前周数据并渲染
  const weekData = getAirportWeekData(nkgHeatmapData.value);
  if (!weekData) return;
  
  nkgHeatmapChartInstance = renderAirportHeatmap(
    chartNkgHeatmap.value,
    weekData,
    heatmapDataType.value
  );
  
  if (nkgHeatmapChartInstance) {
    chartInstances.push(nkgHeatmapChartInstance);
  }
};

const initNkgHeatmapChart = () => {
  updateNkgHeatmapChart();
};

// 3. 运营航司排行榜
let nkgAirlineChartInstance = null;

// 根据维度获取航司数据值
const getAirlineValue = (airline, dimension) => {
  switch(dimension) {
    case 'departures': return airline.departures || 0;
    case 'arrivals': return airline.arrivals || 0;
    case 'domestic': return (airline.totalDomestic || 0);
    case 'international': return (airline.totalIntl || 0);
    default: return airline.total || 0;
  }
};

const updateNkgAirlineChart = () => {
  if (!chartNkgAirline.value || !nkgAirlineData.value || !nkgAirlineData.value.airlines) return;
  
  // 销毁旧图表
  if (nkgAirlineChartInstance) {
    chartInstances = chartInstances.filter(chart => {
      if (chart === nkgAirlineChartInstance) {
        chart.dispose();
        return false;
      }
      return true;
    });
    nkgAirlineChartInstance = null;
  }
  
  // 创建新图表
  const chart = echarts.init(chartNkgAirline.value);
  
  const allAirlines = nkgAirlineData.value.airlines;
  const dimension = airlineDataDimension.value;
  
  // 过滤掉nan数据
  const validAirlines = allAirlines.filter(a => a.name && a.name !== 'nan' && a.name !== 'NaN');
  
  // 按当前维度排序并取前10
  const sortedAirlines = [...validAirlines].sort((a, b) => getAirlineValue(b, dimension) - getAirlineValue(a, dimension));
  const topAirlines = sortedAirlines.slice(0, 10);
  const reversedAirlines = [...topAirlines].reverse();
  
  if (nkgAirlineView.value === 'bar') {
    chart.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        appendToBody: false,
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(59, 130, 246, 0.08)' } },
        formatter: (params) => {
          const d = reversedAirlines[params[0].dataIndex];
          const dimLabels = {
            total: ['周总量', d.total],
            departures: ['出港', d.departures],
            arrivals: ['进港', d.arrivals],
            domestic: ['国内', d.totalDomestic],
            international: ['国际', d.totalIntl]
          };
          const [dimLabel, dimVal] = dimLabels[dimension] || ['总量', d.total];
          return `<b>${d.name}</b><br/>${dimLabel}: <b>${dimVal.toLocaleString()}</b><br/>出港: <b>${d.departures.toLocaleString()}</b> / 进港: <b>${d.arrivals.toLocaleString()}</b><br/>国内: <b>${d.totalDomestic.toLocaleString()}</b> / 国际: <b>${d.totalIntl.toLocaleString()}</b>`;
        }
      },
      grid: {
        left: '4%',
        right: '12%',
        bottom: '12%',
        top: '4%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 10,
          formatter: (v) => v.toLocaleString()
        },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.08)', type: 'dashed' } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: reversedAirlines.map(a => a.name),
        axisLine: { show: false },
        axisLabel: {
          color: '#475569',
          fontSize: 9,
          fontWeight: 500,
          interval: 0,
          rotate: -15,
          align: 'right',
          verticalAlign: 'bottom',
          padding: [0, 0, -5, 0]
        },
        axisTick: { show: false }
      },
      series: [{
        type: 'bar',
        data: reversedAirlines.map((a, idx) => {
          const rank = idx;
          const colors = [
            new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#f59e0b' },
              { offset: 1, color: '#ef4444' }
            ]),
            new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#8b5cf6' },
              { offset: 1, color: '#d946ef' }
            ]),
            new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#10b981' },
              { offset: 1, color: '#06b6d4' }
            ])
          ];
          const defaultColor = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#38bdf8' },
            { offset: 1, color: '#0284c7' }
          ]);
          return {
            value: getAirlineValue(a, dimension),
            itemStyle: {
              borderRadius: [0, 4, 4, 0],
              color: rank < 3 ? colors[rank] : defaultColor
            }
          };
        }),
        barWidth: '50%',
        label: {
          show: true,
          position: 'right',
          color: '#334155',
          fontSize: 10,
          fontWeight: 600,
          formatter: (params) => params.value.toLocaleString()
        }
      }]
    });
  } else {
    // 饼图
    chart.setOption({
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        appendToBody: false,
        formatter: (params) => `${params.name}<br/>航班量: <b>${(params.value).toLocaleString()}</b><br/>占比: <b>${params.percent}%</b>`
      },
      legend: {
        orient: 'vertical',
        right: '3%',
        top: 'center',
        textStyle: { color: '#475569', fontSize: 10 },
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 8,
        formatter: (name) => name.length > 6 ? name.substring(0, 6) + '…' : name
      },
      series: [{
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['35%', '50%'],
        data: topAirlines.map(a => ({
          name: a.name,
          value: getAirlineValue(a, dimension)
        })),
        label: { show: false },
        emphasis: {
          itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.2)' }
        },
        color: [
          '#f59e0b', '#d946ef', '#06b6d4', '#10b981', '#8b5cf6',
          '#ef4444', '#f97316', '#3b82f6', '#14b8a6', '#a855f7'
        ]
      }]
    });
  }
  
  chart.resize();
  chartInstances.push(chart);
  nkgAirlineChartInstance = chart;
};

const initNkgAirlineChart = () => {
  updateNkgAirlineChart();
};

// 4. 连通省市分布
let nkgRegionChartInstance = null;

// 根据维度获取区域数据值
const getRegionValue = (region, dimension) => {
  switch(dimension) {
    case 'departures': return region.departures || 0;
    case 'arrivals': return region.arrivals || 0;
    default: return region.total || 0;
  }
};

// 根据分类过滤区域
const filterRegionsByCategory = (regions, filter) => {
  // 先过滤掉nan数据
  let filtered = regions.filter(r => r.name && r.name !== 'nan' && r.name !== 'NaN');
  if (filter === 'all') return filtered;
  return filtered.filter(r => {
    const cat = (r.category || '').toLowerCase();
    if (filter === 'domestic') return cat.includes('国内');
    if (filter === 'international') return cat.includes('国际');
    if (filter === 'hkmo') return cat.includes('港澳台');
    return true;
  });
};

const updateNkgRegionChart = () => {
  if (!chartNkgRegion.value || !nkgRegionData.value || !nkgRegionData.value.regions) return;
  
  // 销毁旧图表
  if (nkgRegionChartInstance) {
    chartInstances = chartInstances.filter(chart => {
      if (chart === nkgRegionChartInstance) {
        chart.dispose();
        return false;
      }
      return true;
    });
    nkgRegionChartInstance = null;
  }
  
  // 创建新图表
  const chart = echarts.init(chartNkgRegion.value);
  
  let regions = nkgRegionData.value.regions;
  const dimension = regionDataDimension.value;
  const categoryFilter = nkgRegionFilter.value;
  
  // 先按分类过滤
  regions = filterRegionsByCategory(regions, categoryFilter);
  
  // 按当前维度排序并取前10
  const sortedRegions = [...regions].sort((a, b) => getRegionValue(b, dimension) - getRegionValue(a, dimension));
  const topRegions = sortedRegions.slice(0, 10);
  const reversedRegions = [...topRegions].reverse();
  
  // 根据分类获取颜色
  const getCategoryColor = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('国内')) {
      return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
        { offset: 0, color: '#38bdf8' },
        { offset: 1, color: '#0284c7' }
      ]);
    } else if (cat.includes('国际')) {
      return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
        { offset: 0, color: '#fb923c' },
        { offset: 1, color: '#ea580c' }
      ]);
    } else if (cat.includes('港澳台')) {
      return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
        { offset: 0, color: '#a855f7' },
        { offset: 1, color: '#7c3aed' }
      ]);
    }
    return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
      { offset: 0, color: '#64748b' },
      { offset: 1, color: '#334155' }
    ]);
  };
  
  const dimLabels = {
    total: '周总量',
    departures: '出港',
    arrivals: '进港'
  };
  
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderColor: 'rgba(59, 130, 246, 0.5)',
      borderWidth: 1,
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      appendToBody: false,
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(59, 130, 246, 0.08)' } },
      formatter: (params) => {
        const d = reversedRegions[params[0].dataIndex];
        const catLabel = d.category || '';
        return `<b>${d.name}</b> (${catLabel})<br/>${dimLabels[dimension]}: <b>${getRegionValue(d, dimension).toLocaleString()}</b><br/>出港: <b>${(d.departures || 0).toLocaleString()}</b> / 进港: <b>${(d.arrivals || 0).toLocaleString()}</b>`;
      }
    },
    grid: {
      left: '4%',
      right: '12%',
      bottom: '12%',
      top: '6%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 10,
        formatter: (v) => v.toLocaleString()
      },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.08)', type: 'dashed' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: reversedRegions.map(r => r.name),
      axisLine: { show: false },
      axisLabel: {
        color: '#475569',
        fontSize: 9,
        fontWeight: 500,
        interval: 0,
        rotate: -15,
        align: 'right',
        verticalAlign: 'bottom',
        padding: [0, 0, -5, 0]
      },
      axisTick: { show: false }
    },
    series: [{
      type: 'bar',
      data: reversedRegions.map(r => ({
        value: getRegionValue(r, dimension),
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: getCategoryColor(r.category)
        }
      })),
      barWidth: '50%',
      label: {
        show: true,
        position: 'right',
        color: '#334155',
        fontSize: 10,
        fontWeight: 600,
        formatter: (params) => params.value.toLocaleString()
      }
    }]
  });
  
  chart.resize();
  chartInstances.push(chart);
  nkgRegionChartInstance = chart;
};

const initNkgRegionChart = () => {
  updateNkgRegionChart();
};

// 5. 连通机场分布
let nkgConnectedAirportsChartInstance = null;

const getConnectedAirportValue = (airport, dimension) => {
  switch(dimension) {
    case 'departures': return airport.departures || 0;
    case 'arrivals': return airport.arrivals || 0;
    default: return airport.total || 0;
  }
};

const filterConnectedAirportsByCategory = (airports, filter) => {
  if (filter === 'all') return airports;
  return airports.filter(a => a.category === filter);
};

const updateNkgConnectedAirportsChart = () => {
  if (!chartNkgConnectedAirports.value || !nkgConnectedAirportsData.value || !nkgConnectedAirportsData.value.airports) return;
  
  if (nkgConnectedAirportsChartInstance) {
    chartInstances = chartInstances.filter(chart => {
      if (chart === nkgConnectedAirportsChartInstance) {
        chart.dispose();
        return false;
      }
      return true;
    });
    nkgConnectedAirportsChartInstance = null;
  }
  
  const chart = echarts.init(chartNkgConnectedAirports.value);
  
  let airports = nkgConnectedAirportsData.value.airports;
  const dimension = nkgConnectedAirportsDimension.value;
  const categoryFilter = nkgConnectedAirportsFilter.value;
  
  airports = filterConnectedAirportsByCategory(airports, categoryFilter);
  
  const sortedAirports = [...airports].sort((a, b) => getConnectedAirportValue(b, dimension) - getConnectedAirportValue(a, dimension));
  const topAirports = sortedAirports.slice(0, 10);
  const reversedAirports = [...topAirports].reverse();
  
  const getCategoryColor = (category) => {
    const colors = {
      '国际': new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#fb923c' }, { offset: 1, color: '#ea580c' }]),
      '港澳台': new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#a855f7' }, { offset: 1, color: '#7c3aed' }]),
      '省外': new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#38bdf8' }, { offset: 1, color: '#0284c7' }]),
      '省内': new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#10b981' }, { offset: 1, color: '#059669' }])
    };
    return colors[category] || colors['省外'];
  };
  
  const dimLabels = { total: '周总量', departures: '出港', arrivals: '进港' };
  
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderColor: 'rgba(59, 130, 246, 0.5)',
      borderWidth: 1,
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      appendToBody: false,
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(59, 130, 246, 0.08)' } },
      formatter: (params) => {
        const d = reversedAirports[params[0].dataIndex];
        return `<b>${d.name} (${d.iataCode})</b> - ${d.region}<br/>分类: <b>${d.category}</b><br/>${dimLabels[dimension]}: <b>${getConnectedAirportValue(d, dimension).toLocaleString()}</b><br/>出港: <b>${(d.departures || 0).toLocaleString()}</b> / 进港: <b>${(d.arrivals || 0).toLocaleString()}</b>`;
      }
    },
    grid: { left: '4%', right: '12%', bottom: '5%', top: '6%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 10, formatter: (v) => v.toLocaleString() },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.08)', type: 'dashed' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: reversedAirports.map(a => a.name),
      axisLine: { show: false },
      axisLabel: { color: '#475569', fontSize: 9, fontWeight: 500, interval: 0, rotate: -15, align: 'right', verticalAlign: 'bottom', padding: [0, 0, -5, 0] },
      axisTick: { show: false }
    },
    series: [{
      type: 'bar',
      data: reversedAirports.map(a => ({
        value: getConnectedAirportValue(a, dimension),
        itemStyle: { borderRadius: [0, 4, 4, 0], color: getCategoryColor(a.category) }
      })),
      barWidth: '50%',
      label: { show: true, position: 'right', color: '#334155', fontSize: 10, fontWeight: 600, formatter: (params) => params.value.toLocaleString() }
    }]
  });
  
  chart.resize();
  chartInstances.push(chart);
  nkgConnectedAirportsChartInstance = chart;
};

const initNkgConnectedAirportsChart = () => {
  updateNkgConnectedAirportsChart();
};

// 更新预估人流量图表
const updatePassengerFlowChart = () => {
  if (!chartPassengerFlow.value) return;
  
  if (!chartPassengerFlowInstance) {
    chartPassengerFlowInstance = echarts.init(chartPassengerFlow.value);
    chartInstances.push(chartPassengerFlowInstance);
  }
  
  const displayCount = 7;
  
  const updateChart = () => {
    const endIndex = Math.min(passengerFlowDisplayIndex + displayCount, passengerFlowFullDates.length);
    const displayDates = passengerFlowFullDates.slice(passengerFlowDisplayIndex, endIndex);
    const displayData = passengerFlowFullData.slice(passengerFlowDisplayIndex, endIndex);
    const displayGrowthRate = passengerFlowFullGrowthRate.slice(passengerFlowDisplayIndex, endIndex);
    
    chartPassengerFlowInstance.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(240, 244, 248, 0.95)',
        borderColor: 'rgba(56, 189, 248, 0.4)',
        borderWidth: 1,
        textStyle: { color: '#334155', fontSize: 12 },
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const dataIndex = params[0].dataIndex;
          const growthRate = displayGrowthRate[dataIndex];
          return `${params[0].axisValue}<br/>• <span style="color:#334155">预估客流量:</span> ${params[0].value.toLocaleString()} 人次<br/>• <span style="color:#0ea5e9">增长率:</span> ${growthRate}%`;
        }
      },
      grid: {
        left: '4%',
        right: '6%',
        bottom: '8%',
        top: '5%',
        height: '82%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        max: 150000,
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
        axisLabel: { color: '#475569', fontSize: 11, interval: 'auto' },
        splitLine: { lineStyle: { type: 'dashed', color: 'rgba(148, 163, 184, 0.2)' } },
        axisTick: { show: false },
        splitNumber: 4
      },
      yAxis: {
        type: 'category',
        data: displayDates,
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
        axisTick: { show: false },
        inverse: true,
        boundaryGap: true
      },
      series: [{
        name: '预估客流量',
        type: 'bar',
        data: displayData,
        barWidth: 10,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#0ea5e9' },
            { offset: 0.5, color: '#38bdf8' },
            { offset: 1, color: '#7dd3fc' }
          ]),
          borderRadius: [0, 6, 6, 0]
        },
        label: {
          show: true,
          position: 'right',
          color: '#475569',
          fontSize: 10,
          formatter: (params) => {
            return params.value.toLocaleString();
          }
        },
        animationDuration: 800,
        animationEasing: 'cubicOut'
      }]
    }, true);
    
    passengerFlowDisplayIndex++;
    if (passengerFlowDisplayIndex + displayCount > passengerFlowFullDates.length) {
      passengerFlowDisplayIndex = 0;
    }
  };
  
  updateChart();
  
  if (passengerFlowScrollTimer) {
    clearInterval(passengerFlowScrollTimer);
  }
  
  if (passengerFlowFullDates.length > displayCount) {
    passengerFlowScrollTimer = setInterval(updateChart, 3000);
  }
};

// 更新运力图表
const updateCapacityChart = () => {
  if (!chartCapacity.value) return;
  
  if (capacityChartMode.value === 'trend') {
    // 显示运力趋势图
    const filteredData = capacityData.filter(item => {
      return item.日期 >= capacityStartDate.value && item.日期 <= capacityEndDate.value;
    });
    
    filteredData.sort((a, b) => new Date(a.日期) - new Date(b.日期));
    
    capacityFullDates = filteredData.map(item => {
      const date = new Date(item.日期);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    capacityCurrentData = filteredData.map(item => item.当期运力);
    capacityPreviousData = filteredData.map(item => item['2025年同期运力']);
    capacityGrowthRate = filteredData.map(item => {
      const rate = parseFloat(item['运力同比增幅']?.replace('%', '') || '0');
      return rate;
    });
  
    
    if (!capacityChartInstance) {
      capacityChartInstance = echarts.init(chartCapacity.value);
      chartInstances.push(capacityChartInstance);
    }
    
    if (capacityScrollTimer) {
      clearInterval(capacityScrollTimer);
      capacityScrollTimer = null;
    }
    
    capacityDisplayIndex = 0;
    
    if (capacityFullDates.length <= 7) {
      capacityChartInstance.setOption({
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(240, 244, 248, 0.95)',
          borderColor: 'rgba(56, 189, 248, 0.4)',
          borderWidth: 1,
          textStyle: { color: '#334155', fontSize: 12 },
          axisPointer: { type: 'shadow' }
        },
        legend: {
          data: ['当期运力', '同期运力', '涨幅'],
          textStyle: { color: '#475569', fontSize: 10 },
          itemGap: 10,
          itemWidth: 12,
          itemHeight: 10,
          bottom: 5,
          left: 'center'
        },
        grid: {
          left: '4%',
          right: '4%',
          bottom: '20%',
          top: '8%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: capacityFullDates,
          axisLine: { lineStyle: { color: 'rgba(86, 118, 94, 0.2)' } },
          axisLabel: { color: '#64748b', fontSize: 11 },
          axisTick: { show: false },
          axisGap: 15
        },
        yAxis: [
          {
            type: 'value',
            axisLine: { lineStyle: { color: 'rgba(86, 118, 94, 0.2)' } },
            axisLabel: { color: '#64748b', fontSize: 11 },
            splitLine: { lineStyle: { type: 'dashed', color: 'rgba(86, 118, 94, 0.1)' } }
          },
          {
            type: 'value',
            axisLine: { lineStyle: { color: 'rgba(86, 118, 94, 0.2)' } },
            axisLabel: { color: '#475569', fontSize: 11, formatter: '{value}%' },
            splitLine: { show: false }
          }
        ],
        series: [{
          type: 'bar',
          name: '当期运力',
          barWidth: '35%',
          itemStyle: { color: '#e8aab8', borderRadius: [4, 4, 0, 0] },
          data: capacityCurrentData
        }, {
          type: 'bar',
          name: '同期运力',
          barWidth: '35%',
          itemStyle: { color: 'rgba(163, 177, 138, 0.8)' , borderRadius: [4, 4, 0, 0]},
          data: capacityPreviousData
        }, {
          type: 'line',
          name: '涨幅',
          yAxisIndex: 1,
          lineStyle: { color: '#927ab8' },
          itemStyle: { color: '#927ab8', borderColor: '#fdfdfd' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(146, 118, 18, 0.3)' },
              { offset: 1, color: 'rgba(146, 118, 18, 0.05)' }
            ])
          },
          data: capacityGrowthRate
        }]
      }, true);
    } else {
      startCapacityScroll();
    }
  } else {
    // 显示航线排行图
    const maxCapacity = Math.max(...rankingData.map(item => item.运力));
    
    const ghostRainbowColors = [
      '#a67474', // 第1名 - 砖红/晚樱红
      '#bfa46f', // 第2名 - 琥珀橙/落叶黄
      '#c9a063', // 第3名 - 古铜金/琥珀黄
      '#38bdf8', // 第4名 - 亮蓝
      '#88b09b', // 第5名 - 青瓷色
      '#5e8a9a', // 第6名 - 灰湖蓝/冷蓝墨
      '#5e8a9a', // 第7名 - 灰湖蓝/冷蓝墨
      '#8c7a9a', // 第8名 - 丁香灰/幽灵紫
      '#8c7a9a', // 第9名 - 丁香灰/幽灵紫
      '#8c7a9a'  // 第10名 - 丁香灰/幽灵紫
    ];
    
    const rankingOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(240, 244, 248, 0.95)',
        borderColor: 'rgba(56, 189, 248, 0.3)',
        borderWidth: 1,
        textStyle: { color: '#334155', fontSize: 12 },
      },
      grid: {
        left: '0%',
        right: '12%',
        top: '8%',
        bottom: '2%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        show: false,
        max: maxCapacity * 1.2
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: rankingData.map(item => `${item.排名} ${item.航线}`),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { 
          color: (params) => {
            if (!params.value) return '#64748b';
            const rank = parseInt(params.value.split(' ')[0]);
            return ghostRainbowColors[rank - 1] || '#64748b';
          },
          fontSize: 11,
          interval: 0
        },
        gap: 15
      },
      series: [{
        name: '运力',
        type: 'bar',
        data: rankingData.map(item => item.运力),
        barWidth: 10,
        barGap: 10,
        showBackground: true,
        backgroundStyle: { color: 'rgba(255, 255, 255, 0.05)', borderRadius: 6 },
        itemStyle: {
          borderRadius: 6,
          color: (params) => {
            const baseColor = ghostRainbowColors[params.dataIndex] || '#38bdf8';
            return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: baseColor },
              { offset: 1, color: lightenColor(baseColor, 20) }
            ]);
          }
        },
        label: {
          show: true,
          position: 'right',
          color: '#475569',
          fontSize: 12,
          formatter: '{c} ✈️'
        }
      }]
    };
    
    capacityChartInstance.setOption(rankingOption, true);
  }
};

// 启动运力图表动态滚动
const startCapacityScroll = () => {
  const displayCount = 7;
  
  const updateChart = () => {
    const endIndex = Math.min(capacityDisplayIndex + displayCount, capacityFullDates.length);
    const displayDates = capacityFullDates.slice(capacityDisplayIndex, endIndex);
    const displayCurrent = capacityCurrentData.slice(capacityDisplayIndex, endIndex);
    const displayPrevious = capacityPreviousData.slice(capacityDisplayIndex, endIndex);
    const displayGrowth = capacityGrowthRate.slice(capacityDisplayIndex, endIndex);
    
    capacityChartInstance.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(240, 244, 248, 0.95)',
        borderColor: 'rgba(56, 189, 248, 0.4)',
        borderWidth: 1,
        textStyle: { color: '#334155', fontSize: 12 },
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
          data: ['当期运力', '同期运力', '涨幅'],
          textStyle: { color: '#475569', fontSize: 10 },
          itemGap: 10,
          itemWidth: 12,
          itemHeight: 10,
          bottom: 5,
          left: 'center'
        },
        grid: {
          left: '4%',
          right: '4%',
          bottom: '20%',
          top: '8%',
          containLabel: true
        },
      xAxis: {
        type: 'category',
        data: displayDates,
        axisLine: { lineStyle: { color: 'rgba(86, 118, 94, 0.2)' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
        axisTick: { show: false },
        axisGap: 15
      },
      yAxis: [
        {
          type: 'value',
          axisLine: { lineStyle: { color: 'rgba(86, 118, 94, 0.2)' } },
          axisLabel: { color: '#64748b', fontSize: 11 },
          splitLine: { lineStyle: { type: 'dashed', color: 'rgba(86, 118, 94, 0.1)' } }
        },
        {
          type: 'value',
          axisLine: { lineStyle: { color: 'rgba(86, 118, 94, 0.2)' } },
          axisLabel: { color: '#64748b', fontSize: 11, formatter: '{value}%' },
          splitLine: { show: false }
        }
      ],
      series: [{
        type: 'bar',
        name: '当期运力',
        data: displayCurrent,
        barWidth: '35%',
        itemStyle: {
          color: '#e8aab8',
          borderRadius: [4, 4, 0, 0]
        }
      }, {
        type: 'bar',
        name: '同期运力',
        data: displayPrevious,
        barWidth: '35%',
        itemStyle: {
          color: 'rgba(163, 177, 138, 0.8)',
          borderRadius: [4, 4, 0, 0]
        }
      }, {
        type: 'line',
        name: '涨幅',
        yAxisIndex: 1,
        data: displayGrowth,
        lineStyle: { color: '#f4b842' },
        itemStyle: { color: '#f4b842', borderColor: '#fdfdfd' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(233, 150, 122, 0.3)' },
            { offset: 1, color: 'rgba(233, 150, 122, 0.05)' }
          ])
        }
      }]
    }, true);
    
    capacityDisplayIndex++;
    if (capacityDisplayIndex + displayCount > capacityFullDates.length) {
      capacityDisplayIndex = 0;
    }
  };
  
  updateChart();
  capacityScrollTimer = setInterval(updateChart, 2000);
};

// 航班取消率动态滚动相关变量
let cancelRateScrollTimer = null;
let cancelRateDisplayIndex = 0;
let cancelRateFullAirlines = [];
let cancelRateFullAirlineNames = {};
let cancelRateFullExecuteFlights = [];
let cancelRateFullCancelFlights = [];
let cancelRateFullCancelRate = [];
let cancelRateFullLastYearCancelRate = [];
let cancelRateFullCancelRateChange = [];

// 获取航班取消率图表配置（柱状图+折线图混合）
const getCancelRateOption = (airlines, executeFlights, cancelFlights, cancelRate, lastYearCancelRate, cancelRateChange, airlineNames) => {
  if (!chartCancelRate.value) return {};
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: { color: '#999' }
      },
      backgroundColor: 'rgba(240, 244, 248, 0.95)',
      borderColor: '#56765e',
      borderWidth: 1,
      textStyle: { color: '#334155', fontSize: 12 },
      formatter: (params) => {
        const code = params[0].axisValue;
        const name = airlineNames[code] || code;
        let result = `<div style="font-weight:bold;margin-bottom:8px;">${name} (${code})</div>`;
        params.forEach(param => {
          const color = param.color;
          const name = param.seriesName;
          const value = param.value;
          const unit = name.includes('率') ? '%' : '架次';
          result += `<div style="display:flex;align-items:center;margin:4px 0;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:8px;"></span>
            <span>${name}: ${value}${unit}</span>
          </div>`;
        });
        return result;
      }
    },
    legend: {
      show: true,
      bottom: 5,
      left: 'center',
      textStyle: { color: '#475569', fontSize: 10 },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 8
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '22%',
      top: '8%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: airlines,
      axisLine: { lineStyle: { color: '#6b8e6b' } },
      axisLabel: { 
        color: '#475569', 
        fontSize: 10,
        interval: 0,
        rotate: 0
      },
      axisTick: { show: false },
      boundaryGap: true
    },
    yAxis: [
      {
        type: 'value',
        name: '航班量(架次)',
        nameTextStyle: { color: '#475569', fontSize: 10 },
        axisLine: { show: false },
        axisLabel: { color: '#64748b', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(107, 142, 107, 0.3)', type: 'dashed' } },
        axisTick: { show: false }
      },
      {
        type: 'value',
        name: '比率(%)',
        nameTextStyle: { color: '#475569', fontSize: 10 },
        axisLine: { show: false },
        axisLabel: { color: '#475569', fontSize: 10, formatter: '{value}%' },
        splitLine: { show: false },
        axisTick: { show: false }
      }
    ],
    series: [
      {
        name: '执行航班',
        type: 'bar',
        stack: 'total',
        barWidth: '40%',
        data: executeFlights,
        itemStyle: { color: '#56765e' }
      },
      {
        name: '取消航班',
        type: 'bar',
        stack: 'total',
        barWidth: '40%',
        data: cancelFlights,
        itemStyle: { color: '#e57373', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '取消率',
        type: 'line',
        yAxisIndex: 1,
        data: cancelRate,
        smooth: true,
        lineStyle: { color: '#ffd54f', width: 2 },
        itemStyle: { color: '#ffd54f' },
        symbol: 'circle',
        symbolSize: 6
      },
      {
        name: '同期取消率',
        type: 'line',
        yAxisIndex: 1,
        data: lastYearCancelRate,
        smooth: true,
        lineStyle: { color: '#b39ddb', width: 2, type: 'dashed' },
        itemStyle: { color: '#b39ddb' },
        symbol: 'circle',
        symbolSize: 6
      },
      {
        name: '同比',
        type: 'line',
        yAxisIndex: 1,
        data: cancelRateChange,
        smooth: true,
        lineStyle: { color: '#81d4fa', width: 2 },
        itemStyle: { color: '#81d4fa' },
        symbol: 'circle',
        symbolSize: 6
      }
    ]
  };
};

// 启动航班取消率动态滚动
const startCancelRateScroll = () => {
  const displayCount = 6;
  
  const updateChart = () => {
    const endIndex = Math.min(cancelRateDisplayIndex + displayCount, cancelRateFullAirlines.length);
    const displayAirlines = cancelRateFullAirlines.slice(cancelRateDisplayIndex, endIndex);
    const displayExecute = cancelRateFullExecuteFlights.slice(cancelRateDisplayIndex, endIndex);
    const displayCancel = cancelRateFullCancelFlights.slice(cancelRateDisplayIndex, endIndex);
    const displayCancelRate = cancelRateFullCancelRate.slice(cancelRateDisplayIndex, endIndex);
    const displayLastYear = cancelRateFullLastYearCancelRate.slice(cancelRateDisplayIndex, endIndex);
    const displayChange = cancelRateFullCancelRateChange.slice(cancelRateDisplayIndex, endIndex);
    
    chartCancelRateInstance.setOption(getCancelRateOption(displayAirlines, displayExecute, displayCancel, displayCancelRate, displayLastYear, displayChange, cancelRateFullAirlineNames), true);
    
    cancelRateDisplayIndex++;
    if (cancelRateDisplayIndex + displayCount > cancelRateFullAirlines.length) {
      cancelRateDisplayIndex = 0;
    }
  };
  
  updateChart();
  cancelRateScrollTimer = setInterval(updateChart, 2000);
};

// 更新航班取消率图表
const updateCancelRateChart = () => {
  if (!chartCancelRate.value) return;
  
  if (!chartCancelRateInstance) {
    chartCancelRateInstance = echarts.init(chartCancelRate.value);
    chartInstances.push(chartCancelRateInstance);
  }
  
  // 停止之前的滚动定时器
  if (cancelRateScrollTimer) {
    clearInterval(cancelRateScrollTimer);
    cancelRateScrollTimer = null;
  }
  
  // 获取所有航司数据
  const filteredData = cancelRateData.filter(item => {
    return item.日期 === cancelRateDate.value;
  });
  
  filteredData.sort((a, b) => {
    const order = ['CZ', 'MU', 'CA', 'HU', 'MF', '3U', 'ZH', '9C', 'SC', 'G5'];
    const aIndex = order.indexOf(a.航线);
    const bIndex = order.indexOf(b.航线);
    return (aIndex === -1 ? 100 : aIndex) - (bIndex === -1 ? 100 : bIndex);
  });
  
  cancelRateFullAirlines = filteredData.map(item => item.航线);
  cancelRateFullExecuteFlights = filteredData.map(item => (item.国内执行 || 0) + (item.国际执行 || 0));
  cancelRateFullCancelFlights = filteredData.map(item => (item.国内取消 || 0) + (item.国际取消 || 0));
  cancelRateFullCancelRate = filteredData.map(item => parseFloat(((item.取消率 || 0) * 100).toFixed(2)));
  cancelRateFullLastYearCancelRate = filteredData.map(item => parseFloat(((item['取消率.1'] || 0) * 100).toFixed(2)));
  cancelRateFullCancelRateChange = filteredData.map(item => parseFloat(((item.取消率同比 || 0) * 100).toFixed(2)));
  
  // 构建航司名称映射
  cancelRateFullAirlineNames = {};
  filteredData.forEach(item => {
    cancelRateFullAirlineNames[item.航线] = getAirlineName(item.航线);
  });
  
  cancelRateDisplayIndex = 0;
  
  // 如果航司数量超过6个，启动动态滚动
  if (cancelRateFullAirlines.length > 6) {
    startCancelRateScroll();
  } else {
    // 否则直接显示所有航司
    chartCancelRateInstance.setOption(getCancelRateOption(
      cancelRateFullAirlines,
      cancelRateFullExecuteFlights,
      cancelRateFullCancelFlights,
      cancelRateFullCancelRate,
      cancelRateFullLastYearCancelRate,
      cancelRateFullCancelRateChange,
      cancelRateFullAirlineNames
    ), true);
  }
  
  chartCancelRateInstance.resize();
};

// 获取航班量图表配置（渐变堆叠面积图）
const getFlightVolumeOption = (data) => {
  const dates = data.map(item => {
    const date = new Date(item.日期);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(240, 244, 248, 0.95)',
      borderColor: '#56765e',
      borderWidth: 1,
      textStyle: { color: '#334155', fontSize: 12 },
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#56765e'
        }
      }
    },
    legend: {
      show: true,
      bottom: '0%',
      textStyle: { color: '#475569', fontSize: 10 },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 12
    },
    grid: {
      left: '4%',
      right: '4%',
      bottom: '18%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: '#6b8e6b' } },
      axisLabel: { color: '#475569', fontSize: 11 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: '#475569', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(107, 142, 107, 0.3)', type: 'dashed' } },
      axisTick: { show: false }
    },
    series: [
      {
        name: '执行航班',
        type: 'line',
        stack: 'total',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#475569', width: 3 },
        itemStyle: { color: '#475569', borderWidth: 2, borderColor: '#94a3b8' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(56, 189, 248, 0.8)' },
            { offset: 0.5, color: 'rgba(56, 189, 248, 0.4)' },
            { offset: 1, color: 'rgba(56, 189, 248, 0.05)' }
            ]
          }
        },
        data: data.map(item => item.执行航班)
      },
      {
        name: '取消航班',
        type: 'line',
        stack: 'total',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#e57373', width: 3 },
        itemStyle: { color: '#e57373', borderWidth: 2, borderColor: '#56765e' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(229, 115, 115, 0.8)' },
              { offset: 0.5, color: 'rgba(229, 115, 115, 0.4)' },
              { offset: 1, color: 'rgba(229, 115, 115, 0.05)' }
            ]
          }
        },
        data: data.map(item => item.取消航班)
      },
      {
        name: '计划总数',
        type: 'line',
        stack: 'total',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#8fbc8f', width: 3 },
        itemStyle: { color: '#8fbc8f', borderWidth: 2, borderColor: '#56765e' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(143, 188, 143, 0.8)' },
              { offset: 0.5, color: 'rgba(143, 188, 143, 0.4)' },
              { offset: 1, color: 'rgba(143, 188, 143, 0.05)' }
            ]
          }
        },
        data: data.map(item => item.计划总数)
      }
    ]
  };
};

// Echarts 配置项（响应式对象，方便后续替换真实数据）
const chartOptions = reactive({
  flightVolume: {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(240, 244, 248, 0.95)',
      borderColor: '#56765e',
      borderWidth: 1,
      textStyle: { color: '#334155', fontSize: 12 }
    },
    grid: {
      left: '4%',
      right: '4%',
      bottom: '12%',
      top: '18%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
      axisLine: { lineStyle: { color: 'rgba(136, 176, 155, 0.3)' } },
      axisLabel: { color: '#475569', fontSize: 11 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: '#475569', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(136, 176, 155, 0.15)', type: 'dashed' } },
      axisTick: { show: false }
    },
    series: [{
      name: '航班量',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: [120, 85, 420, 580, 450, 280],
      lineStyle: { color: '#6b8e7b', width: 3 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(107, 142, 123, 0.4)' },
          { offset: 1, color: 'rgba(107, 142, 123, 0.05)' }
        ])
      },
      itemStyle: { color: '#6b8e7b', borderWidth: 2, borderColor: '#8a9a8a' }
    }]
  },
  
  utilization: {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(240, 244, 248, 0.95)',
      borderColor: 'rgba(136, 176, 155, 0.3)',
      borderWidth: 1,
      textStyle: { color: '#334155', fontSize: 12 }
    },
    legend: {
      show: true,
      bottom: '0%',
      textStyle: { color: '#475569', fontSize: 10 },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 8
    },
    grid: {
      left: '4%',
      right: '4%',
      bottom: '15%',
      top: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: [],
      axisLine: { lineStyle: { color: 'rgba(136, 176, 155, 0.3)' } },
      axisLabel: { color: '#475569', fontSize: 11 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: '#475569', fontSize: 11, formatter: '{value} h/天' },
      splitLine: { lineStyle: { color: 'rgba(136, 176, 155, 0.15)', type: 'dashed' } },
      axisTick: { show: false }
    },
    series: [
      {
        name: '飞机利用率',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: [],
        lineStyle: { color: '#f0e68c', width: 3 },
        itemStyle: { color: '#f0e68c', borderWidth: 2, borderColor: '#daa520' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(240, 230, 140, 0.3)' },
            { offset: 1, color: 'rgba(240, 230, 140, 0.05)' }
          ])
        }
      },
      {
        name: '宽体机',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: [],
        lineStyle: { color: '#87ceeb', width: 3 },
        itemStyle: { color: '#87ceeb', borderWidth: 2, borderColor: '#4169e1' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(135, 206, 235, 0.3)' },
            { offset: 1, color: 'rgba(135, 206, 235, 0.05)' }
          ])
        }
      },
      {
        name: '窄体机',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: [],
        lineStyle: { color: '#90ee90', width: 3 },
        itemStyle: { color: '#90ee90', borderWidth: 2, borderColor: '#32cd32' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(144, 238, 144, 0.3)' },
            { offset: 1, color: 'rgba(144, 238, 144, 0.05)' }
          ])
        }
      }
    ]
  },
  
  capacity: {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(240, 244, 248, 0.95)',
      borderColor: '#56765e',
      borderWidth: 1,
      textStyle: { color: '#334155', fontSize: 12 }
    },
    legend: {
      show: true,
      bottom: '0%',
      textStyle: { color: '#475569', fontSize: 10 },
      itemWidth: 14,
      itemHeight: 14,
      itemGap: 16
    },
    grid: {
      left: '4%',
      right: '4%',
      bottom: '15%',
      top: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: [],
      axisLine: { lineStyle: { color: 'rgba(86, 118, 94, 0.2)' } },
      axisLabel: { color: '#475569', fontSize: 11 },
      axisTick: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        name: '运力',
        axisLine: { lineStyle: { color: 'rgba(86, 118, 94, 0.2)' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { type: 'dashed', color: 'rgba(86, 118, 94, 0.1)' } },
        axisTick: { show: false }
      },
      {
        type: 'value',
        name: '涨幅(%)',
        axisLine: { lineStyle: { color: 'rgba(86, 118, 94, 0.2)' } },
        axisLabel: { color: '#64748b', fontSize: 11, formatter: '{value}%' },
        splitLine: { show: false },
        axisTick: { show: false }
      }
    ],
    series: [
      {
        name: '当期运力',
        type: 'bar',
        barWidth: '35%',
        data: [],
        itemStyle: { color: '#e8aab8', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '同期运力',
        type: 'bar',
        barWidth: '35%',
        data: [],
        itemStyle: { color: 'rgba(163, 177, 138, 0.8)', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '涨幅',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: [],
        lineStyle: { color: '#927ab8', width: 3 },
        itemStyle: { color: '#927ab8', borderWidth: 2, borderColor: '#fdfdfd' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(233, 150, 122, 0.3)' },
            { offset: 1, color: 'rgba(233, 150, 122, 0.05)' }
          ])
        }
      }
    ]
  },
  
  passengerFlow: {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(240, 244, 248, 0.95)',
      borderColor: '#56765e',
      borderWidth: 1,
      textStyle: { color: '#475569', fontSize: 10 },
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '4%',
      right: '6%',
      bottom: '8%',
      top: '10%',
      height: '82%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      max: 150000,
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
      axisLabel: { color: '#475569', fontSize: 11, interval: 'auto' },
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(56, 189, 248, 0.1)' } },
      axisTick: { show: false },
      splitNumber: 4
    },
    yAxis: {
      type: 'category',
      data: [],
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
      axisLabel: { color: '#475569', fontSize: 11 },
      axisTick: { show: false },
      inverse: true,
      boundaryGap: true
    },
    series: [{
      name: '预估客流量',
      type: 'bar',
      data: [],
      barWidth: 10,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#38bdf8' },
          { offset: 1, color: '#0ea5e9' }
        ]),
        borderRadius: [0, 6, 6, 0]
      },
      label: {
        show: true,
        position: 'right',
        color: '#1e3a5f',
        fontSize: 10,
        formatter: '{c}'
      }
    }]
  },
  
  takeoffLanding: {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(240, 244, 248, 0.95)',
      borderColor: '#56765e',
      borderWidth: 1,
      textStyle: { color: '#334155', fontSize: 12 }
    },
    grid: {
      left: '4%',
      right: '4%',
      bottom: '5%',
      top: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: [],
      axisLine: { lineStyle: { color: 'rgba(136, 176, 155, 0.3)' } },
      axisLabel: { color: '#64748b', fontSize: 10 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: '#475569', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(136, 176, 155, 0.15)', type: 'dashed' } },
      axisTick: { show: false }
    },
    series: [{
      name: '起降架次',
      type: 'bar',
      data: [],
      barWidth: '50%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#88b09b' },
          { offset: 1, color: '#56765e' }
        ]),
        borderRadius: [4, 4, 0, 0]
      },
      label: {
        show: false
      }
    }]
  }
});

const initCharts = () => {
  setTimeout(() => {
    nextTick(() => {
      // 航班量分析 - 折线图（使用真实数据）
      if (chartFlightVolume.value && chartFlightVolume.value.clientWidth > 0 && flightData.length > 0) {
        if (!chartFlightVolumeInstance) {
          const data = getFilteredFlightData(selectedCountry.value, startDate.value, endDate.value);
          if (data.length > 0) {
            chartFlightVolumeInstance = echarts.init(chartFlightVolume.value);
            chartFlightVolumeInstance.setOption(getFlightVolumeOption(data));
            chartInstances.push(chartFlightVolumeInstance);
          }
        }
      }
      
      // 航班取消率 - 柱状图+折线图混合
      if (chartCancelRate.value && chartCancelRate.value.clientWidth > 0) {
        updateCancelRateChart();
      }
      
      // 航司飞机利用率 - 横向柱状图
      if (chartUtilization.value && chartUtilization.value.clientWidth > 0) {
        if (!chartUtilizationInstance) {
          chartUtilizationInstance = echarts.init(chartUtilization.value);
          chartUtilizationInstance.setOption(chartOptions.utilization);
          chartInstances.push(chartUtilizationInstance);
        }
      }
      
      // 运力分析 - 初始化为趋势图
      if (chartCapacity.value && chartCapacity.value.clientWidth > 0) {
        updateCapacityChart();
      }
      
      // 预估人流量 - 动态横向柱状图
      if (chartPassengerFlow.value && chartPassengerFlow.value.clientWidth > 0) {
        updatePassengerFlowChart();
      }
      
      // 机场起降架次分析 - 柱状图
      if (chartTakeoffLanding.value && chartTakeoffLanding.value.clientWidth > 0) {
        updateTakeoffLandingChart();
      }
      
      // NKG 周时刻热力图
      if (chartNkgHeatmap.value && chartNkgHeatmap.value.clientWidth > 0 && nkgHeatmapData.value) {
        if (!nkgHeatmapChartInstance) {
          const weekData = getAirportWeekData(nkgHeatmapData.value);
          if (weekData) {
            nkgHeatmapChartInstance = renderAirportHeatmap(chartNkgHeatmap.value, weekData, heatmapDataType.value);
            if (nkgHeatmapChartInstance) chartInstances.push(nkgHeatmapChartInstance);
          }
        }
      }
      
      // NKG 运营航司排行榜
      if (chartNkgAirline.value && chartNkgAirline.value.clientWidth > 0 && nkgAirlineData.value) {
        if (!nkgAirlineChartInstance) {
          updateNkgAirlineChart();
        }
      }
      
      // NKG 连通省市分布
      if (chartNkgRegion.value && chartNkgRegion.value.clientWidth > 0 && nkgRegionData.value) {
        if (!nkgRegionChartInstance) {
          updateNkgRegionChart();
        }
      }
      
      // NKG 连通机场分布
      if (chartNkgConnectedAirports.value && chartNkgConnectedAirports.value.clientWidth > 0 && nkgConnectedAirportsData.value) {
        if (!nkgConnectedAirportsChartInstance) {
          updateNkgConnectedAirportsChart();
        }
      }
    });
  }, 100);
};

const handleChartResize = () => {
  chartInstances.forEach(chart => chart.resize());
};

const route = useRoute();

let viewer = null;
let airportEntities = [];

const rippleMode = ref(false);
const rippleWaves = [];
let rippleWaveId = 0;

const toggleRippleMode = () => {
  rippleMode.value = !rippleMode.value;
  
  if (viewer) {
    viewer.entities.values.forEach(entity => {
      if (entity.point && (entity.flightType === 'departure' || entity.flightType === 'arrival')) {
        entity.point.show = !rippleMode.value;
      }
    });
  }
  
  if (rippleMode.value) {
    if (rippleWaves.length === 0) {
      createAllRipples();
    } else {
      rippleWaves.forEach(wave => {
        if (wave.entity) {
          wave.entity.show = true;
        }
      });
    }
  } else {
    rippleWaves.forEach(wave => {
      if (wave.entity) {
        wave.entity.show = false;
      }
    });
  }
};

const createRipple = (lng, lat, type) => {
  const color = type === 'departure' ? '#ff4d4f' : '#38bdf8';
  const maxRadius = 40000;
  const duration = 3000;
  
  const wave = new CircleWave(viewer, `ripple-wave-${rippleWaveId++}`);
  const entity = wave.add([lng, lat, 100], color, maxRadius, duration, false, 3);
  wave.entity = entity;
  wave.type = type;
  
  return wave;
};

const createAllRipples = async () => {
  if (!viewer) return;
  
  const airportCode = currentCenterAirport.code || 'NKG';
  const data = await loadAirportDataDynamic(airportCode);
  if (!data) return;
  
  const airports = data.airports;
      
  airports.forEach(airport => {
    if (airport.latitude && airport.longitude) {
      const isDeparture = airport.flightType === 'both' || airport.flightType === 'departure';
      const isArrival = airport.flightType === 'both' || airport.flightType === 'arrival';
      
      if (isDeparture) {
        const wave = createRipple(parseFloat(airport.longitude), parseFloat(airport.latitude), 'departure');
        rippleWaves.push(wave);
      }
      if (isArrival) {
        const wave = createRipple(parseFloat(airport.longitude), parseFloat(airport.latitude), 'arrival');
        rippleWaves.push(wave);
      }
    }
  });
};

const clearRipples = () => {
  rippleWaves.forEach(wave => {
    wave.remove();
  });
  rippleWaves.length = 0;
};

const layers = reactive({
  arrivalAirports: true,
  departureAirports: true,
  labels: true,
  weather: false,
  weatherParticlesRain: false,
  weatherParticlesSnow: false,
  arrivalRoutes: true,
  departureRoutes: true,
  arrivalPlanes: true,
  departurePlanes: false
});

const weatherEmojiMap = {
  '晴天': '☀️',
  '多云': '⛅',
  '阴天': '☁️',
  '雨天': '🌧️',
  '雪天': '❄️',
  '雾天': 'fog',
  '雷阵雨': '⛈️',
  '大风': '💨'
};

const weatherIcons = ref([]);
let weatherUpdateInterval = null;

// 天气粒子系统相关变量
let weatherParticleSystems = [];
const snowGravityScratch = new Cesium.Cartesian3();
const rainGravityScratch = new Cesium.Cartesian3();

const snowUpdate = (particle) => {
  Cesium.Cartesian3.normalize(particle.position, snowGravityScratch);
  Cesium.Cartesian3.multiplyByScalar(snowGravityScratch, Cesium.Math.randomBetween(-30.0, -300.0), snowGravityScratch);
  Cesium.Cartesian3.add(particle.position, snowGravityScratch, particle.position);
};

const rainUpdate = (particle) => {
  Cesium.Cartesian3.normalize(particle.position, rainGravityScratch);
  Cesium.Cartesian3.multiplyByScalar(rainGravityScratch, -1000.0, rainGravityScratch);
  Cesium.Cartesian3.add(particle.position, rainGravityScratch, particle.position);
};

const createWeatherParticleSystem = (lon, lat, weatherType) => {
  if (!viewer) return null;
  
  const position = Cesium.Cartesian3.fromDegrees(lon, lat, 2000);
  const modelMatrix = Cesium.Matrix4.fromTranslation(position);
  
  if (weatherType === '雪天') {
    const snowOption = {
      modelMatrix: modelMatrix,
      lifetime: 8.0,
      emitter: new Cesium.SphereEmitter(20000.0),
      startScale: 0.5,
      endScale: 1.0,
      image: '/snowflake_particle.png',
      emissionRate: 200.0,
      maxParticles: 500,
      startColor: Cesium.Color.WHITE.withAlpha(0.0),
      endColor: Cesium.Color.WHITE.withAlpha(0.8),
      minimumImageSize: new Cesium.Cartesian2(6, 6),
      maximumImageSize: new Cesium.Cartesian2(12, 12),
      updateCallback: snowUpdate,
      show: layers.weatherParticlesSnow
    };
    return viewer.scene.primitives.add(new Cesium.ParticleSystem(snowOption));
  } else if (weatherType === '雨天' || weatherType === '雷阵雨') {
    const rainOption = {
      modelMatrix: modelMatrix,
      lifetime: 5.0,
      emitter: new Cesium.SphereEmitter(20000.0),
      startScale: 1.0,
      endScale: 0.0,
      image: '/circular_particle.png',
      emissionRate: 300.0,
      maxParticles: 800,
      startColor: new Cesium.Color(0.8, 0.9, 1.0, 0.0),
      endColor: new Cesium.Color(0.8, 0.9, 1.0, 0.7),
      imageSize: new Cesium.Cartesian2(8, 20),
      updateCallback: rainUpdate,
      show: layers.weatherParticlesRain
    };
    return viewer.scene.primitives.add(new Cesium.ParticleSystem(rainOption));
  }
  
  return null;
};

const loadWeatherParticles = (airports) => {
  if (!viewer) return;
  
  clearWeatherParticles();
  
  airports.forEach(airport => {
    if (airport.latitude && airport.longitude && (airport.weather === '雪天' || airport.weather === '雨天' || airport.weather === '雷阵雨')) {
      const particleSystem = createWeatherParticleSystem(
        parseFloat(airport.longitude),
        parseFloat(airport.latitude),
        airport.weather
      );
      if (particleSystem) {
        weatherParticleSystems.push({
          system: particleSystem,
          cityName: airport.cityName,
          weather: airport.weather
        });
      }
    }
  });
};

const clearWeatherParticles = () => {
  weatherParticleSystems.forEach(item => {
    viewer.scene.primitives.remove(item.system);
  });
  weatherParticleSystems = [];
};

const updateWeatherParticleVisibility = () => {
  weatherParticleSystems.forEach(item => {
    if (item.weather === '雪天') {
      item.system.show = layers.weatherParticlesSnow;
    } else if (item.weather === '雨天' || item.weather === '雷阵雨') {
      item.system.show = layers.weatherParticlesRain;
    }
  });
};

const flyingLightDotEntities = [];
let routeIndex = 0;

const createFlyingLightDot = (startCartesian, endCartesian, color, routeType) => {
  if (!viewer) return;
  
  const delay = (routeIndex++ % 8) * 2.0;
  const trailLength = 0.18;
  
  const trailEntity = viewer.entities.add({
    polyline: {
      positions: new Cesium.CallbackProperty((time) => {
        const seconds = time.secondsOfDay + delay;
        const progress = (seconds % 20) / 20;
        const trailStart = Math.max(0, progress - trailLength);
        const startPoint = Cesium.Cartesian3.lerp(startCartesian, endCartesian, trailStart, new Cesium.Cartesian3());
        const endPoint = Cesium.Cartesian3.lerp(startCartesian, endCartesian, progress, new Cesium.Cartesian3());
        return [startPoint, endPoint];
      }, false),
      width: 3,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.2,
        color: new Cesium.Color(136/255, 231/255, 208/255, 1.0)
      }),
      arcType: Cesium.ArcType.GEODESIC,
      show: routeType === 'arrival' ? layers.arrivalRoutes : layers.departureRoutes
    }
  });
  
  const headEntity = viewer.entities.add({
    position: new Cesium.CallbackProperty((time) => {
      const seconds = time.secondsOfDay + delay;
      const progress = (seconds % 20) / 20;
      return Cesium.Cartesian3.lerp(startCartesian, endCartesian, progress, new Cesium.Cartesian3());
    }, false),
    point: {
      pixelSize: 5,
      color: new Cesium.Color(136/255, 231/255, 208/255, 1.0),
      glowColor: new Cesium.Color(136/255, 231/255, 208/255, 0.8),
      glowPower: 0.5,
      show: routeType === 'arrival' ? layers.arrivalRoutes : layers.departureRoutes
    }
  });
  
  flyingLightDotEntities.push({
    entity: trailEntity,
    headEntity: headEntity,
    routeType: routeType
  });
};

const updateFlyingLightDotVisibility = () => {
  flyingLightDotEntities.forEach(item => {
    item.entity.polyline.show = item.routeType === 'arrival' ? layers.arrivalRoutes : layers.departureRoutes;
    item.headEntity.point.show = item.routeType === 'arrival' ? layers.arrivalRoutes : layers.departureRoutes;
  });
};

const clearFlyingLightDots = () => {
  flyingLightDotEntities.forEach(item => {
    viewer.entities.remove(item.entity);
    viewer.entities.remove(item.headEntity);
  });
  flyingLightDotEntities.length = 0;
};

const charts = reactive({
  flightVolume: true,
  cancelRate: true,
  utilization: true,
  capacity: true,
  passengerFlow: true,
  takeoffLanding: true,
  nkgHeatmap: true,
  nkgAirline: true,
  nkgRegion: true,
  nkgConnectedAirports: true
});

const areAllChartsVisible = computed(() => {
  return Object.values(charts).every(v => v === true);
});

// 监听图表可见性变化，自动重绘ECharts
const handleChartVisibilityChange = () => {
  // resize所有现有图表实例（与前6个图表保持一致的模式）
  nextTick(() => {
    chartInstances.forEach(chart => {
      if (chart && !chart.isDisposed()) {
        const dom = chart.getDom();
        if (dom && dom.offsetWidth > 0 && dom.offsetHeight > 0) {
          chart.resize();
        }
      }
    });
  });
};

// 监听每个图表的可见性变化
const chartKeys = Object.keys(charts);
chartKeys.forEach(key => {
  watch(() => charts[key], () => {
    handleChartVisibilityChange();
  });
});

const toggleAllCharts = () => {
  const newValue = !areAllChartsVisible.value;
  Object.keys(charts).forEach(key => {
    charts[key] = newValue;
  });
  updateChartVisibility();
};

const updateChartVisibility = () => {
  // 先停止所有滚动定时器
  if (takeoffLandingScrollTimer) {
    clearInterval(takeoffLandingScrollTimer);
    takeoffLandingScrollTimer = null;
  }
  if (capacityScrollTimer) {
    clearInterval(capacityScrollTimer);
    capacityScrollTimer = null;
  }
  if (passengerFlowScrollTimer) {
    clearInterval(passengerFlowScrollTimer);
    passengerFlowScrollTimer = null;
  }
  if (cancelRateScrollTimer) {
    clearInterval(cancelRateScrollTimer);
    cancelRateScrollTimer = null;
  }

  // 销毁所有图表实例并清空引用
  chartInstances.forEach(chart => {
    chart.dispose();
  });
  chartInstances = [];
  chartFlightVolumeInstance = null;
  chartCancelRateInstance = null;
  chartUtilizationInstance = null;
  capacityChartInstance = null;
  chartPassengerFlowInstance = null;
  takeoffLandingChartInstance = null;

  nextTick(() => {
    setTimeout(() => {
      initCharts();
    }, 100);
  });
};

let arrivalRouteEntities = [];
let departureRouteEntities = [];
let arrivalPlaneEntities = [];
let departurePlaneEntities = [];
let planeConfigs = [];
let planeInstances = [];
let clockTickRemover = null;

const layerCounts = reactive({
  arrival: 0,
  departure: 0
});

let centerAirportEntity = null;
let airportsData = null;
const currentView = ref('global');

const toggleView = () => {
  if (currentView.value === 'global') {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(110, 25, 12000000),
      duration: 2
    });
    currentView.value = 'asia';
  } else if (currentView.value === 'asia') {
    if (centerAirportEntity) {
      const position = centerAirportEntity.position.getValue(Cesium.JulianDate.now());
      const cartographic = Cesium.Cartographic.fromCartesian(position);
      const lon = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);
      
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, 15000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: 0
        },
        duration: 2
      });
    } else {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(118.86, 31.74, 25000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: 0
        },
        duration: 2
      });
    }
    currentView.value = 'airport';
  } else {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(0, 10, 35000000),
      duration: 2
    });
    currentView.value = 'global';
  }
};

const updateLayerVisibility = () => {
  airportEntities.forEach(entity => {
    const flightType = entity.flightType;
    const showPoint = 
      (flightType === 'arrival' && layers.arrivalAirports) ||
      (flightType === 'departure' && layers.departureAirports);
    
    entity.point.show = showPoint;
    entity.label.show = showPoint && layers.labels;
  });
  
  updateWeatherVisibility();
};

const updateRouteVisibility = () => {
  arrivalRouteEntities.forEach(entity => {
    entity.polyline.show = layers.arrivalRoutes;
  });
  departureRouteEntities.forEach(entity => {
    entity.polyline.show = layers.departureRoutes;
  });
  updateFlyingLightDotVisibility();
};

const updatePlaneVisibility = () => {
  arrivalPlaneEntities.forEach(entity => {
    entity.billboard.show = layers.arrivalPlanes;
  });
  departurePlaneEntities.forEach(entity => {
    entity.billboard.show = layers.departurePlanes;
  });
};

const resetLayers = () => {
  layers.arrivalAirports = true;
  layers.departureAirports = true;
  layers.labels = true;
  layers.arrivalRoutes = true;
  layers.departureRoutes = true;
  layers.arrivalPlanes = true;
  layers.departurePlanes = false;
  updateLayerVisibility();
  updateRouteVisibility();
  updatePlaneVisibility();
};

const loadAirportsData = async () => {
  try {
    const response = await fetch('/airports.json');
    airportsData = await response.json();
    return airportsData;
  } catch (error) {
    console.error('加载机场数据失败:', error);
    return null;
  }
};

const setCenterAirport = async (code) => {
  if (!code || code.length !== 3) {
    return;
  }
  
  if (!airportsData) {
    await loadAirportsData();
  }
  
  const airport = airportsData?.airports?.[code];
  
  if (!airport) {
    return;
  }
  
  if (centerAirportEntity) {
    viewer.entities.remove(centerAirportEntity);
  }
  
  centerAirportEntity = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(
      parseFloat(airport.longitude_deg),
      parseFloat(airport.latitude_deg)
    ),
    point: {
      pixelSize: 16,
      color: Cesium.Color.RED,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 3,
      scaleByDistance: new Cesium.NearFarScalar(1000, 2.0, 10000000, 0.5)
    },
    label: {
      text: code,
      font: 'bold 16px sans-serif',
      showBackground: false,
      pixelOffset: new Cesium.Cartesian2(0, -35),
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE
    },
    description: `
      <div style="padding: 10px;">
        <h4>📍 ${airport.municipality} (${code})</h4>
        <p>机场名称: ${airport.name}</p>
        <p>坐标: ${airport.latitude_deg.toFixed(4)}, ${airport.longitude_deg.toFixed(4)}</p>
        <p>国家: ${airport.iso_country}</p>
      </div>
    `
  });
  
  // 更新中心机场信息显示
  currentCenterAirport.name = airport.name || airport.municipality;
  currentCenterAirport.code = code;
  
  // 清除旧的机场点和航线
  airportEntities.forEach(entity => viewer.entities.remove(entity));
  airportEntities = [];
  clearRipples();
  
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      parseFloat(airport.longitude_deg),
      parseFloat(airport.latitude_deg),
      5000000
    ),
    duration: 2
  });
  
  console.log(`已设置中心机场: ${airport.municipality} (${code})`);
  
  // 重新加载航线和机场点
  await drawFlightRoutes(parseFloat(airport.longitude_deg), parseFloat(airport.latitude_deg));
  await loadAirports();
  
  // 重新加载机场专属图表数据（航司排行、省市分布、连通机场、热力图）
  await loadAirportChartsData(code);
  
  // 只在散点模式开启时创建波纹
  if (rippleMode.value) {
    await createAllRipples();
  }
};

const getArcPoints = (start, end, maxHeight = 100000) => {
  const points = [];
  const steps = 50;
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const t2 = t * t;
    const t3 = t2 * t;
    
    const startWeight = 1 - 3 * t2 + 2 * t3;
    const midWeight = 3 * t2 - 3 * t3;
    const endWeight = t3;
    
    const lon = startWeight * start[0] + midWeight * ((start[0] + end[0]) / 2) + endWeight * end[0];
    const lat = startWeight * start[1] + midWeight * ((start[1] + end[1]) / 2) + endWeight * end[1];
    
    const height = Math.sin(t * Math.PI) * maxHeight;
    
    points.push(Cesium.Cartesian3.fromDegrees(lon, lat, height));
  }
  
  return points;
};

const drawFlightRoutes = async (centerLon, centerLat) => {
  if (!viewer) return;
  
  if (clockTickRemover) {
    clockTickRemover();
    clockTickRemover = null;
  }
  
  arrivalRouteEntities.forEach(entity => viewer.entities.remove(entity));
  arrivalRouteEntities = [];
  departureRouteEntities.forEach(entity => viewer.entities.remove(entity));
  departureRouteEntities = [];
  
  arrivalPlaneEntities.forEach(entity => viewer.entities.remove(entity));
  arrivalPlaneEntities = [];
  departurePlaneEntities.forEach(entity => viewer.entities.remove(entity));
  departurePlaneEntities = [];
  
  planeInstances.forEach(instance => viewer.entities.remove(instance.entity));
  planeInstances = [];
  
  // 使用动态API加载中心机场的当日数据
  const airportCode = currentCenterAirport.code || 'NKG';
  const data = await loadAirportDataDynamic(airportCode);
  if (!data) return;
  const airports = data.airports;
  
  let arrivalCount = 0;
  let departureCount = 0;
  
  airports.forEach((airport, index) => {
    const destLon = parseFloat(airport.longitude);
    const destLat = parseFloat(airport.latitude);
    
    if (!destLon || !destLat || destLon === 0 || destLat === 0) {
      return;
    }
    
    if (destLon < -180 || destLon > 180 || destLat < -90 || destLat > 90) {
      return;
    }
    
    let lonDiff = Math.abs(destLon - centerLon);
    if (lonDiff > 180) {
      lonDiff = 360 - lonDiff;
    }
    
    if (lonDiff > 150) {
      return;
    }
    
    const isArrival = airport.flightType === 'both' || airport.flightType === 'arrival';
    const isDeparture = airport.flightType === 'both' || airport.flightType === 'departure';
    
    if (isArrival) {
      const startCartesian = Cesium.Cartesian3.fromDegrees(centerLon, centerLat, 1000);
      const endCartesian = Cesium.Cartesian3.fromDegrees(destLon, destLat, 1000);
      
      const flightNumbers = airport.flightNumbers ? airport.flightNumbers.slice(0, 5) : [];
      const airlines = airport.airlines ? [...new Set(airport.airlines)].slice(0, 3).join(', ') : '暂无数据';
      
      const flightLinks = flightNumbers.map(fn => 
        `<span style="color: #87ceeb; cursor: pointer; text-decoration: underline; margin-right: 8px;" onclick="window.open('/flightdetail?flightNumber=${fn}', '_blank')">${fn}</span>`
      ).join('');
      
      const routeEntity = viewer.entities.add({
        name: `${currentCenterAirport.code} -> ${airport.iataCode || airport.code}`,
        description: `
          <div style="padding: 10px; min-width: 260px;">
            <h4 style="color: #0ea5e9; margin: 0 0 12px 0; font-size: 15px; border-bottom: 1px solid rgba(56, 189, 248, 0.3); padding-bottom: 8px;">✈️ 到达航线</h4>
            <div style="margin-bottom: 10px;">
              <p style="color: #475569; margin: 6px 0;"><strong style="color: #0ea5e9;">出发机场:</strong> ${currentCenterAirport.name} (${currentCenterAirport.code})</p>
              <p style="color: #475569; margin: 6px 0;"><strong style="color: #0ea5e9;">到达机场:</strong> ${airport.cityName || airport.name || airport.city || '未知'} (${airport.iataCode || airport.code})</p>
              <p style="color: #475569; margin: 6px 0;"><strong style="color: #0ea5e9;">出港航班数:</strong> <span style="color: #ef4444; font-weight: bold;">${airport.departures || 0}</span></p>
              <p style="color: #475569; margin: 6px 0;"><strong style="color: #0ea5e9;">进港航班数:</strong> <span style="color: #10b981; font-weight: bold;">${airport.arrivals || 0}</span></p>
              <p style="color: #475569; margin: 6px 0;"><strong style="color: #0ea5e9;">总航班数:</strong> <span style="color: #f59e0b; font-weight: bold;">${airport.total || 0}</span></p>
            </div>
            <div style="border-top: 1px solid rgba(56, 189, 248, 0.2); padding-top: 10px;">
              <p style="color: #475569; margin: 6px 0;"><strong style="color: #0ea5e9;">航班号:</strong><br/>${flightLinks || '暂无数据'}</p>
              <p style="color: #475569; margin: 6px 0;"><strong style="color: #0ea5e9;">航空公司:</strong> ${airlines}</p>
              <p style="color: #475569; margin: 6px 0;"><strong style="color: #0ea5e9;">航班时刻:</strong> ${airport.times ? airport.times.slice(0, 6).join(', ') + (airport.times.length > 6 ? '...' : '') : '暂无数据'}</p>
            </div>
          </div>
        `,
        polyline: {
          positions: [startCartesian, endCartesian],
          width: 2.5,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.3,
            color: Cesium.Color.GREEN
          }),
          arcType: Cesium.ArcType.GEODESIC,
          show: layers.arrivalRoutes
        }
      });
      arrivalRouteEntities.push(routeEntity);
      
      const auroraColor = new Cesium.Color(136/255, 231/255, 208/255, 1.0);
      createFlyingLightDot(startCartesian, endCartesian, auroraColor, 'arrival');
      
      const startPoint = Cesium.Cartesian3.fromDegrees(centerLon, centerLat, 0);
        const endPoint = Cesium.Cartesian3.fromDegrees(destLon, destLat, 0);
        const duration = 40 + arrivalCount * 3;
        
        planeConfigs.push({
          type: 'arrival',
          startPoint: startPoint,
          endPoint: endPoint,
          duration: duration,
          airport: airport,
          index: arrivalCount
        });
        
        arrivalCount++;
      }
      
      if (isDeparture) {
        const startCartesian = Cesium.Cartesian3.fromDegrees(destLon, destLat, 1000);
        const endCartesian = Cesium.Cartesian3.fromDegrees(centerLon, centerLat, 1000);
        
        const flightNumbers = airport.flightNumbers ? airport.flightNumbers.slice(0, 5) : [];
        const airlines = airport.airlines ? [...new Set(airport.airlines)].slice(0, 3).join(', ') : '暂无数据';
        
        const flightLinks = flightNumbers.map(fn => 
          `<span style="color: #87ceeb; cursor: pointer; text-decoration: underline; margin-right: 8px;" onclick="window.open('/flightdetail?flightNumber=${fn}', '_blank')">${fn}</span>`
        ).join('');
        
        const routeEntity = viewer.entities.add({
          name: `${airport.iataCode || airport.code} -> ${currentCenterAirport.code}`,
          description: `
            <div style="padding: 10px; min-width: 260px;">
              <h4 style="color: #0ea5e9; margin: 0 0 12px 0; font-size: 15px; border-bottom: 1px solid rgba(56, 189, 248, 0.3); padding-bottom: 8px;">✈️ 出发航线</h4>
              <div style="margin-bottom: 10px;">
                <p style="color: #475569; margin: 6px 0;"><strong style="color: #0ea5e9;">出发机场:</strong> ${airport.cityName || airport.name || airport.city || '未知'} (${airport.iataCode || airport.code})</p>
                <p style="color: #475569; margin: 6px 0;"><strong style="color: #0ea5e9;">到达机场:</strong> ${currentCenterAirport.name} (${currentCenterAirport.code})</p>
                <p style="color: #475569; margin: 6px 0;"><strong style="color: #0ea5e9;">出港航班数:</strong> <span style="color: #ef4444; font-weight: bold;">${airport.departures || 0}</span></p>
                <p style="color: #475569; margin: 6px 0;"><strong style="color: #0ea5e9;">进港航班数:</strong> <span style="color: #10b981; font-weight: bold;">${airport.arrivals || 0}</span></p>
                <p style="color: #475569; margin: 6px 0;"><strong style="color: #0ea5e9;">总航班数:</strong> <span style="color: #f59e0b; font-weight: bold;">${airport.total || 0}</span></p>
              </div>
              <div style="border-top: 1px solid rgba(56, 189, 248, 0.2); padding-top: 10px;">
                <p style="color: #475569; margin: 6px 0;"><strong style="color: #0ea5e9;">航班号:</strong><br/>${flightLinks || '暂无数据'}</p>
                <p style="color: #475569; margin: 6px 0;"><strong style="color: #0ea5e9;">航空公司:</strong> ${airlines}</p>
                <p style="color: #475569; margin: 6px 0;"><strong style="color: #0ea5e9;">航班时刻:</strong> ${airport.times ? airport.times.slice(0, 6).join(', ') + (airport.times.length > 6 ? '...' : '') : '暂无数据'}</p>
              </div>
            </div>
          `,
          polyline: {
            positions: [startCartesian, endCartesian],
            width: 2.5,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.3,
              color: Cesium.Color.BLUE
            }),
            arcType: Cesium.ArcType.GEODESIC,
            show: layers.departureRoutes
          }
        });
      departureRouteEntities.push(routeEntity);
      
      const auroraColor = new Cesium.Color(136/255, 231/255, 208/255, 1.0);
      createFlyingLightDot(startCartesian, endCartesian, auroraColor, 'departure');
      
      const startPoint = Cesium.Cartesian3.fromDegrees(destLon, destLat, 0);
        const endPoint = Cesium.Cartesian3.fromDegrees(centerLon, centerLat, 0);
        const duration = 40 + departureCount * 3;
      
      planeConfigs.push({
        type: 'departure',
        startPoint: startPoint,
        endPoint: endPoint,
        duration: duration,
        airport: airport,
        index: departureCount
      });
      
      departureCount++;
    }
  });
  
  viewer.clock.multiplier = 20;
  viewer.clock.shouldAnimate = true;
  viewer.clock.clockRange = Cesium.ClockRange.UNBOUNDED;
  
  const createPlane = (config, startTime) => {
    const sampledPosition = new Cesium.SampledPositionProperty();
    const steps = 50;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point = Cesium.Cartesian3.lerp(config.startPoint, config.endPoint, t, new Cesium.Cartesian3());
      const height = Math.sin(t * Math.PI) * 50000;
      const cartographic = Cesium.Cartographic.fromCartesian(point);
      cartographic.height = height;
      const position = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic.height);
      
      const time = Cesium.JulianDate.addSeconds(startTime, (i / steps) * config.duration, new Cesium.JulianDate());
      sampledPosition.addSample(time, position);
    }
    
    sampledPosition.setInterpolationOptions({
      interpolationDegree: 2,
      interpolationAlgorithm: Cesium.HermitePolynomialApproximation
    });
    
    const endTime = Cesium.JulianDate.addSeconds(startTime, config.duration, new Cesium.JulianDate());
    
    const planeEntity = viewer.entities.add({
      position: sampledPosition,
      orientation: new Cesium.VelocityOrientationProperty(sampledPosition),
      billboard: {
        image: 'https://gw.alipayobjects.com/zos/bmw-prod/0ca1668e-38c2-4010-8568-b57cb33839b9.svg',
        scale: 0.5,
        color: Cesium.Color.ORANGE,
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(100000, 50000000),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        show: config.type === 'arrival' ? layers.arrivalPlanes : layers.departurePlanes
      },
      description: config.type === 'arrival' ? `
        <div style="padding: 12px; min-width: 200px;">
          <h4 style="color: #0ea5e9; margin: 0 0 12px 0; font-size: 16px; border-bottom: 1px solid rgba(56, 189, 248, 0.3); padding-bottom: 8px;">🛬 到达航班</h4>
          <div style="display: flex; align-items: center;">
            <span style="color: #64748b; margin-right: 8px;">📍</span>
            <span style="color: #1e3a5f; font-weight: bold; min-width: 60px;">目的地:</span>
            <span style="color: #475569;">${config.airport.cityName} (${config.airport.iataCode})</span>
          </div>
        </div>
      ` : `
        <div style="padding: 12px; min-width: 200px;">
          <h4 style="color: #0ea5e9; margin: 0 0 12px 0; font-size: 16px; border-bottom: 1px solid rgba(56, 189, 248, 0.3); padding-bottom: 8px;">🛫 出发航班</h4>
          <div style="display: flex; align-items: center;">
            <span style="color: #64748b; margin-right: 8px;">📍</span>
            <span style="color: #1e3a5f; font-weight: bold; min-width: 60px;">出发地:</span>
            <span style="color: #475569;">${config.airport.cityName} (${config.airport.iataCode})</span>
          </div>
        </div>
      `
    });
    
    return { entity: planeEntity, endTime: endTime, config: config, startTime: startTime };
  };
  
  const FLIGHT_INTERVAL = 5;
  const BASE_SPEED = 150000;
  
  const spawnAllPlanes = () => {
    const startTime = viewer.clock.currentTime;
    
    planeConfigs.forEach((config) => {
      const distance = Cesium.Cartesian3.distance(config.startPoint, config.endPoint);
      const duration = distance / BASE_SPEED * 10;
      config.duration = duration;
      
      const instance = createPlane(config, startTime);
      planeInstances.push(instance);
      
      if (config.type === 'arrival') {
        arrivalPlaneEntities.push(instance.entity);
      } else {
        departurePlaneEntities.push(instance.entity);
      }
    });
    
    console.log(`已生成 ${planeConfigs.length} 架飞机，飞行间隔: ${FLIGHT_INTERVAL}秒`);
  };
  
  const checkAndRemovePlanes = () => {
    const currentTime = viewer.clock.currentTime;
    
    for (let i = planeInstances.length - 1; i >= 0; i--) {
      const instance = planeInstances[i];
      const diff = Cesium.JulianDate.secondsDifference(currentTime, instance.endTime);
      if (diff >= 0) {
        viewer.entities.remove(instance.entity);
        
        if (instance.config.type === 'arrival') {
          const idx = arrivalPlaneEntities.indexOf(instance.entity);
          if (idx > -1) arrivalPlaneEntities.splice(idx, 1);
        } else {
          const idx = departurePlaneEntities.indexOf(instance.entity);
          if (idx > -1) departurePlaneEntities.splice(idx, 1);
        }
        
        planeInstances.splice(i, 1);
      }
    }
  };
  
  const planeUpdateLoop = () => {
    checkAndRemovePlanes();
    spawnAllPlanes();
  };
  
  clockTickRemover = viewer.clock.onTick.addEventListener(checkAndRemovePlanes);
  planeInterval = setInterval(planeUpdateLoop, FLIGHT_INTERVAL * 1000);
  
  spawnAllPlanes();
  
  console.log(`已绘制到达航线: ${arrivalRouteEntities.length} 条，出发航线: ${departureRouteEntities.length} 条`);
};

const handleResize = () => {
  if (viewer) {
    viewer.resize();
  }
};

const loadAirports = async () => {
  try {
    // 使用动态API加载中心机场的当日数据
    const airportCode = currentCenterAirport.code || 'NKG';
    const data = await loadAirportDataDynamic(airportCode);
    if (!data) return;
    
    const airports = data.airports;
    console.log(`正在加载 ${airports.length} 个机场...`);
    
    let arrivalCount = 0;
    let departureCount = 0;
    
    // 先创建蓝点（出发）- 放在底层
    airports.forEach(airport => {
      if (airport.latitude && airport.longitude) {
        const isDeparture = airport.flightType === 'both' || airport.flightType === 'departure';
        if (isDeparture) {
          departureCount++;
          const entity = viewer.entities.add({
            name: `${airport.cityName} (${airport.iataCode})`,
            position: Cesium.Cartesian3.fromDegrees(
              parseFloat(airport.longitude), 
              parseFloat(airport.latitude)
            ),
            point: {
              pixelSize: 12,
              color: Cesium.Color.BLUE,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2
            },
            label: {
              text: `${airport.cityName} (${airport.iataCode})`,
              font: '12px sans-serif',
              showBackground: true,
              backgroundColor: new Cesium.Color(0, 0, 0, 0.7),
              pixelOffset: new Cesium.Cartesian2(0, -30),
              fillColor: Cesium.Color.WHITE
            },
            description: `
              <div style="padding: 12px; min-width: 240px;">
                <h4 style="color: #0ea5e9; margin: 0 0 12px 0; font-size: 16px; border-bottom: 1px solid rgba(56, 189, 248, 0.3); padding-bottom: 8px;">🏢 ${airport.cityName} (${airport.iataCode})</h4>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="color: #64748b; margin-right: 8px;">✈️</span>
                  <span style="color: #1e3a5f; font-weight: bold; min-width: 70px;">航班类型:</span>
                  <span style="color: #475569;">出发</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="color: #64748b; margin-right: 8px;">🔢</span>
                  <span style="color: #1e3a5f; font-weight: bold; min-width: 70px;">航班数量:</span>
                  <span style="color: #f59e0b; font-weight: bold;">${airport.total || 0} 个</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="color: #64748b; margin-right: 8px;">🛫</span>
                  <span style="color: #1e3a5f; font-weight: bold; min-width: 70px;">出港:</span>
                  <span style="color: #ef4444; font-weight: bold;">${airport.departures || 0} 个</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="color: #64748b; margin-right: 8px;">🛬</span>
                  <span style="color: #1e3a5f; font-weight: bold; min-width: 70px;">进港:</span>
                  <span style="color: #10b981; font-weight: bold;">${airport.arrivals || 0} 个</span>
                </div>
                <div style="display: flex; align-items: flex-start;">
                  <span style="color: #0ea5e9; margin-right: 8px; margin-top: 2px;">🏨</span>
                  <span style="color: #1e3a5f; font-weight: bold; min-width: 70px;">航空公司:</span>
                  <span style="color: #475569;">${airport.airlines.slice(0, 3).join(', ')}</span>
                </div>
                <div style="display: flex; align-items: flex-start; margin-top: 8px;">
                  <span style="color: #0ea5e9; margin-right: 8px; margin-top: 2px;">🕐</span>
                  <span style="color: #1e3a5f; font-weight: bold; min-width: 70px;">航班时刻:</span>
                  <span style="color: #475569;">${airport.times ? airport.times.slice(0, 5).join(', ') + (airport.times.length > 5 ? '...' : '') : '暂无数据'}</span>
                </div>
              </div>
            `
          });
          entity.flightType = 'departure';
          airportEntities.push(entity);
        }
      }
    });
    
    // 再创建绿点（到达）- 放在上层
    airports.forEach(airport => {
      if (airport.latitude && airport.longitude) {
        const isArrival = airport.flightType === 'both' || airport.flightType === 'arrival';
        if (isArrival) {
          arrivalCount++;
          const entity = viewer.entities.add({
            name: `${airport.cityName} (${airport.iataCode})`,
            position: Cesium.Cartesian3.fromDegrees(
              parseFloat(airport.longitude), 
              parseFloat(airport.latitude)
            ),
            point: {
              pixelSize: 12,
              color: Cesium.Color.GREEN,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2
            },
            label: {
              text: `${airport.cityName} (${airport.iataCode})`,
              font: '12px sans-serif',
              showBackground: true,
              backgroundColor: new Cesium.Color(0, 0, 0, 0.7),
              pixelOffset: new Cesium.Cartesian2(0, -30),
              fillColor: Cesium.Color.WHITE
            },
            description: `
              <div style="padding: 12px; min-width: 240px;">
                <h4 style="color: #0ea5e9; margin: 0 0 12px 0; font-size: 16px; border-bottom: 1px solid rgba(56, 189, 248, 0.3); padding-bottom: 8px;">🏢 ${airport.cityName} (${airport.iataCode})</h4>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="color: #64748b; margin-right: 8px;">🛬</span>
                  <span style="color: #1e3a5f; font-weight: bold; min-width: 70px;">航班类型:</span>
                  <span style="color: #475569;">到达</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="color: #64748b; margin-right: 8px;">🔢</span>
                  <span style="color: #1e3a5f; font-weight: bold; min-width: 70px;">航班数量:</span>
                  <span style="color: #f59e0b; font-weight: bold;">${airport.total || 0} 个</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="color: #64748b; margin-right: 8px;">🛫</span>
                  <span style="color: #1e3a5f; font-weight: bold; min-width: 70px;">出港:</span>
                  <span style="color: #ef4444; font-weight: bold;">${airport.departures || 0} 个</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="color: #64748b; margin-right: 8px;">🛬</span>
                  <span style="color: #1e3a5f; font-weight: bold; min-width: 70px;">进港:</span>
                  <span style="color: #10b981; font-weight: bold;">${airport.arrivals || 0} 个</span>
                </div>
                <div style="display: flex; align-items: flex-start;">
                  <span style="color: #0ea5e9; margin-right: 8px; margin-top: 2px;">🏨</span>
                  <span style="color: #1e3a5f; font-weight: bold; min-width: 70px;">航空公司:</span>
                  <span style="color: #475569;">${airport.airlines.slice(0, 3).join(', ')}</span>
                </div>
                <div style="display: flex; align-items: flex-start; margin-top: 8px;">
                  <span style="color: #0ea5e9; margin-right: 8px; margin-top: 2px;">🕐</span>
                  <span style="color: #1e3a5f; font-weight: bold; min-width: 70px;">航班时刻:</span>
                  <span style="color: #475569;">${airport.times ? airport.times.slice(0, 5).join(', ') + (airport.times.length > 5 ? '...' : '') : '暂无数据'}</span>
                </div>
              </div>
            `
          });
          entity.flightType = 'arrival';
          airportEntities.push(entity);
        }
      }
    });
    
    layerCounts.arrival = arrivalCount;
    layerCounts.departure = departureCount;
    
    // 加载天气图标
    loadWeatherIcons(airports);
    
    // 加载天气粒子效果
    loadWeatherParticles(airports);
    
    console.log(`成功加载机场 (到达: ${arrivalCount}, 出发: ${departureCount})`);
  } catch (error) {
    console.error('加载机场数据失败:', error);
  }
};

const loadWeatherIcons = (airports) => {
  const container = document.getElementById('cesiumContainer');
  if (!container) return;
  
  airports.forEach(airport => {
    if (airport.latitude && airport.longitude && airport.weather) {
      const emoji = weatherEmojiMap[airport.weather] || '🌤️';
      
      const iconElement = document.createElement('div');
      iconElement.className = 'weather-icon-overlay';
      iconElement.style.cssText = `
        position: absolute;
        font-size: 24px;
        pointer-events: none;
        z-index: 100;
        transform: translate(-50%, -50%);
        display: ${layers.weather ? 'block' : 'none'};
        text-align: center;
      `;
      iconElement.title = `${airport.cityName}: ${airport.weather}`;
      
      if (emoji === 'fog') {
        const imgElement = document.createElement('img');
        imgElement.src = '/fog.png';
        imgElement.style.cssText = `
          width: 32px;
          height: 32px;
          object-fit: contain;
          pointer-events: none;
        `;
        iconElement.appendChild(imgElement);
      } else {
        iconElement.textContent = emoji;
      }
      
      container.appendChild(iconElement);
      
      weatherIcons.value.push({
        element: iconElement,
        longitude: parseFloat(airport.longitude),
        latitude: parseFloat(airport.latitude),
        emoji: emoji,
        cityName: airport.cityName,
        weather: airport.weather
      });
    }
  });
  
  updateWeatherIconPositions();
  
  weatherUpdateInterval = setInterval(updateWeatherIconPositions, 50);
};

const updateWeatherIconPositions = () => {
  if (!viewer || !viewer.scene) return;
  
  weatherIcons.value.forEach(icon => {
    if (!icon.element || icon.element.parentElement === null) return;
    
    const cartesian = Cesium.Cartesian3.fromDegrees(icon.longitude, icon.latitude, 1000);
    const screenPosition = viewer.scene.cartesianToCanvasCoordinates(cartesian);
    
    if (screenPosition) {
      icon.element.style.left = `${screenPosition.x}px`;
      icon.element.style.top = `${screenPosition.y - 30}px`;
    }
  });
};

const updateWeatherVisibility = () => {
  weatherIcons.value.forEach(icon => {
    if (icon.element) {
      icon.element.style.display = layers.weather ? 'block' : 'none';
    }
  });
};

onMounted(async () => {
  Cesium.Ion.defaultAccessToken = 'YOUR_CESIUM_ION_TOKEN_HERE';
  
  viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: Cesium.createWorldTerrain(),
    timeline: false,
    animation: false,
    homeButton: false,
    sceneModePicker: true,
    baseLayerPicker: true,
    navigationHelpButton: false,
    sceneMode: Cesium.SceneMode.SCENE2D,
    credits: false,
    infoBox: false,
    selectionIndicator: false
  });
  
  // 从URL参数获取机场代码（支持 code 和 airport 两种参数名）
  const urlCode = route.query.code || route.query.airport;
  
  // 从URL参数获取日期（格式: YYYY-MM-DD 或 YYYY/MM/DD）
  const urlDate = route.query.date;
  if (urlDate) {
    selectedDate.value = urlDate.replace(/-/g, '/');
  }
  
  await loadAirportsData();
  
  if (urlCode && urlCode.length === 3) {
    await setCenterAirport(urlCode.toUpperCase());
  } else {
    // 默认使用南京禄口机场
    await setCenterAirport('NKG');
  }
  
  // 加载国内航班数据（初始化默认显示国内数据）
  try {
    const response = await fetch('/assets/flight_data.json');
    const data = await response.json();
    processFlightData(data);
  } catch (error) {
    console.error('加载航班数据失败:', error);
  }
  
  // 加载航班取消率数据
  await loadCancelRateData();
  
  // 加载飞机利用率数据
  await loadUtilizationData();
  
  // 加载运力数据
  await loadCapacityData();
  
  // 加载航线排行数据
  await loadRankingData();
  
  // 加载机场起降架次数据
  await loadTakeoffLandingData();
  
  // 加载预估人流量数据
  await loadPassengerFlowData();
  
  // 初始化图表
  initCharts();
  
  // 加载机场专属图表数据
  loadAirportChartsData(currentCenterAirport.code || 'NKG');
  
  // 启动实时时间更新
  updateTime();
  timeInterval = setInterval(updateTime, 1000);
  
  // 点击事件 - InfoBox
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(function(event) {
    const picked = viewer.scene.pick(event.position);
    if (Cesium.defined(picked) && picked.id && picked.id.description) {
      const entity = picked.id;
      const desc = entity.description.getValue ? entity.description.getValue() : entity.description;
      const nm = entity.name.getValue ? entity.name.getValue() : entity.name;
      infoBox.title = nm || '信息';
      infoBox.html = desc;
      infoBox.x = 200;
      infoBox.y = 100;
      infoBox.show = true;
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  
  // 右键关闭InfoBox
  handler.setInputAction(function(event) {
    const picked = viewer.scene.pick(event.position);
    if (!Cesium.defined(picked)) {
      infoBox.show = false;
    }
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  
  window.addEventListener('resize', handleResize);
  window.addEventListener('resize', handleChartResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('resize', handleChartResize);
  
  // 停止时间更新
  if (timeInterval) {
    clearInterval(timeInterval);
    timeInterval = null;
  }
  
  // 清理波纹
  clearRipples();
  
  // 停止飞机生成间隔
  if (planeInterval) {
    clearInterval(planeInterval);
    planeInterval = null;
  }
  
  // 停止天气图标更新
  if (weatherUpdateInterval) {
    clearInterval(weatherUpdateInterval);
    weatherUpdateInterval = null;
  }
  
  // 清理天气图标元素
  weatherIcons.value.forEach(icon => {
    if (icon.element && icon.element.parentElement) {
      icon.element.parentElement.removeChild(icon.element);
    }
  });
  weatherIcons.value = [];
  
  // 清理天气粒子系统
  clearWeatherParticles();
  
  // 清理飞行光点
  clearFlyingLightDots();
  
  // 销毁所有图表实例
  chartInstances.forEach(chart => {
    chart.dispose();
  });
  chartInstances = [];
  
  if (clockTickRemover) {
    clockTickRemover();
  }
  
  if (viewer) {
    viewer.destroy();
    viewer = null;
  }
});
</script>

<style scoped>
/* 提升 Cesium 原生 UI 控件的层级，防止被自定义面板遮挡 */
:deep(.cesium-viewer-toolbar),
:deep(.cesium-viewer-bottom),
:deep(.cesium-navigation-help) {
  z-index: 9999 !important;
  pointer-events: auto;
}

:deep(.cesium-baseLayerPicker-dropDown) {
  z-index: 9999 !important;
  position: absolute;
  pointer-events: auto;
}

:deep(.cesium-geocoder-search-results) {
  z-index: 9999 !important;
  pointer-events: auto;
}
</style>

<style>
/* 全局样式 - 确保控件不被任何元素遮挡 */
body > .ctrl-bar,
.ctrl-bar {
  position: fixed !important;
  top: 78px !important;
  left: 50% !important;
  margin-left: -140px !important;
  z-index: 2147483647 !important;
  display: flex !important;
  gap: 8px !important;
  pointer-events: auto !important;
  isolation: isolate !important;
}
.ctrl-btn {
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
  padding: 8px 14px !important;
  background: rgba(56, 189, 248, 0.9) !important;
  border: 2px solid #38bdf8 !important;
  border-radius: 10px !important;
  color: #fff !important;
  font-size: 13px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  white-space: nowrap !important;
  position: relative !important;
  pointer-events: auto !important;
}
.ctrl-btn:hover { background: rgba(56, 189, 248, 1) !important; box-shadow: 0 4px 12px rgba(56, 189, 248, 0.4) !important; }
.ctrl-btn.active { background: rgba(239, 68, 68, 0.9) !important; border-color: #ef4444 !important; }
.btn-icon { font-size: 16px !important; }

/* 面板基础样式 */
body > .ctrl-bar > .panel,
.panel {
  position: absolute !important;
  top: calc(100% + 8px) !important;
  left: 0 !important;
  width: 200px !important;
  background: rgba(255, 255, 255, 0.95) !important;
  border: 1px solid rgba(56, 189, 248, 0.25) !important;
  border-radius: 12px !important;
  padding: 10px !important;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px);
  transition: all 0.3s ease !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12) !important;
  pointer-events: none;
  z-index: 10001 !important;
}
body > .ctrl-bar > .panel.show,
.panel.show { opacity: 1; visibility: visible; transform: translateY(0); pointer-events: auto; }
.chart-panel { left: 70px !important; }
.panel-title {
  padding: 8px 10px !important;
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.1) 0%, rgba(56, 189, 248, 0.05) 100%) !important;
  border-bottom: 1px solid rgba(56, 189, 248, 0.15) !important;
  border-radius: 8px !important;
  color: #1e3a5f !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  margin-bottom: 10px !important;
}
.panel-body { display: flex !important; flex-direction: column !important; gap: 4px !important; }
.div { height: 1px !important; background: rgba(56, 189, 248, 0.15) !important; margin: 6px 0 !important; }
.chk-item {
  display: flex !important; align-items: center !important; gap: 6px !important;
  padding: 6px 8px !important; border-radius: 6px !important; cursor: pointer !important;
  transition: all 0.2s ease !important; color: #475569 !important; font-size: 12px !important;
}
.chk-item:hover { background: rgba(56, 189, 248, 0.08) !important; }
.chk-item input[type="checkbox"] { width: 14px !important; height: 14px !important; cursor: pointer !important; flex-shrink: 0 !important; }
.dot { width: 12px !important; height: 12px !important; border-radius: 50% !important; flex-shrink: 0 !important; }
.dot.blue { background: #0000ff !important; border: 2px solid rgba(56, 189, 248, 0.5) !important; }
.dot.green { background: #00ff00 !important; border: 2px solid rgba(56, 189, 248, 0.5) !important; }
.cnt { background: rgba(56, 189, 248, 0.1) !important; padding: 1px 6px !important; border-radius: 8px !important; font-size: 10px !important; color: #0ea5e9 !important; }
.all-btn {
  padding: 6px 8px !important; background: rgba(56, 189, 248, 0.2) !important;
  border: 1px solid rgba(56, 189, 248, 0.3) !important; border-radius: 4px !important;
  color: #0ea5e9 !important; font-size: 11px !important; cursor: pointer !important; transition: all 0.2s ease !important;
}
.all-btn:hover { background: rgba(56, 189, 248, 0.3) !important; }
.reset-btn {
  padding: 6px !important; background: rgba(56, 189, 248, 0.1) !important;
  border: 1px solid rgba(56, 189, 248, 0.3) !important; border-radius: 6px !important;
  color: #0ea5e9 !important; font-size: 11px !important; cursor: pointer !important; transition: all 0.2s ease !important; margin-top: 4px !important;
}
.reset-btn:hover { background: rgba(56, 189, 248, 0.15) !important; }

.info-box {
  position: fixed !important;
  width: 280px !important;
  background: rgba(255, 255, 255, 0.92) !important;
  backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(56, 189, 248, 0.3) !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), 0 0 20px rgba(56, 189, 248, 0.1) !important;
  z-index: 9998 !important;
  cursor: default !important;
  overflow: hidden !important;
  pointer-events: auto !important;
}
.info-box-head {
  display: flex !important; justify-content: space-between !important; align-items: center !important;
  padding: 10px 12px !important; background: rgba(56, 189, 248, 0.08) !important;
  border-bottom: 1px solid rgba(56, 189, 248, 0.2) !important; cursor: move !important;
}
.info-box-tit { color: #1e3a5f !important; font-size: 13px !important; font-weight: bold !important; }
.info-box-x {
  width: 22px !important; height: 22px !important; border: none !important;
  background: rgba(56, 189, 248, 0.15) !important; color: #64748b !important;
  border-radius: 50% !important; font-size: 16px !important; cursor: pointer !important;
  display: flex !important; align-items: center !important; justify-content: center !important; transition: all 0.3s ease !important;
}
.info-box-x:hover { background: rgba(239, 68, 68, 0.15) !important; color: #ef4444 !important; }
.info-box-body { padding: 12px !important; color: #475569 !important; font-size: 12px !important; line-height: 1.6 !important; }
.info-box-body h4 { color: #1e3a5f !important; margin-bottom: 8px !important; font-size: 13px !important; }
.info-box-body p { color: #1e3a5f !important; margin: 4px 0 !important; }
.info-box-body strong { color: #0ea5e9 !important; }

.view-toggle-btn {
  position: fixed !important;
  bottom: 30px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  width: 60px !important;
  height: 60px !important;
  border-radius: 50% !important;
  background: rgba(25, 35, 25, 0.8) !important;
  border: 2px solid rgba(255, 240, 200, 0.5) !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 100 !important;
  backdrop-filter: blur(10px) !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3) !important;
  pointer-events: auto !important;
}
.view-toggle-btn:hover {
  transform: translateX(-50%) scale(1.1) !important;
  box-shadow: 0 6px 20px rgba(56, 189, 248, 0.4) !important;
  border-color: #38bdf8 !important;
}
.view-icon {
  font-size: 24px !important;
}
.view-tooltip {
  position: absolute !important;
  bottom: 100% !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  margin-bottom: 10px !important;
  padding: 6px 12px !important;
  background: rgba(0, 0, 0, 0.85) !important;
  color: #0ea5e9 !important;
  font-size: 12px !important;
  border-radius: 6px !important;
  white-space: nowrap !important;
  opacity: 0 !important;
  visibility: hidden !important;
  transition: all 0.2s ease !important;
  z-index: 101 !important;
}
.view-toggle-btn:hover .view-tooltip {
  opacity: 1 !important;
  visibility: visible !important;
}

/* ECharts tooltip 容器不要拦截点击 */
div[class*="echarts-tooltip"],
div[class*="ec-tooltip"],
div.ec-extension-tooltip {
  pointer-events: none !important;
  z-index: 9999 !important;
}
/* 禁用 ECharts zrender 容器的全局 pointer-events 覆盖 */
div[_echarts_instance_] {
  pointer-events: auto !important;
}
</style>

<style scoped>
.page-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  padding-top: 70px;
  z-index: 1;
}

.global-header {
  height: 70px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(56, 189, 248, 0.2);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  box-shadow: 0 2px 20px rgba(56, 189, 248, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: none;
  padding: 0 20px;
  gap: 30px;
}

/* 左侧：标题区域 */
.header-left {
  flex: 1;
}

.header-left h1 {
  color: #0ea5e9;
  font-size: 1.4rem;
  margin: 0;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(14, 165, 233, 0.3);
}

.header-left .subtitle {
  color: #64748b;
  font-size: 0.8rem;
  margin: 4px 0 0 0;
}

/* 中间：中心机场模块 */
.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.airport-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 20px;
  background: rgba(56, 189, 248, 0.08);
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.airport-icon {
  font-size: 1.2rem;
}

.airport-name {
  color: #1e3a5f;
  font-size: 1rem;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(14, 165, 233, 0.3);
}

.airport-code {
  color: #0ea5e9;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 2px 10px;
  background: rgba(56, 189, 248, 0.12);
  border-radius: 4px;
}

/* 右侧：环境监控模块 */
.header-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0;
}

/* 分隔线 */
.divider {
  width: 1px;
  height: 36px;
  background: rgba(56, 189, 248, 0.15);
}

/* 天气模块 */
.weather-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 20px;
}

.weather-icon {
  font-size: 1.8rem;
  animation: breathe 4s ease-in-out infinite;
  filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.4));
}

@keyframes breathe {
  0%, 100% { opacity: 0.75; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

.weather-info {
  display: flex;
  flex-direction: column;
}

.weather-status {
  color: #1e3a5f;
  font-size: 0.95rem;
  font-weight: 600;
}

.weather-details {
  color: #64748b;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

/* 时间模块 */
.time-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 8px 20px;
}

.time-date {
  color: #64748b;
  font-size: 0.75rem;
  letter-spacing: 1px;
}

.time-display {
  font-family: 'Share Tech Mono', 'Consolas', 'Monaco', monospace;
  color: #0ea5e9;
  font-size: 1.3rem;
  font-weight: 600;
  letter-spacing: 2px;
  text-shadow: 0 0 5px rgba(14, 165, 233, 0.3);
}

/* 返回按钮 */
.back-button {
  color: #0ea5e9;
  text-decoration: none;
  font-size: 0.85rem;
  padding: 8px 18px;
  margin: 0 20px;
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 8px;
  transition: all 0.3s ease;
  white-space: nowrap;
  background: rgba(56, 189, 248, 0.08);
}

.back-button:hover {
  background: rgba(56, 189, 248, 0.15);
  border-color: rgba(56, 189, 248, 0.5);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
}

.map-full-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.map-full-area {
  width: 100%;
  height: 100%;
}

.map-overlay-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(60, 60, 60, 0.35);
  pointer-events: none;
  z-index: 10;
}

/* ====== 以下控件样式已移至全局样式块，此处删除重复定义 ====== */
/* 控件样式已在全局 <style> 块中定义 */

.cesium-viewer-bottom {
  display: none !important;
}

/* 独立图表面板 */
.chart-panel-individual {
  position: relative;
  width: 380px;
  height: 220px;
  background: rgba(240, 244, 248, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 12px;
  pointer-events: auto;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  display: flex;
  flex-direction: column;
  overflow: visible !important;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.chart-panel-individual:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(136, 176, 155, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  border-color: rgba(136, 176, 155, 0.4);
}

/* 左侧图表容器 */
.left-chart-container {
  position: absolute;
  left: 20px;
  top: 90px;
  z-index: 90;
  width: 380px;
  max-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 8px;
  padding-bottom: 20px;
  pointer-events: none;
}

.left-chart-container .chart-panel-individual {
  pointer-events: auto;
}

/* 右侧图表容器 */
.right-chart-container {
  position: absolute;
  right: 20px;
  top: 90px;
  z-index: 90;
  width: 380px;
  max-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 8px;
  padding-bottom: 20px;
  pointer-events: none;
}

.right-chart-container .chart-panel-individual {
  pointer-events: auto;
}

/* 滚动条样式 */
.left-chart-container::-webkit-scrollbar,
.right-chart-container::-webkit-scrollbar {
  width: 4px;
}

.left-chart-container::-webkit-scrollbar-track,
.right-chart-container::-webkit-scrollbar-track {
  background: rgba(240, 244, 248, 0.3);
  border-radius: 2px;
}

.left-chart-container::-webkit-scrollbar-thumb,
.right-chart-container::-webkit-scrollbar-thumb {
  background: rgba(13, 110, 253, 0.3);
  border-radius: 2px;
}

.left-chart-container::-webkit-scrollbar-thumb:hover,
.right-chart-container::-webkit-scrollbar-thumb:hover {
  background: rgba(13, 110, 253, 0.5);
}

/* 左侧图表面板 */
.chart-panel-individual.left-top,
.chart-panel-individual.left-middle,
.chart-panel-individual.left-bottom {
  width: 100% !important;
  min-width: 380px;
  height: 220px !important;
  box-sizing: border-box;
  flex-shrink: 0;
}

/* NKG 热力图面板 - 需要更多底部空间显示轴标签 */
.chart-panel-individual.nkg-heatmap {
  width: 100% !important;
  min-width: 380px;
  height: 260px !important;
  box-sizing: border-box;
  flex-shrink: 0;
}

/* 右侧图表面板 */
.chart-panel-individual.right-top,
.chart-panel-individual.right-middle,
.chart-panel-individual.right-bottom,
.chart-panel-individual.nkg-airline,
.chart-panel-individual.nkg-region,
.chart-panel-individual.nkg-connected-airports {
  width: 100% !important;
  min-width: 380px;
  height: 220px !important;
  box-sizing: border-box;
  flex-shrink: 0;
}

/* 热力图容器 - 适应面板高度 */
.heatmap-container {
  flex: 1;
  min-height: 0;
}

/* 图表加载遮罩 */
.chart-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(240, 244, 248, 0.85);
  color: #0ea5e9;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(2px);
  z-index: 10;
  pointer-events: none;
}

/* 热力图图例 */
.heatmap-legend {
  display: flex;
  gap: 8px;
  align-items: center;
}

.heatmap-date-label {
  font-size: 10px;
  color: #3b82f6;
  font-weight: 600;
  margin-right: 8px;
  white-space: nowrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #64748b;
}

.legend-color {
  width: 14px;
  height: 8px;
  border-radius: 2px;
  display: inline-block;
}

/* 图表头部 */
.chart-header {
  padding: 12px 14px;
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.1) 0%, rgba(56, 189, 248, 0.05) 100%);
  border-bottom: 1px solid rgba(56, 189, 248, 0.15);
  border-radius: 16px 16px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
  overflow: visible;
}

/* 图表标题 */
.chart-title {
  font-size: 0.85rem;
  color: #1e3a5f;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* 图表控制按钮 */
.chart-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
  flex-shrink: 0;
}

/* 数据类型切换 */
.data-type-switch {
  display: flex;
  background: rgba(187, 208, 233, 0.9);
  border: 1px solid rgba(136, 176, 155, 0.25);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
}

.type-btn {
  padding: 4px 10px;
  font-size: 11px;
  color: #6687a8;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.type-btn:hover {
  background: rgba(169, 200, 248, 0.1);
  color: #0d6efd;
}

.type-btn.active {
  background: linear-gradient(180deg, rgba(13, 110, 253, 0.25) 0%, rgba(13, 110, 253, 0.35) 100%);
  color: #ffffff;
  box-shadow: inset 0 1px 2px rgba(13, 110, 253, 0.3);
}

.type-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: rgba(13, 110, 253, 0.8);
  border-radius: 1px;
}

.country-select {
  padding: 5px 10px;
  font-size: 11px;
  color: #1e3a5f;
  background: linear-gradient(180deg, rgba(240, 244, 248, 0.95) 0%, rgba(220, 230, 240, 0.95) 100%);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 6px;
  cursor: pointer;
  outline: none;
  min-width: 70px;
  max-width: 80px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.country-select:hover {
  background: linear-gradient(180deg, rgba(224, 231, 240, 0.95) 0%, rgba(210, 222, 235, 0.95) 100%);
  border-color: rgba(56, 189, 248, 0.5);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.15);
}

.country-select:focus {
  border-color: rgba(14, 165, 233, 0.6);
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.2);
}

.country-select option {
  background: rgba(240, 244, 248, 0.98);
  color: #1e3a5f;
  font-size: 11px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(56, 189, 248, 0.1);
}

.country-select option:hover {
  background: rgba(56, 189, 248, 0.1);
}

.country-select option:checked {
  background: rgba(56, 189, 248, 0.2);
  color: #0ea5e9;
}

/* 日期范围选择器 */
.date-range-wrapper {
  position: relative;
}

.date-range-input {
  padding: 4px 8px;
  font-size: 10px;
  color: #1e3a5f;
  background: linear-gradient(180deg, rgba(240, 244, 248, 0.95) 0%, rgba(220, 230, 240, 0.95) 100%);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 5px;
  cursor: pointer;
  outline: none;
  min-width: 75px;
  max-width: 85px;
  width: 75px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.date-range-input:hover {
  background: linear-gradient(180deg, rgba(224, 231, 240, 0.95) 0%, rgba(210, 222, 235, 0.95) 100%);
  border-color: rgba(56, 189, 248, 0.4);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.15);
}

.date-range-input:focus {
  border-color: rgba(14, 165, 233, 0.5);
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.2);
}

/* 日期选择器弹窗 - 相对于父容器定位 */
.date-picker-popup {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: rgba(255, 255, 255, 0.99);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 10px;
  padding: 8px;
  z-index: 9999;
  min-width: 240px;
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(56, 189, 248, 0.05) inset;
  animation: datePickerFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes datePickerFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.date-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.date-picker-nav {
  background: linear-gradient(180deg, rgba(240, 244, 248, 0.9) 0%, rgba(220, 230, 240, 0.9) 100%);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #475569;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.date-picker-nav:hover {
  background: linear-gradient(180deg, rgba(224, 231, 240, 0.9) 0%, rgba(210, 222, 235, 0.9) 100%);
  border-color: rgba(56, 189, 248, 0.4);
  color: #1e3a5f;
}

.date-picker-title {
  color: #1e3a5f;
  font-size: 13px;
  font-weight: 600;
}

.date-picker-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  margin-bottom: 3px;
}

.date-picker-weekdays span {
  text-align: center;
  color: #94a3b8;
  font-size: 10px;
  padding: 2px;
}

.date-picker-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}

.date-picker-days span {
  text-align: center;
  padding: 6px 4px;
  font-size: 11px;
  cursor: pointer;
  border-radius: 5px;
  color: #475569;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.date-picker-days span.other-month {
  color: rgba(148, 163, 184, 0.3);
}

.date-picker-days span.not-available {
  color: rgba(148, 163, 184, 0.2);
  cursor: not-allowed;
}

.date-picker-days span:not(.other-month):not(.not-available):hover {
  background: rgba(56, 189, 248, 0.15);
  color: #1e3a5f;
  transform: scale(1.05);
}

.date-picker-days span.start-date {
  background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%);
  color: #ffffff;
  border-radius: 5px 0 0 5px;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
}

.date-picker-days span.end-date {
  background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%);
  color: #ffffff;
  border-radius: 0 5px 5px 0;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
}

.date-picker-days span.between-date {
  background: rgba(56, 189, 248, 0.2);
  color: #1e3a5f;
  border-radius: 0;
}

.date-picker-days span.start-date.end-date {
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
}

.date-picker-footer {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(56, 189, 248, 0.2);
}

.date-picker-btn {
  padding: 5px 12px;
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.2) 0%, rgba(14, 165, 233, 0.25) 100%);
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 5px;
  color: #1e3a5f;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(56, 189, 248, 0.15);
}

.date-picker-btn:hover {
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.3) 0%, rgba(14, 165, 233, 0.35) 100%);
  border-color: rgba(56, 189, 248, 0.5);
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.25);
  transform: translateY(-1px);
}

.date-picker-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(56, 189, 248, 0.15);
}

.date-picker-btn.cancel {
  background: linear-gradient(180deg, rgba(240, 244, 248, 0.5) 0%, rgba(220, 230, 240, 0.5) 100%);
  border-color: rgba(148, 163, 184, 0.3);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.date-picker-btn.cancel:hover {
  background: linear-gradient(180deg, rgba(224, 231, 240, 0.8) 0%, rgba(210, 222, 235, 0.9) 100%);
  border-color: rgba(148, 163, 184, 0.4);
  color: #1e3a5f;
}

/* 航班取消率日期选择器 */
.cancel-rate-date-picker {
  right: 0 !important;
  left: auto !important;
}

/* 航班取消率日期输入 */
.cancel-rate-date-input {
  padding: 4px 8px;
  font-size: 12px;
  color: #1e3a5f;
  background: linear-gradient(180deg, rgba(240, 244, 248, 0.95) 0%, rgba(220, 230, 240, 0.95) 100%);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 5px;
  cursor: pointer;
  min-width: 75px;
  max-width: 85px;
  width: 80px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.cancel-rate-date-input:hover {
  background: linear-gradient(180deg, rgba(224, 231, 240, 0.95) 0%, rgba(210, 222, 235, 0.95) 100%);
  border-color: rgba(56, 189, 248, 0.4);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.15);
}

/* 选中日期样式 */
.date-picker-days span.selected-date {
  background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%);
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
}

/* 图表内容区域 */
.chart-container {
  flex: 1;
  width: 100%;
  min-height: 0;
  padding: 8px 0;
  background: transparent;
  display: block;
  overflow: visible;
}

/* ECharts 容器样式 */
.chart-container > div:first-child {
  height: 100% !important;
  width: 100% !important;
}

/* 航司多选下拉框 */
.multi-select-wrapper {
  position: relative;
}

.multi-select-trigger {
  padding: 3px 6px;
  font-size: 11px;
  color: #1e3a5f;
  background: linear-gradient(180deg, rgba(240, 244, 248, 0.95) 0%, rgba(220, 230, 240, 0.95) 100%);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 5px;
  cursor: pointer;
  min-width: 80px;
  max-width: 100px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  position: relative;
}

.multi-select-trigger:hover {
  background: linear-gradient(180deg, rgba(224, 231, 240, 0.95) 0%, rgba(210, 222, 235, 0.95) 100%);
}

.dropdown-arrow {
  font-size: 8px;
  color: rgba(56, 189, 248, 0.7);
}

.multi-select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: -15px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 5px;
  padding: 4px;
  z-index: 9999;
  min-width: 200px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.multi-select-item {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 3px;
  font-size: 11px;
  color: #475569;
  gap: 8px;
}

.multi-select-item:hover {
  background: rgba(56, 189, 248, 0.1);
}

.multi-select-item.selected {
  background: rgba(56, 189, 248, 0.15);
}

.multi-select-item .checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border: 1px solid rgba(56, 189, 248, 0.5);
  border-radius: 2px;
  font-size: 10px;
  color: #38bdf8;
  background: rgba(255, 255, 255, 0.9);
}

.multi-select-item.selected .checkbox {
  background: #38bdf8;
  border-color: #38bdf8;
  color: #ffffff;
}

.multi-select-footer {
  padding-top: 4px;
  margin-top: 4px;
  border-top: 1px solid rgba(56, 189, 248, 0.2);
  text-align: center;
}

.select-all-btn {
  padding: 3px 8px;
  font-size: 10px;
  color: #1e3a5f;
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.15) 0%, rgba(14, 165, 233, 0.2) 100%);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 3px;
  cursor: pointer;
}

.select-all-btn:hover {
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.25) 0%, rgba(14, 165, 233, 0.3) 100%);
}

/* 响应式设计 */
@media (max-width: 1440px) {
  .chart-panel-individual {
    width: 340px;
    height: 200px;
  }
  
  .left-chart-container,
  .right-chart-container {
    width: 340px;
  }
}

@media (max-width: 1280px) {
  .chart-panel-individual {
    width: 320px;
    height: 190px;
  }
  
  .left-chart-container,
  .right-chart-container {
    width: 320px;
  }
}

@media (max-width: 1024px) {
  .side-panel {
    width: 280px;
  }
  
  .chart-panel-individual {
    width: 280px;
    height: 180px;
  }
  
  .left-chart-container,
  .right-chart-container {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .side-panel {
    display: none;
  }
  
  .nkg-heatmap, .nkg-airline, .nkg-region, .nkg-connected-airports {
    display: none;
  }
  
  .chart-panel-individual {
    width: calc(50% - 16px);
    height: 160px;
    position: relative !important;
    left: auto !important;
    right: auto !important;
    top: auto !important;
    margin-bottom: 12px;
  }
  
  .chart-container {
    padding: 6px;
  }
  
  .chart-header {
    padding: 8px 10px;
  }
  
  .chart-title {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .chart-panel-individual {
    width: 100%;
  }
}
</style>