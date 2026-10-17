<template>
  <div
    class="flex w-full max-w-md flex-col items-center p-6 mx-auto font-fb"
  >
    <div class="relative w-full max-w-[260px] aspect-square">
      <svg viewBox="0 0 200 200" class="w-full h-full -rotate-90">
        <defs>
          <linearGradient
            :id="`donut-grad-${id}`"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stop-color="#6366f1" />
            <stop offset="100%" stop-color="#ec4899" />
          </linearGradient>
        </defs>

        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="#f1f5f9"
          stroke-width="16"
        />
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          :stroke="`url(#donut-grad-${id})`"
          stroke-width="16"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
          class="transition-all ease-out"
          style="transition-duration: 75ms"
        />
      </svg>

      <div
        class="absolute inset-0 flex flex-col items-center justify-center"
        :class="{
          'opacity-100 scale-100': isLoaded,
          'opacity-0 scale-95': !isLoaded,
        }"
        style="transition: all 0.5s ease-out"
      >
        <div
          class="text-5xl font-bold tracking-tight text-slate-800 tabular-nums"
        >
          {{ displayValue }}
        </div>
        <div
          v-if="unit"
          class="mt-1 text-xs uppercase tracking-widest text-slate-500 font-semibold"
        >
          {{ unit }}
        </div>
      </div>
    </div>

    <div class="mt-6 text-sm font-semibold">
      <span class="text-slate-500">{{ percentageLabel }} / </span>
      <span :style="{ color: statusColor }">{{ statusText }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { tierIndex, pickLabel, pickColor } from "../../utils/statusTiers.ts";

const props = defineProps({
  value: { type: Number, default: 65 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  unit: { type: String, default: "" },
  statusLabels: { type: Array, default: () => ["Mild", "Moderate", "Severe", "Critical"] },
  duration: { type: Number, default: 1000 },
});

const RADIUS = 80;
const circumference = 2 * Math.PI * RADIUS;
const id = Math.random().toString(36).slice(2, 9);

const animatedValue = ref(props.min);
const isLoaded = ref(false);

const progress = computed(() => {
  const range = props.max - props.min;
  if (range <= 0) return 0;
  const clamped = Math.max(props.min, Math.min(props.max, animatedValue.value));
  return (clamped - props.min) / range;
});

const dashOffset = computed(() => circumference * (1 - progress.value));
const displayValue = computed(() => Math.round(animatedValue.value));
const percentageLabel = computed(() => `${Math.round(progress.value * 100)}%`);

const tier = computed(() => {
  const count = props.statusLabels.length || 1;
  return tierIndex(animatedValue.value, props.min, props.max, count);
});

const statusText = computed(() =>
  pickLabel(props.statusLabels, tier.value, "—"),
);

const statusColor = computed(() =>
  pickColor(["#10b981", "#f59e0b", "#ef4444"], tier.value),
);

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const animate = () => {
  const start = animatedValue.value;
  const target = props.value;
  const delta = target - start;
  let startTime = null;

  const step = (ts) => {
    if (!startTime) startTime = ts;
    const t = Math.min((ts - startTime) / props.duration, 1);
    animatedValue.value = start + delta * easeOutCubic(t);
    if (t < 1) requestAnimationFrame(step);
    else animatedValue.value = target;
  };
  requestAnimationFrame(step);
};

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true;
    animate();
  }, 120);
});

watch(() => props.value, animate);
</script>
