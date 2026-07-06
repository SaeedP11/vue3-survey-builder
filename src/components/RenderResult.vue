<script setup lang="ts">
import { useSurveyResultTemplate } from "../provider/surveyResultTemplate.ts";
import type { SurveyResultProps } from "../types";
import { computed } from "vue";

const props = defineProps<{
  templateProps?: SurveyResultProps;
  result: Record<string, unknown>;
}>();

const activeTemplate = useSurveyResultTemplate();

const resolvedProps = computed<SurveyResultProps | undefined>(() => {
  const templateProps = props.templateProps;
  if (!templateProps) return undefined;

  const scoreKey = templateProps.score;
  const raw =
    typeof scoreKey === "string" ? props.result[scoreKey] : scoreKey;
  const score = Number(raw);

  return {
    ...templateProps,
    score: Number.isFinite(score) ? score : undefined,
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