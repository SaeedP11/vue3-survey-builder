<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import useLocalI18n from "../composables/useLocalI18n";
import { dateTimePicker } from "../locales";
import {
  compareJalaaliDates,
  formatGregorianDate,
  formatGregorianDateTime,
  formatJalaaliDate,
  formatJalaaliDateTime,
  getNowJalaali,
  JALAALI_MONTH_NAMES_EN,
  JALAALI_MONTH_NAMES_FA,
  jalaaliDayOfWeek,
  jalaaliMonthLength,
  pad2,
  parseDateOrDateTime,
  toGregorian,
  toPersianDigits,
  WEEKDAY_SHORT_EN,
  WEEKDAY_SHORT_FA,
} from "../utils/jalaali";

const props = defineProps<{
  question?: any;
  modelValue?: string;
  mode?: "date" | "datetime" | "datetime-local" | "time";
  dateFormat?: "jalali" | "gregorian";
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  min?: string;
  max?: string;
  getRef?: (el: any) => void;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  change: [value: string];
}>();

const { t } = useLocalI18n(dateTimePicker);
const { locale } = useI18n();

const containerRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const view = ref<"days" | "months" | "years">("days");

// Effective mode: "date", "datetime", or "time"
const effectiveMode = computed(() => {
  const m = props.mode || props.question?.inputType || "date";
  if (m === "datetime-local") return "datetime";
  return m as "date" | "datetime" | "time";
});

// Storage format: "jalali" or "gregorian"
const effectiveStorageFormat = computed(() => {
  return (
    props.dateFormat ||
    props.question?.dateFormat ||
    props.question?.survey?.dateFormat ||
    "jalali"
  );
});

const isRTL = computed(() => {
  if (props.question?.survey?.isRTL !== undefined) {
    return props.question.survey.isRTL;
  }
  return locale.value === "fa";
});

const isDisabled = computed(
  () => props.disabled ?? props.question?.isDisabledAttr ?? false,
);

const isReadOnly = computed(
  () =>
    props.readOnly ??
    props.question?.isReadOnlyAttr ??
    props.question?.isReadOnly ??
    false,
);

// Effective raw value
const currentValue = computed(() => {
  if (props.question && props.question.value !== undefined) {
    return props.question.value ?? "";
  }
  return props.modelValue ?? "";
});

// Active calendar and selection state
const currentYear = ref(1403);
const currentMonth = ref(1);
const selectedYear = ref<number | null>(null);
const selectedMonth = ref<number | null>(null);
const selectedDay = ref<number | null>(null);
const selectedHour = ref(12);
const selectedMinute = ref(0);

// Initialize or update from currentValue
function syncFromValue(val: unknown) {
  const parsed = parseDateOrDateTime(val);
  const now = getNowJalaali();
  if (parsed) {
    if (parsed.hasDate) {
      selectedYear.value = parsed.jy;
      selectedMonth.value = parsed.jm;
      selectedDay.value = parsed.jd;
      currentYear.value = parsed.jy;
      currentMonth.value = parsed.jm;
    } else {
      selectedYear.value = null;
      selectedMonth.value = null;
      selectedDay.value = null;
      currentYear.value = now.jy;
      currentMonth.value = now.jm;
    }
    if (parsed.hasTime) {
      selectedHour.value = parsed.hour;
      selectedMinute.value = parsed.minute;
    }
  } else {
    selectedYear.value = null;
    selectedMonth.value = null;
    selectedDay.value = null;
    currentYear.value = now.jy;
    currentMonth.value = now.jm;
    selectedHour.value = now.hour;
    selectedMinute.value = now.minute;
  }
}

watch(currentValue, (v) => syncFromValue(v), { immediate: true });

// Formatted display string
const displayValue = computed(() => {
  if (!currentValue.value) return "";
  const parsed = parseDateOrDateTime(currentValue.value);
  if (!parsed) return String(currentValue.value);

  let text = "";
  if (effectiveMode.value === "time") {
    text = `${pad2(parsed.hour)}:${pad2(parsed.minute)}`;
  } else if (effectiveMode.value === "datetime") {
    const dateStr = formatJalaaliDate(parsed.jy, parsed.jm, parsed.jd);
    text = `${dateStr} ${pad2(parsed.hour)}:${pad2(parsed.minute)}`;
  } else {
    text = formatJalaaliDate(parsed.jy, parsed.jm, parsed.jd);
  }

  return isRTL.value ? toPersianDigits(text) : text;
});

