<template>
  <div
    class="flex w-full max-w-2xl flex-col items-center justify-center p-8 rounded-2xl mx-auto font-sans"
  >
    <div class="relative w-full aspect-[2/1.2] flex items-end justify-center">
      <svg
        viewBox="0 0 240 140"
        class="absolute top-0 left-0 w-full h-full overflow-visible"
        :class="{
          'opacity-100 translate-y-0': isLoaded,
          'opacity-0 translate-y-4': !isLoaded,
        }"
        style="
          transition:
            opacity 0.8s ease-out,
            transform 0.8s ease-out;
        "
      >
        <defs>
          <linearGradient id="gauge-gradient" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0ea5e9" />
            <stop offset="100%" stop-color="#f97316" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <path
          d="M 210 110 A 90 90 0 0 0 30 110"
          fill="none"
          stroke="url(#gauge-gradient)"
          stroke-width="12"
          stroke-linecap="round"
          class="opacity-20"
        />

        <path
          d="M 210 110 A 90 90 0 0 0 30 110"
          fill="none"
          stroke="url(#gauge-gradient)"
          stroke-width="12"
          stroke-linecap="round"
          :stroke-dasharray="arcLength"
          :stroke-dashoffset="dashOffset"
        />

        <g class="text-[10px] font-medium fill-slate-500" text-anchor="middle">
          <text v-for="tick in ticks" :key="tick.value" :x="tick.x" :y="tick.y">
            {{ tick.label }}
          </text>
        </g>

        <path
          d="M 118 110 L 122 110 L 120 30 Z"
          fill="url(#gauge-gradient)"
          class="opacity-40"
          :transform="`rotate(${pointerAngle}, 120, 110)`"
          filter="url(#glow)"
        />

        <g :transform="`translate(${dotX}, ${dotY})`">
          <circle
            r="5"
            fill="#ffffff"
            stroke="#0ea5e9"
            stroke-width="2"
            filter="url(#glow)"
          />
        </g>
      </svg>

      <div
        class="absolute bottom-4 flex flex-col items-center transition-all duration-1000 delay-300"
        :class="{
          'opacity-100 scale-100': isLoaded,
          'opacity-0 scale-95': !isLoaded,
        }"
      >
        <div
          class="text-5xl font-bold text-slate-800 tracking-tight leading-none mb-1"
        >
          {{ displayValue }}
        </div>
        <div
          class="text-sm font-semibold text-slate-500 uppercase tracking-widest"
        >
          {{ unit }}
        </div>
      </div>
    </div>

    <div
      class="mt-6 text-sm font-semibold transition-all duration-1000 delay-500"
      :class="{
        'opacity-100 translate-y-0': isLoaded,
        'opacity-0 translate-y-2': !isLoaded,
      }"
    >
      <span class="text-slate-600">{{ displayValue }} {{ unit }} / </span>
      <span :class="statusColorClass">{{ statusText }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { tierIndex, pickLabel, pickColor } from "../../utils/statusTiers.ts";

const props = defineProps({
  value: { type: Number, default: 60 },
  min: { type: Number, default: 40 },
  max: { type: Number, default: 140 },
  title: { type: String, default: "HEART RATE (BPM)" },
  unit: { type: String, default: "BPM" },
  statusLabels: { type: Array, default: () => ["Mild", "Moderate", "Severe", "Critical"] },
});

const isLoaded = ref(false);
const animatedProgress = ref(0); // 0 (min/right) to 1 (max/left)

// SVG Constants
const RADIUS = 90;
const CENTER_X = 120;
const CENTER_Y = 110;
const arcLength = Math.PI * RADIUS;

// Current normalized progress
const currentProgress = computed(() => {
  const range = props.max - props.min;
  if (range <= 0) return 0;
  const clampedValue = Math.max(props.min, Math.min(props.value, props.max));
  return (clampedValue - props.min) / range;
});

const displayValue = computed(() => {
  const val = props.min + (props.max - props.min) * animatedProgress.value;
  return Math.round(val);
});

const dashOffset = computed(() => {
  return arcLength - arcLength * animatedProgress.value;
});

// REVERSED MATH: Start at theta = 0 (Right side), move to theta = PI (Left side)
const dotX = computed(() => {
  const theta = Math.PI * animatedProgress.value;
  return CENTER_X + RADIUS * Math.cos(theta);
});

const dotY = computed(() => {
  const theta = Math.PI * animatedProgress.value;
  return CENTER_Y - RADIUS * Math.sin(theta);
});

// Pointer Rotation: Starts at +90deg (Right), ends at -90deg (Left)
const pointerAngle = computed(() => {
  return 90 - 180 * animatedProgress.value;
});

const statusColorClass = computed(() =>
  pickColor(["text-[#0ea5e9]", "text-[#f59e0b]", "text-[#ef4444]"], tier.value),
);

const statusText = computed(() =>
  pickLabel(props.statusLabels, tier.value, "—"),
);

const tier = computed(() => {
  const count = props.statusLabels.length || 1;
  return tierIndex(props.value, props.min, props.max, count);
});

// Reversed Ticks Math — derive 6 evenly-spaced ticks from min/max so the
// gauge stays legible across arbitrary ranges (score 0–100, BPM 40–140, etc.)
const ticks = computed(() => {
  const count = 6;
  const textRadius = RADIUS + 18;
  const range = props.max - props.min;

  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    const val = Math.round(props.min + range * t);
    const theta = Math.PI * t;
    return {
      value: val,
      label: i === count - 1 ? `${val}+` : val.toString(),
      x: CENTER_X + textRadius * Math.cos(theta),
      y: CENTER_Y - textRadius * Math.sin(theta) + 4,
    };
  });
});

// Animation Engine
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const animateToValue = (targetProgress) => {
  const startProgress = animatedProgress.value;
  const startTime = performance.now();
  const duration = 1200;

  const update = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    animatedProgress.value =
      startProgress + (targetProgress - startProgress) * easeOutCubic(progress);

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  };

  requestAnimationFrame(update);
};

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true;
    animateToValue(currentProgress.value);
  }, 100);
});

watch(
  () => props.value,
  () => {
    animateToValue(currentProgress.value);
  },
);
</script>
