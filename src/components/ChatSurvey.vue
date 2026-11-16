<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { type SurveyModel } from "survey-core";
import { useI18n } from "vue-i18n";
import useLocalI18n from "../composables/useLocalI18n";
import { chatSurvey } from "../locales";
import { useSurveyModel } from "../composables/useSurveyModel";
import localeDirection from "../utils/localeDirection";
import DOMPurify from "dompurify";
import PersianDateTimePicker from "./PersianDateTimePicker.vue";
import RenderResult from "./RenderResult.vue";
import {
  AlertCircle,
  Bot,
  Check,
  ChevronRight,
  Edit2,
  RotateCcw,
  Search,
  Send,
  User,
} from "lucide-vue-next";

export interface ChatSurveyProps {
  /** Survey JSON schema if creating a model internally. */
  json?: object;
  /** Existing SurveyModel instance. If provided, takes precedence over json. */
  model?: SurveyModel;
  /** Chat header title. Defaults to survey.title or localized default. */
  title?: string;
  /** Chat header subtitle / description. Defaults to survey.description. */
  description?: string;
  /** Display name of the bot. Defaults to localized "Survey Bot". */
  botName?: string;
  /** Bot avatar emoji or icon. Defaults to bot icon. */
  botAvatar?: string;
  /** Display name of the user. Defaults to localized "You". */
  userName?: string;
  /** User avatar emoji or icon. Defaults to user icon. */
  userAvatar?: string;
  /** Delay in milliseconds before bot asks the next question (typing simulation). */
  typingDelay?: number;
  /** Whether to show the top progress bar and question counter. */
  showProgressBar?: boolean;
  /** Whether users can edit previously submitted answers in the chat history. */
  allowEdit?: boolean;
  /** Whether to show a restart button in the header and completion view. */
  allowRestart?: boolean;
  /** Whether optional questions display a Skip button. */
  allowSkip?: boolean;
  /** Direction override ("ltr" | "rtl"). Defaults to locale direction. */
  dir?: "ltr" | "rtl";
}

const props = withDefaults(defineProps<ChatSurveyProps>(), {
  typingDelay: 200,
  showProgressBar: true,
  allowEdit: true,
  allowRestart: true,
  allowSkip: true,
});

const emit = defineEmits<{
  complete: [data: Record<string, unknown>, survey: SurveyModel];
  change: [data: Record<string, unknown>, question: any];
  answer: [question: any, value: any];
  restart: [];
  skip: [question: any];
  questionChange: [question: any];
}>();

const { t } = useLocalI18n(chatSurvey);
const { locale } = useI18n();

const internalSurvey = useSurveyModel(props.json ?? {});
const survey = computed<SurveyModel>(() => props.model ?? internalSurvey);

const direction = computed(() => props.dir ?? localeDirection(locale.value));

let purifier: ReturnType<typeof DOMPurify> | undefined;
function getPurifier() {
  if (purifier) return purifier;
  if (typeof window === "undefined") return undefined;
  purifier = DOMPurify(window);
  return purifier;
}

function sanitize(html: string | undefined | null): string {
  if (!html) return "";
  const p = getPurifier();
  return p ? p.sanitize(html) : html;
}

function isQuestionVisible(q: any): boolean {
  if (!q) return false;
  let curr: any = q;
  while (curr) {
    if (curr.isVisible === false) return false;
    curr = curr.parent;
  }
  return true;
}

export interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  type: "question" | "answer" | "html" | "completion";
  question?: any;
  questionName?: string;
  displayValue?: string;
  rawValue?: any;
  error?: string | null;
  timestamp: Date;
}

const messages = ref<ChatMessage[]>([]);
const activeQuestion = ref<any>(null);
const isTyping = ref(false);
const isCompleted = ref(false);

// Local inputs for current active question
const inputText = ref("");
const selectedValues = ref<any[]>([]);
const otherText = ref("");
const searchQuery = ref("");
const currentError = ref<string | null>(null);

const chatScrollRef = ref<HTMLElement | null>(null);
const inputElRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null);

function scrollToBottom() {
  nextTick(() => {
    if (chatScrollRef.value) {
      if (typeof chatScrollRef.value.scrollTo === "function") {
        chatScrollRef.value.scrollTo({
          top: chatScrollRef.value.scrollHeight,
          behavior: "smooth",
        });
      } else {
        chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight;
      }
    }
  });
}

const visibleQuestions = computed(() => {
  return survey.value.getAllQuestions().filter(isQuestionVisible);
});

const currentQuestionIndex = computed(() => {
  if (!activeQuestion.value) return visibleQuestions.value.length;
  const idx = visibleQuestions.value.findIndex(
    (q) => q.name === activeQuestion.value.name,
  );
  return idx >= 0 ? idx + 1 : visibleQuestions.value.length;
});

