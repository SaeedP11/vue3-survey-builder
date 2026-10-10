import surveyResultEditorEn from "./en/surveyResultEditor.json";
import recurringSurveyEn from "./en/recurringSurvey.json";
import surveyResultEn from "./en/surveyResult.json";
import generalEn from "./en/general.json";
import chartQuestionEn from "./en/chartQuestion.json";

import surveyResultEditorFa from "./fa/surveyResultEditor.json";
import recurringSurveyFa from "./fa/recurringSurvey.json";
import surveyResultFa from "./fa/surveyResult.json";
import generalFa from "./fa/general.json";
import chartQuestionFa from "./fa/chartQuestion.json";

export const general = {
  en: generalEn,
  fa: generalFa,
};

export const surveyResult = {
  en: {
    ...general.en,
    ...surveyResultEn,
  },
  fa: {
    ...general.fa,
    ...surveyResultFa,
  },
};

export const surveyResultEditor = {
  en: {
    ...surveyResult.en,
    ...surveyResultEditorEn,
  },
  fa: {
    ...surveyResult.fa,
    ...surveyResultEditorFa,
  },
};

export const recurringSurvey = {
  en: {
    ...general.en,
    ...recurringSurveyEn,
  },
  fa: {
    ...general.fa,
    ...recurringSurveyFa,
  },
};

export const chartQuestion = {
  en: chartQuestionEn,
  fa: chartQuestionFa,
};
