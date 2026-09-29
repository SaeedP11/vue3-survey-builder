import { inject, provide, type InjectionKey } from "vue";
import type { SurveyAiAssitantConfig } from "../types";

const SURVEY_AI_ASSISTANT: InjectionKey<SurveyAiAssitantConfig> = Symbol(
  "survey_ai_assistant_config",
);

const DEFAULT_AI_ASSISTANT_CONFIG: SurveyAiAssitantConfig = {
  onSubmit: () => {
    console.warn(
      "useSurveyAiAssistantConfig(): no provideAiAssistantConfig() in an ancestor — leaving the form unchanged.",
    );
    return undefined;
  },
};

export function provideAiAssistantConfig(config: SurveyAiAssitantConfig) {
  provide(SURVEY_AI_ASSISTANT, config);
}

export function useSurveyAiAssistantConfig() {
  return inject(SURVEY_AI_ASSISTANT, DEFAULT_AI_ASSISTANT_CONFIG);
}
