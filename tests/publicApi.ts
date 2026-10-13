/** The library's own public API, as the README documents it (beside survey-core's). */
export const OWN_EXPORTS = [
  "ChartItemValue",
  "FormBuilder",
  "QuestionChartModel",
  "SurveyComponent",
  "SurveyResultEditor",
  "SurveyResultEditorModal",
  "SurveySchemaPrompt",
  "provideAiAssistantConfig",
  "provideSurveyResultTemplate",
  "registerAdvancedTextInput",
  "registerAsyncDropdown",
  "registerCustomLogic",
  "useScrollToError",
  "useSurveyAiAssistantConfig",
  "useSurveyCreator",
  "useSurveyModel",
  "useSurveyResultTemplate",
].sort();

/** What `vue3-survey-builder/runtime` adds to survey-core's exports: rendering a survey, no designer. */
export const RUNTIME_EXPORTS = [
  "ChartItemValue",
  "QuestionChartModel",
  "SurveyComponent",
  "useScrollToError",
  "useSurveyModel",
].sort();