const renderedPlaceholder = computed(() => {
  if (props.placeholder) return props.placeholder;
  if (props.question?.renderedPlaceholder)
    return props.question.renderedPlaceholder;
  if (effectiveMode.value === "time") return t("selectTime");
  if (effectiveMode.value === "datetime") return t("selectDateTime");
  return t("selectDate");
});

// Month names and weekdays for current locale
const monthNames = computed(() =>
  isRTL.value ? JALAALI_MONTH_NAMES_FA : JALAALI_MONTH_NAMES_EN,
);

const currentMonthName = computed(() => {
  const idx = currentMonth.value - 1;
  return monthNames.value[idx] ?? "";
});

const weekdayHeaders = computed(() =>
  isRTL.value ? WEEKDAY_SHORT_FA : WEEKDAY_SHORT_EN,
);

// Min and Max constraints
const minConstraint = computed(() => {
  const m = props.min ?? props.question?.renderedMin ?? props.question?.min;
  return m ? parseDateOrDateTime(m) : null;
});

const maxConstraint = computed(() => {
  const m = props.max ?? props.question?.renderedMax ?? props.question?.max;
  return m ? parseDateOrDateTime(m) : null;
});

// Grid days for current month view
interface DayCell {
  day: number;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  isDisabled: boolean;
}

const calendarDays = computed(() => {
  const daysInMonth = jalaaliMonthLength(currentYear.value, currentMonth.value);
  const firstDay = jalaaliDayOfWeek(currentYear.value, currentMonth.value, 1);
  const now = getNowJalaali();

  const cells: DayCell[] = [];

  // Leading days from previous month
  const prevMonth = currentMonth.value === 1 ? 12 : currentMonth.value - 1;
  const prevYear =
    currentMonth.value === 1 ? currentYear.value - 1 : currentYear.value;
  const prevMonthLength = jalaaliMonthLength(prevYear, prevMonth);

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthLength - i;
    cells.push({
      day: d,
      isCurrentMonth: false,
      isSelected: false,
      isToday: false,
      isDisabled: true,
    });
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const isSelected =
      selectedYear.value === currentYear.value &&
      selectedMonth.value === currentMonth.value &&
      selectedDay.value === d;

    const isToday =
      now.jy === currentYear.value &&
      now.jm === currentMonth.value &&
      now.jd === d;

    let isDisabled = false;
    if (minConstraint.value) {
      if (
        compareJalaaliDates(
          currentYear.value,
          currentMonth.value,
          d,
          minConstraint.value.jy,
          minConstraint.value.jm,
          minConstraint.value.jd,
        ) < 0
      ) {
        isDisabled = true;
      }
    }
    if (maxConstraint.value) {
      if (
        compareJalaaliDates(
          currentYear.value,
          currentMonth.value,
          d,
          maxConstraint.value.jy,
          maxConstraint.value.jm,
          maxConstraint.value.jd,
        ) > 0
      ) {
        isDisabled = true;
      }
    }

    cells.push({
      day: d,
      isCurrentMonth: true,
      isSelected,
      isToday,
      isDisabled,
    });
  }

  // Trailing empty slots to complete 7-day row
  const remainder = cells.length % 7;
  if (remainder > 0) {
    const extra = 7 - remainder;
    for (let i = 1; i <= extra; i++) {
      cells.push({
        day: i,
        isCurrentMonth: false,
        isSelected: false,
        isToday: false,
        isDisabled: true,
      });
    }
  }

  return cells;
});

// Year selector options (range around current year)
const yearOptions = computed(() => {
  const center = currentYear.value;
  const years: number[] = [];
  for (let y = center - 50; y <= center + 50; y++) {
    years.push(y);
  }
  return years;
});

