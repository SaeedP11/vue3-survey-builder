<script setup lang="ts">
import { computed } from "vue";
// @ts-expect-error — plain <script setup> SFC, no emitted types
import LinearHealthGauge from "../gauges/LinearHealthGauge.vue";
// @ts-expect-error — plain <script setup> SFC, no emitted types
import RadialGauge from "../gauges/RadialGauge.vue";
// @ts-expect-error — plain <script setup> SFC, no emitted types
import TemperatureGauge from "../gauges/TemperatureGauge.vue";
// @ts-expect-error — plain <script setup> SFC, no emitted types
import DonutGauge from "../gauges/DonutGauge.vue";
// @ts-expect-error — plain <script setup> SFC, no emitted types
import BulletChart from "../gauges/BulletChart.vue";
// @ts-expect-error — plain <script setup> SFC, no emitted types
import VerticalThermometer from "../gauges/VerticalThermometer.vue";
// @ts-expect-error — plain <script setup> SFC, no emitted types
import SegmentedPills from "../gauges/SegmentedPills.vue";

type Level = "low" | "moderate" | "high";
type ScoreDisplay =
  | "default"
  | "linear"
  | "radial"
  | "temperature"
  | "donut"
  | "bullet"
  | "thermometer"
  | "pills";

const props = withDefaults(
  defineProps<{
    score?: number;
    max?: number;
    level?: Level;
    levelLabel?: string;
    scoreDisplay?: ScoreDisplay;

    logoSrc?: string;
    brandName?: string;
    brandTagline?: string;
    categoryChip?: string;

    title?: string;
    subtitle?: string;
    description?: string;
    scoreLabel?: string;
    noteText?: string;
    primaryLabel?: string;
    secondaryLabel?: string;
    closeLabel?: string;

    segmentLabels?: [string, string, string];

    locale?: string;

    showHero?: boolean;
    showDescription?: boolean;
    showScoreCard?: boolean;
    showScoreChart?: boolean;
    showNote?: boolean;
    showActions?: boolean;
  }>(),
  {
    score: 42,
    max: 100,
    level: "moderate",
    levelLabel: "متوسط",
    scoreDisplay: "default",

    logoSrc: "",
    brandName: "BehAyand",
    brandTagline: "مراقبت از سلامت قلب",
    categoryChip: "سلامت قلب",

    title: "ارزیابی تکمیل شد",
    subtitle: "ارزیابی خطر بیماری‌های قلبی و عروقی",
    description:
      "بر اساس پاسخ‌های شما، امتیاز خطر سلامت محاسبه شد. این نتیجه احتمال ابتلا به بیماری‌های قلبی و عروقی را در ۱۰ سال آینده نشان می‌دهد.",
    scoreLabel: "امتیاز خطر سلامت",
    noteText:
      "نتیجه شما در محدوده خطر متوسط قرار دارد. توصیه می‌شود برای کاهش سطح خطر، به‌صورت منظم وضعیت سلامت خود را پیگیری کرده و تغییرات ساده‌ای در سبک زندگی ایجاد کنید.",
    primaryLabel: "رزرو مشاوره",
    secondaryLabel: "دانلود نتایج (PDF)",
    closeLabel: "بستن",

    segmentLabels: () => ["کم", "متوسط", "زیاد"],
    locale: "fa-IR",

    showHero: true,
    showDescription: true,
    showScoreCard: true,
    showScoreChart: true,
    showNote: true,
    showActions: true,
  },
);

const emit = defineEmits<{
  primary: [];
  secondary: [];
  close: [];
}>();

const fmt = (n: number) => new Intl.NumberFormat(props.locale).format(n);

const percentage = computed(() => {
  const clamped = Math.max(0, Math.min(props.max, props.score));
  return (clamped / props.max) * 100;
});

