import type { SurveyResultProps, TemplateDefinition } from "../types/index.ts";
import SurveyResultEditor from "../components/SurveyResultEditor.vue";
import SurveyResult from "../components/templates/SurveyResult.vue";
import { surveyResult } from "../locales/index.ts";
import { legacyActions } from "../utils/resultContent.ts";
import { defaultLayout, resolveLayout } from "../utils/resultLayout.ts";

type DefaultProps = Required<
  Omit<SurveyResultProps, "primaryLabel" | "secondaryLabel" | "closeLabel">
>;

/** The copy for `locale`'s language, English when there is none. */
export function resultCopy(locale: string) {
  const lang = locale.split("-")[0] as keyof typeof surveyResult;
  return surveyResult[lang] ?? surveyResult.en;
}

/** Starting values for a new result template, with the copy in `locale`. */
export function getDefaultProps(locale: string): DefaultProps {
  const copy = resultCopy(locale);

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
    images: [],
    layout: defaultLayout(),
    actions: [
      {
        id: "primary",
        type: "custom",
        variant: "primary",
        icon: "calendar",
        label: copy.primaryLabel,
      },
      {
        id: "print",
        type: "print",
        variant: "secondary",
        icon: "download",
        label: copy.secondaryLabel,
      },
      {
        id: "close",
        type: "close",
        variant: "text",
        icon: "none",
        label: copy.close,
      },
    ],
    statusLabels: [...copy.statusLabels],
  };
}

/**
  * A stored template ready to edit: the defaults under it, a template from
 * before `actions` with its labels turned into buttons and the labels dropped,
 * and its layout (or the standard one) cleaned up.
 */
export function editableProps(
  stored: SurveyResultProps | undefined,
  locale: string,
): SurveyResultProps {
  const { primaryLabel, secondaryLabel, closeLabel, ...rest } = stored ?? {};
  const merged: SurveyResultProps = { ...getDefaultProps(locale), ...rest };
  if (stored && !Array.isArray(stored.actions)) {
    merged.actions = legacyActions(
      { primaryLabel, secondaryLabel, closeLabel },
      resultCopy(locale),
    );
  }
  merged.layout = resolveLayout(stored?.layout);
  return merged;
}

export const surveyResultTemplate: TemplateDefinition<SurveyResultProps> = {
  id: "survey-result",
  name: "Assessment Result",
  component: SurveyResult,
  editor: SurveyResultEditor,
};
