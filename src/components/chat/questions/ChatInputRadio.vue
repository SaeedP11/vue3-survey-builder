<script setup lang="ts">
import type { QuestionRadiogroupModel } from "survey-core";

const props = defineProps<{
  question: QuestionRadiogroupModel;
}>();

const emit = defineEmits<{
  submit: [value: unknown];
}>();

function choose(val: unknown) {
  emit("submit", val);
}
</script>

<template>
  <div class="flex flex-wrap gap-2 pt-2">
    <button
      v-for="item in question.visibleChoices"
      :key="String(item.value)"
      type="button"
      class="inline-flex items-center px-3.5 py-1.5 text-xs font-medium rounded-full border border-blue-500/40 bg-blue-50/70 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-blue-600 dark:hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
      @click="choose(item.value)"
    >
      {{ item.text }}
    </button>
  </div>
</template>
