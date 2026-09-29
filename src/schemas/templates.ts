import type { SurveyResultProps, TemplateDefinition } from "../types/index.ts";
import SurveyResultEditor from "../components/SurveyResultEditor.vue";
import SurveyResult from "../components/templates/SurveyResult.vue";
import { surveyResult } from "../locales/index.ts";

/** Starting values for a new result template, with the copy in `locale`. */
export function getDefaultProps(locale: string): Required<SurveyResultProps> {
  const lang = locale.split("-")[0] as keyof typeof surveyResult;
  const copy = surveyResult[lang] ?? surveyResult.en;

  return {
    score: "",
    min: 0,
    max: 100,
    scoreDisplay: "default",
    tableRows: [],
    logoSrc: "",
    brandName: copy.brandName,
    brandTagline: copy.brandTagline,
    categoryChip: copy.categoryChip,
    title: copy.title,
    subtitle: copy.subtitle,
    description: copy.description,
    noteText: copy.noteText,
    primaryLabel: copy.primaryLabel,
    secondaryLabel: copy.secondaryLabel,
    closeLabel: copy.close,
    statusLabels: [...copy.statusLabels],
  };
}

export const surveyResultTemplate: TemplateDefinition<SurveyResultProps> = {
  id: "survey-result",
  name: "Assessment Result",
  component: SurveyResult,
  editor: SurveyResultEditor,
};