const ranges = computed<[string, string, string]>(() => {
  const a = Math.floor(props.max / 3);
  const b = Math.floor((props.max * 2) / 3);
  const dash = "–";
  return [
    `${fmt(0)}${dash}${fmt(a)}`,
    `${fmt(a + 1)}${dash}${fmt(b)}`,
    `${fmt(b + 1)}${dash}${fmt(props.max)}`,
  ];
});

const badgeClass = computed(() => {
  switch (props.level) {
    case "low":
      return "text-[#0B7A70] bg-[#E6F5F3] border-[#CFEAE6]";
    case "high":
      return "text-red-700 bg-red-100 border-red-200";
    default:
      return "text-amber-700 bg-[#FEF3E2] border-[#FBD9A8]";
  }
});
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center px-5 py-12 bg-white font-[Cairo,sans-serif] box-border"
    dir="rtl"
  >
    <div class="w-4/5 max-w-155 bg-white text-slate-900">
      <header
        class="flex items-center justify-between px-7.5 py-5 border-b border-slate-100"
      >
        <div class="flex items-center gap-3">
          <img
            v-if="logoSrc"
            :src="logoSrc"
            :alt="brandName"
            class="block w-10.5 h-10.5 rounded-[11px] object-cover"
          />
          <div
            v-else
            class="block w-10.5 h-10.5 rounded-[11px] bg-linear-to-br from-teal-600 to-[#0B7A70]"
            aria-hidden="true"
          />
          <div class="flex flex-col gap-px">
            <span
              class="text-base font-extrabold tracking-[0.01em] text-[#0F2742]"
              >{{ brandName }}</span
            >
            <span class="text-[11.5px] font-medium text-slate-500">{{
              brandTagline
            }}</span>
          </div>
        </div>
        <span
          class="text-[11px] font-bold text-[#0B7A70] bg-[#E6F5F3] border border-[#CFEAE6] px-3 py-1.5 rounded-full"
          >{{ categoryChip }}</span
        >
      </header>

      <div class="px-9.5 pt-9.5 pb-8.5">
        <div
          v-if="showHero"
          class="flex flex-col items-center text-center gap-3.25"
        >
          <div
            class="w-15 h-15 rounded-full bg-[#E6F5F3] border border-[#CFEAE6] flex items-center justify-center"
          >
            <svg width="29" height="29" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12.5l4 4L19 7"
                stroke="#0D9488"
                stroke-width="2.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h1
            class="mt-0.5 text-[28px] font-extrabold text-[#0F2742] tracking-[-0.01em]"
          >
            {{ title }}
          </h1>
          <div class="text-[12.5px] font-bold text-teal-600 tracking-[0.04em]">
            {{ subtitle }}
          </div>
          <p
            v-if="showDescription"
            class="mt-1 text-[15px] leading-[1.85] text-slate-700 max-w-107.5"
          >
            {{ description }}
          </p>
        </div>

        <div
          v-if="showScoreCard && scoreDisplay === 'default'"
          class="mt-7 bg-slate-50 border border-slate-100 rounded-2xl px-6.5 pt-6.5 pb-6"
        >
          <div class="flex items-end justify-between">
            <div>
              <div class="text-[12.5px] font-semibold text-slate-500 mb-0.75">
                {{ scoreLabel }}
              </div>
              <div class="flex items-baseline gap-1.5" dir="ltr">
                <span
                  class="text-[48px] font-extrabold text-[#0F2742] leading-none"
                  >{{ fmt(score) }}</span
                >
                <span class="text-base font-semibold text-slate-400"
                  >/ {{ fmt(max) }}</span
                >
              </div>
            </div>
            <span
              class="text-sm font-extrabold px-3.75 py-1.75 rounded-full border"
              :class="badgeClass"
              >{{ levelLabel }}</span
            >
          </div>

          <div
            v-if="showScoreChart"
            class="relative mt-6.5 pt-8.5"
            dir="ltr"
          >
            <div
              class="absolute top-0 -translate-x-1/2 flex flex-col items-center"
              :style="{ left: `${percentage}%` }"
            >
              <div
                class="bg-[#0F2742] text-white font-extrabold text-[13px] px-2.5 py-1 rounded-md"
              >
                {{ fmt(score) }}
              </div>
              <div
                class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] border-t-[#0F2742]"
              />
            </div>
            <div class="flex gap-0.75 h-3.5">
              <div class="flex-1 bg-teal-500 rounded-l-[7px]" />
              <div class="flex-1 bg-amber-500" />
              <div class="flex-1 bg-amber-600 rounded-r-[7px]" />
            </div>
            <div
              class="absolute top-7.75 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-[3px] border-[#0F2742] shadow-[0_1px_4px_rgba(15,39,66,0.35)]"
              :style="{ left: `${percentage}%` }"
            />
            <div class="flex mt-3.25">
              <div
                v-for="(label, i) in segmentLabels"
                :key="i"
                class="flex-1 text-center"
              >
                <div class="font-bold text-[12.5px] text-slate-900">
                  {{ label }}
                </div>
                <div class="text-[11px] text-slate-400">{{ ranges[i] }}</div>
              </div>
            </div>
          </div>
        </div>
        <div
          v-else-if="showScoreCard && showScoreChart"
          class="mt-6.5 flex justify-center"
          dir="ltr"
        >
          <LinearHealthGauge
            v-if="scoreDisplay === 'linear'"
            :model-value="score"
            :min="0"
            :max="max"
          />
          <RadialGauge
            v-else-if="scoreDisplay === 'radial'"
            :value="score"
            :min="0"
            :max="max"
          />
          <TemperatureGauge
            v-else-if="scoreDisplay === 'temperature'"
            :model-value="score"
            :min="0"
            :max="max"
          />
          <DonutGauge
            v-else-if="scoreDisplay === 'donut'"
            :value="score"
            :min="0"
            :max="max"
            :status-text="levelLabel"
          />
          <BulletChart
            v-else-if="scoreDisplay === 'bullet'"
            :value="score"
            :min="0"
            :max="max"
            :title="scoreLabel"
          />
          <VerticalThermometer
            v-else-if="scoreDisplay === 'thermometer'"
            :value="score"
            :min="0"
            :max="max"
            :title="scoreLabel"
            :status-text="levelLabel"
          />
          <SegmentedPills
            v-else-if="scoreDisplay === 'pills'"
            :value="score"
            :min="0"
            :max="max"
            :status-text="levelLabel"
            :low-label="segmentLabels[0]"
            :high-label="segmentLabels[2]"
          />
        </div>

        <div
          v-if="showNote"
          class="flex items-start gap-2.5 mt-4.5 px-0.5"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            class="flex-none mt-px"
          >
            <circle
              cx="12"
              cy="12"
              r="9.5"
              stroke="#94A3B8"
              stroke-width="1.6"
            />
            <path
              d="M12 11v5M12 7.6v.4"
              stroke="#94A3B8"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
          <p class="m-0 text-[13.5px] leading-[1.75] text-slate-500">
            {{ noteText }}
          </p>
        </div>

        <div v-if="showActions" class="mt-7">
          <div class="flex gap-3">
            <button
              class="flex-1 bg-teal-600 text-white border-0 rounded-xl py-3.75 text-[15px] font-bold cursor-pointer font-[Cairo,sans-serif]"
              @click="emit('primary')"
            >
              {{ primaryLabel }}
            </button>
            <button
              class="flex-1 bg-white text-[#0F2742] border-[1.5px] border-[#E3E8EF] rounded-xl py-3.5 text-sm font-bold cursor-pointer flex items-center justify-center gap-2 font-[Cairo,sans-serif]"
              @click="emit('secondary')"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3v11m0 0l-4-4m4 4l4-4M5 19h14"
                  stroke="#0F2742"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              {{ secondaryLabel }}
            </button>
          </div>
          <button
            class="w-full bg-transparent text-slate-500 border-0 py-1.75 mt-3 text-sm font-semibold cursor-pointer font-[Cairo,sans-serif]"
            @click="emit('close')"
          >
            {{ closeLabel }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap");
</style>
