<template>
  <div
    class="flex w-full max-w-lg flex-col items-center p-6 mx-auto font-fb"
  >
    <div class="flex items-baseline gap-2 mb-5">
      <span class="text-5xl font-bold tracking-tight text-slate-900 tabular-nums">{{
        displayValue
      }}</span>
      <span class="text-base font-semibold text-slate-400 tabular-nums"
        >/ {{ max }}</span
      >
    </div>

    <div class="flex gap-1.5 w-full">
      <div
        v-for="i in segments"
        :key="i"
        class="flex-1 h-10 rounded-md border"
        :class="i <= activeSegments ? activeClass : inactiveClass"
        :style="{
          transition: `background-color 0.4s ${(i - 1) * 50}ms ease-out, border-color 0.4s ${(i - 1) * 50}ms ease-out`,
        }"
      ></div>
    </div>

    <div
      class="flex justify-between w-full mt-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider"
    >
      <span>{{ lowLabel }}</span>
      <span>{{ highLabel }}</span>
    </div>

    <div class="mt-5">
      <span
        class="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
        :class="badgeClass"
        >{{ statusText }}</span
      >
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { tierIndex, pickLabel, pickColor } from "../../utils/statusTiers.ts";

const props = defineProps({
  value: { type: Number, default: 6 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 10 },
  segments: { type: Number, default: 10 },
  statusLabels: { type: Array, default: () => ["Mild", "Moderate", "Severe", "Critical"] },
  duration: { type: Number, default: 900 },
});

const lowLabel = "Low";
const highLabel = "High";

const animatedValue = ref(props.min);

const progress = computed(() => {
  const range = props.max - props.min;
  if (range <= 0) return 0;
  const clamped = Math.max(props.min, Math.min(props.max, animatedValue.value));
  return (clamped - props.min) / range;
});

const activeSegments = computed(() =>
  Math.round(progress.value * props.segments),
);

const displayValue = computed(() => Math.round(animatedValue.value));

const tier = computed(() => {
  const count = props.statusLabels.length || 1;
  return tierIndex(animatedValue.value, props.min, props.max, count);
});

const statusText = computed(() =>
  pickLabel(props.statusLabels, tier.value, "—"),
);

const activeClass = computed(() =>
  pickColor(
    [
      "bg-emerald-500 border-emerald-600",
      "bg-amber-500 border-amber-600",
      "bg-rose-500 border-rose-600",
    ],
    tier.value,
  ),
);

const inactiveClass = "bg-slate-100 border-slate-200";

const badgeClass = computed(() =>
  pickColor(
    [
      "text-emerald-700 bg-emerald-50 border border-emerald-200",
      "text-amber-700 bg-amber-50 border border-amber-200",
      "text-rose-700 bg-rose-50 border border-rose-200",
    ],
    tier.value,
  ),
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

onMounted(() => setTimeout(animate, 120));
watch(() => props.value, animate);
</script>
