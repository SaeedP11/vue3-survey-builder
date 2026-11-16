import type { Question } from "survey-core";
import type { ChatQuestionRegistration } from "../../types/chat";

export class ChatQuestionRegistry {
  private registry = new Map<string, ChatQuestionRegistration>();

  register(type: string, registration: ChatQuestionRegistration): void {
    this.registry.set(type.toLowerCase(), registration);
  }

  get(type: string): ChatQuestionRegistration | undefined {
    return this.registry.get(type.toLowerCase());
  }

  has(type: string): boolean {
    return this.registry.has(type.toLowerCase());
  }

  formatValue(value: unknown, question: Question): string {
    const reg = this.get(question.getType());
    if (reg?.formatHistoryDisplay) {
      return reg.formatHistoryDisplay(value, question);
    }
    if (value === null || value === undefined || value === "") {
      return "";
    }
    if (typeof value === "object") {
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      return JSON.stringify(value);
    }
    return String(question.displayValue || value);
  }
}

export const chatQuestionRegistry = new ChatQuestionRegistry();
