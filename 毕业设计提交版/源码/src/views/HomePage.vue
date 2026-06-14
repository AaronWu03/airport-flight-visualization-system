<template>
  <div class="home-container">
    <!-- 动态背景层 -->
    <div class="dynamic-bg-wrapper">
      <div class="stars"></div>
      <div class="flight-paths">
        <div class="path p1"></div>
        <div class="path p2"></div>
        <div class="path p3"></div>
      </div>
      <div class="moving-planes">
        <div class="plane pl1"></div>
        <div class="plane pl2"></div>
        <div class="plane pl3"></div>
      </div>
    </div>

    <header class="cyber-header">
      <div class="logo-area">
        <span class="pulse-icon"></span>
        <div class="title-block">
          <h1>全球航班动态可视化系统</h1>
          <p>Global Flight Dynamics Visualization</p>
        </div>
        <router-link to="/history-trips" class="history-trip-btn" v-if="currentUser">
          <span class="history-icon">📋</span>
          <span>历史行程</span>
        </router-link>
      </div>
      <div class="header-right">
        <div class="user-area" v-if="currentUser">
          <span class="username">{{ currentUser.username }}</span>
          <button class="logout-btn" @click="handleLogout">退出</button>
        </div>
        <div class="user-area" v-else>
          <router-link to="/login" class="auth-link">登录</router-link>
          <span class="auth-sep">|</span>
          <router-link to="/register" class="auth-link">注册</router-link>
        </div>
        <div class="system-time">
          <span class="system-date">{{ currentDate }}</span>
          <span class="time-divider"></span>
          <span class="system-clock">{{ currentTime }}</span>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="search-card">
        <div class="tab-switcher">
          <button :class="{active: searchMode === 'flightNumber'}" @click="searchMode = 'flightNumber'">按航班号</button>
          <button :class="{active: searchMode === 'route'}" @click="searchMode = 'route'">按起降地</button>
          <button :class="{active: searchMode === 'airport'}" @click="searchMode = 'airport'">按机场</button>
          <button :class="{active: searchMode === 'radar'}" @click="searchMode = 'radar'">航班雷达</button>
        </div>

        <div class="search-inputs">
          <template v-if="searchMode === 'flightNumber'">
            <div class="input-group">
              <input type="text" placeholder="例如：CA1234" v-model="flightNumber" class="form-input" @input="flightNumber = flightNumber.toUpperCase()" />
              <label>航班号 / FLIGHT NUMBER</label>
            </div>
          </template>
          
          <template v-else-if="searchMode === 'route'">
            <div class="route-inputs">
              <div class="input-group">
                <div class="search-input-container">
                  <input 
                    type="text" 
                    placeholder="出发城市" 
                    v-model="departure" 
                    class="form-input"
                    @input="onDepartureInput"
                    @click.stop
                  />
                  <div v-if="showDepartureResults" class="search-results">
                    <div 
                      v-for="airport in departureResults" 
                      :key="airport.iata_code"
                      class="search-result-item"
                      @click="selectDeparture(airport)"
                    >
                      <div class="airport-code">
                        <span class="country-flag">
                          <img
                            v-if="airport.iso_country && !isFlagBroken(airport.iso_country)"
                            class="country-flag-img"
                            :src="getFlagUrl(airport.iso_country)"
                            :alt="airport.iso_country === 'TW' ? 'CN' : airport.iso_country"
                            @error="handleFlagError(airport.iso_country)"
                          >
                          <span v-else class="country-flag-text">{{ ((airport.iso_country === 'TW' ? 'CN' : airport.iso_country) || '--').toUpperCase() }}</span>
                        </span>
                        {{ airport.iata_code }}
                      </div>
                      <div class="airport-info">
                        <span class="airport-city">
                          {{ airport.city_zh && airport.municipality && airport.city_zh !== airport.municipality ? `${airport.city_zh} (${airport.municipality})` : (airport.city_zh || airport.municipality) }}
                        </span>
                        <span class="airport-name">{{ airport.name_zh || airport.name }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <label>出发城市 / DEPARTURE</label>
              </div>
              <div class="swap-icon">✈</div>
              <div class="input-group">
                <div class="search-input-container">
                  <input 
                    type="text" 
                    placeholder="到达城市" 
                    v-model="arrival" 
                    class="form-input"
                    @input="onArrivalInput"
                    @click.stop
                  />
                  <div v-if="showArrivalResults" class="search-results">
                    <div 
                      v-for="airport in arrivalResults" 
                      :key="airport.iata_code"
                      class="search-result-item"
                      @click="selectArrival(airport)"
                    >
                      <div class="airport-code">
                        <span class="country-flag">
                          <img
                            v-if="airport.iso_country && !isFlagBroken(airport.iso_country)"
                            class="country-flag-img"
                            :src="getFlagUrl(airport.iso_country)"
                            :alt="airport.iso_country === 'TW' ? 'CN' : airport.iso_country"
                            @error="handleFlagError(airport.iso_country)"
                          >
                          <span v-else class="country-flag-text">{{ ((airport.iso_country === 'TW' ? 'CN' : airport.iso_country) || '--').toUpperCase() }}</span>
                        </span>
                        {{ airport.iata_code }}
                      </div>
                      <div class="airport-info">
                        <span class="airport-city">
                          {{ airport.city_zh && airport.municipality && airport.city_zh !== airport.municipality ? `${airport.city_zh} (${airport.municipality})` : (airport.city_zh || airport.municipality) }}
                        </span>
                        <span class="airport-name">{{ airport.name_zh || airport.name }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <label>到达城市 / ARRIVAL</label>
              </div>
            </div>
          </template>

          <template v-else-if="searchMode === 'airport'">
            <div class="airport-search-container">
              <div class="input-group">
                <div class="search-input-container">
                  <input 
                    type="text" 
                    placeholder="输入机场三字码或城市名" 
                    v-model="airportCode" 
                    class="form-input"
                    maxlength="3"
                    @input="onAirportInput"
                    @keyup.enter="searchAirport"
                  />
                  <div v-if="showAirportResults" class="search-results">
                    <div 
                      v-for="airport in airportResults" 
                      :key="airport.iata_code"
                      class="search-result-item"
                      @click="selectAirport(airport)"
                    >
                      <div class="airport-code">
                        <span class="country-flag">
                          <img
                            v-if="airport.iso_country && !isFlagBroken(airport.iso_country)"
                            class="country-flag-img"
                            :src="getFlagUrl(airport.iso_country)"
                            :alt="airport.iso_country === 'TW' ? 'CN' : airport.iso_country"
                            @error="handleFlagError(airport.iso_country)"
                          >
                          <span v-else class="country-flag-text">{{ ((airport.iso_country === 'TW' ? 'CN' : airport.iso_country) || '--').toUpperCase() }}</span>
                        </span>
                        {{ airport.iata_code }}
                      </div>
                      <div class="airport-info">
                        <span class="airport-city">
                          {{ airport.city_zh && airport.municipality && airport.city_zh !== airport.municipality ? `${airport.city_zh} (${airport.municipality})` : (airport.city_zh || airport.municipality) }}
                        </span>
                        <span class="airport-name">{{ airport.name_zh || airport.name }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <label>机场代码 / AIRPORT CODE</label>
              </div>
              <div class="input-group date-input">
                <input type="date" v-model="date" class="form-input" />
                <label>出发日期 / DEPARTURE DATE</label>
              </div>
            </div>
          </template>

          <template v-else-if="searchMode === 'radar'">
            <div class="radar-container">
              <FlightRadar />
            </div>
          </template>

          <div class="input-group date-input" v-if="searchMode !== 'radar' && searchMode !== 'airport'">
            <input type="date" v-model="date" class="form-input" />
            <label>出发日期 / DEPARTURE DATE</label>
          </div>

          <div v-if="error && (searchMode === 'flightNumber' || searchMode === 'route')" class="error-message">
            {{ error }}
          </div>

          <div v-if="currentUser && recentSearches.length > 0 && (searchMode === 'flightNumber' || searchMode === 'route' || searchMode === 'airport')" class="recent-searches">
            <div class="recent-header">
              <span class="recent-icon">🕒</span>
              <span>最近搜索</span>
              <button class="clear-btn" @click="clearRecent">清空</button>
            </div>
            <div class="recent-list">
              <div 
                v-for="(item, index) in recentSearches" 
                :key="index" 
                class="recent-item"
                @click="useRecentSearch(item)"
              >
                <div class="recent-content">
                  <span v-if="item.type === 'flightNumber'" class="recent-tag flight-tag">✈️</span>
                  <span v-else-if="item.type === 'route'" class="recent-tag route-tag">🛫</span>
                  <span v-else class="recent-tag airport-tag">🏢</span>
                  <span class="recent-text">{{ item.text }}</span>
                </div>
                <span class="recent-date">{{ item.date }}</span>
                <span class="recent-time">{{ formatTime(item.timestamp) }}</span>
              </div>
            </div>
          </div>
        </div>

        <button 
          v-if="searchMode === 'flightNumber' || searchMode === 'route'"
          class="main-search-btn" 
          @click="searchFlight"
          :disabled="isLoading"
        >
          {{ isLoading ? '搜索中...' : '开始搜索' }} <span class="btn-arrow">>></span>
        </button>
        
        <button 
          v-if="searchMode === 'airport'"
          class="main-search-btn" 
          @click="searchAirport"
          :disabled="isLoading"
        >
          {{ isLoading ? '搜索中...' : '查看机场' }} <span class="btn-arrow">>></span>
        </button>

        <!-- 航班搜索结果列表 -->
        <div v-if="flightList.length > 0" class="flight-results-list">
          <h3>搜索结果 (点击查看详情)</h3>
          <div 
            v-for="flight in flightList" 
            :key="flight.FlightNo" 
            class="result-item" 
            @click="handleFlightClick(flight)"
          >
            <div class="res-info">
              <span class="res-airline-logo">
                <img :src="getAirlineLogoSrcWithFallback(flight)" :alt="flight.FlightCompany" class="res-logo-img" @error="handleResLogoError($event, flight)" />
              </span>
              <span class="res-no">{{ flight.FlightNo }}</span>
              <span class="res-airline">{{ flight.FlightCompany }}</span>
              <span v-if="flight.StopCity || flight.stopFlag === '1'" class="stopover-tag">经停</span>
            </div>
            <div class="res-time">
              <span>{{ flight.FlightDeptimePlanDate?.split(' ')[1]?.substring(0,5) || '-' }}</span>
              <span class="res-arrow">→</span>
              <span>{{ flight.FlightArrtimePlanDate?.split(' ')[1]?.substring(0,5) || '-' }}</span>
            </div>
            <div class="res-status" :class="flight.FlightState">{{ flight.FlightState }}</div>
          </div>
        </div>
      </div>
    </main>

    <footer class="home-footer">
      <!-- 紧凑型功能区 (整合到底部) -->
      <div class="compact-features">
        <div class="feature-item">
          <span class="f-icon">✈️</span>
          <span class="f-text">实时追踪</span>
        </div>
        <div class="f-sep"></div>
        <div class="feature-item">
          <span class="f-icon">📊</span>
          <span class="f-text">数据分析</span>
        </div>
        <div class="f-sep"></div>
        <div class="feature-item">
          <span class="f-icon">🌍</span>
          <span class="f-text">3D可视化</span>
        </div>
      </div>

      <div class="footer-main-content">
        <div class="footer-logo-wrap">
          <img src="../assets/schoollogo.png" alt="学校logo" class="school-logo">
        </div>
        <div class="footer-content">
          <p class="school-name">东南大学 - 交通学院</p>
          <p class="copyright">&copy; 2026 全球航班动态可视化系统</p>
        </div>
      </div>
    </footer>

    <!-- 航段选择弹窗 -->
    <div v-if="showSegmentPicker" class="segment-picker-overlay">
      <div class="segment-picker-dialog">
        <h3>请选择您的航段</h3>
        <div class="segment-options">
          <div class="segment-option" @click="handleSegmentSelect(1)">
            <div class="segment-badge">第一程</div>
            <div class="route-container">
              <div class="airport-group departure">
                <div class="iata">{{ selectedFlight?.FlightDepcode }}</div>
                <div class="city">{{ selectedFlight?.FlightDep }}</div>
              </div>
              <div class="airport-group arrival">
                <div class="iata">{{ selectedFlight?.StopAirportCode }}</div>
                <div class="city">{{ selectedFlight?.StopCity }}</div>
              </div>
              <div class="path-line">
                <span class="plane-icon">✈️</span>
              </div>
            </div>
          </div>
          
          <div class="segment-option" @click="handleSegmentSelect(2)">
            <div class="segment-badge">第二程</div>
            <div class="route-container">
              <div class="airport-group departure">
                <div class="iata">{{ selectedFlight?.StopAirportCode }}</div>
                <div class="city">{{ selectedFlight?.StopCity }}</div>
              </div>
              <div class="airport-group arrival">
                <div class="iata">{{ selectedFlight?.FlightArrcode }}</div>
                <div class="city">{{ selectedFlight?.FlightArr }}</div>
              </div>
              <div class="path-line">
                <span class="plane-icon">✈️</span>
              </div>
            </div>
          </div>
          
          <div class="segment-option full-flight" @click="handleSegmentSelect(0)">
            <div class="segment-badge secondary">全航段</div>
            <div class="route-container">
              <div class="airport-group departure">
                <div class="iata">{{ selectedFlight?.FlightDepcode }}</div>
                <div class="city">{{ selectedFlight?.FlightDep }}</div>
              </div>
              <div class="airport-group arrival">
                <div class="iata">{{ selectedFlight?.FlightArrcode }}</div>
                <div class="city">{{ selectedFlight?.FlightArr }}</div>
              </div>
              <div class="path-line">
                <span class="plane-icon">✈️</span>
                <div v-if="selectedFlight?.StopCity" class="stopover-info">经停 {{ selectedFlight?.StopCity }}</div>
              </div>
            </div>
            <div class="global-note">✨ 行李直达 · 延误保障</div>
          </div>
        </div>
        <button class="cancel-button" @click="showSegmentPicker = false">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import FlightRadar from '../components/FlightRadar.vue'
import axios from 'axios'
import Fuse from 'fuse.js'
import { getCurrentUser, logoutUser, getRecentSearches, addRecentSearch, clearRecentSearches } from '../utils/userStore'
import { addHistoryTrip } from '../utils/historyTripStore'
import { getAirlineLogoSrc, getAirlineLogoPngSrc } from '../utils/airlineLogoMap'

// 导入机场数据
import airportsData from '../assets/airports.json'

// 将对象转换为数组
const airportList = Object.values(airportsData.airports);

// 初始化 Fuse 实例
const fuse = new Fuse(airportList, {
  keys: [
    { name: 'iata_code', weight: 1.0 }, // 三字码最优先
    { name: 'municipality', weight: 0.7 }, // 城市名次之
    { name: 'name', weight: 0.4 }, // 机场全名最后
    { name: 'name_zh', weight: 0.6 },
    { name: 'city_zh', weight: 0.8 }
  ],
  threshold: 0.4, // 模糊匹配程度，0.4 比较适中
  includeMatches: true
});

const router = useRouter()
const searchMode = ref('flightNumber')
const flightNumber = ref('')
const departure = ref('')
const arrival = ref('')
const date = ref('')
const cabin = ref('经济舱')
const isLoading = ref(false)
const error = ref('')
const flightList = ref([])
const currentTime = ref('')
const currentDate = ref('')
let timeInterval = null

// 航段选择弹窗相关
const showSegmentPicker = ref(false)
const selectedFlight = ref(null)

// 搜索联想相关
const departureResults = ref([])
const arrivalResults = ref([])
const showDepartureResults = ref(false)
const showArrivalResults = ref(false)
const selectedDepCode = ref('')
const selectedArrCode = ref('')

// 机场查询相关
const airportCode = ref('')
const airportResults = ref([])
const showAirportResults = ref(false)

// 用户认证相关
const currentUser = ref(null)
const recentSearches = ref([])

const handleLogout = () => {
  logoutUser()
  currentUser.value = null
  recentSearches.value = []
  window.location.reload()
}

const loadRecentSearches = () => {
  recentSearches.value = getRecentSearches()
}

const clearRecent = () => {
  clearRecentSearches()
  recentSearches.value = []
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  if (year === now.getFullYear()) {
    return `${month}-${day} ${hours}:${minutes}`
  }
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 城市中文名到机场三字码的映射（用于兼容旧的最近搜索记录）
const cityToCodeMap = {
  '新加坡': 'SIN',
  '首尔': 'ICN',
  '纽约': 'JFK',
  '东京': 'NRT',
  '北京': 'PEK',
  '上海': 'PVG',
  '广州': 'CAN',
  '深圳': 'SZX',
  '成都': 'CTU',
  '杭州': 'HGH',
  '西安': 'XIY',
  '南京': 'NKG',
  '武汉': 'WUH',
  '重庆': 'CKG',
  '昆明': 'KMG',
  '香港': 'HKG',
  '台北': 'TPE',
  '大阪': 'KIX',
  '曼谷': 'BKK',
  '伦敦': 'LHR',
  '巴黎': 'CDG',
  '法兰克福': 'FRA',
  '阿姆斯特丹': 'AMS',
  '洛杉矶': 'LAX',
  '迪拜': 'DXB',
  '多哈': 'DOH',
  '阿布扎比': 'AUH',
  '悉尼': 'SYD',
  '墨尔本': 'MEL',
  '温哥华': 'YVR',
  '多伦多': 'YYZ',
  '旧金山': 'SFO',
  '西雅图': 'SEA',
  '芝加哥': 'ORD',
  '达拉斯': 'DFW',
  '休斯顿': 'IAH',
  '迈阿密': 'MIA',
  '波士顿': 'BOS',
  '丹佛': 'DEN',
  '亚特兰大': 'ATL',
  '底特律': 'DTW',
  '明尼阿波利斯': 'MSP',
  '凤凰城': 'PHX',
  '拉斯维加斯': 'LAS',
  '檀香山': 'HNL',
  '火奴鲁鲁': 'HNL',
}

const useRecentSearch = (item) => {
  if (item.type === 'flightNumber') {
    searchMode.value = 'flightNumber'
    flightNumber.value = item.flightNumber
    date.value = item.date
  } else if (item.type === 'route') {
    searchMode.value = 'route'
    departure.value = item.departure
    arrival.value = item.arrival
    
    // 优先使用保存的机场代码，如果没有则从城市名映射
    if (item.depCode && item.arrCode) {
      selectedDepCode.value = item.depCode
      selectedArrCode.value = item.arrCode
    } else {
      // 从城市中文名查找三字码
      selectedDepCode.value = cityToCodeMap[item.departure] || ''
      selectedArrCode.value = cityToCodeMap[item.arrival] || ''
    }
    
    date.value = item.date
  } else if (item.type === 'airport') {
    searchMode.value = 'airport'
    airportCode.value = item.airportCode
    date.value = item.date
  }
}

watch(searchMode, () => {
  loadRecentSearches()
})

// 国家代码到国旗 Emoji 的映射表
const countryFlags = {
  'CN': '🇨🇳', // 中国
  'SG': '🇸🇬', // 新加坡
  'JP': '🇯🇵', // 日本
  'KR': '🇰🇷', // 韩国
  'US': '🇺🇸', // 美国
  'GB': '🇬🇧', // 英国
  'TH': '🇹🇭', // 泰国
  'MY': '🇲🇾', // 马来西亚
  'AU': '🇦🇺', // 澳大利亚
  'DE': '🇩🇪', // 德国
  'FR': '🇫🇷', // 法国
  'AE': '🇦🇪', // 阿联酋
  'HK': '🇭🇰', // 香港
  'TW': '🇹🇼', // 台湾
  'CA': '🇨🇦', // 加拿大
  'NZ': '🇳🇿', // 新西兰
  'IN': '🇮🇳', // 印度
  'RU': '🇷🇺', // 俄罗斯
  'IT': '🇮🇹', // 意大利
  'ES': '🇪🇸', // 西班牙
  'NL': '🇳🇱', // 荷兰
  'CH': '🇨🇭', // 瑞士
  'SE': '🇸🇪', // 瑞典
  'NO': '🇳🇴', // 挪威
  'DK': '🇩🇰', // 丹麦
  'BE': '🇧🇪', // 比利时
  'AT': '🇦🇹', // 奥地利
  'PT': '🇵🇹', // 葡萄牙
  'GR': '🇬🇷', // 希腊
  'TR': '🇹🇷', // 土耳其
  'SA': '🇸🇦', // 沙特阿拉伯
  'ZA': '🇿🇦', // 南非
  'EG': '🇪🇬'  // 埃及
};

// 获取国家国旗 Emoji
const getCountryEmoji = (isoCode) => {
  const code = isoCode ? isoCode.toUpperCase() : '';
  return countryFlags[code] || '🏳️'; // 找不到就显示白旗兜底
};

const brokenFlags = ref({})

const normalizeIsoCountry = (isoCode) => (isoCode || '').toString().trim().toLowerCase()

const mapFlagIsoCountry = (isoCode) => {
  const code = normalizeIsoCountry(isoCode)
  if (code === 'tw') return 'cn'
  return code
}

const getFlagUrl = (isoCode) => {
  const code = mapFlagIsoCountry(isoCode)
  return code ? `https://flagcdn.com/w20/${code}.png` : ''
}

const isFlagBroken = (isoCode) => {
  const code = mapFlagIsoCountry(isoCode)
  return !!brokenFlags.value[code]
}

const handleFlagError = (isoCode) => {
  const code = mapFlagIsoCountry(isoCode)
  if (!code) return
  brokenFlags.value = { ...brokenFlags.value, [code]: true }
}

// 搜索输入处理函数
const onDepartureInput = (e) => {
  const input = e.target.value;
  departure.value = input;
  
  if (input.length > 0) {
    const results = fuse.search(input);
    departureResults.value = results.slice(0, 8).map(result => {
      const item = result.item;
      // 添加国旗 Emoji
      item.flag = getCountryEmoji(item.iso_country);
      return item;
    });
    showDepartureResults.value = true;
  } else {
    showDepartureResults.value = false;
  }
};

const onArrivalInput = (e) => {
  const input = e.target.value;
  arrival.value = input;
  
  if (input.length > 0) {
    const results = fuse.search(input);
    arrivalResults.value = results.slice(0, 8).map(result => {
      const item = result.item;
      // 添加国旗 Emoji
      item.flag = getCountryEmoji(item.iso_country);
      return item;
    });
    showArrivalResults.value = true;
  } else {
    showArrivalResults.value = false;
  }
};

// 选中机场处理函数
const selectDeparture = (airport) => {
  departure.value = airport.city_zh || airport.municipality;
  selectedDepCode.value = airport.iata_code;
  showDepartureResults.value = false;
};

const selectArrival = (airport) => {
  arrival.value = airport.city_zh || airport.municipality;
  selectedArrCode.value = airport.iata_code;
  showArrivalResults.value = false;
};

// 机场搜索处理
const onAirportInput = (e) => {
  const input = e.target.value;
  airportCode.value = input.toUpperCase();
  
  if (input.length > 0) {
    const results = fuse.search(input);
    airportResults.value = results.slice(0, 8).map(result => {
      const item = result.item;
      item.flag = getCountryEmoji(item.iso_country);
      return item;
    });
    showAirportResults.value = true;
  } else {
    showAirportResults.value = false;
  }
};

const selectAirport = (airport) => {
  airportCode.value = airport.iata_code;
  showAirportResults.value = false;
};

const searchAirport = () => {
  const code = airportCode.value.toUpperCase().trim();
  if (!code || code.length !== 3) {
    error.value = '请输入有效的机场三字码';
    return;
  }
  
  addRecentSearch({
    type: 'airport',
    text: code,
    airportCode: code,
    date: date.value
  })
  loadRecentSearches()
  
  // 保存搜索到历史行程
  addHistoryTrip({
    type: 'airport',
    airportCode: code,
    date: date.value
  })
  
  router.push(`/airports?code=${code}&date=${date.value}`);
};

// 点击页面其他地方关闭下拉列表
const handleClickOutside = () => {
  showDepartureResults.value = false;
  showArrivalResults.value = false;
  showAirportResults.value = false;
};

// 更新当前时间
const updateCurrentTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const weekList = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  currentDate.value = `${year}-${month}-${day} ${weekList[now.getDay()]}`;
  currentTime.value = `${hours}:${minutes}:${seconds}`;
};

// 生命周期钩子
onMounted(() => {
  // 点击页面其他地方关闭下拉列表
  document.addEventListener('click', handleClickOutside);
  // 测试国旗转换函数
  console.log('getCountryEmoji(\'CN\'):', getCountryEmoji('CN'));
  console.log('getCountryEmoji(\'SG\'):', getCountryEmoji('SG'));
  console.log('getCountryEmoji(\'US\'):', getCountryEmoji('US'));
  
  // 初始化并启动时间更新
  updateCurrentTime();
  timeInterval = setInterval(updateCurrentTime, 1000);

  // 加载当前用户信息
  currentUser.value = getCurrentUser();
  
  // 加载最近搜索
  if (currentUser.value) {
    loadRecentSearches();
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});

const getTodayDate = async () => {
  try {
    const response = await axios.post('http://localhost:3001/api/mcp', {
      toolName: 'getTodayDate',
      args: { random_string: 'test' }
    })
    const result = JSON.parse(response.data.content[0].text)
    return result.date
  } catch (err) {
    console.error('获取日期失败:', err)
    return new Date().toISOString().split('T')[0]
  }
}

// 处理航班点击
const handleFlightClick = (flight) => {
  // 判断是否是经停航班
  if (flight.StopCity || flight.stopFlag === '1') {
    // 经停航班，显示航段选择弹窗
    selectedFlight.value = flight;
    showSegmentPicker.value = true;
  } else {
    // 直飞航班，直接跳转
    router.push(`/flight/${flight.FlightNo}?date=${date.value}`);
  }
};

// 处理航段选择
const handleSegmentSelect = (segment) => {
  showSegmentPicker.value = false
  if (selectedFlight.value) {
    let segmentFlight;
    
    // 根据选择的航段获取对应的航班数据
    if (segment === 1) {
      // 第一程
      if (selectedFlight.value.segment1) {
        // 如果有单独的航段数据，使用它
        segmentFlight = {
          ...selectedFlight.value.segment1,
          stopFlag: '0' // 强制设为 0，伪装成直飞航班
        };
      } else {
        // 构建第一程数据
        segmentFlight = {
          ...selectedFlight.value,
          depAirportCode: selectedFlight.value.FlightDepcode,
          arrAirportCode: selectedFlight.value.StopAirportCode,
          depCity: selectedFlight.value.FlightDep,
          arrCity: selectedFlight.value.StopCity,
          depAirport: selectedFlight.value.FlightDepcode,
          arrAirport: selectedFlight.value.StopAirportCode,
          FlightDep: selectedFlight.value.FlightDep,
          FlightArr: selectedFlight.value.StopCity,
          FlightDepcode: selectedFlight.value.FlightDepcode,
          FlightArrcode: selectedFlight.value.StopAirportCode,
          estimatedFlightTime: '2h 30m',
          distance: '2173',
          stopFlag: '0' // 强制设为 0，伪装成直飞航班
        };
      }
    } else if (segment === 2) {
      // 第二程
      if (selectedFlight.value.segment2) {
        // 如果有单独的航段数据，使用它
        segmentFlight = {
          ...selectedFlight.value.segment2,
          stopFlag: '2' // 标记为第二程
        };
      } else {
        // 构建第二程数据
        segmentFlight = {
          ...selectedFlight.value,
          depAirportCode: selectedFlight.value.StopAirportCode,
          arrAirportCode: selectedFlight.value.FlightArrcode,
          depCity: selectedFlight.value.StopCity,
          arrCity: selectedFlight.value.FlightArr,
          depAirport: selectedFlight.value.StopAirportCode,
          arrAirport: selectedFlight.value.FlightArrcode,
          FlightDep: selectedFlight.value.StopCity,
          FlightArr: selectedFlight.value.FlightArr,
          FlightDepcode: selectedFlight.value.StopAirportCode,
          FlightArrcode: selectedFlight.value.FlightArrcode,
          estimatedFlightTime: '2h 15m',
          distance: '1734',
          StopAirportCode: selectedFlight.value.StopAirportCode,
          StopCity: selectedFlight.value.StopCity,
          stopFlag: '2' // 标记为第二程
        };
      }
    } else if (segment === 0) {
      // 全程
      if (selectedFlight.value.fullFlight) {
        // 如果有全程数据，使用它
        segmentFlight = {
          ...selectedFlight.value.fullFlight,
          stopFlag: '1' // 保持经停标志
        };
      } else {
        // 使用原始数据
        segmentFlight = {
          ...selectedFlight.value,
          stopFlag: '1' // 保持经停标志
        };
      }
    }
    
    console.log('🔪 切片后的航段数据:', segmentFlight);
    
    // 将选中的航段信息作为查询参数传递给详情页
    router.push({
      path: `/flight/${selectedFlight.value.FlightNo || segmentFlight.FlightNo}`,
      query: {
        segment: segment,
        depAirport: segmentFlight.FlightDepcode || segmentFlight.depAirportCode,
        arrAirport: segmentFlight.FlightArrcode || segmentFlight.arrAirportCode,
        depCity: segmentFlight.FlightDep || segmentFlight.depCity,
        arrCity: segmentFlight.FlightArr || segmentFlight.arrCity,
        flightInfo: JSON.stringify(segmentFlight),
        date: date.value, // 传递日期参数
        stopAirport: selectedFlight.value.StopAirportCode,
        stopCity: selectedFlight.value.StopCity
      }
    })
  }
}

// 获取航司Logo图片路径 - 优先SVG，失败回退PNG
const getAirlineLogoSrcWithFallback = (flight) => {
  if (!flight) return '/assets/airline-logos/default.svg'
  const flightNo = flight.FlightNo || ''
  const airlineName = flight.FlightCompany || ''
  return getAirlineLogoSrc('', airlineName, flightNo)
}

// 航司Logo加载失败时的回退 - 尝试PNG
const handleResLogoError = (event, flight) => {
  if (!flight) return
  const flightNo = flight.FlightNo || ''
  const airlineName = flight.FlightCompany || ''
  const pngSrc = getAirlineLogoPngSrc('', airlineName, flightNo)
  if (event.target.src !== pngSrc) {
    event.target.src = pngSrc
  } else {
    // PNG也失败了，隐藏图片显示fallback文字
    event.target.style.display = 'none'
    const parent = event.target.parentElement
    if (parent && !parent.querySelector('.logo-fallback')) {
      const fallback = document.createElement('span')
      fallback.className = 'logo-fallback'
      const match = flightNo.match(/^([A-Z0-9]{2})/i)
      fallback.textContent = match ? match[1].toUpperCase() : '?'
      parent.appendChild(fallback)
    }
  }
}

const searchFlight = async () => {
  isLoading.value = true
  error.value = ''
  // 重置搜索状态，避免数据污染
  selectedFlight.value = null
  showSegmentPicker.value = false
  flightList.value = [] // 搜索前清空旧列表
  
  try {
    if (searchMode.value === 'flightNumber') {
      if (flightNumber.value) {
        try {
          // 校验参数
          if (!flightNumber.value) {
            error.value = '请输入航班号';
            return;
          }
          if (!date.value) {
            error.value = '请选择出发日期';
            return;
          }
          
          addRecentSearch({
            type: 'flightNumber',
            text: flightNumber.value,
            flightNumber: flightNumber.value,
            date: date.value
          })
          loadRecentSearches()
          
          // 保存搜索到历史行程
          addHistoryTrip({
            type: 'flightNumber',
            flightNumber: flightNumber.value,
            date: date.value
          })
          
          // 调用API获取航班数据
          const response = await axios.post('http://localhost:3001/api/mcp', {
            toolName: 'searchFlightsByNumber',
            args: {
              fnum: flightNumber.value,
              date: date.value
            }
          });
          
          const resData = response.data;
          const rawContent = resData.content[0].text;
          console.log("原始返回:", rawContent);
          
          if (rawContent.startsWith('MCP error')) {
              error.value = '查询失败：请输入正确的航班号';
              return;
          }
          
          try {
              const result = JSON.parse(rawContent);
              
              if (result.code === 200 && result.data && result.data.length > 0) {
                // 检查是否有经停航班
                const stopoverFlight = result.data.find(flight => flight.StopFlag === '1');
                
                if (stopoverFlight) {
                  // 找到经停航班，检查是否有多个航段
                  if (result.data.length >= 3) {
                    // 存储三个对象，严格按照 API 返回顺序：[0]=全程, [1]=第一程, [2]=第二程
                    selectedFlight.value = {
                      fullFlight: result.data[0], // 全程信息
                      segment1: result.data[1], // 第一段航程
                      segment2: result.data[2], // 第二段航程
                      StopFlag: '1',
                      StopCity: result.data[0].StopCity || '',
                      StopAirportCode: result.data[0].StopAirportCode || '',
                      FlightNo: result.data[0].FlightNo || result.data[1].FlightNo || result.data[2].FlightNo,
                      // 补充顶层属性供弹窗使用
                      FlightDepcode: result.data[1].FlightDepcode || result.data[0].FlightDepcode,
                      FlightDep: result.data[1].FlightDep || result.data[0].FlightDep,
                      FlightArrcode: result.data[2].FlightArrcode || result.data[0].FlightArrcode,
                      FlightArr: result.data[2].FlightArr || result.data[0].FlightArr
                    };
                    console.log('✈️ 经停航班数据映射:', {
                      fullFlight: result.data[0].FlightDep + ' -> ' + result.data[0].FlightArr,
                      segment1: result.data[1].FlightDep + ' -> ' + result.data[1].FlightArr,
                      segment2: result.data[2].FlightDep + ' -> ' + result.data[2].FlightArr
                    });
                  } else {
                    // 只有一个经停航班对象，使用它
                    selectedFlight.value = {
                      ...stopoverFlight,
                      fullFlight: stopoverFlight,
                      segment1: stopoverFlight,
                      segment2: null
                    };
                  }
                  showSegmentPicker.value = true;
                } else if (result.data.length > 1) {
                  // 检查是否有多个航段的航班
                  const sinToHak = result.data.find(flight => flight.FlightDepcode === 'SIN' && flight.FlightArrcode === 'HAK');
                  const hakToLhw = result.data.find(flight => flight.FlightDepcode === 'HAK' && flight.FlightArrcode === 'LHW');
                  const sinToLhw = result.data.find(flight => flight.FlightDepcode === 'SIN' && flight.FlightArrcode === 'LHW');
                  
                  if (sinToHak && hakToLhw) {
                    // 构建经停航班信息
                    const flightData = {
                      fullFlight: sinToLhw || sinToHak,
                      segment1: sinToHak,
                      segment2: hakToLhw,
                      StopFlag: '1',
                      StopCity: '海口',
                      StopAirportCode: 'HAK',
                      FlightNo: sinToLhw?.FlightNo || sinToHak?.FlightNo || hakToLhw?.FlightNo
                    };
                    selectedFlight.value = flightData;
                    showSegmentPicker.value = true;
                  } else {
                    // 没有经停航班，直接跳转到第一个航班的详情页
                    router.push({
                      path: `/flight/${flightNumber.value}`,
                      query: {
                        date: date.value // 传递日期参数
                      }
                    });
                  }
                } else {
                  // 只有一个航班，直接跳转到详情页
                  router.push({
                    path: `/flight/${flightNumber.value}`,
                    query: {
                      date: date.value // 传递日期参数
                    }
                  });
                }
              } else {
                // 接口返回 code===200 但 data 为空：可能航班号错误或当天无航班
                if (result.code === 200) {
                  error.value = '未查询到航班信息，请检查航班号和日期是否正确';
                } else {
                  error.value = result.message || '未找到航班';
                }
              }
          } catch (e) {
              error.value = '数据格式异常，请稍后重试';
              console.error('JSON 解析错误:', e);
          }
        } catch (err) {
          console.error('搜索航班失败:', err);
          error.value = '搜索失败，请检查网络';
        }
      } else {
        error.value = '请输入航班号'
      }
    } else {
      if ((departure.value || selectedDepCode.value) && (arrival.value || selectedArrCode.value) && date.value) {
        // 关键修复：确保发送的是 HAK 而不是 海口
        const depCode = selectedDepCode.value || departure.value.toUpperCase();
        const arrCode = selectedArrCode.value || arrival.value.toUpperCase();
        
        addRecentSearch({
          type: 'route',
          text: `${departure.value} → ${arrival.value}`,
          departure: departure.value,
          arrival: arrival.value,
          depCode: selectedDepCode.value || departure.value.toUpperCase(),
          arrCode: selectedArrCode.value || arrival.value.toUpperCase(),
          date: date.value
        })
        loadRecentSearches()
        
        // 保存搜索到历史行程
        addHistoryTrip({
          type: 'route',
          departure: departure.value,
          arrival: arrival.value,
          date: date.value
        })
        
        // 使用 axios 调用你的后端代理，而不是 window.runMCP
        const response = await axios.post('http://localhost:3001/api/mcp', {
          toolName: 'searchFlightsByDepArr',
          args: {
            dep: depCode, // 必须是 3 位代码
            arr: arrCode,
            date: date.value // 格式 YYYY-MM-DD
          }
        });

        const resData = response.data; // 假设你的代理返回了 content[0].text
        const rawContent = resData.content[0].text;
        console.log("原始返回:", rawContent);
        
        if (rawContent.startsWith('MCP error')) {
            error.value = '查询失败：请输入正确的机场三字码（如 HAK, NKG）';
            return;
        }

        try {
            const result = JSON.parse(rawContent);

            if (result.code === 200 && result.data && result.data.length > 0) {
              flightList.value = result.data;
            } else if (result.code === 200) {
              error.value = '未查询到航班信息，请检查机场三字码和日期是否正确';
            } else {
              error.value = result.message || '未找到航班';
            }
        } catch (e) {
            error.value = '数据格式异常，请稍后重试';
            console.error('JSON 解析错误:', e);
        }
      } else {
        error.value = '请填写完整的搜索信息'
      }
    }
  } catch (err) {
    console.error('搜索失败:', err)
    if (searchMode.value === 'flightNumber' && flightNumber.value) {
      router.push(`/flight/${flightNumber.value}`)
    } else {
      error.value = "查询失败，请确保输入的是机场三字码（如 HAK, NKG）";
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 主容器 */
.home-container {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f0f4f8 0%, #e8eef5 50%, #dce6f0 100%);
  overflow: hidden;
}

/* 动态背景层 (浅色系) */
.dynamic-bg-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.stars {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(2px 2px at 20% 30%, rgba(56, 189, 248, 0.2) 100%, transparent),
    radial-gradient(1.5px 1.5px at 40% 70%, rgba(56, 189, 248, 0.15) 100%, transparent),
    radial-gradient(2px 2px at 60% 40%, rgba(16, 185, 129, 0.15) 100%, transparent),
    radial-gradient(2.5px 2.5px at 80% 10%, rgba(253, 208, 0, 0.12) 100%, transparent),
    radial-gradient(1.5px 1.5px at 10% 90%, rgba(56, 189, 248, 0.18) 100%, transparent),
    radial-gradient(2px 2px at 90% 80%, rgba(16, 185, 129, 0.12) 100%, transparent);
  background-size: 300px 300px;
  opacity: 0.6;
  animation: starRotate 200s linear infinite;
}

.flight-paths {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0.25;
}

.path {
  position: absolute;
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 50%;
}

.p1 { width: 800px; height: 300px; top: 10%; left: -10%; transform: rotate(-15deg); }
.p2 { width: 600px; height: 200px; bottom: 20%; right: -5%; transform: rotate(10deg); }
.p3 { width: 1000px; height: 400px; top: 40%; left: 20%; transform: rotate(5deg); }

.moving-planes {
  position: absolute;
  width: 100%;
  height: 100%;
}

.plane {
  position: absolute;
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.5), 0 0 24px rgba(56, 189, 248, 0.3);
}

.pl1 { animation: moveAlongP1 15s linear infinite; }
.pl2 { animation: moveAlongP2 12s linear infinite 2s; }
.pl3 { animation: moveAlongP3 20s linear infinite 5s; }

@keyframes starRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes moveAlongP1 {
  0% { left: -10%; top: 20%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { left: 80%; top: 5%; opacity: 0; }
}

@keyframes moveAlongP2 {
  0% { right: -5%; bottom: 25%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { right: 70%; bottom: 40%; opacity: 0; }
}

@keyframes moveAlongP3 {
  0% { left: 20%; top: 50%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { left: 90%; top: 45%; opacity: 0; }
}

/* 网络头 - 浅色系 */
.cyber-header {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(56, 189, 248, 0.3);
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.08);
  z-index: 10;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 15px;
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.pulse-icon {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 10px #38bdf8, 0 0 20px rgba(56, 189, 248, 0.5);
  animation: pulse 2s infinite;
}

.logo-area h1 {
  font-size: 1.9rem;
  letter-spacing: 3px;
  font-weight: 700;
  background: linear-gradient(90deg, #1e3a5f 0%, #38bdf8 50%, #0ea5e9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: none;
}

.title-block p {
  color: #475569;
  font-size: 0.82rem;
  letter-spacing: 1.8px;
  text-transform: uppercase;
}

/* 系统时间 - 浅色系 */
.system-time {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #334155;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
}

.system-date {
  color: #475569;
  font-size: 0.9rem;
}

.time-divider {
  width: 1px;
  height: 18px;
  background: rgba(56, 189, 248, 0.35);
}

.system-clock {
  color: #0ea5e9;
  font-size: 1.25rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  text-shadow: none;
  letter-spacing: 1px;
}

/* Header right section */
.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* History trip button */
.history-trip-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.4);
  border-radius: 20px;
  color: #10b981;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  animation: pulseBorder 3s ease-in-out infinite;
}

.history-trip-btn:hover {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.6);
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
}

.history-icon {
  font-size: 1.1rem;
}

@keyframes pulseBorder {
  0%, 100% { box-shadow: 0 0 5px rgba(16, 185, 129, 0.1); }
  50% { box-shadow: 0 0 12px rgba(16, 185, 129, 0.3); }
}

/* User area styles - 浅色系 */
.user-area {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 20px;
}

.username {
  color: #0ea5e9;
  font-size: 0.9rem;
  font-weight: 600;
}

.logout-btn {
  background: rgba(231, 76, 60, 0.12);
  border: 1px solid rgba(231, 76, 60, 0.4);
  color: #e74c3c;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: rgba(231, 76, 60, 0.2);
  border-color: rgba(231, 76, 60, 0.6);
}

.auth-link {
  color: #38bdf8;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.3s ease;
}

.auth-link:hover {
  color: #0ea5e9;
}

.auth-sep {
  color: rgba(0, 0, 0, 0.3);
  margin: 0 5px;
}

/* Recent searches styles - 浅色系 */
.recent-searches {
  background: rgba(241, 245, 249, 0.8);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 10px;
  padding: 12px;
  margin-top: 10px;
}

.recent-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: #475569;
  font-size: 0.85rem;
}

.recent-icon {
  font-size: 1rem;
}

.clear-btn {
  margin-left: auto;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.2);
  color: #64748b;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #334155;
  border-color: rgba(0, 0, 0, 0.3);
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
}

.recent-list::-webkit-scrollbar {
  width: 4px;
}

.recent-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.recent-list::-webkit-scrollbar-thumb {
  background: rgba(56, 189, 248, 0.4);
  border-radius: 4px;
}

.recent-item {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 6px;
}

.recent-item:hover {
  background: rgba(56, 189, 248, 0.08);
  border-color: rgba(56, 189, 248, 0.3);
}

.recent-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.recent-tag {
  font-size: 0.9rem;
}

.flight-tag {
  color: #38bdf8;
}

.route-tag {
  color: #fdd000;
}

.airport-tag {
  color: #10b981;
}

.recent-text {
  color: #334155;
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-date {
  color: #0ea5e9;
  font-size: 0.75rem;
  white-space: nowrap;
  font-family: 'Courier New', monospace;
}

.recent-time {
  color: #94a3b8;
  font-size: 0.75rem;
  white-space: nowrap;
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 40px;
  z-index: 5;
}

/* 搜索卡片 - 使用“很厉害首页”背景 */
.search-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 16px;
  padding: 32px 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(56, 189, 248, 0.08);
  width: 100%;
  max-width: 800px;
}

/* 标签切换器 - 浅色系 */
.tab-switcher {
  display: flex;
  margin-bottom: 24px;
  border-bottom: 2px solid rgba(56, 189, 248, 0.15);
}

.tab-switcher button {
  flex: 1;
  padding: 12px;
  background: none;
  border: none;
  color: #64748b;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.tab-switcher button:hover {
  color: #38bdf8;
}

.tab-switcher button.active {
  color: #0ea5e9;
  font-weight: 600;
}

.tab-switcher button.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 3px;
  background: #0ea5e9;
  box-shadow: 0 0 8px rgba(14, 165, 233, 0.4);
}

/* 搜索输入区 */
.search-inputs {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
  width: 100%;
}

.search-inputs > *:not(.airport-search-container) {
  width: 100%;
}

.search-inputs .airport-search-container {
  width: 100%;
  display: flex;
  flex-direction: row;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 0.8rem;
  color: #0ea5e9;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.form-input {
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #1e293b;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
}

/* 错误提示消息样式 */
.error-message {
  width: 100%;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #b91c1c;
  font-size: 0.9rem;
  text-align: center;
  margin-top: 4px;
  box-sizing: border-box;
}

/* 日期选择器样式 */
.date-input {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-input input[type="date"] {
  width: 100%;
  box-sizing: border-box;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #1e293b;
  font-size: 1rem;
}

.date-input input[type="date"]:focus {
  outline: none;
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
}

/* 日期选择器下拉箭头样式 */
.date-input input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(0.5) sepia(1) saturate(5) hue-rotate(180deg);
  cursor: pointer;
}

.date-input input[type="date"]::-moz-calendar-picker-indicator {
  filter: invert(0.5) sepia(1) saturate(5) hue-rotate(180deg);
  cursor: pointer;
}

.route-inputs {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 44px 1fr;
  align-items: start;
  gap: 15px;
}

.route-inputs .input-group {
  flex: 1;
}

/* 机场搜索布局 */
.airport-search-container {
  width: 100%;
  display: flex;
  flex-direction: row;
  gap: 15px;
  align-items: stretch;
}

.airport-search-container .input-group {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 0;
}

.airport-search-container .input-group:first-child {
  flex: 2;
}

.airport-search-container .search-input-container {
  width: 100%;
  min-width: 0;
}

.airport-search-container .form-input {
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.airport-search-container .date-input {
  width: 100%;
  min-width: 0;
}

.airport-search-container .date-input input[type="date"] {
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.airport-results {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(16px);
  max-height: 320px;
  overflow: auto;
  z-index: 2000;
}

.search-input-container {
  position: relative;
  width: 100%;
}

.search-results {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(16px);
  max-height: 320px;
  overflow: auto;
  z-index: 2000;
}

.search-results::before {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  top: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.4), transparent);
}

.search-result-item {
  padding: 12px 14px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: rgba(56, 189, 248, 0.08);
}

.airport-code {
  color: #0ea5e9;
  font-weight: 800;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 1px;
  font-family: 'Courier New', monospace;
}

.country-flag {
  width: 26px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.country-flag-img {
  width: 26px;
  height: 18px;
  object-fit: cover;
  border-radius: 3px;
  border: 1px solid rgba(56, 189, 248, 0.22);
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.12);
}

.country-flag-text {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: #475569;
  font-family: 'Courier New', monospace;
}

.airport-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.airport-city {
  color: #1e293b;
  font-size: 0.95rem;
  line-height: 1.2;
}

.airport-name {
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.25;
}

.search-results::-webkit-scrollbar {
  width: 6px;
}

.search-results::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
}

.search-results::-webkit-scrollbar-thumb {
  background: rgba(56, 189, 248, 0.4);
  border-radius: 6px;
}

.search-results::-webkit-scrollbar-thumb:hover {
  background: rgba(56, 189, 248, 0.6);
}

.route-inputs .form-input {
  width: 100%;
  box-sizing: border-box;
}

.swap-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: #fdd000;
  cursor: pointer;
  margin-top: 0;
  border-radius: 10px;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.swap-icon:hover {
  transform: rotate(180deg);
  border-color: rgba(253, 208, 0, 0.6);
  box-shadow: 0 0 14px rgba(253, 208, 0, 0.25);

}

/* 主搜索按钮 - 恢复原始样式 */
.main-search-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(56, 189, 248, 0.3);
  animation: pulse 2s infinite;
}

.main-search-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(56, 189, 248, 0.5);
}

/* 紧凑型功能区 (整合样式) */
.compact-features {
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 12px 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;

}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.f-icon { font-size: 1.1rem; }
.f-text { color: #475569; font-size: 0.9rem; font-weight: 500; }
.f-sep { width: 8px; height: 8px; background: #38bdf8; border-radius: 50%; opacity: 0.6; }

/* 页脚 - 浅色系 */
.home-footer {
  position: relative;
  padding: 12px 40px 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  z-index: 10;
}

.footer-main-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.school-logo {
  width: 250px;
  height: 40px;
  object-fit: contain;
  filter: brightness(1) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.school-name {
  color: #1e293b;
  font-size: 1.1rem;
  font-weight: 600;
}

.copyright {
  color: #64748b;
  font-size: 0.9rem;
}

/* 搜索结果样式 - 浅色系 */
.flight-results-list h3 {
  color: #0ea5e9;
  font-size: 1.2rem;
  margin-bottom: 15px;
}

.result-item {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.result-item:hover {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.05);
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.12);
}

.res-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
}

.res-airline-logo {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.res-logo-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  border-radius: 4px;
}

.logo-fallback {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #64748B, #94a3b8);
  border-radius: 4px;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Courier New', monospace;
}

.res-no { 
  color: #0ea5e9; 
  font-weight: 700; 
  font-size: 1.3rem; 
  letter-spacing: 1px;
  margin-right: 12px;
}

.res-airline { 
  color: #475569; 
  font-size: 0.95rem; 
  font-weight: 600;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
}

.stopover-tag {
  display: inline-block;
  padding: 2px 8px;
  background: linear-gradient(135deg, #f97316, #fb923c);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 4px;
  margin-left: 10px;
}

.res-time {
  display: flex;
  align-items: center;
  gap: 8px;
}

.res-time span {
  color: #0ea5e9;
  font-size: 1.1rem;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
}

.res-arrow {
  color: #94a3b8;
  font-size: 1.3rem;
  font-weight: 900;
}

.res-status {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.res-status.到达 {
  background: rgba(56, 189, 248, 0.15);
  color: #0284c7;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.res-status.起飞 {
  background: rgba(16, 185, 129, 0.15);
  color: #047857;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.res-status.计划 {
  background: rgba(245, 158, 11, 0.15);
  color: #b45309;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.res-status.延误 {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.res-status.取消 {
  background: rgba(107, 114, 128, 0.15);
  color: #374151;
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.res-status.提前取消 {
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.25);
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.15);
}

/* 搜索结果列表容器 */
.flight-results-list {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 10px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  animation: slideDown 0.3s ease-out;
}

/* 动画定义 */
@keyframes pulse {
  0% { box-shadow: 0 0 8px rgba(56, 189, 248, 0.2); }
  50% { box-shadow: 0 0 16px rgba(56, 189, 248, 0.4); }
  100% { box-shadow: 0 0 8px rgba(56, 189, 248, 0.2); }
}
/* 下拉框动画 */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (max-width: 768px) {
  .logo-area h1 { font-size: 1.5rem; }
  .system-time { display: none; }
  .route-inputs { grid-template-columns: 1fr; }
  .swap-icon { transform: rotate(90deg); margin: 0 auto; }
  .swap-icon:hover { transform: rotate(90deg); }
  .compact-features { flex-wrap: wrap; justify-content: center; }
}

/* 航段选择弹窗样式 */
.segment-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(240, 244, 248, 0.95) 0%, rgba(232, 238, 245, 0.95) 50%, rgba(220, 230, 240, 0.95) 100%);
  backdrop-filter: blur(30px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.5s ease-out;
}

.segment-picker-dialog {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(30px);
  border-radius: 24px;
  padding: 30px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  position: relative;
  overflow: hidden;
  animation: slideIn 0.5s ease-out;
}

.segment-picker-dialog::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.4), transparent);
}

