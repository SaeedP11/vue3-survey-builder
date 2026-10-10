<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type {
  ChartItemValue,
  QuestionChartModel,
} from "../utils/registerChartQuestion.ts";
import useLocalI18n from "../composables/useLocalI18n.ts";
import { chartQuestion } from "../locales/index.ts";

defineOptions({ inheritAttrs: false });

const props = defineProps<{ question: QuestionChartModel }>();
// survey-vue3-ui's question wrapper has already made the question reactive

const { t, locale } = useLocalI18n(chartQuestion);

// Fixed categorical order (never cycled): a ninth slice folds into "Other"
const SLOTS = 8;
// Shown in the designer, where nothing is answered yet
const SAMPLE = [6, 9, 4, 7, 5, 8, 3, 6];

interface Point {
  key: string;
  label: string;
  value: number;
  /** A CSS colour: the item's own, or a palette slot */
  color: string;
}

const root = ref<HTMLElement>();
const rtl = ref(false);
onMounted(() => {
  if (root.value) rtl.value = getComputedStyle(root.value).direction === "rtl";
});

const type = computed(() => props.question.chartType || "bar");
const isDesign = computed(() => !!props.question.isDesignMode);

const items = computed<ChartItemValue[]>(() => props.question.items ?? []);

/** Points with a number; in the designer, sample numbers stand in. */
const points = computed<Point[]>(() => {
  const values = props.question.chartValues;
  const list: Point[] = [];
  items.value.forEach((item, i) => {
    const key = String(item.value);
    const value = isDesign.value ? SAMPLE[i % SAMPLE.length] : values[key];
    if (value === null || value === undefined) return;
    const own = item.color;
    list.push({
      key,
      label: item.text || key,
      value,
      color: own || seriesColor(type.value === "donut" ? i : 0),
    });
  });
  return list;
});

function seriesColor(index: number) {
  return `var(--fb-chart-c${(index % SLOTS) + 1})`;
}

const number = computed(
  () => new Intl.NumberFormat(locale.value, { maximumFractionDigits: 2 }),
);
const fmt = (n: number) => {
  const text = number.value.format(n);
  return props.question.unit ? `${text} ${props.question.unit}` : text;
};

const state = computed(() => {
  if (!items.value.length) return "noItems";
  if (!points.value.length) return "empty";
  return "ready";
});

const summary = computed(() =>
  t("summary", {
    type: t(`types.${type.value}`),
    points: points.value.map((p) => `${p.label} ${fmt(p.value)}`).join("، "),
  }),
);

// ---- value axis (bar, horizontal bar, line) ----

function niceCeil(n: number) {
  if (n <= 0) return 0;
  const step = 10 ** Math.floor(Math.log10(n));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * step >= n) return m * step;
  return 10 * step;
}

const scale = computed(() => {
  const values = points.value.map((p) => p.value);
  const max = props.question.maxValue ?? niceCeil(Math.max(0, ...values));
  const min = Math.min(0, ...values) < 0 ? -niceCeil(-Math.min(...values)) : 0;
  const span = max - min || 1;
  const ticks = [0, 1, 2, 3, 4].map((i) => min + (span * i) / 4);
  return { min, max, span, ticks };
});

/** Position 0..1 of a value along the value axis, clamped. */
const at = (v: number) =>
  Math.min(1, Math.max(0, (v - scale.value.min) / scale.value.span));

// SVG geometry for the vertical bar and line charts
const W = 600;
const H = 260;
const PAD = { top: 12, bottom: 36, side: 48, end: 12 };
const plotW = W - PAD.side - PAD.end;
const plotH = H - PAD.top - PAD.bottom;
const y = (v: number) => PAD.top + plotH * (1 - at(v));

// Right-to-left forms put the value axis on the right and run the slots from it
const plotX = computed(() => (rtl.value ? PAD.end : PAD.side));
/** x of the centre of slot i. */
function x(i: number) {
  const offset = (plotW * (i + 0.5)) / Math.max(1, points.value.length);
  return rtl.value ? plotX.value + plotW - offset : plotX.value + offset;
}
const slotW = computed(() => plotW / Math.max(1, points.value.length));
const barW = computed(() => Math.min(48, slotW.value * 0.6));
const labelChars = computed(() => Math.max(3, Math.floor(slotW.value / 7)));
const clip = (s: string) =>
  s.length > labelChars.value ? s.slice(0, labelChars.value - 1) + "…" : s;

