<template>
  <div class="flex flex-col p-6 w-full max-w-2xl mx-auto font-sans">
    <div class="flex items-baseline justify-between mb-3.5">
      <h3
        class="text-xs font-bold uppercase tracking-widest text-slate-600"
      >
        {{ title }}
      </h3>
      <div class="flex items-baseline gap-1.5">
        <span class="text-2xl font-bold text-slate-900 tabular-nums">{{
          displayValue
        }}</span>
        <span v-if="unit" class="text-sm font-medium text-slate-500">{{
          unit
        }}</span>
      </div>
    </div>

    <div
      class="relative h-9 w-full rounded-md overflow-hidden ring-1 ring-slate-200"
    >
      <div class="absolute inset-0 flex">
        <div
          v-for="(b, i) in bands"
          :key="i"
          :class="b.color"
          :style="{ flex: b.pct }"
        ></div>
      </div>

      <div
        class="absolute left-0 top-1/2 -translate-y-1/2 h-3.5 rounded-r-sm bg-slate-900"
        :style="{
          width: `${valuePercentage}%`,
          transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
        }"
      ></div>

      <div
        v-if="target != null"
        class="absolute top-1 bottom-1 w-1 bg-amber-400 shadow-[0_0_0_1px_rgba(0,0,0,0.15)]"
        :style="{
          left: `${targetPercentage}%`,
          transform: 'translateX(-50%)',
        }"
      ></div>
    </div>

    <div
      class="flex justify-between mt-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider"
    >
      <span v-for="(b, i) in bands" :key="i">{{ b.label }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";

const props = defineProps({
  value: { type: Number, default: 70 },
  target: { type: Number, default: 85 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  unit: { type: String, default: "%" },
  title: { type: String, default: "Performance" },
  bands: {
    type: Array,
    default: () => [
      { label: "Poor", pct: 1, color: "bg-rose-100" },
      { label: "Satisfactory", pct: 1, color: "bg-amber-100" },
      { label: "Good", pct: 1, color: "bg-emerald-100" },
    ],
  },
  duration: { type: Number, default: 1100 },
});

const animatedValue = ref(props.min);

const valuePercentage = computed(() => percentOf(animatedValue.value));
const targetPercentage = computed(() => percentOf(props.target ?? props.min));
const displayValue = computed(() => Math.round(animatedValue.value));

function percentOf(v) {
  const range = props.max - props.min;
  if (range <= 0) return 0;
  const clamped = Math.max(props.min, Math.min(props.max, v));
  return ((clamped - props.min) / range) * 100;
}

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const animate = () => {
  const start = animatedValue.value;
  const target = props.value;
  const delta = target - start;
  let t0 = null;

  const step = (ts) => {
    if (!t0) t0 = ts;
    const t = Math.min((ts - t0) / props.duration, 1);
    animatedValue.value = start + delta * easeOutCubic(t);
    if (t < 1) requestAnimationFrame(step);
    else animatedValue.value = target;
  };
  requestAnimationFrame(step);
};

onMounted(() => setTimeout(animate, 120));
watch(() => props.value, animate);
</script>
