<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import type { SurveyModel } from "survey-core";
import { X } from "lucide-vue-next";
import type { ChatBotPersona } from "../../types/chat";
import SurveyChat from "./SurveyChat.vue";
import useLocalI18n from "../../composables/useLocalI18n";
import { chat } from "../../locales/index";

const props = withDefaults(
  defineProps<{
    open: boolean;
    json?: object;
    model?: SurveyModel;
    persona?: ChatBotPersona;
    autoAdvanceOnSelect?: boolean;
    allowEditPastAnswers?: boolean;
    persistKey?: string;
  }>(),
  {
    open: false,
    autoAdvanceOnSelect: true,
    allowEditPastAnswers: true,
  },
);

const emit = defineEmits<{
  close: [];
  complete: [result: Record<string, unknown>];
  answer: [questionName: string, value: unknown];
}>();

const { t } = useLocalI18n(chat);

function onKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape" && props.open) {
    emit("close");
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeyDown);
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-fb"
        @click.self="emit('close')"
      >
        <div
          class="relative w-full max-w-lg h-[620px] max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
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
                class="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                :title="t('close')"
                @click="emit('close')"
              >
                <X class="w-4 h-4" />
              </button>
            </template>
          </SurveyChat>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
