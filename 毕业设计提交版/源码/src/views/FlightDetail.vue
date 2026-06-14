<template>
  <div class="page-wrapper">
    
    <header class="global-header">
      <div class="header-content">
        <div>
          <h1>全球机场航班动态可视化系统</h1>
          <p>Flight Data Real-time Monitoring System</p>
        </div>
        <div class="header-actions">
          <div class="header-time">
            <span class="header-date">{{ currentDate }}</span>
            <span class="header-divider"></span>
            <span class="header-clock">{{ currentTime }}</span>
          </div>
          <div class="mode-switcher-small">
            <button 
              class="mode-button" 
              :class="{ active: userMode === 'departing' }"
              @click="userMode = 'departing'"
            >
              我是旅客
            </button>
            <button 
              class="mode-button" 
              :class="{ active: userMode === 'arriving' }"
              @click="userMode = 'arriving'"
            >
              我是接机
            </button>
          </div>
          <router-link to="/" class="back-button">
            ← 返回首页
          </router-link>
        </div>
      </div>
    </header>

    <div :class="['detail-container', { 'collapsed': isCollapsed }]">
      <div id="cesiumContainer" class="map-area"></div>

      <!-- 收缩/展开按钮 - 在信息框外面，覆盖在Cesium图层上 -->
      <div class="hover-trigger-area" :class="{ 'panel-collapsed': isCollapsed }">
        <button class="collapse-btn" @click="togglePanel" :title="isCollapsed ? '展开信息面板' : '收起信息面板'">
          <span class="arrow">{{ isCollapsed ? '◀' : '▶' }}</span>
        </button>
      </div>

      <aside class="right-info-panel">
        <div class="panel-content">
          <div class="flight-info" v-if="flightNumber">
            <!-- 加载状态 -->
            <div v-if="isLoading" class="loading-state">
              <div class="loading-spinner"></div>
              <p>正在获取航班数据...</p>
            </div>
            
            <!-- 错误状态 -->
            <div v-else-if="error" class="error-state">
              <div class="error-icon">⚠️</div>
              <p>{{ error }}</p>
              <button @click="updateDashboard" class="retry-button">重试</button>
            </div>
            
            <!-- 航班信息 -->
            <div v-else-if="Object.keys(currentFlight).length > 0">
              <!-- 航段切换器 -->
              <div class="segment-switcher" v-if="currentFlight.stopFlag === '1'">
                <div class="segment-label">当前航段：</div>
                <div class="segment-buttons">
                  <button 
                    class="segment-button" 
                    :class="{ active: currentSegment === 1 }"
                    @click="currentSegment = 1"
                  >
                    {{ segment1Data.FlightDep }} ➔ {{ segment1Data.FlightArr }}
                  </button>
                  <button 
                    class="segment-button" 
                    :class="{ active: currentSegment === 2 }"
                    @click="currentSegment = 2"
                  >
                    {{ segment2Data.FlightDep }} ➔ {{ segment2Data.FlightArr }}
                  </button>
                  <button 
                    class="segment-button" 
                    :class="{ active: currentSegment === 3 }"
                    @click="currentSegment = 3"
                  >
                    {{ fullFlightData.FlightDep }} ➔ {{ fullFlightData.FlightArr }}

                  </button>
                </div>
              </div> 
              
              <div class="info-header">
                <h3>
                  <span class="label-text">航班信息</span>
                  <div class="airline-brand">
                    <div class="airline-logo-small">
                      <img 
                        :src="getAirlineLogoSrc(null, currentFlight.airline, flightNumber)" 
                        :alt="currentFlight.airline || '航司'"
                        @error="handleAirlineLogoError"
                      />
                    </div>
                    <span class="company-name">{{ currentFlight.airline || '-' }}</span>
                  </div>
                  <div class="flight-main-line">
                    <div class="flight-no-container">
                      <span class="flight-no">{{ flightNumber }}</span>
                    </div>
                    <div class="flight-status-group">
                      <span class="ontime-rate" v-if="currentFlight.ontimeRate || flightHappiness?.ontimeRate">
                        <span class="rate-dot"></span>
                        <span class="rate-label">准点率</span>
                        <span class="rate-value">{{ currentFlight.ontimeRate || flightHappiness?.ontimeRate || '-' }}</span>
                      </span>
                      <span class="status-tag" :style="statusStyle()">
                        {{ currentFlight.status || '准点' }}
                      </span>
                    </div>
                  </div>
                  <!-- 幸福度勋章 -->
                  <div v-if="flightHappiness" class="happiness-badge">
                    <div class="badge-content">
                      <span v-if="flightHappiness.delayLabel" class="delay-info">{{ flightHappiness.delayLabel }}</span>
                    </div>
                  </div>
                </h3>
              </div>
              
              <hr class="divider" />

              <div class="flight-details">
                <!-- 接机/送机管家悬浮条 -->
                <div class="管家悬浮条" v-if="(userMode === 'departing' && !isFlightDeparted() && currentFlight.lastCheckinTime) || (userMode === 'arriving' && (currentFlight.fastestExitDuration && currentFlight.slowestExitDuration)) || (currentFlight.status && (currentFlight.status.includes('起飞') || currentFlight.status.includes('飞行')))">
                  <div v-if="userMode === 'departing' && !isFlightDeparted()" class="departure-reminder">
                    <span class="reminder-icon">⚠️</span>
                    <span class="reminder-text">请于 {{ currentFlight.lastCheckinTime }} 前办妥值机手续</span>
                  </div>
                  <div v-else-if="userMode === 'arriving'" class="arrival-reminder">
                    <span class="reminder-icon">🛬</span>
                    <span class="reminder-text">预计旅客于 {{ calculateExitTime(currentFlight.act_arr_time || currentFlight.est_arr_time || currentFlight.schArrTime, currentFlight.fastestExitDuration) }} - {{ calculateExitTime(currentFlight.act_arr_time || currentFlight.est_arr_time || currentFlight.schArrTime, currentFlight.slowestExitDuration) }} 走出出口</span>
                  </div>
                  <div v-else-if="currentFlight.status && (currentFlight.status.includes('起飞') || currentFlight.status.includes('飞行'))" class="flight-reminder">
                    <span class="reminder-icon">✈️</span>
                    <span class="reminder-text">
                      <template v-if="calculateRemaining(currentFlight).isLandingSoon">
                        飞行中：即将着陆
                      </template>
                      <template v-else>
                        飞行中：预计还需 {{ formatDuration(calculateRemaining(currentFlight).remainingMinutes) }}，剩余距离约 {{ calculateRemaining(currentFlight).remainingDistance }} km
                      </template>
                    </span>
                  </div>
                </div>
                
                <div class="route-info" :class="{ 'has-stopover': currentFlight.stopFlag === '1' }">
                  <!-- 出发地 -->
                  <div class="city-box">
                    <div class="city-info">
                      <span class="airport-code">{{ currentFlight.FlightDepcode || currentFlight.depAirport || '-' }}</span>
                      <span class="airport-name">{{ currentFlight.depAirportFull || '-' }}</span>
                      <span class="terminal" v-if="currentFlight.depTerminal">{{ currentFlight.depTerminal }}</span>
                      <span class="terminal" v-else-if="currentFlight.DepTerminal">{{ currentFlight.DepTerminal }}</span>
                      <span class="terminal" v-else>-</span>
                      <span class="weather-text">{{ currentFlight.depWeather || '-' }}</span>
                    </div>
                  </div>
                  
                  <!-- 飞机图标 - 非经停模式或经停点不存在 -->
                  <div class="route-arrow" :style="{ color: statusStyle().color }" v-if="!currentFlight.stopFlag || currentFlight.stopFlag !== '1' || (!currentFlight.stopCity || !currentFlight.stopAirportCode)">✈️</div>
                  
                  <!-- 经停模式的飞机图标和经停点 -->
                  <template v-else-if="currentFlight.stopFlag === '1' && currentFlight.stopCity && currentFlight.stopAirportCode">
                    <!-- 出发到经停的飞机图标 -->
                    <div class="route-arrow small-arrow" :style="{ color: statusStyle().color }">✈️</div>
                    
                    <!-- 经停点 -->
                    <div class="city-box">
                      <div class="city-info">
                        <span class="airport-code">{{ currentFlight.stopAirportCode}}</span>
                        <span class="airport-name">{{ currentFlight.stopCity}}</span>
                        <span class="terminal stopover-terminal">经停</span>
                        <span class="weather-text">{{ parseWeather(segment2Data?.DepWeather)|| '-' }}</span>
                      </div>
                    </div>
                    
                    <!-- 经停到目的地的飞机图标 -->
                    <div class="route-arrow small-arrow" :style="{ color: statusStyle().color }">✈️</div>
                  </template>
                  
                  <!-- 目的地 -->
                  <div class="city-box">
                    <div class="city-info">
                      <span class="airport-code">{{ currentFlight.FlightArrcode || currentFlight.arrAirport || '-' }}</span>
                      <span class="airport-name">{{ currentFlight.arrAirportFull || (currentFlight.arrAirportFull || '-') }}</span>
                      <span class="terminal" v-if="currentFlight.arrTerminal">{{ currentFlight.arrTerminal }}</span>
                      <span class="terminal" v-else-if="currentFlight.ArrTerminal">{{ currentFlight.ArrTerminal }}</span>
                      <span class="terminal" v-else>-</span>
                      <span class="weather-text">{{ currentFlight.arrWeather || '🌧️ 12°C' }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- 次要指引信息 -->
                <div class="secondary-guide" v-if="userMode === 'departing' && (currentFlight.checkDoor || currentFlight.boardGate || currentFlight.baggageId || currentFlight.stopFlag === '1') || (userMode === 'arriving' && currentFlight.baggageId)">
                  <span class="guide-text" v-if="currentFlight.stopFlag === '1' && currentSegment === 1">
                    🛬 过境提示：<br>
                    本次航班将经停 {{ currentFlight.stopCity }}，
                    预计停留 {{ calculateStayTime(segment2Data?.VeryZhunReadyDeptimeDate, segment1Data?.VeryZhunReadyArrtimeDate) }}
                  </span>
                  <span class="guide-text" v-else-if="currentFlight.stopFlag === '1' && currentSegment === 2">
                    🛬 过境提示：您正在查看第二程航班<br>
                    从 {{ currentFlight.depAirportFull || '-' }} 前往 {{ (currentFlight.arrAirportFull || '-') }}
                  </span>
                  <span class="guide-text" v-else-if="userMode === 'departing' && !isFlightDeparted() && (currentFlight.checkDoor || currentFlight.boardGate)">
                    建议从 {{ currentFlight.checkDoor }} 进站 | {{ currentFlight.boardGate }} 登机口
                  </span>
                  <span class="guide-text" v-else-if="userMode === 'departing' && isFlightDeparted() && currentFlight.baggageId">
                    🧳 到达行李转盘：{{ currentFlight.baggageId || '待定' }}
                  </span>
                  <span class="guide-text" v-else-if="userMode === 'arriving' && currentFlight.baggageId">
                    行李转盘：{{ currentFlight.baggageId }}
                  </span>
                </div>
                
                <div class="more-info">
                  <div class="more-info-grid">
                    <div class="info-item">
                      <span class="item-label">
                        {{ (currentFlight.status?.includes('到达') || currentFlight.status?.includes('落地') || currentFlight.act_dep_time) ? '实际起飞' : '预计起飞' }}
                      </span>
                      <span class="item-value">
                        {{ currentFlight.act_dep_time ? formatTime(currentFlight.act_dep_time) : ((currentFlight.VeryZhunReadyDeptimeDate ? formatTime(currentFlight.VeryZhunReadyDeptimeDate) : null) || currentFlight.schDepTime || '-') }}
                      </span>
                    </div>
                    <div class="info-item">
                      <span class="item-label">
                        {{ currentFlight.status?.includes('到达') || currentFlight.status?.includes('落地') ? '实际到达' : '预计到达' }}
                      </span>
                      <span class="item-value">
                        <template v-if="currentFlight.stopFlag === '1' && currentSegment === 1">
                          {{ segment1Data?.act_arr_time ? formatTime(segment1Data.act_arr_time) : ((segment1Data?.VeryZhunReadyArrtimeDate ? formatTime(segment1Data.VeryZhunReadyArrtimeDate) : null) || segment1Data?.est_arr_time || segment1Data?.schArrTime || '-') }}
                        </template>
                        <template v-else>
                          {{ currentFlight.act_arr_time ? formatTime(currentFlight.act_arr_time) : ((currentFlight.VeryZhunReadyArrtimeDate ? formatTime(currentFlight.VeryZhunReadyArrtimeDate) : null) || currentFlight.est_arr_time || currentFlight.schArrTime || '12:30') }}
                        </template>
                      </span>
                    </div>
                  </div>
                  
                  <!-- 飞行动态监控 -->
                  <div class="flight-monitor-grid">
                    <div class="info-item">
                      <span class="item-label">当前高度</span>
                      <span class="item-value">{{ currentFlight.realTime ? (currentFlight.realTime.altitude + ' m') : '9800 m' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="item-label">飞行距离</span>
                      <span class="item-value">
                        <template v-if="currentFlight.stopFlag === '1' && currentSegment === 1 && segment1Data">
                          {{ segment1Data.distance ? (segment1Data.distance + ' km') : '-' }}
                        </template>
                        <template v-else-if="currentFlight.stopFlag === '1' && currentSegment === 2 && segment2Data">
                          {{ segment2Data.distance ? (segment2Data.distance + ' km') : '-' }}
                        </template>
                        <template v-else>
                          {{ currentFlight.distance ? (currentFlight.distance + ' km') : '-' }}
                        </template>
                      </span>
                    </div>
                    <div class="info-item">
                      <span class="item-label">预计时长</span>
                      <span class="item-value">
                        <template v-if="currentFlight.stopFlag === '1' && currentSegment === 1">
                          {{ calculateSegmentDuration(currentFlight) }}
                        </template>
                        <template v-else-if="currentFlight.stopFlag === '1' && currentSegment === 2">
                          {{ calculateSegmentDuration(currentFlight) }}
                        </template>
                        <template v-else>
                          {{ calculateSegmentDuration(currentFlight) }}
                        </template>
                      </span>
                    </div>
                  </div>
                  

                </div>

                <!-- 服务信息网格 -->
                <div class="service-info">
                  <h4 class="section-title">服务信息</h4>
                  <div class="service-grid">
                    <div class="info-item">
                      <span class="item-label">值机柜台</span>
                      <span class="item-value">{{ currentFlight.checkinTable || '-' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="item-label">座位号</span>
                      <span class="item-value seat-number" @click="editSeatNumber">
                        {{ currentFlight.seatNumber || '-' }}
                        <span class="edit-icon">✏️</span>
                      </span>
                    </div>
                    <div class="info-item">
                      <span class="item-label">登机方式</span>
                      <span class="item-value">{{ getBoardingMethod(currentFlight.bridge) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="item-label">下机方式</span>
                      <span class="item-value">{{ getBoardingMethod(currentFlight.arrBridge) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="item-label">餐食服务</span>
                      <span class="item-value">
                    {{ 
                       currentFlight.food === 'M' ? '提供正餐' : 
                       currentFlight.food === 'R' ? '提供点心/轻食' : 
                       currentFlight.food === 'U' ? '提供饮料' : 
                      (currentFlight.food === '有餐食' ? '有餐食' : (currentFlight.food || '无餐食'))
                    }}
                        </span>
                    </div>
                    <div class="info-item">
                      <span class="item-label">停机位</span>
                      <span class="item-value">{{ currentFlight.arrStandGate || currentFlight.depStandGate || '-' }}</span>
                    </div>
                    <div class="info-item" style="grid-column: span 2;">
                      <span class="item-label">联系航司</span>
                      <a :href="'tel:' + currentFlight.airlinetel" class="contact-button small">
                        📞 {{ currentFlight.airlinetel || '-' }}
                      </a>
                    </div>
                  </div>
                </div>

                <!-- 飞机档案 -->
                <div class="aircraft-info">
                  <h4 class="section-title" @click="showAircraftDescription">飞机档案</h4>
                  <div class="aircraft-details">
                    <div class="info-item">
                      <span class="item-label">机型名称</span>
                      <span class="item-value">{{ currentFlight.aircraftType || '-' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="item-label">飞机编号</span>
                      <span class="item-value">{{ currentFlight.aircraftNumber || '-' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="item-label">机龄</span>
                      <span class="item-value">{{ currentFlight.flightYear || '-' }}年</span>
                    </div>
                  </div>
                </div>
                
                <!-- 旅客须知 -->
                <div class="passenger-info" v-if="flightHappiness">
                  <h4 class="section-title">旅客须知</h4>
                  <div class="info-tags">
                    <div class="info-tag" @click="toggleLuggageDetail" style="cursor: pointer;">
                      <span class="tag-icon">🧳</span>
                      <span class="tag-label">行李额</span>
                      <span class="tag-value">{{ flightHappiness.luggage || '请查看详情' }}</span>
                    </div>
                    <div class="info-tag">
                      <span class="tag-icon">🍽️</span>
                      <span class="tag-label">餐食</span>
                      <span class="tag-value">{{ flightHappiness.food || '-' }}</span>
                    </div>
                    <div class="info-tag">
                      <span class="tag-icon">📶</span>
                      <span class="tag-label">WiFi</span>
                      <span class="tag-value">{{ flightHappiness.wifi || '-' }}</span>
                    </div>
                    <div class="info-tag">
                      <span class="tag-icon">🎬</span>
                      <span class="tag-label">娱乐设施</span>
                      <span class="tag-value">{{ flightHappiness.media || '-' }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- 航班幸福度信息 -->
                <div class="happiness-info" v-if="flightHappiness" style="position: relative;">
                  <h4 class="section-title" @click="toggleHappinessDetail">航班幸福度</h4>
                  <div class="happiness-details">
                    <div class="info-item">
                      <span class="item-label">舒适度评分</span>
                      <span class="item-value happiness-score">{{ flightHappiness.comfort || '-' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="item-label">空中服务</span>
                      <span class="item-value">{{ flightHappiness.airService || '-' }}</span>
                    </div>
                  </div>
                  

                </div>
                
                <!-- 测试数据模式提示 -->
                <div class="mock-mode-indicator" v-if="useMock">
                  🧪 测试数据模式
                </div>
              </div>
            </div>
            
            <!-- 无数据状态 -->
            <div v-else class="no-data-state">
              <div class="no-data-icon">✈️</div>
              <p>请输入有效的航班号</p>
            </div>
          </div>
          

        </div>
      </aside>
    </div>
    
    <!-- 航班幸福度详情悬浮页 -->
    <div v-if="showHappinessDetail" class="happiness-popover">
      <div class="popover-content draggable-modal" :style="{ left: happinessModalPosition.x, top: happinessModalPosition.y }">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid rgba(56, 189, 248, 0.3); padding-bottom: 10px; cursor: move;" @mousedown="startDrag('happiness', $event)">
          <h4 style="margin: 0; color: #0ea5e9; font-size: 1.1rem; font-weight: 600; text-shadow: 0 0 8px rgba(14, 165, 233, 0.4);">舒适度对比</h4>
          <button class="close-btn" @click="toggleHappinessDetail" style="background: none; border: none; color: #64748b; font-size: 1.5rem; cursor: pointer; transition: all 0.3s ease; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">×</button>
        </div>
        <div ref="comfortChartRef" class="chart-dom"></div>
      </div>
    </div>
    
    <!-- 飞机描述弹窗 -->
    <div v-if="showAircraftDesc" class="aircraft-desc-modal">
      <div class="modal-content draggable-modal" :style="{ left: modalPosition.x, top: modalPosition.y }">
        <div class="modal-header" @mousedown="startDrag('aircraft', $event)">
          <h3>飞机描述</h3>
          <button class="close-btn" @click="showAircraftDesc = false">×</button>
        </div>
        <div class="modal-body">
          <p>{{ currentFlight.aircraftDescribe || '暂无飞机描述信息' }}</p>
        </div>
        <div class="modal-footer">
          <button class="close-button" @click="showAircraftDesc = false">关闭</button>
        </div>
      </div>
    </div>
    
    <!-- 行李额详情弹窗 -->
    <div v-if="showLuggageDetail" class="luggage-modal-overlay">
      <div class="luggage-modal-content draggable-modal" :style="{ left: luggageModalPosition.x, top: luggageModalPosition.y }" @click.stop>
        <div class="luggage-modal-header" @mousedown="startDrag('luggage', $event)">
          <div class="header-accent"></div>
          <h3>行李额详情</h3>
          <button class="close-btn-modern" @click="toggleLuggageDetail">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="luggage-modal-body">
          <div class="luggage-chart-wrapper">
            <div ref="luggageChartRef" class="chart-dom"></div>
          </div>
          <div class="luggage-note">
            <p>注：以上为国内航线标准，国际航线请咨询航司。</p>
          </div>
        </div>
        <div class="luggage-modal-footer">
          <button class="close-btn-ghost" @click="toggleLuggageDetail">关闭</button>
        </div>
      </div>
    </div>
    
    <!-- 机场信息弹窗 -->
    <div v-if="showAirportInfo && selectedAirport" class="airport-info-overlay">
      <div class="airport-info-modal draggable-modal" :style="{ left: airportModalPosition.x, top: airportModalPosition.y }" @click.stop>
        <div class="airport-info-header" @mousedown="startDrag('airport', $event)">
          <div class="header-accent"></div>
          <h3>机场信息</h3>
          <button class="close-btn-modern" @click="closeAirportInfo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="airport-info-body">
          <div class="airport-main-info">
            <div class="airport-code">{{ selectedAirport.code }}</div>
            <div class="airport-name">{{ selectedAirport.name }}</div>
            <div class="airport-city">{{ selectedAirport.city }}</div>
          </div>
          <div class="airport-type-badge" :class="selectedAirport.type">
            {{ selectedAirport.type === 'departure' ? '✈️ 出发机场' : (selectedAirport.type === 'stopover' ? '🛬 经停机场' : ' 到达机场') }}
          </div>
          <div class="airport-weather" v-if="selectedAirport.weather">
            <div class="weather-icon">{{ selectedAirport.weather.icon }}</div>
            <div class="weather-info">
              <div class="weather-condition">{{ selectedAirport.weather.condition }}</div>
              <div class="weather-details">
                <span>温度: {{ selectedAirport.weather.temp }}°C</span>
                <span>湿度: {{ selectedAirport.weather.humidity }}%</span>
                <span>风速: {{ selectedAirport.weather.wind }}</span>
              </div>
            </div>
          </div>
          <div class="airport-coordinates">
            <div class="coord-item">
              <span class="coord-label">经度</span>
              <span class="coord-value">{{ selectedAirport.lon?.toFixed(4) || '-' }}</span>
            </div>
            <div class="coord-item">
              <span class="coord-label">纬度</span>
              <span class="coord-value">{{ selectedAirport.lat?.toFixed(4) || '-' }}</span>
            </div>
          </div>
        </div>
        <div class="airport-info-footer">
          <button class="detail-btn" @click="goToAirportDetail">详细信息</button>
        </div>
      </div>
    </div>
    
    <!-- 视角切换按钮 -->
    <button 
      class="view-toggle-btn" 
      @click="toggleView"
      :title="viewTooltip"
    >
      <span class="view-icon">{{ currentViewIcon }}</span>
      <span class="view-label">{{ currentViewLabel }}</span>
    </button>
    
    <!-- 座位选择弹窗 -->
    <div v-if="showSeatSelector" class="seat-selector-overlay">
      <div class="seat-selector-content draggable-modal" :style="{ left: seatModalPosition.x, top: seatModalPosition.y }" @click.stop>
        <div class="seat-selector-header" @mousedown="startDrag('seat', $event)">
          <h3>选择座位</h3>
          <button class="close-btn-modern" @click="closeSeatSelector">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="seat-selector-body">
          <div ref="seatChartRef" class="seat-chart"></div>
          <div class="seat-legend">
            <div class="legend-item">
              <span class="legend-color available"></span>
              <span>可选座位</span>
            </div>
            <div class="legend-item">
              <span class="legend-color taken"></span>
              <span>已被占用</span>
            </div>
            <div class="legend-item">
              <span class="legend-color selected"></span>
              <span>已选择</span>
            </div>
          </div>
        </div>
        <div class="seat-selector-footer">
          <div class="selected-seats-info">
            <span style="color: #64748b; font-size: 0.85rem;">已选择:</span>
            <span v-if="selectedSeats.length > 0" style="color: #0ea5e9; font-weight: bold; margin-left: 8px;">{{ selectedSeats.join(', ') }}</span>
            <span v-else style="color: #94a3b8; margin-left: 8px;">点击座位选择</span>
          </div>
          <div class="seat-actions">
            <button class="confirm-btn" @click="confirmSeatSelection">确认选择</button>
            <button class="close-btn-ghost" @click="closeSeatSelector">关闭</button>
          </div>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script setup> // 业务层,主要负责初始化Cesium,并监听窗口缩放
import { onMounted, ref, onUnmounted, watch, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as Cesium from 'cesium'
import * as echarts from 'echarts'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { searchFlightByNumber, getFlightHappinessIndex } from '../api/flight'
import { getAirlineLogoSrc, getAirlineLogoPngSrc } from '../utils/airlineLogoMap'

// 侧边栏收缩状态
const isCollapsed = ref(false)

// 实时时间
const currentTime = ref('')
const currentDate = ref('')
let timeInterval = null

const updateCurrentTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const weekList = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  currentDate.value = `${year}年${month}月${day}日 ${weekList[now.getDay()]}`
  currentTime.value = `${hours}:${minutes}:${seconds}`
}

// 切换侧边栏状态
const togglePanel = () => {
  isCollapsed.value = !isCollapsed.value
}

// Mock 数据模式
const useMock = false; // 改为 false 时切换回真实 API

// Mock 数据 - HU460 的经停航班数据
const MOCK_FLIGHT_DATA = {
  "AircraftNumber": "B5735",
  "ArrAirportLat": "36.5095",
  "ArrAirportLon": "103.61756",
  "ArrOntimeRate": "100.00%",
  "ArrStandGate": "",
  "ArrTerminalLat": "36.528246",
  "ArrTerminalLon": "103.643409",
  "ArrWeather": "晴天|9999|3级|97|19",
  "AssistFlightState": "起飞",
  "BaggageID": "",
  "BoardGate": "G9",
  "BoardState": "",
  "BusinessCheckinTable": "",
  "CheckDoor": "3号门",
  "CheckinTable": "4",
  "DelayReason": "",
  "DepAirportLat": "1.361173",
  "DepAirportLon": "103.990204",
  "DepStandGate": "",
  "DepTerminalLat": "1.361173",
  "DepTerminalLon": "103.990204",
  "DepWeather": "晴天|9999|3级||32",
  "EstimateBoardingEndTime": "2026-04-06 16:00:00",
  "EstimateBoardingStartTime": "2026-04-06 15:15:00",
  "FastestExitDuration": 34.2,
  "FastestExitTime": "",
  "FirstClassCheckinTable": "",
  "FlightArr": "兰州",
  "FlightArrAirport": "兰州中川",
  "FlightArrcode": "LHW",
  "FlightArrtimeDate": "",
  "FlightArrtimePlanDate": "2026-04-07 01:00:00",
  "FlightArrtimeReadyDate": "",
  "FlightCompany": "海南航空股份有限公司",
  "FlightDep": "新加坡",
  "FlightDepAirport": "新加坡樟宜",
  "FlightDepcode": "SIN",
  "FlightDeptimeDate": "2026-04-06 16:22:00",
  "FlightDeptimePlanDate": "2026-04-06 16:15:00",
  "FlightDeptimeReadyDate": "2026-04-06 16:15:00",
  "FlightDuration": 525,
  "FlightHTerminal": "T4",
  "FlightIngateTime": "",
  "FlightNo": "HU460",
  "FlightOutgateTime": "2026-04-06 16:07:00",
  "FlightState": "起飞",
  "FlightStateNum": 1,
  "FlightTerminal": "T3",
  "FlightYear": 15.8,
  "Food": "M",
  "LastCheckinTime": "2026-04-06 15:15:00",
  "OntimeRate": "86.67%",
  "ReachExit": "",
  "ShareFlag": "0",
  "ShareFlightNo": "",
  "SlowestExitDuration": 54.2,
  "SlowestExitTime": "",
  "StopAirportCode": "HAK",
  "StopCity": "海口",
  "StopFlag": "1",
  "VeryZhunReadyArrtimeDate": "2026-04-07 00:59:00",
  "VeryZhunReadyDeptimeDate": "2026-04-06 16:21:00",
  "airlinetel": "95339",
  "arr_bridge": "",
  "arrtel": "0931-96556",
  "bridge": "",
  "deptel": "+65 65956868",
  "distance": "3907",
  "dst_timezone": "28800",
  "fcategory": "1",
  "fservice": "J",
  "ftype": "B738",
  "generic": "Boeing 737-8AL",
  "org_timezone": "28800"
};

const route = useRoute()
const router = useRouter()
const flightNumber = ref(route.params.flightNumber || route.query.flightNumber || '')
const currentFlight = ref({})
const isLoading = ref(false)
const error = ref('')
const userMode = ref('departing') // 用户身份模式：'departing' (旅客) 或 'arriving' (接机人)
const currentSegment = ref(parseInt(route.query.segment) || 1) // 当前航段：1 表示第一程，2 表示第二程，3 表示全程
const isFirstLoad = ref(true) // 状态锁，用于控制路由参数处理时机

// 监听航段变化，重新更新航班信息
watch(currentSegment, (newSegment) => {
  updateDashboard();
});

// 监听侧边栏收缩状态变化，调整Cesium地图大小
watch(isCollapsed, () => {
  // 延迟一点时间，等 CSS 过渡结束后再触发 resize
  setTimeout(() => {
    if (viewer) {
      viewer.canvas.width = viewer.container.clientWidth;
      viewer.canvas.height = viewer.container.clientHeight;
      viewer.resize();
    }
  }, 500);
});

// 存储完整的航班数据
const fullFlightData = ref(null);
const segment1Data = ref(null);
const segment2Data = ref(null);

// 从路由查询参数获取航段信息
const segmentInfo = ref({
  depAirport: route.query.depAirport,
  arrAirport: route.query.arrAirport,
  depCity: route.query.depCity,
  arrCity: route.query.arrCity
})

// 计算属性：状态样式
const statusStyle = () => {
  const status = currentFlight.value.status || '';
  if (status.includes('到达') || status.includes('落地')) {
    return {
      color: '#ffffff',
      borderColor: 'rgba(56, 189, 248, 0.5)',
      backgroundColor: 'rgba(56, 189, 248, 0.85)',
      boxShadow: '0 0 8px rgba(56, 189, 248, 0.4), inset 0 0 4px rgba(255, 255, 255, 0.1)'
    };
  } else if (status.includes('起飞') || status.includes('飞行')) {
    return {
      color: '#ffffff',
      borderColor: 'rgba(16, 185, 129, 0.5)',
      backgroundColor: 'rgba(16, 185, 129, 0.85)',
      boxShadow: '0 0 8px rgba(16, 185, 129, 0.4), inset 0 0 4px rgba(255, 255, 255, 0.1)'
    };
  } else if (status.includes('延误')) {
    return {
      color: '#ffffff',
      borderColor: 'rgba(239, 68, 68, 0.5)',
      backgroundColor: 'rgba(239, 68, 68, 0.85)',
      boxShadow: '0 0 8px rgba(239, 68, 68, 0.4), inset 0 0 4px rgba(255, 255, 255, 0.1)'
    };
  } else if (status.includes('计划') || status.includes('值机') || status.includes('登机')) {
    return {
      color: '#ffffff',
      borderColor: 'rgba(16, 185, 129, 0.5)',
      backgroundColor: 'rgba(16, 185, 129, 0.85)',
      boxShadow: '0 0 8px rgba(16, 185, 129, 0.4), inset 0 0 4px rgba(255, 255, 255, 0.1)'
    };
  } else if (status.includes('取消')) {
    return {
      color: '#ffffff',
      borderColor: 'rgba(107, 114, 128, 0.5)',
      backgroundColor: 'rgba(107, 114, 128, 0.85)',
      boxShadow: '0 0 8px rgba(107, 114, 128, 0.4), inset 0 0 4px rgba(255, 255, 255, 0.1)'
    };
  } else {
    return {
      color: '#ffffff',
      borderColor: 'rgba(56, 189, 248, 0.5)',
      backgroundColor: 'rgba(56, 189, 248, 0.85)',
      boxShadow: '0 0 8px rgba(56, 189, 248, 0.4), inset 0 0 4px rgba(255, 255, 255, 0.1)'
    };
  }
};

// 航空公司logo加载失败回退
const handleAirlineLogoError = (e) => {
  const img = e.target;
  if (img.src.endsWith('.svg')) {
    img.src = getAirlineLogoPngSrc(null, currentFlight.value.airline, flightNumber.value);
  } else {
    img.src = '/assets/airline-logos/default.svg';
  }
};

// 状态管理
let viewer = null
let planeEntity = null
let animationId = null // 用于存储 requestAnimationFrame 的 ID

// 航班幸福度数据
const flightHappiness = ref(null)

// 舒适度对比图表
const comfortChartRef = ref(null)
let comfortChart = null

// 行李额图表
const luggageChartRef = ref(null)
let luggageChart = null

// 飞机描述弹窗状态
const showAircraftDesc = ref(false)

// 机场信息弹窗状态
const showAirportInfo = ref(false)
const selectedAirport = ref(null)
const airportModalPosition = ref({ x: '50%', y: '50%' })

// 显示飞机描述弹窗
const showAircraftDescription = () => {
  showAircraftDesc.value = true
}

// 航班幸福度详情弹窗状态
const showHappinessDetail = ref(false)

// 切换航班幸福度详情弹窗
const toggleHappinessDetail = () => {
  showHappinessDetail.value = !showHappinessDetail.value
  // 确保图表在弹窗显示后渲染
  if (showHappinessDetail.value) {
    setTimeout(() => {
      initComfortChart()
    }, 100)
  }
}

// 行李额详情弹窗状态
const showLuggageDetail = ref(false)

// 切换行李额详情弹窗
const toggleLuggageDetail = () => {
  showLuggageDetail.value = !showLuggageDetail.value
  // 确保图表在弹窗显示后渲染
  if (showLuggageDetail.value) {
    setTimeout(() => {
      initLuggageChart()
    }, 100)
  }
}

// 显示机场信息弹窗
const showAirportInfoBox = (airportData) => {
  selectedAirport.value = airportData
  showAirportInfo.value = true
}

// 关闭机场信息弹窗
const closeAirportInfo = () => {
  showAirportInfo.value = false
  selectedAirport.value = null
}

// 跳转到机场详情页面
const goToAirportDetail = () => {
  if (selectedAirport.value?.code) {
    router.push({ 
      path: '/airports', 
      query: { airport: selectedAirport.value.code } 
    })
  }
}

// 弹窗拖拽相关变量 - 支持多个弹窗独立拖拽
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const currentDraggingModal = ref('')

// 视角切换相关变量
const currentView = ref('world') // world, asia, departure, arrival

// 视角图标
const currentViewIcon = computed(() => {
  const icons = {
    world: '🌍',
    asia: '🌏',
    departure: '✈️',
    arrival: '📍'
  }
  return icons[currentView.value] || '🌍'
})

// 视角标签
const currentViewLabel = computed(() => {
  const labels = {
    world: '世界',
    asia: '亚洲',
    departure: '起点',
    arrival: '终点'
  }
  return labels[currentView.value] || '世界'
})

// 视角提示
const viewTooltip = computed(() => {
  const tooltips = {
    world: '世界视角 - 点击切换至亚洲视角',
    asia: '亚洲视角 - 点击切换至起点机场',
    departure: '起点机场视角 - 点击切换至终点机场',
    arrival: '终点机场视角 - 点击切换至世界视角'
  }
  return tooltips[currentView.value] || '点击切换视角'
})

// 切换视角（循环切换）
const toggleView = () => {
  if (!viewer) return
  
  const flight = currentFlight.value
  
  if (currentView.value === 'world') {
    // 世界 -> 亚洲
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(110, 25, 12000000),
      duration: 2
    })
    currentView.value = 'asia'
  } else if (currentView.value === 'asia') {
    // 亚洲 -> 起点机场
    if (flight.DepAirportLon && flight.DepAirportLat) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          parseFloat(flight.DepAirportLon),
          parseFloat(flight.DepAirportLat),
          15000
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: 0
        },
        duration: 2
      })
    }
    currentView.value = 'departure'
  } else if (currentView.value === 'departure') {
    // 起点机场 -> 终点机场
    if (flight.ArrAirportLon && flight.ArrAirportLat) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          parseFloat(flight.ArrAirportLon),
          parseFloat(flight.ArrAirportLat),
          15000
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: 0
        },
        duration: 2
      })
    }
    currentView.value = 'arrival'
  } else {
    // 终点机场 -> 世界
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(0, 10, 35000000),
      duration: 2
    })
    currentView.value = 'world'
  }
}

// 各弹窗位置状态（使用百分比位置，便于transform定位）
const modalPosition = ref({ x: '30%', y: '30%' })
const luggageModalPosition = ref({ x: '50%', y: '50%' })
const happinessModalPosition = ref({ x: '20%', y: '20%' })

// 开始拖拽
const startDrag = (modalType, e) => {
  const event = e || window.event
  isDragging.value = true
  currentDraggingModal.value = modalType
  const modal = event.currentTarget.closest('.draggable-modal')
  const rect = modal.getBoundingClientRect()
  
  // 计算相对于视口中心的偏移
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const centerX = viewportWidth / 2
  const centerY = viewportHeight / 2
  
  dragOffset.value = {
    x: event.clientX - centerX,
    y: event.clientY - centerY
  }
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

// 拖拽中
const onDrag = (e) => {
  if (!isDragging.value) return
  
  // 计算当前鼠标位置相对于视口中心的百分比
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const centerX = viewportWidth / 2
  const centerY = viewportHeight / 2
  
  const offsetX = e.clientX - centerX
  const offsetY = e.clientY - centerY
  
  // 计算新的百分比位置
  const newXPercent = Math.max(10, Math.min(90, 50 + ((offsetX - dragOffset.value.x) / viewportWidth) * 100))
  const newYPercent = Math.max(10, Math.min(90, 50 + ((offsetY - dragOffset.value.y) / viewportHeight) * 100))
  
  // 根据当前拖拽的弹窗类型更新对应位置
  switch (currentDraggingModal.value) {
    case 'aircraft':
      modalPosition.value = { x: `${newXPercent}%`, y: `${newYPercent}%` }
      break
    case 'luggage':
      luggageModalPosition.value = { x: `${newXPercent}%`, y: `${newYPercent}%` }
      break
    case 'happiness':
      happinessModalPosition.value = { x: `${newXPercent}%`, y: `${newYPercent}%` }
      break
    case 'seat':
      seatModalPosition.value = { x: `${newXPercent}%`, y: `${newYPercent}%` }
      break
    default:
      modalPosition.value = { x: `${newXPercent}%`, y: `${newYPercent}%` }
  }
}

// 停止拖拽
const stopDrag = () => {
  isDragging.value = false
  currentDraggingModal.value = ''
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 定义静态行李额数据
const LUGGAGE_RULES = {
  手提行李: 5,  // 5KG
  托运行李: 30   // 30KG
};

// 初始化行李额图表
const initLuggageChart = () => {
  if (!luggageChartRef.value) return;
  
  // 销毁旧图表
  if (luggageChart) {
    luggageChart.dispose();
  }
  
  // 创建新图表
  luggageChart = echarts.init(luggageChartRef.value);
  
  // 图表选项 - 浅色系设计
  const option = {
    backgroundColor: 'transparent',
    grid: { 
      left: '20%', 
      right: '20%', 
      top: '15%', 
      bottom: '15%' 
    },
    xAxis: { 
      show: false,
      max: 35 // 设置最大值让条形有呼吸空间
    },
    yAxis: {
      data: ['手提行李', '托运行李'],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { 
        color: '#1e3a5f', 
        fontSize: 15,
        fontWeight: 500,
        margin: 20
      }
    },
    series: [
      {
        name: '重量',
        type: 'pictorialBar',
        symbol: 'path://M512 0c-70.7 0-128 57.3-128 128V192H128c-35.3 0-64 28.7-64 64V896c0 35.3 28.7 64 64 64H896c35.3 0 64-28.7 64-64V256c0-35.3-28.7-64-64-64H640V128c0-70.7-57.3-128-128-128zM448 128c0-35.3 28.7-64 64-64s64 28.7 64 64V192H448V128z',
        symbolRepeat: true,
        symbolSize: [18, 24],
        symbolMargin: 4, // 增加间距让图标有呼吸感
        symbolClip: true,
        data: [
          { 
            value: LUGGAGE_RULES['手提行李'], 
            itemStyle: { 
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: '#38bdf8' },
                  { offset: 1, color: '#0ea5e9' }
                ]
              }
            } 
          },
          { 
            value: LUGGAGE_RULES['托运行李'], 
            itemStyle: { 
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: '#0ea5e9' },
                  { offset: 1, color: '#0284c7' }
                ]
              }
            } 
          }
        ],
        label: {
          show: true,
          position: 'right',
          formatter: '{c} KG',
          color: '#1e3a5f',
          fontSize: 15,
          fontWeight: 500,
          offset: [15, 0]
        },
        emphasis: {
          scale: true,
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(56, 189, 248, 0.3)'
          }
        }
      }
    ]
  };
  
  // 应用选项
  luggageChart.setOption(option);
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    luggageChart.resize();
  });
}

