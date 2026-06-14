<template>
  <div class="date-range-wrapper">
    <input type="text" class="date-range-input" :value="dateRangeDisplay" readonly @click="openPicker" />
    <div class="date-picker-popup" v-if="showPicker" :style="{ zIndex: currentZIndex }">
      <div class="date-picker-header">
        <button class="date-picker-nav" @click="prevMonth">&lt;&lt;</button>
        <span class="date-picker-title">{{ currentYear }}年{{ currentMonth }}月</span>
        <button class="date-picker-nav" @click="nextMonth">&gt;&gt;</button>
      </div>
      <div class="date-picker-weekdays">
        <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
      </div>
      <div class="date-picker-days">
        <span 
          v-for="(day, index) in calendarDays" 
          :key="index"
          :class="{
            'date-picker-day-empty': !day.date,
            'date-picker-day-selected': day.dateStr === tempStartDate || day.dateStr === tempEndDate,
            'date-picker-day-in-range': day.dateStr && day.dateStr > tempStartDate && day.dateStr < tempEndDate
          }"
          @click="selectDate(day)"
        >{{ day.date || '' }}</span>
      </div>
      <div class="date-picker-footer">
        <button class="date-picker-btn" @click="applyDateRange">确定</button>
        <button class="date-picker-btn cancel" @click="closePicker">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  startDate: {
    type: String,
    default: ''
  },
  endDate: {
    type: String,
    default: ''
  },
  baseZIndex: {
    type: Number,
    default: 1000
  }
});

const emit = defineEmits(['update:startDate', 'update:endDate', 'change', 'pickerOpen', 'pickerClose']);

const showPicker = ref(false);
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth() + 1);
const tempStartDate = ref(props.startDate);
const tempEndDate = ref(props.endDate);
const currentZIndex = ref(props.baseZIndex);

let zIndexInterval = null;

watch(() => props.startDate, (val) => {
  tempStartDate.value = val;
});

watch(() => props.endDate, (val) => {
  tempEndDate.value = val;
});

const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const days = [];
  
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push({ date: null, dateStr: '' });
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({ date: i, dateStr });
  }
  
  return days;
});

const dateRangeDisplay = computed(() => {
  if (!props.startDate || !props.endDate) return '选择日期范围';
  const start = new Date(props.startDate);
  const end = new Date(props.endDate);
  return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
});

const prevMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

const selectDate = (day) => {
  if (!day.dateStr) return;
  
  if (!tempStartDate.value) {
    tempStartDate.value = day.dateStr;
    tempEndDate.value = day.dateStr;
  } else if (!tempEndDate.value || tempStartDate.value === tempEndDate.value) {
    if (day.dateStr >= tempStartDate.value) {
      tempEndDate.value = day.dateStr;
    } else {
      tempEndDate.value = tempStartDate.value;
      tempStartDate.value = day.dateStr;
    }
  } else {
    tempStartDate.value = day.dateStr;
    tempEndDate.value = day.dateStr;
  }
};

const startZIndexUpdate = () => {
  if (zIndexInterval) return;
  
  zIndexInterval = setInterval(() => {
    if (showPicker.value) {
      currentZIndex.value = props.baseZIndex + Math.floor(Math.random() * 100);
    }
  }, 500);
};

const stopZIndexUpdate = () => {
  if (zIndexInterval) {
    clearInterval(zIndexInterval);
    zIndexInterval = null;
  }
};

const openPicker = () => {
  showPicker.value = true;
  currentZIndex.value = props.baseZIndex + 100;
  startZIndexUpdate();
  emit('pickerOpen');
};

const closePicker = () => {
  showPicker.value = false;
  stopZIndexUpdate();
  emit('pickerClose');
};

const applyDateRange = () => {
  if (tempStartDate.value && tempEndDate.value) {
    emit('update:startDate', tempStartDate.value);
    emit('update:endDate', tempEndDate.value);
    emit('change', {
      startDate: tempStartDate.value,
      endDate: tempEndDate.value
    });
  }
  closePicker();
};

onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
  stopZIndexUpdate();
});

const handleOutsideClick = (event) => {
  const wrapper = event.target.closest('.date-range-wrapper');
  if (!wrapper && showPicker.value) {
    closePicker();
  }
};
</script>

<style scoped>
.date-range-wrapper {
  position: relative;
  display: inline-block;
}

.date-range-input {
  padding: 3px;
  font-size: 12px;
  background: #f0f8fff3;
  border: 1px solid rgba(13, 110, 253, 0.35);
  border-radius: 4px;
  color: #495057;
  cursor: pointer;
  outline: none;
  min-width: 80px;
  max-width: 20px;
  text-align: center;
  position: relative;
  top: -1px;
}

.date-range-input:hover {
  border-color: rgba(13, 110, 253, 0.55);
}

.date-picker-popup {
  position: absolute;
  top: 100%;
  right: 0px;
  margin-top: 4px;
  background: #FFFFFF;
  border: 1px solid rgba(13, 110, 253, 0.35);
  border-radius: 6px;
  padding: 6px;
  min-width: 220px;
  z-index: 1000;
  box-shadow: 0 4px 16px rgba(13, 110, 253, 0.12);
}

.date-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 6px;
  margin-bottom: 4px;
  color: #1e3a5f;
  font-size: 12px;
}

.date-picker-nav {
  background: transparent;
  border: none;
  color: #1e3a5f;
  font-size: 14px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 3px;
}

.date-picker-nav:hover {
  background: rgba(13, 110, 253, 0.1);
  color: #0d6efd;
}

.date-picker-title {
  font-weight: 600;
  color: #1e3a5f;
}

.date-picker-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  margin-bottom: 3px;
}

.date-picker-weekdays span {
  text-align: center;
  font-size: 10px;
  color: #0d6efd;
  font-weight: 500;
  padding: 2px;
}

.date-picker-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}

.date-picker-days span {
  text-align: center;
  padding: 4px 3px;
  font-size: 11px;
  color: #495057;
  cursor: pointer;
  border-radius: 3px;
}

.date-picker-days span:hover:not(.date-picker-day-empty) {
  background: rgba(13, 110, 253, 0.12);
  color: #0d6efd;
}

.date-picker-day-empty {
  cursor: default;
  color: transparent;
}

.date-picker-day-selected {
  background: #0d6efd;
  color: #ffffff;
  font-weight: 600;
}

.date-picker-day-in-range {
  background: rgba(13, 110, 253, 0.15);
  color: #1e3a5f;
}

.date-picker-footer {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(13, 110, 253, 0.2);
}

.date-picker-btn {
  padding: 3px 10px;
  font-size: 10px;
  background: #9ad7fa;
  border: none;
  border-radius: 3px;
  color: #121635;
  cursor: pointer;
  font-weight: 500;
}

.date-picker-btn:hover {
  background: #0b5ed7;
}

.date-picker-btn.cancel {
  background: transparent;
  border: 1px solid rgba(13, 110, 253, 0.35);
  color: #495057;
}

.date-picker-btn.cancel:hover {
  background: rgba(13, 110, 253, 0.08);
  color: #0d6efd;
}
</style>
