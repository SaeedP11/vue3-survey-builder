import { inject, provide, type InjectionKey } from "vue";
import type { RecurringSurveyHandlers } from "../types";

const RECURRING_SURVEY_HELPERS: InjectionKey<RecurringSurveyHandlers | null> =
  Symbol("recurring_survey_helpers");

export function provideRecurringSurveyHelpers(
  handlers: RecurringSurveyHandlers,
) {
  provide(RECURRING_SURVEY_HELPERS, handlers);
}

export function useRecurringSurveyHelpers() {
  const helpers = inject(RECURRING_SURVEY_HELPERS);

  if (!helpers) {
    throw new Error(
      "useRecurringSurveyTable() called without provideRecurringSurveyTable() in an ancestor",
    );
  }

  return helpers;
}
