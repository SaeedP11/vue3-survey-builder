<script setup lang="ts">
import { computed } from "vue";
import type { ResultMetric } from "../types/index.ts";
import { surveyResultEditor } from "../locales/index.ts";
import useLocalI18n from "../composables/useLocalI18n.ts";
import { MAX_METRICS } from "../utils/resultLayout.ts";
import { newId } from "../utils/resultContent.ts";

const modelValue = defineModel<ResultMetric[]>({ default: () => [] });
const props = defineProps<{
  variables: string[];
  uid: string;
  index: number;
}>();

const { t } = useLocalI18n(surveyResultEditor);

const inputClass =
  "rounded-lg border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg outline-none focus:border-fb-accent";
const iconButton =
  "grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-fb-fg-muted hover:bg-fb-border hover:text-fb-fg disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fb-accent";

const htmlVariables = computed(() => [
  "$score",
  "$status",
  ...props.variables.filter((name) => !name.startsWith("$")),
]);

function updateMetric(id: string, patch: Partial<ResultMetric>) {
  modelValue.value = (modelValue.value ?? []).map((m) => {
    if (m.id !== id) return m;
    const next = { ...m, ...patch };
    if (!next.unit) delete next.unit;
    return next;
  });
}

function addMetric() {
  const list = modelValue.value ?? [];
  if (list.length >= MAX_METRICS) return;
  modelValue.value = [...list, { id: newId("metric"), label: "", value: "" }];
}

function removeMetric(id: string) {
  modelValue.value = (modelValue.value ?? []).filter((m) => m.id !== id);
}
</script>

<template>
  <div class="flex flex-col gap-2" data-metrics>
    <span class="text-[11.5px] font-semibold text-fb-fg-secondary">{{
      t("layout.metrics.label")
    }}</span>
    <p v-if="!modelValue?.length" class="m-0 text-[11.5px] text-fb-fg-muted">
      {{ t("layout.metrics.empty") }}
    </p>
    <div
      v-for="(metric, m) in modelValue"
      :key="metric.id"
      class="grid grid-cols-[1fr_1fr_5rem_auto] items-end gap-2 max-sm:grid-cols-2"
      data-metric
    >
      <div class="flex min-w-0 flex-col gap-1">
        <label
          :for="`${uid}-m-label-${index}-${m}`"
          class="text-[11px] text-fb-fg-muted"
          >{{ t("layout.metrics.name") }}</label
        >
        <input
          :id="`${uid}-m-label-${index}-${m}`"
          :value="metric.label"
          type="text"
          :class="inputClass"
          @input="updateMetric(metric.id, { label: ($event.target as HTMLInputElement).value })"
        />
      </div>
      <div class="flex min-w-0 flex-col gap-1">
        <label
          :for="`${uid}-m-value-${index}-${m}`"
          class="text-[11px] text-fb-fg-muted"
          >{{ t("layout.metrics.value") }}</label
        >
        <input
          :id="`${uid}-m-value-${index}-${m}`"
          :value="metric.value"
          :list="`${uid}-m-vars`"
          type="text"
          dir="ltr"
          spellcheck="false"
          :class="inputClass"
          @input="updateMetric(metric.id, { value: ($event.target as HTMLInputElement).value })"
        />
      </div>
      <div class="flex min-w-0 flex-col gap-1">
        <label
          :for="`${uid}-m-unit-${index}-${m}`"
          class="text-[11px] text-fb-fg-muted"
          >{{ t("layout.metrics.unit") }}</label
        >
        <input
          :id="`${uid}-m-unit-${index}-${m}`"
          :value="metric.unit ?? ''"
          type="text"
          :class="inputClass"
          @input="updateMetric(metric.id, { unit: ($event.target as HTMLInputElement).value })"
        />
      </div>
      <button
        type="button"
        :class="iconButton"
        :aria-label="t('layout.metrics.remove')"
        :title="t('layout.metrics.remove')"
        data-remove-metric
        @click="removeMetric(metric.id)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
    </div>
    <datalist :id="`${uid}-m-vars`">
      <option v-for="name in htmlVariables" :key="name" :value="name" />
    </datalist>
    <button
      type="button"
      class="w-fit cursor-pointer rounded-lg border border-fb-border bg-fb-surface px-3 py-1.5 text-[12.5px] font-semibold text-fb-fg hover:border-fb-accent hover:bg-fb-accent-soft disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-fb-accent"
      :disabled="(modelValue?.length ?? 0) >= MAX_METRICS"
      data-add-metric
      @click="addMetric"
    >
      {{ t("layout.metrics.add") }}
    </button>
    <p class="m-0 text-[11px] leading-snug text-fb-fg-muted">
      {{ t("layout.metrics.help") }}
    </p>
  </div>
</template>
