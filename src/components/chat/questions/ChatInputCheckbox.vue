<script setup lang="ts">
import { ref } from "vue";
import type { QuestionCheckboxModel } from "survey-core";
import { Check } from "lucide-vue-next";
import useLocalI18n from "../../../composables/useLocalI18n";
import { chat } from "../../../locales/index";

const props = defineProps<{
  question: QuestionCheckboxModel;
}>();

const emit = defineEmits<{
  submit: [value: unknown[]];
}>();

const { t } = useLocalI18n(chat);

const selected = ref<unknown[]>(
  Array.isArray(props.question.value) ? [...props.question.value] : [],
);

function toggle(val: unknown) {
  const index = selected.value.indexOf(val);
  if (index > -1) {
    selected.value.splice(index, 1);
  } else {
    selected.value.push(val);
  }
}

function confirm() {
  emit("submit", selected.value);
}
</script>

<template>
  <div class="flex flex-col gap-2.5 pt-2">
    <div class="flex flex-wrap gap-2">
      <button
        v-for="item in question.visibleChoices"
        :key="String(item.value)"
        type="button"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all cursor-pointer"
        :class="
          selected.includes(item.value)
            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
        "
        @click="toggle(item.value)"
      >
        <Check v-if="selected.includes(item.value)" class="w-3.5 h-3.5" />
        <span>{{ item.text }}</span>
      </button>
    </div>

    <div>
      <button
        type="button"
        :disabled="selected.length === 0 && question.isRequired"
        class="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:pointer-events-none text-white shadow-sm transition-all cursor-pointer"
        @click="confirm"
      >
        <span>{{ t("confirm") }}</span>
        <span v-if="selected.length > 0" class="text-[10px] bg-emerald-800/60 px-1.5 py-0.5 rounded-full">
          {{ selected.length }}
        </span>
      </button>
    </div>
  </div>
</template>
