/**
 * The respondent's entry, `vue3-survey-builder/runtime`: what showing and
 * filling in a survey needs, without the designer. The full entry pulls in
 * survey-creator-core and its stylesheet (~450 KB and ~120 KB brotli), which a
 * page that only renders a survey never uses. Its styles are
 * `vue3-survey-builder/runtime.css`.
 *
 * Both entries share one copy of the chart question, so an app that imports
 * both registers it once.
 */
import registerChartQuestion from "./utils/registerChartQuestion";
import useScrollToError from "./composables/useScrollToError";
import "./utils/surveyProperties";

registerChartQuestion();

import "survey-core/survey-core.css";
// The host's --color-formbilder-* variables, mapped onto SurveyJS's.
import "./styles/sv-creator-bridge.css";

export { SurveyComponent } from "survey-vue3-ui";
export * from "./composables/useSurveyModel.ts";
export * from "survey-core";

export {
  ChartItemValue,
  QuestionChartModel,
  type ChartType,
} from "./utils/registerChartQuestion";

export { useScrollToError };