// 初始化舒适度对比图表
const initComfortChart = () => {
  if (!flightHappiness.value) return;
  
  // 模拟商务舱和经济舱数据
  const comfortData = [
    {
      座位空间: '舒适',
      座位宽度: '舒适',
      座位倾斜度: '舒适',
      舒适度: flightHappiness.value.comfort || 8
    },
    {
      座位空间: '标准',
      座位宽度: '标准',
      座位倾斜度: '标准',
      舒适度: Math.max(1, (flightHappiness.value.comfort || 8) - 2)
    }
  ];
  
  createComfortChart(comfortData);
}

// 实时更新计时器
let updateTimer = null

// 时间格式化辅助函数
const formatTime = (timeStr) => {
  if (!timeStr) return '--:--';
  // 检查是否为字符串格式的日期时间
  if (typeof timeStr === 'string') {
    // 如果包含空格，说明是完整的日期时间字符串，如 "2026-04-06 11:20:00"
    if (timeStr.includes(' ')) {
      return timeStr.split(' ')[1].slice(0, 5);
    }
  }
  // 否则尝试转换为 Date 对象
  const date = new Date(timeStr);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const showSeatSelector = ref(false);
const seatChartRef = ref(null);
const seatChartInstance = ref(null);
const seatModalPosition = ref({ x: '50%', y: '50%' });
const selectedSeats = ref([]);

const takenSeatNames = ['26E', '26D', '26C', '25D', '23C', '21A', '20F'];

// 编辑座位号函数
const editSeatNumber = () => {
  showSeatSelector.value = true;
  nextTick(() => {
    initSeatChart();
  });
};

const initSeatChart = () => {
  if (!seatChartRef.value) {
    console.error('座位图容器不存在');
    return;
  }
  
  if (seatChartInstance.value) {
    seatChartInstance.value.dispose();
  }
  
  seatChartInstance.value = echarts.init(seatChartRef.value);
  
  console.log('开始加载座位图...');
  const url = '/data/asset/geo/flight-seats.svg';
  console.log('座位图URL:', url);
  
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        console.log('座位图加载成功，长度:', xhr.responseText.length);
        echarts.registerMap('flight-seats', { svg: xhr.responseText });
      
      const option = {
        tooltip: {},
        geo: {
          map: 'flight-seats',
          roam: true,
          selectedMode: 'multiple',
          layoutCenter: ['50%', '50%'],
          layoutSize: '95%',
          tooltip: {
            show: true
          },
          itemStyle: {
            color: 'rgba(56, 189, 248, 0.15)',
            borderColor: 'rgba(56, 189, 248, 0.3)',
            borderWidth: 1
          },
          emphasis: {
            itemStyle: {
              color: 'rgba(56, 189, 248, 0.3)',
              borderColor: '#0ea5e9',
              borderWidth: 2
            },
            label: {
              show: false
            }
          },
          select: {
            itemStyle: {
              color: '#0ea5e9'
            },
            label: {
              show: false,
              textBorderColor: '#fff',
              textBorderWidth: 2
            }
          },
          regions: makeTakenRegions(takenSeatNames)
        }
      };
      
      console.log('ECharts配置:', JSON.stringify(option, null, 2));
      
      function makeTakenRegions(takenSeatNames) {
        var regions = [];
        for (var i = 0; i < takenSeatNames.length; i++) {
          regions.push({
            name: takenSeatNames[i],
            silent: true,
            itemStyle: {
              color: 'rgba(239, 68, 68, 0.4)',
              borderColor: 'rgba(239, 68, 68, 0.6)',
              borderWidth: 1
            },
            emphasis: {
              itemStyle: {
                borderColor: '#ef4444',
                borderWidth: 1
              }
            },
            select: {
              itemStyle: {
                color: 'rgba(239, 68, 68, 0.4)'
              }
            }
          });
        }
        return regions;
      }
      
      seatChartInstance.value.setOption(option);
      
      seatChartInstance.value.on('geoselectchanged', function (params) {
        const allSelected = params.allSelected[0]?.name?.slice() || [];
        
        selectedSeats.value = allSelected.filter(name => takenSeatNames.indexOf(name) < 0);
        
        console.log('已选择座位:', selectedSeats.value);
      });
      } else {
        console.error('加载座位图失败，HTTP状态:', xhr.status);
        fallbackSeatInput();
      }
    }
  };
  xhr.onerror = function() {
    console.error('加载座位图失败，网络错误');
    fallbackSeatInput();
  };
  xhr.send();
};

