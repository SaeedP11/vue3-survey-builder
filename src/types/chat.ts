import type { Question } from "survey-core";
import type { Component } from "vue";

export type MessageSender = "bot" | "user" | "system";

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  timestamp: number;
  text?: string;
  questionName?: string;
  questionType?: string;
  value?: unknown;
  renderedDisplayValue?: string;
  canEdit?: boolean;
}

export interface ChatBotPersona {
  name?: string;
  avatarUrl?: string;
  greeting?: string;
  typingSpeedMs?: number;
}

export interface SurveyChatOptions {
  persona?: ChatBotPersona;
  autoAdvanceOnSelect?: boolean;
  allowEditPastAnswers?: boolean;
  persistKey?: string;
}

export type ChatPlacement = "inline" | "bottom-bar" | "modal";

export interface ChatQuestionComponentProps<T extends Question = Question> {
  question: T;
  isInline?: boolean;
}

export interface ChatQuestionRegistration {
  component: Component;
  placement: ChatPlacement;
  formatHistoryDisplay?: (value: unknown, question: Question) => string;
}