const progressPercent = computed(() => {
  if (isCompleted.value) return 100;
  const total = visibleQuestions.value.length;
  if (total === 0) return 100;
  return Math.min(100, Math.round(((currentQuestionIndex.value - 1) / total) * 100));
});

function initSurvey() {
  messages.value = [];
  isCompleted.value = false;
  activeQuestion.value = null;
  currentError.value = null;

  const firstQ = visibleQuestions.value[0];
  if (firstQ) {
    setActiveQuestion(firstQ);
  } else {
    finishSurvey();
  }
}

function setActiveQuestion(q: any) {
  activeQuestion.value = q;
  currentError.value = null;
  searchQuery.value = "";
  otherText.value = q.comment || "";

  const val = q.value;
  if (Array.isArray(val)) {
    selectedValues.value = [...val];
    inputText.value = "";
  } else if (val !== undefined && val !== null) {
    selectedValues.value = [val];
    inputText.value = String(val);
  } else {
    selectedValues.value = [];
    inputText.value = "";
  }

  // Push bot message for question if not already in messages
  const existingBotMsg = messages.value.find(
    (m) => m.sender === "bot" && m.questionName === q.name,
  );
  if (!existingBotMsg) {
    messages.value.push({
      id: `bot-q-${q.name}-${Date.now()}`,
      sender: "bot",
      type: q.getType() === "html" ? "html" : "question",
      question: q,
      questionName: q.name,
      timestamp: new Date(),
    });
  }

  scrollToBottom();
  emit("questionChange", q);
  nextTick(() => {
    inputElRef.value?.focus?.();
  });
}

function selectSingleOption(val: any, displayText?: string) {
  if (!activeQuestion.value) return;
  const q = activeQuestion.value;
  q.value = val;

  if (q.hasErrors(true)) {
    currentError.value = q.errors[0]?.text || t("errorRequired");
    return;
  }

  currentError.value = null;
  const display =
    displayText ||
    (q.displayValue !== undefined && q.displayValue !== null
      ? String(q.displayValue)
      : String(val));

  commitAnswer(val, display);
}

function toggleCheckboxOption(val: any) {
  const idx = selectedValues.value.indexOf(val);
  if (idx >= 0) {
    selectedValues.value.splice(idx, 1);
  } else {
    selectedValues.value.push(val);
  }
}

function submitMultipleOptions() {
  if (!activeQuestion.value) return;
  const q = activeQuestion.value;
  q.value = [...selectedValues.value];

  if (q.hasErrors(true)) {
    currentError.value = q.errors[0]?.text || t("errorRequired");
    return;
  }

  currentError.value = null;
  const display = q.displayValue
    ? String(q.displayValue)
    : selectedValues.value.join(", ");

  commitAnswer([...selectedValues.value], display);
}

function submitTextAnswer() {
  if (!activeQuestion.value) return;
  const q = activeQuestion.value;
  const text = inputText.value.trim();
  q.value = text || undefined;

  if (q.hasErrors(true)) {
    currentError.value = q.errors[0]?.text || t("errorRequired");
    return;
  }

  currentError.value = null;
  commitAnswer(text, text);
}

function submitOtherWithText(choiceVal: any) {
  if (!activeQuestion.value) return;
  const q = activeQuestion.value;
  q.value = choiceVal;
  if (otherText.value.trim()) {
    q.comment = otherText.value.trim();
  }

  if (q.hasErrors(true)) {
    currentError.value = q.errors[0]?.text || t("errorRequired");
    return;
  }

  currentError.value = null;
  const label = otherText.value.trim()
    ? `${t("otherPlaceholder")}: ${otherText.value.trim()}`
    : String(q.displayValue || choiceVal);

  commitAnswer(choiceVal, label);
}

function skipQuestion() {
  if (!activeQuestion.value) return;
  const q = activeQuestion.value;
  q.value = undefined;
  emit("skip", q);

  messages.value.push({
    id: `user-skip-${q.name}-${Date.now()}`,
    sender: "user",
    type: "answer",
    questionName: q.name,
    displayValue: t("skipped"),
    rawValue: undefined,
    timestamp: new Date(),
  });

  advanceToNextQuestion();
}

function continueHtmlQuestion() {
  advanceToNextQuestion();
}

function commitAnswer(rawVal: any, displayVal: string) {
  if (!activeQuestion.value) return;
  const q = activeQuestion.value;

  messages.value.push({
    id: `user-ans-${q.name}-${Date.now()}`,
    sender: "user",
    type: "answer",
    questionName: q.name,
    displayValue: displayVal,
    rawValue: rawVal,
    timestamp: new Date(),
  });

  emit("change", survey.value.data, q);
  emit("answer", q, rawVal);

  advanceToNextQuestion();
}

