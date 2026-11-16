<script setup lang="ts">
import type { QuestionRatingModel } from "survey-core";

const props = defineProps<{
  question: QuestionRatingModel;
}>();

const emit = defineEmits<{
  submit: [value: number];
}>();

function selectRating(val: number) {
  emit("submit", val);
}
</script>

<template>
  <div class="flex items-center gap-1.5 flex-wrap pt-2">
    <button
      v-for="item in question.visibleRateValues"
      :key="String(item.value)"
      type="button"
      class="flex-1 min-w-[34px] h-9 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center shadow-xs cursor-pointer active:scale-95"
      @click="selectRating(Number(item.value))"
    >
      {{ item.text || item.value }}
    </button>
  </div>
</template>