// Month navigation
function prevMonthNav() {
  if (currentMonth.value === 1) {
    currentYear.value--;
    currentMonth.value = 12;
  } else {
    currentMonth.value--;
  }
}

function nextMonthNav() {
  if (currentMonth.value === 12) {
    currentYear.value++;
    currentMonth.value = 1;
  } else {
    currentMonth.value++;
  }
}

function selectMonth(m: number) {
  currentMonth.value = m;
  view.value = "days";
}

function selectYear(y: number) {
  currentYear.value = y;
  view.value = "days";
}

// User day selection
function onDayClick(cell: DayCell) {
  if (cell.isDisabled || !cell.isCurrentMonth) return;
  selectedYear.value = currentYear.value;
  selectedMonth.value = currentMonth.value;
  selectedDay.value = cell.day;

  if (effectiveMode.value === "date") {
    applyValue();
    closePopover();
  }
}

// Time changes
function incrementHour() {
  selectedHour.value = (selectedHour.value + 1) % 24;
}

function decrementHour() {
  selectedHour.value = (selectedHour.value + 23) % 24;
}

function incrementMinute() {
  selectedMinute.value = (selectedMinute.value + 1) % 60;
}

function decrementMinute() {
  selectedMinute.value = (selectedMinute.value + 59) % 60;
}

// Set Today / Now
function setToday() {
  const now = getNowJalaali();
  selectedYear.value = now.jy;
  selectedMonth.value = now.jm;
  selectedDay.value = now.jd;
  currentYear.value = now.jy;
  currentMonth.value = now.jm;
  selectedHour.value = now.hour;
  selectedMinute.value = now.minute;

  if (effectiveMode.value === "date") {
    applyValue();
    closePopover();
  }
}

// Clear
function clearValue() {
  selectedYear.value = null;
  selectedMonth.value = null;
  selectedDay.value = null;
  commitValue("");
  closePopover();
}

// Formats and commits the chosen value
function applyValue() {
  const format = effectiveStorageFormat.value;

  if (effectiveMode.value === "time") {
    const val = `${pad2(selectedHour.value)}:${pad2(selectedMinute.value)}`;
    commitValue(val);
    closePopover();
    return;
  }

  if (
    selectedYear.value === null ||
    selectedMonth.value === null ||
    selectedDay.value === null
  ) {
    return;
  }

  let finalVal = "";
  if (format === "gregorian") {
    const g = toGregorian(
      selectedYear.value,
      selectedMonth.value,
      selectedDay.value,
    );
    if (effectiveMode.value === "datetime") {
      finalVal = formatGregorianDateTime(
        g.gy,
        g.gm,
        g.gd,
        selectedHour.value,
        selectedMinute.value,
        0,
      );
    } else {
      finalVal = formatGregorianDate(g.gy, g.gm, g.gd);
    }
  } else {
    // Jalali format
    if (effectiveMode.value === "datetime") {
      finalVal = formatJalaaliDateTime(
        selectedYear.value,
        selectedMonth.value,
        selectedDay.value,
        selectedHour.value,
        selectedMinute.value,
      );
    } else {
      finalVal = formatJalaaliDate(
        selectedYear.value,
        selectedMonth.value,
        selectedDay.value,
      );
    }
  }

  commitValue(finalVal);
  closePopover();
}

function commitValue(val: string) {
  if (props.question) {
    props.question.value = val;
    props.question.inputValue = val;
    if (typeof props.question.valueChanged === "function") {
      props.question.valueChanged();
    }
  }
  emit("update:modelValue", val);
  emit("change", val);
}

// Popover open/close controls
function togglePopover() {
  if (isDisabled.value || isReadOnly.value) return;
  if (isOpen.value) {
    closePopover();
  } else {
    openPopover();
  }
}

function openPopover() {
  if (isDisabled.value || isReadOnly.value) return;
  view.value = "days";
  syncFromValue(currentValue.value);
  isOpen.value = true;
}

function closePopover() {
  isOpen.value = false;
  view.value = "days";
}

// Click outside & Escape handling
function handleClickOutside(e: MouseEvent) {
  if (!isOpen.value) return;
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    closePopover();
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && isOpen.value) {
    closePopover();
  }
}