/** A bar with 4px rounded data end, square at the baseline. */
function barPath(i: number, v: number) {
  const w = barW.value;
  const left = x(i) - w / 2;
  const base = y(Math.max(scale.value.min, Math.min(0, scale.value.max)));
  const top = y(v);
  const h = Math.abs(base - top);
  const r = Math.min(4, w / 2, h);
  if (h === 0) return "";
  if (top < base) {
    return `M${left},${base}V${top + r}Q${left},${top} ${left + r},${top}H${left + w - r}Q${left + w},${top} ${left + w},${top + r}V${base}Z`;
  }
  return `M${left},${base}V${top - r}Q${left},${top} ${left + r},${top}H${left + w - r}Q${left + w},${top} ${left + w},${top - r}V${base}Z`;
}

const linePath = computed(() =>
  points.value
    .map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`)
    .join(""),
);

// ---- donut ----

const slices = computed(() => {
  const positive = points.value.filter((p) => p.value > 0);
  const shown = positive.slice(0, SLOTS);
  const rest = positive.slice(SLOTS);
  if (rest.length) {
    // The ninth and later fold into "Other" in neutral ink, not a new hue
    shown[SLOTS - 1] = {
      key: "__other",
      label: t("other"),
      value: [shown[SLOTS - 1], ...rest].reduce((s, p) => s + p!.value, 0),
      color: "var(--fb-chart-muted)",
    };
  }
  const total = shown.reduce((s, p) => s + p.value, 0) || 1;
  let start = 0;
  return shown.map((p) => {
    const share = p.value / total;
    const slice = { ...p, share, start, end: start + share };
    start += share;
    return slice;
  });
});

const R = 80;
const RING = 26;
const C = 100;
function arc(start: number, end: number) {
  // A 2px surface gap between neighbours; a lone slice is a full ring
  if (end - start >= 0.9999) {
    return `M${C},${C - R}A${R},${R} 0 1 1 ${C - 0.01},${C - R}Z`;
  }
  const gap = 1 / (2 * Math.PI * R);
  const a0 = 2 * Math.PI * (start + gap) - Math.PI / 2;
  const a1 = 2 * Math.PI * (end - gap) - Math.PI / 2;
  const large = end - start > 0.5 ? 1 : 0;
  const p = (a: number) => `${C + R * Math.cos(a)},${C + R * Math.sin(a)}`;
  return `M${p(a0)}A${R},${R} 0 ${large} 1 ${p(a1)}`;
}
const percent = computed(
  () => new Intl.NumberFormat(locale.value, { style: "percent" }),
);

// ---- hover / focus tooltip ----

const active = ref<string | null>(null);
const activePoint = computed(() =>
  points.value.find((p) => p.key === active.value) ??
  slices.value.find((p) => p.key === active.value),
);
const show = (key: string) => (active.value = key);
const hide = () => (active.value = null);
</script>

<template>
  <div ref="root" class="fb-chart" :data-type="type">
    <div v-if="state !== 'ready'" class="fb-chart__empty">
      {{ t(state) }}
    </div>

    <template v-else>
      <div class="fb-chart__head">
        <p v-if="isDesign" class="fb-chart__note">{{ t("sampleData") }}</p>
        <div class="fb-chart__tooltip" aria-hidden="true" :class="{ 'is-on': activePoint }">
          <template v-if="activePoint">
            <span class="fb-chart__swatch" :style="{ background: activePoint.color }" />
            <span>{{ activePoint.label }}</span>
            <strong>{{ fmt(activePoint.value) }}</strong>
          </template>
        </div>
      </div>

      <!-- Horizontal bars in HTML, so labels wrap and follow the text direction -->
      <ul
        v-if="type === 'horizontalBar'"
        class="fb-chart__rows"
        role="img"
        :aria-label="summary"
      >
        <li
          v-for="p in points"
          :key="p.key"
          class="fb-chart__row"
          tabindex="0"
          :class="{ 'is-active': active === p.key }"
          @mouseenter="show(p.key)"
          @mouseleave="hide"
          @focus="show(p.key)"
          @blur="hide"
        >
          <span class="fb-chart__row-label">{{ p.label }}</span>
          <span class="fb-chart__track">
            <span
              class="fb-chart__fill"
              :style="{ inlineSize: `${Math.max(at(p.value) * 100, 0.5)}%`, background: p.color }"
            />
          </span>
          <span class="fb-chart__row-value">{{ fmt(p.value) }}</span>
        </li>
      </ul>

      <div v-else-if="type === 'donut'" class="fb-chart__donut">
        <svg viewBox="0 0 200 200" role="img" :aria-label="summary" class="fb-chart__donut-svg">
          <g v-for="s in slices" :key="s.key">
            <path
              :d="arc(s.start, s.end)"
              fill="none"
              :stroke="s.color"
              :stroke-width="active === s.key ? RING + 4 : RING"
              class="fb-chart__slice"
            />
            <!-- A wider invisible ring is the hit target -->
            <path
              :d="arc(s.start, s.end)"
              fill="none"
              stroke="transparent"
              :stroke-width="RING + 16"
              tabindex="0"
              class="fb-chart__hit"
              @mouseenter="show(s.key)"
              @mouseleave="hide"
              @focus="show(s.key)"
              @blur="hide"
            />
          </g>
          <text :x="C" :y="C" class="fb-chart__total" text-anchor="middle" dominant-baseline="central">
            {{ fmt(slices.reduce((sum, s) => sum + s.value, 0)) }}
          </text>
        </svg>
        <ul class="fb-chart__legend">
          <li
            v-for="s in slices"
            :key="s.key"
            :class="{ 'is-active': active === s.key }"
            @mouseenter="show(s.key)"
            @mouseleave="hide"
          >
            <span class="fb-chart__swatch" :style="{ background: s.color }" />
            <span class="fb-chart__legend-label">{{ s.label }}</span>
            <span class="fb-chart__legend-value">{{ fmt(s.value) }}</span>
            <span class="fb-chart__legend-share">{{ percent.format(s.share) }}</span>
          </li>
        </ul>
      </div>

      <svg
        v-else
        :viewBox="`0 0 ${W} ${H}`"
        class="fb-chart__svg"
        role="img"
        :aria-label="summary"
        @mouseleave="hide"
      >
        <g class="fb-chart__grid">
          <template v-for="tick in scale.ticks" :key="tick">
            <line
              :x1="plotX"
              :x2="plotX + plotW"
              :y1="y(tick)"
              :y2="y(tick)"
              :class="{ 'is-zero': tick === 0 }"
            />
            <text
              :x="rtl ? plotX + plotW + 6 : plotX - 6"
              :y="y(tick)"
              :text-anchor="rtl ? 'start' : 'end'"
              dominant-baseline="central"
            >
              {{ number.format(tick) }}
            </text>
          </template>
        </g>

        <g v-for="(p, i) in points" :key="p.key">
          <!-- The whole slot is the hit target, larger than the mark -->
          <rect
            :x="x(i) - slotW / 2"
            :y="PAD.top"
            :width="slotW"
            :height="plotH"
            class="fb-chart__hit"
            :class="{ 'is-active': active === p.key }"
            tabindex="0"
            @mouseenter="show(p.key)"
            @focus="show(p.key)"
            @blur="hide"
          />
          <path
            v-if="type === 'bar'"
            :d="barPath(i, p.value)"
            :fill="p.color"
            class="fb-chart__bar"
          />
          <text
            :x="x(i)"
            :y="H - PAD.bottom + 18"
            text-anchor="middle"
            class="fb-chart__category"
          >
            <title>{{ p.label }}</title>
            {{ clip(p.label) }}
          </text>
        </g>

        <template v-if="type === 'line'">
          <path :d="linePath" fill="none" :stroke="points[0]?.color" class="fb-chart__line" />
          <circle
            v-for="(p, i) in points"
            :key="p.key"
            :cx="x(i)"
            :cy="y(p.value)"
            :r="active === p.key ? 6 : 4.5"
            :fill="points[0]?.color"
            class="fb-chart__marker"
          />
        </template>
      </svg>

      <!-- The numbers for screen readers -->
      <table class="fb-chart__sr">
        <thead>
          <tr>
            <th scope="col">{{ t("label") }}</th>
            <th scope="col">{{ t("value") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in points" :key="p.key">
            <th scope="row">{{ p.label }}</th>
            <td>{{ fmt(p.value) }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>

<style scoped>
.fb-chart {
  /* Categorical slots in fixed order (dataviz reference palette), light */
  --fb-chart-c1: #2a78d6;
  --fb-chart-c2: #eb6834;
  --fb-chart-c3: #1baf7a;
  --fb-chart-c4: #eda100;
  --fb-chart-c5: #e87ba4;
  --fb-chart-c6: #008300;
  --fb-chart-c7: #6250d6;
  --fb-chart-c8: #e34948;
  --fb-chart-text: var(--sjs-general-forecolor, rgba(0, 0, 0, 0.91));
  --fb-chart-muted: var(--sjs-general-forecolor-light, rgba(0, 0, 0, 0.45));
  --fb-chart-grid: var(--sjs-border-light, rgba(0, 0, 0, 0.09));
  --fb-chart-surface: var(--sjs-questionpanel-backcolor, var(--sjs-general-backcolor, #fff));
  position: relative;
  color: var(--fb-chart-text);
  font-family: inherit;
  padding-block: 8px;
}

:global(html.dark) .fb-chart {
  --fb-chart-c1: #3987e5;
  --fb-chart-c2: #d95926;
  --fb-chart-c3: #199e70;
  --fb-chart-c4: #c98500;
  --fb-chart-c5: #d55181;
  --fb-chart-c6: #008300;
  --fb-chart-c7: #9085e9;
  --fb-chart-c8: #e66767;
}

.fb-chart__head {
  display: flex;
  align-items: center;
  gap: 12px;
  min-block-size: 28px;
  margin-block-end: 4px;
}

.fb-chart__note {
  margin: 0;
  font-size: 12px;
  color: var(--fb-chart-muted);
}

.fb-chart__empty {
  display: grid;
  place-items: center;
  min-block-size: 120px;
  padding: 16px;
  border: 1px dashed var(--fb-chart-grid);
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
  color: var(--fb-chart-muted);
}

.fb-chart__tooltip {
  margin-inline-start: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--fb-chart-surface);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  font-size: 13px;
  opacity: 0;
  transition: opacity 120ms ease-out;
  pointer-events: none;
}
.fb-chart__tooltip.is-on {
  opacity: 1;
}

.fb-chart__swatch {
  inline-size: 10px;
  block-size: 10px;
  border-radius: 3px;
  flex: none;
}

.fb-chart__svg {
  display: block;
  /* Anchors are placed by hand; an inherited rtl would flip text-anchor */
  direction: ltr;
  inline-size: 100%;
  block-size: auto;
  overflow: visible;
}

.fb-chart__grid line {
  stroke: var(--fb-chart-grid);
  stroke-width: 1;
}
.fb-chart__grid line.is-zero {
  stroke: var(--fb-chart-muted);
}
.fb-chart__grid text,
.fb-chart__category {
  fill: var(--fb-chart-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.fb-chart__hit {
  fill: transparent;
  outline: none;
  cursor: default;
}
rect.fb-chart__hit.is-active {
  fill: var(--fb-chart-grid);
}
.fb-chart__hit:focus-visible {
  stroke: var(--sjs-primary-backcolor, #19b394);
  stroke-width: 2;
}

.fb-chart__bar,
.fb-chart__marker,
.fb-chart__slice {
  pointer-events: none;
  transition: stroke-width 120ms ease-out, r 120ms ease-out;
}
.fb-chart__marker {
  stroke: var(--fb-chart-surface);
  stroke-width: 2;
}
.fb-chart__line {
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
  pointer-events: none;
}

.fb-chart__rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 2px;
}
.fb-chart__row {
  display: grid;
  grid-template-columns: minmax(0, 30%) 1fr auto;
  align-items: center;
  gap: 12px;
  min-block-size: 32px;
  padding-inline: 4px;
  border-radius: 6px;
  outline: none;
}
.fb-chart__row.is-active {
  background: var(--fb-chart-grid);
}
.fb-chart__row:focus-visible {
  box-shadow: 0 0 0 2px var(--sjs-primary-backcolor, #19b394);
}
.fb-chart__row-label {
  font-size: 13px;
  overflow-wrap: anywhere;
}
.fb-chart__track {
  display: block;
  block-size: 14px;
}
.fb-chart__fill {
  display: block;
  block-size: 100%;
  border-start-end-radius: 4px;
  border-end-end-radius: 4px;
}
.fb-chart__row-value {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.fb-chart__donut {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px;
}
.fb-chart__donut-svg {
  inline-size: min(200px, 100%);
  flex: none;
  overflow: visible;
}
.fb-chart__total {
  fill: var(--fb-chart-text);
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.fb-chart__legend {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1 1 200px;
  display: grid;
  gap: 4px;
}
.fb-chart__legend li {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 13px;
}
.fb-chart__legend li.is-active {
  background: var(--fb-chart-grid);
}
.fb-chart__legend-label {
  overflow-wrap: anywhere;
}
.fb-chart__legend-value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.fb-chart__legend-share {
  min-inline-size: 3.5em;
  text-align: end;
  color: var(--fb-chart-muted);
  font-variant-numeric: tabular-nums;
}

.fb-chart__sr {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .fb-chart * {
    transition: none !important;
  }
}
</style>
