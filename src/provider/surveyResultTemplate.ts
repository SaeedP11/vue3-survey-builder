import { inject } from "vue";
import type { TemplateDefinition } from "../types/index.ts";
import { surveyResultTemplate } from "../schemas/templates.ts";
import {
  SURVEY_RESULT_TEMPLATE_KEY,
  provideSurveyResultTemplate,
} from "./surveyResultTemplateKey.ts";

export { provideSurveyResultTemplate };

export function useSurveyResultTemplate(): TemplateDefinition {
  return inject(SURVEY_RESULT_TEMPLATE_KEY, surveyResultTemplate);
}
