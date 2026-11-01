<script setup lang="ts">
import { inject, computed } from "vue";
import { SURVEY_RESULT_TEMPLATE_KEY } from "../provider/surveyResultTemplateKey.ts";
import SurveyResult from "./templates/SurveyResult.vue";
import type { ResultAction, SurveyResultProps } from "../types";
import { fillPlaceholders } from "../utils/resultContent.ts";
import { fillHtmlPlaceholders, isTemplateVariable } from "../utils/resultHtml.ts";

const props = defineProps<{
  templateProps?: SurveyResultProps;
  result: Record<string, unknown>;
  survey?: any;
  embedded?: boolean;
}>();

const emit = defineEmits<{
  /** Every button click, with the button (its link already filled in). */
  action: [action: ResultAction];
  restart: [];
  close: [];
  primary: [];
  secondary: [];
}>();

const providedTemplate = inject(SURVEY_RESULT_TEMPLATE_KEY, null);
const activeComponent = computed(() => providedTemplate?.component ?? SurveyResult);

const mergedAnswers = computed<Record<string, unknown>>(() => {
  const calculated: Record<string, unknown> = {};
  if (Array.isArray(props.survey?.calculatedValues)) {
    for (const cv of props.survey.calculatedValues) {
      if (cv?.name) {
        calculated[cv.name] = props.survey.getVariable?.(cv.name);
      }
    }
  }
  return { ...calculated, ...props.result };
});

/** A variable name read from the answers/calculated values, or a literal number; else undefined. */
function resolveNumber(key: string | number | undefined): number | undefined {
  const raw =
    typeof key === "string"
      ? (mergedAnswers.value[key] ?? props.survey?.getVariable?.(key))
      : key;
  if (raw === undefined || raw === null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

const resolvedProps = computed<
  (SurveyResultProps & { embedded?: boolean }) | undefined
>(() => {
  const templateProps = props.templateProps;
  if (!templateProps) return undefined;

  return {
    ...templateProps,
    embedded: props.embedded,
    score: resolveNumber(templateProps.score),
    // The editor stores each row's value as a variable name, like the score
    tableRows: templateProps.tableRows?.map((row) => ({
      ...row,
      value: resolveNumber(row.value) ?? "",
    })),
    // `{name}` in a link becomes that answer, so a link can carry the result
    actions: templateProps.actions?.map((action) =>
      action.type === "link" && action.url
        ? { ...action, url: fillPlaceholders(action.url, mergedAnswers.value) }
        : action,
    ),
    // ...and an HTML block shows answers as text. {$score} and the like are
    // the template's own, filled from the score
    layout: Array.isArray(templateProps.layout)
      ? templateProps.layout.map((block) =>
          block?.type === "html" && typeof block.html === "string"
            ? {
                ...block,
                html: fillHtmlPlaceholders(
                  block.html,
                  mergedAnswers.value,
                  (name) => !isTemplateVariable(name),
                ),
              }
            : block,
        )
      : undefined,
  };
});
</script>

<template>
  <component
    :is="activeComponent"
    v-if="resolvedProps"
    v-bind="resolvedProps"
    class="w-full"
    @action="(action: ResultAction) => emit('action', action)"
    @restart="emit('restart')"
    @close="emit('close')"
    @primary="emit('primary')"
    @secondary="emit('secondary')"
  />
</template>