function advanceToNextQuestion() {
  const all = survey.value.getAllQuestions();
  const currentIdx = all.findIndex((q) => q.name === activeQuestion.value?.name);

  let nextQ = null;
  for (let i = currentIdx + 1; i < all.length; i++) {
    if (isQuestionVisible(all[i])) {
      nextQ = all[i];
      break;
    }
  }

  if (nextQ) {
    if (props.typingDelay > 0) {
      activeQuestion.value = null;
      isTyping.value = true;
      scrollToBottom();
      setTimeout(() => {
        isTyping.value = false;
        setActiveQuestion(nextQ);
      }, props.typingDelay);
    } else {
      setActiveQuestion(nextQ);
    }
  } else {
    finishSurvey();
  }
}

function finishSurvey() {
  if (props.typingDelay > 0) {
    activeQuestion.value = null;
    isTyping.value = true;
    scrollToBottom();
    setTimeout(() => {
      isTyping.value = false;
      survey.value.doComplete();
      isCompleted.value = true;
      messages.value.push({
        id: `bot-completed-${Date.now()}`,
        sender: "bot",
        type: "completion",
        timestamp: new Date(),
      });
      emit("complete", survey.value.data, survey.value);
      scrollToBottom();
    }, props.typingDelay);
  } else {
    activeQuestion.value = null;
    survey.value.doComplete();
    isCompleted.value = true;
    messages.value.push({
      id: `bot-completed-${Date.now()}`,
      sender: "bot",
      type: "completion",
      timestamp: new Date(),
    });
    emit("complete", survey.value.data, survey.value);
    scrollToBottom();
  }
}

function editAnswer(questionName: string) {
  if (!props.allowEdit || isCompleted.value) return;
  const q = survey.value.getQuestionByName(questionName);
  if (!q) return;

  const botMsgIdx = messages.value.findIndex(
    (m) => m.sender === "bot" && m.questionName === questionName,
  );
  if (botMsgIdx === -1) return;

  // Rewind messages to this question so user re-answers along current path
  messages.value = messages.value.slice(0, botMsgIdx + 1);
  setActiveQuestion(q);
}

function restart() {
  survey.value.clear(true, true);
  emit("restart");
  initSurvey();
}

watch(
  () => props.json,
  (newJson) => {
    if (!props.model && newJson) {
      internalSurvey.fromJSON(newJson);
      initSurvey();
    }
  },
  { deep: true },
);

onMounted(() => {
  initSurvey();
});

function getQuestionChoices(q: any) {
  if (q.visibleChoices) return q.visibleChoices;
  return [];
}

function getRatingChoices(q: any) {
  if (q.visibleRateValues && q.visibleRateValues.length > 0) {
    return q.visibleRateValues;
  }
  const max = q.rateMax || 5;
  const min = q.rateMin || 1;
  const step = q.rateStep || 1;
  const list = [];
  for (let i = min; i <= max; i += step) {
    list.push({ value: i, text: String(i) });
  }
  return list;
}

function filterChoices(choices: any[]) {
  if (!searchQuery.value.trim()) return choices;
  const q = searchQuery.value.trim().toLowerCase();
  return choices.filter((c) => {
    const text = (c.locText?.renderedHtml || c.text || String(c.value)).toLowerCase();
    return text.includes(q);
  });
}
</script>

