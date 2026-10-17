<template>
  <div class="flex items-center justify-center gap-8 p-6 mx-auto font-fb">
    <div class="relative w-10 h-72">
      <div class="absolute inset-0 bg-slate-100 rounded-full shadow-inner"></div>

      <div
        class="absolute inset-x-1.5 bottom-1.5 rounded-t-full overflow-hidden"
        :style="{
          height: `calc(${fillPercentage}% - 0.375rem)`,
          transition: 'height 1s cubic-bezier(0.16, 1, 0.3, 1)',
        }"
      >
        <div
          class="absolute inset-x-0 bottom-0 h-72 rounded-t-full"
          :style="{ background: gradient }"
        ></div>
      </div>

      <div
        class="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full shadow-lg ring-4 ring-white"
        :style="{ background: bulbColor }"
      ></div>

      <div
        class="absolute inset-y-0 -right-7 flex flex-col-reverse justify-between py-2 text-[10px] font-semibold text-slate-400 tabular-nums"
      >
        <span v-for="t in ticks" :key="t">{{ t }}</span>
      </div>
    </div>

    <div class="flex flex-col items-start gap-1">
      <div class="text-4xl font-bold text-slate-900 tabular-nums leading-none">
        {{ displayValue }}<span
          v-if="unit"
          class="text-xl font-semibold text-slate-500 ml-0.5"
          >{{ unit }}</span
        >
      </div>
      <div
        class="mt-2 text-[10px] uppercase tracking-widest font-bold text-slate-500"
      >
        {{ title }}
      </div>
      <span
        class="mt-3 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider"
        :style="{
          color: bulbColor,
          background: bulbColor + '14',
          border: `1px solid ${bulbColor}33`,
        }"
        >{{ statusText }}</span
      >
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { tierIndex, pickLabel, pickColor } from "../../utils/statusTiers.ts";

const props = defineProps({
  value: { type: Number, default: 36.8 },
  min: { type: Number, default: 30 },
  max: { type: Number, default: 42 },
  unit: { type: String, default: "°" },
  title: { type: String, default: "Temperature" },
  statusLabels: { type: Array, default: () => ["Mild", "Moderate", "Severe", "Critical"] },
  tickCount: { type: Number, default: 5 },
  duration: { type: Number, default: 1200 },
});

const animatedValue = ref(props.min);

const fillPercentage = computed(() => {
  const range = props.max - props.min;
  if (range <= 0) return 0;
  const clamped = Math.max(props.min, Math.min(props.max, animatedValue.value));
  return ((clamped - props.min) / range) * 100;
});

const displayValue = computed(() => {
  const v = animatedValue.value;
  return Number.isInteger(props.value) ? Math.round(v) : v.toFixed(1);
});

const ticks = computed(() => {
  const out = [];
  const range = props.max - props.min;
  for (let i = 0; i < props.tickCount; i++) {
    const t = i / (props.tickCount - 1);
    out.push(Math.round(props.min + range * t));
  }
  return out;
});

const tier = computed(() => {
  const count = props.statusLabels.length || 1;
  return tierIndex(animatedValue.value, props.min, props.max, count);
});

const bulbColor = computed(() =>
  pickColor(["#0ea5e9", "#f59e0b", "#ef4444"], tier.value),
);

const statusText = computed(() =>
  pickLabel(props.statusLabels, tier.value, "—"),
);

const gradient = computed(
  () => `linear-gradient(to top, ${bulbColor.value}, #fbbf24 60%, #f97316)`,
);

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

onMounted(() => setTimeout(animate, 150));
watch(() => props.value, animate);
</script>