function fallbackSeatInput() {
  const currentSeat = currentFlight.value.seatNumber || '';
  const newSeat = prompt('请输入座位号:', currentSeat);
  
  if (newSeat !== null) {
    const flightNo = flightNumber.value || currentFlight.value.flightNo;
    currentFlight.value.seatNumber = newSeat.trim() || '-';
    
    if (flightNo) {
      localStorage.setItem(`seat_${flightNo}`, currentFlight.value.seatNumber);
    }
  }
}

const confirmSeatSelection = () => {
  if (selectedSeats.value.length > 0) {
    const flightNo = flightNumber.value || currentFlight.value.flightNo;
    currentFlight.value.seatNumber = selectedSeats.value.join(', ');
    
    if (flightNo) {
      localStorage.setItem(`seat_${flightNo}`, currentFlight.value.seatNumber);
    }
    
    showSeatSelector.value = false;
    selectedSeats.value = [];
  } else {
    alert('请先选择座位');
  }
};

const closeSeatSelector = () => {
  showSeatSelector.value = false;
  selectedSeats.value = [];
};

// 格式化飞行时长函数
const formatDuration = (minutes) => {
  if (!minutes) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}小时${mins}分`;
  } else {
    return `${mins}分`;
  }
};

// 获取登机方式函数
const getBoardingMethod = (type) => {
  if (!type) return '-';
  if (type.includes('远机位')) {
    return '摆渡车';
  } else if (type.includes('靠廊桥')) {
    return '廊桥';
  } else {
    return type;
  }
};

// 计算预计出机场时间函数
const calculateExitTime = (arrTime, duration) => {
  if (!arrTime || !duration) return '-';
  
  // 解析到达时间
  let date;
  if (arrTime.includes(' ')) {
    date = new Date(arrTime);
  } else {
    // 从当前航班数据中获取日期，优先使用实际到达时间，然后是预计到达时间，最后是计划到达时间
    let dateStr = '';
    if (currentFlight.value?.act_arr_time && currentFlight.value.act_arr_time.includes(' ')) {
      dateStr = currentFlight.value.act_arr_time.split(' ')[0];
    } else if (currentFlight.value?.est_arr_time && currentFlight.value.est_arr_time.includes(' ')) {
      dateStr = currentFlight.value.est_arr_time.split(' ')[0];
    } else if (currentFlight.value?.FlightArrtimePlanDate && currentFlight.value.FlightArrtimePlanDate.includes(' ')) {
      dateStr = currentFlight.value.FlightArrtimePlanDate.split(' ')[0];
    } else {
      // 如果都没有日期信息，使用当前日期
      const today = new Date();
      dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
    date = new Date(`${dateStr} ${arrTime}`);
  }
  
  // 添加分钟数
  date.setMinutes(date.getMinutes() + parseInt(duration));
  
  // 格式化时间
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

// 计算航段飞行时长
const calculateSegmentDuration = (flight) => {
  // 安全的时间转换函数
  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    const date = new Date(timeStr);
    return isNaN(date.getTime()) ? null : date;
  };
  
  let depTime, arrTime;
  
  if (flight.stopFlag === '1' && currentSegment.value === 1 && segment1Data.value) {
    // 第一程：使用 segment1Data 的数据
    depTime = parseTime(segment1Data.value.act_dep_time || segment1Data.value.FlightDeptimeDate);
    arrTime = parseTime(segment1Data.value.est_arr_time || segment1Data.value.VeryZhunReadyArrtimeDate || segment1Data.value.FlightArrtimePlanDate);
  } else if (flight.stopFlag === '1' && currentSegment.value === 2 && segment2Data.value) {
    // 第二程：使用 segment2Data 的数据
    depTime = parseTime(segment2Data.value.act_dep_time || segment2Data.value.FlightDeptimeDate);
    arrTime = parseTime(segment2Data.value.est_arr_time || segment2Data.value.VeryZhunReadyArrtimeDate || segment2Data.value.FlightArrtimePlanDate);
  } else if (flight.stopFlag === '1' && currentSegment.value === 3 && fullFlightData.value) {
    // 全程：使用 fullFlightData 的数据
    depTime = parseTime(fullFlightData.value.act_dep_time || fullFlightData.value.FlightDeptimeDate);
    arrTime = parseTime(fullFlightData.value.est_arr_time || fullFlightData.value.VeryZhunReadyArrtimeDate || fullFlightData.value.FlightArrtimePlanDate);
  } else {
    // 非经停航班或单航段模式
    depTime = parseTime(flight.act_dep_time || flight.FlightDeptimeDate);
    arrTime = parseTime(flight.est_arr_time || flight.VeryZhunReadyArrtimeDate || flight.FlightArrtimePlanDate);
  }
  
  // 确保时间对象有效
  if (!depTime || !arrTime) {
    return formatDuration(flight.flightDuration);
  }
  
  // 计算飞行时长（分钟）
  const durationMinutes = Math.max(0, Math.floor((arrTime - depTime) / (1000 * 60)));
  
  return formatDuration(durationMinutes);
};

// 计算剩余飞行时间和距离
const calculateRemaining = (flight) => {
  const now = new Date();
  let depTime, arrTime, totalDistance;
  
  // 安全的时间转换函数
  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    const date = new Date(timeStr);
    return isNaN(date.getTime()) ? null : date;
  };
  
  if (flight.stopFlag === '1' && currentSegment.value === 1 && segment1Data.value) {
    // 第一程：使用 segment1Data 的数据
    depTime = parseTime(segment1Data.value.act_dep_time || segment1Data.value.FlightDeptimeDate);
    arrTime = parseTime(segment1Data.value.est_arr_time || segment1Data.value.VeryZhunReadyArrtimeDate || segment1Data.value.FlightArrtimePlanDate);
    totalDistance = parseFloat(segment1Data.value.distance || 0);
  } else if (flight.stopFlag === '1' && currentSegment.value === 2 && segment2Data.value) {
    // 第二程：使用 segment2Data 的数据
    depTime = parseTime(segment2Data.value.act_dep_time || segment2Data.value.FlightDeptimeDate);
    arrTime = parseTime(segment2Data.value.est_arr_time || segment2Data.value.VeryZhunReadyArrtimeDate || segment2Data.value.FlightArrtimePlanDate);
    totalDistance = parseFloat(segment2Data.value.distance || 0);
  } else if (flight.stopFlag === '1' && currentSegment.value === 3 && fullFlightData.value) {
    // 全程：使用 fullFlightData 的数据
    depTime = parseTime(fullFlightData.value.act_dep_time || fullFlightData.value.FlightDeptimeDate);
    arrTime = parseTime(fullFlightData.value.est_arr_time || fullFlightData.value.VeryZhunReadyArrtimeDate || fullFlightData.value.FlightArrtimePlanDate);
    totalDistance = parseFloat(fullFlightData.value.distance || 0);
  } else {
    // 非经停航班或单航段模式
    depTime = parseTime(flight.act_dep_time || flight.FlightDeptimeDate);
    arrTime = parseTime(flight.est_arr_time || flight.VeryZhunReadyArrtimeDate || flight.FlightArrtimePlanDate);
    totalDistance = parseFloat(flight.distance || 0);
  }
  
  // 确保时间对象有效
  if (!depTime || !arrTime) {
    return {
      remainingMinutes: 0,
      remainingDistance: 0,
      isLandingSoon: false
    };
  }
  
  // 计算剩余时间（分钟）
  const remainingMinutes = Math.max(0, Math.floor((arrTime - now) / (1000 * 60)));
  
  // 计算飞行进度
  const totalDuration = Math.max(1, (arrTime - depTime) / (1000 * 60));
  const elapsedMinutes = Math.max(0, Math.floor((now - depTime) / (1000 * 60)));
  const progress = Math.min(1, elapsedMinutes / totalDuration);
  
  // 计算剩余距离
  const remainingDistance = Math.max(0, Math.round(totalDistance * (1 - progress)));
  
  return {
    remainingMinutes,
    remainingDistance,
    isLandingSoon: remainingMinutes < 10
  };
};

// 判断航班是否已经起飞
const isFlightDeparted = () => {
  const status = currentFlight.value.status || '';
  const departedStates = ['起飞', '到达', '降落', '飞行中'];
  return departedStates.some(state => status.includes(state));
};

// ---------------- 核心修复：生命周期清理 ----------------
const cleanCesium = () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  if (viewer) {
    viewer.entities.removeAll();
  }
};

// ---------------- 模拟飞行逻辑 ----------------
const simulateFlight = (flightData) => {
  if (!viewer || !viewer.entities || viewer.isDestroyed?.() || !flightData) return;
  
  const depLon = parseFloat(flightData.DepAirportLon);
  const depLat = parseFloat(flightData.DepAirportLat);
  const arrLon = parseFloat(flightData.ArrAirportLon);
  const arrLat = parseFloat(flightData.ArrAirportLat);
  
  if (isNaN(depLon) || isNaN(depLat)) return;

  const now = Date.now();
  const status = flightData.status || '';

  // 起飞时间：遍历所有可能的字段
  let depTime = null;
  const depCandidates = [
    flightData.act_dep_time,
    flightData.est_dep_time,
    flightData.schDepTimeFull,
    flightData.FlightDeptimePlanDate,
    flightData.FlightDeptimeDate,
    flightData.FlightDeptimeReadyDate,
    flightData.VeryZhunReadyDeptimeDate,
    // 最后尝试 schDepTime(HH:mm) + flightDate
    flightData.schDepTime && flightData.flightDate ? flightData.flightDate + ' ' + flightData.schDepTime : null
  ];

  for (const cand of depCandidates) {
    if (!cand || typeof cand !== 'string' || cand === '-' || cand === '--:--') continue;
    try {
      const t = new Date(cand).getTime();
      if (!isNaN(t)) { depTime = t; break; }
    } catch (_) {}
  }

  // 到达时间
  let arrTime = null;
  const arrCandidates = [
    flightData.act_arr_time,
    flightData.est_arr_time,
    flightData.schArrTimeFull,
    flightData.FlightArrtimePlanDate,
    flightData.FlightArrtimeDate,
    flightData.FlightArrtimeReadyDate,
    flightData.VeryZhunReadyArrtimeDate,
    flightData.schArrTime && flightData.flightDate ? flightData.flightDate + ' ' + flightData.schArrTime : null
  ];

  for (const cand of arrCandidates) {
    if (!cand || typeof cand !== 'string' || cand === '-' || cand === '--:--') continue;
    try {
      const t = new Date(cand).getTime();
      if (!isNaN(t)) {
        // 到达时间如果在起飞时间之前（跨天），加一天
        arrTime = (depTime && t < depTime) ? t + 86400000 : t;
        break;
      }
    } catch (_) {}
  }

  if (!depTime || !arrTime || isNaN(depTime) || isNaN(arrTime)) {
    console.warn('✈️ simulateFlight 时间解析失败', { depCandidates, arrCandidates, depTime, arrTime });
    return;
  }

  // 经停相关 - 只使用 mapFlightToUI 映射的 stopFlag，忽略原始数据覆盖
  const rawStopFlag = flightData.stopFlag || '0';
  // 根据当前航段重新确定出发/目的地坐标
  let srcLon = depLon;
  let srcLat = depLat;
  let destLon = parseFloat(flightData.ArrAirportLon);
  let destLat = parseFloat(flightData.ArrAirportLat);
  let stopLon = segment2Data.value ? parseFloat(segment2Data.value.DepAirportLon) : null;
  let stopLat = segment2Data.value ? parseFloat(segment2Data.value.DepAirportLat) : null;
  let useStopover = false; // remaining-trail 是否要画经过经停点的多段线
  let stopTime = null;
  let depTime2 = null;

  if (rawStopFlag === '1' && currentSegment.value === 1) {
    // 第一程：出发地=原始出发地，目的地=经停点
    destLon = stopLon || destLon;
    destLat = stopLat || destLat;
    useStopover = false;
  } else if (rawStopFlag === '1' && currentSegment.value === 2) {
    // 第二程：出发地=经停点，目的地=终点
    srcLon = stopLon || srcLon;
    srcLat = stopLat || srcLat;
    useStopover = false;
  } else if (rawStopFlag === '1') {
    // 全程经停：出发地=原始出发地，目的地=终点，需经过经停点
    useStopover = true;
    if (segment1Data.value) {
      const s1 = segment1Data.value.FlightArrtimePlanDate;
      if (s1) stopTime = new Date(s1).getTime();
    }
    if (!stopTime) stopTime = depTime + 2.5 * 60 * 60 * 1000;
    depTime2 = segment2Data.value
      ? new Date(segment2Data.value.FlightDeptimePlanDate).getTime()
      : (stopTime ? stopTime + 3600000 : depTime + 3 * 3600000);
  }

  // 计算进度
  let progress;
  const isArrived = (status.includes('到达') || status.includes('落地') || status.includes('取消'))
    || (flightData.act_arr_time && flightData.act_arr_time.includes(' ') && now > new Date(flightData.act_arr_time).getTime());

  if (isArrived) {
    progress = useStopover ? 2 : 1;
  } else if (now < depTime) {
    progress = 0;
  } else {
    if (useStopover) {
      if (stopTime && now < stopTime) {
        progress = (now - depTime) / (stopTime - depTime);
      } else if (now < depTime2) {
        progress = 1;
      } else {
        progress = 1 + (now - depTime2) / (arrTime - depTime2);
      }
      progress = Math.max(0, Math.min(2, progress));
    } else {
      progress = (now - depTime) / (arrTime - depTime);
      progress = Math.max(0, Math.min(1, progress));
    }
  }

  // 插值坐标
  let currentLon, currentLat;
  if (useStopover) {
    if (progress <= 1) {
      currentLon = srcLon + (stopLon - srcLon) * progress;
      currentLat = srcLat + (stopLat - srcLat) * progress;
    } else {
      const segmentProgress = progress - 1;
      currentLon = stopLon + (destLon - stopLon) * segmentProgress;
      currentLat = stopLat + (destLat - stopLat) * segmentProgress;
    }
  } else {
    currentLon = srcLon + (destLon - srcLon) * progress;
    currentLat = srcLat + (destLat - srcLat) * progress;
  }

  const currentPos = Cesium.Cartesian3.fromDegrees(currentLon, currentLat, 50000);

  // 更新飞机位置
  if (planeEntity) {
    planeEntity.position = currentPos;
  }

  // ---- 更新飞行数据供 CallbackProperty 消费 ----
  // （实体在 drawFlightRoute 中用 CallbackProperty 创建，只需更新数据即可）
  window._flightPos = {
    depLon: srcLon, depLat: srcLat, currentLon, currentLat,
    arrLon: destLon, arrLat: destLat,
    stopLon: stopLon || destLon, stopLat: stopLat || destLat,
    isFull: progress >= (useStopover ? 2 : 1),
    hasStopover: useStopover,
    progress
  };
};

// ---------------- 绘制逻辑 ----------------
const drawFlightRoute = (flightData) => {
  if (!viewer) return;
  if (!flightData || !flightData.DepAirportLon || !flightData.ArrAirportLon) {
    console.warn('⚠️ 航班坐标数据不完整，无法绘制航线', flightData);
    return;
  }
  cleanCesium(); // 绘制新航线前先停掉旧动画

  // 获取经停机场信息（优先从路由参数获取）
  const routeStopCity = route.query.stopCity || flightData.StopCity;
  let stopLon = segment2Data.value ? parseFloat(segment2Data.value.DepAirportLon) : null;
  let stopLat = segment2Data.value ? parseFloat(segment2Data.value.DepAirportLat) : null;
  let stopCity = segment2Data.value ? segment2Data.value.FlightDepAirport : null;
  
  // 如果没有segment2Data，尝试从flightData获取经停机场坐标
  if (!stopLon && flightData.stopFlag === '2') {
    // 第二程航班，使用经停机场作为起点
    stopLon = parseFloat(flightData.DepAirportLon);
    stopLat = parseFloat(flightData.DepAirportLat);
    stopCity = routeStopCity || flightData.StopCity || flightData.FlightDep;
  }
  
  // 根据当前选择的航段确定起点和终点
  let depLon, depLat, arrLon, arrLat, depCity, arrCity, hasStopover = false;
  
  if (flightData.stopFlag === '1' && currentSegment.value === 1) {
    // 第一程
    depLon = parseFloat(flightData.DepAirportLon);
    depLat = parseFloat(flightData.DepAirportLat);
    arrLon = stopLon;
    arrLat = stopLat;
    depCity = flightData.depAirportFull;
    arrCity = stopCity || '-';
  } else if ((flightData.stopFlag === '1' && currentSegment.value === 2) || flightData.stopFlag === '2') {
    // 第二程（两种情况：全程经停航班选择第二程，或直接选择第二程）
    depLon = stopLon;
    depLat = stopLat;
    arrLon = parseFloat(flightData.ArrAirportLon);
    arrLat = parseFloat(flightData.ArrAirportLat);
    depCity = stopCity || routeStopCity || flightData.depAirportFull || flightData.FlightDep || '-';
    arrCity = flightData.arrAirportFull || flightData.FlightArr || '-';
  } else {
    // 全程或非经停航班
    depLon = parseFloat(flightData.DepAirportLon);
    depLat = parseFloat(flightData.DepAirportLat);
    arrLon = parseFloat(flightData.ArrAirportLon);
    arrLat = parseFloat(flightData.ArrAirportLat);
    depCity = flightData.depAirportFull;
    arrCity = flightData.arrAirportFull;
    hasStopover = flightData.stopFlag === '1';
  }
  
  // 解析天气信息
  const parseWeatherInfo = (weatherStr, isDep) => {
    if (!weatherStr) return null;
    const parts = weatherStr.split('|');
    if (parts.length < 5) return null;
    
    const condition = parts[0];
    const visibility = parts[1];
    const windLevel = parts[2];
    const humidity = parts[3];
    const temp = parts[4];
    
    let icon = '🌤️';
    if (condition.includes('晴')) icon = '☀️';
    else if (condition.includes('阴')) icon = '☁️';
    else if (condition.includes('雨')) icon = '🌧️';
    else if (condition.includes('雪')) icon = '❄️';
    else if (condition.includes('雷')) icon = '⛈️';
    else if (condition.includes('雾')) icon = '🌫️';
    
    return {
      icon: icon,
      condition: condition,
      temp: temp,
      humidity: humidity,
      wind: windLevel
    };
  };
  
  // 获取机场天气信息
  const getAirportWeather = (isDep) => {
    if (isDep) {
      return parseWeatherInfo(flightData.DepWeather);
    } else {
      return parseWeatherInfo(flightData.ArrWeather);
    }
  };
  
  // 添加站点
  const addPoint = (lon, lat, city, isDep, isStopover = false) => {
    const airportCode = isDep ? (flightData.FlightDepcode || flightData.depAirportCode) : (isStopover ? (flightData.StopAirportCode) : (flightData.FlightArrcode || flightData.arrAirportCode));
    const airportName = isDep ? (flightData.FlightDepAirport || flightData.depAirportFull) : (isStopover ? flightData.StopCity : (flightData.FlightArrAirport || flightData.arrAirportFull));
    const weather = isStopover ? null : getAirportWeather(isDep);
    
    const pointEntity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 500),
      point: { 
        pixelSize: isStopover ? 14 : 16, 
        color: isDep ? Cesium.Color.SPRINGGREEN : (isStopover ? Cesium.Color.fromCssColorString('#60A5FA') : Cesium.Color.GOLD),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      label: {
        text: city,
        font: isStopover ? '13px sans-serif' : '15px sans-serif',
        showBackground: true,
        pixelOffset: new Cesium.Cartesian2(0, isStopover ? -42 : -50),
        fillColor: isStopover ? Cesium.Color.fromCssColorString('#d6ecf0') : Cesium.Color.WHITE,
        backgroundColor: Cesium.Color.fromCssColorString('rgba(0, 0, 0, 0.8)'),
        padding: new Cesium.Cartesian2(8, 4),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      // 存储机场信息供点击事件使用
      airportData: {
        code: airportCode,
        name: airportName,
        city: city,
        lon: lon,
        lat: lat,
        type: isDep ? 'departure' : (isStopover ? 'stopover' : 'arrival'),
        weather: weather
      }
    });
  };
  
  // 添加起点和终点
  if (depLon && depLat && !isNaN(depLon) && !isNaN(depLat)) addPoint(depLon, depLat, depCity, true);
  
  // 如果是全程且有经停，添加经停点
  if (hasStopover && stopLon && stopLat && !isNaN(stopLon) && !isNaN(stopLat)) {
    addPoint(stopLon, stopLat, stopCity || '-', false, true);
  }
  
  if (arrLon && arrLat && !isNaN(arrLon) && !isNaN(arrLat)) addPoint(arrLon, arrLat, arrCity, false);

  // 创建动态航线实体（使用 CallbackProperty，simulateFlight 只需更新 window._flightPos）
  // 实线：已行驶段（出发地→飞机当前位置）
  window._flightPos = window._flightPos || { depLon, depLat, currentLon: depLon, currentLat: depLat, arrLon, arrLat, stopLon, stopLat, isFull: false, hasStopover, progress: 0 };
  
  viewer.entities.add({
    id: 'active-trail',
    polyline: {
      positions: new Cesium.CallbackProperty(() => {
        const d = window._flightPos;
        if (d.isFull) return Cesium.Cartesian3.fromDegreesArray([d.depLon, d.depLat, d.arrLon, d.arrLat]);
        return Cesium.Cartesian3.fromDegreesArray([d.depLon, d.depLat, d.currentLon, d.currentLat]);
      }, false),
      width: 5,
      material: Cesium.Color.fromCssColorString('#38BDF8').withAlpha(0.95),
      followSurface: false
    }
  });
  
  // 虚线/半透明线：全程计划路线（出发地→目的地，作为静态参考线）
  viewer.entities.add({
    id: 'remaining-trail',
    show: new Cesium.CallbackProperty(() => {
      return !window._flightPos?.isFull;
    }, false),
    polyline: {
      positions: new Cesium.CallbackProperty(() => {
        const d = window._flightPos;
        let pts;
        if (d.hasStopover) {
          pts = [d.depLon, d.depLat, d.stopLon, d.stopLat, d.arrLon, d.arrLat];
        } else {
          pts = [d.depLon, d.depLat, d.arrLon, d.arrLat];
        }
        return Cesium.Cartesian3.fromDegreesArray(pts);
      }, false),
      width: 4,
      material: new Cesium.PolylineDashMaterialProperty({
        color: Cesium.Color.fromCssColorString('#94A3B8').withAlpha(0.55)
      }),
      followSurface: false
    }
  });

  // 初始化飞机模型（在航线之后添加，确保2D模式下覆盖航线）
  try {
    planeEntity = viewer.entities.add({
      zIndex: 1000,
      model: {
        uri: '/low_poly_airplane.glb',
        scale: 100.0,
        minimumPixelSize: 50,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, -5000))
      }
    });
  } catch (e) {
    console.warn("飞机模型加载失败，仅显示航线", e);
  }

  // 启动动画循环
  const animate = () => {
    if (!viewer || viewer.isDestroyed?.()) return; 
    simulateFlight(flightData);
    animationId = requestAnimationFrame(animate);
  };
  animate();

  // 视角缩放
  try {
    if (hasStopover) {
      // 经停航班：视角覆盖三个点
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees((depLon + stopLon + arrLon) / 3, (depLat + stopLat + arrLat) / 3, 3000000)
      });
    } else {
      // 非经停航班：视角覆盖两个点
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees((depLon + arrLon) / 2, (depLat + arrLat) / 2, 2000000)
      });
    }
  } catch (e) {
    console.warn("相机飞行失败", e);
  }
  
  // 添加统一的机场点点击事件处理
  viewer.screenSpaceEventHandler.setInputAction(function(e) {
    const picked = viewer.scene.pick(e.position);
    if (Cesium.defined(picked) && Cesium.defined(picked.id) && Cesium.defined(picked.id.airportData)) {
      showAirportInfoBox(picked.id.airportData);
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
};

// ---------------- 数据获取 ----------------
// 解析天气函数
const parseWeather = (weatherStr) => {
  if (!weatherStr) return '-';
  
  const parts = weatherStr.split('|');
  const weatherName = parts[0] || ''; // 天气现象名称，如 "晴天"
  const temp = parts[4] || '-';      // 温度值
  
  // 建立关键词与 Emoji 的映射表
  const weatherEmojiMap = {
    '晴': '☀️',
    '多云': '⛅',
    '阴': '☁️',
    '雨': '🌧️',
    '雷': '⛈️',
    '雪': '❄️',
    '雾': '🌫️',
    '霾': '😷',
    '风': '💨'
  };

  // 查找匹配的 Emoji
  // 使用 find 寻找天气名称中包含的关键词（例如 "大雨" 也能匹配到 "雨"）
  const emojiKey = Object.keys(weatherEmojiMap).find(key => weatherName.includes(key));
  const emoji = emojiKey ? weatherEmojiMap[emojiKey] : '🌡️';

  return `${emoji} ${weatherName} ${temp}°C`;
};

/**
 * 计算两个日期字符串之间的差值，返回 "X小时Y分"
 * @param {string} startTime - 第二程起飞时间 (FlightDeptimePlanDate)
 * @param {string} endTime - 第一程到达时间 (FlightArrtimePlanDate)
 */
const calculateStayTime = (startTime, endTime) => {
  if (!startTime || !endTime) return '时间计算中...';

  const start = new Date(startTime.replace(/-/g, '/')); // 兼容性处理
  const end = new Date(endTime.replace(/-/g, '/'));

  const diffMs = start - end; // 毫秒差
  
  if (diffMs <= 0) return '短暂停留';

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}小时${minutes}分`;
  }
  return `${minutes}分`;
};

