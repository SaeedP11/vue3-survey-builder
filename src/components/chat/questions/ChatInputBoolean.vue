<script setup lang="ts">
import type { QuestionBooleanModel } from "survey-core";
import useLocalI18n from "../../../composables/useLocalI18n";
import { chat } from "../../../locales/index";

const props = defineProps<{
  question: QuestionBooleanModel;
}>();

const emit = defineEmits<{
  submit: [value: boolean];
}>();

const { t } = useLocalI18n(chat);

const labelTrue = props.question.labelTrue || t("yes");
const labelFalse = props.question.labelFalse || t("no");
</script>

<template>
  <div class="flex flex-wrap gap-2 pt-2">
    <button
      type="button"
      class="inline-flex items-center px-4 py-1.5 text-xs font-medium rounded-full border border-emerald-500/40 bg-emerald-50/70 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-emerald-600 dark:hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
      @click="emit('submit', true)"
    >
      {{ labelTrue }}
    </button>
    <button
      type="button"
      class="inline-flex items-center px-4 py-1.5 text-xs font-medium rounded-full border border-rose-500/40 bg-rose-50/70 hover:bg-rose-600 hover:text-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-rose-600 dark:hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
      @click="emit('submit', false)"
    >
      {{ labelFalse }}
    </button>
  </div>
</template>
