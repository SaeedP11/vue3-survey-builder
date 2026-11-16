<script setup lang="ts">
import { ref } from "vue";
import type { QuestionMatrixModel } from "survey-core";
import useLocalI18n from "../../../composables/useLocalI18n";
import { chat } from "../../../locales/index";

const props = defineProps<{
  question: QuestionMatrixModel;
}>();

const emit = defineEmits<{
  submit: [value: Record<string, unknown>];
}>();

const { t } = useLocalI18n(chat);

const rows = props.question.visibleRows || [];
const columns = props.question.columns || [];

const currentRowIndex = ref(0);
const values = ref<Record<string, unknown>>(
  props.question.value ? { ...props.question.value } : {},
);

function selectValue(colVal: unknown) {
  const row = rows[currentRowIndex.value];
  if (!row) return;

  values.value[row.value] = colVal;

  if (currentRowIndex.value < rows.length - 1) {
    currentRowIndex.value++;
  } else {
    emit("submit", values.value);
  }
}
</script>

<template>
  <div v-if="rows.length > 0" class="flex flex-col gap-2.5 pt-2 max-w-sm w-full">
    <div class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
      <div class="flex items-center justify-between text-xs text-slate-500 mb-2">
        <span class="font-medium text-slate-700 dark:text-slate-200">
          {{ rows[currentRowIndex]?.text }}
        </span>
        <span class="text-[11px] font-mono">
          {{ t("stepOf", { current: currentRowIndex + 1, total: rows.length }) }}
        </span>
      </div>

      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="col in columns"
          :key="String(col.value)"
          type="button"
          class="flex-1 min-w-[70px] py-1.5 px-2 text-xs rounded-lg border text-center transition-all cursor-pointer"
          :class="
            values[rows[currentRowIndex]?.value] === col.value
              ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
          "
          @click="selectValue(col.value)"
        >
          {{ col.text }}
        </button>
      </div>
    </div>
  </div>
</template>
