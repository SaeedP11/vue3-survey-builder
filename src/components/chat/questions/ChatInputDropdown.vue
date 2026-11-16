<script setup lang="ts">
import { ref, computed } from "vue";
import type { QuestionDropdownModel } from "survey-core";
import useLocalI18n from "../../../composables/useLocalI18n";
import { chat } from "../../../locales/index";

const props = defineProps<{
  question: QuestionDropdownModel;
}>();

const emit = defineEmits<{
  submit: [value: unknown];
}>();

const { t } = useLocalI18n(chat);

const query = ref("");
const selectedValue = ref<unknown>(props.question.value ?? "");

const filteredChoices = computed(() => {
  const choices = props.question.visibleChoices || [];
  if (!query.value.trim()) return choices;
  const q = query.value.toLowerCase();
  return choices.filter(
    (c) =>
      c.text.toLowerCase().includes(q) ||
      String(c.value).toLowerCase().includes(q),
  );
});

function selectChoice(val: unknown) {
  selectedValue.value = val;
  emit("submit", val);
}
</script>

<template>
  <div class="flex flex-col gap-2 pt-2 max-w-sm w-full">
    <input
      v-if="question.visibleChoices.length > 5"
      v-model="query"
      type="text"
      :placeholder="t('searchPlaceholder')"
      class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
    />

    <div class="max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700/60 shadow-xs">
      <button
        v-for="item in filteredChoices"
        :key="String(item.value)"
        type="button"
        class="w-full px-3 py-2 text-xs text-start hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center justify-between"
        :class="selectedValue === item.value ? 'bg-blue-50 dark:bg-slate-700 font-semibold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'"
        @click="selectChoice(item.value)"
      >
        <span>{{ item.text }}</span>
      </button>
      <div v-if="filteredChoices.length === 0" class="p-3 text-xs text-center text-slate-400">
        {{ t("selectAnOption") }}
      </div>
    </div>
  </div>
</template>