<template>
  <div
    class="flex h-full w-full flex-col bg-fb-shell text-fb-fg font-fb"
    :dir="direction"
  >
    <!-- Header -->
    <header
      class="flex shrink-0 items-center justify-between border-b border-fb-border bg-fb-surface px-4 py-3 shadow-xs"
    >
      <div class="flex items-center gap-3 min-w-0">
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fb-accent text-fb-accent-on shadow-xs overflow-hidden"
        >
          <span v-if="botAvatar" class="text-lg leading-none select-none">{{ botAvatar }}</span>
          <Bot v-else class="h-5 w-5" />
        </div>
        <div class="min-w-0">
          <h2 class="truncate text-sm font-semibold text-fb-fg">
            {{ title || survey.title || t("title") }}
          </h2>
          <p
            v-if="description || survey.description || t('subtitle')"
            class="truncate text-xs text-fb-fg-muted"
          >
            {{ description || survey.description || t("subtitle") }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <!-- Progress counter -->
        <span
          v-if="showProgressBar && !isCompleted && visibleQuestions.length > 0"
          class="rounded-full bg-fb-surface-muted px-2.5 py-1 text-xs font-medium text-fb-fg-secondary"
        >
          {{
            t("progress", {
              current: currentQuestionIndex,
              total: visibleQuestions.length,
            })
          }}
        </span>

        <!-- Restart button -->
        <button
          v-if="allowRestart"
          type="button"
          class="flex items-center gap-1.5 rounded-lg border border-fb-border bg-fb-surface px-2.5 py-1.5 text-xs font-medium text-fb-fg-secondary hover:bg-fb-surface-muted hover:text-fb-fg transition-colors"
          :title="t('restart')"
          @click="restart"
        >
          <RotateCcw class="h-3.5 w-3.5" />
          <span class="hidden sm:inline">{{ t("restart") }}</span>
        </button>
      </div>
    </header>

    <!-- Progress bar -->
    <div
      v-if="showProgressBar"
      class="h-1 w-full bg-fb-surface-muted shrink-0 overflow-hidden"
    >
      <div
        class="h-full bg-fb-accent transition-all duration-300 ease-out"
        :style="{ width: `${progressPercent}%` }"
      />
    </div>

    <!-- Chat Messages Stream -->
    <main
      ref="chatScrollRef"
      class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
    >
      <div class="mx-auto max-w-2xl space-y-4">
        <template v-for="msg in messages" :key="msg.id">
          <!-- Bot Question / HTML Message -->
          <div
            v-if="msg.sender === 'bot' && (msg.type === 'question' || msg.type === 'html')"
            class="flex items-start gap-3"
          >
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-fb-accent/15 text-fb-accent mt-0.5 overflow-hidden"
            >
              <span v-if="botAvatar" class="text-sm leading-none select-none">{{ botAvatar }}</span>
              <Bot v-else class="h-4.5 w-4.5" />
            </div>

            <div class="flex-1 min-w-0">
              <div
                class="rounded-2xl rounded-ts-xs border border-fb-border bg-fb-surface-muted p-4 shadow-xs"
              >
                <!-- Question Title & Badge -->
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span
                        v-if="msg.question?.isRequired"
                        class="text-xs font-semibold text-rose-500"
                        :title="t('required')"
                      >
                        * {{ t("required") }}
                      </span>
                    </div>
                    <div
                      class="text-sm font-semibold text-fb-fg leading-relaxed"
                      v-html="
                        sanitize(
                          msg.question?.locTitle?.renderedHtml ||
                            msg.question?.title ||
                            msg.question?.name,
                        )
                      "
                    />
                  </div>

                  <!-- Edit button on past question -->
                  <button
                    v-if="
                      allowEdit &&
                      activeQuestion?.name !== msg.questionName &&
                      !isCompleted
                    "
                    type="button"
                    class="rounded-md p-1 text-fb-fg-muted hover:text-fb-accent hover:bg-fb-surface transition-colors"
                    :title="t('edit')"
                    @click="editAnswer(msg.questionName!)"
                  >
                    <Edit2 class="h-3.5 w-3.5" />
                  </button>
                </div>

                <!-- Description -->
                <p
                  v-if="
                    msg.question?.locDescription?.renderedHtml ||
                    msg.question?.description
                  "
                  class="mt-1 text-xs text-fb-fg-muted leading-normal"
                  v-html="
                    sanitize(
                      msg.question?.locDescription?.renderedHtml ||
                        msg.question?.description,
                    )
                  "
                />

                <!-- Interactive Question Area (Shown only if this is the active question) -->
                <div
                  v-if="activeQuestion?.name === msg.questionName"
                  class="mt-4 pt-3 border-t border-fb-border/60 space-y-3"
                >
                  <!-- 1. Single-choice: Radiogroup -->
                  <div
                    v-if="msg.question?.getType() === 'radiogroup'"
                    class="flex flex-col gap-2"
                    role="radiogroup"
                  >
                    <button
                      v-for="c in getQuestionChoices(msg.question)"
                      :key="c.value"
                      type="button"
                      class="w-full rounded-xl border border-fb-border bg-fb-surface px-4 py-2.5 text-start text-sm text-fb-fg transition-all hover:border-fb-accent hover:bg-fb-accent-soft/30 hover:shadow-xs flex items-center justify-between group cursor-pointer"
                      :class="
                        activeQuestion.value === c.value
                          ? 'border-fb-accent bg-fb-accent-soft ring-1 ring-fb-accent text-fb-fg font-medium'
                          : ''
                      "
                      @click="selectSingleOption(c.value, c.locText?.renderedHtml || c.text)"
                    >
                      <span
                        v-html="sanitize(c.locText?.renderedHtml || c.text || String(c.value))"
                      />
                      <span
                        class="h-4 w-4 rounded-full border border-fb-border flex items-center justify-center group-hover:border-fb-accent"
                        :class="
                          activeQuestion.value === c.value
                            ? 'border-fb-accent bg-fb-accent'
                            : ''
                        "
                      >
                        <span
                          v-if="activeQuestion.value === c.value"
                          class="h-1.5 w-1.5 rounded-full bg-white"
                        />
                      </span>
                    </button>

                    <!-- 'Other' text input if needed -->
                    <div
                      v-if="
                        msg.question.hasOther &&
                        activeQuestion.value === (msg.question.otherItem?.value ?? 'other')
                      "
                      class="mt-2 flex gap-2"
                    >
                      <input
                        v-model="otherText"
                        type="text"
                        class="flex-1 rounded-xl border border-fb-border bg-fb-surface px-3 py-2 text-sm text-fb-fg focus:border-fb-accent focus:outline-none"
                        :placeholder="t('otherPlaceholder')"
                        @keydown.enter.prevent="submitOtherWithText(activeQuestion.value)"
                      />
                      <button
                        type="button"
                        class="rounded-xl bg-fb-accent px-4 py-2 text-xs font-medium text-fb-accent-on hover:opacity-90"
                        @click="submitOtherWithText(activeQuestion.value)"
                      >
                        {{ t("confirm") }}
                      </button>
                    </div>
                  </div>

                  <!-- 2. Single-choice: Dropdown -->
                  <div
                    v-else-if="msg.question?.getType() === 'dropdown'"
                    class="space-y-2"
                  >
                    <!-- Search input if choices > 6 -->
                    <div
                      v-if="getQuestionChoices(msg.question).length > 6"
                      class="relative mb-2"
                    >
                      <Search
                        class="absolute start-3 top-2.5 h-4 w-4 text-fb-fg-muted"
                      />
                      <input
                        v-model="searchQuery"
                        type="text"
                        class="w-full rounded-xl border border-fb-border bg-fb-surface ps-9 pe-3 py-2 text-xs text-fb-fg focus:border-fb-accent focus:outline-none"
                        :placeholder="t('searchPlaceholder')"
                      />
                    </div>

                    <div
                      class="flex flex-col gap-1.5 max-h-56 overflow-y-auto pe-1"
                    >
                      <button
                        v-for="c in filterChoices(getQuestionChoices(msg.question))"
                        :key="c.value"
                        type="button"
                        class="w-full rounded-xl border border-fb-border bg-fb-surface px-4 py-2.5 text-start text-sm text-fb-fg transition-all hover:border-fb-accent hover:bg-fb-accent-soft/30 hover:shadow-xs flex items-center justify-between cursor-pointer"
                        :class="
                          activeQuestion.value === c.value
                            ? 'border-fb-accent bg-fb-accent-soft ring-1 ring-fb-accent text-fb-fg font-medium'
                            : ''
                        "
                        @click="selectSingleOption(c.value, c.locText?.renderedHtml || c.text)"
                      >
                        <span
                          v-html="sanitize(c.locText?.renderedHtml || c.text || String(c.value))"
                        />
                        <Check
                          v-if="activeQuestion.value === c.value"
                          class="h-4 w-4 text-fb-accent"
                        />
                      </button>

                      <p
                        v-if="filterChoices(getQuestionChoices(msg.question)).length === 0"
                        class="py-3 text-center text-xs text-fb-fg-muted"
                      >
                        {{ t("noOptionsFound") }}
                      </p>
                    </div>
                  </div>

                  <!-- 3. Boolean (Yes / No) -->
                  <div
                    v-else-if="msg.question?.getType() === 'boolean'"
                    class="grid grid-cols-2 gap-3"
                  >
                    <button
                      type="button"
                      class="rounded-xl border border-fb-border bg-fb-surface px-4 py-3 text-center text-sm font-medium text-fb-fg transition-all hover:border-fb-accent hover:bg-fb-accent-soft/30 hover:shadow-xs cursor-pointer"
                      :class="
                        activeQuestion.value ===
                        (msg.question.valueTrue !== undefined
                          ? msg.question.valueTrue
                          : true)
                          ? 'border-fb-accent bg-fb-accent-soft ring-1 ring-fb-accent'
                          : ''
                      "
                      @click="
                        selectSingleOption(
                          msg.question.valueTrue !== undefined
                            ? msg.question.valueTrue
                            : true,
                          msg.question.locLabelTrue?.renderedHtml ||
                            msg.question.labelTrue ||
                            t('yes'),
                        )
                      "
                    >
                      <span
                        v-html="
                          sanitize(
                            msg.question.locLabelTrue?.renderedHtml ||
                              msg.question.labelTrue ||
                              t('yes'),
                          )
                        "
                      />
                    </button>
                    <button
                      type="button"
                      class="rounded-xl border border-fb-border bg-fb-surface px-4 py-3 text-center text-sm font-medium text-fb-fg transition-all hover:border-fb-accent hover:bg-fb-accent-soft/30 hover:shadow-xs cursor-pointer"
                      :class="
                        activeQuestion.value ===
                        (msg.question.valueFalse !== undefined
                          ? msg.question.valueFalse
                          : false)
                          ? 'border-fb-accent bg-fb-accent-soft ring-1 ring-fb-accent'
                          : ''
                      "
                      @click="
                        selectSingleOption(
                          msg.question.valueFalse !== undefined
                            ? msg.question.valueFalse
                            : false,
                          msg.question.locLabelFalse?.renderedHtml ||
                            msg.question.labelFalse ||
                            t('no'),
                        )
                      "
                    >
                      <span
                        v-html="
                          sanitize(
                            msg.question.locLabelFalse?.renderedHtml ||
                              msg.question.labelFalse ||
                              t('no'),
                          )
                        "
                      />
                    </button>
                  </div>

                  <!-- 4. Rating -->
                  <div
                    v-else-if="msg.question?.getType() === 'rating'"
                    class="space-y-2"
                  >
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="r in getRatingChoices(msg.question)"
                        :key="r.value"
                        type="button"
                        class="flex h-11 min-w-11 items-center justify-center rounded-xl border border-fb-border bg-fb-surface px-3 text-sm font-semibold text-fb-fg transition-all hover:border-fb-accent hover:bg-fb-accent-soft/30 hover:shadow-xs cursor-pointer"
                        :class="
                          activeQuestion.value === r.value
                            ? 'border-fb-accent bg-fb-accent text-fb-accent-on shadow-xs'
                            : ''
                        "
                        @click="selectSingleOption(r.value, r.locText?.renderedHtml || r.text || String(r.value))"
                      >
                        {{ r.locText?.renderedHtml || r.text || r.value }}
                      </button>
                    </div>
                  </div>

                  <!-- 5. Multiple-choice: Checkbox / Tagbox -->
                  <div
                    v-else-if="
                      msg.question?.getType() === 'checkbox' ||
                      msg.question?.getType() === 'tagbox'
                    "
                    class="space-y-3"
                  >
                    <p class="text-xs text-fb-fg-muted">
                      {{ t("selectMultiple") }}
                    </p>
                    <div class="flex flex-col gap-2">
                      <button
                        v-for="c in getQuestionChoices(msg.question)"
                        :key="c.value"
                        type="button"
                        class="w-full rounded-xl border border-fb-border bg-fb-surface px-4 py-2.5 text-start text-sm text-fb-fg transition-all hover:border-fb-accent hover:bg-fb-accent-soft/30 hover:shadow-xs flex items-center justify-between cursor-pointer"
                        :class="
                          selectedValues.includes(c.value)
                            ? 'border-fb-accent bg-fb-accent-soft ring-1 ring-fb-accent text-fb-fg font-medium'
                            : ''
                        "
                        @click="toggleCheckboxOption(c.value)"
                      >
                        <span
                          v-html="sanitize(c.locText?.renderedHtml || c.text || String(c.value))"
                        />
                        <span
                          class="h-4 w-4 rounded-md border border-fb-border flex items-center justify-center transition-colors"
                          :class="
                            selectedValues.includes(c.value)
                              ? 'border-fb-accent bg-fb-accent text-fb-accent-on'
                              : ''
                          "
                        >
                          <Check
                            v-if="selectedValues.includes(c.value)"
                            class="h-3 w-3"
                          />
                        </span>
                      </button>
                    </div>

                    <!-- Confirm button -->
                    <div class="flex items-center justify-end pt-2">
                      <button
                        type="button"
                        class="rounded-xl bg-fb-accent px-4 py-2 text-xs font-semibold text-fb-accent-on hover:opacity-90 shadow-xs transition-opacity cursor-pointer flex items-center gap-1.5"
                        @click="submitMultipleOptions"
                      >
                        <Check class="h-3.5 w-3.5" />
                        <span>
                          {{ t("confirm") }}
                          <template v-if="selectedValues.length > 0">
                            ({{ selectedValues.length }} {{ t("selected") }})
                          </template>
                        </span>
                      </button>
                    </div>
                  </div>

                  <!-- 6. ImagePicker -->
                  <div
                    v-else-if="msg.question?.getType() === 'imagepicker'"
                    class="grid grid-cols-2 sm:grid-cols-3 gap-3"
                  >
                    <button
                      v-for="c in getQuestionChoices(msg.question)"
                      :key="c.value"
                      type="button"
                      class="flex flex-col items-center overflow-hidden rounded-xl border border-fb-border bg-fb-surface p-2 text-center transition-all hover:border-fb-accent hover:shadow-xs cursor-pointer"
                      :class="
                        activeQuestion.value === c.value
                          ? 'border-fb-accent ring-2 ring-fb-accent'
                          : ''
                      "
                      @click="selectSingleOption(c.value, c.locText?.renderedHtml || c.text)"
                    >
                      <img
                        v-if="c.imageLink"
                        :src="c.imageLink"
                        :alt="c.text || String(c.value)"
                        class="h-24 w-full rounded-lg object-cover mb-2"
                      />
                      <span class="text-xs font-medium text-fb-fg">
                        {{ c.locText?.renderedHtml || c.text || c.value }}
                      </span>
                    </button>
                  </div>

                  <!-- 7. Persian Date Picker -->
                  <div
                    v-else-if="msg.question?.getType() === 'persian-datepicker'"
                    class="space-y-3"
                  >
                    <PersianDateTimePicker
                      v-model="inputText"
                      :question="msg.question"
                      @change="(val: string) => (inputText = val)"
                    />
                    <div class="flex justify-end">
                      <button
                        type="button"
                        class="rounded-xl bg-fb-accent px-4 py-2 text-xs font-semibold text-fb-accent-on hover:opacity-90 shadow-xs"
                        @click="submitTextAnswer"
                      >
                        {{ t("confirm") }}
                      </button>
                    </div>
                  </div>

                  <!-- 8. Comment / Multi-line Text -->
                  <div
                    v-else-if="msg.question?.getType() === 'comment'"
                    class="space-y-2"
                  >
                    <textarea
                      ref="inputElRef"
                      v-model="inputText"
                      rows="3"
                      class="w-full rounded-xl border border-fb-border bg-fb-surface p-3 text-sm text-fb-fg focus:border-fb-accent focus:outline-none"
                      :placeholder="msg.question?.placeholder || t('commentPlaceholder')"
                      @keydown.enter.exact.prevent="submitTextAnswer"
                    />
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] text-fb-fg-muted">
                        Enter {{ t("send") }}
                      </span>
                      <button
                        type="button"
                        class="flex items-center gap-1.5 rounded-xl bg-fb-accent px-4 py-2 text-xs font-semibold text-fb-accent-on hover:opacity-90 shadow-xs cursor-pointer"
                        @click="submitTextAnswer"
                      >
                        <Send class="h-3.5 w-3.5" />
                        <span>{{ t("send") }}</span>
                      </button>
                    </div>
                  </div>

                  <!-- 9. HTML display question -->
                  <div
                    v-else-if="msg.question?.getType() === 'html'"
                    class="space-y-3"
                  >
                    <div
                      class="text-sm leading-relaxed text-fb-fg"
                      v-html="sanitize(msg.question?.html)"
                    />
                    <div class="flex justify-end pt-2">
                      <button
                        type="button"
                        class="flex items-center gap-1.5 rounded-xl bg-fb-accent px-4 py-2 text-xs font-semibold text-fb-accent-on hover:opacity-90 shadow-xs cursor-pointer"
                        @click="continueHtmlQuestion"
                      >
                        <span>{{ t("continue") }}</span>
                        <ChevronRight class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <!-- 10. Default / Single-line Text Input -->
                  <div v-else class="space-y-2">
                    <div class="flex gap-2">
                      <input
                        ref="inputElRef"
                        v-model="inputText"
                        :type="msg.question?.inputType || 'text'"
                        class="flex-1 rounded-xl border border-fb-border bg-fb-surface px-4 py-2.5 text-sm text-fb-fg focus:border-fb-accent focus:outline-none"
                        :placeholder="msg.question?.placeholder || t('placeholder')"
                        @keydown.enter.prevent="submitTextAnswer"
                      />
                      <button
                        type="button"
                        class="flex items-center justify-center rounded-xl bg-fb-accent px-4 text-fb-accent-on hover:opacity-90 shadow-xs transition-opacity cursor-pointer"
                        :title="t('send')"
                        @click="submitTextAnswer"
                      >
                        <Send class="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <!-- Skip Option for Optional Questions -->
                  <div
                    v-if="allowSkip && !msg.question?.isRequired"
                    class="flex items-center justify-between pt-1 text-xs text-fb-fg-muted"
                  >
                    <span>{{ t("optional") }}</span>
                    <button
                      type="button"
                      class="text-xs font-medium text-fb-fg-secondary hover:text-fb-accent transition-colors"
                      @click="skipQuestion"
                    >
                      {{ t("skip") }}
                    </button>
                  </div>

                  <!-- Validation Error Message -->
                  <div
                    v-if="currentError"
                    class="flex items-center gap-1.5 text-xs text-rose-500 font-medium pt-1"
                  >
                    <AlertCircle class="h-3.5 w-3.5 shrink-0" />
                    <span>{{ currentError }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- User Answer Message -->
          <div
            v-else-if="msg.sender === 'user'"
            class="flex items-start justify-end gap-3"
          >
            <div class="flex flex-col items-end max-w-md">
              <div
                class="rounded-2xl rounded-te-xs bg-fb-accent px-4 py-2.5 text-sm font-medium text-fb-accent-on shadow-xs"
              >
                {{ msg.displayValue }}
              </div>
              <span class="mt-1 text-[11px] text-fb-fg-muted">
                {{ userName || t("userName") }}
              </span>
            </div>

            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-fb-surface-muted text-fb-fg-secondary mt-0.5 border border-fb-border overflow-hidden"
            >
              <span v-if="userAvatar" class="text-sm leading-none select-none">{{ userAvatar }}</span>
              <User v-else class="h-4.5 w-4.5" />
            </div>
          </div>

          <!-- Completion Card -->
          <div
            v-else-if="msg.type === 'completion'"
            class="flex items-start gap-3"
          >
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-fb-accent text-fb-accent-on mt-0.5 shadow-xs overflow-hidden"
            >
              <span v-if="botAvatar" class="text-sm leading-none select-none">{{ botAvatar }}</span>
              <Bot v-else class="h-4.5 w-4.5" />
            </div>

            <div class="flex-1 min-w-0">
              <div
                class="rounded-2xl rounded-ts-xs border border-fb-border bg-fb-surface p-5 shadow-xs space-y-4"
              >
                <div class="flex items-center gap-2 text-fb-accent">
                  <Check class="h-5 w-5" />
                  <h3 class="text-base font-bold text-fb-fg">
                    {{ t("completedTitle") }}
                  </h3>
                </div>

                <div
                  v-if="survey.completedHtml"
                  class="text-sm text-fb-fg-secondary leading-relaxed"
                  v-html="sanitize(survey.completedHtml)"
                />
                <p v-else class="text-sm text-fb-fg-secondary leading-relaxed">
                  {{ t("completedText") }}
                </p>

                <!-- Result Template (if configured) -->
                <div
                  v-if="survey.resultTemplate"
                  class="pt-3 border-t border-fb-border"
                >
                  <RenderResult
                    :result="survey.data"
                    :survey="survey"
                    @restart="restart"
                  />
                </div>

                <!-- Submitted Data Summary -->
                <div class="pt-3 border-t border-fb-border space-y-2">
                  <h4 class="text-xs font-semibold text-fb-fg uppercase tracking-wider">
                    {{ t("submittedData") }}
                  </h4>
                  <div
                    class="rounded-xl bg-fb-surface-muted p-3 text-xs font-mono text-fb-fg max-h-48 overflow-y-auto"
                  >
                    <pre class="whitespace-pre-wrap">{{ JSON.stringify(survey.data, null, 2) }}</pre>
                  </div>
                </div>

                <!-- Restart Button -->
                <div v-if="allowRestart" class="flex justify-end pt-2">
                  <button
                    type="button"
                    class="flex items-center gap-1.5 rounded-xl border border-fb-border bg-fb-surface px-4 py-2 text-xs font-semibold text-fb-fg hover:bg-fb-surface-muted hover:border-fb-accent transition-all cursor-pointer"
                    @click="restart"
                  >
                    <RotateCcw class="h-3.5 w-3.5" />
                    <span>{{ t("restart") }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Typing Indicator -->
        <div v-if="isTyping" class="flex items-start gap-3">
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-fb-accent/15 text-fb-accent mt-0.5 overflow-hidden"
          >
            <span v-if="botAvatar" class="text-sm leading-none select-none">{{ botAvatar }}</span>
            <Bot v-else class="h-4.5 w-4.5" />
          </div>
          <div
            class="rounded-2xl rounded-ts-xs border border-fb-border bg-fb-surface-muted px-4 py-3 shadow-xs"
          >
            <div class="flex items-center gap-1.5">
              <span
                class="h-2 w-2 rounded-full bg-fb-fg-muted animate-bounce"
                style="animation-delay: 0ms"
              />
              <span
                class="h-2 w-2 rounded-full bg-fb-fg-muted animate-bounce"
                style="animation-delay: 150ms"
              />
              <span
                class="h-2 w-2 rounded-full bg-fb-fg-muted animate-bounce"
                style="animation-delay: 300ms"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
