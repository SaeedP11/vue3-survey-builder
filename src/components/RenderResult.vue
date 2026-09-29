<script setup lang="ts">
import { useSurveyResultTemplate } from "../provider/surveyResultTemplate.ts";
import type { SurveyResultProps } from "../types";
import { computed } from "vue";

const props = defineProps<{
  templateProps?: SurveyResultProps;
  result: Record<string, unknown>;
}>();

const activeTemplate = useSurveyResultTemplate();

/** A variable name read from the answers, or a literal number; else undefined. */
function resolveNumber(key: string | number | undefined): number | undefined {
  const raw = typeof key === "string" ? props.result[key] : key;
  if (raw === undefined || raw === null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

const resolvedProps = computed<SurveyResultProps | undefined>(() => {
  const templateProps = props.templateProps;
  if (!templateProps) return undefined;

  return {
    ...templateProps,
    score: resolveNumber(templateProps.score),
    // The editor stores each row's value as a variable name, like the score
    tableRows: templateProps.tableRows?.map((row) => ({
      ...row,
      value: resolveNumber(row.value) ?? "",
    })),
  };
});
</script>

<template>
  <component
    :is="activeTemplate.component"
    v-if="resolvedProps"
    v-bind="resolvedProps"
    class="w-full"
  />
</template>