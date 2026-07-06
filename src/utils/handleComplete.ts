import type { SurveyModel } from "survey-core";
import type { SurveyCreatorModel } from "survey-creator-core";

export default function handleComplete(
  creator: SurveyCreatorModel,
  callback: (sender: SurveyModel) => void,
) {
  creator.onSurveyInstanceCreated.add((_, options) => {
    const survey = options.survey;
    survey.onComplete.add((sender) => {
      callback(sender);
    });
  });
}
