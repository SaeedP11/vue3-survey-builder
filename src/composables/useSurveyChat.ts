import { ref, computed, nextTick, shallowRef, type Ref } from "vue";
import { Model, type Question, type SurveyModel } from "survey-core";
import type { ChatMessage, SurveyChatOptions } from "../types/chat";
import { chatQuestionRegistry } from "../components/chat/registry";

export function useSurveyChat(
  surveyInput: SurveyModel | Ref<SurveyModel> | object,
  options: SurveyChatOptions = {},
  externalScrollContainerRef?: Ref<HTMLElement | null>,
) {
  const surveyModel = computed<SurveyModel>(() => {
    const raw = "value" in surveyInput ? surveyInput.value : surveyInput;
    if (raw instanceof Model) {
      return raw;
    }
    return new Model(raw);
  });

  const messages = ref<ChatMessage[]>([]);
  const activeQuestion = shallowRef<Question | null>(null);
  const isTyping = ref<boolean>(false);
  const isCompleted = ref<boolean>(false);
  const scrollContainerRef = externalScrollContainerRef || ref<HTMLElement | null>(null);
  const errorMessage = ref<string | null>(null);

  // Restore persistence if requested
  if (options.persistKey && typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(options.persistKey);
      if (saved) {
        surveyModel.value.data = JSON.parse(saved);
      }
    } catch {
      // Ignore localStorage parse errors
    }
  }

  function scrollToBottom() {
    nextTick(() => {
      if (scrollContainerRef.value) {
        scrollContainerRef.value.scrollTop = scrollContainerRef.value.scrollHeight;
      }
    });
  }

  async function pushBotMessage(text: string): Promise<void> {
    const delay = options.persona?.typingSpeedMs ?? 300;
    if (delay > 0) {
      isTyping.value = true;
      scrollToBottom();
      await new Promise((resolve) => setTimeout(resolve, delay));
      isTyping.value = false;
    }

    messages.value.push({
      id: `bot-msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sender: "bot",
      timestamp: Date.now(),
      text,
    });
    scrollToBottom();
  }

  async function pushBotQuestion(question: Question): Promise<void> {
    const delay = options.persona?.typingSpeedMs ?? 300;
    if (delay > 0) {
      isTyping.value = true;
      scrollToBottom();
      await new Promise((resolve) => setTimeout(resolve, delay));
      isTyping.value = false;
    }

    const questionTitle = question.locTitle?.renderedHtml || question.title || question.name;
    const questionDescription = question.locDescription?.renderedHtml || question.description;

    messages.value.push({
      id: `bot-q-${question.name}-${Date.now()}`,
      sender: "bot",
      timestamp: Date.now(),
      text: questionTitle,
      questionName: question.name,
      questionType: question.getType(),
    });

    if (questionDescription) {
      messages.value.push({
        id: `bot-desc-${question.name}-${Date.now()}`,
        sender: "bot",
        timestamp: Date.now(),
        text: questionDescription,
      });
    }

    activeQuestion.value = question;
    scrollToBottom();
  }

  function advanceToNextQuestion(): void {
    if (isCompleted.value) return;

    // Get all currently visible questions based on expressions & visibleIf
    const visibleQuestions = surveyModel.value.getAllQuestions(true);

    // Find the answered questions so far in the chat
    const answeredNames = new Set(
      messages.value
        .filter((m) => m.sender === "user" && m.questionName)
        .map((m) => m.questionName!),
    );

    // Locate the first unanswered visible question
    const nextQ = visibleQuestions.find((q) => !answeredNames.has(q.name));

    if (nextQ) {
      pushBotQuestion(nextQ);
    } else {
      finishSurvey();
    }
  }

  async function submitAnswer(question: Question, value: unknown): Promise<boolean> {
    errorMessage.value = null;

    // Set and validate
    question.value = value;
    surveyModel.value.setValue(question.name, value);

    if (question.hasErrors(true)) {
      const err = question.errors[0]?.text || "Invalid answer";
      errorMessage.value = err;
      scrollToBottom();
      return false;
    }

    // Persist if enabled
    if (options.persistKey && typeof window !== "undefined") {
      try {
        localStorage.setItem(options.persistKey, JSON.stringify(surveyModel.value.data));
      } catch {
        // Ignore quota errors
      }
    }

    // Add user message bubble
    const displayVal = chatQuestionRegistry.formatValue(value, question);
    messages.value.push({
      id: `user-ans-${question.name}-${Date.now()}`,
      sender: "user",
      timestamp: Date.now(),
      value,
      renderedDisplayValue: displayVal,
      questionName: question.name,
      questionType: question.getType(),
      canEdit: options.allowEditPastAnswers ?? true,
    });

    activeQuestion.value = null;
    scrollToBottom();

    // Advance
    advanceToNextQuestion();
    return true;
  }

  function editAnswer(targetMessageIndex: number): void {
    if (options.allowEditPastAnswers === false) return;

    const targetMsg = messages.value[targetMessageIndex];
    if (!targetMsg || targetMsg.sender !== "user" || !targetMsg.questionName) return;

    const question = surveyModel.value.getQuestionByName(targetMsg.questionName);
    if (!question) return;

    // Truncate message stream from the question's prompt onwards
    // Find the bot message that introduced this question
    const botMsgIndex = messages.value.findIndex(
      (m) => m.sender === "bot" && m.questionName === targetMsg.questionName,
    );

    const cutIndex = botMsgIndex !== -1 ? botMsgIndex : targetMessageIndex;
    messages.value = messages.value.slice(0, cutIndex);

    // Clear saved value from survey model so dependencies update
    question.value = undefined;
    surveyModel.value.clearValue(question.name);

    // Re-present this question
    pushBotQuestion(question);
  }

  function finishSurvey(): void {
    if (isCompleted.value) return;
    isCompleted.value = true;
    activeQuestion.value = null;

    surveyModel.value.completeLastPage();

    if (options.persistKey && typeof window !== "undefined") {
      try {
        localStorage.removeItem(options.persistKey);
      } catch {
        // Ignore
      }
    }

    const completedText = surveyModel.value.completedHtml;
    if (completedText) {
      pushBotMessage(completedText);
    }
  }

  function start(): void {
    messages.value = [];
    isCompleted.value = false;
    activeQuestion.value = null;
    errorMessage.value = null;

    if (options.persona?.greeting) {
      pushBotMessage(options.persona.greeting).then(() => {
        advanceToNextQuestion();
      });
    } else {
      advanceToNextQuestion();
    }
  }

  function restart(): void {
    surveyModel.value.clear();
    start();
  }

  return {
    survey: surveyModel,
    messages,
    activeQuestion,
    isTyping,
    isCompleted,
    errorMessage,
    scrollContainerRef,
    start,
    restart,
    submitAnswer,
    editAnswer,
    scrollToBottom,
  };
}