// 获取高度显示
const getDisplayAltitude = (rawData) => {
  const state = rawData?.FlightState;
  if (state === '到达' || state === '计划' || state === '取消') {
    return '-'; // 未飞行状态显示横杠
  }
  // 飞常准 API 如果没有实时高度字段，建议根据状态显示“巡航中”或获取具体的实时坐标高度
  return rawData?.realTimeAltitude ? `${rawData.realTimeAltitude} m` : '巡航中';
};

// 映射航班数据到 UI 显示格式
const mapFlightToUI = (rawData) => {
  // 从 localStorage 读取座位号
  const flightNo = flightNumber.value || rawData?.FlightNo;
  const savedSeat = flightNo ? localStorage.getItem(`seat_${flightNo}`) : null;
  
  // 计算飞行时长（如果 FlightDuration 缺失）
  let flightDuration = rawData?.FlightDuration || '-';
  if (flightDuration === '-' && rawData?.FlightDeptimePlanDate && rawData?.FlightArrtimePlanDate) {
    try {
      const depTime = new Date(rawData.FlightDeptimePlanDate);
      const arrTime = new Date(rawData.FlightArrtimePlanDate);
      if (!isNaN(depTime.getTime()) && !isNaN(arrTime.getTime())) {
        const durationMinutes = Math.floor((arrTime - depTime) / (1000 * 60));
        if (durationMinutes > 0) {
          const hours = Math.floor(durationMinutes / 60);
          const mins = durationMinutes % 60;
          flightDuration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        }
      }
    } catch (error) {
      console.error('计算飞行时长失败:', error);
    }
  }
  
  // 构建航班信息
  // 时间 - 提取关键日期时间
  const veryZhunDep = rawData?.VeryZhunReadyDeptimeDate;
  const veryZhunArr = rawData?.VeryZhunReadyArrtimeDate;
  const planDep = rawData?.FlightDeptimePlanDate;
  const planArr = rawData?.FlightArrtimePlanDate;
  const rawDep = rawData?.act_dep_time || rawData?.ActualDeparture || rawData?.atd || rawData?.FlightDeptimeDate;
  const rawArr = rawData?.act_arr_time || rawData?.ActualArrival || rawData?.ata || rawData?.FlightArrtimeDate;
  const estDep = rawData?.est_dep_time || rawData?.EstimatedDeparture || rawData?.FlightDeptimeReadyDate;
  const estArr = rawData?.est_arr_time || rawData?.EstimatedArrival || rawData?.FlightArrtimeReadyDate;

  // 提取该航班的日期（从任意一个非空的日期时间字符串中取日期部分）
  const extractDate = (dtStr) => dtStr && dtStr.includes(' ') ? dtStr.split(' ')[0] : null;
  const flightDate = extractDate(planDep) || extractDate(rawDep) || extractDate(estDep) || '';

  // 保存完整日期时间（供 simulateFlight 使用）和仅 HH:mm（供 UI 显示）
  const fullDep = veryZhunDep || planDep || '';
  const fullArr = veryZhunArr || planArr || '';

  return {
    flightNo: rawData?.FlightNo,
    flightDate: flightDate,
    airline: rawData?.FlightCompany || '-',
    status: rawData?.AssistFlightState || rawData?.FlightState || '准点',
    ontimeRate: rawData?.OntimeRate || '-',
    depCity: route.query.depCity || rawData?.FlightDep || '-',
    depAirportFull: rawData?.FlightDepAirport || rawData?.FlightDep,
    depAirport: route.query.depAirport || rawData?.FlightDepcode || '-',
    arrCity: route.query.arrCity || rawData?.FlightArr || '-',
    arrAirportFull: rawData?.FlightArrAirport || rawData?.FlightArr,
    arrAirport: rawData?.FlightArrcode || '-',
    depTerminal: rawData?.FlightHTerminal || '-',
    arrTerminal: rawData?.FlightTerminal || '-',
    boardGate: rawData?.BoardGate || '-',
    checkinTable: rawData?.CheckinTable || '-',
    bridge: rawData?.bridge || '-',
    arrBridge: rawData?.arr_bridge || '-',
    baggageId: rawData?.BaggageID || '-',
    distance: rawData?.distance || '-',
    flightDuration: flightDuration,
    food: rawData?.Food || '-',
    seatNumber: savedSeat || '-',
    lastCheckinTime: rawData?.LastCheckinTime || '-',
    fastestExitDuration: rawData?.FastestExitDuration || '-',
    slowestExitDuration: rawData?.SlowestExitDuration || '-',
    checkDoor: rawData?.CheckDoor || '-',
    arrStandGate: rawData?.ArrStandGate || '-',
    depStandGate: rawData?.DepStandGate || '-',
    aircraftType: rawData?.FtypeDetail || rawData?.generic || '-',
    aircraftNumber: rawData?.AircraftNumber || '-',
    flightYear: rawData?.FlightYear || '-',
    aircraftDescribe: rawData?.aircraftDescribe || '-',
    airlinetel: rawData?.airlinetel || '-',
    depWeather: parseWeather(rawData?.DepWeather),
    arrWeather: parseWeather(rawData?.ArrWeather),
    weather: parseWeather(rawData?.ArrWeather),
    // 完整日期时间供 animation 使用
    act_dep_time: rawDep,
    act_arr_time: rawArr,
    est_dep_time: estDep,
    est_arr_time: estArr,
    schDepTimeFull: fullDep,
    schArrTimeFull: fullArr,
    // 仅 HH:mm 供 UI 显示
    schDepTime: fullDep && fullDep.includes(' ') ? fullDep.split(' ')[1].slice(0, 5) : '--:--',
    schArrTime: fullArr && fullArr.includes(' ') ? fullArr.split(' ')[1].slice(0, 5) : '--:--',
    // 实时坐标（如果有）
    realTime: {
      altitude: getDisplayAltitude(rawData), // 修复高度显示
      speed: 800
    },
    // 用于地图画线的原始坐标
    DepAirportLon: rawData?.DepAirportLon,
    DepAirportLat: rawData?.DepAirportLat,
    ArrAirportLon: rawData?.ArrAirportLon,
    ArrAirportLat: rawData?.ArrAirportLat,
    // 经停航班相关字段
    stopFlag: rawData?.StopFlag || '0',
    stopCity: rawData?.StopCity || '',
    stopAirportCode: rawData?.StopAirportCode || '',
    // 保留原始字段
    ...rawData
  };
};

