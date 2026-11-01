import { provide, type InjectionKey } from "vue";
import type { TemplateDefinition } from "../types/index.ts";

export const SURVEY_RESULT_TEMPLATE_KEY: InjectionKey<TemplateDefinition<any>> =
  Symbol("surveyResultTemplate");

export function provideSurveyResultTemplate(def: TemplateDefinition): void {
  provide(SURVEY_RESULT_TEMPLATE_KEY, def);
}
