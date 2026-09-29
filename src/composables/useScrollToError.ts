import type { SurveyModel } from "survey-core";

export default function useScrollToError(survey: SurveyModel) {
  // Raised once per page validation, with the invalid questions in page order.
  survey.onValidatedErrorsOnCurrentPage.add((_, options) => {
    options.questions[0]?.getWrapperElement()?.scrollIntoView();
  });
}
