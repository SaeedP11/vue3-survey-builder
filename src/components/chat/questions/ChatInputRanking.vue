<script setup lang="ts">
import { ref } from "vue";
import type { QuestionRankingModel } from "survey-core";
import useLocalI18n from "../../../composables/useLocalI18n";
import { chat } from "../../../locales/index";

const props = defineProps<{
  question: QuestionRankingModel;
}>();

const emit = defineEmits<{
  submit: [value: unknown[]];
}>();

const { t } = useLocalI18n(chat);

const items = ref<any[]>(
  props.question.visibleChoices ? [...props.question.visibleChoices] : [],
);

function moveUp(index: number) {
  if (index === 0) return;
  const temp = items.value[index];
  items.value[index] = items.value[index - 1];
  items.value[index - 1] = temp;
}

function moveDown(index: number) {
  if (index === items.value.length - 1) return;
  const temp = items.value[index];
  items.value[index] = items.value[index + 1];
  items.value[index + 1] = temp;
}

function confirm() {
  emit(
    "submit",
    items.value.map((i) => i.value),
  );
}
</script>

<template>
  <div class="flex flex-col gap-2 pt-2 max-w-sm w-full">
    <div class="flex flex-col gap-1.5">
      <div
        v-for="(item, idx) in items"
        :key="String(item.value)"
        class="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
      >
        <div class="flex items-center gap-2">
          <span class="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[10px]">
            {{ idx + 1 }}
          </span>
          <span class="font-medium text-slate-700 dark:text-slate-200">{{ item.text }}</span>
        </div>
        <div class="flex items-center gap-1">
          <button
            type="button"
            :disabled="idx === 0"
            class="px-1.5 py-0.5 text-[10px] rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-20 cursor-pointer"
            @click="moveUp(idx)"
          >
            ▲
          </button>
          <button
            type="button"
            :disabled="idx === items.length - 1"
            class="px-1.5 py-0.5 text-[10px] rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-20 cursor-pointer"
            @click="moveDown(idx)"
          >
            ▼
          </button>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="mt-1 px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer self-start"
      @click="confirm"
    >
      {{ t("confirm") }}
    </button>
  </div>
</template>
