<script setup lang="ts">
import type { QuestionImagePickerModel } from "survey-core";

const props = defineProps<{
  question: QuestionImagePickerModel;
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
    <div
      v-for="item in question.visibleChoices"
      :key="String(item.value)"
      class="flex flex-col items-center p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
      @click="choose(item.value)"
    >
      <img
        v-if="item.imageLink"
        :src="item.imageLink"
        :alt="item.text"
        class="w-20 h-20 object-cover rounded-lg mb-1.5"
      />
      <span class="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
        {{ item.text }}
      </span>
    </div>
  </div>
</template>
