<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import type { SurveyModel } from "survey-core";
import { Send, Pencil, Bot, User, AlertCircle, RefreshCw } from "lucide-vue-next";
import type { ChatBotPersona } from "../../types/chat";
import { useSurveyChat } from "../../composables/useSurveyChat";
import { chatQuestionRegistry } from "./registry";
import { registerBuiltInChatQuestions } from "./registerBuiltInQuestions";
import RenderResult from "../RenderResult.vue";
import useLocalI18n from "../../composables/useLocalI18n";
import useColorMode from "../../composables/useColorMode";
import localeDirection from "../../utils/localeDirection";
import { chat } from "../../locales/index";

registerBuiltInChatQuestions();

const props = withDefaults(
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

const { t, locale } = useLocalI18n(chat);
const { isDark } = useColorMode();
const direction = computed(() => props.direction || localeDirection(locale.value));

const effectiveSurvey = computed(() => props.model || props.json || {});
const scrollContainerRef = ref<HTMLElement | null>(null);

const {
  survey,
  messages,
  activeQuestion,
  isTyping,
  isCompleted,
  errorMessage,
  start,
  restart: restartChat,
  submitAnswer,
  editAnswer,
} = useSurveyChat(
  effectiveSurvey.value,
  {
    persona: props.persona,
    autoAdvanceOnSelect: props.autoAdvanceOnSelect,
    allowEditPastAnswers: props.allowEditPastAnswers,
    persistKey: props.persistKey,
  },
  scrollContainerRef,
);

// Text input state for bottom input bar
const textInputValue = ref<string>("");

// Active question component resolution
const activeQuestionRegistration = computed(() => {
  if (!activeQuestion.value) return undefined;
  return chatQuestionRegistry.get(activeQuestion.value.getType());
});

const isInlineQuestion = computed(() => {
  return activeQuestionRegistration.value?.placement === "inline";
});

const isBottomBarActive = computed(() => {
  if (!activeQuestion.value || isCompleted.value) return false;
  return !isInlineQuestion.value;
});

function handleTextSubmit() {
  if (!activeQuestion.value) return;
  const val = textInputValue.value.trim();
  if (!val && activeQuestion.value.isRequired) return;

  const currentQ = activeQuestion.value;
  submitAnswer(currentQ, val).then((success) => {
    if (success) {
      textInputValue.value = "";
      emit("answer", currentQ.name, val);
    }
  });
}

function handleInlineSubmit(val: unknown) {
  if (!activeQuestion.value) return;
  const currentQ = activeQuestion.value;
  submitAnswer(currentQ, val).then((success) => {
    if (success) {
      emit("answer", currentQ.name, val);
    }
  });
}

// Watch completion to emit event
watch(isCompleted, (completed) => {
  if (completed) {
    emit("complete", survey.value.data);
  }
});

function handleRestart() {
  restartChat();
  emit("restart");
}

onMounted(() => {
  start();
});
</script>

<template>
  <div
    class="survey-chat-container font-fb"
    :class="{ 'is-dark': isDark }"
    :dir="direction"
  >
    <!-- Header -->
    <header class="survey-chat-header border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3 flex items-center justify-between shrink-0">
      <slot name="header" :persona="persona" :is-typing="isTyping">
        <div class="flex items-center gap-3">
          <div class="relative">
            <img
              v-if="persona?.avatarUrl"
              :src="persona.avatarUrl"
              :alt="persona?.name || 'Bot'"
              class="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20"
            />
            <div
              v-else
              class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-semibold text-xs"
            >
              <Bot class="w-4 h-4" />
            </div>
            <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
          </div>

          <div>
            <h3 class="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
              {{ persona?.name || survey.title || "Survey Assistant" }}
            </h3>
            <span class="text-[11px] text-slate-500 dark:text-slate-400">
              {{ isTyping ? t("typing") : t("online") }}
            </span>
          </div>
        </div>
      </slot>

      <div class="flex items-center gap-1">
        <slot name="header-actions">
          <button
            v-if="isCompleted"
            type="button"
            class="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            @click="handleRestart"
          >
            <RefreshCw class="w-4 h-4" />
          </button>
        </slot>
      </div>
    </header>

    <!-- Message Stream -->
    <div
      ref="scrollContainerRef"
      class="survey-chat-stream flex-1 overflow-y-auto p-4 space-y-3.5 scroll-smooth"
    >
      <template v-for="(msg, idx) in messages" :key="msg.id">
        <!-- Bot Message Bubble -->
        <div
          v-if="msg.sender === 'bot'"
          class="flex items-start gap-2.5 max-w-[85%] self-start"
        >
          <div class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
            <Bot class="w-3.5 h-3.5" />
          </div>
          <div class="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-xs leading-relaxed shadow-xs break-words">
            <div v-html="msg.text"></div>
          </div>
        </div>

        <!-- User Answer Bubble -->
        <div
          v-else-if="msg.sender === 'user'"
          class="flex items-end justify-end gap-1.5 self-end ml-auto max-w-[85%]"
        >
          <button
            v-if="msg.canEdit && !isCompleted"
            type="button"
            class="p-1 text-slate-400 hover:text-blue-500 rounded-full transition-colors opacity-70 hover:opacity-100 cursor-pointer"
            :title="t('editAnswer')"
            @click="editAnswer(idx)"
          >
            <Pencil class="w-3 h-3" />
          </button>

          <div class="bg-blue-600 text-white px-3.5 py-2 rounded-2xl rounded-tr-sm text-xs shadow-xs break-words">
            <span>{{ msg.renderedDisplayValue || msg.value }}</span>
          </div>

          <div class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px] shrink-0 mb-0.5">
            <User class="w-3.5 h-3.5" />
          </div>
        </div>
      </template>

      <!-- Typing Indicator Dots -->
      <div v-if="isTyping" class="flex items-center gap-2 max-w-[85%] self-start">
        <div class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center shrink-0">
          <Bot class="w-3.5 h-3.5" />
        </div>
        <div class="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-2xl rounded-tl-sm flex items-center gap-1 shadow-xs">
          <span class="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></span>
          <span class="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
          <span class="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
        </div>
      </div>

      <!-- Active Inline Question Input Area (Chips, Ratings, Matrix, Canvas, etc.) -->
      <div v-if="activeQuestion && isInlineQuestion && !isTyping" class="pt-1 ps-8.5">
        <component
          :is="activeQuestionRegistration?.component"
          :question="activeQuestion"
          @submit="handleInlineSubmit"
        />
      </div>

      <!-- Error Message Notice -->
      <div v-if="errorMessage" class="flex items-center gap-2 text-rose-500 dark:text-rose-400 text-xs px-3 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl">
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage || t("invalidInput") }}</span>
      </div>

      <!-- Survey Completion Result Template (if configured in survey) -->
      <div v-if="isCompleted && (survey as any)?.resultTemplate" class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <RenderResult
          :template-props="(survey as any).resultTemplate"
          :result="survey.data"
          :survey="survey"
          embedded
          @restart="handleRestart"
        />
      </div>
    </div>

    <!-- Bottom Input Bar (for Text, Comments, etc.) -->
    <footer
      v-if="isBottomBarActive"
      class="survey-chat-bottom-bar border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shrink-0"
    >
      <form @submit.prevent="handleTextSubmit" class="flex items-center gap-2">
        <input
          v-if="activeQuestion?.getType() === 'text'"
          v-model="textInputValue"
          :type="(activeQuestion as any)?.inputType || 'text'"
          :placeholder="activeQuestion?.placeholder || t('typeYourAnswer')"
          class="flex-1 px-3.5 py-2 text-xs rounded-full bg-slate-100 dark:bg-slate-800 border-0 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 transition-all"
          autofocus
        />

        <textarea
          v-else
          v-model="textInputValue"
          rows="1"
          :placeholder="activeQuestion?.placeholder || t('typeYourMessage')"
          class="flex-1 px-3.5 py-2 text-xs rounded-2xl bg-slate-100 dark:bg-slate-800 border-0 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 resize-none transition-all"
          @keydown.enter.exact.prevent="handleTextSubmit"
        />

        <button
          type="submit"
          :disabled="!textInputValue.trim() && activeQuestion?.isRequired"
          class="p-2 rounded-full bg-blue-600 disabled:opacity-40 disabled:pointer-events-none text-white hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
          :title="t('send')"
        >
          <Send class="w-3.5 h-3.5 rtl:rotate-180" />
        </button>
      </form>
    </footer>
  </div>
</template>

<style scoped>
.survey-chat-container {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: var(--color-formbilder-bg, #ffffff);
  color: var(--color-formbilder-text, #1e293b);
  border-radius: var(--radius-formbilder, 0.75rem);
  overflow: hidden;
}

@container (max-width: 400px) {
  .survey-chat-header {
    padding: 0.5rem 0.75rem;
  }
}
</style>