.segment-picker-dialog h3 {
  text-align: center;
  color: #1e3a5f;
  margin: 0 0 30px;
  font-size: 20px;
  font-weight: 600;
  position: relative;
  letter-spacing: 1px;
}

.segment-picker-dialog h3::after {
  content: '';
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.4), transparent);
}

.segment-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 25px;
}

.segment-option {
  background: rgba(56, 189, 248, 0.05);
  border-radius: 16px;
  padding: 40px 25px 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid rgba(56, 189, 248, 0.12);
}

.segment-option:hover {
  background: rgba(56, 189, 248, 0.12) !important;
  border-color: rgba(56, 189, 248, 0.35) !important;
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(56, 189, 248, 0.15);
}

.segment-option:active {
  transform: scale(0.98);
  transition: transform 0.1s ease;
}

.segment-option.full-flight { 
  padding-bottom: 10px !important;
  background: rgba(56, 189, 248, 0.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.segment-badge {
  position: absolute;
  top: 10px;
  left: 20px;
  background: rgba(100, 122, 129, 0.123);
  color: #fdd000;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
  border: 0.5px solid #fdd000;
  z-index: 2;
}

.segment-badge.secondary {
  background: #5e7a862a !important;
  color: #38bdf8;
  border: 0.5px solid #38bdf8;
}

.route-container {
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.airport-group {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.iata {
  font-size: 24px;
  font-weight: bold;
  color: #fdd000;
  font-family: 'Monospace', 'Courier New', Courier;
  letter-spacing: 2px;
  margin-bottom: 0px;
}

.airport-group .city {
  font-size: 19px;
  font-weight: bold;
  font-family: '宋体';
  color: #1e3a5f;
  letter-spacing: 6px;
  opacity: 0.9;
}

.path-line {
  width: 100%;
  position: absolute;
  bottom: 15px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(253, 208, 0, 0.8) 50%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.plane-icon {
  font-size: 1.5rem;
  color: #fdd000;
  background: transparent !important;
  box-shadow: none !important;
  text-shadow: 0 0 15px rgba(253, 208, 0, 0.8), 0 0 30px rgba(253, 208, 0, 0.4);
  z-index: 2;
  animation: bounce 2s ease-in-out infinite, pulse 2s ease-in-out infinite;
}

.airport-group.departure {
  align-items: flex-start;
}

.airport-group.arrival {
  align-items: flex-end;
}

.stopover-info {
  position: absolute;
  top: -42px;
  bottom: 20px;
  left: 51%;
  transform: translateX(-53%);
  font-size: 12px;
  color: #38bdf8;
  background: rgba(255, 255, 255, 0) !important;
  backdrop-filter: blur(4px);
  border: 0.5px solid rgba(56, 189, 248, 0.3);
  padding: 2px 8px;
  border-radius: 10px;
  z-index: 5;
}

.global-note {
  width: 100%;
  text-align: center;
  margin-top: 15px;
  color: #38bdf8;
  font-size: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(56, 189, 248, 0.2);
}

.cancel-button {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1px solid rgba(68, 171, 240, 0.479);
  border-radius: 12px;
  color: rgba(0, 96, 175, 0.637);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.cancel-button:hover {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

</style>
