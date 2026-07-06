import { inject, provide, type InjectionKey } from "vue";
import type { TemplateDefinition } from "../types/index.ts";
import { surveyResultTemplate } from "../schemas/templates.ts";

const KEY: InjectionKey<TemplateDefinition<any>> = Symbol("surveyResultTemplate");

export function provideSurveyResultTemplate(def: TemplateDefinition): void {
  provide(KEY, def);
}

export function useSurveyResultTemplate(): TemplateDefinition {
  return inject(KEY, surveyResultTemplate);
}