onMounted(() => {
  document.addEventListener("mousedown", handleClickOutside);
  document.addEventListener("keydown", handleKeydown);
  if (props.getRef && containerRef.value) {
    props.getRef(containerRef.value);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleClickOutside);
  document.removeEventListener("keydown", handleKeydown);
});

// Format digits for template display
function formatNum(num: number | string): string {
  return isRTL.value ? toPersianDigits(num) : String(num);
}
</script>

<template>
  <div
    ref="containerRef"
    class="fb-datetime-picker relative w-full select-none"
    :dir="isRTL ? 'rtl' : 'ltr'"
  >
    <!-- Display Input Container -->
    <div
      class="fb-datetime-picker__input-wrapper flex items-center w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 transition-colors focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500"
      :class="{
        'opacity-60 cursor-not-allowed': isDisabled,
        'cursor-pointer': !isDisabled && !isReadOnly,
      }"
      @click="togglePopover"
    >
      <input
        type="text"
        readonly
        :disabled="isDisabled"
        :value="displayValue"
        :placeholder="renderedPlaceholder"
        class="fb-datetime-picker__input w-full px-3 py-2 text-sm bg-transparent outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 cursor-pointer"
        :class="{ 'cursor-not-allowed': isDisabled }"
        aria-haspopup="dialog"
        :aria-expanded="isOpen"
      />

      <!-- Clear Icon -->
      <button
        v-if="displayValue && !isDisabled && !isReadOnly"
        type="button"
        class="fb-datetime-picker__clear p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors flex-none"
        aria-label="Clear"
        @click.stop="clearValue"
      >
        <svg
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <!-- Calendar / Clock Icon Button -->
      <button
        type="button"
        tabindex="-1"
        class="fb-datetime-picker__icon p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex-none"
        :disabled="isDisabled"
      >
        <svg
          v-if="effectiveMode === 'time'"
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <svg
          v-else
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
    </div>

    <!-- Dropdown / Popover Dialog -->
    <div
      v-if="isOpen"
      class="fb-datetime-picker__popover absolute z-50 mt-1 w-72 sm:w-80 max-w-[calc(100vw-2rem)] sm:max-w-none rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-3 text-sm animate-in fade-in"
      :class="isRTL ? 'right-0' : 'left-0'"
      role="dialog"
      aria-modal="true"
    >
      <!-- Date View Header (if mode is date or datetime) -->
      <div v-if="effectiveMode !== 'time'" class="fb-datetime-picker__header mb-3">
        <div class="flex items-center justify-between">
          <!-- Prev Month Button -->
          <button
            type="button"
            class="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            :title="t('prevMonth')"
            @click="prevMonthNav"
          >
            <svg
              class="w-4 h-4"
              :class="{ 'rotate-180': isRTL }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <!-- Month & Year Jump Buttons -->
          <div class="flex items-center gap-1 font-medium">
            <button
              type="button"
              class="px-2 py-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              :class="{ 'text-primary-600 dark:text-primary-400 font-bold': view === 'months' }"
              @click="view = view === 'months' ? 'days' : 'months'"
            >
              {{ currentMonthName }}
            </button>
            <button
              type="button"
              class="px-2 py-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              :class="{ 'text-primary-600 dark:text-primary-400 font-bold': view === 'years' }"
              @click="view = view === 'years' ? 'days' : 'years'"
            >
              {{ formatNum(currentYear) }}
            </button>
          </div>

          <!-- Next Month Button -->
          <button
            type="button"
            class="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            :title="t('nextMonth')"
            @click="nextMonthNav"
          >
            <svg
              class="w-4 h-4"
              :class="{ 'rotate-180': isRTL }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Month Selector View -->
      <div
        v-if="view === 'months' && effectiveMode !== 'time'"
        class="grid grid-cols-3 gap-1.5 py-2"
      >
        <button
          v-for="(name, idx) in monthNames"
          :key="idx"
          type="button"
          class="py-2 text-center rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium"
          :class="{
            'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold':
              currentMonth === idx + 1,
          }"
          @click="selectMonth(idx + 1)"
        >
          {{ name }}
        </button>
      </div>

      <!-- Year Selector View -->
      <div
        v-else-if="view === 'years' && effectiveMode !== 'time'"
        class="grid grid-cols-4 gap-1 py-2 max-h-56 overflow-y-auto"
      >
        <button
          v-for="y in yearOptions"
          :key="y"
          type="button"
          class="py-1.5 text-center rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium"
          :class="{
            'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold':
              currentYear === y,
          }"
          @click="selectYear(y)"
        >
          {{ formatNum(y) }}
        </button>
      </div>

      <!-- Days Grid View -->
      <div v-else-if="effectiveMode !== 'time'" class="fb-datetime-picker__calendar">
        <!-- Weekday Headers -->
        <div class="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-neutral-400 dark:text-neutral-500 mb-1">
          <span v-for="(dayName, i) in weekdayHeaders" :key="i">
            {{ dayName }}
          </span>
        </div>

        <!-- Days -->
        <div class="grid grid-cols-7 gap-1 text-center">
          <button
            v-for="(cell, i) in calendarDays"
            :key="i"
            type="button"
            :disabled="cell.isDisabled || !cell.isCurrentMonth"
            class="h-8 w-8 mx-auto flex items-center justify-center rounded-full text-xs transition-colors"
            :class="{
              'opacity-30 cursor-not-allowed': cell.isDisabled,
              'text-neutral-300 dark:text-neutral-700': !cell.isCurrentMonth,
              'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold':
                cell.isSelected,
              'border border-neutral-400 dark:border-neutral-500':
                cell.isToday && !cell.isSelected,
              'hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer':
                cell.isCurrentMonth && !cell.isDisabled && !cell.isSelected,
            }"
            @click="onDayClick(cell)"
          >
            {{ cell.isCurrentMonth ? formatNum(cell.day) : '' }}
          </button>
        </div>
      </div>

      <!-- Time Picker Controls (for datetime and time modes) -->
      <div
        v-if="effectiveMode === 'time' || effectiveMode === 'datetime'"
        class="fb-datetime-picker__time border-t border-neutral-200 dark:border-neutral-800 pt-3 mt-3"
      >
        <div class="flex items-center justify-center gap-3">
          <!-- Hour Stepper -->
          <div class="flex flex-col items-center">
            <button
              type="button"
              class="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
              @click="incrementHour"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
            <span class="text-base font-semibold py-1 w-8 text-center">
              {{ formatNum(pad2(selectedHour)) }}
            </span>
            <button
              type="button"
              class="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
              @click="decrementHour"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <span class="text-[10px] text-neutral-400">{{ t("hour") }}</span>
          </div>

          <span class="text-xl font-bold pb-4">:</span>

          <!-- Minute Stepper -->
          <div class="flex flex-col items-center">
            <button
              type="button"
              class="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
              @click="incrementMinute"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
            <span class="text-base font-semibold py-1 w-8 text-center">
              {{ formatNum(pad2(selectedMinute)) }}
            </span>
            <button
              type="button"
              class="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
              @click="decrementMinute"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <span class="text-[10px] text-neutral-400">{{ t("minute") }}</span>
          </div>
        </div>
      </div>

      <!-- Action Footer Buttons -->
      <div class="fb-datetime-picker__footer border-t border-neutral-200 dark:border-neutral-800 pt-2.5 mt-3 flex items-center justify-between text-xs">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="fb-datetime-picker__today text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium transition-colors"
            @click="setToday"
          >
            {{ effectiveMode === 'time' ? t("now") : t("today") }}
          </button>
          <button
            v-if="currentValue"
            type="button"
            class="fb-datetime-picker__clear-footer text-red-500 hover:text-red-600 font-medium transition-colors"
            @click="clearValue"
          >
            {{ t("clear") }}
          </button>
        </div>

        <button
          v-if="effectiveMode === 'datetime' || effectiveMode === 'time'"
          type="button"
          class="fb-datetime-picker__apply px-3 py-1 rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium hover:opacity-90 transition-opacity"
          @click="applyValue"
        >
          {{ t("apply") }}
        </button>
      </div>
    </div>
  </div>
</template>
