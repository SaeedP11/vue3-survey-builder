<script setup lang="ts">
import { ref } from "vue";
import type { SurveyModel } from "survey-core";
import { MessageSquare, X } from "lucide-vue-next";
import type { ChatBotPersona } from "../../types/chat";
import SurveyChat from "./SurveyChat.vue";
import useLocalI18n from "../../composables/useLocalI18n";
import { chat } from "../../locales/index";

const props = withDefaults(
  defineProps<{
    json?: object;
    model?: SurveyModel;
    persona?: ChatBotPersona;
    position?: "bottom-right" | "bottom-left";
    defaultOpen?: boolean;
    autoAdvanceOnSelect?: boolean;
    allowEditPastAnswers?: boolean;
    persistKey?: string;
  }>(),
  {
    position: "bottom-right",
    defaultOpen: false,
    autoAdvanceOnSelect: true,
    allowEditPastAnswers: true,
  },
);

const emit = defineEmits<{
  complete: [result: Record<string, unknown>];
  answer: [questionName: string, value: unknown];
  open: [];
  close: [];
}>();

const { t } = useLocalI18n(chat);
const isOpen = ref(props.defaultOpen);

function toggle() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    emit("open");
  } else {
    emit("close");
  }
}
</script>

<template>
  <aside
    class="survey-chat-widget-root fixed z-50 flex flex-col font-fb"
    :class="position === 'bottom-right' ? 'right-5 bottom-5 items-end' : 'left-5 bottom-5 items-start'"
  >
    <!-- Floating Window -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-4 scale-95"
    >
      <div
        v-if="isOpen"
        class="mb-3 w-[380px] h-[560px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col"
      >
        <SurveyChat
          :json="json"
          :model="model"
          :persona="persona"
          :auto-advance-on-select="autoAdvanceOnSelect"
          :allow-edit-past-answers="allowEditPastAnswers"
          :persist-key="persistKey"
          @complete="(res) => emit('complete', res)"
          @answer="(name, val) => emit('answer', name, val)"
        >
          <template #header-actions>
            <button
              type="button"
              class="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              :title="t('close')"
              @click="toggle"
            >
              <X class="w-4 h-4" />
            </button>
          </template>
        </SurveyChat>
      </div>
    </Transition>

    <!-- Launcher Button -->
    <button
      type="button"
      class="flex items-center justify-center w-13 h-13 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
      @click="toggle"
    >
      <X v-if="isOpen" class="w-5 h-5" />
      <MessageSquare v-else class="w-5 h-5" />
    </button>
  </aside>
</template>
