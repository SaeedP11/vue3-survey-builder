<script setup lang="ts">
import type { SurveyModel } from "survey-core";
import type { ChatBotPersona } from "../../types/chat";
import SurveyChat from "./SurveyChat.vue";

withDefaults(
  defineProps<{
    json?: object;
    model?: SurveyModel;
    persona?: ChatBotPersona;
    autoAdvanceOnSelect?: boolean;
    allowEditPastAnswers?: boolean;
    persistKey?: string;
    direction?: "ltr" | "rtl";
  }>(),
  {
    autoAdvanceOnSelect: true,
    allowEditPastAnswers: true,
  },
);

const emit = defineEmits<{
  complete: [result: Record<string, unknown>];
  answer: [questionName: string, value: unknown];
  restart: [];
}>();
</script>

<template>
  <div class="survey-chat-inline-wrapper w-full h-full min-h-[420px] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col font-fb">
    <SurveyChat
      :json="json"
      :model="model"
      :persona="persona"
      :auto-advance-on-select="autoAdvanceOnSelect"
      :allow-edit-past-answers="allowEditPastAnswers"
      :persist-key="persistKey"
      :direction="direction"
      @complete="(res) => emit('complete', res)"
      @answer="(name, val) => emit('answer', name, val)"
      @restart="emit('restart')"
    >
      <template #header="slotProps">
        <slot name="header" v-bind="slotProps" />
      </template>
      <template #header-actions>
        <slot name="header-actions" />
      </template>
    </SurveyChat>
  </div>
</template>
