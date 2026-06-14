<template>
  <div class="history-trip-container">
    <div class="stars"></div>
    <div class="flight-paths">
      <div class="path p1"></div>
      <div class="path p2"></div>
    </div>

    <header class="cyber-header">
      <div class="header-left">
        <router-link to="/" class="back-btn">
          <span class="back-icon">←</span>
          返回首页
        </router-link>
        <h2>历史行程管理</h2>
      </div>
      <button class="add-trip-btn" @click="showAddForm = true">
        <span class="add-icon">+</span> 添加行程
      </button>
    </header>

    <main class="main-content">
      <div class="tab-switcher">
        <button :class="{ active: activeTab === 'upcoming' }" @click="activeTab = 'upcoming'">
          待出行
          <span class="count-badge">{{ upcomingTrips.length }}</span>
        </button>
        <button :class="{ active: activeTab === 'completed' }" @click="activeTab = 'completed'">
          已结束
          <span class="count-badge">{{ completedTrips.length }}</span>
        </button>
      </div>

      <div v-if="filteredTrips.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p class="empty-title">暂无{{ activeTab === 'upcoming' ? '待出行' : '已结束' }}行程</p>
        <p class="empty-desc">添加您的航班行程，系统将自动获取航班信息</p>
      </div>

      <div v-else class="trips-list">
        <div v-for="trip in filteredTrips" :key="trip._id" class="trip-card">
          <div class="trip-header">
            <div class="trip-date">
              <span class="calendar-icon">📅</span>
              <span>{{ trip.flightDate }}</span>
            </div>
            <div class="trip-actions-header">
              <span v-if="trip.isStopover" class="stopover-tag">经停</span>
              <button class="icon-btn" @click="confirmDelete(trip._id)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="trip-body">
            <div class="flight-main-info">
              <div class="airline-info">
                <span class="airline-badge">
                  <img :src="getAirlineLogoSrcWithFallback(trip)" :alt="trip.airline" class="airline-logo-img" @error="handleLogoError($event, trip)" />
                </span>
                <span class="airline-name">{{ trip.airline }}</span>
              </div>
              <span class="flight-no">{{ trip.flightNo }}</span>
            </div>

            <!-- 获取当前选中航段 -->
            <div class="flight-route">
              <div class="airport-block dep">
                <span class="time">{{ trip.depTime }}</span>
                <span class="airport">{{ trip.depAirport }}</span>
                <span class="airport-code">{{ trip.depAirportCode }}</span>
              </div>
              <div class="route-arrow">
                <span class="line"></span>
                <span class="plane-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
                  </svg>
                </span>
                <span class="line"></span>
              </div>
              <div class="airport-block arr">
                <span class="time">{{ trip.arrTime }}</span>
                <span class="airport">{{ trip.arrAirport }}</span>
                <span class="airport-code">{{ trip.arrAirportCode }}</span>
              </div>
            </div>

            <!-- 经停航段选择器 -->
            <div v-if="trip.isStopover && trip.segments && trip.segments.length > 0" class="stopover-segments">
              <div class="segment-label">
                <span class="label-icon">🛬</span>
                <span>切换航段</span>
              </div>
              <div class="segments-list">
                <div 
                  v-for="(segment, index) in trip.segments" 
                  :key="index"
                  class="segment-item"
                  :class="{ active: trip.selectedSegment === index }"
                  @click="selectSegment(trip, index)"
                >
                  <div class="segment-number">{{ index + 1 }}</div>
                  <div class="segment-info">
                    <div class="segment-route">
                      <span class="seg-city">{{ segment.depAirport }}</span>
                      <span class="seg-arrow">→</span>
                      <span class="seg-city">{{ segment.arrAirport }}</span>
                    </div>
                    <div class="segment-times">
                      <span class="seg-time">{{ segment.depTime }}</span>
                      <span class="seg-time">{{ segment.arrTime }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="trip-notes-area">
              <textarea 
                v-model="trip.notes" 
                placeholder="添加备注..." 
                class="notes-input" 
                @blur="updateNotes(trip)"
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 添加行程弹窗 -->
    <div v-if="showAddForm" class="modal-overlay" @click.self="showAddForm = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>添加行程</h3>
          <button class="close-btn" @click="showAddForm = false">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form @submit.prevent="addTrip" class="add-form">
          <div class="input-group">
            <input type="text" v-model="form.flightNo" placeholder="例如：CA1234" class="form-input" required @input="form.flightNo = form.flightNo.toUpperCase()" />
            <label>航班号</label>
          </div>

          <div class="input-group">
            <input type="date" v-model="form.date" class="form-input" required />
            <label>出发日期</label>
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>
          <div v-if="success" class="success-message">{{ success }}</div>

          <button type="submit" class="submit-btn" :disabled="isLoading">
            {{ isLoading ? '查询中...' : '确认添加' }}
          </button>
        </form>
      </div>
    </div>

    <!-- 经停航班选择弹窗 -->
    <div v-if="showSegmentPicker" class="modal-overlay" @click.self="showSegmentPicker = false">
      <div class="modal-content segment-modal">
        <div class="modal-header">
          <h3>选择航段</h3>
          <button class="close-btn" @click="showSegmentPicker = false">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="segment-options">
          <div 
            v-for="(segment, index) in pendingTrip.segments" 
            :key="index"
            class="segment-option"
            @click="confirmAddSegment(index)"
          >
            <div class="option-header">
              <span class="option-number">{{ segment.label || `航段 ${index + 1}` }}</span>
              <span class="option-type">{{ index === 0 ? '起点→终点' : '经停段' }}</span>
            </div>
            <div class="option-route">
              <span class="opt-city">{{ segment.depAirport }}</span>
              <span class="opt-arrow">→</span>
              <span class="opt-city">{{ segment.arrAirport }}</span>
            </div>
            <div class="option-times">
              <span>{{ segment.depTime }}</span>
              <span>-</span>
              <span>{{ segment.arrTime }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 确认删除弹窗 -->
    <div v-if="showDeleteConfirm" class="confirm-overlay">
      <div class="confirm-dialog">
        <h3>确认删除</h3>
        <p>确定要删除这条行程记录吗？</p>
        <div class="confirm-actions">
          <button class="confirm-btn cancel" @click="showDeleteConfirm = false">取消</button>
          <button class="confirm-btn delete" @click="executeDelete">确认删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentUser } from '../utils/userStore'
import { getAirlineLogoSrc, getAirlineLogoPngSrc } from '../utils/airlineLogoMap'
import axios from 'axios'

const router = useRouter()
const activeTab = ref('upcoming')
const showAddForm = ref(false)
const showDeleteConfirm = ref(false)
const showSegmentPicker = ref(false)
const tripToDelete = ref(null)
const error = ref('')
const success = ref('')
const isLoading = ref(false)
const trips = ref([])
const pendingTrip = ref(null)

const form = ref({
  flightNo: '',
  date: new Date().toISOString().split('T')[0]
})

const upcomingTrips = computed(() => {
  return trips.value.filter(t => t.flightDate >= new Date().toISOString().split('T')[0])
})

const completedTrips = computed(() => {
  return trips.value.filter(t => t.flightDate < new Date().toISOString().split('T')[0])
})

const filteredTrips = computed(() => {
  return activeTab.value === 'upcoming' ? upcomingTrips.value : completedTrips.value
})

// 获取航司Logo图片路径 - 优先SVG，失败回退PNG
const getAirlineLogoSrcWithFallback = (trip) => {
  if (!trip) return '/assets/airline-logos/default.svg'
  const airlineCode = trip.airlineCode || ''
  const airlineName = trip.airline || ''
  const flightNo = trip.flightNo || ''
  return getAirlineLogoSrc(airlineCode, airlineName, flightNo)
}

// 航司Logo加载失败时的回退 - 尝试PNG
const handleLogoError = (event, trip) => {
  if (!trip) return
  const airlineCode = trip.airlineCode || ''
  const airlineName = trip.airline || ''
  const flightNo = trip.flightNo || ''
  const pngSrc = getAirlineLogoPngSrc(airlineCode, airlineName, flightNo)
  if (event.target.src !== pngSrc) {
    event.target.src = pngSrc
  } else {
    // PNG也失败了，显示fallback
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

const loadTrips = async () => {
  const user = getCurrentUser()
  if (!user) return

  try {
    const response = await axios.get('http://localhost:3001/api/trips', {
      params: { username: user.username }
    })
    if (response.data.code === 200) {
      trips.value = response.data.data.map(t => ({
        ...t,
        selectedSegment: t.selectedSegment ?? 0
      }))
    }
  } catch (err) {
    console.error('加载行程失败:', err)
  }
}

const addTrip = async () => {
  if (!form.value.flightNo || !form.value.date) {
    error.value = '请填写完整的航班信息'
    return
  }

  const user = getCurrentUser()
  if (!user) {
    router.push('/login')
    return
  }

  isLoading.value = true
  error.value = ''
  success.value = ''

  try {
    const response = await axios.post('http://localhost:3001/api/trips', {
      username: user.username,
      flightNo: form.value.flightNo.toUpperCase(),
      date: form.value.date
    })

    if (response.data.code === 200) {
      const trip = response.data.data
      
      if (trip.isStopover && trip.segments && trip.segments.length > 0) {
        pendingTrip.value = trip
        showSegmentPicker.value = true
      } else {
        success.value = '行程添加成功！'
        setTimeout(() => {
          showAddForm.value = false
          form.value = { flightNo: '', date: new Date().toISOString().split('T')[0] }
          loadTrips()
        }, 1000)
      }
    }
  } catch (err) {
    error.value = err.response?.data?.error || '添加行程失败'
  } finally {
    isLoading.value = false
  }
}

const confirmAddSegment = async (segmentIndex) => {
  const user = getCurrentUser()
  if (!user || !pendingTrip.value) return

  try {
    const segment = pendingTrip.value.segments[segmentIndex]
    
    const response = await axios.post('http://localhost:3001/api/trips/segment', {
      username: user.username,
      tripId: pendingTrip.value._id,
      segmentIndex,
      segment
    })

    if (response.data.code === 200) {
      showSegmentPicker.value = false
      pendingTrip.value = null
      success.value = '行程添加成功！'
      setTimeout(() => {
        showAddForm.value = false
        form.value = { flightNo: '', date: new Date().toISOString().split('T')[0] }
        loadTrips()
      }, 1000)
    }
  } catch (err) {
    error.value = '添加航段失败'
  }
}

const selectSegment = async (trip, segmentIndex) => {
  const user = getCurrentUser()
  if (!user) return

  const segment = trip.segments[segmentIndex]
  if (!segment) return

  trip.selectedSegment = segmentIndex
  trip.depAirport = segment.depAirport
  trip.depAirportCode = segment.depAirportCode
  trip.arrAirport = segment.arrAirport
  trip.arrAirportCode = segment.arrAirportCode
  trip.depTime = segment.depTime
  trip.arrTime = segment.arrTime
  if (segment.depDate) trip.flightDate = segment.depDate

  try {
    await axios.put(`http://localhost:3001/api/trips/${trip._id}`, {
      selectedSegment: segmentIndex,
      depAirport: segment.depAirport,
      depAirportCode: segment.depAirportCode,
      arrAirport: segment.arrAirport,
      arrAirportCode: segment.arrAirportCode,
      depTime: segment.depTime,
      arrTime: segment.arrTime
    }, {
      params: { username: user.username }
    })
  } catch (err) {
    console.error('更新航段失败:', err)
  }
}

const confirmDelete = (tripId) => {
  tripToDelete.value = tripId
  showDeleteConfirm.value = true
}

const executeDelete = async () => {
  const user = getCurrentUser()
  if (!user || !tripToDelete.value) return

  try {
    const response = await axios.delete(`http://localhost:3001/api/trips/${tripToDelete.value}`, {
      params: { username: user.username }
    })

    if (response.data.code === 200) {
      showDeleteConfirm.value = false
      tripToDelete.value = null
      loadTrips()
    }
  } catch (err) {
    error.value = '删除行程失败'
  }
}

const updateNotes = async (trip) => {
  const user = getCurrentUser()
  if (!user) return

  try {
    await axios.put(`http://localhost:3001/api/trips/${trip._id}`, {
      notes: trip.notes
    }, {
      params: { username: user.username }
    })
  } catch (err) {
    console.error('更新备注失败:', err)
  }
}

onMounted(() => {
  const user = getCurrentUser()
  if (!user) {
    router.push('/login')
    return
  }
  loadTrips()
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.history-trip-container {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #F0F4F8 0%, #E2E8F0 50%, #F0F4F8 100%);
  overflow: hidden;
}

.stars {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(1px 1px at 20% 30%, rgba(56, 189, 248, 0.4) 100%, transparent),
    radial-gradient(1px 1px at 40% 70%, rgba(14, 165, 233, 0.3) 100%, transparent),
    radial-gradient(1px 1px at 60% 40%, rgba(56, 189, 248, 0.4) 100%, transparent),
    radial-gradient(2px 2px at 80% 10%, rgba(14, 165, 233, 0.5) 100%, transparent),
    radial-gradient(1px 1px at 10% 90%, rgba(56, 189, 248, 0.3) 100%, transparent),
    radial-gradient(2px 2px at 90% 80%, rgba(14, 165, 233, 0.3) 100%, transparent);
  background-size: 300px 300px;
  opacity: 0.2;
}

.flight-paths {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0.1;
}

.path {
  position: absolute;
  border: 1px solid rgba(13, 110, 253, 0.4);
  border-radius: 50%;
}

.p1 { width: 800px; height: 300px; top: 10%; left: -10%; transform: rotate(-15deg); }
.p2 { width: 600px; height: 200px; bottom: 20%; right: -5%; transform: rotate(10deg); }

.cyber-header {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #FFFFFF;
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(13, 110, 253, 0.15);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #0D6EFD;
  text-decoration: none;
  font-size: 0.9rem;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
  border: 1px solid rgba(13, 110, 253, 0.2);
}

.back-btn:hover {
  color: #3D8BFD;
  background: rgba(13, 110, 253, 0.1);
  border-color: rgba(13, 110, 253, 0.4);
}

.back-icon {
  font-size: 1.1rem;
}

.cyber-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(90deg, #0ea5e9 0%, #38bdf8 60%, #0ea5e9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.add-trip-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #0D6EFD, #0B5ED7);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(13, 110, 253, 0.25);
}

.add-trip-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(13, 110, 253, 0.4);
}

.add-icon {
  font-size: 1.2rem;
  font-weight: 700;
}

.main-content {
  flex: 1;
  padding: 28px 24px;
  z-index: 5;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tab-switcher {
  display: flex;
  gap: 8px;
  margin-bottom: 28px;
  width: 100%;
  max-width: 1100px;
  padding: 0 16px;
}

.tab-switcher button {
  padding: 11px 22px;
  background: #FFFFFF;
  border: 1px solid rgba(108, 117, 125, 0.4);
  border-radius: 10px;
  color: #6C757D;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-switcher button.active {
  background: rgba(13, 110, 253, 0.15);
  border-color: rgba(13, 110, 253, 0.5);
  color: #0D6EFD;
  box-shadow: 0 0 20px rgba(13, 110, 253, 0.1);
}

.count-badge {
  background: rgba(212, 160, 21, 0.25);
  color: #D4A015;
  padding: 2px 9px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 12px;
  width: 100%;
  max-width: 500px;
}

.empty-icon {
  font-size: 4rem;
  opacity: 0.7;
  filter: drop-shadow(0 0 20px rgba(56, 189, 248, 0.3));
}

.empty-title {
  font-size: 1.4rem;
  color: #1e3a5f;
  font-weight: 600;
}

.empty-desc {
  color: #64748b;
  font-size: 0.95rem;
}

/* 行程列表 - 居中网格布局 */
.trips-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 16px;
}

.trip-card {
  background: #FFFFFF;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(13, 110, 253, 0.12);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.trip-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #0ea5e9, #38bdf8, transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.trip-card:hover::before {
  opacity: 1;
}

.trip-card:hover {
  border-color: rgba(13, 110, 253, 0.3);
  box-shadow: 0 8px 32px rgba(13, 110, 253, 0.08);
  transform: translateY(-2px);
}

.trip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.trip-date {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #D4A015;
  font-size: 0.9rem;
  font-weight: 600;
}

.calendar-icon {
  font-size: 1rem;
}

.trip-actions-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stopover-tag {
  background: linear-gradient(135deg, rgba(212, 160, 21, 0.2), rgba(212, 160, 21, 0.2));
  color: #D4A015;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid rgba(212, 160, 21, 0.3);
}

.icon-btn {
  background: transparent;
  border: none;
  color: #ADB5BD;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  color: #DC3545;
  background: rgba(220, 53, 69, 0.1);
}

.trip-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.flight-main-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(56, 189, 248, 0.08);
}

.airline-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.airline-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
  font-family: 'SF Mono', 'Consolas', monospace;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.airline-logo-img {
  width: 22px;
  height: 22px;
  object-fit: contain;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.logo-fallback {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 0.8rem;
  font-weight: 700;
  z-index: 3;
}

/* 各航空公司徽章颜色 */
.bg-red {
  background: linear-gradient(135deg, #EF4444, #DC2626);
}
.bg-blue {
  background: linear-gradient(135deg, #3B82F6, #2563EB);
}
.bg-red-dark {
  background: linear-gradient(135deg, #B91C1C, #991B1B);
}
.bg-gold {
  background: linear-gradient(135deg, #F59E0B, #D97706);
}
.bg-sky {
  background: linear-gradient(135deg, #0EA5E9, #0284C7);
}
.bg-sichuan {
  background: linear-gradient(135deg, #F97316, #EA580C);
}
.bg-purple {
  background: linear-gradient(135deg, #8B5CF6, #7C3AED);
}
.bg-orange {
  background: linear-gradient(135deg, #F97316, #EA580C);
}
.bg-green {
  background: linear-gradient(135deg, #22C55E, #16A34A);
}
.bg-teal {
  background: linear-gradient(135deg, #14B8A6, #0D9488);
}
.bg-indigo {
  background: linear-gradient(135deg, #6366F1, #4F46E5);
}
.bg-cyan {
  background: linear-gradient(135deg, #06B6D4, #0891B2);
}
.bg-emerald {
  background: linear-gradient(135deg, #10B981, #059669);
}
.bg-rose {
  background: linear-gradient(135deg, #F43F5E, #E11D48);
}
.bg-lime {
  background: linear-gradient(135deg, #84CC16, #65A30D);
}
.bg-amber {
  background: linear-gradient(135deg, #F59E0B, #D97706);
}
.bg-violet {
  background: linear-gradient(135deg, #8B5CF6, #7C3AED);
}
.bg-fuchsia {
  background: linear-gradient(135deg, #D946EF, #C026D3);
}
.bg-pink {
  background: linear-gradient(135deg, #EC4899, #DB2777);
}
.bg-coral {
  background: linear-gradient(135deg, #FB923C, #F97316);
}
.bg-default {
  background: linear-gradient(135deg, #64748B, #475569);
}

.airline-name {
  color: #64748b;
  font-size: 0.9rem;
}

.flight-no {
  font-size: 1.2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #0ea5e9, #38bdf8);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-family: 'SF Mono', 'Consolas', monospace;
}

.flight-route {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 16px;
  background: rgba(13, 110, 253, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(13, 110, 253, 0.1);
}

.airport-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.airport-block.dep .time {
  color: #0D6EFD;
}

.airport-block.arr {
  align-items: flex-end;
  text-align: right;
}

.airport-block.arr .time {
  color: #6F42C1;
}

.airport-block .time {
  font-size: 1.7rem;
  font-weight: 700;
  font-family: 'SF Mono', 'Consolas', monospace;
  line-height: 1.2;
}

.airport-block .airport {
  color: #212529;
  font-size: 0.95rem;
  font-weight: 600;
}

.airport-block .airport-code {
  color: #ADB5BD;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: 'SF Mono', 'Consolas', monospace;
  background: rgba(108, 117, 125, 0.15);
  padding: 1px 6px;
  border-radius: 4px;
  display: inline-block;
}

.route-arrow {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.route-arrow .line {
  width: 45px;
  height: 2px;
  background: linear-gradient(90deg, rgba(13, 110, 253, 0.5), rgba(111, 66, 193, 0.5));
}

.route-arrow .plane-icon {
  font-size: 1.2rem;
  color: #0D6EFD;
  filter: drop-shadow(0 0 6px rgba(13, 110, 253, 0.4));
}

.stopover-segments {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.segment-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #D4A015;
  font-size: 0.85rem;
  font-weight: 600;
}

.label-icon {
  font-size: 1rem;
}

.segments-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.segment-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(13, 110, 253, 0.04);
  border: 1px solid rgba(13, 110, 253, 0.1);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.segment-item:hover {
  border-color: rgba(13, 110, 253, 0.3);
  background: rgba(13, 110, 253, 0.08);
}

.segment-item.active {
  border-color: #0D6EFD;
  background: rgba(13, 110, 253, 0.12);
  box-shadow: 0 0 15px rgba(13, 110, 253, 0.08);
}

.segment-number {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(13, 110, 253, 0.3), rgba(14, 165, 233, 0.3));
  color: #0D6EFD;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
}

.segment-item.active .segment-number {
  background: linear-gradient(135deg, #0D6EFD, #0B5ED7);
  color: white;
}

.segment-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.segment-route {
  display: flex;
  align-items: center;
  gap: 8px;
}

.seg-city {
  color: #1e3a5f;
  font-size: 0.9rem;
  font-weight: 500;
}

.seg-city:last-child {
  color: #38bdf8;
}

.seg-arrow {
  color: #D4A015;
  font-size: 0.85rem;
  font-weight: 700;
}

.segment-times {
  display: flex;
  gap: 12px;
}

.seg-time {
  color: #0D6EFD;
  font-size: 0.85rem;
  font-family: 'SF Mono', 'Consolas', monospace;
  font-weight: 600;
}

.trip-notes-area {
  width: 100%;
}

.notes-input {
  width: 100%;
  padding: 10px 12px;
  background: rgba(240, 244, 248, 0.9);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 8px;
  color: #1e3a5f;
  font-size: 0.85rem;
  resize: vertical;
  min-height: 50px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.notes-input:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.2);
}

.notes-input::placeholder {
  color: #94a3b8;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #FFFFFF;
  border: 1px solid rgba(13, 110, 253, 0.2);
  border-radius: 16px;
  padding: 28px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 0 40px rgba(13, 110, 253, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  font-size: 1.15rem;
  background: linear-gradient(90deg, #0ea5e9 0%, #38bdf8 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: 700;
}

.close-btn {
  background: transparent;
  border: none;
  color: #ADB5BD;
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: #DC3545;
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-group label {
  font-size: 0.8rem;
  color: #0D6EFD;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.form-input {
  padding: 12px 14px;
  background: #FFFFFF;
  border: 1px solid rgba(13, 110, 253, 0.15);
  border-radius: 10px;
  color: #212529;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #D4A015;
  box-shadow: 0 0 15px rgba(212, 160, 21, 0.12);
}

.error-message {
  color: #DC3545;
  font-size: 0.85rem;
  padding: 8px 12px;
  background: rgba(220, 53, 69, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(220, 53, 69, 0.2);
}

.success-message {
  color: #198754;
  font-size: 0.85rem;
  padding: 8px 12px;
  background: rgba(25, 135, 84, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(25, 135, 84, 0.2);
}

.submit-btn {
  padding: 12px;
  background: linear-gradient(135deg, #0D6EFD, #0B5ED7);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(13, 110, 253, 0.25);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(13, 110, 253, 0.35);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.segment-modal {
  max-width: 450px;
}

.segment-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.segment-option {
  padding: 16px;
  background: rgba(13, 110, 253, 0.04);
  border: 1px solid rgba(13, 110, 253, 0.12);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.segment-option:hover {
  border-color: #0D6EFD;
  background: rgba(13, 110, 253, 0.1);
  box-shadow: 0 0 20px rgba(13, 110, 253, 0.08);
  transform: translateY(-1px);
}

.option-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.option-number {
  color: #0D6EFD;
  font-weight: 700;
  font-size: 0.9rem;
}

.option-type {
  color: #ADB5BD;
  font-size: 0.8rem;
  background: rgba(108, 117, 125, 0.15);
  padding: 2px 8px;
  border-radius: 4px;
}

.option-route {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.opt-city {
  color: #1e3a5f;
  font-size: 1.1rem;
  font-weight: 600;
}

.opt-city:last-child {
  color: #38bdf8;
}

.opt-arrow {
  color: #D4A015;
  font-size: 1rem;
  font-weight: 700;
}

.option-times {
  display: flex;
  gap: 10px;
  color: #6C757D;
  font-size: 0.9rem;
  font-family: 'SF Mono', 'Consolas', monospace;
}

.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-dialog {
  background: #FFFFFF;
  border: 1px solid rgba(13, 110, 253, 0.2);
  border-radius: 16px;
  padding: 28px;
  width: 90%;
  max-width: 360px;
  text-align: center;
  box-shadow: 0 0 40px rgba(13, 110, 253, 0.1);
}

.confirm-dialog h3 {
  color: #212529;
  margin-bottom: 10px;
  font-size: 1.1rem;
}

.confirm-dialog p {
  color: #6C757D;
  margin-bottom: 20px;
  font-size: 0.9rem;
}

.confirm-actions {
  display: flex;
  gap: 10px;
}

.confirm-btn {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.confirm-btn.cancel {
  background: transparent;
  border: 1px solid rgba(108, 117, 125, 0.4);
  color: #6C757D;
}

.confirm-btn.cancel:hover {
  border-color: #0D6EFD;
  color: #0D6EFD;
}

.confirm-btn.delete {
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid rgba(220, 53, 69, 0.4);
  color: #DC3545;
}

.confirm-btn.delete:hover {
  background: rgba(220, 53, 69, 0.3);
  border-color: rgba(220, 53, 69, 0.6);
}

@media (max-width: 640px) {
  .cyber-header {
    padding: 12px 16px;
  }
  
  .cyber-header h2 {
    font-size: 1rem;
  }
  
  .main-content {
    padding: 16px 12px;
  }
  
  .trips-list {
    grid-template-columns: 1fr;
    padding: 0;
    gap: 16px;
  }
  
  .flight-route {
    flex-direction: column;
    gap: 12px;
  }
  
  .route-arrow {
    transform: rotate(90deg);
  }
  
  .route-arrow .line {
    width: 30px;
  }
}
</style>
