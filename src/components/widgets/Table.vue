<template>
  <div
    class="w-full max-w-5xl mx-auto rounded-2xl border border-[var(--sjs-border-inside)] shadow-sm overflow-hidden font-sans bg-[var(--sjs-general-backcolor)]"
  >
    <div class="w-full overflow-x-auto">
      <table class="w-full text-right border-collapse">
        <thead>
          <tr
            class="border-b border-[var(--sjs-border-inside)] text-xs font-bold uppercase tracking-wider text-[var(--sjs-general-forecolor-light)]"
          >
            <th class="py-4 px-6 font-semibold text-left">{{ t("table.metric") }}</th>
            <th class="py-4 px-6 font-semibold text-center">{{ t("table.currentValue") }}</th>
            <th class="py-4 px-6 font-semibold text-center">{{ t("table.normalRange") }}</th>
            <th class="py-4 px-6 font-semibold text-center">{{ t("table.status") }}</th>
          </tr>
        </thead>

        <tbody
          class="divide-y divide-[var(--sjs-border-light)] text-sm text-[var(--sjs-general-forecolor)]"
        >
          <tr
            v-for="row in processedData"
            :key="row.id"
            class="transition-colors group hover:bg-[var(--sjs-general-backcolor-dim-light)]"
          >
            <td class="py-4 px-6">
              <div class="flex items-center gap-3">
                <div
                  class="w-2 h-2 rounded-full ring-4"
                  :style="{
                    backgroundColor: row.statusColor.fill,
                    boxShadow: `0 0 0 4px ${row.statusColor.fillSoft}`,
                  }"
                ></div>
                <div>
                  <div
                    class="font-bold text-[var(--sjs-general-forecolor)] group-hover:text-[var(--sjs-general-forecolor)] transition-colors"
                  >
                    {{ row.metric }}
                  </div>
                </div>
              </div>
            </td>

            <td
              class="py-4 px-6 text-center font-mono font-bold text-[var(--sjs-general-forecolor)] text-base"
            >
              {{ row.currentValue }}
              <span
                class="text-xs font-sans font-medium text-[var(--sjs-general-forecolor-light)] mr-0.5"
                >{{ row.displayUnit }}</span
              >
            </td>

            <td
              class="py-4 px-6 text-center font-mono text-xs text-[var(--sjs-general-forecolor-light)]"
            >
              {{ row.displayRange }}
            </td>

            <td class="py-4 px-6 text-center">
              <span
                class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border"
                :style="{
                  color: row.statusColor.fill,
                  backgroundColor: row.statusColor.fillSoft,
                  borderColor: row.statusColor.fillSoft,
                }"
              >
                {{ row.statusText }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TableRow } from "../../types/index.ts";
import { pickLabel } from "../../utils/statusTiers.ts";
import useLocalI18n from "../../composables/useLocalI18n.ts";
import { surveyResult } from "../../locales/index.ts";

const props = defineProps<{
  rows?: TableRow[];
  statusLabels?: string[];
}>();

const { t } = useLocalI18n(surveyResult);

const resolvedStatusLabels = computed<string[]>(() =>
  Array.isArray(props.statusLabels) && props.statusLabels.length
    ? props.statusLabels
    : ["Mild", "Moderate", "Severe", "Critical"],
);

const defaultRows: TableRow[] = [
  { id: 1, metric: "ضربان قلب", value: 74, min: 60, max: 100, unit: "BPM" },
  {
    id: 2,
    metric: "فشار خون سیستولیک",
    value: 135,
    min: 90,
    max: 120,
    unit: "mmHg",
  },
  {
    id: 3,
    metric: "سطح اکسیژن خون (SpO2)",
    value: 98,
    min: 95,
    max: 100,
    unit: "%",
  },
  {
    id: 4,
    metric: "دمای مرکزی بدن",
    value: 38.6,
    min: 36.5,
    max: 37.5,
    unit: "°C",
  },
];

const resolveRows = computed<TableRow[]>(() => {
  const incoming = Array.isArray(props.rows) ? props.rows : [];
  return incoming.length ? incoming : defaultRows;
});

type StatusTheme = { fill: string; fillSoft: string };

const statusThemes: Record<string, StatusTheme> = {
  normal: {
    fill: "var(--sjs-special-green)",
    fillSoft: "var(--sjs-special-green-light)",
  },
  warning: {
    fill: "var(--sjs-special-yellow)",
    fillSoft: "var(--sjs-special-yellow-light)",
  },
  critical: {
    fill: "var(--sjs-special-red)",
    fillSoft: "var(--sjs-special-red-light)",
  },
  stable: {
    fill: "var(--sjs-special-blue)",
    fillSoft: "var(--sjs-special-blue-light)",
  },
};

const processedData = computed(() => {
  return resolveRows.value.map((row, idx) => {
    const rawValue = row.value;
    const numericValue =
      typeof rawValue === "number" ? rawValue : Number(rawValue);
    const hasValue =
      typeof rawValue === "number" ||
      (typeof rawValue === "string" && rawValue.trim() !== "" &&
        !Number.isNaN(numericValue));
    const min = Number(row.min ?? 0);
    const max = Number(row.max ?? 0);
    const unit = row.unit ?? "";

    const rangeSpan = max - min;
    let statusText = pickLabel(resolvedStatusLabels.value, 0, "—");
    let theme = statusThemes.normal;

    if (hasValue) {
      if (numericValue > max) {
        if (rangeSpan > 0 && numericValue - max > rangeSpan * 0.3) {
          statusText = pickLabel(resolvedStatusLabels.value, 2, "—");
          theme = statusThemes.critical;
        } else {
          statusText = pickLabel(resolvedStatusLabels.value, 1, "—");
          theme = statusThemes.warning;
        }
      } else if (numericValue < min) {
        if (rangeSpan > 0 && min - numericValue > rangeSpan * 0.3) {
          statusText = pickLabel(resolvedStatusLabels.value, 2, "—");
          theme = statusThemes.critical;
        } else {
          statusText = pickLabel(resolvedStatusLabels.value, 1, "—");
          theme = statusThemes.warning;
        }
      }
    }

    return {
      id: row.id ?? idx,
      metric: row.metric,
      currentValue: hasValue ? numericValue : "—",
      displayRange: `${min} - ${max}`,
      displayUnit: unit,
      statusText,
      statusColor: theme,
    };
  });
});
</script>