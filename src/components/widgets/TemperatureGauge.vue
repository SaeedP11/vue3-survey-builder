<template>
  <div
    class="relative w-full max-w-xl mx-auto p-6 backdrop-blur-md rounded-3xl select-none overflow-hidden"
  >
    <div class="relative flex justify-center items-center my-2">
      <div
        class="absolute w-48 h-48 rounded-full bg-gradient-to-tr from-cyan-500/10 to-emerald-500/10 blur-2xl transition-opacity duration-1000"
        :class="
          isAnimationFinished ? 'opacity-100 scale-105' : 'opacity-0 scale-95'
        "
      ></div>

      <svg
        :viewBox="`0 0 ${viewBoxSize} ${viewBoxSize}`"
        class="w-full max-w-[280px] h-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.015)]"
      >
        <defs>
          <linearGradient
            id="gaugeGradient"
            x1="0%"
            y1="100%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stop-color="#0284c7" />
            <stop offset="60%" stop-color="#10b981" />
            <stop offset="100%" stop-color="#22c55e" />
          </linearGradient>

          <filter id="thumbShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25" />
          </filter>
        </defs>

        <circle
          :cx="center"
          :cy="center"
          :r="radius"
          fill="none"
          stroke="#f1f5f9"
          :stroke-width="strokeWidth"
          stroke-linecap="round"
          :stroke-dasharray="totalCircumference"
          :stroke-dashoffset="0"
          :transform="`rotate(${startAngle} ${center} ${center})`"
        />

        <circle
          :cx="center"
          :cy="center"
          :r="radius - strokeWidth + 2"
          fill="none"
          stroke="#f8fafc"
          stroke-width="1.5"
          :stroke-dasharray="activeArcLength"
          :transform="`rotate(${startAngle} ${center} ${center})`"
        />

        <circle
          :cx="center"
          :cy="center"
          :r="radius"
          fill="none"
          stroke="url(#gaugeGradient)"
          :stroke-width="strokeWidth"
          stroke-linecap="round"
          :stroke-dasharray="totalCircumference"
          :stroke-dashoffset="animatedStrokeOffset"
          :transform="`rotate(${startAngle} ${center} ${center})`"
          class="transition-all ease-out duration-75"
        />

        <g
          v-for="tick in computedTicks"
          :key="tick.value"
          class="transition-all duration-700 delay-300"
        >
          <text
            :x="tick.textX"
            :y="tick.textY"
            text-anchor="middle"
            dominant-baseline="middle"
            class="text-[9px] font-semibold fill-slate-500 tracking-tighter"
          >
            {{ tick.value }}
          </text>
        </g>

        <circle
          v-if="showThumb"
          :cx="thumbPosition.x"
          :cy="thumbPosition.y"
          r="4.5"
          fill="#ffffff"
          filter="url(#thumbShadow)"
          class="transition-all ease-out duration-75"
        />
      </svg>

      <div
        class="absolute flex flex-col items-center justify-center pointer-events-none transform translateY-[2px]"
      >
        <span
          class="text-4xl font-bold tracking-tight text-slate-800 tabular-nums transition-all duration-500"
          :class="{
            'scale-105 text-emerald-600':
              isAnimationFinished && tier === 0,
          }"
        >
          {{ displayValue.toFixed(1)
          }}<span class="text-2xl font-semibold opacity-90">{{ units }}</span>
        </span>
      </div>
    </div>

    <div
      class="text-center mt-3 font-semibold text-sm tracking-wide text-slate-700 tabular-nums transition-all duration-700 transform"
      :class="
        isAnimationFinished
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-2'
      "
    >
      <span class="text-slate-500"
        >{{ displayValue.toFixed(1) }}{{ units }}</span
      >
      <span class="mx-1.5 text-slate-300">/</span>
      <span
        :style="{ color: statusColor }"
        class="font-bold uppercase tracking-wider text-xs px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100"
      >
        {{ statusText }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { tierIndex, pickLabel, pickColor } from "../../utils/statusTiers.ts";

const props = defineProps({
  modelValue: {
    type: Number,
    required: true,
    default: 36.8,
  },
  min: {
    type: Number,
    default: 35,
  },
  max: {
    type: Number,
    default: 40,
  },
  title: {
    type: String,
    default: "Body Temperature (°C)",
  },
  subtitleLeft: {
    type: String,
    default: "Patient Monitor",
  },
  subtitleRight: {
    type: String,
    default: "Vital Signs",
  },
  units: {
    type: String,
    default: "°C",
  },
  statusLabels: {
    type: Array,
    default: () => ["Mild", "Moderate", "Severe", "Critical"],
  },
  duration: {
    type: Number,
    default: 1200,
  },
  showThumb: {
    type: Boolean,
    default: true,
  },
});

// SVG Geometry Configuration
const viewBoxSize = 200;
const center = viewBoxSize / 2;
const radius = 68;
const strokeWidth = 9;

// Gauge Configuration Math (270-degree symmetric layout)
const startAngle = 135; // Bottom-left path entry
const totalAngle = 270; // Extent of the gauge perimeter
const labelRadiusOffset = 16; // Margin clearance for peripheral values

// Calculated Structural Math constants
const totalCircumference = computed(() => 2 * Math.PI * radius);
const activeArcLength = computed(
  () => totalCircumference.value * (totalAngle / 360),
);

// Reactive Animation Toggles
const displayValue = ref(props.min);
const isAnimationFinished = ref(false);

// Linearly mapped active percentage
const currentProgressPercentage = computed(() => {
  const range = props.max - props.min;
  if (range <= 0) return 0;
  const clamped = Math.max(props.min, Math.min(props.max, displayValue.value));
  return (clamped - props.min) / range;
});

const tier = computed(() => {
  const count = props.statusLabels.length || 1;
  return tierIndex(displayValue.value, props.min, props.max, count);
});

const statusText = computed(() =>
  pickLabel(props.statusLabels, tier.value, "—"),
);

const statusColor = computed(() =>
  pickColor(["#10b981", "#f59e0b", "#ef4444"], tier.value),
);

// Stroke offset required to dynamically expose active track portions via dash arrays
const animatedStrokeOffset = computed(() => {
  const arcReduction = activeArcLength.value * currentProgressPercentage.value;
  return totalCircumference.value - arcReduction;
});

// Computes spatial coordinates to plot the white thumb pointer
const thumbPosition = computed(() => {
  const targetAngleDegrees =
    startAngle + currentProgressPercentage.value * totalAngle;
  const targetAngleRadians = (targetAngleDegrees * Math.PI) / 180;

  return {
    x: center + radius * Math.cos(targetAngleRadians),
    y: center + radius * Math.sin(targetAngleRadians),
  };
});

// Generates structural tracking matrices for text labels mapped around perimeters.
// Caps at 6 ticks so wide ranges (e.g. 0–100) don't crowd the perimeter while
// the narrow body-temp default (35–40) still gets its full 6 integer ticks.
const computedTicks = computed(() => {
  const range = props.max - props.min;
  const tickCount = Math.min(6, range + 1);
  const list = [];

  for (let i = 0; i < tickCount; i++) {
    const stepPercentage = tickCount > 1 ? i / (tickCount - 1) : 0;
    const val = props.min + Math.round(stepPercentage * range);
    const tickAngleDegrees = startAngle + stepPercentage * totalAngle;
    const tickAngleRadians = (tickAngleDegrees * Math.PI) / 180;

    list.push({
      value: val,
      textX: center + (radius + labelRadiusOffset) * Math.cos(tickAngleRadians),
      textY: center + (radius + labelRadiusOffset) * Math.sin(tickAngleRadians),
    });
  }
  return list;
});

// Easing Implementation: Cubic Out
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Core Animation Loop Handler
const animateGauge = () => {
  isAnimationFinished.value = false;
  const startVal = displayValue.value;
  const targetVal = props.modelValue;
  const valueDelta = targetVal - startVal;
  let startTime = null;

  const step = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / props.duration, 1);
    const easedProgress = easeOutCubic(progress);

    displayValue.value = startVal + valueDelta * easedProgress;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      displayValue.value = targetVal;
      isAnimationFinished.value = true;
    }
  };
  requestAnimationFrame(step);
};

onMounted(() => {
  // Graceful initialization delay to guarantee element is painted to view
  setTimeout(() => {
    animateGauge();
  }, 150);
});

// Watcher enables automatic re-running of animations upon immediate upstream value changes
watch(
  () => props.modelValue,
  () => {
    animateGauge();
  },
);
</script>

<style scoped>
/* Keyframe to handle the post-animation ambient pulsing glow */
@keyframes pulseGlow {
  0%,
  100% {
    opacity: 0.8;
    transform: scale(1.02);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

.pulse-glow-active {
  animation: pulseGlow 3s ease-in-out infinite;
}
</style>