// 处理路由参数
const handleRouteParams = (displayFlight) => {
  if (route.query.flightInfo) {
    console.log('✈️ 使用路由传递的航段信息，补充数据');
    const flightInfo = JSON.parse(route.query.flightInfo);
    
    // 合并数据
    displayFlight = {
      // 首先使用现有数据
      ...displayFlight,
      ...flightInfo, // 然后用路由传递的航段信息覆盖
      // 只补充必要字段，不覆盖现有数据
      flightNo: flightInfo.FlightNo || displayFlight.flightNo || flightNumber.value,
      status: flightInfo.status || displayFlight.status || '准点',
      depCity: flightInfo.depCity || displayFlight.depCity || '-',
      arrCity: flightInfo.arrCity || displayFlight.arrCity || '-',
      depAirport: flightInfo.depAirportCode || displayFlight.depAirport || '-',
      arrAirport: flightInfo.arrAirportCode || displayFlight.arrAirport || '-',
      depAirportFull: flightInfo.depAirportFull || displayFlight.depAirportFull || flightInfo.depCity || '-',
      arrAirportFull: flightInfo.arrAirportFull || displayFlight.arrAirportFull || flightInfo.arrCity || '-',
      distance: flightInfo.distance || displayFlight.distance || '-',
      flightDuration: flightInfo.estimatedFlightTime || displayFlight.flightDuration || '-',
      stopFlag: flightInfo.stopFlag || displayFlight.stopFlag || '0'
    };
    
    // 存储完整的航班数据
    if (flightInfo.fullFlight) {
      fullFlightData.value = flightInfo.fullFlight;
    }
    if (flightInfo.segment1) {
      segment1Data.value = flightInfo.segment1;
    }
    if (flightInfo.segment2) {
      segment2Data.value = flightInfo.segment2;
    }
  }
  return displayFlight;
};

