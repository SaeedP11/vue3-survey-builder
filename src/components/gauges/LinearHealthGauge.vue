<template>
  <div
    class="relative w-full max-w-2xl mx-auto p-8 font-sans select-none"
    aria-label="Health metric gauge"
  >
    <div class="relative w-full h-6 mb-8 text-xs font-medium text-gray-500">
      <div class="absolute w-[20%] text-center" style="left: 60%">
        <span class="text-amber-700/80">Pre-HTN</span>
      </div>
      <div class="absolute w-[20%] text-center" style="left: 80%">
        <span class="text-orange-700/80">HTN 1</span>
      </div>
    </div>

    <div class="relative w-full">
      <div
        class="absolute -top-12 z-20 flex flex-col items-center -translate-x-1/2 transition-all duration-[50ms] ease-linear"
        :style="{ left: `${percentage}%` }"
      >
        <div
          class="text-[2.5rem] leading-none font-semibold text-gray-900 tracking-tight flex items-baseline gap-1"
        >
          {{ Math.round(displayValue) }}
          <span class="text-sm font-medium text-gray-800">{{ unit }}</span>
        </div>
        <div
          class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] mt-2 transition-colors duration-300"
          :style="{ borderTopColor: currentSegment.color }"
        ></div>
      </div>

      <div
        class="relative h-4 rounded-full bg-gray-100 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] overflow-hidden"
      >
        <div
          class="absolute inset-0 w-full h-full opacity-90 track-gradient"
        ></div>

        <div class="absolute inset-0 flex justify-between px-[20%]">
          <div
            class="w-0.5 h-full bg-white/90 shadow-sm"
            style="margin-left: 0%"
          ></div>
          <div
            class="w-0.5 h-full bg-white/90 shadow-sm"
            style="margin-left: 20%"
          ></div>
          <div
            class="w-0.5 h-full bg-white/90 shadow-sm"
            style="margin-left: 20%"
          ></div>
          <div
            class="w-0.5 h-full bg-white/90 shadow-sm"
            style="margin-left: 20%"
          ></div>
        </div>
      </div>

      <div
        class="absolute top-1/2 z-10 w-[22px] h-[22px] bg-white rounded-full border-[4px] -translate-y-1/2 -translate-x-1/2 transition-all duration-[50ms] ease-linear"
        :style="{
          left: `${percentage}%`,
          borderColor: currentSegment.color,
          boxShadow: `0 0 12px ${currentSegment.color}40, 0 2px 4px rgba(0,0,0,0.1)`,
        }"
      >
        <div
          v-if="isLoaded"
          class="absolute inset-0 rounded-full animate-ping opacity-20"
          :style="{ backgroundColor: currentSegment.color }"
        ></div>
      </div>
    </div>

    <div class="flex justify-between mt-4 text-sm font-medium text-gray-700">
      <span v-for="tick in ticks" :key="tick">{{ tick }}</span>
    </div>

    <div class="mt-8 text-center text-gray-600 font-medium text-lg">
      {{ Math.round(displayValue) }} {{ unit }}
      <span class="mx-1 text-gray-400">/</span>
      <span
        class="uppercase tracking-wide font-semibold transition-colors duration-300"
        :style="{ color: currentSegment.color }"
      >
        {{ currentSegment.label }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";

const props = defineProps({
  modelValue: { type: Number,default: 20 },
  min: { type: Number, default: 60 },
  max: { type: Number, default: 110 },
  unit: { type: String, default: "mmHg" },
  ticks: { type: Array, default: () => [60, 70, 80, 90, 100, 110] },
  segments: {
    type: Array,
    default: () => [
      { limit: 80, color: "#22c55e", label: "NORMAL" }, // Green
      { limit: 90, color: "#eab308", label: "ELEVATED" }, // Yellow
      { limit: 100, color: "#f97316", label: "PRE-HTN" }, // Orange
      { limit: 110, color: "#ef4444", label: "HTN 1" }, // Red
    ],
  },
});

const displayValue = ref(props.min);
const isLoaded = ref(false);

// Core Math: Map the value to a 0-100 percentage for CSS absolute positioning
const percentage = computed(() => {
  const clamped = Math.max(props.min, Math.min(props.max, displayValue.value));
  return ((clamped - props.min) / (props.max - props.min)) * 100;
});

// Determine active state based on the current animated value
const currentSegment = computed(() => {
  return (
    props.segments.find((seg) => displayValue.value <= seg.limit) ||
    props.segments[props.segments.length - 1]
  );
});

// 60fps Easing Animation logic
const animateValue = (target) => {
  const duration = 1200; // ms
  const start = displayValue.value;
  const change = target - start;
  const startTime = performance.now();

  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // easeOutQuart for premium, snappy-but-smooth feeling
    const easeOut = 1 - Math.pow(1 - progress, 4);

    displayValue.value = start + change * easeOut;

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
};

onMounted(() => {
  // Slight delay before initial animation to allow DOM painting
  setTimeout(() => {
    isLoaded.value = true;
    animateValue(props.modelValue);
  }, 150);
});

// Watch for external value changes and trigger the same smooth animation
watch(
  () => props.modelValue,
  (newVal) => {
    animateValue(newVal);
  },
);
</script>

<style scoped>
/* Extracted to CSS to keep template clean and easily tweak the stops */
.track-gradient {
  background: linear-gradient(
    to right,
    #6eb7cd 0%,
    #4ade80 30%,
    #facc15 50%,
    #fb923c 75%,
    #ef4444 100%
  );
}
</style>
