<script setup lang="ts">
import { computed } from "vue";
import { surveyResult } from "../../locales/index.ts";
import { tierIndex, pickLabel, pickColor } from "../../utils/statusTiers.ts";
import useLocalI18n from "../../composables/useLocalI18n.ts";

const props = withDefaults(
  defineProps<{
    value?: number;
    min?: number;
    max?: number;
    statusLabels?: string[];
  }>(),
  {
    value: 0,
    min: 0,
    max: 100,
    statusLabels: () => ["Mild", "Moderate", "Severe", "Critical"],
  },
);

const { t, locale } = useLocalI18n(surveyResult);
const fmt = (n: number) => new Intl.NumberFormat(locale.value).format(n);

const scoreLabel = computed(() => t("scoreLabel"));
const displayedScore = computed(() => fmt(props.value));

const span = computed(() => Math.max(1, props.max - props.min));

const tierCount = computed(() => Math.max(1, props.statusLabels.length));

const tier = computed(() =>
  tierIndex(props.value, props.min, props.max, tierCount.value),
);

const statusText = computed(() =>
  pickLabel(props.statusLabels, tier.value, "—"),
);

const percentage = computed(() => {
  const clamped = Math.max(props.min, Math.min(props.max, props.value));
  return ((clamped - props.min) / span.value) * 100;
});

const segmentPalettes = {
  bar: [
    "bg-[var(--sjs-special-green)]",
    "bg-[var(--sjs-special-yellow)]",
    "bg-[var(--sjs-special-red)]",
  ],
  badge: [
    "text-[var(--sjs-special-green)] bg-[var(--sjs-special-green-light)] border-[var(--sjs-special-green-light)]",
    "text-[var(--sjs-special-yellow)] bg-[var(--sjs-special-yellow-light)] border-[var(--sjs-special-yellow-light)]",
    "text-[var(--sjs-special-red)] bg-[var(--sjs-special-red-light)] border-[var(--sjs-special-red-light)]",
  ],
} as const;

const segmentBars = computed(() =>
  Array.from({ length: tierCount.value }, (_, i) => {
    const base = pickColor([...segmentPalettes.bar], i);
    const isFirst = i === 0;
    const isLast = i === tierCount.value - 1;
    return `${base} ${isFirst ? "rounded-l-[7px]" : ""} ${isLast ? "rounded-r-[7px]" : ""}`.trim();
  }),
);

const badgeClass = computed(() =>
  pickColor([...segmentPalettes.badge], tier.value),
);

const ranges = computed<string[]>(() => {
  const count = tierCount.value;
  const dash = "–";
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const lo = Math.floor(props.min + (span.value * i) / count);
    const hi = Math.floor(props.min + (span.value * (i + 1)) / count);
    out.push(`${fmt(lo)}${dash}${fmt(hi)}`);
  }
  return out;
});

const segmentLabels = computed(() =>
  Array.from({ length: tierCount.value }, (_, i) =>
    pickLabel(props.statusLabels, i, "—"),
  ),
);
</script>

<template>
  <div
    class="bg-[var(--sjs-general-backcolor-dim-light)] border border-[var(--sjs-border-inside)] rounded-2xl px-6.5 pt-6.5 pb-6"
  >
    <div class="flex items-end justify-between">
      <div>
        <div
          class="text-[12.5px] font-semibold text-[var(--sjs-general-forecolor-light)] mb-0.75"
        >
          {{ scoreLabel }}
        </div>
        <div class="flex items-baseline gap-1.5" dir="ltr">
          <span
            class="text-[48px] font-extrabold text-[var(--sjs-general-forecolor)] leading-none"
            >{{ displayedScore }}</span
          >
          <span
            class="text-base font-semibold text-[var(--sjs-general-forecolor-light)]"
            >/ {{ fmt(max) }}</span
          >
        </div>
      </div>
      <span
        class="text-sm font-extrabold px-3.75 py-1.75 rounded-full border"
        :class="badgeClass"
        >{{ statusText }}</span
      >
    </div>

    <div class="relative mt-6.5 pt-8.5" dir="ltr">
      <div
        class="absolute top-0 -translate-x-1/2 flex flex-col items-center"
        :style="{ left: `${percentage}%` }"
      >
        <div
          class="bg-[var(--sjs-general-forecolor)] text-[var(--sjs-general-backcolor)] font-extrabold text-[13px] px-2.5 py-1 rounded-md"
        >
          {{ displayedScore }}
        </div>
        <div
          class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] border-t-[var(--sjs-general-forecolor)]"
        />
      </div>
      <div class="flex gap-0.75 h-3.5">
        <div
          v-for="(cls, i) in segmentBars"
          :key="i"
          class="flex-1"
          :class="cls"
        />
      </div>
      <div
        class="absolute top-7.75 -translate-x-1/2 w-4 h-4 rounded-full bg-[var(--sjs-general-backcolor)] border-[3px] border-[var(--sjs-general-forecolor)] shadow-sm"
        :style="{ left: `${percentage}%` }"
      />
      <div class="flex mt-3.25">
        <div
          v-for="(label, i) in segmentLabels"
          :key="i"
          class="flex-1 text-center"
        >
          <div
            class="font-bold text-[12.5px] text-[var(--sjs-general-forecolor)]"
          >
            {{ label }}
          </div>
          <div class="text-[11px] text-[var(--sjs-general-forecolor-light)]">
            {{ ranges[i] }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