// 获取航班数据（带重试机制）
const fetchFlightData = async (maxRetries = 2) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      if (useMock) {
        console.log('🔧 使用 Mock 数据模式');
        return MOCK_FLIGHT_DATA;
      } else {
        const dateParam = route.query.date;
        console.log(`正在搜索航班: ${flightNumber.value}, 日期: ${dateParam || '未提供'}`);
        const response = await searchFlightByNumber(flightNumber.value, dateParam);
        return response;
      }
    } catch (err) {
      // 检测403错误（API Key无效）
      if (err.response?.status === 403 || err.message?.includes('403') || err.message?.includes('Forbidden')) {
        throw new Error('API Key 无效或已过期，请检查 .env 文件中的 VARIFLIGHT_API_KEY');
      }
      retries++;
      if (retries >= maxRetries) {
        throw err;
      }
      console.warn(`获取航班数据失败，正在重试 (${retries}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
};

// 防抖函数
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 更新仪表盘（主函数）
const updateDashboard = debounce(async () => {
  isLoading.value = true;
  
  // 清理旧航班的实体
  if (viewer && viewer.entities) {
    viewer.entities.removeAll();
  }
  
  // 重置航班数据，避免数据污染
  currentFlight.value = {}
  
  try {
    // 从 API 获取最新的航班数据

const response = await fetchFlightData();
    
    // 获取完整的 data 数组，而不仅仅是第一个元素
    const dataArray = response.data || response.flights || [];
    console.log('✈️ 航班原始数据包数组:', dataArray);
    
    // 防御性检查：如果数据为空，显示错误
    if (dataArray.length === 0) {
      error.value = "未找到航班数据，请检查航班号和日期";
      isLoading.value = false;
      return;
    }
    
    // 存储航段数据，严格按照 API 返回顺序：[0]=全程, [1]=第一程, [2]=第二程
    if (dataArray.length >= 3) {
      fullFlightData.value = dataArray[0];
      segment1Data.value = dataArray[1];
      segment2Data.value = dataArray[2];
      console.log('✈️ 航段数据存储:', {
        fullFlight: dataArray[0].FlightDep + ' -> ' + dataArray[0].FlightArr,
        segment1: dataArray[1].FlightDep + ' -> ' + dataArray[1].FlightArr,
        segment2: dataArray[2].FlightDep + ' -> ' + dataArray[2].FlightArr
      });
    }
    
    // 根据当前选择的航段获取对应的原始数据
    let selectedRawData;
    if (currentSegment.value === 1 && dataArray[1]) {
      selectedRawData = dataArray[1];
      console.log('✈️ 选择第一程:', selectedRawData.FlightDep + ' -> ' + selectedRawData.FlightArr);
    } else if (currentSegment.value === 2 && dataArray[2]) {
      selectedRawData = dataArray[2];
      console.log('✈️ 选择第二程:', selectedRawData.FlightDep + ' -> ' + selectedRawData.FlightArr);

    } else {
      selectedRawData = dataArray[0] || {};
      console.log('✈️ 选择全程:', selectedRawData.FlightDep + ' -> ' + (selectedRawData.StopCity || '') + ' -> ' + selectedRawData.FlightArr);
    }
    console.log('✈️ 当前选择的航段数据:', selectedRawData);
    
    // 构建航班信息
    let displayFlight = mapFlightToUI(selectedRawData);
    
    // 修复：仅在首次加载且路由有数据时处理路由参数
    if (isFirstLoad.value && route.query.flightInfo) {
      console.log('🔑 首次加载，处理路由参数');
      displayFlight = handleRouteParams(displayFlight);
    } else {
      console.log('🔒 非首次加载，跳过路由参数处理');
    }
    
    // 更新当前航班数据
    currentFlight.value = displayFlight;
    
    // 绘制航班航线
    drawFlightRoute(currentFlight.value);
    
    // 控制台打印当前航班数据，用于调试
    console.log('📊 当前航班数据:', currentFlight.value);
    
    // 获取航班幸福度
    try {
      const dateParam = route.query.date || route.params.date || null;
      const happinessResult = await getFlightHappinessIndex(flightNumber.value, dateParam);
      console.log('😊 航班幸福度数据:', happinessResult);
      
      // 处理幸福度数据
      if (happinessResult && happinessResult.data && happinessResult.data.length > 0) {
        // 取第一个数据项（商务舱或经济舱）
        const happinessData = happinessResult.data[0];
        console.log('😊 处理的幸福度数据:', happinessData);
        
        flightHappiness.value = {
          ontimeRate: happinessData.OntimeRate || '-',
          comfort: happinessData.Comfort || '-',
          airService: happinessData.AirService || '-',
          food: happinessData.Food || '-',
          seatSpace: happinessData.SeatSpace || '-',
          seatWidth: happinessData.SeatWidth || '-',
          seatTilt: happinessData.SeatTilt || '-',
          media: happinessData.Media || '-',
          flightYear: happinessData.FlightYear || '-',
          seatLayout: happinessData.Seatlayout || '-',
          delayLabel: happinessData.ArrAvgDelaytime < 0 ? `平均提前${Math.abs(happinessData.ArrAvgDelaytime)}分钟` : `平均延误${happinessData.ArrAvgDelaytime}分钟`,
          luggage: happinessData.Luggage ? '请查看详情' : '-',
          luggageDetail: happinessData.Luggage || '',
          wifi: happinessData.WiFi || '-'
        };
        
        // 更新当前航班数据中的飞机信息
        if (happinessData.AircraftNumber) {
          currentFlight.value.aircraftNumber = happinessData.AircraftNumber;
        }
        if (happinessData.FtypeDetail) {
          currentFlight.value.aircraftType = happinessData.FtypeDetail;
        }
        if (happinessData.FlightYear) {
          currentFlight.value.flightYear = happinessData.FlightYear;
        }
        if (happinessData.aircraftDescribe) {
          currentFlight.value.aircraftDescribe = happinessData.aircraftDescribe;
        }
        if (happinessData.OntimeRate) {
          currentFlight.value.ontimeRate = happinessData.OntimeRate;
        }
        
        // 创建舒适度对比图表
        setTimeout(() => {
          createComfortChart(happinessResult.data);
        }, 100);
      }
    } catch (happinessError) {
      console.warn('获取航班幸福度失败:', happinessError);
      // 不影响主流程，继续执行
    }
  } catch (err) {
    console.error('更新仪表盘失败:', err);
    
    // 错误类型判断
    if (err.message?.includes('API Key') || err.message?.includes('403')) {
      error.value = err.message;
    } else if (err.message?.includes('网络') || err.message?.includes('timeout')) {
      error.value = "网络连接失败，请检查网络设置";
    } else if (err.message?.includes('404')) {
      error.value = "航班信息不存在，请检查航班号";
    } else if (err.message?.includes('500')) {
      error.value = "服务器错误，请稍后重试";
    } else {
      error.value = "查询失败，请检查网络和API配置";
    }
  } finally {
    isLoading.value = false;
  }
}, 500); // 500ms 防抖延迟

const handleResize = () => { // 监听窗口缩放事件
  // 仅处理Cesium地图的 resize
  if (viewer) {
    viewer.resize();
  }
  // 处理舒适度对比图表的 resize
  if (comfortChart) {
    comfortChart.resize();
  }
}

// 创建舒适度对比图表
const createComfortChart = (flightData) => {
  if (!comfortChartRef.value) return;
  
  // 销毁旧图表
  if (comfortChart) {
    comfortChart.dispose();
  }
  
  // 创建新图表
  comfortChart = echarts.init(comfortChartRef.value);
  
  // 准备数据
  const businessClass = flightData[0]; // 商务舱
  const economyClass = flightData[1]; // 经济舱
  
  // 将舒适度指标转换为数值
  const getComfortScore = (value) => {
    if (typeof value === 'number') return value;
    if (value === '舒适') return 9;
    if (value === '标准') return 7;
    if (value === '有限') return 5;
    if (value === '狭窄') return 3;
    return 5; // 默认值
  };
  
  // 图表选项
  const option = {
    backgroundColor: 'transparent',
    title: {
      text: '商务舱 vs 经济舱',
      textStyle: {
        color: '#0ea5e9',
        fontSize: 14
      },
      left: 'center'
    },
    legend: {
      data: ['商务舱', '经济舱'],
      textStyle: {
        color: '#475569'
      },
      bottom: 0
    },
    radar: {
      indicator: [
        {
          name: '座位空间',
          max: 10
        },
        {
          name: '座位宽度',
          max: 10
        },
        {
          name: '座位倾斜度',
          max: 10
        },
        {
          name: '舒适度',
          max: 10
        }
      ],
      shape: 'polygon',
      splitNumber: 5,
      axisName: {
        color: '#475569'
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(56, 189, 248, 0.3)'
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(56, 189, 248, 0.05)', 'rgba(56, 189, 248, 0.1)']
        }
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(56, 189, 248, 0.5)'
        }
      }
    },
    series: [
      {
        name: '舒适度对比',
        type: 'radar',
        data: [
          {
            value: [
              getComfortScore(businessClass.SeatSpace),
              getComfortScore(businessClass.SeatWidth),
              getComfortScore(businessClass.SeatTilt),
              businessClass.Comfort || 5
            ],
            name: '商务舱',
            areaStyle: {
              color: 'rgba(56, 189, 248, 0.3)'
            },
            lineStyle: {
              color: '#38bdf8',
              width: 2
            },
            itemStyle: {
              color: '#38bdf8'
            }
          },
          {
            value: [
              getComfortScore(economyClass?.SeatSpace || '狭窄'),
              getComfortScore(economyClass?.SeatWidth || '狭窄'),
              getComfortScore(economyClass?.SeatTilt || '有限'),
              economyClass?.Comfort || 5
            ],
            name: '经济舱',
            areaStyle: {
              color: 'rgba(253, 208, 0, 0.3)'
            },
            lineStyle: {
              color: '#fdd000',
              width: 2
            },
            itemStyle: {
              color: '#fdd000'
            }
          }
        ]
      }
    ]
  };
  
  // 设置图表选项
  comfortChart.setOption(option);
};

onMounted(async () => {
  // 1. 初始化 Cesium
  Cesium.Ion.defaultAccessToken = 'YOUR_CESIUM_ION_TOKEN_HERE';
  
  viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: Cesium.createWorldTerrain(),
    timeline: false, //隐藏时间线控件
    animation: false, //隐藏动画控件
    homeButton: false, //隐藏首页按钮
    sceneModePicker: true, //显示场景模式选择器按钮
    baseLayerPicker: true, //显示基础图层选择器按钮
    navigationHelpButton: false, //隐藏导航帮助按钮
    sceneMode: Cesium.SceneMode.COLUMBUS_VIEW //初始化为2.5D模式（兼容polyline渲染）
  });
  

  // 默认世界视角
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(0, 10, 35000000)
  });
  // 3. 监听窗口缩放
  window.addEventListener('resize', handleResize)
  
  // 4. 启动实时更新定时器
  updateTimer = setInterval(() => {
    // 触发组件更新，刷新计算属性
    currentFlight.value = { ...currentFlight.value }
  }, 60000) // 每分钟更新一次

  // 启动实时时钟
  updateCurrentTime()
  timeInterval = setInterval(updateCurrentTime, 1000)

  // 5. 初始更新数据
  if (flightNumber.value) {
    await updateDashboard()
  }
});


onUnmounted(() => { // 组件卸载时，移除事件监听和销毁Cesium实例
  window.removeEventListener('resize', handleResize)
  cleanCesium();
  if (viewer) {
    viewer.destroy();
    viewer = null;
  }
  // 清除定时器
  if (updateTimer) {
    clearInterval(updateTimer);
    updateTimer = null;
  }
  if (timeInterval) {
    clearInterval(timeInterval);
    timeInterval = null;
  }
})
</script>

<style scoped>   /* 样式层 */
  /* 1 新增增最层样式垂直排列 */
.page-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 撑满屏幕 */
  width: 100vw;
  overflow: hidden; /* 阐藏滚动条 */
}

/* 2. 新增总标题样式 - 浅色系 */
.global-header {
  height: 80px; /* 标题栏高度 */
  background: rgba(255, 255, 255, 0.9);
  border-bottom: 2px solid rgba(56, 189, 248, 0.3);
  display: flex; /* 标题栏垂直排列 */
  flex-direction: column; /* 标题栏垂直排列 */
  justify-content: center; /* 标题栏垂直居中 */
  align-items: center; /* 标题栏水平居中 */
  flex-shrink: 0; /* 极其重要：防止标题被地图挤压消失 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;      /* 宽度 100% */
  max-width: none;   /* 移除 1400px 的限制 */
  padding: 0 40px;   /* 增加一点左右内边距，防止紧贴屏幕边缘 */
}

.back-button {
  color: #0ea5e9;
  text-decoration: none;
  font-size: 0.9rem;
  padding: 8px 16px;
  border: 1.5px solid rgba(56, 189, 248, 0.5);
  border-radius: 10px;
  transition: all 0.3s ease;
  margin-left: 15px;
  background: rgba(56, 189, 248, 0.05);
}

.back-button:hover {
  background: rgba(56, 189, 248, 0.15);
  border-color: rgba(56, 189, 248, 0.7);
}

/* 顶部操作区 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* 顶部实时时钟 */
.header-time {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
}

.header-date {
  color: #1e3a5f;
  font-size: 0.95rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.header-divider {
  width: 1px;
  height: 18px;
  background: rgba(56, 189, 248, 0.35);
}

.header-clock {
  color: #0ea5e9;
  font-size: 1.15rem;
  font-weight: bold;
}

/* 顶部模式切换 */
.mode-switcher-small {
  display: flex;
  background: rgba(56, 189, 248, 0.08);
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.mode-button {
  padding: 6px 12px;
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mode-button:hover {
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
}

.mode-button.active {
  background: rgba(56, 189, 248, 0.15);
  color: #0ea5e9;
  box-shadow: none;
  font-weight: 600;
}

.global-header h1 {
  color: #0ea5e9;
  font-size: 2rem;
  margin: 0;
  /* 1. 核心修改：使用负边距向上拉动下方的 P 标签 */
  margin-bottom: -3px; 
  /* 2. 压缩行高，消除文字自带的上下留白 */
  line-height: 1.1;
  /* 3. 添加蓝色发光效果 */
  text-shadow: 0 0 15px rgba(14, 165, 233, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1);
  font-weight: 700;
  letter-spacing: 2px;
}

.global-header p {
  color: #64748b;
  font-size: 0.8rem;
  margin: 5px 0 0;
  /* 确保副标题没有顶部的额外间距 */
  line-height: 1.2;
  letter-spacing: 2px; /* 稍微增加字间距，让英文副标题更有质感 */
  font-weight: 400;
}

.main-container { /* 主容器 */
  display: flex;
  flex: 1; /* 重要：占据剩下所有高度，这样地球才有空间显示 */
  width: 100%;
  background-color: #000;
  overflow: hidden;
}

.detail-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* 1. 地图区域：动态宽度变化 */
.map-area {
  flex: 1; /* 初始占据剩余空间 */
  transition: all 0.5s ease;
  background-color: #000;
}

/* 2. 右侧面板：初始 30% */
.right-info-panel {
  width: 25%;
  position: relative;
  transition: all 0.5s ease;
  background: rgba(255, 255, 255, 0.92);
  border-left: 1px solid rgba(56, 189, 248, 0.25);
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 20px;
  overflow-y: auto; /* 右侧面板垂直滚动 */
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
}

/* 收缩状态下的面板 */
.detail-container.collapsed .right-info-panel {
  margin-right: -25%; /* 将面板完全推向屏幕右侧外 */
  pointer-events: none; /* 防止收起时遮挡地图交互 */
}

.detail-container.collapsed .map-area {
  width: 100%; /* 地图撑满 */
}

/* 3. 悬浮触发区域：关键点 - 收缩/展开按钮 */
.hover-trigger-area {
  position: absolute;
  left: calc(75% - 40px);
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0; /* 默认隐藏 */
  z-index: 10001;
  pointer-events: none;
  transition: all 0.3s ease;
}

/* 鼠标悬停到信息框时显示按钮 */
.detail-container:hover .hover-trigger-area {
  opacity: 1;
  pointer-events: auto;
}

/* 信息框收缩时，按钮在屏幕右边 */
.detail-container.collapsed .hover-trigger-area {
  left: calc(100% - 45px);
  opacity: 0; /* 收缩时也默认隐藏 */
}

/* 收缩状态下，鼠标悬停到屏幕右边时显示按钮 */
.detail-container.collapsed:hover .hover-trigger-area {
  opacity: 1;
  pointer-events: auto;
}

/* 收缩按钮样式 */
.collapse-btn {
  background: rgba(56, 189, 248, 0.8);
  border: 2px solid #38bdf8;
  color: white;
  width: 40px;
  height: 80px;
  border-radius: 10px 0 0 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: -4px 0 15px rgba(56, 189, 248, 0.4);
  font-size: 20px;
  font-weight: bold;
}

.collapse-btn:hover {
  background: rgba(56, 189, 248, 1);
  border-color: white;
  box-shadow: -4px 0 20px rgba(56, 189, 248, 0.6);
  transform: scale(1.05);
}

.arrow {
  font-size: 20px;
  font-weight: bold;
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 航班幸福度信息样式 */
.happiness-info {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 15px;
  margin-top: 20px;
}

.section-title {
  color: #0ea5e9;
  font-size: 1.1rem;
  margin-bottom: 15px;
  font-weight: 600;
  text-align: center;
  text-shadow: 0 0 8px rgba(14, 165, 233, 0.4);
}

.happiness-details {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
}

.info-item {
  flex: 1;
  min-width: calc(50% - 5px);
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(56, 189, 248, 0.1);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.info-item:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.4);
  transform: translateY(-2px);
}

.item-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.item-value {
  color: #fdd000;
  font-weight: 600;
  font-size: 0.9rem;
}

.happiness-score {
  color: #38bdf8;
  font-size: 1.1rem;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
}

/* 飞机描述样式 */
.aircraft-desc {
  font-size: 0.85rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.7);
  max-height: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  line-clamp: 4;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

/* --- 1. 航班信息头部 (标题与航班号同号) --- */
/* --- 1. 航班信息头部容器 - 浅色系 --- */
.flight-info {
  background: rgba(241, 245, 249, 0.8);
  border-radius: 12px;
  padding: 20px; /* 增加内边距 */
  width: 100%;   /* 确保占满侧边栏 */
  box-sizing: border-box;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(56, 189, 248, 0.15);
}

/* --- 2. 核心标题行布局 --- */
.info-header h3 {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
}

/* --- 3. 三个元素的分布逻辑 --- */
/* 左侧：标题 */
.label-text {
  color: #1e3a5f;
  font-size: 1.5rem;
  font-weight: 600;
  white-space: nowrap;
}

/* --- 4. 航班号样式 --- */
.airline-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.airline-logo-small {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  background: rgba(13, 110, 253, 0.06);
  border-radius: 8px;
  border: 1px solid rgba(13, 110, 253, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.airline-logo-small img {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

.company-name {
  color: #1e3a5f;
  font-size: 1rem;
  font-weight: 500;
}

.flight-main-line {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

/* 中间：航班号 (它会随屏幕在中间呼吸) */
.flight-no-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.flight-no {
  color: #0ea5e9; 
  font-size: 2.2rem; 
  font-family: 'Inter', 'Times New Roman', Times, serif;
  white-space: nowrap;
  letter-spacing: 2px;
  font-weight: bold;
}

/* 准点率样式 */
.ontime-rate {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: rgba(56, 189, 248, 0.1);
  border-radius: 20px;
  font-size: 0.8rem;
}

.rate-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  animation: pulse 2s infinite;
}

.rate-label {
  color: #64748b;
  font-size: 0.8rem;
}

.rate-value {
  color: #0ea5e9;
  font-weight: 600;
  font-size: 0.85rem;
}

/* 状态标签 */
.status-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

/* 幸福度勋章 */
.happiness-badge {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(14, 165, 233, 0.1));
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 10px;
  padding: 6px 12px;
  box-shadow: 0 2px 8px rgba(56, 189, 248, 0.1);
  animation: slideIn 0.5s ease-out;
  width: 100%;
  box-sizing: border-box;
  text-align: center;
  margin-top: 8px;
}

.delay-info {
  font-size: 0.9rem;
  letter-spacing: 1px;
  color: #475569;
  font-weight: 500;
}

/* 动画 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 舒适度对比图表容器 - 浅色系 */
.comfort-chart-container {
  background: rgba(241, 245, 249, 0.7);
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
  border: 1px solid rgba(56, 189, 248, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.chart-dom {
  width: 100%;
  height: 300px;
  margin-top: 15px;
}

/* 旅客须知 - 浅色系 */
.passenger-info {
  background: rgba(241, 245, 249, 0.7);
  border-radius: 12px;
  padding: 15px;
  margin-top: 20px;
  border: 1px solid rgba(56, 189, 248, 0.15);
}

.info-tags {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
}

.info-tag {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.15);
  transition: all 0.3s ease;
}

.info-tag:hover {
  background: rgba(56, 189, 248, 0.08);
  border-color: rgba(56, 189, 248, 0.3);
  transform: translateY(-2px);
}

.tag-icon {
  font-size: 1.2rem;
  min-width: 24px;
  text-align: center;
}

.tag-label {
  font-size: 0.9rem;
  color: #475569;
  min-width: 60px;
}

.tag-value {
  font-size: 0.9rem;
  color: #0ea5e9;
  font-weight: 600;
  flex: 1;
  text-align: right;
}

/* 飞机档案标题点击效果 */
.section-title {
  cursor: pointer;
  transition: all 0.3s ease;
}

.section-title:hover {
  color: #38bdf8;
  border-left-color: #38bdf8;
}

/* 航班幸福度详情悬浮页 */
.happiness-popover {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  z-index: 99998;
  animation: fadeIn 0.3s ease;
}

.popover-content {
  position: absolute;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 12px;
  padding: 20px;
  width: 400px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: visible;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  cursor: default;
}

.popover-content h4 {
  margin: 0 0 15px 0;
  color: #1e3a5f;
  font-size: 1.1rem;
  text-align: center;
  border-bottom: 1px solid rgba(56, 189, 248, 0.2);
  padding-bottom: 10px;
}

.popover-content .chart-dom {
  height: 300px;
}

/* 动画 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 悬浮页动画 */
.happiness-popover {
  animation: slideUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 飞机描述弹窗 */
.aircraft-desc-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  z-index: 99998;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  position: absolute;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(56, 189, 248, 0.5);
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80%;
  overflow: visible;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  animation: slideIn 0.3s ease;
}

/* 通用可拖拽弹窗样式 */
.draggable-modal {
  position: fixed !important;
  transform: translate(-50%, -50%);
  margin: 0;
  max-height: 85vh;
  overflow: visible;
  z-index: 100000;
}

.draggable-modal .modal-header,
.draggable-modal .luggage-modal-header,
.draggable-modal .popover-header {
  cursor: move;
  user-select: none;
  -webkit-user-select: none;
}

.draggable-modal .modal-header:active,
.draggable-modal .luggage-modal-header:active,
.draggable-modal .popover-header:active {
  cursor: grabbing;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(56, 189, 248, 0.3);
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(56, 189, 248, 0.05));
}

.modal-header h3 {
  margin: 0;
  color: #fdd000;
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover {
  color: white;
  background: rgba(239, 68, 68, 0.2);
}

.modal-body {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.modal-body p {
  margin: 0;
  color: #334155;
  line-height: 1.6;
  font-size: 0.95rem;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid rgba(56, 189, 248, 0.3);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.close-button {
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(56, 189, 248, 0.3);
}

.close-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(56, 189, 248, 0.5);
}

/* ========== 现代科技感行李额弹窗样式 ========== */

/* 遮罩层 */
.luggage-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  z-index: 99998;
  animation: modalFadeIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 弹窗内容 - 毛玻璃效果 */
.luggage-modal-content {
  position: absolute;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 16px;
  width: 90%;
  max-width: 540px;
  max-height: 85%;
  overflow: visible;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(56, 189, 248, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  animation: modalSlideUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 顶部发光边线 */
.luggage-modal-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(56, 189, 248, 0.6) 20%, 
    rgba(56, 189, 248, 0.8) 50%, 
    rgba(56, 189, 248, 0.6) 80%, 
    transparent 100%
  );
}

/* 弹窗头部 */
.luggage-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 24px;
  position: relative;
  top: 2px;
}

/* 顶部装饰线 */
.header-accent {
  position: absolute;
  top: 0;
  left: 24px;
  right: 24px;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(56, 189, 248, 0.4) 30%, 
    rgba(56, 189, 248, 0.8) 50%, 
    rgba(56, 189, 248, 0.4) 70%, 
    transparent 100%
  );
}

.luggage-modal-header h3 {
  margin: 0;
  color: #1e3a5f;
  font-size: 1.3rem;
  font-weight: 600;
  letter-spacing: 1px;
}

/* 现代关闭按钮 */
.close-btn-modern {
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.2);
  color: #64748b;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn-modern:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
  transform: rotate(90deg);
}

/* 弹窗主体 */
.luggage-modal-body {
  padding: 0px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 图表容器 */
.luggage-chart-wrapper {
  background: rgba(56, 189, 248, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(56, 189, 248, 0.15);
}

.luggage-chart-wrapper .chart-dom {
  height: 280px;
  margin: 0;
}

/* 备注文字 */
.luggage-note {
  text-align: center;
}

.luggage-note p {
  margin: 0;
  color: #94a3b8;
  font-size: 0.8rem;
  font-style: italic;
  letter-spacing: 0.5px;
}

/* 弹窗底部 */
.luggage-modal-footer {
  padding: 16px 30px;
  display: flex;
  justify-content: center;
}

/* 幽灵按钮 */
.close-btn-ghost {
  background: transparent;
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #64748b;
  padding: 9px 32px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 1px;
  position: relative;
  left: 20px;
}

.close-btn-ghost:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.95);
  transform: translateY(-1px);
}

/* 弹窗动画 */
@keyframes modalFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
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

/* 右侧：状态标签 (强制靠最右) */
.status-tag {
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: clamp(0.7rem, 1vw, 0.85rem);
  white-space: nowrap;
  border: 1.5px solid;
  text-shadow: 0 0 5px;
  transition: all 0.3s ease;
  animation: status-glow 2s ease-in-out infinite;
}

.company-name {
  font-size: 1.1rem;
  color: #1e3a5f;
  white-space: nowrap;
  width: 100%;
  font-weight: 500;
  letter-spacing: 1px;
}

.flight-main-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 10px;
}

.flight-status-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ontime-rate {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rate-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #52C41A;
  box-shadow: 0 0 4px rgba(82, 196, 26, 0.6);
}

.rate-label {
  font-size: 0.9rem;
  color: #475569;
  font-weight: 500;
}

.rate-value {
  font-size: 1rem;
  color: #0ea5e9;
  font-weight: bold;
}

.section-title {
  color: #0ea5e9;
  font-size: 1.1rem;
  margin: 20px 0 10px;
  border-left: 4px solid #0ea5e9;
  padding-left: 10px;
  text-shadow: 0 0 8px rgba(14, 165, 233, 0.4);
}

.service-info,
.aircraft-info,
.contact-info,
.happiness-info,
.passenger-info {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 15px;
  margin-top: 20px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.2);
  border: 1px solid rgba(14, 165, 233, 0.1);
}

.service-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.flight-monitor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1px;
  background: rgba(203, 218, 153, 0.1);
  padding: 1px;
  border-radius: 10px;
  overflow: hidden;
  margin: 10px 0;
}

.aircraft-details {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 0;
  padding: 0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.aircraft-details .info-item {
  display: flex;
  flex-direction: column;
  border-radius: 0;
  border: none;
  margin: 0;
  padding: 0;
}

.aircraft-details .info-item .item-label {
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  border-radius: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.aircraft-details .info-item:last-child .item-label {
  border-right: none;
}

.aircraft-details .info-item .item-value {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 0;
}

.aircraft-details .info-item:last-child .item-value {
  border-right: none;
}

.contact-button {
  display: inline-block;
  background: rgba(56, 189, 248, 0.1);
  color: #0ea5e9;
  text-decoration: none;
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.3);
  transition: all 0.3s ease;
  margin-top: 10px;
}

.contact-button:hover {
  background: rgba(56, 189, 248, 0.2);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
}

.seat-number {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.seat-number:hover {
  color: #00E5FF;
}

.edit-icon {
  font-size: 0.8rem;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.seat-number:hover .edit-icon {
  opacity: 1;
  transform: scale(1.1);
}

/* 管家悬浮条 - 浅色系 */
.管家悬浮条 {
  background: rgba(56, 189, 248, 0.1);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 15px;
  border-left: 4px solid;
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.departure-reminder {
  border-left-color: #f97316;
  background: rgba(249, 115, 22, 0.08);
}

.arrival-reminder {
  border-left-color: #38bdf8;
  background: rgba(56, 189, 248, 0.08);
}

.flight-reminder {
  border-left-color: #ec4899;
  background: rgba(236, 72, 153, 0.08);
}

.reminder-icon {
  font-size: 1.2rem;
  margin-right: 10px;
}

.reminder-text {
  color: #1e3a5f;
  font-size: 0.95rem;
  font-weight: 500;
}

/* 登机指引 */
.boarding-guide {
  display: block;
  font-size: 0.8rem;
  color: #475569;
  margin-top: 5px;
  padding: 5px 10px;
  background: rgba(56, 189, 248, 0.08);
  border-radius: 6px;
}

/* 小尺寸联系按钮 */
.contact-button.small {
  padding: 4px 12px;
  font-size: 0.8rem;
  margin-top: 0;
}

/* 测试数据模式提示 */
.mock-mode-indicator {
  background: rgba(255, 204, 0, 0.1);
  color: #ffcc00;
  font-size: 0.8rem;
  padding: 5px 10px;
  border-radius: 6px;
  text-align: center;
  margin-top: 15px;
  border: 1px solid rgba(255, 204, 0, 0.3);
}

/* 航段切换器样式 */
.segment-switcher {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding: 10px;
  background: rgba(56, 189, 248, 0.08);
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.15);
}

.segment-label {
  color: #64748b;
  font-size: 0.9rem;
  white-space: nowrap;
  font-weight: 500;
}

.segment-buttons {
  display: flex;
  gap: 5px;
  flex: 1;
}

.segment-button {
  flex: 1;
  padding: 6px 12px;
  background: rgba(56, 189, 248, 0.05);
  border: 1px solid rgba(56, 189, 248, 0.2);
  color: #64748b;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.segment-button:hover {
  background: rgba(56, 189, 248, 0.12);
  color: #1e3a5f;
  border-color: rgba(56, 189, 248, 0.3);
}

.segment-button.active {
  background: rgba(14, 165, 233, 0.15);
  color: #0ea5e9;
  border-color: rgba(14, 165, 233, 0.4);
  box-shadow: 0 0 8px rgba(14, 165, 233, 0.2);
  font-weight: 600;
}

/* 场景化提醒通栏 */
.status-notice-bar {
  width: 100%;
  margin-top: 15px;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  color: rgba(255, 240, 200, 0.9);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.notice-icon {
  font-size: 1rem;
}

.notice-text {
  flex: 1;
  line-height: 1.3;
}

/* 次要指引信息 */
.secondary-guide {
  width: 100%;
  margin-top: 5px;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(56, 189, 248, 0.08);
  color: #334155;
  font-size: 0.85rem;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid rgba(56, 189, 248, 0.15);
}

.guide-text {
  line-height: 1.3;
  display: block;
  width: 100%;
  text-align: center;
}

/* 平滑过渡效果 */
.secondary-guide, .管家悬浮条 {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.secondary-guide-enter-active,
.secondary-guide-leave-active {
  transition: all 0.5s ease;
}

.secondary-guide-enter-from,
.secondary-guide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 装饰性分割线 */
.divider {
  border: none;
  border-top: 1px solid rgba(56, 189, 248, 0.2);
  margin: 15px 0;
}

/* --- 2. 航程路径与天气 (左右分布) - 浅色系 --- */
.route-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  text-align: center;
}

.route-info.has-stopover {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.city-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  text-align: center;
}

.city-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-height: 100px;
  justify-content: space-between;
}

.airport-code {
  font-size: clamp(1.4rem, 3vw, 2.2rem);
  font-weight: bold;
  color: #0ea5e9;
  margin-bottom: 4px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.airport-code:hover {
  color: #38bdf8;
  text-shadow: 0 0 8px rgba(56, 189, 248, 0.3);
}

.airport-name {
  font-size: clamp(0.9rem, 1.5vw, 1.1rem);
  color: #1e3a5f;
  font-weight: 500;
  margin-bottom: 4px;
  text-align: center;
  transition: all 0.3s ease;
}

.city-name {
  font-size: clamp(1.2rem, 2vw, 1.6rem);
  font-weight: bold;
  color: #1e3a5f;
  margin-bottom: 4px;
  text-align: center;
}

.city-name-eng {
  font-size: clamp(0.85rem, 1.2vw, 1rem);
  color: #64748b;
  margin-bottom: 8px;
  text-align: center;
  font-weight: 500;
}

/* 经停航班的字体大小调整 */
.route-info.has-stopover .airport-code {
  font-size: clamp(1.2rem, 2.5vw, 1.8rem);
}

.route-info.has-stopover .airport-name {
  font-size: clamp(0.7rem, 1.2vw, 0.9rem);
}

/* 经停航班的间距调整 */
.route-info.has-stopover {
  gap: 5px;
}

.route-info.has-stopover .route-arrow.small-arrow {
  font-size: 1rem;
  margin: 0 3px;
}

.terminal {
  font-size: 0.7rem;
  color: #1e3a5f;
  font-weight: 600;
  background: rgba(56, 189, 248, 0.12);
  padding: 1px 6px;
  border-radius: 8px;
  margin-bottom: 4px;
  text-align: center;
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.terminal.stopover-terminal {
  color: #c2410c;
  background: rgba(249, 115, 22, 0.12);
  border: 1px solid rgba(249, 115, 22, 0.35);
}

.weather-text {
  font-size: 0.75rem;
  color: #334155;
  font-weight: 500;
  margin-top: 2px;
  text-align: center;
}

.route-arrow {
  font-size: 1.4rem;
  color: #38bdf8;
  filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.4));
  animation: plane-float 3s ease-in-out infinite;
  margin: 0 15px;
}

.route-arrow.small-arrow {
  font-size: 1.0rem;
  margin: 0 5px;
}

/* --- 3. 底部详细数据行 (左右对齐) - 浅色系 --- */
/* 1. 大框容器：2x2 网格布局 */
.more-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px; /* 制造精细的网格分割线效果 */
  background: rgba(56, 189, 248, 0.15); /* 分割线颜色 */
  padding: 1px; /* 分割线粗细 */
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(56, 189, 248, 0.2);
  margin-top: 20px;
}

/* 2. 每一个小格子 */
.info-item {
  display: flex;
  flex-direction: column; /* 标题和内容上下堆叠 */
  align-items: center;    /* 水平居中 */
  justify-content: center;
  padding: 0 !important;   /* 清除原有内边距 */
  border-radius: 10px;
  overflow: hidden;        /* 确保背景色不溢出圆角 */
  background: rgba(255, 255, 255, 0.6); /* 每个小格子的半透明背景 */
  transition: background 0.3s;
}

.info-item:hover {
  background: rgba(56, 189, 248, 0.08);
}

/* 3. 小标题：增加独立背景色 */
.item-label {
  width: 100%;
  background: rgba(56, 189, 248, 0.08); /* 标题背景色，浅色半透明 */
  padding: 6px 0;
  font-size: 0.75rem;
  color: #64748b;      /* 标题颜色 */
  text-align: center;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 4. 内容部分：居中并加粗 */
.item-value {
  width: 100%;
  padding: 12px 0;
  font-size: clamp(0.8rem, 2vw, 1.1rem);
  font-weight: 600;
  color: #1e3a5f;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 悬浮效果：增加交互感 */
.info-item:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 229, 255, 0.1);
  transition: all 0.3s ease;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(203, 218, 153, 0.3);
  border-top: 3px solid #f4eac5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  text-align: center;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.error-state p {
  color: #f4eac5;
  margin-bottom: 20px;
  font-size: 1rem;
}

.retry-button {
  background: rgba(203, 218, 153, 0.2);
  color: #f4eac5;
  border: 1px solid #f4eac5;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-button:hover {
  background: rgba(203, 218, 153, 0.4);
}

/* 无数据状态 */
.no-data-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  text-align: center;
}

.no-data-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.no-data-state p {
  color: #f4eac5;
  font-size: 1rem;
}

.panel-header h2 { /* 右侧面板标题 */
  color: #f4eac5;
  font-size: 1.5rem;
}

.panel-header p { /* 右侧面板副标题 */
  color: #718096;
  font-size: 0.8rem;
}

/* 图表卡片 */
.chart-card {
  background: rgba(255, 255, 255, 0.123);
  border-radius: 8px;
  padding: 15px;
  flex-shrink: 0; /* 防止被挤压 */
}

.chart-title {
  color: #fff;
  margin-bottom: 10px;
  font-size: 1rem;
  border-left: 4px solid #f4eac5; 
  padding-left: 10px;
}

.chart-dom {
  height: 250px; /* 必须给 ECharts 固定高度 */
  width: 100%;
}

@keyframes plane-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
@keyframes status-glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(245, 210, 97, 0.2);
    border-color: rgba(245, 210, 97, 0.3);
  }
  50% {
    box-shadow: 0 0 15px rgba(245, 210, 97, 0.6); /* 最亮时的光晕 */
    border-color: rgba(245, 210, 97, 0.8);      /* 最亮时的边框 */
  }
}
@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
  }
  
  #cesiumContainer {
    width: 100%;
    height: 60%;
  }
  
  .charts-panel {
    width: 100%;
    height: 40%;
  }
  
  .header-content {
    flex-direction: column;
    gap: 10px;
    padding: 10px;
  }
  
  .global-header {
    height: auto;
    padding: 15px 0;
  }

  .header-time {
    display: none;
  }
}

/* 视角切换按钮 */
.view-toggle-btn {
  position: fixed;
  bottom: 8%;
  left: 35%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(56, 189, 248, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(56, 189, 248, 0.4);
  z-index: 1000;
}

.view-toggle-btn:hover {
  background: rgba(56, 189, 248, 1);
  transform: translateX(-50%) translateY(-2px);
  box-shadow: 0 6px 20px rgba(56, 189, 248, 0.5);
}

.view-icon {
  font-size: 1.2rem;
}

.view-label {
  min-width: 32px;
  text-align: center;
}

/* 座位选择弹窗 */
.seat-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  z-index: 99998;
  animation: fadeIn 0.3s ease;
}

.seat-selector-content {
  position: fixed !important;
  transform: translate(-50%, -50%);
  width: 400px;
  max-width: 90vw;
  height: 72vh;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.seat-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(56, 189, 248, 0.08);
  border-bottom: 1px solid rgba(56, 189, 248, 0.2);
  cursor: move;
}

.seat-selector-header h3 {
  margin: 0;
  color: #0ea5e9;
  font-size: 1.1rem;
  font-weight: 600;
  text-shadow: 0 0 8px rgba(14, 165, 233, 0.3);
}

.seat-selector-body {
  padding: 20px;
}

.seat-chart {
  width: 100%;
  height: 450px;
  background: rgba(241, 245, 249, 0.5);
  border-radius: 8px;
}

.seat-legend {
  display: flex;
  justify-content: center;
  gap: 25px;
  margin-top: 15px;
  margin-bottom: -10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 0.85rem;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.legend-color.available {
  background: rgba(56, 189, 248, 0.15);
  border-color: rgba(56, 189, 248, 0.3);
}

.legend-color.taken {
  background: rgba(239, 68, 68, 0.4);
  border-color: rgba(239, 68, 68, 0.6);
}

.legend-color.selected {
  background: #0ea5e9;
}

.seat-selector-footer {
  padding: 15px 20px;
  background: rgba(56, 189, 248, 0.05);
  border-top: 1px solid rgba(56, 189, 248, 0.15);
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.selected-seats-info {
  display: flex;
  align-items: center;
  position: relative;
  top: -3px;
}

.seat-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 12px;
}

.confirm-btn {
  padding: 8px 20px;
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(56, 189, 248, 0.3);
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.5);
  transform: translateY(-1px);
}

@media (max-width: 576px) {
  .seat-selector-content {
    width: 95vw;
  }
  
  .seat-chart {
    height: 250px;
  }
  
  .seat-legend {
    flex-wrap: wrap;
    gap: 15px;
  }
}

/* 机场信息弹窗样式 */
.airport-info-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  z-index: 99998;
  animation: modalFadeIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  pointer-events: none; /* 不阻止点击事件传递到地图 */
}

.airport-info-modal {
  position: absolute;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 16px;
  width: 90%;
  max-width: 420px;
  max-height: 85%;
  overflow: visible;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(56, 189, 248, 0.1);
  animation: modalSlideUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  pointer-events: auto; /* 弹窗本身可交互 */
}

.airport-info-modal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(56, 189, 248, 0.6) 20%, 
    rgba(56, 189, 248, 0.8) 50%, 
    rgba(56, 189, 248, 0.6) 80%, 
    transparent 100%
  );
}

/* 左侧关闭按钮 - 覆盖在Cesium图层上 */
.modal-close-left {
  position: absolute;
  left: -48px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 80px;
  background: rgba(239, 68, 68, 0.85);
  border: 2px solid rgba(239, 68, 68, 0.6);
  border-radius: 10px 0 0 10px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: -4px 0 15px rgba(239, 68, 68, 0.3);
  z-index: 10001;
}

.modal-close-left:hover {
  background: rgba(239, 68, 68, 1);
  border-color: white;
  box-shadow: -4px 0 20px rgba(239, 68, 68, 0.5);
  transform: translateY(-50%) scale(1.05);
}

.modal-close-left svg {
  width: 24px;
  height: 24px;
}

.airport-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 24px;
  position: relative;
  top: 2px;
}

.airport-info-header h3 {
  margin: 0;
  color: #1e3a5f;
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: 1px;
}

.airport-info-body {
  padding: 20px 24px;
}

.airport-main-info {
  text-align: center;
  margin-bottom: 20px;
}

.airport-code {
  font-size: 2.5rem;
  font-weight: 700;
  color: #0ea5e9;
  letter-spacing: 4px;
  text-shadow: 0 0 15px rgba(14, 165, 233, 0.3);
}

/* 机场信息弹窗中的机场名称 */
.airport-info-modal .airport-name {
  font-size: 1.1rem;
  color: #1e3a5f;
  font-weight: 500;
  margin-top: 8px;
}

.airport-city {
  font-size: 0.9rem;
  color: #64748b;
  margin-top: 4px;
}

.airport-type-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 20px;
}

.airport-type-badge.departure {
  background: rgba(14, 165, 233, 0.12);
  color: #0ea5e9;
  border: 1px solid rgba(14, 165, 233, 0.3);
}

.airport-type-badge.stopover {
  background: rgba(249, 115, 22, 0.12);
  color: #ea580c;
  border: 1px solid rgba(249, 115, 22, 0.3);
}

.airport-type-badge.arrival {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.airport-weather {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: rgba(56, 189, 248, 0.08);
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid rgba(56, 189, 248, 0.15);
}

.weather-icon {
  font-size: 2.5rem;
}

.weather-info {
  flex: 1;
}

.weather-condition {
  font-size: 1rem;
  color: #1e3a5f;
  font-weight: 500;
  margin-bottom: 8px;
}

.weather-details {
  display: flex;
  gap: 15px;
  font-size: 0.85rem;
  color: #475569;
}

.weather-details span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.airport-coordinates {
  display: flex;
  gap: 20px;
  justify-content: center;
  padding-top: 15px;
  border-top: 1px solid rgba(56, 189, 248, 0.2);
}

.coord-item {
  text-align: center;
}

.coord-label {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-bottom: 4px;
}

.coord-value {
  font-size: 1rem;
  color: #1e3a5f;
  font-family: 'Courier New', monospace;
  font-weight: 500;
}

.airport-info-footer {
  padding: 15px 24px;
  display: flex;
  justify-content: center;
  gap: 12px;
  background: rgba(56, 189, 248, 0.05);
  border-top: 1px solid rgba(56, 189, 248, 0.15);
}

.detail-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
}

.detail-btn:hover {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(56, 189, 248, 0.4);
}

.close-btn-ghost {
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.2);
  color: #475569;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn-ghost:hover {
  background: rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.3);
  color: #1e293b;
}

.detail-btn:active {
  transform: translateY(0);
}

.draggable-modal .airport-info-header {
  cursor: move;
  user-select: none;
  -webkit-user-select: none;
}

.draggable-modal .airport-info-header:active {
  cursor: grabbing;
}
</style>